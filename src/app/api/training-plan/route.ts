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

    // Determine minimum exercises per session based on split
    const splitExerciseMin: Record<string, number> = {
      bro_split: 8,
      ppl: 6,
      upper_lower: 7,
      full_body: 6,
      strength: 5,
    };
    const minExercises = splitExerciseMin[onboarding.splitPreference] || 6;

    const userPrompt = `Create a ${durationWeeks}-week training program. Each session MUST have ${minExercises}-10 working exercises (not counting warmup). This is a REAL program, not a template.

CLIENT: ${onboarding.weightKg}kg (${weightLbs}lbs), ${onboarding.heightCm}cm, ${onboarding.experienceLevel} level, goal: ${onboarding.goal}.
${onboarding.bodyFatPercentage ? `Body fat: ~${onboarding.bodyFatPercentage}%` : ''}

TRAINING SETUP:
- Split: ${splitDescriptions[onboarding.splitPreference] || onboarding.splitPreference}
- Frequency: ${onboarding.workoutFrequency} days/week
- Time per session: ${onboarding.timePerSession} minutes
- Location: ${onboarding.workoutLocation}${onboarding.workoutLocation === 'home' ? ` (equipment: ${onboarding.homeEquipment.length > 0 ? onboarding.homeEquipment.join(', ') : 'bodyweight only'})` : ' (full gym access)'}
- Cardio: ${onboarding.cardioPreference}

${onboarding.splitPreference === 'bro_split' ? `BRO SPLIT STRUCTURE (bodybuilding style):
- Day 1: Chest (8-10 exercises — flat/incline/decline pressing, flyes, cables, dips)
- Day 2: Back (8-10 exercises — rows, pulldowns, deadlifts, pullovers, rear delts)
- Day 3: Shoulders + Traps (8-10 exercises — overhead press, lateral raises, front raises, face pulls, shrugs)
- Day 4: Legs (8-10 exercises — squats, leg press, lunges, extensions, curls, calves)
- Day 5: Arms (8-10 exercises — bicep curls, tricep extensions, hammers, cables, close-grip bench)
Each session: start heavy compounds, progress to moderate rep isolation, finish with pump/burnout sets (15-20 reps).` : ''}
${onboarding.splitPreference === 'ppl' ? `PPL STRUCTURE:
- Push: chest + shoulders + triceps (6-8 exercises). Start bench/OHP, end with lateral raises and tricep isolation.
- Pull: back + biceps + rear delts (6-8 exercises). Start deadlift/rows, end with curls and face pulls.
- Legs: quads + hamstrings + glutes + calves (6-8 exercises). Start squat/leg press, end with curls and calf raises.` : ''}

VOLUME: Scale to ${levelMultiplier} end — Chest 10-20 sets/week, Back 10-20, Quads 10-16, Hamstrings 6-12, Shoulders 6-16, Biceps 6-12, Triceps 6-12.

INJURIES:
${injurySection}
${onboarding.injuryNotes ? `Notes: ${onboarding.injuryNotes}` : ''}

REQUIREMENTS:
- ${durationWeeks} weeks, ${onboarding.workoutFrequency} days/week
- ${minExercises}-10 exercises per session (MINIMUM ${minExercises}). Do NOT output sessions with only 3-4 exercises.
- Each exercise: 3-4 working sets. Vary rep ranges (4-6, 8-12, 12-20).
- Warmup: 3-5 items per session
- Rest: compounds 120-180s, isolation 60-90s. Always specify rest_seconds as a number.
${onboarding.experienceLevel === 'beginner' ? '- Linear progression. No deloads.' : ''}
${onboarding.experienceLevel === 'intermediate' ? '- Double progression. Deload every 4th week (40% volume reduction).' : ''}
${onboarding.experienceLevel === 'advanced' ? '- RPE/RIR based. Deload every 4th week. Include drop sets, rest-pause on isolation work.' : ''}
${onboarding.cardioPreference !== 'none' ? `- Add ${onboarding.cardioPreference} cardio in session notes.` : ''}

OUTPUT — valid JSON only:
{"program_name":"...","overview":"...","progression_rules":"...","weeks":[{"week":1,"days":[{"day_name":"Monday","session_name":"Chest","warmup":["5 min incline walk","Arm circles","Band pull-aparts"],"exercises":[{"name":"Barbell Bench Press","sets":4,"reps":"6-8","rpe":8,"rest_seconds":150,"tempo":"controlled","substitution":"","notes":""},{"name":"Incline Dumbbell Press","sets":3,"reps":"8-10","rpe":7,"rest_seconds":120,"tempo":"controlled","substitution":"","notes":""}]}]}]}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TRAINING_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.4,
      max_tokens: 16384,
    });

    console.log('Training OpenAI finish_reason:', response.choices[0]?.finish_reason);
    console.log('Training OpenAI usage:', JSON.stringify(response.usage));

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error('No content in training plan response');
      return NextResponse.json({ error: 'Failed to generate plan. Please try again.' }, { status: 500 });
    }

    if (response.choices[0]?.finish_reason === 'length') {
      console.error('Training plan response truncated — hit max_tokens limit');
      return NextResponse.json({ error: 'Plan generation was cut short. Please try again.' }, { status: 500 });
    }

    let planData;
    try {
      planData = JSON.parse(content);
    } catch (e) {
      console.error('Training plan JSON parse error:', e);
      console.error('Raw content (first 500 chars):', content.substring(0, 500));
      return NextResponse.json({ error: 'Invalid response format. Please try again.' }, { status: 500 });
    }

    if (!planData.weeks || !Array.isArray(planData.weeks)) {
      console.error('Missing weeks array. Keys:', Object.keys(planData));
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
