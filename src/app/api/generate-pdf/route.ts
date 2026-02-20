import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all plan data
    const [profile, macros, mealPlan, trainingPlan] = await Promise.all([
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
    ]);

    const planData = (mealPlan?.planData ?? {}) as Record<string, unknown>;
    const trainingData = (trainingPlan?.planData ?? {}) as Record<string, unknown>;

    const summary = {
      client: profile?.fullName || 'Client',
      generated: new Date().toISOString(),
      macros: macros ? {
        calories: macros.calorieTarget,
        protein: macros.proteinG,
        carbs: macros.carbsG,
        fat: macros.fatG,
        bmr: macros.bmr,
        tdee: macros.tdee,
      } : null,
      mealPlanDays: Array.isArray(planData.days) ? planData.days.length : 0,
      trainingPlanWeeks: Array.isArray(trainingData.weeks) ? trainingData.weeks.length : 0,
      trainingPlanName: (trainingData.program_name as string) || '',
    };

    return NextResponse.json({ success: true, summary, macros, mealPlan, trainingPlan });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
