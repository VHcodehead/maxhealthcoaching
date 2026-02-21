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

    const userPrompt = `Create a COMPLETE 7-day meal plan (Monday through Sunday — all 7 days) for this client. You MUST output all 7 days in the "days" array. Do not stop early.

CLIENT STATS: ${onboarding.weightKg}kg (${weightLbs}lbs), ${onboarding.heightCm}cm, goal: ${onboarding.goal}. ${goalContext}

DAILY TARGETS: ${macros.calorieTarget}kcal, ${macros.proteinG}g protein, ${macros.carbsG}g carbs, ${macros.fatG}g fat.

PREFERENCES: ${onboarding.dietType} diet, ${onboarding.mealsPerDay} meals/day, cooking skill: ${onboarding.cookingSkill}, budget: ${onboarding.budget}${onboarding.dislikedFoods.length > 0 ? `, dislikes: ${onboarding.dislikedFoods.join(', ')}` : ''}${onboarding.allergies.length > 0 ? `, allergies: ${onboarding.allergies.join(', ')}` : ''}.

OUTPUT FORMAT — valid JSON, no markdown:
{
  "days": [
    {
      "day": "Monday",
      "meals": [
        {
          "name": "Meal 1",
          "recipe_title": "Chicken & Rice Bowl",
          "ingredients": [{"name": "chicken breast", "amount": "150", "unit": "g"}],
          "instructions": ["Cook chicken", "Serve over rice"],
          "macro_totals": {"calories": 500, "protein": 40, "carbs": 50, "fat": 12},
          "swap_options": [{"recipe_title": "Turkey & Rice Bowl", "ingredients": [{"name": "ground turkey", "amount": "150", "unit": "g"}], "instructions": ["Brown turkey", "Serve over rice"], "macro_totals": {"calories": 490, "protein": 38, "carbs": 50, "fat": 13}}]
        }
      ],
      "day_totals": {"calories": ${macros.calorieTarget}, "protein": ${macros.proteinG}, "carbs": ${macros.carbsG}, "fat": ${macros.fatG}}
    }
  ]
}

RULES:
- EXACTLY 7 days (Monday-Sunday), each with ${onboarding.mealsPerDay} meals
- 1 swap option per meal
- 2-3 ingredients per meal, 1-2 instruction steps — keep it concise
- Day totals must be within 3% of targets
- Vary protein sources across the day
- Output ONLY the JSON object, nothing else`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: MEAL_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 16384,
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
        groceryList: [],
      },
    });

    return NextResponse.json({ success: true, mealPlan });
  } catch (error) {
    console.error('Meal plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
