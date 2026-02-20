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

    // Determine goal context for the prompt
    const goalContext = onboarding.goal === 'cut'
      ? `This client is CUTTING (fat loss). Calorie target is below TDEE. Prioritize high-protein, high-volume, satiating foods. Favor lean proteins, vegetables, and high-fiber carbs.`
      : onboarding.goal === 'bulk'
      ? `This client is BULKING (muscle gain). Calorie target is above TDEE. Include calorie-dense but nutritious foods. Carb-heavy around workouts.`
      : `This client is doing a RECOMPOSITION (maintain weight, improve body composition). Calorie target is near TDEE. Prioritize high protein intake and nutrient timing around workouts.`;

    const weightLbs = Math.round(onboarding.weightKg * 2.205);

    const userPrompt = `Create a 7-day meal plan for this client:

CLIENT BODY STATS:
- Weight: ${onboarding.weightKg} kg (${weightLbs} lbs)
- Goal: ${onboarding.goal} (${goalContext})
- Height: ${onboarding.heightCm} cm

DAILY MACRO TARGETS:
- Calories: ${macros.calorieTarget} kcal
- Protein: ${macros.proteinG}g (${Math.round(macros.proteinG / onboarding.weightKg * 10) / 10}g/kg bodyweight)
- Carbs: ${macros.carbsG}g
- Fat: ${macros.fatG}g
${macros.explanation ? `- Rationale: ${macros.explanation}` : ''}

CLIENT PREFERENCES:
- Diet type: ${onboarding.dietType}
- Disliked foods: ${onboarding.dislikedFoods.length > 0 ? onboarding.dislikedFoods.join(', ') : 'None'}
- Allergies: ${onboarding.allergies.length > 0 ? onboarding.allergies.join(', ') : 'None'}
- Meals per day: ${onboarding.mealsPerDay}
- Meal timing: ${onboarding.mealTimingWindow || 'Flexible'}
- Cooking skill: ${onboarding.cookingSkill}
- Budget: ${onboarding.budget}
- Restaurant frequency: ${onboarding.restaurantFrequency || 'Rarely'}

REQUIREMENTS:
- Each meal needs exactly 2 swap options. Swaps must match the original within ±5% protein and ±10% calories.
- Sum of all meal macros must equal day_totals within ±3%.
- Vary protein sources across meals — no single protein source in more than 2 meals per day.
- Use realistic portion sizes (1 can tuna = 142g, 1 large egg = 50g, 1 scoop whey = 30g).
- Include a consolidated grocery list organized by category.

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
      temperature: 0.4,
      max_tokens: 32000,
    });

    console.log('OpenAI finish_reason:', response.choices[0]?.finish_reason);
    console.log('OpenAI usage:', JSON.stringify(response.usage));

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('No content in OpenAI response');
      return NextResponse.json({ error: 'Failed to generate plan. Please try again.' }, { status: 500 });
    }

    // If the response was cut off, the JSON will be incomplete
    if (response.choices[0]?.finish_reason === 'length') {
      console.error('OpenAI response truncated — hit max_tokens limit');
      return NextResponse.json({ error: 'Plan generation was cut short. Please try again.' }, { status: 500 });
    }

    let planData;
    try {
      planData = JSON.parse(content);
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Raw content (first 500 chars):', content.substring(0, 500));
      return NextResponse.json({ error: 'Invalid response format. Please try again.' }, { status: 500 });
    }

    // Validate basic structure
    if (!planData.days || !Array.isArray(planData.days)) {
      console.error('Missing days array. Keys:', Object.keys(planData));
      return NextResponse.json({ error: 'Incomplete plan generated. Please try again.' }, { status: 500 });
    }

    if (planData.days.length !== 7) {
      console.error('Expected 7 days, got:', planData.days.length);
      return NextResponse.json({ error: 'Incomplete plan generated. Please try again.' }, { status: 500 });
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
