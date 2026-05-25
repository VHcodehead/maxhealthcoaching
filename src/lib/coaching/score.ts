import type { ApplicationInput } from './schemas';

export const SCORE_VERSION = 'v1';
export const PRIORITY_THRESHOLD = 10;

export interface ScoreBreakdown {
  label: string;
  points: number;
}

export interface ScoreResult {
  score: number;
  priority: boolean;
  version: string;
  breakdown: ScoreBreakdown[];
}

const SERIOUS_GOALS = new Set([
  'bodybuilding',
  'contest_prep',
  'reverse_diet',
]);

export function scoreApplication(a: ApplicationInput): ScoreResult {
  const breakdown: ScoreBreakdown[] = [];
  const add = (label: string, points: number) => {
    if (points !== 0) breakdown.push({ label, points });
  };

  // Readiness signals
  if (a.seriousness === 'ready_now') add('Ready now', 3);
  else if (a.seriousness === 'curious') add('Just curious', -3);

  if (a.financialReadiness === 'yes_if_fit') add('Financial: yes if fit', 3);
  else if (a.financialReadiness === 'maybe_depends') add('Financial: maybe', 1);
  else if (a.financialReadiness === 'not_right_now') add('Financial: not now', -2);

  // Goal clarity
  if (a.goalNarrative.length >= 80 && a.motivation.length >= 40) {
    add('Goal clarity (detailed answers)', 2);
  }
  if (a.timeline && a.timeline.trim().length >= 2) add('Has timeline', 1);

  // Pain / urgency
  if (a.struggles.length >= 2) add('Multiple struggles', 2);

  // Specialty fit
  if (SERIOUS_GOALS.has(a.goalType)) add('Bodybuilding / prep specialty', 2);
  if (a.trainingExperience === 'competitor') add('Competitor athlete', 2);

  // Operational fit
  if (a.tracksFood === 'yes') add('Tracks food consistently', 1);
  if (a.gymAccess === 'full') add('Full gym access', 1);

  // Self-rated readiness
  if (a.readinessScore >= 8) add(`Readiness ${a.readinessScore}/10`, 2);

  // Effort signal — long-form answer to "why a coach"
  if (a.whyCoach.length >= 100) add('Thoughtful "why coach" answer', 1);

  // Soft negatives
  if (a.honesty === 'not_sure') add('Unsure about honesty', -1);
  if (a.structure === 'not_sure') add('Unsure about structure', -1);

  const score = breakdown.reduce((sum, b) => sum + b.points, 0);
  return {
    score,
    priority: score >= PRIORITY_THRESHOLD,
    version: SCORE_VERSION,
    breakdown,
  };
}
