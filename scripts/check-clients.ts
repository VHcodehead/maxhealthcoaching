import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const profiles = await prisma.profile.findMany({
    where: { role: 'client' },
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  for (const p of profiles) {
    const ob = await prisma.onboardingResponse.findFirst({
      where: { userId: p.userId },
      orderBy: { version: 'desc' },
    });
    const macros = await prisma.macroTarget.findFirst({
      where: { userId: p.userId },
      orderBy: { version: 'desc' },
    });

    console.log('---');
    console.log('Name:', p.fullName);
    if (ob) {
      console.log('  Weight:', ob.weightKg, 'kg (' + Math.round(ob.weightKg * 2.205) + ' lbs)');
      console.log('  Height:', ob.heightCm, 'cm | Age:', ob.age, '| Sex:', ob.sex);
      console.log('  BF%:', ob.bodyFatPercentage, '| BF Unsure:', ob.bodyFatUnsure);
      console.log('  Goal:', ob.goal, '| Activity:', ob.activityLevel);
    } else {
      console.log('  No onboarding data');
    }
    if (macros) {
      console.log('  Calories:', macros.calorieTarget, '| P:', macros.proteinG, '| C:', macros.carbsG, '| F:', macros.fatG);
      console.log('  BMR:', macros.bmr, '| TDEE:', macros.tdee, '| Formula:', macros.formulaUsed);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
