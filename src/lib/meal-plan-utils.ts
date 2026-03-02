// Server-side: compute meal and day totals from per-ingredient macros
export function computeMacroTotals(days: any[]): void {
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

    // Also compute swap macro totals from per-ingredient macros
    for (const meal of day.meals) {
      if (Array.isArray(meal.swap_options)) {
        for (const swap of meal.swap_options) {
          const swapTotals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
          if (Array.isArray(swap.ingredients)) {
            for (const ing of swap.ingredients) {
              if (ing.macros) {
                swapTotals.calories += ing.macros.calories || 0;
                swapTotals.protein += ing.macros.protein || 0;
                swapTotals.carbs += ing.macros.carbs || 0;
                swapTotals.fat += ing.macros.fat || 0;
              }
            }
          }
          swapTotals.calories = Math.round(swapTotals.calories);
          swapTotals.protein = Math.round(swapTotals.protein);
          swapTotals.carbs = Math.round(swapTotals.carbs);
          swapTotals.fat = Math.round(swapTotals.fat);
          swap.macro_totals = swapTotals;
        }
      }
    }
  }
}
