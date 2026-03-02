import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'coach' && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const category = request.nextUrl.searchParams.get('category');
    const search = request.nextUrl.searchParams.get('search');

    const where: Record<string, unknown> = { active: true };

    if (category) {
      where.category = category;
    }

    if (search) {
      where.name = { contains: search, mode: 'insensitive' };
    }

    const catalog = await prisma.supplementCatalog.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    const entries = catalog.map((entry) => ({
      id: entry.id,
      name: entry.name,
      category: entry.category,
      description: entry.description,
      typical_forms: entry.typicalForms,
      default_form: entry.defaultForm,
      default_unit: entry.defaultUnit,
      dosage_low: entry.dosageLow,
      dosage_high: entry.dosageHigh,
      dosage_guidance: entry.dosageGuidance,
      default_timing: entry.defaultTiming,
      default_frequency: entry.defaultFrequency,
      active: entry.active,
    }));

    return NextResponse.json({ catalog: entries });
  } catch (error) {
    console.error('Catalog GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
