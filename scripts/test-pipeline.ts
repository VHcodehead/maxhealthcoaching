/**
 * E2E Test Script for Meal Plan & Training Plan Pipelines
 *
 * Usage:
 *   npx tsx scripts/test-pipeline.ts --mock    # Uses saved fixtures (free)
 *   npx tsx scripts/test-pipeline.ts --live    # Calls OpenAI (~$1-2)
 *   npx tsx scripts/test-pipeline.ts           # Defaults to --mock
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env.local (Next.js convention) then .env as fallback
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

import OpenAI from 'openai';
import {
  MEAL_PLAN_SYSTEM_PROMPT,
  MEAL_PLAN_SCHEMA,
  TRAINING_PLAN_SYSTEM_PROMPT,
  TRAINING_PLAN_SCHEMA,
} from '../src/lib/openai';
import { correctIngredientMacros, scaleDayToTarget } from '../src/lib/usda';
import { computeMacroTotals } from '../src/lib/meal-plan-utils';

// ── Types ──────────────────────────────────────────────────────────────

interface TestProfile {
  name: string;
  onboarding: {
    weightKg: number;
    heightCm: number;
    age: number;
    sex: 'male' | 'female';
    goal: 'cut' | 'bulk' | 'recomp';
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    dietType: string;
    allergies: string[];
    mealsPerDay: number;
    cookingSkill: string;
    budget: string;
    workoutFrequency: number;
    workoutLocation: 'gym' | 'home';
    homeEquipment: string[];
    splitPreference: string;
    timePerSession: number;
    cardioPreference: string;
    planDurationWeeks: number;
    injuries: string[];
    injuryNotes: string;
    bodyFatPercentage?: number;
    dislikedFoods: string[];
  };
  macros: {
    calorieTarget: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
  };
}

interface ValidationResult {
  pass: boolean;
  message: string;
}

// ── Test Profiles ──────────────────────────────────────────────────────

const TEST_PROFILES: TestProfile[] = [
  {
    name: 'Omnivore Cut',
    onboarding: {
      weightKg: 90, heightCm: 178, age: 28, sex: 'male', goal: 'cut',
      experienceLevel: 'intermediate', dietType: 'standard', allergies: [],
      mealsPerDay: 4, cookingSkill: 'medium', budget: 'medium',
      workoutFrequency: 5, workoutLocation: 'gym', homeEquipment: [],
      splitPreference: 'ppl', timePerSession: 60, cardioPreference: 'moderate',
      planDurationWeeks: 8, injuries: [], injuryNotes: '',
      bodyFatPercentage: 20, dislikedFoods: [],
    },
    macros: { calorieTarget: 2200, proteinG: 180, carbsG: 220, fatG: 62 },
  },
  {
    name: 'Vegetarian Maintenance',
    onboarding: {
      weightKg: 65, heightCm: 165, age: 32, sex: 'female', goal: 'recomp',
      experienceLevel: 'beginner', dietType: 'vegetarian', allergies: [],
      mealsPerDay: 3, cookingSkill: 'high', budget: 'medium',
      workoutFrequency: 3, workoutLocation: 'gym', homeEquipment: [],
      splitPreference: 'full_body', timePerSession: 45, cardioPreference: 'light',
      planDurationWeeks: 4, injuries: [], injuryNotes: '',
      bodyFatPercentage: 25, dislikedFoods: [],
    },
    macros: { calorieTarget: 1800, proteinG: 130, carbsG: 200, fatG: 53 },
  },
  {
    name: 'Omnivore Bulk',
    onboarding: {
      weightKg: 75, heightCm: 183, age: 22, sex: 'male', goal: 'bulk',
      experienceLevel: 'advanced', dietType: 'standard', allergies: [],
      mealsPerDay: 5, cookingSkill: 'medium', budget: 'high',
      workoutFrequency: 6, workoutLocation: 'gym', homeEquipment: [],
      splitPreference: 'ppl', timePerSession: 75, cardioPreference: 'none',
      planDurationWeeks: 12, injuries: [], injuryNotes: '',
      bodyFatPercentage: 12, dislikedFoods: [],
    },
    macros: { calorieTarget: 3200, proteinG: 200, carbsG: 380, fatG: 89 },
  },
  {
    name: 'Vegetarian Cut',
    onboarding: {
      weightKg: 80, heightCm: 175, age: 30, sex: 'male', goal: 'cut',
      experienceLevel: 'intermediate', dietType: 'vegetarian', allergies: [],
      mealsPerDay: 4, cookingSkill: 'medium', budget: 'low',
      workoutFrequency: 4, workoutLocation: 'gym', homeEquipment: [],
      splitPreference: 'upper_lower', timePerSession: 60, cardioPreference: 'moderate',
      planDurationWeeks: 8, injuries: ['knee pain'], injuryNotes: 'Mild left knee',
      bodyFatPercentage: 22, dislikedFoods: ['mushroom'],
    },
    macros: { calorieTarget: 2000, proteinG: 160, carbsG: 200, fatG: 56 },
  },
  {
    name: 'Omnivore Recomp (Home Gym)',
    onboarding: {
      weightKg: 70, heightCm: 170, age: 35, sex: 'female', goal: 'recomp',
      experienceLevel: 'intermediate', dietType: 'standard', allergies: [],
      mealsPerDay: 3, cookingSkill: 'low', budget: 'low',
      workoutFrequency: 4, workoutLocation: 'home',
      homeEquipment: ['dumbbells', 'bands', 'pull-up bar'],
      splitPreference: 'upper_lower', timePerSession: 45, cardioPreference: 'light',
      planDurationWeeks: 4, injuries: [], injuryNotes: '',
      bodyFatPercentage: 28, dislikedFoods: [],
    },
    macros: { calorieTarget: 1700, proteinG: 130, carbsG: 170, fatG: 50 },
  },
  {
    name: 'Omnivore Bulk (Dairy Allergy)',
    onboarding: {
      weightKg: 85, heightCm: 180, age: 25, sex: 'male', goal: 'bulk',
      experienceLevel: 'intermediate', dietType: 'standard',
      allergies: ['dairy', 'lactose'],
      mealsPerDay: 4, cookingSkill: 'medium', budget: 'medium',
      workoutFrequency: 5, workoutLocation: 'gym', homeEquipment: [],
      splitPreference: 'bro_split', timePerSession: 60, cardioPreference: 'none',
      planDurationWeeks: 8, injuries: [], injuryNotes: '',
      bodyFatPercentage: 15, dislikedFoods: [],
    },
    macros: { calorieTarget: 3000, proteinG: 190, carbsG: 350, fatG: 83 },
  },
];

// ── Helpers ────────────────────────────────────────────────────────────

const FIXTURES_DIR = path.join(__dirname, 'fixtures');

function fixturePathMeal(name: string): string {
  return path.join(FIXTURES_DIR, `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_meal.json`);
}

function fixturePathTraining(name: string): string {
  return path.join(FIXTURES_DIR, `${name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_training.json`);
}

function log(msg: string) {
  console.log(`  ${msg}`);
}

function logResult(r: ValidationResult) {
  console.log(`    ${r.pass ? '✓' : '✗'} ${r.message}`);
}

// ── Meal Plan Generation ───────────────────────────────────────────────

async function generateMealPlan(
  profile: TestProfile,
  openai: OpenAI
): Promise<any> {
  const { onboarding, macros } = profile;

  const isVegetarian = ['vegetarian', 'vegan'].includes(onboarding.dietType.toLowerCase());
  const proteinPerMeal = Math.round(macros.proteinG / onboarding.mealsPerDay);
  const weightLbs = Math.round(onboarding.weightKg * 2.205);

  // For 5+ meals/day, generate 2 template days to avoid 16384-token truncation
  const useTemplateDays = onboarding.mealsPerDay >= 5;
  const daysToGenerate = useTemplateDays ? 2 : 7;

  const goalContext = onboarding.goal === 'cut'
    ? 'CUTTING — high protein, satiating, lean foods.'
    : onboarding.goal === 'bulk'
    ? 'BULKING — calorie-dense, nutritious, carb-heavy around workouts.'
    : 'RECOMP — high protein, nutrient timing around workouts.';

  const proteinCeiling = Math.round(proteinPerMeal * 1.3);
  const proteinGuidance = isVegetarian
    ? `Every meal MUST hit ${proteinPerMeal}g protein (±10g, max ${proteinCeiling}g) using egg whites, eggs, Greek yogurt, cottage cheese, or whey.`
    : `Every meal MUST be built around dense animal protein providing ${proteinPerMeal}g protein (±10g, max ${proteinCeiling}g). Do NOT exceed ${proteinCeiling}g per meal.`;

  const templateNote = useTemplateDays
    ? `\nIMPORTANT: Output exactly ${daysToGenerate} days only. I will cycle them to fill 7 days server-side. Make each template day different for variety.`
    : '';

  const userPrompt = `Create a ${daysToGenerate}-day meal plan.
CLIENT: ${onboarding.weightKg}kg (${weightLbs}lbs), goal: ${onboarding.goal}. ${goalContext}
TARGETS: ${macros.calorieTarget} kcal | ${macros.proteinG}g protein | ${macros.carbsG}g carbs | ${macros.fatG}g fat
${onboarding.mealsPerDay} meals/day. ${onboarding.dietType} diet. Budget: ${onboarding.budget}. Cooking: ${onboarding.cookingSkill}.
${onboarding.allergies.length > 0 ? `Allergies: ${onboarding.allergies.join(', ')}` : ''}
${onboarding.dislikedFoods.length > 0 ? `Dislikes: ${onboarding.dislikedFoods.join(', ')}` : ''}
${proteinGuidance}${templateNote}
Valid JSON only. All ingredients with macros. ${daysToGenerate} days, ${onboarding.mealsPerDay} meals each.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: MEAL_PLAN_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: {
      type: 'json_schema' as const,
      json_schema: {
        name: 'meal_plan',
        strict: true,
        schema: MEAL_PLAN_SCHEMA as Record<string, unknown>,
      },
    },
    temperature: 0.3,
    max_tokens: 16384,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content in meal plan response');
  if (response.choices[0]?.finish_reason === 'length') throw new Error('Meal plan response truncated');

  let planData = JSON.parse(content);

  // Expand template days to 7 if we used the template approach
  if (useTemplateDays && planData.days && planData.days.length < 7) {
    const templates = planData.days;
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const expanded: any[] = [];
    for (let i = 0; i < 7; i++) {
      const clone = JSON.parse(JSON.stringify(templates[i % templates.length]));
      clone.day = dayNames[i];
      expanded.push(clone);
    }
    planData.days = expanded;
    log(`Day expansion: ${templates.length} templates → 7 days`);
  }

  return planData;
}

// ── Training Plan Generation ───────────────────────────────────────────

async function generateTrainingPlan(
  profile: TestProfile,
  openai: OpenAI
): Promise<any> {
  const { onboarding } = profile;
  const weightLbs = Math.round(onboarding.weightKg * 2.205);
  const durationWeeks = onboarding.planDurationWeeks;

  const splitDescriptions: Record<string, string> = {
    full_body: 'Full Body',
    upper_lower: 'Upper/Lower Split',
    ppl: 'Push/Pull/Legs',
    bro_split: 'Body Part Split',
    strength: 'Strength Focus',
  };

  const splitExerciseMin: Record<string, number> = {
    bro_split: 5, ppl: 3, upper_lower: 4, full_body: 3, strength: 4,
  };
  const minExercises = splitExerciseMin[onboarding.splitPreference] || 3;

  // Goal-specific context
  const goalContext = onboarding.goal === 'cut'
    ? `GOAL: CUTTING — Cap compound RPE at 8, shorter rest (60-90s compounds, 45-60s isolation), deload every 3rd week.`
    : onboarding.goal === 'bulk'
    ? `GOAL: BULKING — Longer accumulation phases, push volume to upper end, RPE 8-9 on isolation, longer rest (150-180s).`
    : `GOAL: RECOMP — Alternate strength-focused weeks with hypertrophy-focused weeks. Deload every 4th week.`;

  // Volume ranges by experience
  const volumeRanges = onboarding.experienceLevel === 'beginner'
    ? 'Chest 8-12, Back 8-12, Quads 8-10, Hamstrings 6-8, Shoulders 6-10, Biceps 4-8, Triceps 4-8'
    : onboarding.experienceLevel === 'intermediate'
    ? 'Chest 12-16, Back 12-16, Quads 10-14, Hamstrings 8-10, Shoulders 10-14, Biceps 8-12, Triceps 8-12'
    : 'Chest 16-22, Back 16-22, Quads 12-18, Hamstrings 10-14, Shoulders 12-18, Biceps 10-14, Triceps 10-14';

  // Phase-template approach for long plans
  const usePhaseTemplates = durationWeeks > 4;

  let phaseMap: { phase: string; weeks: number[] }[] = [];
  let phasePrompt = '';
  if (usePhaseTemplates) {
    if (durationWeeks === 8) {
      phaseMap = [
        { phase: 'Accumulation', weeks: [1, 2, 3] },
        { phase: 'Intensification', weeks: [4, 5, 6] },
        { phase: 'Deload', weeks: [7] },
        { phase: 'Peak', weeks: [8] },
      ];
    } else {
      phaseMap = [
        { phase: 'Accumulation', weeks: [1, 2, 3, 4] },
        { phase: 'Intensification', weeks: [5, 6, 7, 8] },
        { phase: 'Deload', weeks: [9] },
        { phase: 'Peak', weeks: [10, 11] },
        { phase: 'Deload', weeks: [12] },
      ];
    }
    const uniquePhases = [...new Set(phaseMap.map(p => p.phase))];
    phasePrompt = `\nPHASE TEMPLATES: This is a ${durationWeeks}-week plan. Output ONLY ${uniquePhases.length} weeks — one TEMPLATE week per phase: ${uniquePhases.join(', ')}. I will duplicate them server-side to fill all ${durationWeeks} weeks. Set week numbers 1-${uniquePhases.length} and phase_name accordingly.`;
  }

  const weeksToGenerate = usePhaseTemplates
    ? [...new Set(phaseMap.map(p => p.phase))].length
    : durationWeeks;

  const phaseInstruction = usePhaseTemplates
    ? `Output exactly ${weeksToGenerate} template weeks with distinct phase_name values.`
    : `Set phase_name for each week: "Accumulation", "Deload", "Peak", etc.`;

  // Deload instruction
  let deloadInstruction = '';
  if (onboarding.experienceLevel !== 'beginner') {
    if (durationWeeks <= 4) {
      deloadInstruction = `Week ${durationWeeks} is a DELOAD week (phase_name: "Deload"). Halve sets, drop RPE by 2, no intensity techniques.`;
    } else if (durationWeeks <= 8) {
      deloadInstruction = `Include a Deload phase template. Halve sets, drop RPE by 2, no intensity techniques.`;
    } else {
      deloadInstruction = `Include a Deload phase template. Halve sets, drop RPE by 2, no intensity techniques.`;
    }
  }

  const userPrompt = `Create a training program. Each session MUST have ${minExercises}-10 working exercises.

CLIENT: ${onboarding.weightKg}kg (${weightLbs}lbs), ${onboarding.heightCm}cm, ${onboarding.experienceLevel} level, goal: ${onboarding.goal}.
${onboarding.bodyFatPercentage ? `Body fat: ~${onboarding.bodyFatPercentage}%` : ''}

${goalContext}

TRAINING SETUP:
- Split: ${splitDescriptions[onboarding.splitPreference] || onboarding.splitPreference}
- Frequency: ${onboarding.workoutFrequency} days/week
- Time per session: ${onboarding.timePerSession} minutes
- Location: ${onboarding.workoutLocation}${onboarding.workoutLocation === 'home' ? ` (equipment: ${onboarding.homeEquipment.length > 0 ? onboarding.homeEquipment.join(', ') : 'bodyweight only'})` : ' (full gym access)'}
- Cardio: ${onboarding.cardioPreference}

WEEKLY VOLUME (sets/muscle group/week): ${volumeRanges}

PERIODIZATION:
${phaseInstruction}
${deloadInstruction}
${phasePrompt}

${onboarding.injuries.length > 0 ? `INJURIES: ${onboarding.injuries.join(', ')}. ${onboarding.injuryNotes}` : ''}

REQUIREMENTS:
- ${weeksToGenerate} weeks in output, ${onboarding.workoutFrequency} days/week
- ${minExercises}-10 exercises per session (MINIMUM ${minExercises})
- Each exercise: 3-4 working sets. Vary rep ranges (4-6, 8-12, 12-20).
- Every exercise MUST have rpe, rir, intensity_technique, and form_cues fields.
- intensity_technique: "none", "drop_set", "rest_pause", or "superset". Use "none" for most.
- form_cues: array of 2-3 coaching cues per exercise.
- muscle_groups: array of target muscles for each day.
- Warmup: 3-5 items per session
- Rest: compounds 120-180s, isolation 60-90s.
${onboarding.experienceLevel === 'beginner' ? '- Linear progression. Set rpe and rir to 0.' : ''}
${onboarding.experienceLevel === 'intermediate' ? '- Double progression. RPE 6-8, RIR 2-4 compounds / 1-3 isolation.' : ''}
${onboarding.experienceLevel === 'advanced' ? '- RPE/RIR based. RPE 7-9.5. Include drop sets and rest-pause on isolation. Max 2 supersets/session.' : ''}
${onboarding.cardioPreference !== 'none' ? `- Include cardio object on each day: { "type": "${onboarding.cardioPreference === 'light' ? 'walking' : onboarding.cardioPreference === 'moderate' ? 'incline walk' : 'HIIT intervals'}", "duration_minutes": ${onboarding.cardioPreference === 'light' ? 15 : onboarding.cardioPreference === 'moderate' ? 25 : 20} }` : '- No cardio (set cardio to null).'}

OUTPUT — valid JSON only.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: TRAINING_PLAN_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    response_format: {
      type: 'json_schema' as const,
      json_schema: {
        name: 'training_plan',
        strict: true,
        schema: TRAINING_PLAN_SCHEMA as Record<string, unknown>,
      },
    },
    temperature: 0.4,
    max_tokens: 16384,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('No content in training plan response');
  if (response.choices[0]?.finish_reason === 'length') throw new Error('Training plan response truncated');

  let planData = JSON.parse(content);

  // Phase-template expansion: use positional mapping (GPT may name phases differently)
  if (usePhaseTemplates && phaseMap.length > 0) {
    const templateWeeks = planData.weeks;
    const uniquePhases = [...new Set(phaseMap.map(p => p.phase))];

    log(`Phase expansion: ${templateWeeks.length} templates → ${durationWeeks} weeks`);

    // Positional mapping: template week 0 → first unique phase, week 1 → second, etc.
    const expandedWeeks: any[] = [];
    for (let phaseIdx = 0; phaseIdx < uniquePhases.length; phaseIdx++) {
      const phase = uniquePhases[phaseIdx];
      const template = templateWeeks[phaseIdx];
      if (!template) {
        log(`  ⚠ No template at position ${phaseIdx} for phase "${phase}"`);
        continue;
      }
      // Find all week numbers for this phase
      const weekNums = phaseMap.filter(p => p.phase === phase).flatMap(p => p.weeks);
      for (const weekNum of weekNums) {
        expandedWeeks.push({
          ...JSON.parse(JSON.stringify(template)),
          week: weekNum,
          phase_name: phase,
        });
      }
    }

    planData.weeks = expandedWeeks;
  }

  return planData;
}

// ── Validators ─────────────────────────────────────────────────────────

function validateMealPlan(
  planData: any,
  profile: TestProfile
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const { macros, onboarding } = profile;

  // 7 days
  const dayCount = planData.days?.length || 0;
  results.push({
    pass: dayCount === 7,
    message: `Day count: ${dayCount}/7`,
  });

  // Correct meals per day
  let allMealsCorrect = true;
  for (const day of planData.days || []) {
    if ((day.meals?.length || 0) !== onboarding.mealsPerDay) {
      allMealsCorrect = false;
    }
  }
  results.push({
    pass: allMealsCorrect,
    message: `Meals per day: ${onboarding.mealsPerDay} expected${allMealsCorrect ? '' : ' — MISMATCH'}`,
  });

  // Calorie weekly average ±10%
  const dayCals = (planData.days || []).map((d: any) => d.day_totals?.calories || 0);
  const avgCal = dayCals.reduce((a: number, b: number) => a + b, 0) / (dayCals.length || 1);
  const calDiff = Math.abs(avgCal - macros.calorieTarget) / macros.calorieTarget;
  results.push({
    pass: calDiff <= 0.10,
    message: `Avg calories: ${Math.round(avgCal)} vs ${macros.calorieTarget} target (${Math.round(calDiff * 100)}% diff)`,
  });

  // Protein weekly average: protein-first approach overshoots by design
  // Bulk: allow +40% (excess protein is beneficial during bulking)
  // Cut/recomp: allow +25%
  const dayProt = (planData.days || []).map((d: any) => d.day_totals?.protein || 0);
  const avgProt = dayProt.reduce((a: number, b: number) => a + b, 0) / (dayProt.length || 1);
  const protDiffRaw = (avgProt - macros.proteinG) / macros.proteinG;
  const protDiffAbs = Math.abs(protDiffRaw);
  const protCeiling = onboarding.goal === 'bulk' ? 0.40 : 0.25;
  const protPass = protDiffRaw >= 0 ? protDiffAbs <= protCeiling : protDiffAbs <= 0.15;
  results.push({
    pass: protPass,
    message: `Avg protein: ${Math.round(avgProt)}g vs ${macros.proteinG}g target (${protDiffRaw >= 0 ? '+' : ''}${Math.round(protDiffRaw * 100)}%)`,
  });

  // No day below 70% protein target
  const minProtDay = Math.min(...dayProt);
  const protFloor = macros.proteinG * 0.7;
  results.push({
    pass: minProtDay >= protFloor,
    message: `Min daily protein: ${Math.round(minProtDay)}g (floor: ${Math.round(protFloor)}g)`,
  });

  // Every meal ≥12g protein (evening snacks in 5-meal bulk plans can be 12-18g)
  let allMealsMinProt = true;
  let lowProtMeals: string[] = [];
  for (const day of planData.days || []) {
    for (const meal of day.meals || []) {
      const mealProt = meal.macro_totals?.protein || 0;
      if (mealProt < 12) {
        allMealsMinProt = false;
        lowProtMeals.push(`${day.day} ${meal.name}: ${Math.round(mealProt)}g`);
      }
    }
  }
  results.push({
    pass: allMealsMinProt,
    message: `Every meal ≥12g protein: ${allMealsMinProt ? 'yes' : `FAIL (${lowProtMeals.join(', ')})`}`,
  });

  // Allergen check
  if (onboarding.allergies.length > 0) {
    let allergenFound = false;
    const allergenLower = onboarding.allergies.map((a) => a.toLowerCase());
    for (const day of planData.days || []) {
      for (const meal of day.meals || []) {
        for (const ing of meal.ingredients || []) {
          const name = (ing.name || '').toLowerCase();
          for (const allergen of allergenLower) {
            if (name.includes(allergen)) {
              allergenFound = true;
            }
          }
        }
      }
    }
    results.push({
      pass: !allergenFound,
      message: `Allergen check (${onboarding.allergies.join(', ')}): ${allergenFound ? 'FAIL — allergen ingredient found' : 'clean'}`,
    });
  }

  return results;
}

function validateTrainingPlan(
  planData: any,
  profile: TestProfile
): ValidationResult[] {
  const results: ValidationResult[] = [];
  const { onboarding } = profile;

  const splitExerciseMin: Record<string, number> = {
    bro_split: 5, ppl: 3, upper_lower: 4, full_body: 3, strength: 4,
  };
  const minExercises = splitExerciseMin[onboarding.splitPreference] || 3;

  // Correct weeks
  const weekCount = planData.weeks?.length || 0;
  results.push({
    pass: weekCount === onboarding.planDurationWeeks,
    message: `Week count: ${weekCount}/${onboarding.planDurationWeeks}`,
  });

  // Correct days per week
  let daysCorrect = true;
  for (const week of planData.weeks || []) {
    if ((week.days?.length || 0) !== onboarding.workoutFrequency) {
      daysCorrect = false;
    }
  }
  results.push({
    pass: daysCorrect,
    message: `Days per week: ${onboarding.workoutFrequency} expected${daysCorrect ? '' : ' — MISMATCH'}`,
  });

  // Exercise count ≥ minimum
  let allExercisesMin = true;
  let lowCount = 0;
  for (const week of planData.weeks || []) {
    for (const day of week.days || []) {
      const exCount = day.exercises?.length || 0;
      if (exCount < minExercises) {
        allExercisesMin = false;
        lowCount++;
      }
    }
  }
  results.push({
    pass: allExercisesMin,
    message: `Exercise count ≥ ${minExercises}: ${allExercisesMin ? 'pass' : `FAIL (${lowCount} sessions under minimum)`}`,
  });

  // RPE on all exercises
  let allRpe = true;
  let missingRpe = 0;
  for (const week of planData.weeks || []) {
    for (const day of week.days || []) {
      for (const ex of day.exercises || []) {
        if (ex.rpe === undefined || ex.rpe === null) {
          allRpe = false;
          missingRpe++;
        }
      }
    }
  }
  results.push({
    pass: allRpe,
    message: `RPE on all exercises: ${allRpe ? 'pass' : `FAIL (${missingRpe} missing)`}`,
  });

  // Deload weeks present (for non-beginners with ≥4 weeks)
  if (onboarding.experienceLevel !== 'beginner' && onboarding.planDurationWeeks >= 4) {
    const hasDeload = (planData.weeks || []).some(
      (w: any) => (w.phase_name || '').toLowerCase().includes('deload')
    );
    results.push({
      pass: hasDeload,
      message: `Deload week present: ${hasDeload ? 'yes' : 'FAIL — no deload found'}`,
    });
  }

  // All exercises have sets/reps/rest
  let allFields = true;
  let missingFields = 0;
  for (const week of planData.weeks || []) {
    for (const day of week.days || []) {
      for (const ex of day.exercises || []) {
        if (!ex.sets || !ex.reps || !ex.rest_seconds) {
          allFields = false;
          missingFields++;
        }
      }
    }
  }
  results.push({
    pass: allFields,
    message: `All exercises have sets/reps/rest: ${allFields ? 'pass' : `FAIL (${missingFields} incomplete)`}`,
  });

  return results;
}

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const isLive = args.includes('--live');
  const isMock = args.includes('--mock') || !isLive;

  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║  Pipeline E2E Test — ${isLive ? 'LIVE' : 'MOCK'} mode${isLive ? '       ' : '       '}║`);
  console.log(`╚══════════════════════════════════════╝\n`);

  let openai: OpenAI | null = null;
  if (isLive) {
    if (!process.env.OPENAI_API_KEY) {
      console.error('ERROR: OPENAI_API_KEY not set. Required for --live mode.');
      process.exit(1);
    }
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  let totalPass = 0;
  let totalFail = 0;

  for (const profile of TEST_PROFILES) {
    console.log(`\n── ${profile.name} ─────────────────────────────`);

    // ── Meal Plan ──
    console.log('\n  [Meal Plan]');
    let mealPlan: any;

    try {
      if (isMock) {
        const fixturePath = fixturePathMeal(profile.name);
        if (!fs.existsSync(fixturePath)) {
          console.log(`    ⚠ Fixture not found: ${path.basename(fixturePath)}`);
          console.log(`    Run with --live first to generate fixtures.`);
          continue;
        }
        mealPlan = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
        log('Loaded from fixture');
      } else {
        // Generate with retry if day count < expected (GPT occasionally truncates)
        const maxAttempts = 2;
        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
          log(`Generating via OpenAI...${attempt > 1 ? ` (retry ${attempt})` : ''}`);
          mealPlan = await generateMealPlan(profile, openai!);
          const dayCount = mealPlan.days?.length || 0;
          const expectedDays = profile.onboarding.mealsPerDay >= 5 ? 2 : 7; // template or full
          if (dayCount >= expectedDays || attempt === maxAttempts) break;
          log(`Got ${dayCount}/${expectedDays} days, retrying...`);
        }

        // Run USDA correction + scaling pipeline
        const stats = await correctIngredientMacros(mealPlan.days);
        log(`USDA match: ${stats.matched}/${stats.total}`);
        computeMacroTotals(mealPlan.days);

        const macroTargets = {
          calories: profile.macros.calorieTarget,
          protein: profile.macros.proteinG,
          carbs: profile.macros.carbsG,
          fat: profile.macros.fatG,
        };
        for (const day of mealPlan.days) {
          scaleDayToTarget(day, macroTargets);
        }
        computeMacroTotals(mealPlan.days);

        // USDA match rate
        const matchRate = stats.total > 0 ? stats.matched / stats.total : 0;
        const matchResult: ValidationResult = {
          pass: matchRate >= 0.8,
          message: `USDA match rate: ${Math.round(matchRate * 100)}% (${stats.matched}/${stats.total})`,
        };
        logResult(matchResult);
        if (matchResult.pass) totalPass++; else totalFail++;

        // Save fixture
        fs.writeFileSync(fixturePathMeal(profile.name), JSON.stringify(mealPlan, null, 2));
        log('Saved fixture');
      }

      const mealResults = validateMealPlan(mealPlan, profile);
      for (const r of mealResults) {
        logResult(r);
        if (r.pass) totalPass++; else totalFail++;
      }
    } catch (err) {
      console.log(`    ✗ ERROR: ${err instanceof Error ? err.message : String(err)}`);
      totalFail++;
    }

    // ── Training Plan ──
    console.log('\n  [Training Plan]');
    let trainingPlan: any;

    try {
      if (isMock) {
        const fixturePath = fixturePathTraining(profile.name);
        if (!fs.existsSync(fixturePath)) {
          console.log(`    ⚠ Fixture not found: ${path.basename(fixturePath)}`);
          console.log(`    Run with --live first to generate fixtures.`);
          continue;
        }
        trainingPlan = JSON.parse(fs.readFileSync(fixturePath, 'utf-8'));
        log('Loaded from fixture');
      } else {
        log('Generating via OpenAI...');
        trainingPlan = await generateTrainingPlan(profile, openai!);

        // Save fixture
        fs.writeFileSync(fixturePathTraining(profile.name), JSON.stringify(trainingPlan, null, 2));
        log('Saved fixture');
      }

      const trainingResults = validateTrainingPlan(trainingPlan, profile);
      for (const r of trainingResults) {
        logResult(r);
        if (r.pass) totalPass++; else totalFail++;
      }
    } catch (err) {
      console.log(`    ✗ ERROR: ${err instanceof Error ? err.message : String(err)}`);
      totalFail++;
    }
  }

  // ── Summary ──
  console.log(`\n╔══════════════════════════════════════╗`);
  console.log(`║  Results: ${totalPass} passed, ${totalFail} failed${' '.repeat(Math.max(0, 15 - String(totalPass).length - String(totalFail).length))}║`);
  console.log(`╚══════════════════════════════════════╝\n`);

  process.exit(totalFail > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Unhandled error:', err);
  process.exit(1);
});
