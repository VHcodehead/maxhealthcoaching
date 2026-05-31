// POST /api/client/checkin
//
// Unified Coaching Hub — Phase 2. Persists a deep weekly check-in
// (prep_checkins) for the signed-in, app-linked client. Upserts on
// (userId, weekOf) so re-submitting the same week edits rather than duplicates.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit, type RateLimitConfig } from '@/lib/rate-limit';
import { sendCoachAlertEmail } from '@/lib/email';

const CHECKIN_LIMIT: RateLimitConfig = { windowMs: 60 * 60 * 1000, maxAttempts: 20 };

// All fields optional — the wizard submits a progressive payload.
const num = z.coerce.number().finite().optional().nullable();
const int = z.coerce.number().int().optional().nullable();
const str = z.string().trim().max(2000).optional().nullable();

const CheckinSchema = z.object({
  weight: num,
  waistCircumference: num,
  caliperSites: str,
  avgSteps: int,
  sleepDeclined: z.boolean().optional().nullable(),
  sleepDeclinedWhy: str,
  avgRestingHR: int,
  stress: int,
  energyMotivation: int,
  untrackedMeals: str,
  hunger: int,
  digestionIssues: str,
  fastedGlucose: num,
  fastedBP: str,
  strengthTrend: str,
  exerciseIssues: str,
  cardioCompleted: z.boolean().optional().nullable(),
  menstrualStatus: str,
  win: str,
  didntGoWell: str,
  otherInfo: str,
});

/** Monday 00:00 UTC of the current week, as a date-only value. */
function currentWeekOf(): Date {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = (day + 6) % 7;
  const monday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - diffToMonday));
  return monday;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;

    const link = await prisma.appLink.findFirst({
      where: { userId, verifiedAt: { not: null } },
      select: { id: true, appUserId: true },
    });
    if (!link) {
      return NextResponse.json(
        { error: 'Link your app account before checking in.' },
        { status: 403 },
      );
    }

    const { success: rlOk } = rateLimit(`client-checkin:${userId}`, CHECKIN_LIMIT);
    if (!rlOk) {
      return NextResponse.json({ error: 'Too many submissions. Try again shortly.' }, { status: 429 });
    }

    const body = await request.json().catch(() => null);
    const parsed = CheckinSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid check-in data', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const weekOf = currentWeekOf();
    const data = parsed.data;

    const saved = await prisma.prepCheckin.upsert({
      where: { userId_weekOf: { userId, weekOf } },
      update: { ...data },
      create: { userId, weekOf, ...data },
    });

    // Notify the coach (best-effort).
    try {
      const base = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
      await sendCoachAlertEmail(session.user.name || 'A client', 'submitted a weekly check-in', `${base}/coach/hub/${link.appUserId}`);
    } catch (e) {
      console.error('[client/checkin] coach alert failed', e);
    }

    return NextResponse.json({ success: true, id: saved.id, weekOf });
  } catch (err) {
    console.error('[client/checkin] failed', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
