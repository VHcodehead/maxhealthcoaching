import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get recent check-ins with profile info
    const recentCheckIns = await prisma.checkIn.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: {
          include: {
            profile: {
              select: { fullName: true, email: true },
            },
          },
        },
      },
    });

    const activity = recentCheckIns.map(ci => ({
      ...ci,
      client_name: ci.user.profile?.fullName || ci.user.profile?.email || 'Unknown',
    }));

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Coach activity error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
