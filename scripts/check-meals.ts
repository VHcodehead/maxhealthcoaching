import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // Get most recent clients with meal plans
  const profiles = await prisma.profile.findMany({
    where: { role: 'client' },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  for (const p of profiles) {
    const macros = await prisma.macroTarget.findFirst({
      where: { userId: p.userId },
      orderBy: { version: 'desc' },
    });
    const mp = await prisma.mealPlan.findFirst({
      where: { userId: p.userId },
      orderBy: { version: 'desc' },
    });

    if (!mp) continue;

    console.log('\n========', p.fullName, '========');
    if (macros) {
      console.log('MACRO TARGETS: cal=' + macros.calorieTarget + ' p=' + macros.proteinG + ' c=' + macros.carbsG + ' f=' + macros.fatG);
    }

    const pd = mp.planData as any;
    for (const day of (pd.days || []).slice(0, 2)) { // Just check first 2 days
      console.log('\n' + day.day);
      console.log('  Stored day_totals:', JSON.stringify(day.day_totals));

      let sumCal = 0, sumP = 0, sumC = 0, sumF = 0;
      for (const meal of day.meals || []) {
        const m = meal.macro_totals;
        console.log('    ' + (meal.name || meal.recipe_title) + ': cal=' + m.calories + ' p=' + m.protein + ' c=' + m.carbs + ' f=' + m.fat);
        sumCal += m.calories;
        sumP += m.protein;
        sumC += m.carbs;
        sumF += m.fat;
      }
      console.log('  Actual sum: cal=' + sumCal + ' p=' + sumP + ' c=' + sumC + ' f=' + sumF);

      const dayTarget = macros?.calorieTarget || 0;
      if (dayTarget && Math.abs(sumCal - dayTarget) > 100) {
        console.log('  ⚠ Meals total ' + sumCal + ' but target is ' + dayTarget + ' (' + (sumCal - dayTarget) + ' diff)');
      }
      if (macros && Math.abs(sumP - macros.proteinG) > 10) {
        console.log('  ⚠ Protein total ' + sumP + 'g but target is ' + macros.proteinG + 'g');
      }
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
