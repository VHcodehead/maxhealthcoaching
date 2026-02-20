import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { quizSchema } from '@/lib/validations';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = quizSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
    }

    // Generate teaser result based on quiz answers
    const { goal, experience } = parsed.data;

    let teaserCalories: number;
    let teaserProtein: number;

    // Very rough estimates for teaser
    if (goal === 'lose_fat') {
      teaserCalories = experience === 'beginner' ? 1800 : 2000;
      teaserProtein = 150;
    } else if (goal === 'build_muscle') {
      teaserCalories = experience === 'beginner' ? 2500 : 2800;
      teaserProtein = 180;
    } else {
      teaserCalories = 2200;
      teaserProtein = 160;
    }

    return NextResponse.json({
      success: true,
      teaser: {
        estimated_calories: teaserCalories,
        estimated_protein: teaserProtein,
        recommendation: goal === 'lose_fat'
          ? "Based on your answers, you'd benefit from a structured cut with controlled calorie reduction and high protein to preserve muscle."
          : goal === 'build_muscle'
          ? "You're in a great position to build muscle. A moderate calorie surplus with progressive training will get you there."
          : "Body recomposition is perfect for your situation. Eating at maintenance with high protein and progressive training will transform your physique.",
      },
    });
  } catch (error) {
    console.error('Quiz error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  // Save quiz + email as lead
  try {
    const body = await request.json();
    const { email, quiz_answers } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    // Upsert lead - find by email first
    const existing = await prisma.lead.findFirst({
      where: { email },
    });

    if (existing) {
      await prisma.lead.update({
        where: { id: existing.id },
        data: {
          source: 'quiz',
          quizAnswers: quiz_answers,
        },
      });
    } else {
      await prisma.lead.create({
        data: {
          email,
          source: 'quiz',
          quizAnswers: quiz_answers,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Quiz save error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
