// POST /api/coach/push/training/[templateId] — coach-gated proxy to write-back.
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { pushTraining, CoachingBridgeError } from '@/lib/coaching-bridge';

export async function POST(request: NextRequest, ctx: { params: Promise<{ templateId: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.user.role !== 'coach') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { templateId } = await ctx.params;
  const tid = Number(templateId);
  if (!Number.isFinite(tid)) return NextResponse.json({ error: 'Invalid templateId' }, { status: 400 });

  const body = await request.json().catch(() => null);
  const appUserId = body?.appUserId;
  if (!appUserId) return NextResponse.json({ error: 'appUserId required' }, { status: 400 });

  const link = await prisma.appLink.findFirst({ where: { appUserId, verifiedAt: { not: null } }, select: { id: true } });
  if (!link) return NextResponse.json({ error: 'Client not linked' }, { status: 404 });

  try {
    const data = await pushTraining(tid, body);
    return NextResponse.json({ success: true, data });
  } catch (err) {
    const msg = err instanceof CoachingBridgeError ? err.message : 'Push failed';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
