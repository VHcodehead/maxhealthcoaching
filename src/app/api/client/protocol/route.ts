// POST/DELETE /api/client/protocol
//
// Unified Coaching Hub — Phase 3. Client reports the protocol items they're
// running (enhancement_protocols). Coach guidance is added separately and is
// portal-only. Gated by AppLink.isEnhanced.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const Schema = z.object({
  name: z.string().trim().min(1).max(120),
  category: z.enum(['compound', 'peptide', 'supplement']),
  dose: z.string().trim().max(60).optional().nullable(),
  doseUnit: z.string().trim().max(20).optional().nullable(),
  frequency: z.string().trim().max(60).optional().nullable(),
  timing: z.string().trim().max(120).optional().nullable(),
});

async function requireEnhancedUser() {
  const session = await auth();
  if (!session?.user) return { error: 'Unauthorized', status: 401 as const };
  const link = await prisma.appLink.findFirst({
    where: { userId: session.user.id, verifiedAt: { not: null } },
    select: { isEnhanced: true },
  });
  if (!link || !link.isEnhanced) return { error: 'Enhancement tracking is not enabled.', status: 403 as const };
  return { userId: session.user.id };
}

export async function POST(request: NextRequest) {
  const gate = await requireEnhancedUser();
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const body = await request.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid protocol item' }, { status: 400 });

  const item = await prisma.enhancementProtocol.create({
    data: { userId: gate.userId, clientReported: true, ...parsed.data },
  });
  return NextResponse.json({ success: true, id: item.id });
}

export async function DELETE(request: NextRequest) {
  const gate = await requireEnhancedUser();
  if ('error' in gate) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  // Only the owner may delete, and only client-reported items.
  await prisma.enhancementProtocol.deleteMany({
    where: { id, userId: gate.userId, clientReported: true },
  });
  return NextResponse.json({ success: true });
}
