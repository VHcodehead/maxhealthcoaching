import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { isClientOverdue } from '@/lib/checkin-schedule';
import { toSnakeCase } from '@/lib/serialize';

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
        const [lastCheckIn, checkInCount, macros, onboarding, pendingAdjustmentCount] = await Promise.all([
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
          prisma.pendingMacroAdjustment.count({
            where: { userId: client.userId, status: 'pending' },
          }),
        ]);

        // Determine status
        let status = 'pending';
        if (client.onboardingCompleted) {
          status = 'active';
          if (isClientOverdue(lastCheckIn?.createdAt ?? null, true)) {
            status = 'overdue';
          }
        }

        return {
          ...toSnakeCase(client),
          status,
          last_check_in: toSnakeCase(lastCheckIn),
          check_in_count: checkInCount,
          macros: toSnakeCase(macros),
          onboarding: toSnakeCase(onboarding),
          pending_adjustment_count: pendingAdjustmentCount,
        };
      })
    );

    return NextResponse.json({ clients: clientsWithData });
  } catch (error) {
    console.error('Admin clients error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
