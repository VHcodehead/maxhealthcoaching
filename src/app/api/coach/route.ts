import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const coach = await prisma.profile.findFirst({
      where: { role: 'coach' },
      select: { userId: true, fullName: true }
    });
    if (!coach) return NextResponse.json({ error: 'No coach found' }, { status: 404 });
    return NextResponse.json(coach);
  } catch (error) {
    console.error('Coach GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
