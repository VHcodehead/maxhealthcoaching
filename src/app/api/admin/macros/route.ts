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
    const { user_id, calorie_target, protein_g, carbs_g, fat_g, explanation } = body;

    if (!user_id || !calorie_target || !protein_g || !carbs_g || !fat_g) {
      return NextResponse.json(
        { error: 'user_id, calorie_target, protein_g, carbs_g, and fat_g are required' },
        { status: 400 }
      );
    }

    // Get current version number
    const existing = await prisma.macroTarget.findFirst({
      where: { userId: user_id },
      orderBy: { version: 'desc' },
      select: { version: true, bmr: true, tdee: true },
    });

    const version = existing ? existing.version + 1 : 1;

    // Create a new version with coach_override — use existing BMR/TDEE or 0 if none
    const macroTarget = await prisma.macroTarget.create({
      data: {
        userId: user_id,
        version,
        bmr: existing?.bmr ?? 0,
        tdee: existing?.tdee ?? 0,
        calorieTarget: calorie_target,
        proteinG: protein_g,
        fatG: fat_g,
        carbsG: carbs_g,
        formulaUsed: 'coach_override',
        explanation: explanation || 'Coach manual override',
      },
    });

    return NextResponse.json({ success: true, macroTarget });
  } catch (error) {
    console.error('Admin macro override error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
