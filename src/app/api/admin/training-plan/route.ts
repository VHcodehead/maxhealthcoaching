import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, plan_data } = body;

    if (!user_id || !plan_data) {
      return NextResponse.json({ error: 'user_id and plan_data are required' }, { status: 400 });
    }

    // Find the latest training plan for this user
    const existing = await prisma.trainingPlan.findFirst({
      where: { userId: user_id },
      orderBy: { version: 'desc' },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No training plan found for this client' }, { status: 404 });
    }

    // Update in-place (coach edit, not a new version)
    const updated = await prisma.trainingPlan.update({
      where: { id: existing.id },
      data: { planData: plan_data },
    });

    return NextResponse.json({ success: true, trainingPlan: updated });
  } catch (error) {
    console.error('Admin training plan edit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
