import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supplements = await prisma.supplementRecommendation.findMany({
      where: { userId: session.user.id, active: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ supplements });
  } catch (error) {
    console.error('Supplements GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
