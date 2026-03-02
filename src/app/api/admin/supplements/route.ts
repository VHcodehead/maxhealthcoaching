import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

const VALID_FREQUENCIES = ['daily', 'twice_daily', 'as_needed', 'cycling'];
const VALID_TIMINGS = ['morning', 'pre_workout', 'post_workout', 'with_meals', 'evening', 'bedtime'];
const VALID_CATEGORIES = ['vitamin', 'mineral', 'performance', 'recovery', 'protein', 'health', 'organ_support', 'sleep', 'hormonal'];
const VALID_FORMS = ['capsule', 'powder', 'liquid', 'tablet', 'softgel'];

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = request.nextUrl.searchParams.get('user_id');
    if (!userId) {
      return NextResponse.json({ error: 'user_id is required' }, { status: 400 });
    }

    const supplements = await prisma.supplementRecommendation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ supplements });
  } catch (error) {
    console.error('Admin supplements GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { user_id, name, dosage, unit, frequency, timing, category, form, brand, cycling_instructions, notes, catalog_id } = body;

    if (!user_id || !name || !dosage || !unit || !frequency || !timing || !category || !form) {
      return NextResponse.json(
        { error: 'user_id, name, dosage, unit, frequency, timing, category, and form are required' },
        { status: 400 }
      );
    }

    if (!VALID_FREQUENCIES.includes(frequency)) {
      return NextResponse.json({ error: `frequency must be one of: ${VALID_FREQUENCIES.join(', ')}` }, { status: 400 });
    }
    if (!VALID_TIMINGS.includes(timing)) {
      return NextResponse.json({ error: `timing must be one of: ${VALID_TIMINGS.join(', ')}` }, { status: 400 });
    }
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ error: `category must be one of: ${VALID_CATEGORIES.join(', ')}` }, { status: 400 });
    }
    if (!VALID_FORMS.includes(form)) {
      return NextResponse.json({ error: `form must be one of: ${VALID_FORMS.join(', ')}` }, { status: 400 });
    }

    const supplement = await prisma.supplementRecommendation.create({
      data: {
        userId: user_id,
        coachId: session.user.id,
        name,
        dosage,
        unit,
        frequency,
        timing,
        category,
        form,
        brand: brand || null,
        cyclingInstructions: cycling_instructions || null,
        notes: notes || null,
        catalogId: catalog_id || null,
      },
    });

    return NextResponse.json({ success: true, supplement });
  } catch (error) {
    console.error('Admin supplements POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
