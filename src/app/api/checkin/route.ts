import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { checkInSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = checkInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Determine week number
    const lastCheckIn = await prisma.checkIn.findFirst({
      where: { userId: session.user.id },
      orderBy: { weekNumber: 'desc' },
      select: { weekNumber: true },
    });

    const weekNumber = lastCheckIn ? lastCheckIn.weekNumber + 1 : 1;

    const checkIn = await prisma.checkIn.create({
      data: {
        userId: session.user.id,
        weekNumber,
        weightKg: parsed.data.weight_kg,
        waistCm: parsed.data.waist_cm ?? null,
        adherenceRating: parsed.data.adherence_rating,
        stepsAvg: parsed.data.steps_avg ?? 0,
        sleepAvg: parsed.data.sleep_avg ?? 7,
        notes: parsed.data.notes ?? '',
      },
    });

    return NextResponse.json({ success: true, checkIn });
  } catch (error) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const checkIns = await prisma.checkIn.findMany({
      where: { userId: session.user.id },
      include: { progressPhotos: true },
      orderBy: { weekNumber: 'desc' },
    });

    return NextResponse.json({ checkIns });
  } catch (error) {
    console.error('Check-in GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
