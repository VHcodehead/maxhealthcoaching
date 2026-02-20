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

    // Calculate weekly volume targets based on split + frequency
    const weightLbs = Math.round(onboarding.weightKg * 2.205);
    const levelMultiplier = onboarding.experienceLevel === 'beginner' ? 'low' : onboarding.experienceLevel === 'intermediate' ? 'moderate' : 'high';

    // Build injury avoidance section
    let injurySection = 'None reported';
    if (onboarding.injuries.length > 0) {
      const injuryMappings: Record<string, string> = {
        'shoulder impingement': 'AVOID: behind-neck press, upright rows, wide-grip bench press. USE INSTEAD: landmine press, cable lateral raise, neutral-grip dumbbell press.',
        'lower back pain': 'AVOID: conventional deadlift, good mornings, heavy barbell rows. USE INSTEAD: trap bar deadlift, hip thrust, chest-supported rows.',
        'knee pain': 'AVOID: deep barbell squats, heavy leg extensions. USE INSTEAD: box squats to parallel, leg press with limited ROM, step-ups.',
        'wrist pain': 'AVOID: straight bar curls, front squats with clean grip. USE INSTEAD: EZ-bar curls, cross-arm front squat or safety bar squat.',
        'elbow pain': 'AVOID: skull crushers, close-grip heavy pressing. USE INSTEAD: cable pushdowns, overhead cable tricep extensions.',
        'hip pain': 'AVOID: deep squats, sumo deadlift, wide-stance movements. USE INSTEAD: hip-width stance squat to parallel, conventional deadlift, step-ups.',
      };

      injurySection = onboarding.injuries.map(injury => {
        const lower = injury.toLowerCase();
        const mapping = Object.entries(injuryMappings).find(([key]) => lower.includes(key));
        return mapping
          ? `- ${injury}: ${mapping[1]}`
          : `- ${injury}: Avoid any exercise that causes pain in this area. Provide a safe substitution for each exercise that may aggravate it.`;
      }).join('\n');
    }

    const userPrompt = `Create a ${durationWeeks}-week training program for this client:

CLIENT BODY STATS:
- Weight: ${onboarding.weightKg} kg (${weightLbs} lbs)
- Height: ${onboarding.heightCm} cm
${onboarding.bodyFatPercentage ? `- Body fat: ~${onboarding.bodyFatPercentage}%` : '- Body fat: Unknown'}
- Experience level: ${onboarding.experienceLevel}

CLIENT PROFILE:
- Goal: ${onboarding.goal}
- Workout frequency: ${onboarding.workoutFrequency} days/week
- Location: ${onboarding.workoutLocation}
- Split preference: ${splitDescriptions[onboarding.splitPreference] || onboarding.splitPreference}
- Time per session: ${onboarding.timePerSession} minutes
- Cardio preference: ${onboarding.cardioPreference}
${onboarding.workoutLocation === 'home' ? `- Available equipment: ${onboarding.homeEquipment.length > 0 ? onboarding.homeEquipment.join(', ') : 'Bodyweight only'}` : '- Full gym access'}

VOLUME TARGETS (weekly working sets, scale to ${levelMultiplier} end of ranges):
- Chest: 10-20 sets | Back: 10-20 sets | Quads: 10-16 sets
- Hamstrings: 6-12 sets | Shoulders: 6-16 sets | Biceps: 6-12 sets | Triceps: 6-12 sets

INJURIES — EXPLICIT AVOIDANCE LIST:
${injurySection}
${onboarding.injuryNotes ? `Additional notes: ${onboarding.injuryNotes}` : ''}

REQUIREMENTS:
- Program must be exactly ${durationWeeks} weeks long
- ${onboarding.workoutFrequency} training days per week
- Each session within ${onboarding.timePerSession} minutes
- Include 3-5 warmup items per session (general cardio, dynamic stretching, activation)
- Compound movements: 2-3 min rest. Isolation movements: 60-90 sec rest. Always specify rest_seconds.
- Only prescribe tempo when it serves a purpose (slow eccentrics, pauses). Default is "controlled".
${onboarding.experienceLevel === 'beginner' ? '- LINEAR progression: add 2.5-5 lbs when all reps completed. Focus on compound movements and technique. No deload weeks needed.' : ''}
${onboarding.experienceLevel === 'intermediate' ? '- DOUBLE progression: hit top of rep range for all sets, then increase weight. Every 4th week is a deload (40% volume reduction, same intensity). Include rep range variety.' : ''}
${onboarding.experienceLevel === 'advanced' ? '- RPE-based progression with periodized volume blocks. Every 4th week is a deload (40% volume reduction, same intensity). Include intensity techniques and wave loading.' : ''}
- If the split preference conflicts with the frequency (e.g., PPL with 4 days, bro split for beginner), override to a better split and explain why in the overview.
${onboarding.cardioPreference !== 'none' ? `- Include ${onboarding.cardioPreference} cardio recommendations in session notes` : ''}

Respond with ONLY valid JSON matching this schema: ${JSON.stringify(TRAINING_PLAN_SCHEMA)}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TRAINING_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 16000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json({ error: 'Failed to generate plan. Please try again.' }, { status: 500 });
    }

    let planData;
    try {
      planData = JSON.parse(content);
    } catch {
      return NextResponse.json({ error: 'Invalid response format. Please try again.' }, { status: 500 });
    }

    if (!planData.weeks || !Array.isArray(planData.weeks)) {
      return NextResponse.json({ error: 'Incomplete plan generated. Please try again.' }, { status: 500 });
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
