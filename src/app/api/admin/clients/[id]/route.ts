import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { toSnakeCase } from '@/lib/serialize';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: clientUserId } = await params;

    const [profile, onboarding, macros, mealPlan, trainingPlan, checkIns, pendingAdjustments] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: clientUserId } }),
      prisma.onboardingResponse.findFirst({
        where: { userId: clientUserId },
        orderBy: { version: 'desc' },
      }),
      prisma.macroTarget.findFirst({
        where: { userId: clientUserId },
        orderBy: { version: 'desc' },
      }),
      prisma.mealPlan.findFirst({
        where: { userId: clientUserId },
        orderBy: { version: 'desc' },
      }),
      prisma.trainingPlan.findFirst({
        where: { userId: clientUserId },
        orderBy: { version: 'desc' },
      }),
      prisma.checkIn.findMany({
        where: { userId: clientUserId },
        include: { progressPhotos: true },
        orderBy: { weekNumber: 'desc' },
      }),
      prisma.pendingMacroAdjustment.findMany({
        where: { userId: clientUserId, status: 'pending' },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!profile) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Generate photo URLs and serialize
    const checkInsWithPhotos = checkIns.map(ci => ({
      ...toSnakeCase(ci),
      progress_photos: ci.progressPhotos.map(p => ({
        ...toSnakeCase(p),
        url: `/api/photos/${p.storagePath}`,
      })),
    }));

    return NextResponse.json({
      profile: toSnakeCase(profile),
      onboarding: toSnakeCase(onboarding),
      macros: toSnakeCase(macros),
      mealPlan: toSnakeCase(mealPlan),
      trainingPlan: toSnakeCase(trainingPlan),
      checkIns: checkInsWithPhotos,
      pendingAdjustments: pendingAdjustments.map(toSnakeCase),
    });
  } catch (error) {
    console.error('Client detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
