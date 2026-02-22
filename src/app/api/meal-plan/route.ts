import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getOpenAI, MEAL_PLAN_SYSTEM_PROMPT } from '@/lib/openai';

// Simple in-memory rate limit
const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute

// Compile a weekly grocery list from the plan
function compileGroceryList(days: any[]): { category: string; item: string }[] {
  const ingredientMap = new Map<string, { amount: number; unit: string }>();

  for (const day of days) {
    if (!Array.isArray(day.meals)) continue;
    for (const meal of day.meals) {
      if (!Array.isArray(meal.ingredients)) continue;
      for (const ing of meal.ingredients) {
        const name = (ing.name || '').toLowerCase().trim();
        if (!name) continue;
        const amount = parseFloat(ing.amount) || 0;
        const unit = (ing.unit || '').toLowerCase().trim();
        const key = `${name}|${unit}`;

        const existing = ingredientMap.get(key);
        if (existing) {
          existing.amount += amount;
        } else {
          ingredientMap.set(key, { amount, unit });
        }
      }
    }
  }

  const proteinKW = ['chicken', 'turkey', 'beef', 'steak', 'salmon', 'cod', 'tuna', 'shrimp', 'fish', 'egg white', 'egg', 'whey', 'pork', 'tilapia', 'ground meat'];
  const dairyKW = ['milk', 'yogurt', 'cheese', 'feta', 'mozzarella', 'cheddar', 'cottage', 'butter', 'cream'];
  const grainKW = ['rice', 'oat', 'quinoa', 'pasta', 'bread', 'tortilla', 'potato', 'sweet potato', 'noodle', 'wrap'];
  const produceKW = ['spinach', 'broccoli', 'banana', 'berr', 'avocado', 'onion', 'garlic', 'tomato', 'lettuce', 'pepper', 'cucumber', 'carrot', 'celery', 'mushroom', 'zucchini', 'asparagus', 'kale', 'apple', 'lemon', 'lime', 'ginger', 'cilantro', 'parsley', 'basil', 'green bean', 'corn', 'cabbage'];
  const oilKW = ['olive oil', 'coconut oil', 'cooking oil', 'oil', 'peanut butter', 'almond butter', 'almonds', 'walnuts', 'nuts', 'seeds'];

  function categorize(name: string): string {
    for (const kw of proteinKW) { if (name.includes(kw)) return 'Protein'; }
    for (const kw of dairyKW) { if (name.includes(kw)) return 'Dairy'; }
    for (const kw of grainKW) { if (name.includes(kw)) return 'Grains & Carbs'; }
    for (const kw of produceKW) { if (name.includes(kw)) return 'Produce'; }
    for (const kw of oilKW) { if (name.includes(kw)) return 'Oils & Fats'; }
    return 'Pantry';
  }

  const result: { category: string; item: string }[] = [];

  for (const [key, data] of ingredientMap) {
    const [name] = key.split('|');
    let displayAmount: string;
    if (data.amount >= 1000 && data.unit === 'g') {
      displayAmount = `${(data.amount / 1000).toFixed(1)} kg`;
    } else {
      displayAmount = `${Math.round(data.amount)} ${data.unit}`;
    }
    const label = name.charAt(0).toUpperCase() + name.slice(1);
    result.push({
      category: categorize(name),
      item: `${label} — ${displayAmount}`,
    });
  }

  result.sort((a, b) => a.category.localeCompare(b.category) || a.item.localeCompare(b.item));
  return result;
}

// Server-side: compute meal and day totals from per-ingredient macros
function computeMacroTotals(days: any[]): void {
  for (const day of days) {
    if (!Array.isArray(day.meals)) continue;

    const dayTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

    for (const meal of day.meals) {
      const mealTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };

      if (Array.isArray(meal.ingredients)) {
        for (const ing of meal.ingredients) {
          if (ing.macros) {
            mealTotals.calories += ing.macros.calories || 0;
            mealTotals.protein += ing.macros.protein || 0;
            mealTotals.carbs += ing.macros.carbs || 0;
            mealTotals.fat += ing.macros.fat || 0;
          }
        }
      }

      // Round to whole numbers
      mealTotals.calories = Math.round(mealTotals.calories);
      mealTotals.protein = Math.round(mealTotals.protein);
      mealTotals.carbs = Math.round(mealTotals.carbs);
      mealTotals.fat = Math.round(mealTotals.fat);

      meal.macro_totals = mealTotals;

      dayTotals.calories += mealTotals.calories;
      dayTotals.protein += mealTotals.protein;
      dayTotals.carbs += mealTotals.carbs;
      dayTotals.fat += mealTotals.fat;
    }

    day.day_totals = dayTotals;
  }
}

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

    const userPrompt = `Create a COMPLETE 7-day meal plan (Monday through Sunday — all 7 days). You MUST output all 7 days. Do not stop early.

CLIENT: ${onboarding.weightKg}kg (${weightLbs}lbs), ${onboarding.heightCm}cm, goal: ${onboarding.goal}. ${goalContext}

DAILY TARGETS — size portions so each day's ingredients roughly sum to:
${macros.calorieTarget} kcal | ${macros.proteinG}g protein | ${macros.carbsG}g carbs | ${macros.fatG}g fat
(Split across ${mealsPerDay} meals — each meal should be roughly even, but some variation is fine)

PREFERENCES: ${onboarding.dietType} diet, ${mealsPerDay} meals/day, cooking: ${onboarding.cookingSkill}, budget: ${onboarding.budget}${onboarding.dislikedFoods.length > 0 ? `, dislikes: ${onboarding.dislikedFoods.join(', ')}` : ''}${onboarding.allergies.length > 0 ? `, allergies: ${onboarding.allergies.join(', ')}` : ''}.

OUTPUT — valid JSON only. Every ingredient MUST have a "macros" object. Do NOT include "macro_totals" or "day_totals" — we calculate those server-side.
{"days":[{"day":"Monday","meals":[{"name":"Meal 1","recipe_title":"Chicken & Rice Bowl","ingredients":[{"name":"Chicken breast","amount":"200","unit":"g","macros":{"calories":330,"protein":62,"carbs":0,"fat":7.2}},{"name":"White rice, cooked","amount":"200","unit":"g","macros":{"calories":260,"protein":5.4,"carbs":56,"fat":0.6}},{"name":"Olive oil","amount":"10","unit":"ml","macros":{"calories":88,"protein":0,"carbs":0,"fat":10}},{"name":"Broccoli","amount":"100","unit":"g","macros":{"calories":34,"protein":2.8,"carbs":7,"fat":0.4}}],"instructions":["Season chicken with salt and pepper.","Heat olive oil in skillet over medium-high heat, cook chicken 5-6 min per side until internal temp reaches 165°F.","Steam broccoli for 4 minutes until bright green and tender-crisp.","Serve chicken sliced over rice with broccoli on the side."],"swap_options":[{"recipe_title":"Turkey & Rice Bowl","ingredients":[{"name":"Ground turkey 93%","amount":"200","unit":"g","macros":{"calories":286,"protein":39,"carbs":0,"fat":14.2}},{"name":"White rice, cooked","amount":"200","unit":"g","macros":{"calories":260,"protein":5.4,"carbs":56,"fat":0.6}},{"name":"Olive oil","amount":"5","unit":"ml","macros":{"calories":44,"protein":0,"carbs":0,"fat":5}},{"name":"Broccoli","amount":"100","unit":"g","macros":{"calories":34,"protein":2.8,"carbs":7,"fat":0.4}}],"instructions":["Brown turkey in skillet over medium heat, breaking apart, about 5-7 min.","Steam broccoli for 4 minutes.","Serve turkey over rice with broccoli."]}]}]}]}

RULES:
- EXACTLY 7 days, each with EXACTLY ${mealsPerDay} meals
- Every ingredient MUST have a "macros" object calculated from USDA data for that portion: (per-100g value × amount/100)
- Ensure every meal has a protein source, a carb source, and a fat source so macros are balanced
- List ALL ingredients — cooking fats, seasonings, sauces, liquids, binders, everything
- Instructions: 2-4 real cooking steps with heat levels, cook times, and technique
- 1 swap per meal — swap ingredients must also include per-ingredient macros
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

    // Server-side: compute macro totals from per-ingredient macros
    computeMacroTotals(planData.days);

    // Log computed totals
    console.log('=== SERVER-COMPUTED MACRO TOTALS ===');
    for (const day of planData.days) {
      const dt = day.day_totals;
      const diff = Math.abs(dt.calories - macros.calorieTarget) / macros.calorieTarget;
      console.log(`${day.day}: ${dt.calories} kcal | ${dt.protein}P | ${dt.carbs}C | ${dt.fat}F (target: ${macros.calorieTarget}, diff: ${Math.round(diff * 100)}%)`);
    }

    // Get current version
    const existing = await prisma.mealPlan.findFirst({
      where: { userId: targetUserId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = existing ? existing.version + 1 : 1;

    // Compile weekly grocery list
    const groceryList = compileGroceryList(planData.days);
    console.log(`Grocery list: ${groceryList.length} items`);

    const mealPlan = await prisma.mealPlan.create({
      data: {
        userId: targetUserId,
        version,
        planData: { days: planData.days },
        groceryList,
      },
    });

    return NextResponse.json({ success: true, mealPlan });
  } catch (error) {
    console.error('Meal plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
