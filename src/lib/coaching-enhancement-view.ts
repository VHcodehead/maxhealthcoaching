// src/lib/coaching-enhancement-view.ts
//
// Maps a stored enhancement_checkin row into the coach EnhancementReview view
// model (grouped items + flagged signals). Flagging: categorical mild/notable,
// any positive boolean, low libido/mood, high fasted glucose.

import type { EnhancementReviewData } from '@/components/coaching-hub/panels';

type Row = Record<string, unknown>;

const catFlag = (v: unknown) => v === 'mild' || v === 'notable';
const display = (v: unknown): string => {
  if (v == null || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
};

export function buildEnhancementReview(row: Row | null, sex: string | null): EnhancementReviewData | null {
  if (!row) return null;
  const isFemale = (sex ?? '').toLowerCase().startsWith('f');

  const cat = (label: string, key: string) => ({ label, value: display(row[key]), flagged: catFlag(row[key]) });
  const yn = (label: string, key: string) => ({ label, value: display(row[key]), flagged: row[key] === true });
  const numHigh = (label: string, key: string, threshold: number) => {
    const n = typeof row[key] === 'number' ? (row[key] as number) : null;
    return { label, value: display(row[key]), flagged: n != null && n > threshold };
  };

  const groups: EnhancementReviewData['groups'] = [
    {
      title: 'Estrogenic',
      items: [cat('Nipple sensitivity', 'nippleSensitivity'), cat('Water retention', 'waterRetention'), cat('Mood swings', 'moodSwings')],
    },
    {
      title: 'Androgenic',
      items: [cat('Acne', 'acne'), cat('Hair shedding', 'hairShedding'), cat('Oily skin', 'oilySkin'), cat('Aggression', 'aggression')],
    },
    {
      title: 'Cardiovascular',
      items: [
        { label: 'Fasted BP', value: display(row.fastedBP), flagged: false },
        { label: 'Resting HR', value: display(row.restingHR), flagged: false },
        cat('Limb swelling', 'limbSwelling'),
        yn('Shortness of breath', 'shortnessOfBreath'),
      ],
    },
    {
      title: 'Oral / liver',
      items: [yn('Nausea', 'nausea'), yn('Appetite drop', 'appetiteDrop'), yn('Dark urine', 'darkUrine'), yn('RUQ discomfort', 'ruqDiscomfort'), yn('Lethargy', 'lethargy')],
    },
    {
      title: 'Metabolic',
      items: [numHigh('Fasted glucose', 'fastedGlucose', 100), yn('Excessive thirst', 'excessiveThirst')],
    },
    {
      title: 'Injection site',
      items: [cat('Soreness', 'siteSoreness'), yn('Redness', 'siteRedness'), yn('Lumps', 'siteLumps'), yn('Fever', 'fever')],
    },
    {
      title: 'Mental / sexual',
      items: [
        { label: 'Libido (1-5)', value: display(row.libido), flagged: typeof row.libido === 'number' && (row.libido as number) <= 2 },
        { label: 'Mood (1-10)', value: display(row.mood), flagged: typeof row.mood === 'number' && (row.mood as number) <= 4 },
        cat('Anxiety', 'anxiety'),
        yn('Night sweats', 'nightSweats'),
      ],
    },
  ];

  if (isFemale) {
    groups.push({
      title: 'Female-specific',
      items: [yn('Voice changes', 'voiceChanges'), yn('Abnormal hair growth', 'hairGrowth'), yn('Cycle disruption', 'cycleDisruption'), yn('Clitoral changes', 'clitoralChanges')],
    });
  }

  return {
    weekOf: new Date(row.weekOf as string).toISOString().slice(0, 10),
    groups,
    anythingOff: (row.anythingOff as string) ?? null,
  };
}
