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

    const mealsPerDay = onboarding.mealsPerDay;
    const calPerMeal = Math.round(macros.calorieTarget / mealsPerDay);
    const protPerMeal = Math.round(macros.proteinG / mealsPerDay);
    const carbsPerMeal = Math.round(macros.carbsG / mealsPerDay);
    const fatPerMeal = Math.round(macros.fatG / mealsPerDay);

    const userPrompt = `Create a COMPLETE 7-day meal plan (Monday through Sunday — all 7 days). You MUST output all 7 days. Do not stop early.

CLIENT: ${onboarding.weightKg}kg (${weightLbs}lbs), ${onboarding.heightCm}cm, goal: ${onboarding.goal}. ${goalContext}

DAILY TARGETS (MANDATORY — each day MUST hit these):
- Total: ${macros.calorieTarget} kcal | ${macros.proteinG}g protein | ${macros.carbsG}g carbs | ${macros.fatG}g fat
- Per meal average (${mealsPerDay} meals): ~${calPerMeal} kcal | ~${protPerMeal}g protein | ~${carbsPerMeal}g carbs | ~${fatPerMeal}g fat

PREFERENCES: ${onboarding.dietType} diet, ${mealsPerDay} meals/day, cooking: ${onboarding.cookingSkill}, budget: ${onboarding.budget}${onboarding.dislikedFoods.length > 0 ? `, dislikes: ${onboarding.dislikedFoods.join(', ')}` : ''}${onboarding.allergies.length > 0 ? `, allergies: ${onboarding.allergies.join(', ')}` : ''}.

CALORIE MATH CHECK — do this for every meal before outputting:
1. Add up: (protein × 4) + (carbs × 4) + (fat × 9) = calories
2. Each meal should be close to ${calPerMeal} kcal. Some meals can be higher/lower but the day total MUST be within 3% of ${macros.calorieTarget}.
3. If your day total is under, increase portion sizes. If over, decrease them. Do NOT just set day_totals to the target — the actual meal macros must add up.

OUTPUT — valid JSON only:
{"days":[{"day":"Monday","meals":[{"name":"Meal 1","recipe_title":"...","ingredients":[{"name":"...","amount":"150","unit":"g"}],"instructions":["..."],"macro_totals":{"calories":${calPerMeal},"protein":${protPerMeal},"carbs":${carbsPerMeal},"fat":${fatPerMeal}},"swap_options":[{"recipe_title":"...","ingredients":[{"name":"...","amount":"150","unit":"g"}],"instructions":["..."],"macro_totals":{"calories":${calPerMeal},"protein":${protPerMeal},"carbs":${carbsPerMeal},"fat":${fatPerMeal}}}]}],"day_totals":{"calories":${macros.calorieTarget},"protein":${macros.proteinG},"carbs":${macros.carbsG},"fat":${macros.fatG}}}]}

RULES:
- EXACTLY 7 days, each with EXACTLY ${mealsPerDay} meals
- List ALL ingredients needed to make the recipe — cooking fats, seasonings, sauces, liquids, binders, everything. Every recipe must be complete enough to shop for and cook without guessing. Examples: a stir-fry needs oil, soy sauce, garlic, ginger — not just "chicken and vegetables." Baked salmon needs olive oil, lemon, salt, pepper, herbs. Pancakes need eggs, milk, cooking oil — not just the dry mix.
- Every ingredient needs an exact numeric amount + unit (g, oz, cups, tbsp, tsp, count). No vague amounts.
- Instructions must be real cooking steps with heat levels, cook times, and technique (e.g., "Sear salmon in olive oil over medium-high heat, 4 min per side" — not just "cook salmon"). Each meal should read like a real recipe.
- 1 swap per meal (same complete ingredient list)
- Day totals = sum of meal macros, within 3% of ${macros.calorieTarget} kcal
- Vary protein sources across the day`;

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

    // Validate calorie totals — sum actual meal macros per day
    for (const day of planData.days) {
      if (!Array.isArray(day.meals)) continue;
      const actualCals = day.meals.reduce((sum: number, m: any) => sum + (m.macro_totals?.calories || 0), 0);
      const target = macros.calorieTarget;
      const diff = Math.abs(actualCals - target) / target;
      console.log(`${day.day}: ${actualCals} kcal (target: ${target}, diff: ${Math.round(diff * 100)}%)`);
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
