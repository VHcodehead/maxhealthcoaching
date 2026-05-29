// POST /api/app-link/request
//
// Unified Coaching Hub — Phase 0 (ADR 008).
// Step 1 of the email-code identity link: the signed-in maxhealthcoaching.com
// user claims their MyPocketCoach app email. We resolve it to a Supabase
// user_id via the read bridge, then email a 6-digit code to that address to
// prove the client controls the inbox.

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit, type RateLimitConfig } from '@/lib/rate-limit';
import { resolveAppUser, CoachingBridgeError } from '@/lib/coaching-bridge';
import { sendAppLinkCodeEmail } from '@/lib/email';

const RequestSchema = z.object({ appEmail: z.string().email() });

// 5 requests / 15 min per user — generous enough for typos, tight enough to
// stop someone hammering the resolve bridge.
const APP_LINK_REQUEST_LIMIT: RateLimitConfig = {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
};

const CODE_TTL_MS = 15 * 60 * 1000; // 15 minutes

function sixDigitCode(): string {
  // 000000–999999, uniformly random, zero-padded.
  return crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
}

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

    // Already linked? Nothing to do.
    const existing = await prisma.appLink.findUnique({ where: { userId } });
    if (existing) {
      return NextResponse.json(
        { error: 'Your app account is already linked.' },
        { status: 409 },
      );
    }

    const { success: rlOk } = rateLimit(`app-link-request:${userId}`, APP_LINK_REQUEST_LIMIT);
    if (!rlOk) {
      return NextResponse.json(
        { error: 'Too many attempts. Please wait a few minutes and try again.' },
        { status: 429 },
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'A valid email is required.' }, { status: 400 });
    }
    const appEmail = parsed.data.appEmail.trim().toLowerCase();

    // Resolve the email against the app's user store via the read bridge.
    let resolved;
    try {
      resolved = await resolveAppUser(appEmail);
    } catch (err) {
      if (err instanceof CoachingBridgeError) {
        return NextResponse.json(
          { error: 'Account linking is temporarily unavailable. Please try again shortly.' },
          { status: 503 },
        );
      }
      throw err;
    }

    if (!resolved) {
      return NextResponse.json(
        { error: 'No MyPocketCoach account found with that email. Use the email you signed up with in the app.' },
        { status: 404 },
      );
    }

    // Guard: this app account must not already be linked to a DIFFERENT
    // training-website user.
    const claimed = await prisma.appLink.findFirst({
      where: { appUserId: resolved.appUserId },
      select: { userId: true },
    });
    if (claimed && claimed.userId !== userId) {
      return NextResponse.json(
        { error: 'That app account is already linked to another profile. Contact your coach.' },
        { status: 409 },
      );
    }

    const code = sixDigitCode();

    // Replace any prior pending challenges for this user, then store the new one.
    await prisma.$transaction([
      prisma.appLinkVerification.deleteMany({ where: { userId } }),
      prisma.appLinkVerification.create({
        data: {
          userId,
          appUserId: resolved.appUserId,
          appEmail,
          hashedCode: hashCode(code),
          expiresAt: new Date(Date.now() + CODE_TTL_MS),
        },
      }),
    ]);

    await sendAppLinkCodeEmail(appEmail, resolved.name ?? session.user.name ?? '', code);

    return NextResponse.json({
      success: true,
      message: 'We sent a 6-digit code to your app email. Enter it to finish linking.',
    });
  } catch (err) {
    console.error('[app-link/request] failed', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
