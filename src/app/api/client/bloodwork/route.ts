// POST /api/client/bloodwork
//
// Unified Coaching Hub — Phase 3. Bloodwork upload + parse. Accepts multipart:
//   file?        the lab PDF/image (stored for the record)
//   labName?     lab name
//   testDate?    YYYY-MM-DD
//   rawText?     pasted lab values (parsed into markers via OpenAI)
// Markers' out-of-range flags are derived deterministically. Pure-file uploads
// with no text are stored as parseStatus 'pending' for manual coach entry.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { rateLimit, type RateLimitConfig } from '@/lib/rate-limit';
import { saveFile } from '@/lib/storage';
import { parseBloodworkText, outOfRangeCount } from '@/lib/bloodwork-parser';
import { sendCoachAlertEmail } from '@/lib/email';

const LIMIT: RateLimitConfig = { windowMs: 60 * 60 * 1000, maxAttempts: 10 };
const MAX_BYTES = 15 * 1024 * 1024; // 15MB

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const userId = session.user.id;

    const link = await prisma.appLink.findFirst({
      where: { userId, verifiedAt: { not: null } },
      select: { isEnhanced: true, appUserId: true },
    });
    if (!link) return NextResponse.json({ error: 'Link your app account first.' }, { status: 403 });
    if (!link.isEnhanced) {
      return NextResponse.json({ error: 'Bloodwork upload is not enabled on your account.' }, { status: 403 });
    }

    const { success: rlOk } = rateLimit(`client-blood:${userId}`, LIMIT);
    if (!rlOk) return NextResponse.json({ error: 'Too many uploads. Try again shortly.' }, { status: 429 });

    const form = await request.formData();
    const file = form.get('file');
    const labName = (form.get('labName') as string | null)?.trim() || null;
    const testDateStr = (form.get('testDate') as string | null)?.trim() || null;
    const rawText = (form.get('rawText') as string | null)?.trim() || '';

    if (!file && !rawText) {
      return NextResponse.json({ error: 'Upload a file or paste your lab values.' }, { status: 400 });
    }

    let filePath: string | null = null;
    if (file && typeof file !== 'string') {
      const blob = file as File;
      if (blob.size > MAX_BYTES) {
        return NextResponse.json({ error: 'File too large (max 15MB).' }, { status: 400 });
      }
      const buf = Buffer.from(await blob.arrayBuffer());
      const safeName = blob.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-80);
      // Date.now used in a route handler is fine (not a workflow). Unique-ish path.
      filePath = await saveFile(`bloodwork/${userId}/${Date.now()}_${safeName}`, buf);
    }

    let markers = null;
    let oorCount = 0;
    let parseStatus: 'parsed' | 'failed' | 'pending' = filePath && !rawText ? 'pending' : 'parsed';

    if (rawText) {
      try {
        const parsed = await parseBloodworkText(rawText);
        markers = parsed;
        oorCount = outOfRangeCount(parsed);
        parseStatus = parsed.length ? 'parsed' : 'failed';
      } catch (e) {
        console.error('[client/bloodwork] parse failed', e);
        parseStatus = 'failed';
      }
    }

    const testDate = testDateStr ? new Date(testDateStr) : null;

    // Plain-JSON round-trip so the typed BloodMarker[] satisfies Prisma's Json input.
    const markersJson = markers ? JSON.parse(JSON.stringify(markers)) : undefined;

    const saved = await prisma.bloodworkUpload.create({
      data: {
        userId,
        labName,
        testDate: testDate && !Number.isNaN(testDate.getTime()) ? testDate : null,
        filePath,
        parsedMarkers: markersJson,
        outOfRangeCount: oorCount,
        parseStatus,
      },
    });

    try {
      const base = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? '';
      const detail = parseStatus === 'parsed' ? `uploaded bloodwork (${oorCount} out of range)` : 'uploaded bloodwork';
      await sendCoachAlertEmail(session.user.name || 'A client', detail, `${base}/coach/hub/${link.appUserId}`);
    } catch (e) {
      console.error('[client/bloodwork] coach alert failed', e);
    }

    return NextResponse.json({ success: true, id: saved.id, parseStatus, outOfRangeCount: oorCount });
  } catch (err) {
    console.error('[client/bloodwork] failed', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
