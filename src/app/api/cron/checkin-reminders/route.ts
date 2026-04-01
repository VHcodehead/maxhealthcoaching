import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hasCheckedInThisWeek } from '@/lib/checkin-schedule';
import { sendCheckinReminderEmail } from '@/lib/email';

export async function GET(request: NextRequest) {
  // Validate CRON_SECRET
  const authorization = request.headers.get('authorization');
  if (!authorization || authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maxhealthfitness.com';
  const checkinUrl = `${appUrl}/checkin`;

  // Fetch all active, onboarded clients with their email
  const clients = await prisma.profile.findMany({
    where: {
      role: 'client',
      onboardingCompleted: true,
      subscriptionStatus: 'active',
    },
    select: {
      userId: true,
      fullName: true,
      email: true,
    },
  });

  let sent = 0;
  let skipped = 0;
  let errors = 0;

  // For each client, check if they've already checked in this week
  const emailTasks = clients.map(async (client) => {
    if (!client.email) {
      skipped++;
      return;
    }

    try {
      const latestCheckIn = await prisma.checkIn.findFirst({
        where: { userId: client.userId },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      });

      if (hasCheckedInThisWeek(latestCheckIn?.createdAt ?? null)) {
        skipped++;
        return;
      }

      await sendCheckinReminderEmail(
        client.email,
        client.fullName || 'there',
        checkinUrl
      );
      sent++;
    } catch (err) {
      console.error(`Checkin reminder failed for userId ${client.userId}:`, err);
      errors++;
    }
  });

  await Promise.allSettled(emailTasks);

  return NextResponse.json({ sent, skipped, errors });
}
