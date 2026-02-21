import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [profile, macros, mealPlan, trainingPlan, checkIns] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: session.user.id } }),
      prisma.macroTarget.findFirst({
        where: { userId: session.user.id },
        orderBy: { version: 'desc' },
      }),
      prisma.mealPlan.findFirst({
        where: { userId: session.user.id },
        orderBy: { version: 'desc' },
      }),
      prisma.trainingPlan.findFirst({
        where: { userId: session.user.id },
        orderBy: { version: 'desc' },
      }),
      prisma.checkIn.findMany({
        where: { userId: session.user.id },
        orderBy: { weekNumber: 'desc' },
        take: 5,
      }),
    ]);

    // Debug: log plan data structure
    if (mealPlan) {
      const pd = mealPlan.planData as any;
      console.log('Dashboard mealPlan keys:', pd ? Object.keys(pd) : 'null');
      console.log('Dashboard mealPlan days count:', pd?.days?.length ?? 'no days key');
      if (pd?.days?.[0]) {
        console.log('First day sample:', JSON.stringify({ day: pd.days[0].day, mealCount: pd.days[0].meals?.length }));
      }
    } else {
      console.log('Dashboard: No mealPlan found for user', session.user.id);
    }
    if (trainingPlan) {
      const td = trainingPlan.planData as any;
      console.log('Dashboard trainingPlan keys:', td ? Object.keys(td) : 'null');
    } else {
      console.log('Dashboard: No trainingPlan found for user', session.user.id);
    }

    // Log plan structure for debugging
    if (mealPlan) {
      const pd = mealPlan.planData as any;
      console.log('Meal plan structure:', pd ? Object.keys(pd) : 'null', 'days:', pd?.days?.length ?? 'none');
    } else {
      console.log('No mealPlan for user:', session.user.id);
    }
    if (trainingPlan) {
      const td = trainingPlan.planData as any;
      console.log('Training plan structure:', td ? Object.keys(td) : 'null');
    } else {
      console.log('No trainingPlan for user:', session.user.id);
    }

    return NextResponse.json({ profile, macros, mealPlan, trainingPlan, checkIns });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
