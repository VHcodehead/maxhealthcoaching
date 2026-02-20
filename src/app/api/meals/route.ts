import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const mealPlan = await prisma.mealPlan.findFirst({
      where: { userId: session.user.id },
      orderBy: { version: 'desc' },
    });

    return NextResponse.json({
      mealPlan: mealPlan ? {
        ...mealPlan,
        plan_data: mealPlan.planData,
        grocery_list: mealPlan.groceryList,
      } : null,
    });
  } catch (error) {
    console.error('Meals error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
