import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (status) where.status = status;

    const adjustments = await prisma.pendingMacroAdjustment.findMany({
      where,
      include: {
        user: {
          include: { profile: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ adjustments });
  } catch (error) {
    console.error('Macro adjustments list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
