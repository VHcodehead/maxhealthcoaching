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
      bro_split: 6,
      ppl: 5,
      upper_lower: 5,
      full_body: 5,
      strength: 4,
    };
    const minExercises = splitExerciseMin[onboarding.splitPreference] || 6;

    // Goal-specific periodization context
    const goalContext = onboarding.goal === 'cut'
      ? `GOAL: CUTTING — Cap compound RPE at 8, shorter rest periods (60-90s compounds, 45-60s isolation), deload every 3rd week, prioritize muscle retention.`
      : onboarding.goal === 'bulk'
      ? `GOAL: BULKING — Longer accumulation phases, push volume to upper end of ranges, RPE 8-9 on isolation, longer rest for heavy sets (150-180s).`
      : `GOAL: RECOMP — Alternate strength-focused weeks (lower reps, higher intensity) with hypertrophy-focused weeks (higher reps, moderate intensity). Deload every 4th week.`;

    // Experience-level specific volume ranges
    const volumeRanges = onboarding.experienceLevel === 'beginner'
      ? 'Chest 8-12, Back 8-12, Quads 8-10, Hamstrings 6-8, Shoulders 6-10, Biceps 4-8, Triceps 4-8'
      : onboarding.experienceLevel === 'intermediate'
      ? 'Chest 12-16, Back 12-16, Quads 10-14, Hamstrings 8-10, Shoulders 10-14, Biceps 8-12, Triceps 8-12'
      : 'Chest 16-22, Back 16-22, Quads 12-18, Hamstrings 10-14, Shoulders 12-18, Biceps 10-14, Triceps 10-14';

    // Deload placement
    let deloadInstruction = '';
    if (onboarding.experienceLevel !== 'beginner') {
      if (durationWeeks <= 4) {
        deloadInstruction = `Week ${durationWeeks} is a DELOAD week (phase_name: "Deload"). Halve sets, drop RPE by 2, no intensity techniques.`;
      } else if (durationWeeks <= 8) {
        deloadInstruction = `Weeks ${Math.min(4, durationWeeks)} and ${Math.min(7, durationWeeks)} are DELOAD weeks (phase_name: "Deload"). Halve sets, drop RPE by 2, no intensity techniques.`;
      } else {
        deloadInstruction = `Weeks 4, 9, and ${durationWeeks} are DELOAD weeks (phase_name: "Deload"). Halve sets, drop RPE by 2, no intensity techniques.`;
      }
    }

    // Phase-template approach: for plans >4 weeks, generate one week per phase to fit in 16384 tokens
    // Server-side expansion duplicates phase-weeks to fill the full duration
    const usePhaseTemplates = durationWeeks > 4;

    // Build phase map for long plans
    let phaseMap: { phase: string; weeks: number[] }[] = [];
    let phasePrompt = '';
    if (usePhaseTemplates) {
      if (durationWeeks === 8) {
        phaseMap = [
          { phase: 'Accumulation', weeks: [1, 2, 3] },
          { phase: 'Intensification', weeks: [4, 5, 6] },
          { phase: 'Deload', weeks: [7] },
          { phase: 'Peak', weeks: [8] },
        ];
      } else { // 12 weeks
        phaseMap = [
          { phase: 'Accumulation', weeks: [1, 2, 3, 4] },
          { phase: 'Intensification', weeks: [5, 6, 7, 8] },
          { phase: 'Deload', weeks: [9] },
          { phase: 'Peak', weeks: [10, 11] },
          { phase: 'Deload', weeks: [12] },
        ];
      }
      // Deduplicate phases for template generation
      const uniquePhases = [...new Set(phaseMap.map(p => p.phase))];
      phasePrompt = `\nPHASE TEMPLATES: This is a ${durationWeeks}-week plan. Output ONLY ${uniquePhases.length} weeks — one TEMPLATE week per phase: ${uniquePhases.join(', ')}. I will duplicate them server-side to fill all ${durationWeeks} weeks. Set week numbers 1-${uniquePhases.length} and phase_name accordingly.`;
    }

    const weeksToGenerate = usePhaseTemplates
      ? [...new Set(phaseMap.map(p => p.phase))].length
      : durationWeeks;

    const phaseInstruction = usePhaseTemplates
      ? `Output exactly ${weeksToGenerate} template weeks with distinct phase_name values.`
      : `Set phase_name for each week: "Accumulation 1", "Accumulation 2", "Intensification 1", "Deload", "Peak", etc.`;

    const userPrompt = `Create a training program. Each session MUST have ${minExercises}-8 working exercises (not counting warmup). This is a REAL program, not a template.

CLIENT: ${onboarding.weightKg}kg (${weightLbs}lbs), ${onboarding.heightCm}cm, ${onboarding.experienceLevel} level, goal: ${onboarding.goal}.
${onboarding.bodyFatPercentage ? `Body fat: ~${onboarding.bodyFatPercentage}%` : ''}

${goalContext}

TRAINING SETUP:
- Split: ${splitDescriptions[onboarding.splitPreference] || onboarding.splitPreference}
- Frequency: ${onboarding.workoutFrequency} days/week
- Time per session: ${onboarding.timePerSession} minutes
- Location: ${onboarding.workoutLocation}${onboarding.workoutLocation === 'home' ? ` (equipment: ${onboarding.homeEquipment.length > 0 ? onboarding.homeEquipment.join(', ') : 'bodyweight only'})` : ' (full gym access)'}
- Cardio: ${onboarding.cardioPreference}

${onboarding.splitPreference === 'bro_split' ? `BRO SPLIT STRUCTURE (bodybuilding style):
- Day 1: Chest (6-8 exercises — flat/incline pressing, flyes, cables)
- Day 2: Back (6-8 exercises — rows, pulldowns, deadlifts, rear delts)
- Day 3: Shoulders + Traps (6-8 exercises — overhead press, lateral raises, face pulls, shrugs)
- Day 4: Legs (6-8 exercises — squats, leg press, lunges, extensions, curls, calves)
- Day 5: Arms (6-8 exercises — bicep curls, tricep extensions, hammers, cables)
Each session: start heavy compounds, progress to moderate rep isolation, finish with pump/burnout sets (15-20 reps).` : ''}
${onboarding.splitPreference === 'ppl' ? `PPL STRUCTURE:
- Push: chest + shoulders + triceps (6-8 exercises). Start bench/OHP, end with lateral raises and tricep isolation.
- Pull: back + biceps + rear delts (6-8 exercises). Start deadlift/rows, end with curls and face pulls.
- Legs: quads + hamstrings + glutes + calves (6-8 exercises). Start squat/leg press, end with curls and calf raises.` : ''}

WEEKLY VOLUME (sets/muscle group/week): ${volumeRanges}

PERIODIZATION:
${phaseInstruction}
${deloadInstruction}
${phasePrompt}

INJURIES:
${injurySection}
${onboarding.injuryNotes ? `Notes: ${onboarding.injuryNotes}` : ''}

REQUIREMENTS:
- ${weeksToGenerate} weeks in output, ${onboarding.workoutFrequency} days/week
- ${minExercises}-8 exercises per session (MINIMUM ${minExercises}). Do NOT output sessions with only 3-4 exercises.
- Each exercise: 3-4 working sets. Vary rep ranges (4-6, 8-12, 12-20).
- Every exercise MUST have rpe, rir, intensity_technique, and form_cues fields.
- intensity_technique: "none", "drop_set", "rest_pause", or "superset". Use "none" for most exercises.
- form_cues: array of 2-3 coaching cues per exercise.
- muscle_groups: array of target muscles for each day (e.g. ["chest", "triceps"]).
- Warmup: 3-5 items per session
- Rest: compounds 120-180s, isolation 60-90s. Always specify rest_seconds as a number.
${onboarding.experienceLevel === 'beginner' ? '- Linear progression. Set rpe and rir to 0 for all exercises.' : ''}
${onboarding.experienceLevel === 'intermediate' ? '- Double progression. RPE 6-8, RIR 2-4 compounds / 1-3 isolation.' : ''}
${onboarding.experienceLevel === 'advanced' ? '- RPE/RIR based. RPE 7-9.5. Include drop sets and rest-pause on isolation. Max 2 supersets/session.' : ''}
${onboarding.cardioPreference !== 'none' ? `- Include cardio object on each day: { "type": "${onboarding.cardioPreference === 'light' ? 'walking' : onboarding.cardioPreference === 'moderate' ? 'incline walk' : 'HIIT intervals'}", "duration_minutes": ${onboarding.cardioPreference === 'light' ? 15 : onboarding.cardioPreference === 'moderate' ? 25 : 20} }` : '- No cardio (omit cardio field or set to null).'}

OUTPUT — valid JSON only:
{"program_name":"...","overview":"...","progression_rules":"...","weeks":[{"week":1,"phase_name":"Accumulation","theme":"Volume building","days":[{"day_name":"Monday","session_name":"Chest","muscle_groups":["chest","triceps"],"warmup":["5 min incline walk","Arm circles","Band pull-aparts"],"exercises":[{"name":"Barbell Bench Press","sets":4,"reps":"6-8","rpe":8,"rir":2,"rest_seconds":150,"tempo":"controlled","intensity_technique":"none","form_cues":["Drive through heels","Keep elbows at 45°","Squeeze chest at top"],"substitution":"","notes":""},{"name":"Incline Dumbbell Press","sets":3,"reps":"8-10","rpe":7,"rir":3,"rest_seconds":120,"tempo":"controlled","intensity_technique":"none","form_cues":["30° incline angle","Full stretch at bottom","Control the negative"],"substitution":"","notes":""}],${onboarding.cardioPreference !== 'none' ? '"cardio":{"type":"incline walk","duration_minutes":20},' : '"cardio":null,'}"cooldown":"5 min light stretching","notes":""}]}]}`;

    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: TRAINING_PLAN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: {
        type: 'json_schema' as const,
        json_schema: {
          name: 'training_plan',
          strict: true,
          schema: TRAINING_PLAN_SCHEMA as Record<string, unknown>,
        },
      },
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

    // === PHASE-TEMPLATE EXPANSION ===
    // GPT outputs one template week per phase; use positional mapping to expand
    if (usePhaseTemplates && phaseMap.length > 0) {
      const templateWeeks = planData.weeks;
      const uniquePhases = [...new Set(phaseMap.map(p => p.phase))];

      console.log(`[Phase expansion] Got ${templateWeeks.length} template weeks for phases: ${uniquePhases.join(', ')}`);

      // Positional mapping: template week 0 → first unique phase, week 1 → second, etc.
      const expandedWeeks: any[] = [];
      for (let phaseIdx = 0; phaseIdx < uniquePhases.length; phaseIdx++) {
        const phase = uniquePhases[phaseIdx];
        const template = templateWeeks[phaseIdx];
        if (!template) {
          console.warn(`[Phase expansion] No template at position ${phaseIdx} for phase "${phase}"`);
          continue;
        }
        const weekNums = phaseMap.filter(p => p.phase === phase).flatMap(p => p.weeks);
        for (const weekNum of weekNums) {
          expandedWeeks.push({
            ...JSON.parse(JSON.stringify(template)),
            week: weekNum,
            phase_name: phase,
          });
        }
      }

      console.log(`[Phase expansion] Expanded ${templateWeeks.length} templates → ${expandedWeeks.length} weeks`);
      planData.weeks = expandedWeeks;
    }

    // === VALIDATION (log warnings, don't reject) ===
    if (planData.weeks.length !== durationWeeks) {
      console.warn(`[Training validation] Expected ${durationWeeks} weeks, got ${planData.weeks.length}`);
    }

    for (const week of planData.weeks) {
      const days = week.days || [];
      if (days.length !== onboarding.workoutFrequency) {
        console.warn(`[Training validation] Week ${week.week}: expected ${onboarding.workoutFrequency} days, got ${days.length}`);
      }
      for (const day of days) {
        const exercises = day.exercises || [];
        if (exercises.length < minExercises) {
          console.warn(`[Training validation] Week ${week.week}, ${day.day_name || day.day}: only ${exercises.length} exercises (min ${minExercises})`);
        }
        for (const ex of exercises) {
          if (ex.rpe === undefined || ex.rpe === null) {
            console.warn(`[Training validation] Missing RPE on exercise "${ex.name}" in week ${week.week}`);
          }
        }
      }
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
