// POST /api/coach/response
//
// Unified Coaching Hub — Phase 4. Coach posts a weekly response to a client,
// routed to where they should act (app | portal | enhancement). Creating one
// marks the week reviewed and emails the client. Coach-gated.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendClientFeedbackEmail } from '@/lib/email';

const Schema = z.object({
  appUserId: z.string().uuid(),
  body: z.string().trim().min(1).max(5000),
  route: z.enum(['app', 'portal', 'enhancement']).default('portal'),
});

function currentWeekOf(): Date {
  const now = new Date();
  const diffToMonday = (now.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const parsed = Schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid response' }, { status: 400 });
    const { appUserId, body, route } = parsed.data;

    const link = await prisma.appLink.findFirst({
      where: { appUserId, verifiedAt: { not: null } },
      select: { userId: true, user: { select: { email: true, profile: { select: { fullName: true } } } } },
    });
    if (!link) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const saved = await prisma.coachResponse.create({
      data: { userId: link.userId, weekOf: currentWeekOf(), body, route, reviewed: true },
    });

    // Notify the client (best-effort — never fail the request on email).
    const portalUrl = `${process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''}/client`;
    try {
      if (link.user?.email) {
        await sendClientFeedbackEmail(link.user.email, link.user.profile?.fullName || 'there', portalUrl);
      }
    } catch (e) {
      console.error('[coach/response] email failed', e);
    }

    return NextResponse.json({ success: true, id: saved.id });
  } catch (err) {
    console.error('[coach/response] failed', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
