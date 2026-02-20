import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fullOnboardingSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = fullOnboardingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Get current version
    const existing = await prisma.onboardingResponse.findFirst({
      where: { userId: session.user.id },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = existing ? existing.version + 1 : 1;

    // Insert onboarding response
    await prisma.onboardingResponse.create({
      data: {
        userId: session.user.id,
        version,
        age: data.age,
        sex: data.sex,
        heightCm: data.height_cm,
        weightKg: data.weight_kg,
        goal: data.goal,
        goalWeightKg: data.goal_weight_kg,
        activityLevel: data.activity_level,
        bodyFatPercentage: data.body_fat_percentage ?? null,
        bodyFatUnsure: data.body_fat_unsure ?? false,
        dietType: data.diet_type,
        dislikedFoods: data.disliked_foods ?? [],
        allergies: data.allergies ?? [],
        mealsPerDay: data.meals_per_day,
        mealTimingWindow: data.meal_timing_window ?? '',
        cookingSkill: data.cooking_skill,
        budget: data.budget,
        restaurantFrequency: data.restaurant_frequency ?? '',
        injuries: data.injuries ?? [],
        injuryNotes: data.injury_notes ?? '',
        workoutFrequency: data.workout_frequency,
        workoutLocation: data.workout_location,
        experienceLevel: data.experience_level,
        homeEquipment: data.home_equipment ?? [],
        splitPreference: data.split_preference,
        timePerSession: data.time_per_session,
        cardioPreference: data.cardio_preference,
        planDurationWeeks: data.plan_duration_weeks,
        averageSteps: data.average_steps ?? 8000,
        sleepHours: data.sleep_hours ?? 7,
        stressLevel: data.stress_level ?? 'medium',
        jobType: data.job_type ?? 'desk',
      },
    });

    // Mark onboarding as completed
    await prisma.profile.update({
      where: { userId: session.user.id },
      data: { onboardingCompleted: true, updatedAt: new Date() },
    });

    return NextResponse.json({ success: true, version });
  } catch (error) {
    console.error('Onboarding error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
