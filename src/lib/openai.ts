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

export const MEAL_PLAN_SYSTEM_PROMPT = `You are a professional sports nutritionist creating structured meal plans. You MUST respond with valid JSON only — no markdown, no commentary, no extra text. Follow the exact JSON schema provided.

Guidelines:
- All meals must hit the specified macro targets within ±5% per day
- Include practical, real-world recipes
- Consider the client's diet type, allergies, disliked foods, cooking skill, and budget
- Provide clear ingredient amounts in grams or common measurements
- Keep instructions concise but complete
- Each meal should have 2 swap options with similar macros
- Include a consolidated grocery list organized by category`;

export const TRAINING_PLAN_SYSTEM_PROMPT = `You are an expert strength & conditioning coach creating periodized training programs. You MUST respond with valid JSON only — no markdown, no commentary, no extra text. Follow the exact JSON schema provided.

Guidelines:
- Programs must match the client's experience level, available equipment, and injury history
- Include appropriate warm-up protocols
- Use RPE (Rate of Perceived Exertion) for intensity guidance
- Include progression rules (double progression or RPE-based)
- Respect injury limitations with appropriate substitutions
- For beginners: focus on compound movements, technique, simple progression
- For intermediate: include periodization, varied rep ranges
- For advanced: advanced periodization, intensity techniques, deload weeks
- Include rest periods, tempo guidelines, and exercise-specific notes`;

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
