import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkInSchema } from '@/lib/validations';
import { generateMacroTargets } from '@/lib/macros';
import { isWithinCheckInWindow, hasCheckedInThisWeek } from '@/lib/checkin-schedule';
import type { OnboardingResponse } from '@/types/database';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if this is the client's first-ever check-in
    const existingCheckIn = await prisma.checkIn.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      select: { weekNumber: true, createdAt: true },
    });

    const isFirstCheckIn = !existingCheckIn;

    // Enforce check-in window (first-ever check-in is exempt)
    if (!isFirstCheckIn && !isWithinCheckInWindow()) {
      return NextResponse.json(
        { error: 'Check-in window is closed. Check-ins are accepted Saturday 6pm – Tuesday midnight UTC.' },
        { status: 403 }
      );
    }

    // Prevent duplicate check-ins within the same window
    if (!isFirstCheckIn && hasCheckedInThisWeek(existingCheckIn.createdAt)) {
      return NextResponse.json(
        { error: 'You have already checked in this week.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const parsed = checkInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const weekNumber = existingCheckIn ? existingCheckIn.weekNumber + 1 : 1;

    const checkIn = await prisma.checkIn.create({
      data: {
        userId: session.user.id,
        weekNumber,
        weightKg: parsed.data.weight_kg,
        waistCm: parsed.data.waist_cm ?? null,
        adherenceRating: parsed.data.adherence_rating,
        stepsAvg: parsed.data.steps_avg ?? 0,
        sleepAvg: parsed.data.sleep_avg ?? 7,
        notes: parsed.data.notes ?? '',
      },
    });

    // === Check if macros need adjustment — create pending review for coach ===
    let pendingAdjustment = false;
    let newCalories = 0;
    let oldCalories = 0;

    const onboarding = await prisma.onboardingResponse.findFirst({
      where: { userId: session.user.id },
      orderBy: { version: 'desc' },
    });

    const latestMacros = await prisma.macroTarget.findFirst({
      where: { userId: session.user.id },
      orderBy: { version: 'desc' },
    });

    if (onboarding && latestMacros) {
      // Convert Prisma model to OnboardingResponse type with updated weight
      const obData: OnboardingResponse = {
        id: onboarding.id,
        user_id: onboarding.userId,
        version: onboarding.version,
        age: onboarding.age,
        sex: onboarding.sex as 'male' | 'female',
        height_cm: onboarding.heightCm,
        weight_kg: parsed.data.weight_kg, // USE CHECK-IN WEIGHT
        goal: onboarding.goal as OnboardingResponse['goal'],
        goal_weight_kg: onboarding.goalWeightKg,
        activity_level: onboarding.activityLevel as OnboardingResponse['activity_level'],
        body_fat_percentage: onboarding.bodyFatPercentage ?? undefined,
        body_fat_unsure: onboarding.bodyFatUnsure,
        diet_type: onboarding.dietType as OnboardingResponse['diet_type'],
        disliked_foods: onboarding.dislikedFoods,
        allergies: onboarding.allergies,
        meals_per_day: onboarding.mealsPerDay,
        meal_timing_window: onboarding.mealTimingWindow ?? '',
        cooking_skill: onboarding.cookingSkill as 'low' | 'medium' | 'high',
        budget: onboarding.budget as 'low' | 'medium' | 'high',
        restaurant_frequency: onboarding.restaurantFrequency ?? '',
        injuries: onboarding.injuries,
        injury_notes: onboarding.injuryNotes ?? '',
        workout_frequency: onboarding.workoutFrequency,
        workout_location: onboarding.workoutLocation as 'home' | 'gym',
        experience_level: onboarding.experienceLevel as OnboardingResponse['experience_level'],
        home_equipment: onboarding.homeEquipment,
        split_preference: onboarding.splitPreference as OnboardingResponse['split_preference'],
        time_per_session: onboarding.timePerSession,
        cardio_preference: onboarding.cardioPreference as OnboardingResponse['cardio_preference'],
        plan_duration_weeks: onboarding.planDurationWeeks as OnboardingResponse['plan_duration_weeks'],
        average_steps: onboarding.averageSteps ?? 8000,
        sleep_hours: onboarding.sleepHours ?? 7,
        stress_level: onboarding.stressLevel as 'low' | 'medium' | 'high',
        job_type: onboarding.jobType as 'desk' | 'active',
        created_at: onboarding.createdAt.toISOString(),
      };

      const newMacroData = generateMacroTargets(obData, session.user.id);
      oldCalories = latestMacros.calorieTarget;
      newCalories = newMacroData.calorie_target;

      const caloriesDiff = Math.abs(newCalories - oldCalories);

      // Only create pending adjustment if calories changed by more than 50
      if (caloriesDiff > 50) {
        // Get previous weight from last check-in before this one
        const previousCheckIn = await prisma.checkIn.findFirst({
          where: { userId: session.user.id, id: { not: checkIn.id } },
          orderBy: { weekNumber: 'desc' },
          select: { weightKg: true },
        });
        const previousWeight = previousCheckIn?.weightKg ?? onboarding.weightKg;

        // Auto-dismiss any existing pending adjustments for this user
        await prisma.pendingMacroAdjustment.updateMany({
          where: { userId: session.user.id, status: 'pending' },
          data: { status: 'dismissed', resolvedAt: new Date() },
        });

        // Create new pending adjustment for coach review
        await prisma.pendingMacroAdjustment.create({
          data: {
            userId: session.user.id,
            checkInId: checkIn.id,
            status: 'pending',
            previousWeightKg: previousWeight,
            newWeightKg: parsed.data.weight_kg,
            currentCalories: Math.round(latestMacros.calorieTarget),
            currentProteinG: Math.round(latestMacros.proteinG),
            currentFatG: Math.round(latestMacros.fatG),
            currentCarbsG: Math.round(latestMacros.carbsG),
            proposedBmr: newMacroData.bmr,
            proposedTdee: newMacroData.tdee,
            proposedCalories: newMacroData.calorie_target,
            proposedProteinG: newMacroData.protein_g,
            proposedFatG: newMacroData.fat_g,
            proposedCarbsG: newMacroData.carbs_g,
            proposedFormula: newMacroData.formula_used,
            proposedExplanation: newMacroData.explanation ?? '',
          },
        });

        pendingAdjustment = true;
        console.log(`Pending macro adjustment created: ${oldCalories} → ${newCalories} kcal (week ${weekNumber}, weight ${parsed.data.weight_kg}kg)`);
      }
    }

    return NextResponse.json({
      success: true,
      checkIn,
      pendingAdjustment,
      oldCalories,
      newCalories,
    });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { userId: session.user.id },
      include: { progressPhotos: true },
      orderBy: { weekNumber: 'desc' },
    });

    return NextResponse.json({ checkIns });
  } catch (error) {
    console.error('Check-in GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
