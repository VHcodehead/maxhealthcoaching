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
- Keep instructions to 1-2 short steps. Keep ingredients to 2-4 per meal.
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
