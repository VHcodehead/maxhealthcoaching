import type { OnboardingResponse, MacroTargets } from '@/types/database';

const ACTIVITY_MULTIPLIERS: Record<string, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderate: 1.55,
  very_active: 1.725,
  athlete: 1.9,
};

export function calculateBMR(data: OnboardingResponse): {
  bmr: number;
  formula: 'katch_mcardle' | 'mifflin_st_jeor';
} {
  if (!data.body_fat_unsure && data.body_fat_percentage) {
    // Katch-McArdle
    const bfDecimal = data.body_fat_percentage / 100;
    const lbm = data.weight_kg * (1 - bfDecimal);
    const bmr = 370 + 21.6 * lbm;
    return { bmr: Math.round(bmr), formula: 'katch_mcardle' };
  }

  // Mifflin-St Jeor fallback
  let bmr: number;
  if (data.sex === 'male') {
    bmr = 10 * data.weight_kg + 6.25 * data.height_cm - 5 * data.age + 5;
  } else {
    bmr = 10 * data.weight_kg + 6.25 * data.height_cm - 5 * data.age - 161;
  }
  return { bmr: Math.round(bmr), formula: 'mifflin_st_jeor' };
}

export function calculateTDEE(bmr: number, activityLevel: string): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

export function calculateCalorieTarget(
  tdee: number,
  goal: string,
  bodyFatPercentage: number | undefined,
  experienceLevel: string
): { calories: number; explanation: string } {
  switch (goal) {
    case 'cut': {
      // Higher BF% can handle larger deficit
      let deficitPercent = 0.20;
      if (bodyFatPercentage) {
        if (bodyFatPercentage > 25) deficitPercent = 0.25;
        else if (bodyFatPercentage > 18) deficitPercent = 0.20;
        else deficitPercent = 0.15;
      }
      const calories = Math.round(tdee * (1 - deficitPercent));
      return {
        calories,
        explanation: `Your calorie target is set at a ${Math.round(deficitPercent * 100)}% deficit from your maintenance of ${tdee} calories. ${
          bodyFatPercentage && bodyFatPercentage > 25
            ? "Since you have more body fat to work with, you can sustain a slightly larger deficit safely."
            : bodyFatPercentage && bodyFatPercentage < 18
            ? "Since you're already fairly lean, we're using a conservative deficit to preserve muscle mass."
            : "This moderate deficit balances fat loss with muscle preservation."
        }`,
      };
    }
    case 'bulk': {
      let surplusPercent = 0.10;
      if (experienceLevel === 'beginner') surplusPercent = 0.15;
      else if (experienceLevel === 'advanced') surplusPercent = 0.05;
      if (bodyFatPercentage && bodyFatPercentage < 15) surplusPercent += 0.05;
      const calories = Math.round(tdee * (1 + surplusPercent));
      return {
        calories,
        explanation: `Your calorie target is set at a ${Math.round(surplusPercent * 100)}% surplus above your maintenance of ${tdee} calories. ${
          experienceLevel === 'beginner'
            ? "As a beginner, you can build muscle faster, so a moderate surplus maximizes gains."
            : experienceLevel === 'advanced'
            ? "As an advanced lifter, we use a smaller surplus to minimize fat gain while maximizing lean tissue growth."
            : "This surplus supports steady muscle growth while keeping fat gain in check."
        }`,
      };
    }
    case 'recomp':
    default: {
      const calories = tdee;
      return {
        calories,
        explanation: `Your calorie target is set right at your maintenance level of ${tdee} calories. Body recomposition works by building muscle while maintaining weight — the key is high protein intake and progressive training, not a dramatic caloric shift.`,
      };
    }
  }
}

export function calculateMacros(
  calorieTarget: number,
  weightKg: number,
  goal: string,
  bodyFatPercentage: number | undefined
): { protein: number; fat: number; carbs: number; explanation: string } {
  const weightLbs = weightKg * 2.205;

  // Protein: 0.8-1.0g per lb depending on goal
  let proteinPerLb: number;
  if (goal === 'cut') {
    proteinPerLb = 1.0; // preserve muscle on a cut
    if (bodyFatPercentage && bodyFatPercentage < 15) proteinPerLb = 1.1;
  } else if (goal === 'bulk') {
    proteinPerLb = 0.8;
  } else {
    proteinPerLb = 0.9; // recomp
  }

  const protein = Math.round(weightLbs * proteinPerLb);

  // Fat: minimum 0.3g/lb, aim for ~25-30% of calories
  const fatFromPercent = Math.round((calorieTarget * 0.27) / 9);
  const fatMinimum = Math.round(weightLbs * 0.3);
  const fat = Math.max(fatFromPercent, fatMinimum);

  // Carbs: remainder
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const carbCals = calorieTarget - proteinCals - fatCals;
  const carbs = Math.max(Math.round(carbCals / 4), 50); // min 50g carbs

  const explanation = `**Protein: ${protein}g** (${proteinPerLb}g per lb of bodyweight) — ${
    goal === 'cut'
      ? 'Higher protein helps preserve lean muscle tissue during your cut.'
      : goal === 'bulk'
      ? 'This protein level supports maximal muscle protein synthesis.'
      : 'Adequate protein is crucial for body recomposition.'
  }\n\n**Fat: ${fat}g** — Essential for hormone production, joint health, and nutrient absorption. This is set at a healthy floor.\n\n**Carbs: ${carbs}g** — Fills the remaining calories. Carbs fuel your training sessions and recovery.`;

  return { protein, fat, carbs, explanation };
}

export function generateMacroTargets(
  onboarding: OnboardingResponse,
  userId: string
): Omit<MacroTargets, 'id' | 'created_at'> {
  const { bmr, formula } = calculateBMR(onboarding);
  const tdee = calculateTDEE(bmr, onboarding.activity_level);
  const { calories } = calculateCalorieTarget(
    tdee,
    onboarding.goal,
    onboarding.body_fat_percentage,
    onboarding.experience_level
  );
  const macros = calculateMacros(
    calories,
    onboarding.weight_kg,
    onboarding.goal,
    onboarding.body_fat_percentage
  );

  const formulaExplanation = formula === 'katch_mcardle'
    ? 'Your BMR was calculated using the Katch-McArdle formula, which uses your body fat percentage for a more accurate estimate.'
    : 'Your BMR was estimated using the Mifflin-St Jeor formula. For a more precise calculation, provide your body fat percentage in future updates.';

  return {
    user_id: userId,
    version: 1,
    bmr,
    tdee,
    calorie_target: calories,
    protein_g: macros.protein,
    fat_g: macros.fat,
    carbs_g: macros.carbs,
    formula_used: formula,
    explanation: `${formulaExplanation}\n\n${macros.explanation}`,
  };
}
