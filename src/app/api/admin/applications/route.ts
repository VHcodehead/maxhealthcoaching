import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toSnakeCase } from '@/lib/serialize';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const applications = await prisma.profile.findMany({
      where: { subscriptionStatus: 'pending_approval' },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ applications: applications.map(toSnakeCase) });
  } catch (error) {
    console.error('Admin applications error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
