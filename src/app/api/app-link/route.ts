// GET /api/app-link
//
// Unified Coaching Hub — Phase 0 (ADR 008).
// Returns the current MyPocketCoach app-link status for the signed-in user.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const link = await prisma.appLink.findUnique({
    where: { userId: session.user.id },
    select: {
      appUserId: true,
      appEmail: true,
      verifiedAt: true,
      method: true,
      isPrep: true,
      isEnhanced: true,
      sex: true,
    },
  });

  if (!link) {
    return NextResponse.json({ linked: false });
  }

  return NextResponse.json({
    linked: true,
    appUserId: link.appUserId,
    appEmail: link.appEmail,
    verifiedAt: link.verifiedAt,
    method: link.method,
    flags: { isPrep: link.isPrep, isEnhanced: link.isEnhanced, sex: link.sex },
  });
}
