import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { leadSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Check if lead already exists
    const existing = await prisma.lead.findFirst({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json({ success: true, message: 'Already subscribed' });
    }

    await prisma.lead.create({
      data: {
        email: parsed.data.email,
        source: parsed.data.source || 'website',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Lead error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
