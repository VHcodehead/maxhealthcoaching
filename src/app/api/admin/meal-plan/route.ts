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
    const { user_id, plan_data, grocery_list } = body;

    if (!user_id || !plan_data) {
      return NextResponse.json({ error: 'user_id and plan_data are required' }, { status: 400 });
    }

    // Find the latest meal plan for this user
    const existing = await prisma.mealPlan.findFirst({
      where: { userId: user_id },
      orderBy: { version: 'desc' },
    });

    if (!existing) {
      return NextResponse.json({ error: 'No meal plan found for this client' }, { status: 404 });
    }

    // Update in-place (coach edit, not a new version)
    const updated = await prisma.mealPlan.update({
      where: { id: existing.id },
      data: {
        planData: plan_data,
        ...(grocery_list !== undefined ? { groceryList: grocery_list } : {}),
      },
    });

    return NextResponse.json({ success: true, mealPlan: updated });
  } catch (error) {
    console.error('Admin meal plan edit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
