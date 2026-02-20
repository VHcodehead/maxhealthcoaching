import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const trainingPlan = await prisma.trainingPlan.findFirst({
      where: { userId: session.user.id },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({
      trainingPlan: trainingPlan ? {
        ...trainingPlan,
        plan_data: trainingPlan.planData,
        duration_weeks: trainingPlan.durationWeeks,
      } : null,
    });
  } catch (error) {
    console.error('Training error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
