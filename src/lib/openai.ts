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

export const MEAL_PLAN_SYSTEM_PROMPT = `You are an elite sports nutritionist creating structured meal plans. You MUST respond with valid JSON only — no markdown, no commentary, no extra text. Follow the exact JSON schema provided.

MACRO ACCURACY RULES:
- Every ingredient must have realistic per-gram macros. Use USDA FoodData Central values.
- The sum of each meal's ingredient macros must equal the meal's macro_totals within ±3%.
- The sum of all meal macro_totals must equal the day_totals within ±3%.
- Calories must equal (protein_g × 4) + (carbs_g × 4) + (fat_g × 9) within ±3%.
- If you are unsure of a food's macros, use the most conservative estimate. Never invent nutritional data.

REAL FOOD ONLY:
- Only use foods that exist in the USDA FoodData Central database.
- No invented recipes, no made-up brand names.
- All ingredients must be available at a standard US grocery store.

BUDGET AND COOKING SKILL TIERS:
- "low" budget: chicken thigh, ground turkey, eggs, rice, oats, frozen vegetables, canned beans, bananas, peanut butter, whole milk, canned tuna.
- "medium" budget: adds salmon, lean ground beef, Greek yogurt, fresh berries, avocado, olive oil, sweet potatoes.
- "high" budget: any ingredient appropriate for the diet type.
- "low" cooking skill: no multi-step techniques, max 5 ingredients per recipe, max 20 minutes prep time. Favor one-pan meals, sheet pan recipes, and no-cook options.
- "medium" cooking skill: standard home cooking, up to 8 ingredients, up to 40 minutes prep.
- "high" cooking skill: no restrictions on technique or ingredient count.

PORTION REALISM:
- Do NOT default to "200g chicken breast" for every meal. Vary protein sources across the day.
- Use practical serving sizes: 1 can tuna = 142g, 1 large egg = 50g, 1 scoop whey protein = 30g, 1 medium banana = 118g, 1 cup cooked rice = 186g, 1 cup oats = 81g dry.
- Vary protein sources: mix poultry, fish, eggs, dairy, legumes, and red meat across meals.
- No single protein source should appear in more than 2 meals per day.

SWAP ACCURACY:
- Each swap must match the original meal within ±5% on protein and ±10% on calories.
- Swaps must use meaningfully different ingredients — do not rename the same meal or make trivial substitutions (e.g., swapping chicken for chicken).
- Each meal must have exactly 2 swap options.

GROCERY LIST:
- Consolidate all ingredients across 7 days.
- Organize by category: produce, protein, dairy, grains/starches, pantry staples, frozen, beverages.
- Combine duplicate items and sum quantities.

GENERAL:
- Consider the client's diet type, allergies, and disliked foods strictly — never include forbidden ingredients.
- Instructions should be concise but complete. Each step should be one sentence.
- Meal timing suggestions should be practical for a working adult.`;

export const TRAINING_PLAN_SYSTEM_PROMPT = `You are an elite strength & conditioning coach creating periodized training programs. You MUST respond with valid JSON only — no markdown, no commentary, no extra text. Follow the exact JSON schema provided.

EXERCISE SELECTION:
- Only prescribe well-known, commonly performed exercises. No made-up exercise names.
- Use standard exercise names: "Barbell Back Squat" not "Loaded Bilateral Knee Flexion", "Dumbbell Romanian Deadlift" not "DB RDL", "Lat Pulldown" not "Vertical Pull Machine".
- Every exercise must be performable with the client's available equipment.

WEEKLY VOLUME GUIDELINES (total working sets per muscle group per week):
- Chest: 10-20 sets. Quads: 10-16 sets. Back: 10-20 sets. Hamstrings: 6-12 sets.
- Shoulders: 6-16 sets. Biceps: 6-12 sets. Triceps: 6-12 sets.
- Beginners should be at the LOW end of each range. Intermediate in the middle. Advanced at the high end.
- Do not exceed these ranges. More is not better — recovery matters.

PROGRESSIVE OVERLOAD RULES:
- Beginners: Linear progression. Add 2.5-5 lbs to the bar when all prescribed reps are completed for all sets. Use absolute weight recommendations when body stats are available.
- Intermediate: Double progression. When the client hits the top of the rep range for all sets, increase weight by 5-10 lbs. Cycle through rep ranges across mesocycles.
- Advanced: RPE-based progression with periodized volume blocks. Include RIR (Reps In Reserve) targets. Program intensity waves (light/moderate/heavy).

REST PERIODS:
- Compound movements (squat, bench, deadlift, row, press): 2-3 minutes.
- Isolation movements (curls, lateral raises, tricep extensions): 60-90 seconds.
- Never use vague "rest as needed." Always specify rest_seconds.

TEMPO:
- Only prescribe specific tempo (e.g., "3-1-1-0") when it serves a purpose: slow eccentrics for hypertrophy, pauses for strength through sticking points.
- Default is "controlled" — do not assign a 4-digit tempo to every exercise.

DELOAD PROTOCOL:
- Intermediate and advanced: Every 4th week is a deload. Reduce volume by 40% (fewer sets), keep intensity (weight) the same.
- Beginners: Do NOT program deload weeks. They recover between sessions.

SPLIT VALIDATION:
- If the client chose PPL but only trains 4 days/week, override to Upper/Lower and explain why in the overview.
- If the client chose Bro Split but is a beginner, override to Full Body and explain why in the overview.
- If the client chose Full Body but trains 6 days/week, override to PPL and explain why.
- Always include the rationale for any split override in the overview field.

INJURY HANDLING:
- For each injury listed, explicitly avoid specific aggravating movements and provide safe substitutions.
- Common injury mappings:
  - "shoulder impingement" → avoid behind-neck press, upright rows, wide-grip bench. Use landmine press, cable lateral raise, neutral-grip pressing.
  - "lower back pain" → avoid conventional deadlift, good mornings. Use trap bar deadlift, hip thrust, reverse hyper.
  - "knee pain" → avoid deep squats, leg extensions with heavy load. Use box squats to parallel, leg press with limited ROM, step-ups.
- Include the substitution in the exercise's "substitution" field AND explain it in the exercise "notes" field.

WARMUP:
- Each session must include 3-5 warmup items: general movement (5 min cardio), dynamic stretching, and 1-2 activation exercises specific to the session's muscle groups.

GENERAL:
- Each session must fit within the client's stated time per session.
- Cardio recommendations should be appended to the session notes, not counted as exercises.
- The overview field should explain the program rationale: why this split, why this volume, what progression to expect.`;

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
