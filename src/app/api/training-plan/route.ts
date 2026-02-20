import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { getOpenAI, TRAINING_PLAN_SYSTEM_PROMPT, TRAINING_PLAN_SCHEMA } from '@/lib/openai';

const rateLimitMap = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60000;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const lastCall = rateLimitMap.get(session.user.id);
    if (lastCall && Date.now() - lastCall < RATE_LIMIT_WINDOW) {
      return NextResponse.json({ error: 'Please wait before generating another plan' }, { status: 429 });
    }
    rateLimitMap.set(session.user.id, Date.now());

    const body = await request.json().catch(() => ({}));
    const targetUserId = body.user_id || session.user.id;
    const durationOverride = body.duration_weeks;

    const onboarding = await prisma.onboardingResponse.findFirst({
      where: { userId: targetUserId },
      orderBy: { version: 'desc' },
    });

    if (!onboarding) {
      return NextResponse.json({ error: 'No onboarding data found' }, { status: 404 });
    }

    const durationWeeks = durationOverride || onboarding.planDurationWeeks;

    const splitDescriptions: Record<string, string> = {
      full_body: 'Full Body (all muscle groups each session)',
      upper_lower: 'Upper/Lower Split',
      ppl: 'Push/Pull/Legs',
      bro_split: 'Body Part Split (one muscle group per day)',
      strength: 'Strength/Powerlifting Focus (squat, bench, deadlift emphasis)',
    };

    const userPrompt = `Create a ${durationWeeks}-week training program for this client:

CLIENT PROFILE:
- Experience level: ${onboarding.experienceLevel}
- Goal: ${onboarding.goal}
- Workout frequency: ${onboarding.workoutFrequency} days/week
- Location: ${onboarding.workoutLocation}
- Split preference: ${splitDescriptions[onboarding.splitPreference] || onboarding.splitPreference}
- Time per session: ${onboarding.timePerSession} minutes
- Cardio preference: ${onboarding.cardioPreference}
${onboarding.workoutLocation === 'home' ? `- Available equipment: ${onboarding.homeEquipment.length > 0 ? onboarding.homeEquipment.join(', ') : 'Bodyweight only'}` : '- Full gym access'}

INJURIES/LIMITATIONS:
${onboarding.injuries.length > 0 ? onboarding.injuries.join(', ') : 'None reported'}
${onboarding.injuryNotes ? `Notes: ${onboarding.injuryNotes}` : ''}

REQUIREMENTS:
- Program must be exactly ${durationWeeks} weeks long
- ${onboarding.workoutFrequency} training days per week
- Each session within ${onboarding.timePerSession} minutes
- Include warm-up for each session
- Use RPE-based intensity
- Include progression model (double progression for beginners, RPE-based for advanced)
${onboarding.experienceLevel === 'beginner' ? '- Focus on compound movements and technique. Keep it simple.' : ''}
${onboarding.experienceLevel === 'intermediate' ? '- Include periodization and rep range variety.' : ''}
${onboarding.experienceLevel === 'advanced' ? '- Include advanced periodization, intensity techniques, and deload weeks (every 4th week).' : ''}
- Provide exercise substitutions for any movement that might aggravate listed injuries
${onboarding.cardioPreference !== 'none' ? `- Include ${onboarding.cardioPreference} cardio recommendations` : ''}

Respond with ONLY valid JSON matching this schema: ${JSON.stringify(TRAINING_PLAN_SCHEMA)}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TRAINING_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 16000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    let planData;
    try {
      planData = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 500 });
    }

    if (!planData.weeks || !Array.isArray(planData.weeks)) {
      return NextResponse.json({ error: 'AI generated incomplete plan' }, { status: 500 });
    }

    const existing = await prisma.trainingPlan.findFirst({
      where: { userId: targetUserId },
      orderBy: { version: 'desc' },
      select: { version: true },
    });

    const version = existing ? existing.version + 1 : 1;

    const trainingPlan = await prisma.trainingPlan.create({
      data: {
        userId: targetUserId,
        version,
        durationWeeks: durationWeeks,
        planData,
      },
    });

    return NextResponse.json({ success: true, trainingPlan });
  } catch (error) {
    console.error('Training plan error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
