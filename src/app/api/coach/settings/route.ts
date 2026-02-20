import { NextRequest, NextResponse } from 'next/server';
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

    let settings = await prisma.coachSettings.findUnique({
      where: { coachId: session.user.id },
    });

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.coachSettings.create({
        data: { coachId: session.user.id },
      });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Coach settings GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();

    const settings = await prisma.coachSettings.upsert({
      where: { coachId: session.user.id },
      update: {
        ...(body.max_clients !== undefined && { maxClients: body.max_clients }),
        ...(body.spots_remaining !== undefined && { spotsRemaining: body.spots_remaining }),
        ...(body.promo_active !== undefined && { promoActive: body.promo_active }),
        ...(body.promo_end !== undefined && { promoEnd: body.promo_end ? new Date(body.promo_end) : null }),
        ...(body.promo_discount_percent !== undefined && { promoDiscountPercent: body.promo_discount_percent }),
        ...(body.welcome_message !== undefined && { welcomeMessage: body.welcome_message }),
      },
      create: {
        coachId: session.user.id,
        maxClients: body.max_clients ?? 20,
        spotsRemaining: body.spots_remaining ?? 20,
        promoActive: body.promo_active ?? false,
        promoDiscountPercent: body.promo_discount_percent ?? 0,
        welcomeMessage: body.welcome_message,
      },
    });

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error('Coach settings PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
