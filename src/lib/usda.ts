// Server-side USDA nutritional data for accurate macro calculation.
// All values are per 100g unless noted.

interface UsdaEntry {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const USDA_TABLE: Record<string, UsdaEntry> = {
  // === PROTEINS ===
  'chicken breast': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'chicken thigh': { calories: 177, protein: 20, carbs: 0, fat: 10.2 },
  'chicken': { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  'ground turkey': { calories: 143, protein: 19.5, carbs: 0, fat: 7.1 },
  'turkey breast': { calories: 135, protein: 30, carbs: 0, fat: 1.5 },
  'turkey': { calories: 143, protein: 19.5, carbs: 0, fat: 7.1 },
  'ground beef': { calories: 176, protein: 20, carbs: 0, fat: 10 },
  'beef': { calories: 176, protein: 20, carbs: 0, fat: 10 },
  'steak': { calories: 271, protein: 26, carbs: 0, fat: 18 },
  'salmon': { calories: 208, protein: 20, carbs: 0, fat: 13 },
  'cod': { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  'tuna': { calories: 116, protein: 26, carbs: 0, fat: 0.8 },
  'tilapia': { calories: 96, protein: 20, carbs: 0, fat: 1.7 },
  'shrimp': { calories: 85, protein: 20, carbs: 0, fat: 0.5 },
  'fish': { calories: 96, protein: 20, carbs: 0, fat: 1.7 },
  'pork': { calories: 143, protein: 26, carbs: 0, fat: 3.5 },
  'pork chop': { calories: 143, protein: 26, carbs: 0, fat: 3.5 },
  'bacon': { calories: 541, protein: 37, carbs: 1.4, fat: 42 },
  'egg white': { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 },
  'whole egg': { calories: 144, protein: 12.6, carbs: 0.8, fat: 9.6 },
  'egg': { calories: 144, protein: 12.6, carbs: 0.8, fat: 9.6 },
  'whey': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'protein powder': { calories: 400, protein: 80, carbs: 10, fat: 5 },
  'tofu': { calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  'firm tofu': { calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  'tempeh': { calories: 192, protein: 20, carbs: 7.6, fat: 11 },
  'edamame': { calories: 121, protein: 12, carbs: 8.9, fat: 5.2 },
  'seitan': { calories: 370, protein: 75, carbs: 14, fat: 1.9 },

  // === DAIRY ===
  'greek yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  'yogurt': { calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  'cottage cheese': { calories: 81, protein: 11, carbs: 3.6, fat: 2.3 },
  'feta': { calories: 264, protein: 14, carbs: 4, fat: 21 },
  'cheddar': { calories: 403, protein: 25, carbs: 1.3, fat: 33 },
  'mozzarella': { calories: 280, protein: 28, carbs: 3.1, fat: 17 },
  'parmesan': { calories: 431, protein: 38, carbs: 4.1, fat: 29 },
  'cheese': { calories: 350, protein: 22, carbs: 2, fat: 28 },
  'cream cheese': { calories: 342, protein: 6, carbs: 4, fat: 34 },
  'sour cream': { calories: 193, protein: 2.1, carbs: 4.6, fat: 19 },
  'heavy cream': { calories: 340, protein: 2.8, carbs: 2.8, fat: 36 },
  'milk': { calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3 },
  'skim milk': { calories: 34, protein: 3.4, carbs: 5, fat: 0.1 },
  'butter': { calories: 717, protein: 0.9, carbs: 0.1, fat: 81 },

  // === GRAINS & CARBS ===
  'rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'white rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'brown rice': { calories: 112, protein: 2.6, carbs: 24, fat: 0.9 },
  'jasmine rice': { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  'oat': { calories: 389, protein: 17, carbs: 66, fat: 7 },
  'oatmeal': { calories: 68, protein: 2.4, carbs: 12, fat: 1.4 },
  'rolled oat': { calories: 389, protein: 17, carbs: 66, fat: 7 },
  'quinoa': { calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  'sweet potato': { calories: 90, protein: 2, carbs: 21, fat: 0.1 },
  'pasta': { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  'spaghetti': { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  'noodle': { calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  'bread': { calories: 247, protein: 13, carbs: 41, fat: 3.4 },
  'whole wheat bread': { calories: 247, protein: 13, carbs: 41, fat: 3.4 },
  'tortilla': { calories: 312, protein: 8.3, carbs: 51.6, fat: 8 },
  'wrap': { calories: 312, protein: 8.3, carbs: 51.6, fat: 8 },
  'potato': { calories: 93, protein: 2.5, carbs: 21, fat: 0.1 },
  'couscous': { calories: 112, protein: 3.8, carbs: 23, fat: 0.2 },
  'bulgur': { calories: 83, protein: 3.1, carbs: 19, fat: 0.2 },

  // === LEGUMES ===
  'kidney bean': { calories: 82, protein: 7.3, carbs: 21, fat: 0.5 },
  'black bean': { calories: 91, protein: 6.7, carbs: 16, fat: 0.3 },
  'chickpea': { calories: 128, protein: 7, carbs: 21, fat: 2.6 },
  'garbanzo': { calories: 128, protein: 7, carbs: 21, fat: 2.6 },
  'lentil': { calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  'white bean': { calories: 91, protein: 6.7, carbs: 16, fat: 0.4 },
  'pinto bean': { calories: 91, protein: 6.7, carbs: 16, fat: 0.4 },
  'bean': { calories: 91, protein: 6.7, carbs: 16, fat: 0.4 },
  'hummus': { calories: 166, protein: 8, carbs: 14, fat: 10 },

  // === FATS & OILS ===
  'olive oil': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'coconut oil': { calories: 862, protein: 0, carbs: 0, fat: 100 },
  'vegetable oil': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'cooking oil': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'oil': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'sesame oil': { calories: 884, protein: 0, carbs: 0, fat: 100 },
  'peanut butter': { calories: 588, protein: 25, carbs: 20, fat: 50 },
  'almond butter': { calories: 614, protein: 21, carbs: 19, fat: 56 },
  'almond': { calories: 579, protein: 21, carbs: 22, fat: 50 },
  'walnut': { calories: 654, protein: 15, carbs: 14, fat: 65 },
  'cashew': { calories: 553, protein: 18, carbs: 30, fat: 44 },
  'chia seed': { calories: 486, protein: 17, carbs: 42, fat: 31 },
  'flax seed': { calories: 534, protein: 18, carbs: 29, fat: 42 },
  'sunflower seed': { calories: 584, protein: 21, carbs: 20, fat: 51 },
  'pumpkin seed': { calories: 559, protein: 30, carbs: 11, fat: 49 },

  // === PRODUCE ===
  'avocado': { calories: 160, protein: 2, carbs: 9, fat: 15 },
  'banana': { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  'apple': { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  'orange': { calories: 47, protein: 0.9, carbs: 12, fat: 0.1 },
  'mango': { calories: 60, protein: 0.8, carbs: 15, fat: 0.4 },
  'berries': { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  'blueberries': { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  'blueberry': { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  'strawberries': { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  'strawberry': { calories: 32, protein: 0.7, carbs: 7.7, fat: 0.3 },
  'raspberry': { calories: 52, protein: 1.2, carbs: 12, fat: 0.7 },
  'raspberries': { calories: 52, protein: 1.2, carbs: 12, fat: 0.7 },
  'broccoli': { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  'spinach': { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  'kale': { calories: 35, protein: 2.9, carbs: 4.4, fat: 1.5 },
  'onion': { calories: 40, protein: 1.1, carbs: 9.3, fat: 0.1 },
  'garlic': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'tomato': { calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2 },
  'bell pepper': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'pepper': { calories: 31, protein: 1, carbs: 6, fat: 0.3 },
  'mushroom': { calories: 22, protein: 3.1, carbs: 3.3, fat: 0.3 },
  'carrot': { calories: 41, protein: 0.9, carbs: 10, fat: 0.2 },
  'cucumber': { calories: 15, protein: 0.7, carbs: 3.6, fat: 0.1 },
  'zucchini': { calories: 17, protein: 1.2, carbs: 3.1, fat: 0.3 },
  'corn': { calories: 86, protein: 3.3, carbs: 19, fat: 1.4 },
  'green bean': { calories: 31, protein: 1.8, carbs: 7, fat: 0.1 },
  'cauliflower': { calories: 25, protein: 1.9, carbs: 5, fat: 0.3 },
  'asparagus': { calories: 20, protein: 2.2, carbs: 3.9, fat: 0.1 },
  'cabbage': { calories: 25, protein: 1.3, carbs: 6, fat: 0.1 },
  'celery': { calories: 16, protein: 0.7, carbs: 3, fat: 0.2 },
  'lettuce': { calories: 15, protein: 1.4, carbs: 2.9, fat: 0.2 },
  'pea': { calories: 81, protein: 5.4, carbs: 14, fat: 0.4 },

  // === CONDIMENTS & LIQUIDS ===
  'soy sauce': { calories: 53, protein: 8.7, carbs: 6.7, fat: 0 },
  'honey': { calories: 304, protein: 0.3, carbs: 82, fat: 0 },
  'maple syrup': { calories: 260, protein: 0, carbs: 67, fat: 0.1 },
  'coconut milk': { calories: 230, protein: 2.3, carbs: 6, fat: 24 },
  'oat milk': { calories: 47, protein: 1, carbs: 7, fat: 1.5 },
  'almond milk': { calories: 17, protein: 0.6, carbs: 0.6, fat: 1.1 },
  'soy milk': { calories: 54, protein: 3.3, carbs: 6, fat: 1.8 },
  'salsa': { calories: 36, protein: 1.5, carbs: 7, fat: 0.2 },
  'tomato sauce': { calories: 29, protein: 1.3, carbs: 5.4, fat: 0.5 },
  'marinara': { calories: 29, protein: 1.3, carbs: 5.4, fat: 0.5 },
};

// Convert amount + unit to grams for USDA lookup
function toGrams(name: string, amount: number, unit: string): number | null {
  const u = unit.toLowerCase().trim();
  const n = name.toLowerCase().trim();

  // Weight units
  if (u === 'g' || u === 'grams' || u === 'gram') return amount;
  if (u === 'kg' || u === 'kilogram' || u === 'kilograms') return amount * 1000;

  // Volume units (approximate, density ~1 for water-based)
  if (u === 'ml' || u === 'milliliter' || u === 'milliliters') return amount;
  if (u === 'l' || u === 'liter' || u === 'liters') return amount * 1000;
  if (u === 'cup' || u === 'cups') return amount * 240;
  if (u === 'tablespoon' || u === 'tablespoons' || u === 'tbsp') return amount * 15;
  if (u === 'teaspoon' || u === 'teaspoons' || u === 'tsp') return amount * 5;

  // Piece-based units
  if (u === 'large' || u === 'medium' || u === 'small' || u === 'whole' || u === 'piece' || u === 'pieces') {
    if (n.includes('egg')) return amount * 50;
    if (n.includes('banana')) return amount * 118;
    if (n.includes('avocado')) return amount * 150;
    if (n.includes('tortilla') || n.includes('wrap')) return amount * 64;
    if (n.includes('apple')) return amount * 182;
    if (n.includes('orange')) return amount * 131;
    return null;
  }

  if (u === 'scoop' || u === 'scoops' || u === 'serving' || u === 'servings') {
    if (n.includes('whey') || n.includes('protein')) return amount * 30;
    return null;
  }

  if (u === 'slice' || u === 'slices') {
    if (n.includes('bread') || n.includes('toast')) return amount * 28;
    if (n.includes('cheese')) return amount * 28;
    return null;
  }

  if (u === 'can' || u === 'cans') {
    if (n.includes('tuna')) return amount * 142;
    if (n.includes('bean') || n.includes('chickpea') || n.includes('lentil')) return amount * 400;
    if (n.includes('coconut milk')) return amount * 400;
    return null;
  }

  // Fall back: treat as grams if amount looks plausible (>10 suggests grams)
  if (amount >= 10) return amount;

  return null;
}

// Match an ingredient name to a USDA table entry.
// Uses keyword matching: all words of a USDA key must appear in the ingredient name.
// Picks the longest (most specific) match.
export function matchIngredient(name: string): UsdaEntry | null {
  const normalized = name.toLowerCase().replace(/[,.()\-]/g, ' ').replace(/\s+/g, ' ').trim();

  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const key of Object.keys(USDA_TABLE)) {
    const keyWords = key.split(' ');
    const allPresent = keyWords.every(word => normalized.includes(word));
    if (allPresent && keyWords.length > bestScore) {
      bestMatch = key;
      bestScore = keyWords.length;
    }
  }

  return bestMatch ? USDA_TABLE[bestMatch] : null;
}

// Override GPT's per-ingredient macros with server-calculated USDA values.
// Returns stats about matching coverage.
export function correctIngredientMacros(days: any[]): { total: number; matched: number; unmatched: string[] } {
  let total = 0;
  let matched = 0;
  const unmatchedSet = new Set<string>();

  function processIngredient(ing: any) {
    total++;
    const usda = matchIngredient(ing.name || '');
    if (!usda) {
      unmatchedSet.add(ing.name || 'unknown');
      return;
    }

    const amount = parseFloat(ing.amount) || 0;
    const grams = toGrams(ing.name || '', amount, ing.unit || 'g');
    if (grams === null || grams <= 0) {
      unmatchedSet.add(`${ing.name} (unit: ${ing.unit})`);
      return;
    }

    const factor = grams / 100;
    ing.macros = {
      calories: Math.round(usda.calories * factor * 10) / 10,
      protein: Math.round(usda.protein * factor * 10) / 10,
      carbs: Math.round(usda.carbs * factor * 10) / 10,
      fat: Math.round(usda.fat * factor * 10) / 10,
    };
    matched++;
  }

  for (const day of days) {
    if (!Array.isArray(day.meals)) continue;
    for (const meal of day.meals) {
      if (Array.isArray(meal.ingredients)) {
        for (const ing of meal.ingredients) processIngredient(ing);
      }
      if (Array.isArray(meal.swap_options)) {
        for (const swap of meal.swap_options) {
          if (Array.isArray(swap.ingredients)) {
            for (const ing of swap.ingredients) processIngredient(ing);
          }
        }
      }
    }
  }

  return { total, matched, unmatched: [...unmatchedSet] };
}

// Scale a day's main-ingredient portions so total calories hit the target.
// Only scales ingredients contributing >30 kcal (leaves seasonings/condiments alone).
export function scaleDayToTarget(day: any, calorieTarget: number): void {
  if (!Array.isArray(day.meals)) return;

  let scalableCalories = 0;
  let fixedCalories = 0;

  for (const meal of day.meals) {
    if (!Array.isArray(meal.ingredients)) continue;
    for (const ing of meal.ingredients) {
      const cal = ing.macros?.calories || 0;
      if (cal > 30) {
        scalableCalories += cal;
      } else {
        fixedCalories += cal;
      }
    }
  }

  const currentTotal = scalableCalories + fixedCalories;
  if (scalableCalories === 0 || currentTotal === 0) return;

  // Already within 5% — don't scale
  const deviation = Math.abs(currentTotal - calorieTarget) / calorieTarget;
  if (deviation <= 0.05) return;

  const targetScalable = calorieTarget - fixedCalories;
  if (targetScalable <= 0) return;
  const scaleFactor = targetScalable / scalableCalories;

  for (const meal of day.meals) {
    if (!Array.isArray(meal.ingredients)) continue;
    for (const ing of meal.ingredients) {
      if ((ing.macros?.calories || 0) <= 30) continue;

      // Scale the amount
      const amount = parseFloat(ing.amount) || 0;
      ing.amount = String(Math.round(amount * scaleFactor));

      // Scale macros proportionally
      ing.macros.calories = Math.round(ing.macros.calories * scaleFactor * 10) / 10;
      ing.macros.protein = Math.round(ing.macros.protein * scaleFactor * 10) / 10;
      ing.macros.carbs = Math.round(ing.macros.carbs * scaleFactor * 10) / 10;
      ing.macros.fat = Math.round(ing.macros.fat * scaleFactor * 10) / 10;
    }
  }
}
