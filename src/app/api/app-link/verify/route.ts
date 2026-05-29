// POST /api/app-link/verify
//
// Unified Coaching Hub — Phase 0 (ADR 008).
// Step 2 of the email-code identity link: the user submits the 6-digit code
// from their app-account email. On match we persist the AppLink mapping
// (training-website user ↔ Supabase app user_id) and clear the challenge.

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit, type RateLimitConfig } from '@/lib/rate-limit';

const VerifySchema = z.object({ code: z.string().regex(/^\d{6}$/, '6-digit code required') });

const APP_LINK_VERIFY_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 10,
};

const MAX_CODE_ATTEMPTS = 5;

function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const existing = await prisma.appLink.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json({ success: true, message: 'Already linked.', alreadyLinked: true });
    }

    const { success: rlOk } = rateLimit(`app-link-verify:${userId}`, APP_LINK_VERIFY_LIMIT);
    if (!rlOk) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a few minutes and try again.' },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = VerifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter the 6-digit code.' }, { status: 400 });
    }

    const challenge = await prisma.appLinkVerification.findFirst({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!challenge) {
      return NextResponse.json(
        { error: 'Your code expired or was not found. Request a new one.' },
        { status: 400 },
      );
    }

    // Burn an attempt up front; lock the challenge out after too many tries.
    if (challenge.attempts >= MAX_CODE_ATTEMPTS) {
      await prisma.appLinkVerification.deleteMany({ where: { userId } });
      return NextResponse.json(
        { error: 'Too many incorrect codes. Request a new one.' },
        { status: 429 },
      );
    }

    const matches = hashCode(parsed.data.code) === challenge.hashedCode;
    if (!matches) {
      await prisma.appLinkVerification.update({
        where: { id: challenge.id },
        data: { attempts: { increment: 1 } },
      });
      const remaining = MAX_CODE_ATTEMPTS - (challenge.attempts + 1);
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `That code is incorrect. ${remaining} attempt${remaining === 1 ? '' : 's'} left.`
              : 'That code is incorrect. Request a new one.',
        },
        { status: 400 },
      );
    }

    // Success — persist the link and clear all challenges for this user.
    await prisma.$transaction([
      prisma.appLink.create({
        data: {
          userId,
          appUserId: challenge.appUserId,
          appEmail: challenge.appEmail,
          method: 'email_code',
          verifiedAt: new Date(),
        },
      }),
      prisma.appLinkVerification.deleteMany({ where: { userId } }),
    ]);

    return NextResponse.json({ success: true, message: 'Your app account is now linked.' });
  } catch (err) {
    console.error('[app-link/verify] failed', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
