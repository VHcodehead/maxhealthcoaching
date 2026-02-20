import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { generateMacroTargets } from '@/lib/macros';
import type { OnboardingResponse } from '@/types/database';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get latest onboarding response
    const onboarding = await prisma.onboardingResponse.findFirst({
      where: { userId: session.user.id },
      orderBy: { version: 'desc' },
    });

    if (!onboarding) {
      return NextResponse.json({ error: 'No onboarding data found' }, { status: 404 });
    }

    // Convert Prisma model to OnboardingResponse type for macro calculation
    const obData: OnboardingResponse = {
      id: onboarding.id,
      user_id: onboarding.userId,
      version: onboarding.version,
      age: onboarding.age,
      sex: onboarding.sex as 'male' | 'female',
      height_cm: onboarding.heightCm,
      weight_kg: onboarding.weightKg,
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

    const macroData = generateMacroTargets(obData, session.user.id);

    // Get current version
    const existing = await prisma.macroTarget.findFirst({
      where: { userId: session.user.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = existing ? existing.version + 1 : 1;

    const macros = await prisma.macroTarget.create({
      data: {
        userId: macroData.user_id,
        version,
        bmr: macroData.bmr,
        tdee: macroData.tdee,
        calorieTarget: macroData.calorie_target,
        proteinG: macroData.protein_g,
        fatG: macroData.fat_g,
        carbsG: macroData.carbs_g,
        formulaUsed: macroData.formula_used,
        explanation: macroData.explanation,
      },
    });

    return NextResponse.json({ success: true, macros });
  } catch (error) {
    console.error('Macros error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
