import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getOpenAI, MEAL_PLAN_SYSTEM_PROMPT, MEAL_PLAN_SCHEMA } from '@/lib/openai';

// Simple in-memory rate limit
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit
    const lastCall = rateLimitMap.get(session.user.id);
    if (lastCall && Date.now() - lastCall < RATE_LIMIT_WINDOW) {
      return NextResponse.json({ error: 'Please wait before generating another plan' }, { status: 429 });
    }
    rateLimitMap.set(session.user.id, Date.now());

    // Check if called by coach for a specific user
    const body = await request.json().catch(() => ({}));
    const targetUserId = body.user_id || session.user.id;

    // Get onboarding data
    const onboarding = await prisma.onboardingResponse.findFirst({
      where: { userId: targetUserId },
      orderBy: { version: 'desc' },
    });

    if (!onboarding) {
      return NextResponse.json({ error: 'No onboarding data found' }, { status: 404 });
    }

    // Get macro targets
    const macros = await prisma.macroTarget.findFirst({
      where: { userId: targetUserId },
      orderBy: { version: 'desc' },
    });

    if (!macros) {
      return NextResponse.json({ error: 'No macro targets found. Generate macros first.' }, { status: 404 });
    }

    const userPrompt = `Create a 7-day meal plan for this client:

DAILY MACRO TARGETS:
- Calories: ${macros.calorieTarget} kcal
- Protein: ${macros.proteinG}g
- Carbs: ${macros.carbsG}g
- Fat: ${macros.fatG}g

CLIENT PREFERENCES:
- Diet type: ${onboarding.dietType}
- Disliked foods: ${onboarding.dislikedFoods.length > 0 ? onboarding.dislikedFoods.join(', ') : 'None'}
- Allergies: ${onboarding.allergies.length > 0 ? onboarding.allergies.join(', ') : 'None'}
- Meals per day: ${onboarding.mealsPerDay}
- Meal timing: ${onboarding.mealTimingWindow || 'Flexible'}
- Cooking skill: ${onboarding.cookingSkill}
- Budget: ${onboarding.budget}
- Restaurant frequency: ${onboarding.restaurantFrequency || 'Rarely'}

Each meal needs 2 swap options with similar macros.
Include a grocery list organized by category (produce, protein, dairy, grains, pantry, etc).

Respond with ONLY valid JSON matching this schema: ${JSON.stringify(MEAL_PLAN_SCHEMA)}

Add a "grocery_list" array at the top level with objects: { "category": string, "items": [{ "name": string, "amount": string }] }

The complete response JSON should be: { "days": [...], "grocery_list": [...] }`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: MEAL_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 16000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    let planData;
    try {
      planData = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

    // Validate basic structure
    if (!planData.days || !Array.isArray(planData.days) || planData.days.length !== 7) {
      return NextResponse.json({ error: 'AI generated incomplete plan' }, { status: 500 });
    }

    // Get current version
    const existing = await prisma.mealPlan.findFirst({
      where: { userId: targetUserId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = existing ? existing.version + 1 : 1;

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: targetUserId,
        version,
        planData: { days: planData.days },
        groceryList: planData.grocery_list || [],
      },
    });

    return NextResponse.json({ success: true, mealPlan });
  } catch (error) {
    console.error('Meal plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
