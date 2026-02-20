import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify coach role
    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all client profiles
    const clients = await prisma.profile.findMany({
      where: { role: 'client' },
      orderBy: { createdAt: 'desc' },
    });

    // Get check-in data for each client
    const clientsWithData = await Promise.all(
      clients.map(async (client) => {
        const [lastCheckIn, checkInCount, macros, onboarding] = await Promise.all([
          prisma.checkIn.findFirst({
            where: { userId: client.userId },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.checkIn.count({
            where: { userId: client.userId },
          }),
          prisma.macroTarget.findFirst({
            where: { userId: client.userId },
            orderBy: { version: 'desc' },
          }),
          prisma.onboardingResponse.findFirst({
            where: { userId: client.userId },
            orderBy: { version: 'desc' },
          }),
        ]);

        // Determine status
        let status = 'pending';
        if (client.onboardingCompleted) {
          status = 'active';
          if (lastCheckIn) {
            const daysSince = (Date.now() - lastCheckIn.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            if (daysSince > 10) status = 'overdue';
          }
        }

        return {
          ...client,
          status,
          last_check_in: lastCheckIn,
          check_in_count: checkInCount,
          macros,
          onboarding,
        };
      })
    );

    return NextResponse.json({ clients: clientsWithData });
  } catch (error) {
    console.error('Admin clients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
