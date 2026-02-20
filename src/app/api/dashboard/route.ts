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

    return NextResponse.json({ profile, macros, mealPlan, trainingPlan, checkIns });
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
