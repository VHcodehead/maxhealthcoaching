import { z } from 'zod';

export const goalEnum = z.enum([
  'fat_loss',
  'muscle_gain',
  'recomp',
  'transformation',
  'bodybuilding',
  'contest_prep',
  'reverse_diet',
  'unsure',
]);
export type GoalType = z.infer<typeof goalEnum>;

export const GOAL_OPTIONS: { value: GoalType; label: string; sub?: string }[] = [
  { value: 'fat_loss', label: 'Fat loss' },
  { value: 'muscle_gain', label: 'Muscle gain' },
  { value: 'recomp', label: 'Recomposition' },
  { value: 'transformation', label: 'Physique transformation' },
  { value: 'bodybuilding', label: 'Bodybuilding' },
  { value: 'contest_prep', label: 'Contest prep' },
  { value: 'reverse_diet', label: 'Reverse diet / post-show' },
  { value: 'unsure', label: 'Not sure — I need direction' },
];

export const struggleEnum = z.enum([
  'nutrition',
  'training',
  'consistency',
  'weekends',
  'accountability',
  'cravings',
  'structure',
  'plateau',
  'prep',
  'recovery',
  'other',
]);
export type Struggle = z.infer<typeof struggleEnum>;

export const STRUGGLE_OPTIONS: { value: Struggle; label: string }[] = [
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'training', label: 'Training intensity' },
  { value: 'consistency', label: 'Consistency' },
  { value: 'weekends', label: 'Weekends' },
  { value: 'accountability', label: 'Accountability' },
  { value: 'cravings', label: 'Hunger / cravings' },
  { value: 'structure', label: 'Lack of structure' },
  { value: 'plateau', label: 'Plateau' },
  { value: 'prep', label: 'Prep guidance' },
  { value: 'recovery', label: 'Recovery / sleep' },
  { value: 'other', label: 'Other' },
];

export const triEnum = z.enum(['yes', 'sort_of', 'not_sure']);
export type TriAnswer = z.infer<typeof triEnum>;

export const seriousnessEnum = z.enum(['ready_now', 'deciding', 'curious']);
export type Seriousness = z.infer<typeof seriousnessEnum>;

export const SERIOUSNESS_OPTIONS: { value: Seriousness; label: string; sub: string }[] = [
  { value: 'ready_now', label: "I'm ready now", sub: 'Locked in. Looking for the right coach.' },
  { value: 'deciding', label: "I'm interested but still deciding", sub: 'Weighing it out.' },
  { value: 'curious', label: "I'm just curious", sub: 'Window shopping for now.' },
];

export const financialEnum = z.enum(['yes_if_fit', 'maybe_depends', 'not_right_now']);
export type FinancialReadiness = z.infer<typeof financialEnum>;

export const FINANCIAL_OPTIONS: { value: FinancialReadiness; label: string; sub: string }[] = [
  { value: 'yes_if_fit', label: 'Yes, if it is the right fit', sub: 'Ready to invest in the right coach.' },
  { value: 'maybe_depends', label: 'Maybe, depends on price', sub: 'Value has to match the cost.' },
  { value: 'not_right_now', label: 'Not right now', sub: 'Budget is the blocker today.' },
];

export const experienceEnum = z.enum([
  'beginner',
  'one_to_two',
  'three_to_five',
  'five_plus',
  'competitor',
]);
export type TrainingExperience = z.infer<typeof experienceEnum>;

export const EXPERIENCE_OPTIONS: { value: TrainingExperience; label: string }[] = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'one_to_two', label: '1–2 years' },
  { value: 'three_to_five', label: '3–5 years' },
  { value: 'five_plus', label: '5+ years' },
  { value: 'competitor', label: 'Competitor / bodybuilding athlete' },
];

export const tracksFoodEnum = z.enum(['yes', 'sometimes', 'no']);
export const TRACKS_FOOD_OPTIONS = [
  { value: 'yes', label: 'Yes, consistently' },
  { value: 'sometimes', label: 'Sometimes' },
  { value: 'no', label: 'No' },
] as const;

export const gymEnum = z.enum(['full', 'limited', 'home', 'none']);
export const GYM_OPTIONS = [
  { value: 'full', label: 'Full gym' },
  { value: 'limited', label: 'Limited gym' },
  { value: 'home', label: 'Home only' },
  { value: 'none', label: 'No gym access' },
] as const;

export const step1Schema = z.object({
  name: z.string().min(2, 'Tell me your name'),
  email: z.string().email('Looks like a typo in your email'),
  phone: z.string().max(40).optional().or(z.literal('')),
  socialHandle: z.string().max(80).optional().or(z.literal('')),
  age: z.number({ message: 'Add your age' }).int().min(16, '16+ only').max(90),
  timezone: z.string().min(2, 'Add your timezone or city'),
});

export const step2Schema = z.object({
  goalType: goalEnum,
  goalNarrative: z.string().min(20, 'Give me a sentence or two — at least 20 characters'),
  motivation: z.string().min(20, 'Why does this matter to you right now?'),
  timeline: z.string().min(2, 'A rough timeline is fine'),
});

export const step3Schema = z.object({
  struggles: z.array(struggleEnum).min(1, 'Pick at least one'),
  triedBefore: z.string().min(10, 'A short list is fine'),
  whyFailed: z.string().min(10, 'Be honest — this is the most useful answer'),
});

export const step4Schema = z.object({
  whyCoach: z.string().min(20, 'Why a coach instead of going alone?'),
  honesty: triEnum,
  structure: triEnum,
  seriousness: seriousnessEnum,
  financialReadiness: financialEnum,
});

export const step5Schema = z
  .object({
    trainingExperience: experienceEnum,
    tracksFood: tracksFoodEnum,
    gymAccess: gymEnum,
    injuries: z.string().max(500).optional().or(z.literal('')),
    inPrep: z.boolean().default(false),
    showDate: z.string().max(60).optional().or(z.literal('')),
    federation: z.string().max(80).optional().or(z.literal('')),
    prepStage: z.string().max(120).optional().or(z.literal('')),
    currentCoach: z.string().max(120).optional().or(z.literal('')),
  })
  .superRefine((val, ctx) => {
    if (val.inPrep && (!val.showDate || val.showDate.trim().length < 2)) {
      ctx.addIssue({
        code: 'custom',
        path: ['showDate'],
        message: 'Add a show date or window',
      });
    }
  });

export const step6Schema = z.object({
  whatWorthIt: z.string().min(20, 'What would make this worth it for you?'),
  readinessScore: z.number({ message: 'Pick a number' }).int().min(1).max(10),
  anythingElse: z.string().max(1000).optional().or(z.literal('')),
});

const baseShape = step1Schema
  .merge(step2Schema)
  .merge(step3Schema)
  .merge(step4Schema)
  .merge(step6Schema);

export const applicationSchema = baseShape
  .merge(
    z.object({
      trainingExperience: experienceEnum,
      tracksFood: tracksFoodEnum,
      gymAccess: gymEnum,
      injuries: z.string().max(500).optional().or(z.literal('')),
      inPrep: z.boolean().default(false),
      showDate: z.string().max(60).optional().or(z.literal('')),
      federation: z.string().max(80).optional().or(z.literal('')),
      prepStage: z.string().max(120).optional().or(z.literal('')),
      currentCoach: z.string().max(120).optional().or(z.literal('')),
    }),
  )
  .superRefine((val, ctx) => {
    if (val.inPrep && (!val.showDate || val.showDate.trim().length < 2)) {
      ctx.addIssue({
        code: 'custom',
        path: ['showDate'],
        message: 'Add a show date or window',
      });
    }
  });

export type ApplicationInput = z.infer<typeof applicationSchema>;

export const STEP_FIELDS: ReadonlyArray<ReadonlyArray<keyof ApplicationInput>> = [
  ['name', 'email', 'phone', 'socialHandle', 'age', 'timezone'],
  ['goalType', 'goalNarrative', 'motivation', 'timeline'],
  ['struggles', 'triedBefore', 'whyFailed'],
  ['whyCoach', 'honesty', 'structure', 'seriousness', 'financialReadiness'],
  [
    'trainingExperience',
    'tracksFood',
    'gymAccess',
    'injuries',
    'inPrep',
    'showDate',
    'federation',
    'prepStage',
    'currentCoach',
  ],
  ['whatWorthIt', 'readinessScore', 'anythingElse'],
];

export const TOTAL_STEPS = STEP_FIELDS.length;
