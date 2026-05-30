// POST /api/client/enhancement
//
// Unified Coaching Hub — Phase 3. Weekly enhancement side-effect scan (sex-aware).
// Upserts enhancement_checkins per (user, week). Gated by AppLink.isEnhanced.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit, type RateLimitConfig } from '@/lib/rate-limit';

const LIMIT: RateLimitConfig = { windowMs: 60 * 60 * 1000, maxAttempts: 20 };

const cat = z.enum(['none', 'mild', 'notable']).optional().nullable();
const bool = z.boolean().optional().nullable();
const int = z.coerce.number().int().optional().nullable();
const num = z.coerce.number().finite().optional().nullable();
const str = z.string().trim().max(2000).optional().nullable();

const Schema = z.object({
  nippleSensitivity: cat, waterRetention: cat, moodSwings: cat,
  acne: cat, hairShedding: cat, oilySkin: cat, aggression: cat,
  fastedBP: str, restingHR: int, limbSwelling: cat, shortnessOfBreath: bool,
  nausea: bool, appetiteDrop: bool, darkUrine: bool, ruqDiscomfort: bool, lethargy: bool,
  fastedGlucose: num, excessiveThirst: bool,
  siteSoreness: cat, siteRedness: bool, siteLumps: bool, fever: bool,
  libido: int, mood: int, anxiety: cat, sleepQuality: str, nightSweats: bool,
  voiceChanges: bool, hairGrowth: bool, cycleDisruption: bool, clitoralChanges: bool,
  anythingOff: str,
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
    const userId = session.user.id;

    const link = await prisma.appLink.findFirst({
      where: { userId, verifiedAt: { not: null } },
      select: { isEnhanced: true },
    });
    if (!link) return NextResponse.json({ error: 'Link your app account first.' }, { status: 403 });
    if (!link.isEnhanced) {
      return NextResponse.json({ error: 'Enhancement tracking is not enabled on your account.' }, { status: 403 });
    }

    const { success: rlOk } = rateLimit(`client-enh:${userId}`, LIMIT);
    if (!rlOk) return NextResponse.json({ error: 'Too many submissions. Try again shortly.' }, { status: 429 });

    const body = await request.json().catch(() => null);
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid scan data', details: parsed.error.flatten() }, { status: 400 });
    }

    const weekOf = currentWeekOf();
    const saved = await prisma.enhancementCheckin.upsert({
      where: { userId_weekOf: { userId, weekOf } },
      update: { ...parsed.data },
      create: { userId, weekOf, ...parsed.data },
    });

    return NextResponse.json({ success: true, id: saved.id });
  } catch (err) {
    console.error('[client/enhancement] failed', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
