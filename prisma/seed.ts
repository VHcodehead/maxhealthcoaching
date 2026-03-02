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
  // 8. Supplement Catalog (~40 entries)
  // ============================================================
  const catalogEntries = [
    // Vitamins
    {
      name: 'Vitamin D3',
      category: 'vitamin',
      description: 'Essential fat-soluble vitamin for bone health, immune function, and mood regulation. Most people are deficient.',
      typicalForms: ['softgel', 'capsule', 'liquid'],
      defaultForm: 'softgel',
      defaultUnit: 'IU',
      dosageLow: '1000',
      dosageHigh: '5000',
      dosageGuidance: '1,000–2,000 IU for maintenance. 3,000–5,000 IU for deficiency correction. Take with fat-containing meal for absorption. Get blood levels tested every 6 months.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    {
      name: 'Vitamin C',
      category: 'vitamin',
      description: 'Water-soluble antioxidant supporting immune function, collagen synthesis, and iron absorption.',
      typicalForms: ['capsule', 'tablet', 'powder'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '500',
      dosageHigh: '2000',
      dosageGuidance: '500 mg for general health. 1,000–2,000 mg during periods of high stress or illness. Split doses above 1,000 mg for better absorption.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    {
      name: 'Vitamin K2 (MK-7)',
      category: 'vitamin',
      description: 'Directs calcium to bones instead of arteries. Essential companion to Vitamin D3 supplementation.',
      typicalForms: ['capsule', 'softgel'],
      defaultForm: 'capsule',
      defaultUnit: 'mcg',
      dosageLow: '100',
      dosageHigh: '200',
      dosageGuidance: '100 mcg for general use. 200 mcg when taking high-dose D3 (>2,000 IU). Always pair with D3 and take with fat.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    {
      name: 'B-Complex',
      category: 'vitamin',
      description: 'Full spectrum of B vitamins for energy metabolism, nervous system function, and red blood cell formation.',
      typicalForms: ['capsule', 'tablet'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '1',
      dosageHigh: '1',
      dosageGuidance: '1 capsule daily with food. Look for methylated forms (methylfolate, methylcobalamin) for better absorption. Take in the morning as B vitamins can be energizing.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    {
      name: 'Vitamin E',
      category: 'vitamin',
      description: 'Fat-soluble antioxidant protecting cell membranes. Supports skin health and immune function.',
      typicalForms: ['softgel', 'capsule'],
      defaultForm: 'softgel',
      defaultUnit: 'IU',
      dosageLow: '200',
      dosageHigh: '400',
      dosageGuidance: '200–400 IU daily. Choose mixed tocopherols over synthetic dl-alpha-tocopherol. Take with fat-containing meal.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    // Minerals
    {
      name: 'Magnesium Glycinate',
      category: 'mineral',
      description: 'Highly bioavailable magnesium for muscle relaxation, sleep quality, and nervous system support.',
      typicalForms: ['capsule', 'powder'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '200',
      dosageHigh: '400',
      dosageGuidance: '200 mg for general support. 300–400 mg for sleep and recovery. Take in the evening. Glycinate form is gentle on the stomach and promotes relaxation.',
      defaultTiming: 'bedtime',
      defaultFrequency: 'daily',
    },
    {
      name: 'Zinc',
      category: 'mineral',
      description: 'Essential mineral for immune function, testosterone production, and wound healing.',
      typicalForms: ['capsule', 'tablet'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '15',
      dosageHigh: '30',
      dosageGuidance: '15 mg for maintenance. 25–30 mg for active individuals or immune support. Take with food to avoid nausea. Balance with copper (2 mg) if supplementing long-term.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    {
      name: 'Iron Bisglycinate',
      category: 'mineral',
      description: 'Gentle, highly absorbable iron form for preventing and treating iron deficiency.',
      typicalForms: ['capsule', 'tablet'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '18',
      dosageHigh: '36',
      dosageGuidance: '18 mg for maintenance (women). 25–36 mg for deficiency correction. Take on empty stomach with vitamin C for best absorption. Only supplement if blood work shows deficiency.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    {
      name: 'Potassium',
      category: 'mineral',
      description: 'Electrolyte critical for muscle contraction, heart rhythm, and fluid balance.',
      typicalForms: ['capsule', 'powder', 'tablet'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '99',
      dosageHigh: '500',
      dosageGuidance: '99 mg per capsule is standard OTC dose. 200–500 mg for athletes or those on low-carb diets. Best obtained through diet (bananas, potatoes). Supplement if cramping occurs.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    {
      name: 'Selenium',
      category: 'mineral',
      description: 'Trace mineral supporting thyroid function, antioxidant defense, and immune health.',
      typicalForms: ['capsule', 'tablet'],
      defaultForm: 'capsule',
      defaultUnit: 'mcg',
      dosageLow: '100',
      dosageHigh: '200',
      dosageGuidance: '100–200 mcg daily. Do not exceed 400 mcg. Selenomethionine form is best absorbed. Important for thyroid conversion (T4→T3).',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    // Performance
    {
      name: 'Creatine Monohydrate',
      category: 'performance',
      description: 'Most researched sports supplement. Increases strength, power output, and muscle cell hydration.',
      typicalForms: ['powder'],
      defaultForm: 'powder',
      defaultUnit: 'g',
      dosageLow: '3',
      dosageHigh: '5',
      dosageGuidance: '3–5 g daily, every day (training and rest days). No need to load or cycle. Mix in water or shake. Micronized form dissolves better. Stay well hydrated.',
      defaultTiming: 'post_workout',
      defaultFrequency: 'daily',
    },
    {
      name: 'Beta-Alanine',
      category: 'performance',
      description: 'Buffers muscle acidity during high-intensity exercise. Improves endurance in 1-4 minute efforts.',
      typicalForms: ['powder', 'capsule'],
      defaultForm: 'powder',
      defaultUnit: 'g',
      dosageLow: '2',
      dosageHigh: '5',
      dosageGuidance: '3.2–6.4 g daily split into 2 doses. Tingling (paresthesia) is harmless and normal. Takes 2–4 weeks to build up carnosine stores. Best for high-rep and endurance work.',
      defaultTiming: 'pre_workout',
      defaultFrequency: 'daily',
    },
    {
      name: 'Citrulline Malate',
      category: 'performance',
      description: 'Amino acid boosting nitric oxide production. Improves blood flow, pumps, and reduces fatigue.',
      typicalForms: ['powder'],
      defaultForm: 'powder',
      defaultUnit: 'g',
      dosageLow: '6',
      dosageHigh: '8',
      dosageGuidance: '6–8 g of citrulline malate (2:1 ratio) 30–60 min before training. On rest days, skip or take 3 g. More effective than L-arginine for nitric oxide production.',
      defaultTiming: 'pre_workout',
      defaultFrequency: 'daily',
    },
    {
      name: 'Caffeine',
      category: 'performance',
      description: 'Stimulant improving focus, energy, and exercise performance. Enhances fat oxidation.',
      typicalForms: ['capsule', 'tablet', 'powder'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '100',
      dosageHigh: '400',
      dosageGuidance: '100–200 mg for mild boost. 200–400 mg for peak performance. Take 30–60 min pre-workout. Avoid after 2pm for sleep quality. Cycle off periodically to maintain sensitivity.',
      defaultTiming: 'pre_workout',
      defaultFrequency: 'as_needed',
    },
    {
      name: 'EAAs',
      category: 'performance',
      description: 'Essential Amino Acids to stimulate muscle protein synthesis. Useful during fasted training or between meals.',
      typicalForms: ['powder', 'capsule'],
      defaultForm: 'powder',
      defaultUnit: 'g',
      dosageLow: '5',
      dosageHigh: '15',
      dosageGuidance: '5–10 g intra-workout or between meals. 10–15 g for fasted training. Contains all 9 essential amino acids. Less necessary if protein intake is adequate.',
      defaultTiming: 'post_workout',
      defaultFrequency: 'daily',
    },
    // Protein
    {
      name: 'Whey Protein Isolate',
      category: 'protein',
      description: 'Fast-absorbing complete protein. Low lactose, high bioavailability. Gold standard for post-workout.',
      typicalForms: ['powder'],
      defaultForm: 'powder',
      defaultUnit: 'g',
      dosageLow: '25',
      dosageHigh: '50',
      dosageGuidance: '25–30 g per serving for muscle protein synthesis. Up to 40–50 g post-workout for larger individuals. Isolate has less lactose than concentrate. Mix with water or milk.',
      defaultTiming: 'post_workout',
      defaultFrequency: 'daily',
    },
    {
      name: 'Casein Protein',
      category: 'protein',
      description: 'Slow-digesting protein ideal for sustained amino acid delivery. Best taken before bed.',
      typicalForms: ['powder'],
      defaultForm: 'powder',
      defaultUnit: 'g',
      dosageLow: '25',
      dosageHigh: '40',
      dosageGuidance: '25–40 g before bed for overnight muscle protein synthesis. Can also be used between meals for sustained satiety. Micellar casein is the slowest-digesting form.',
      defaultTiming: 'bedtime',
      defaultFrequency: 'daily',
    },
    {
      name: 'Collagen Peptides',
      category: 'protein',
      description: 'Supports joint, tendon, skin, and gut health. Type I & III most common for skin and joints.',
      typicalForms: ['powder', 'capsule'],
      defaultForm: 'powder',
      defaultUnit: 'g',
      dosageLow: '10',
      dosageHigh: '20',
      dosageGuidance: '10–15 g daily for skin and joint support. 15–20 g for injury recovery. Take with vitamin C to enhance collagen synthesis. Can be mixed into coffee or smoothies.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    // Recovery
    {
      name: 'Omega-3 Fish Oil',
      category: 'recovery',
      description: 'EPA and DHA for reducing inflammation, supporting heart health, brain function, and recovery.',
      typicalForms: ['softgel', 'liquid'],
      defaultForm: 'softgel',
      defaultUnit: 'mg',
      dosageLow: '1000',
      dosageHigh: '3000',
      dosageGuidance: '1,000–2,000 mg combined EPA/DHA for general health. 2,000–3,000 mg for anti-inflammatory benefits. Look for high EPA:DHA ratio. Take with meals to reduce fishy burps.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    {
      name: 'Tart Cherry Extract',
      category: 'recovery',
      description: 'Natural anti-inflammatory and antioxidant. Reduces muscle soreness and improves sleep quality.',
      typicalForms: ['capsule', 'liquid', 'powder'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '480',
      dosageHigh: '1000',
      dosageGuidance: '480–1,000 mg daily or 8–12 oz of tart cherry juice. Most effective taken after intense training. Also supports melatonin production for improved sleep.',
      defaultTiming: 'post_workout',
      defaultFrequency: 'daily',
    },
    {
      name: 'L-Glutamine',
      category: 'recovery',
      description: 'Conditionally essential amino acid for gut health and immune support during heavy training.',
      typicalForms: ['powder', 'capsule'],
      defaultForm: 'powder',
      defaultUnit: 'g',
      dosageLow: '5',
      dosageHigh: '10',
      dosageGuidance: '5 g for general gut and immune support. 10 g post-workout during intense training blocks. Most beneficial when training volume is very high or during caloric deficit.',
      defaultTiming: 'post_workout',
      defaultFrequency: 'daily',
    },
    {
      name: 'Curcumin',
      category: 'recovery',
      description: 'Active compound in turmeric with powerful anti-inflammatory and antioxidant properties.',
      typicalForms: ['capsule', 'softgel'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '500',
      dosageHigh: '1000',
      dosageGuidance: '500–1,000 mg daily. Must include piperine (black pepper extract) or be a bioavailable form (Meriva, Longvida) for absorption. Take with fat-containing meals.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    // Sleep
    {
      name: 'Melatonin',
      category: 'sleep',
      description: 'Hormone regulating circadian rhythm. Helps with sleep onset, jet lag, and shift work adjustment.',
      typicalForms: ['tablet', 'capsule', 'liquid'],
      defaultForm: 'tablet',
      defaultUnit: 'mg',
      dosageLow: '0.5',
      dosageHigh: '5',
      dosageGuidance: '0.5–1 mg for circadian rhythm support (more is not better). 3–5 mg for jet lag or shift work. Take 30–60 min before bed. Start low and increase only if needed.',
      defaultTiming: 'bedtime',
      defaultFrequency: 'as_needed',
    },
    {
      name: 'L-Theanine',
      category: 'sleep',
      description: 'Amino acid from green tea promoting calm focus without drowsiness. Pairs well with caffeine or melatonin.',
      typicalForms: ['capsule', 'tablet'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '100',
      dosageHigh: '400',
      dosageGuidance: '100–200 mg with caffeine for calm focus. 200–400 mg in the evening for relaxation and sleep onset. Non-habit forming. Can be taken daily without cycling.',
      defaultTiming: 'bedtime',
      defaultFrequency: 'daily',
    },
    {
      name: 'Glycine',
      category: 'sleep',
      description: 'Amino acid improving sleep quality and next-day alertness. Also supports collagen production.',
      typicalForms: ['powder', 'capsule'],
      defaultForm: 'powder',
      defaultUnit: 'g',
      dosageLow: '3',
      dosageHigh: '5',
      dosageGuidance: '3 g before bed is the studied dose for sleep improvement. Can take up to 5 g. Sweet taste — mix in water or tea. Also supports collagen synthesis.',
      defaultTiming: 'bedtime',
      defaultFrequency: 'daily',
    },
    {
      name: 'Ashwagandha (KSM-66)',
      category: 'sleep',
      description: 'Adaptogenic herb reducing cortisol and anxiety. Improves sleep quality and stress resilience.',
      typicalForms: ['capsule', 'powder'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '300',
      dosageHigh: '600',
      dosageGuidance: '300 mg for stress support. 600 mg for sleep and recovery. KSM-66 is the most studied extract. Cycle 8 weeks on, 2 weeks off. May increase thyroid hormones.',
      defaultTiming: 'evening',
      defaultFrequency: 'daily',
    },
    // Organ Support
    {
      name: 'NAC (N-Acetyl Cysteine)',
      category: 'organ_support',
      description: 'Precursor to glutathione, the master antioxidant. Supports liver health and detoxification.',
      typicalForms: ['capsule'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '600',
      dosageHigh: '1200',
      dosageGuidance: '600 mg for antioxidant maintenance. 1,200 mg (split into 2 doses) for liver support or during supplement-heavy protocols. Take on empty stomach for best absorption.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    {
      name: 'Milk Thistle',
      category: 'organ_support',
      description: 'Herb containing silymarin for liver protection and regeneration. Standard in liver support stacks.',
      typicalForms: ['capsule', 'tablet'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '250',
      dosageHigh: '500',
      dosageGuidance: '250 mg for general liver maintenance. 500 mg for active liver support during oral supplement cycles. Look for standardized 80% silymarin extract.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    {
      name: 'TUDCA',
      category: 'organ_support',
      description: 'Bile acid protecting liver cells and supporting bile flow. Powerful liver support compound.',
      typicalForms: ['capsule'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '250',
      dosageHigh: '500',
      dosageGuidance: '250 mg for general liver support. 500 mg during periods of high liver stress. Take with meals. Can be combined with NAC and milk thistle for comprehensive liver support.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    {
      name: 'CoQ10',
      category: 'organ_support',
      description: 'Coenzyme essential for cellular energy production and heart health. Important if taking statins.',
      typicalForms: ['softgel', 'capsule'],
      defaultForm: 'softgel',
      defaultUnit: 'mg',
      dosageLow: '100',
      dosageHigh: '300',
      dosageGuidance: '100 mg for general health and energy. 200–300 mg for heart support or if on statins. Ubiquinol form is more bioavailable than ubiquinone. Take with fat.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    {
      name: 'Cranberry Extract',
      category: 'organ_support',
      description: 'Supports urinary tract health by preventing bacterial adhesion. Rich in proanthocyanidins.',
      typicalForms: ['capsule', 'tablet'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '500',
      dosageHigh: '1500',
      dosageGuidance: '500 mg daily for prevention. 1,000–1,500 mg for active UTI support. Look for standardized PAC (proanthocyanidin) content of at least 36 mg.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    // Hormonal
    {
      name: 'DIM (Diindolylmethane)',
      category: 'hormonal',
      description: 'Found in cruciferous vegetables. Supports healthy estrogen metabolism and hormonal balance.',
      typicalForms: ['capsule'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '100',
      dosageHigh: '200',
      dosageGuidance: '100 mg for general estrogen balance. 200 mg for more active hormonal support. Take with food. May cause changes in urine color (harmless).',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    {
      name: 'Tongkat Ali',
      category: 'hormonal',
      description: 'Traditional herb supporting testosterone production, libido, and stress reduction.',
      typicalForms: ['capsule'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '200',
      dosageHigh: '400',
      dosageGuidance: '200 mg of standardized extract (100:1 or 200:1) daily. 400 mg for more pronounced effects. Cycle 5 days on, 2 days off. Best taken in the morning.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    {
      name: 'Fenugreek Extract',
      category: 'hormonal',
      description: 'Herb supporting testosterone, blood sugar regulation, and libido. Also aids digestion.',
      typicalForms: ['capsule'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '500',
      dosageHigh: '600',
      dosageGuidance: '500–600 mg of standardized extract daily. Testofen brand is most studied. Take with meals. May lower blood sugar — monitor if diabetic.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    {
      name: 'Boron',
      category: 'hormonal',
      description: 'Trace mineral supporting testosterone, bone density, and cognitive function.',
      typicalForms: ['capsule', 'tablet'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '3',
      dosageHigh: '10',
      dosageGuidance: '3–6 mg for general support. 6–10 mg for testosterone and bone health optimization. Take with meals. Boron citrate or glycinate forms are preferred.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    // Health
    {
      name: 'Probiotics',
      category: 'health',
      description: 'Beneficial bacteria supporting gut microbiome, digestion, immune function, and nutrient absorption.',
      typicalForms: ['capsule'],
      defaultForm: 'capsule',
      defaultUnit: 'CFU',
      dosageLow: '10B',
      dosageHigh: '50B',
      dosageGuidance: '10–25 billion CFU for maintenance. 25–50 billion CFU for gut restoration. Look for multi-strain formulas with Lactobacillus and Bifidobacterium. Refrigerated strains may be more potent.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    {
      name: 'Fiber (Psyllium Husk)',
      category: 'health',
      description: 'Soluble fiber supporting digestive regularity, blood sugar control, and cholesterol management.',
      typicalForms: ['powder', 'capsule'],
      defaultForm: 'powder',
      defaultUnit: 'g',
      dosageLow: '5',
      dosageHigh: '10',
      dosageGuidance: '5 g to start, increase to 10 g over 1–2 weeks. Mix in 8+ oz water and drink immediately. Take separately from medications (2 hours apart). Increase water intake.',
      defaultTiming: 'evening',
      defaultFrequency: 'daily',
    },
    {
      name: 'Electrolyte Complex',
      category: 'health',
      description: 'Balanced blend of sodium, potassium, and magnesium for hydration and muscle function.',
      typicalForms: ['powder', 'tablet'],
      defaultForm: 'powder',
      defaultUnit: 'serving',
      dosageLow: '1',
      dosageHigh: '3',
      dosageGuidance: '1 serving for general hydration. 2–3 servings for heavy training days, hot weather, or low-carb diets. Look for formulas without excessive sugar. Add to water throughout the day.',
      defaultTiming: 'morning',
      defaultFrequency: 'daily',
    },
    {
      name: 'Multivitamin',
      category: 'health',
      description: 'Broad-spectrum micronutrient insurance covering potential dietary gaps.',
      typicalForms: ['capsule', 'tablet'],
      defaultForm: 'capsule',
      defaultUnit: 'serving',
      dosageLow: '1',
      dosageHigh: '1',
      dosageGuidance: '1 serving daily with food. Choose a quality brand with methylated B vitamins and chelated minerals. Not a replacement for a good diet. Most useful during caloric restriction.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
    {
      name: 'Berberine',
      category: 'health',
      description: 'Plant alkaloid supporting blood sugar regulation, cholesterol, and gut health. Often called "nature\'s metformin."',
      typicalForms: ['capsule'],
      defaultForm: 'capsule',
      defaultUnit: 'mg',
      dosageLow: '500',
      dosageHigh: '1500',
      dosageGuidance: '500 mg for mild blood sugar support. 1,000–1,500 mg split into 2–3 doses for metabolic optimization. Take with meals. May cause GI discomfort initially — start low.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'twice_daily',
    },
    {
      name: 'Digestive Enzymes',
      category: 'health',
      description: 'Blend of proteases, lipases, and amylases to improve nutrient breakdown and reduce bloating.',
      typicalForms: ['capsule'],
      defaultForm: 'capsule',
      defaultUnit: 'capsule',
      dosageLow: '1',
      dosageHigh: '2',
      dosageGuidance: '1 capsule with meals. 2 capsules with large or high-protein meals. Take at the start of meals. Most beneficial for those with digestive discomfort or eating large meals.',
      defaultTiming: 'with_meals',
      defaultFrequency: 'daily',
    },
  ];

  for (const entry of catalogEntries) {
    await prisma.supplementCatalog.upsert({
      where: { name: entry.name },
      update: {
        category: entry.category,
        description: entry.description,
        typicalForms: entry.typicalForms,
        defaultForm: entry.defaultForm,
        defaultUnit: entry.defaultUnit,
        dosageLow: entry.dosageLow,
        dosageHigh: entry.dosageHigh,
        dosageGuidance: entry.dosageGuidance,
        defaultTiming: entry.defaultTiming,
        defaultFrequency: entry.defaultFrequency,
      },
      create: entry,
    });
  }

  console.log(`✓ Supplement catalog seeded (${catalogEntries.length} entries)`);

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
