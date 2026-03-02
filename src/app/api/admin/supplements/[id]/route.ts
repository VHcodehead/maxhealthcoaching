import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(
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

    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.supplementRecommendation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Supplement not found' }, { status: 404 });
    }

    const supplement = await prisma.supplementRecommendation.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.dosage !== undefined && { dosage: body.dosage }),
        ...(body.unit !== undefined && { unit: body.unit }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.timing !== undefined && { timing: body.timing }),
        ...(body.category !== undefined && { category: body.category }),
        ...(body.form !== undefined && { form: body.form }),
        ...(body.brand !== undefined && { brand: body.brand || null }),
        ...(body.cycling_instructions !== undefined && { cyclingInstructions: body.cycling_instructions || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
        ...(body.active !== undefined && { active: body.active }),
      },
    });

    return NextResponse.json({ success: true, supplement });
  } catch (error) {
    console.error('Admin supplements PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
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

    const { id } = await params;
    const hard = request.nextUrl.searchParams.get('hard') === 'true';

    const existing = await prisma.supplementRecommendation.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Supplement not found' }, { status: 404 });
    }

    if (hard) {
      await prisma.supplementRecommendation.delete({ where: { id } });
    } else {
      await prisma.supplementRecommendation.update({
        where: { id },
        data: { active: false },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin supplements DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
