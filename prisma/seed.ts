import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const passwordHash = await bcrypt.hash('coach123', 12);
  const clientPasswordHash = await bcrypt.hash('client123', 12);

  // ============================================================
  // 1. Coach user
  // ============================================================
  const coach = await prisma.user.upsert({
    where: { email: 'coach@maxhealth.com' },
    update: {},
    create: {
      email: 'coach@maxhealth.com',
      passwordHash,
    },
  });

  await prisma.profile.upsert({
    where: { userId: coach.id },
    update: {},
    create: {
      userId: coach.id,
      email: 'coach@maxhealth.com',
      fullName: 'Max (Coach)',
      role: 'coach',
      subscriptionStatus: 'active',
      onboardingCompleted: true,
    },
  });

  await prisma.coachSettings.upsert({
    where: { coachId: coach.id },
    update: {},
    create: {
      coachId: coach.id,
      maxClients: 20,
      spotsRemaining: 15,
    },
  });

  console.log('✓ Coach user created');

  // ============================================================
  // 2. Demo client – Sarah (active, with check-ins + pending macro adjustment)
  // ============================================================
  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@example.com' },
    update: {},
    create: {
      email: 'sarah@example.com',
      passwordHash: clientPasswordHash,
    },
  });

  await prisma.profile.upsert({
    where: { userId: sarah.id },
    update: {},
    create: {
      userId: sarah.id,
      email: 'sarah@example.com',
      fullName: 'Sarah Johnson',
      role: 'client',
      subscriptionStatus: 'active',
      onboardingCompleted: true,
    },
  });

  // Check if onboarding already exists
  const sarahOnboarding = await prisma.onboardingResponse.findFirst({
    where: { userId: sarah.id },
  });
  if (!sarahOnboarding) {
    await prisma.onboardingResponse.create({
      data: {
        userId: sarah.id,
        version: 1,
        age: 28,
        sex: 'female',
        heightCm: 165,
        weightKg: 72,
        goal: 'cut',
        goalWeightKg: 62,
        activityLevel: 'moderate',
        bodyFatPercentage: 28,
        bodyFatUnsure: false,
        dietType: 'no_restrictions',
        dislikedFoods: ['liver'],
        allergies: [],
        mealsPerDay: 3,
        mealTimingWindow: '8am-8pm',
        cookingSkill: 'medium',
        budget: 'medium',
        restaurantFrequency: '1-2x/week',
        injuries: [],
        injuryNotes: '',
        workoutFrequency: 4,
        workoutLocation: 'gym',
        experienceLevel: 'intermediate',
        homeEquipment: [],
        splitPreference: 'upper_lower',
        timePerSession: 60,
        cardioPreference: 'moderate',
        planDurationWeeks: 8,
        averageSteps: 9000,
        sleepHours: 7.5,
        stressLevel: 'medium',
        jobType: 'desk',
      },
    });
  }

  // Macro targets (v1 — original)
  const sarahMacrosV1 = await prisma.macroTarget.findFirst({
    where: { userId: sarah.id },
  });
  if (!sarahMacrosV1) {
    await prisma.macroTarget.create({
      data: {
        userId: sarah.id,
        version: 1,
        bmr: 1438,
        tdee: 2229,
        calorieTarget: 1783,
        proteinG: 159,
        fatG: 53,
        carbsG: 175,
        formulaUsed: 'katch_mcardle',
        explanation: 'Calculated from onboarding data at 72 kg.',
      },
    });
  }

  // Check-ins for Sarah (weeks 1-4)
  const sarahCheckInCount = await prisma.checkIn.count({ where: { userId: sarah.id } });
  let sarahWeek4CheckIn: { id: string } | null = null;

  if (sarahCheckInCount === 0) {
    await prisma.checkIn.create({
      data: {
        userId: sarah.id,
        weekNumber: 1,
        weightKg: 71.8,
        waistCm: 82,
        adherenceRating: 8,
        stepsAvg: 9200,
        sleepAvg: 7.5,
        notes: 'Great first week, felt energized.',
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.checkIn.create({
      data: {
        userId: sarah.id,
        weekNumber: 2,
        weightKg: 71.2,
        waistCm: 81.5,
        adherenceRating: 7,
        stepsAvg: 8800,
        sleepAvg: 7,
        notes: 'Cravings hit mid-week but pushed through.',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.checkIn.create({
      data: {
        userId: sarah.id,
        weekNumber: 3,
        weightKg: 70.5,
        waistCm: 81,
        adherenceRating: 9,
        stepsAvg: 10200,
        sleepAvg: 8,
        notes: 'Best week so far. Meal prep really helped.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    sarahWeek4CheckIn = await prisma.checkIn.create({
      data: {
        userId: sarah.id,
        weekNumber: 4,
        weightKg: 69.2,
        waistCm: 80,
        adherenceRating: 8,
        stepsAvg: 9500,
        sleepAvg: 7.5,
        notes: 'Dropped a lot this week, maybe water weight too. Feeling good.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Pending macro adjustment for Sarah (triggered by week 4 weight drop 72→69.2)
  if (sarahWeek4CheckIn) {
    // Dismiss any existing pending adjustments first
    await prisma.pendingMacroAdjustment.updateMany({
      where: { userId: sarah.id, status: 'pending' },
      data: { status: 'dismissed', resolvedAt: new Date() },
    });

    await prisma.pendingMacroAdjustment.create({
      data: {
        userId: sarah.id,
        checkInId: sarahWeek4CheckIn.id,
        status: 'pending',
        previousWeightKg: 70.5,
        newWeightKg: 69.2,
        currentCalories: 1783,
        currentProteinG: 159,
        currentFatG: 53,
        currentCarbsG: 175,
        proposedBmr: 1398,
        proposedTdee: 2167,
        proposedCalories: 1734,
        proposedProteinG: 153,
        proposedFatG: 51,
        proposedCarbsG: 170,
        proposedFormula: 'katch_mcardle',
        proposedExplanation: 'Recalculated based on new weight of 69.2 kg. BMR and TDEE adjusted down accordingly.',
      },
    });
  }

  console.log('✓ Sarah Johnson (client) — 4 check-ins + pending macro adjustment');

  // ============================================================
  // 3. Demo client – James (active, no pending adjustments)
  // ============================================================
  const james = await prisma.user.upsert({
    where: { email: 'james@example.com' },
    update: {},
    create: {
      email: 'james@example.com',
      passwordHash: clientPasswordHash,
    },
  });

  await prisma.profile.upsert({
    where: { userId: james.id },
    update: {},
    create: {
      userId: james.id,
      email: 'james@example.com',
      fullName: 'James Rivera',
      role: 'client',
      subscriptionStatus: 'active',
      onboardingCompleted: true,
    },
  });

  const jamesOnboarding = await prisma.onboardingResponse.findFirst({
    where: { userId: james.id },
  });
  if (!jamesOnboarding) {
    await prisma.onboardingResponse.create({
      data: {
        userId: james.id,
        version: 1,
        age: 34,
        sex: 'male',
        heightCm: 180,
        weightKg: 88,
        goal: 'bulk',
        goalWeightKg: 95,
        activityLevel: 'very_active',
        bodyFatPercentage: 15,
        bodyFatUnsure: false,
        dietType: 'no_restrictions',
        dislikedFoods: [],
        allergies: ['shellfish'],
        mealsPerDay: 4,
        mealTimingWindow: '7am-9pm',
        cookingSkill: 'high',
        budget: 'high',
        restaurantFrequency: '1x/week',
        injuries: [],
        injuryNotes: '',
        workoutFrequency: 5,
        workoutLocation: 'gym',
        experienceLevel: 'advanced',
        homeEquipment: [],
        splitPreference: 'ppl',
        timePerSession: 75,
        cardioPreference: 'light',
        planDurationWeeks: 12,
        averageSteps: 12000,
        sleepHours: 8,
        stressLevel: 'low',
        jobType: 'active',
      },
    });
  }

  const jamesMacros = await prisma.macroTarget.findFirst({
    where: { userId: james.id },
  });
  if (!jamesMacros) {
    await prisma.macroTarget.create({
      data: {
        userId: james.id,
        version: 1,
        bmr: 1895,
        tdee: 3268,
        calorieTarget: 3595,
        proteinG: 155,
        fatG: 108,
        carbsG: 462,
        formulaUsed: 'katch_mcardle',
        explanation: 'Calculated from onboarding data at 88 kg, bulk surplus.',
      },
    });
  }

  const jamesCheckInCount = await prisma.checkIn.count({ where: { userId: james.id } });
  if (jamesCheckInCount === 0) {
    await prisma.checkIn.create({
      data: {
        userId: james.id,
        weekNumber: 1,
        weightKg: 88.3,
        adherenceRating: 9,
        stepsAvg: 12500,
        sleepAvg: 8,
        notes: 'Solid week. Hit all training sessions.',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.checkIn.create({
      data: {
        userId: james.id,
        weekNumber: 2,
        weightKg: 88.7,
        adherenceRating: 8,
        stepsAvg: 11800,
        sleepAvg: 7.5,
        notes: 'Good progress on lifts. Weight trending up nicely.',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      },
    });
  }

  console.log('✓ James Rivera (client) — 2 check-ins, no pending adjustments');

  // ============================================================
  // 4. Demo client – Emily (overdue, pending adjustment)
  // ============================================================
  const emily = await prisma.user.upsert({
    where: { email: 'emily@example.com' },
    update: {},
    create: {
      email: 'emily@example.com',
      passwordHash: clientPasswordHash,
    },
  });

  await prisma.profile.upsert({
    where: { userId: emily.id },
    update: {},
    create: {
      userId: emily.id,
      email: 'emily@example.com',
      fullName: 'Emily Chen',
      role: 'client',
      subscriptionStatus: 'active',
      onboardingCompleted: true,
    },
  });

  const emilyOnboarding = await prisma.onboardingResponse.findFirst({
    where: { userId: emily.id },
  });
  if (!emilyOnboarding) {
    await prisma.onboardingResponse.create({
      data: {
        userId: emily.id,
        version: 1,
        age: 25,
        sex: 'female',
        heightCm: 158,
        weightKg: 60,
        goal: 'recomp',
        goalWeightKg: 58,
        activityLevel: 'lightly_active',
        bodyFatUnsure: true,
        dietType: 'vegetarian',
        dislikedFoods: ['tofu'],
        allergies: ['peanuts'],
        mealsPerDay: 3,
        mealTimingWindow: '9am-7pm',
        cookingSkill: 'low',
        budget: 'low',
        restaurantFrequency: '2-3x/week',
        injuries: ['lower_back'],
        injuryNotes: 'Mild disc issue, avoid heavy deadlifts',
        workoutFrequency: 3,
        workoutLocation: 'home',
        experienceLevel: 'beginner',
        homeEquipment: ['dumbbells', 'resistance_bands'],
        splitPreference: 'full_body',
        timePerSession: 45,
        cardioPreference: 'moderate',
        planDurationWeeks: 4,
        averageSteps: 6000,
        sleepHours: 6.5,
        stressLevel: 'high',
        jobType: 'desk',
      },
    });
  }

  const emilyMacros = await prisma.macroTarget.findFirst({
    where: { userId: emily.id },
  });
  if (!emilyMacros) {
    await prisma.macroTarget.create({
      data: {
        userId: emily.id,
        version: 1,
        bmr: 1304,
        tdee: 1793,
        calorieTarget: 1793,
        proteinG: 119,
        fatG: 54,
        carbsG: 199,
        formulaUsed: 'mifflin_st_jeor',
        explanation: 'Recomp target at maintenance. Mifflin-St Jeor used (BF% unknown).',
      },
    });
  }

  const emilyCheckInCount = await prisma.checkIn.count({ where: { userId: emily.id } });
  let emilyWeek3CheckIn: { id: string } | null = null;

  if (emilyCheckInCount === 0) {
    await prisma.checkIn.create({
      data: {
        userId: emily.id,
        weekNumber: 1,
        weightKg: 60.2,
        adherenceRating: 6,
        stepsAvg: 5500,
        sleepAvg: 6,
        notes: 'Struggled to hit protein. Need better veggie protein sources.',
        createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000),
      },
    });

    await prisma.checkIn.create({
      data: {
        userId: emily.id,
        weekNumber: 2,
        weightKg: 61.5,
        adherenceRating: 5,
        stepsAvg: 4800,
        sleepAvg: 6,
        notes: 'Ate out too much this week. Stress eating.',
        createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000),
      },
    });

    emilyWeek3CheckIn = await prisma.checkIn.create({
      data: {
        userId: emily.id,
        weekNumber: 3,
        weightKg: 62.8,
        adherenceRating: 4,
        stepsAvg: 4200,
        sleepAvg: 5.5,
        notes: 'Rough week. Work stress through the roof.',
        createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Pending macro adjustment for Emily (weight went up 60 → 62.8 on recomp)
  if (emilyWeek3CheckIn) {
    await prisma.pendingMacroAdjustment.updateMany({
      where: { userId: emily.id, status: 'pending' },
      data: { status: 'dismissed', resolvedAt: new Date() },
    });

    await prisma.pendingMacroAdjustment.create({
      data: {
        userId: emily.id,
        checkInId: emilyWeek3CheckIn.id,
        status: 'pending',
        previousWeightKg: 61.5,
        newWeightKg: 62.8,
        currentCalories: 1793,
        currentProteinG: 119,
        currentFatG: 54,
        currentCarbsG: 199,
        proposedBmr: 1332,
        proposedTdee: 1832,
        proposedCalories: 1832,
        proposedProteinG: 125,
        proposedFatG: 55,
        proposedCarbsG: 203,
        proposedFormula: 'mifflin_st_jeor',
        proposedExplanation: 'Recomp target adjusted to new maintenance based on 62.8 kg.',
      },
    });
  }

  console.log('✓ Emily Chen (client) — 3 check-ins (overdue), pending macro adjustment');

  // ============================================================
  // 5. Demo client – Marcus (new/pending, no check-ins)
  // ============================================================
  const marcus = await prisma.user.upsert({
    where: { email: 'marcus@example.com' },
    update: {},
    create: {
      email: 'marcus@example.com',
      passwordHash: clientPasswordHash,
    },
  });

  await prisma.profile.upsert({
    where: { userId: marcus.id },
    update: {},
    create: {
      userId: marcus.id,
      email: 'marcus@example.com',
      fullName: 'Marcus Williams',
      role: 'client',
      subscriptionStatus: 'active',
      onboardingCompleted: false,
    },
  });

  console.log('✓ Marcus Williams (client) — pending onboarding');

  // ============================================================
  // 6. Sample transformation (showcase)
  // ============================================================
  const existingTransformation = await prisma.transformation.findFirst({
    where: { clientName: 'Sample Client' },
  });
  if (!existingTransformation) {
    await prisma.transformation.create({
      data: {
        clientName: 'Sample Client',
        weightLost: '12 kg',
        duration: '16 weeks',
        quote: 'MaxHealth completely changed my approach to fitness and nutrition.',
        featured: true,
        approved: true,
      },
    });
  }

  // ============================================================
  // 7. Sample leads
  // ============================================================
  const existingLeads = await prisma.lead.count();
  if (existingLeads === 0) {
    await prisma.lead.createMany({
      data: [
        {
          email: 'prospect1@example.com',
          source: 'quiz',
          quizAnswers: { goal: 'lose_weight', timeline: '3_months', budget: 'medium' },
          converted: false,
        },
        {
          email: 'prospect2@example.com',
          source: 'website',
          converted: false,
        },
      ],
    });
  }

  console.log('✓ Leads + transformation seeded');

  // ============================================================
  // Summary
  // ============================================================
  console.log('\n========================================');
  console.log('  Seed complete!');
  console.log('========================================');
  console.log('');
  console.log('  Coach:   coach@maxhealth.com / coach123');
  console.log('  Clients: client123 (all clients)');
  console.log('');
  console.log('  sarah@example.com   — active, 4 check-ins, 1 pending macro review');
  console.log('  james@example.com   — active, 2 check-ins');
  console.log('  emily@example.com   — overdue, 3 check-ins, 1 pending macro review');
  console.log('  marcus@example.com  — pending onboarding');
  console.log('');
  console.log('  Pending macro reviews: 2 (Sarah + Emily)');
  console.log('========================================\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
