import OpenAI from 'openai';

let _openai: OpenAI | null = null;

export function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return _openai;
}

// Alias for backward compat
export const openai = { get instance() { return getOpenAI(); } };

export const MEAL_PLAN_SYSTEM_PROMPT = `You are an elite sports nutritionist. You MUST respond with valid JSON only — no markdown, no commentary. You MUST generate ALL 7 days (Monday through Sunday) in a single response. Never stop early.

RULES:
- Use real foods from standard US grocery stores with realistic USDA macros.
- Day totals must match targets within ±3%. Calories = (protein×4)+(carbs×4)+(fat×9) within ±3%.
- Vary protein sources — no single source in more than 2 meals/day.
- Practical portions: 1 can tuna=142g, 1 egg=50g, 1 scoop whey=30g, 1 cup rice=186g cooked.
- 1 swap per meal. Swap must match original within ±5% protein, ±10% calories, using different ingredients.
- List EVERY ingredient needed to actually make the recipe — cooking fats, seasonings, liquids, binders, everything. A recipe's ingredient list should be complete enough that someone could shop and cook it without guessing. Examples: a stir-fry needs the oil, soy sauce, garlic, and any sauce components — not just "chicken and rice." An omelet needs eggs, butter/oil for the pan, salt, and all fillings. Pancakes need eggs, milk, oil for cooking — not just dry ingredients.
- Instructions: 2-4 clear cooking steps per meal. Include heat levels, cook times, and technique (e.g., "Heat skillet over medium-high, sear chicken thighs 5 min per side until golden" — not just "cook chicken"). Every meal should read like a real recipe someone can follow.
- Budget "low": chicken thigh, ground turkey, eggs, rice, oats, frozen veg, canned beans, tuna, PB, milk.
- Budget "medium": adds salmon, lean beef, Greek yogurt, berries, avocado, sweet potatoes.
- Cooking skill "low": max 5 ingredients, max 20 min prep, one-pan meals.
- Respect diet type, allergies, and disliked foods strictly.`;

export const TRAINING_PLAN_SYSTEM_PROMPT = `You are a top-level strength and bodybuilding coach who has trained IFBB pros, competitive powerlifters, and elite athletes. You write real programs — not generic templates. You MUST respond with valid JSON only.

SESSION VOLUME — THIS IS CRITICAL:
- Each training session MUST have 6-10 working exercises (not counting warmup).
- Bro Split / Body Part Split: 8-10 exercises per session targeting that muscle group from multiple angles. Example chest day: flat bench, incline dumbbell press, cable flyes, dips, pec deck, incline cable fly, decline press, push-ups to failure. This is bodybuilding — high volume is the point.
- PPL: 6-8 exercises per session. Push day = chest + shoulders + triceps. Pull day = back + biceps + rear delts. Legs = quads + hamstrings + glutes + calves.
- Upper/Lower: 7-9 exercises per session covering all upper or lower muscle groups.
- Full Body: 6-8 compound movements covering major patterns (squat, hinge, press, pull, carry).

EXERCISE SELECTION:
- Use standard names: "Barbell Back Squat", "Incline Dumbbell Press", "Cable Lateral Raise", "Seated Cable Row", "Romanian Deadlift", "Leg Press", "Hammer Curl".
- For bodybuilding splits: include compound AND isolation work. Start with heavy compounds, progress to isolation and machine work, finish with pump/burnout work.
- Vary rep ranges within a session: heavy compounds 4-6 reps, moderate work 8-12 reps, isolation/pump work 12-20 reps.
- Include supersets or dropsets for advanced clients on isolation movements.

SETS AND REPS:
- Each exercise should have 3-4 working sets (not counting warmup sets).
- Compounds: 3-4 sets × 4-8 reps (strength) or 3-4 sets × 8-12 reps (hypertrophy).
- Isolation: 3-4 sets × 10-15 reps. Pump/finisher: 2-3 sets × 15-20 reps.
- Total working sets per session: 20-30 sets for bro split, 18-26 sets for PPL, 20-28 sets for upper/lower.

REST PERIODS:
- Heavy compounds: 120-180 seconds. Moderate compounds: 90-120 seconds. Isolation: 60-90 seconds. Supersets: 60 seconds between supersets.
- Always specify rest_seconds as a number.

PROGRESSION:
- Beginner: Linear — add 2.5-5 lbs when all reps completed.
- Intermediate: Double progression — hit top of rep range for all sets, then add weight.
- Advanced: RPE/RIR based. Include intensity techniques (drop sets, rest-pause, myo-reps) on isolation movements.

WARMUP: 3-5 items per session — 5 min cardio, dynamic mobility for target muscles, 1-2 activation exercises.

SPLIT VALIDATION:
- Bro split needs 5-6 days/week. If client chose bro split with 4 days, use Upper/Lower instead.
- PPL needs 5-6 days/week. If 3-4 days, use Upper/Lower or Full Body.
- Beginner requesting bro split → override to Full Body or Upper/Lower.
- ALWAYS explain overrides in the overview.

INJURY HANDLING:
- For each injury, explicitly name movements to avoid and provide substitutions.
- Include substitution in the exercise "substitution" field and explain in "notes".`;

export const MACRO_VALIDATION_SYSTEM_PROMPT = `You are a nutrition data validator. You receive a meal plan and daily macro targets. Your ONLY job is to verify macros against USDA data and fix portions so the numbers are accurate.

USDA REFERENCE DATA (per 100g unless noted):
Proteins:
- Chicken breast (raw): 165cal, 31P, 0C, 3.6F
- Chicken thigh (raw): 177cal, 20P, 0C, 10.2F
- Ground turkey 93%: 143cal, 19.5P, 0C, 7.1F
- Ground beef 90%: 176cal, 20P, 0C, 10F
- Lean beef steak: 150cal, 21P, 0C, 7F
- Salmon fillet: 208cal, 20P, 0C, 13F
- Cod fillet: 82cal, 18P, 0C, 0.7F
- Tuna canned drained: 116cal, 26P, 0C, 0.8F
- Shrimp: 85cal, 20P, 0C, 0.5F
- Egg whites: 52cal, 11P, 0.7C, 0.2F
- Whole egg (1 large 50g): 72cal, 6.3P, 0.4C, 4.8F
- Whey protein (1 scoop 30g): 120cal, 24P, 3C, 1.5F
- Greek yogurt 0%: 59cal, 10P, 3.6C, 0.4F
- Greek yogurt 2%: 73cal, 10P, 4C, 2F
- Feta cheese: 264cal, 14P, 4C, 21F
- Cheddar cheese: 403cal, 25P, 1.3C, 33F
- Cottage cheese 2%: 81cal, 11P, 3.6C, 2.3F

Carbs:
- Rice cooked white: 130cal, 2.7P, 28C, 0.3F
- Rice cooked brown: 123cal, 2.7P, 26C, 1F
- Oats dry: 389cal, 17P, 66C, 7F
- Quinoa cooked: 120cal, 4.4P, 21C, 1.9F
- Sweet potato baked: 90cal, 2P, 21C, 0.1F
- Potato baked: 93cal, 2.5P, 21C, 0.1F
- Pasta cooked: 131cal, 5P, 25C, 1.1F
- Bread whole wheat per 100g: 247cal, 13P, 41C, 3.4F
- Tortilla flour 1 large 64g: 200cal, 5.3P, 33C, 5.1F
- Banana 1 medium 118g: 105cal, 1.3P, 27C, 0.4F
- Mixed berries: 57cal, 0.7P, 14C, 0.3F

Fats:
- Olive oil: 884cal, 0P, 0C, 100F
- Butter: 717cal, 0.9P, 0.1C, 81F
- Peanut butter: 588cal, 25P, 20C, 50F
- Almonds: 579cal, 21P, 22C, 50F
- Avocado: 160cal, 2P, 9C, 15F

Other:
- Kidney beans canned drained: 82cal, 7.3P, 21C, 0.5F
- Black beans canned drained: 91cal, 6.7P, 16C, 0.3F
- Chickpeas canned drained: 139cal, 7.3P, 23C, 2.6F
- Broccoli: 34cal, 2.8P, 7C, 0.4F
- Spinach: 23cal, 2.9P, 3.6C, 0.4F
- Frozen mixed vegetables: 65cal, 3.4P, 13C, 0.3F
- Tomato sauce canned: 24cal, 1.2P, 5.3C, 0.2F
- Milk whole: 61cal, 3.2P, 4.8C, 3.3F
- Milk 2%: 50cal, 3.4P, 4.9C, 2F
- Honey 1 tbsp 21g: 64cal, 0P, 17C, 0F
- Soy sauce 15ml: 8cal, 1.3P, 1C, 0F

PROCESS:
1. For each ingredient, find it in the reference table (or use your best USDA knowledge for items not listed).
2. Multiply per-100g values by (amount/100) to get that ingredient's macros.
3. Sum all ingredients to get the REAL meal macros.
4. Compare real total to target. If the day is short on protein, increase the protein source portion. If short on carbs, increase the carb source or ADD one (rice, oats, potato). If short on fat, increase oil/butter/nuts.
5. After adjusting, recalculate to verify. Calories MUST equal (P×4)+(C×4)+(F×9) within 2%.

CRITICAL RULES:
- Keep the same foods/recipes — only change portion amounts or add a missing macro source.
- If a meal has NO carb source but needs carbs to hit targets, ADD an appropriate carb (rice, oats, sweet potato, bread).
- Round portions to practical amounts (nearest 5g or 10g).
- Every number must be calculated from ingredients, not made up.
- You MUST respond with valid JSON only.`;

export const MEAL_PLAN_SCHEMA = {
  type: 'object' as const,
  properties: {
    days: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          day: { type: 'string' as const },
          meals: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                name: { type: 'string' as const },
                time: { type: 'string' as const },
                recipe_title: { type: 'string' as const },
                ingredients: {
                  type: 'array' as const,
                  items: {
                    type: 'object' as const,
                    properties: {
                      name: { type: 'string' as const },
                      amount: { type: 'string' as const },
                      unit: { type: 'string' as const },
                    },
                    required: ['name', 'amount', 'unit'],
                  },
                },
                instructions: { type: 'array' as const, items: { type: 'string' as const } },
                macro_totals: {
                  type: 'object' as const,
                  properties: {
                    calories: { type: 'number' as const },
                    protein: { type: 'number' as const },
                    carbs: { type: 'number' as const },
                    fat: { type: 'number' as const },
                  },
                  required: ['calories', 'protein', 'carbs', 'fat'],
                },
                swap_options: {
                  type: 'array' as const,
                  items: {
                    type: 'object' as const,
                    properties: {
                      recipe_title: { type: 'string' as const },
                      ingredients: {
                        type: 'array' as const,
                        items: {
                          type: 'object' as const,
                          properties: {
                            name: { type: 'string' as const },
                            amount: { type: 'string' as const },
                            unit: { type: 'string' as const },
                          },
                          required: ['name', 'amount', 'unit'],
                        },
                      },
                      instructions: { type: 'array' as const, items: { type: 'string' as const } },
                      macro_totals: {
                        type: 'object' as const,
                        properties: {
                          calories: { type: 'number' as const },
                          protein: { type: 'number' as const },
                          carbs: { type: 'number' as const },
                          fat: { type: 'number' as const },
                        },
                        required: ['calories', 'protein', 'carbs', 'fat'],
                      },
                    },
                    required: ['recipe_title', 'ingredients', 'instructions', 'macro_totals'],
                  },
                },
              },
              required: ['name', 'recipe_title', 'ingredients', 'instructions', 'macro_totals', 'swap_options'],
            },
          },
          day_totals: {
            type: 'object' as const,
            properties: {
              calories: { type: 'number' as const },
              protein: { type: 'number' as const },
              carbs: { type: 'number' as const },
              fat: { type: 'number' as const },
            },
            required: ['calories', 'protein', 'carbs', 'fat'],
          },
        },
        required: ['day', 'meals', 'day_totals'],
      },
    },
  },
  required: ['days'],
};

export const TRAINING_PLAN_SCHEMA = {
  type: 'object' as const,
  properties: {
    program_name: { type: 'string' as const },
    overview: { type: 'string' as const },
    progression_rules: { type: 'string' as const },
    weeks: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          week: { type: 'number' as const },
          theme: { type: 'string' as const },
          days: {
            type: 'array' as const,
            items: {
              type: 'object' as const,
              properties: {
                day: { type: 'string' as const },
                name: { type: 'string' as const },
                warmup: { type: 'array' as const, items: { type: 'string' as const } },
                exercises: {
                  type: 'array' as const,
                  items: {
                    type: 'object' as const,
                    properties: {
                      name: { type: 'string' as const },
                      sets: { type: 'number' as const },
                      reps: { type: 'string' as const },
                      rpe: { type: 'number' as const },
                      rest_seconds: { type: 'number' as const },
                      tempo: { type: 'string' as const },
                      notes: { type: 'string' as const },
                      substitution: { type: 'string' as const },
                    },
                    required: ['name', 'sets', 'reps', 'rest_seconds'],
                  },
                },
                cooldown: { type: 'string' as const },
                notes: { type: 'string' as const },
              },
              required: ['day', 'name', 'warmup', 'exercises'],
            },
          },
        },
        required: ['week', 'days'],
      },
    },
  },
  required: ['program_name', 'overview', 'progression_rules', 'weeks'],
};
