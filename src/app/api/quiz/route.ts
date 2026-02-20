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

    const { goal, biggest_struggle } = parsed.data;

    // Recommend a plan tier based on answers
    let recommendedPlan: string;
    let recommendation: string;

    if (biggest_struggle === 'accountability' || biggest_struggle === 'consistency') {
      recommendedPlan = 'elite';
      recommendation = "Based on your answers, you'd benefit most from hands-on coaching with regular check-ins to keep you accountable. Our Elite plan includes weekly 1-on-1 sessions and direct messaging with your coach.";
    } else if (goal === 'build_muscle' || goal === 'recomp') {
      recommendedPlan = 'pro';
      recommendation = "Your goal requires precise nutrition and progressive training adjustments. Our Pro plan includes bi-weekly plan updates and priority coach review to keep your progress on track.";
    } else {
      recommendedPlan = 'basic';
      recommendation = "You're ready to get started with a structured plan. Our Basic plan gives you everything you need — custom meal plan, training program, and weekly check-in tracking.";
    }

    return NextResponse.json({
      success: true,
      recommendedPlan,
      recommendation,
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
