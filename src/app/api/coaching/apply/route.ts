import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendCoachingApplicationNotification } from '@/lib/email';
import {
  GOAL_OPTIONS,
  STRUGGLE_OPTIONS,
  EXPERIENCE_OPTIONS,
  GYM_OPTIONS,
  TRACKS_FOOD_OPTIONS,
  SERIOUSNESS_OPTIONS,
  FINANCIAL_OPTIONS,
  applicationSchema,
  type ApplicationInput,
} from '@/lib/coaching/schemas';
import { scoreApplication, SCORE_VERSION } from '@/lib/coaching/score';

const COACH_EMAIL =
  process.env.COACH_NOTIFICATION_EMAIL ?? 'max@integrativeaisolutions.com';

function labelFor<T extends { value: string; label: string }>(
  options: ReadonlyArray<T>,
  value: string | undefined | null,
): string {
  if (!value) return '—';
  return options.find((o) => o.value === value)?.label ?? value;
}

function buildAnswerSummary(data: ApplicationInput) {
  const summary: { question: string; answer: string }[] = [
    { question: 'Goal type', answer: labelFor(GOAL_OPTIONS, data.goalType) },
    { question: 'Main goal (in their words)', answer: data.goalNarrative },
    { question: 'Why this matters now', answer: data.motivation },
    { question: 'Timeline', answer: data.timeline },
    {
      question: 'Struggles',
      answer: data.struggles.map((s) => labelFor(STRUGGLE_OPTIONS, s)).join(', '),
    },
    { question: 'What they’ve tried', answer: data.triedBefore },
    { question: 'Why it hasn’t worked', answer: data.whyFailed },
    { question: 'Why want a coach', answer: data.whyCoach },
    { question: 'Follow structure when motivation drops', answer: data.structure },
    { question: 'Seriousness', answer: labelFor(SERIOUSNESS_OPTIONS, data.seriousness) },
    {
      question: 'Financial readiness',
      answer: labelFor(FINANCIAL_OPTIONS, data.financialReadiness),
    },
    {
      question: 'Training experience',
      answer: labelFor(EXPERIENCE_OPTIONS, data.trainingExperience),
    },
    { question: 'Tracks food', answer: labelFor(TRACKS_FOOD_OPTIONS, data.tracksFood) },
    { question: 'Gym access', answer: labelFor(GYM_OPTIONS, data.gymAccess) },
  ];

  if (data.injuries && data.injuries.trim().length > 0) {
    summary.push({ question: 'Injuries / limitations', answer: data.injuries });
  }

  if (data.inPrep) {
    summary.push({ question: 'In prep / planning a show', answer: 'Yes' });
    if (data.showDate) summary.push({ question: 'Show date', answer: data.showDate });
    if (data.federation) summary.push({ question: 'Federation', answer: data.federation });
    if (data.prepStage) summary.push({ question: 'Prep stage', answer: data.prepStage });
    if (data.currentCoach) summary.push({ question: 'Current coach', answer: data.currentCoach });
  }

  summary.push(
    { question: 'What would make this worth it', answer: data.whatWorthIt },
    { question: 'Self-rated readiness', answer: `${data.readinessScore}/10` },
  );
  if (data.anythingElse && data.anythingElse.trim().length > 0) {
    summary.push({ question: 'Anything else', answer: data.anythingElse });
  }

  return summary;
}

export async function POST(request: Request) {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = applicationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const scoreResult = scoreApplication(data);

  // Pull attribution from headers if present
  const referrer = request.headers.get('referer') ?? null;

  let saved;
  try {
    saved = await prisma.coachingApplication.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        socialHandle: data.socialHandle || null,
        age: data.age,
        timezone: data.timezone,
        goalType: data.goalType,
        payload: data as object,
        leadScore: scoreResult.score,
        priority: scoreResult.priority,
        scoreVersion: SCORE_VERSION,
        referrer,
      },
    });
  } catch (err) {
    console.error('[coaching.apply] persist failed', err);
    return NextResponse.json(
      { error: 'Could not save application. Try again.' },
      { status: 500 },
    );
  }

  // Email notification — fire-and-forget for the response, but log failures.
  try {
    await sendCoachingApplicationNotification({
      to: COACH_EMAIL,
      applicationId: saved.id,
      applicantName: data.name,
      applicantEmail: data.email,
      applicantPhone: data.phone || null,
      applicantSocial: data.socialHandle || null,
      applicantAge: data.age,
      applicantTimezone: data.timezone,
      goalLabel: labelFor(GOAL_OPTIONS, data.goalType),
      leadScore: scoreResult.score,
      priority: scoreResult.priority,
      scoreBreakdown: scoreResult.breakdown,
      answers: buildAnswerSummary(data),
    });
  } catch (err) {
    // Don't fail the request — application is already saved.
    console.error('[coaching.apply] email failed', err);
  }

  return NextResponse.json({ ok: true, id: saved.id }, { status: 200 });
}
