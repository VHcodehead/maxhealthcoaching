import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { calculateMacros } from '@/lib/macros';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { action, calorie_target, coach_note } = body;

    if (!action || (action !== 'approve' && action !== 'dismiss')) {
      return NextResponse.json(
        { error: 'action must be "approve" or "dismiss"' },
        { status: 400 }
      );
    }

    const adjustment = await prisma.pendingMacroAdjustment.findUnique({
      where: { id },
    });

    if (!adjustment) {
      return NextResponse.json({ error: 'Adjustment not found' }, { status: 404 });
    }

    if (adjustment.status !== 'pending') {
      return NextResponse.json(
        { error: 'Adjustment has already been resolved' },
        { status: 400 }
      );
    }

    if (action === 'dismiss') {
      await prisma.pendingMacroAdjustment.update({
        where: { id },
        data: {
          status: 'dismissed',
          coachNote: coach_note || null,
          resolvedAt: new Date(),
        },
      });

      return NextResponse.json({ success: true, action: 'dismissed' });
    }

    // === Approve ===
    // Determine final macro values
    let finalCalories = adjustment.proposedCalories;
    let finalProtein = adjustment.proposedProteinG;
    let finalFat = adjustment.proposedFatG;
    let finalCarbs = adjustment.proposedCarbsG;
    let formulaUsed = 'coach_approved';

    if (calorie_target && calorie_target !== adjustment.proposedCalories) {
      // Coach adjusted the calorie target — recalculate macros
      // We need the onboarding data for the weight/goal context
      const onboarding = await prisma.onboardingResponse.findFirst({
        where: { userId: adjustment.userId },
        orderBy: { version: 'desc' },
      });

      const recalc = calculateMacros(
        calorie_target,
        adjustment.newWeightKg,
        onboarding?.goal ?? 'recomp',
        onboarding?.bodyFatPercentage ?? undefined
      );

      finalCalories = calorie_target;
      finalProtein = recalc.protein;
      finalFat = recalc.fat;
      finalCarbs = recalc.carbs;
      formulaUsed = 'coach_approved_adjusted';
    }

    // Get current version number for new MacroTarget
    const existing = await prisma.macroTarget.findFirst({
      where: { userId: adjustment.userId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = existing ? existing.version + 1 : 1;

    // Create new MacroTarget and update adjustment in a transaction
    const [macroTarget] = await prisma.$transaction([
      prisma.macroTarget.create({
        data: {
          userId: adjustment.userId,
          version,
          bmr: adjustment.proposedBmr,
          tdee: adjustment.proposedTdee,
          calorieTarget: finalCalories,
          proteinG: finalProtein,
          fatG: finalFat,
          carbsG: finalCarbs,
          formulaUsed,
          explanation: coach_note
            ? `Coach approved adjustment: ${coach_note}`
            : 'Coach approved macro adjustment based on weight change',
        },
      }),
      prisma.pendingMacroAdjustment.update({
        where: { id },
        data: {
          status: 'approved',
          approvedCalories: finalCalories,
          approvedProteinG: finalProtein,
          approvedFatG: finalFat,
          approvedCarbsG: finalCarbs,
          coachNote: coach_note || null,
          resolvedAt: new Date(),
        },
      }),
    ]);

    return NextResponse.json({ success: true, action: 'approved', macroTarget });
  } catch (error) {
    console.error('Macro adjustment action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
