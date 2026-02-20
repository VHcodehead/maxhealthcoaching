import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  // Create coach user
  const passwordHash = await bcrypt.hash('coach123', 12);

  const coach = await prisma.user.upsert({
    where: { email: 'coach@maxhealth.com' },
    update: {},
    create: {
      email: 'coach@maxhealth.com',
      passwordHash,
    },
  });

  await prisma.profile.upsert({
    where: { userId: coach.id },
    update: {},
    create: {
      userId: coach.id,
      email: 'coach@maxhealth.com',
      fullName: 'Max (Coach)',
      role: 'coach',
      subscriptionStatus: 'active',
      onboardingCompleted: true,
    },
  });

  // Create coach settings
  await prisma.coachSettings.upsert({
    where: { coachId: coach.id },
    update: {},
    create: {
      coachId: coach.id,
      maxClients: 20,
      spotsRemaining: 18,
    },
  });

  // Create sample transformation
  await prisma.transformation.create({
    data: {
      clientName: 'Sample Client',
      weightLost: '12 kg',
      duration: '16 weeks',
      quote: 'MaxHealth completely changed my approach to fitness and nutrition.',
      featured: true,
      approved: true,
    },
  });

  console.log('Seed complete: coach user + sample data created');
  console.log('Coach login: coach@maxhealth.com / coach123');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
