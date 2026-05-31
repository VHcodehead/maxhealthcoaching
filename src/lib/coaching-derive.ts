// src/lib/coaching-derive.ts
//
// Unified Coaching Hub — pure derivation layer. Turns a raw CoachingExport into
// the triage-first view models the coach UI renders: flags, "THE ONE THING",
// metric tiles (+sparkline series), weekly comparison rows, daily grid, and the
// lifting-progression grid. No I/O, no React — just data → view models, so it's
// trivially testable and reused by both the list and detail surfaces.
//
// Thresholds follow spec §5 (elite defaults). App-only data can't surface every
// flag (BP/glucose/stress arrive with prep_checkins in Phase 2) — we compute
// what the app provides and leave the rest to later phases.

import type {
  CoachingExport,
  ExportCheckin,
  TrainingSetLog,
  WeightHistoryPoint,
} from './coaching-types';

export type Severity = 'warn' | 'bad' | 'good';

export interface Flag {
  key: string;
  label: string;
  severity: Severity;
  detail?: string;
}

export interface MetricTile {
  key: string;
  label: string;
  value: string; // formatted
  unit?: string;
  delta?: string; // formatted signed delta, e.g. "▼2.0"
  deltaSeverity?: Severity;
  series: number[]; // oldest → newest, for the sparkline
  direction: 'up' | 'down' | 'flat';
}

export interface ComparisonRow {
  label: string;
  last: string;
  this: string;
  delta?: string;
  severity?: Severity;
  isNew?: boolean;
}

export interface DailyGrid {
  days: string[]; // weekday labels, oldest → newest
  rows: Array<{ label: string; values: string[]; avg?: string }>;
}

export interface LiftingExercise {
  name: string;
  sessions: string[]; // dates, oldest → newest (ISO date)
  sets: Array<{ setNumber: number; cells: string[] }>; // cells align to sessions
  volumeTrend: 'up' | 'down' | 'flat';
}

// ── small utils ──────────────────────────────────────────────────────────────

const KG_TO_LBS = 2.20462;

function num(v: unknown): number | null {
  const n = typeof v === 'string' ? parseFloat(v) : (v as number);
  return typeof n === 'number' && !Number.isNaN(n) ? n : null;
}

function avg(nums: number[]): number | null {
  const vals = nums.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function isoDate(d: string | null | undefined): string {
  return (d ?? '').slice(0, 10);
}

function round(n: number, dp = 1): number {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}

function fmtDelta(delta: number, dp = 1): string {
  const r = round(Math.abs(delta), dp);
  if (r === 0) return '—';
  return `${delta < 0 ? '▼' : '▲'}${r}`;
}

function sortByDateAsc<T extends { date?: string; logged_at?: string | null; checked_at?: string }>(
  rows: T[],
  key: 'date' | 'logged_at' | 'checked_at',
): T[] {
  return [...rows].sort((a, b) => String(a[key] ?? '').localeCompare(String(b[key] ?? '')));
}

// ── checkins helpers ──────────────────────────────────────────────────────────

/** Most-recent-first checkins (the export already returns desc, but be safe). */
function checkinsDesc(ex: CoachingExport): ExportCheckin[] {
  return [...(ex.checkins ?? [])].sort((a, b) =>
    String(b.checked_at ?? '').localeCompare(String(a.checked_at ?? '')),
  );
}

function sleepHoursFromWearable(ex: CoachingExport): { date: string; hours: number }[] {
  return (ex.biometrics?.wearable ?? [])
    .map((w) => ({ date: isoDate(w.date), hours: num(w.sleep_hours) ?? NaN }))
    .filter((w) => !Number.isNaN(w.hours))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function restHrFromWearable(ex: CoachingExport): { date: string; rhr: number }[] {
  return (ex.biometrics?.wearable ?? [])
    .map((w) => ({ date: isoDate(w.date), rhr: num(w.resting_heart_rate) ?? NaN }))
    .filter((w) => !Number.isNaN(w.rhr))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// ── weight (history is stored in the app's logged unit; checkins are LBS) ─────

function weightSeries(ex: CoachingExport): WeightHistoryPoint[] {
  return [...(ex.biometrics?.weightHistory ?? [])].sort((a, b) => a.date.localeCompare(b.date));
}

// ── FLAGS ─────────────────────────────────────────────────────────────────────

export function deriveFlags(ex: CoachingExport): Flag[] {
  const flags: Flag[] = [];
  const checkins = checkinsDesc(ex);
  const latest = checkins[0];

  // Missed check-in > 9 days (or never).
  if (latest?.checked_at) {
    const days = Math.floor((Date.now() - new Date(latest.checked_at).getTime()) / 86400000);
    if (days > 9) {
      flags.push({ key: 'missed_checkin', label: `No check-in ${days}d`, severity: 'bad', detail: `Last check-in ${days} days ago` });
    }
  }

  // Sleep < 6.5h (latest 7-day avg from wearable).
  const sleep = sleepHoursFromWearable(ex);
  if (sleep.length) {
    const recent = avg(sleep.slice(-7).map((s) => s.hours));
    if (recent != null && recent < 6.5) {
      flags.push({ key: 'sleep_low', label: `Sleep ${round(recent)}h`, severity: 'warn', detail: `7-day avg sleep ${round(recent)}h (< 6.5h)` });
    }
  }

  // Resting HR sustained +7 over baseline.
  const rhr = restHrFromWearable(ex);
  if (rhr.length >= 4) {
    const baseline = Math.min(...rhr.slice(0, Math.ceil(rhr.length / 2)).map((r) => r.rhr));
    const recent = avg(rhr.slice(-3).map((r) => r.rhr));
    if (recent != null && recent - baseline >= 7) {
      flags.push({ key: 'rhr_up', label: `Rest HR +${Math.round(recent - baseline)}`, severity: 'warn', detail: `Resting HR ${Math.round(recent)} vs baseline ${baseline}` });
    }
  }

  // Adherence < 85%.
  const adh = ex.nutrition?.adherencePct7d;
  if (typeof adh === 'number' && adh < 85) {
    flags.push({ key: 'adherence_low', label: `Adherence ${Math.round(adh)}%`, severity: adh < 70 ? 'bad' : 'warn', detail: `7-day calorie adherence ${Math.round(adh)}%` });
  }

  // Weight stall: last-7-day avg vs prior-7-day avg within tolerance.
  const ws = weightSeries(ex);
  if (ws.length >= 6) {
    const recent = avg(ws.slice(-7).map((w) => w.weight));
    const prior = avg(ws.slice(-14, -7).map((w) => w.weight));
    if (recent != null && prior != null && Math.abs(recent - prior) < 0.4) {
      flags.push({ key: 'weight_stall', label: 'Weight stalled', severity: 'warn', detail: 'No meaningful weight movement across 2 weeks' });
    }
  }

  // Subjective flags from the latest app check-in.
  if (latest) {
    const hunger = num(latest.hunger_level);
    if (hunger != null && hunger >= 4) {
      flags.push({ key: 'hunger_high', label: `Hunger ${hunger}/5`, severity: 'warn', detail: 'Sustained high hunger' });
    }
    const energy = num(latest.energy);
    if (energy != null && energy > 0 && energy <= 4) {
      flags.push({ key: 'energy_low', label: `Energy ${energy}`, severity: 'warn', detail: 'Low energy/motivation reported' });
    }
    if (typeof latest.digestion === 'string' && /poor|bad|issue/i.test(latest.digestion)) {
      flags.push({ key: 'digestion', label: 'Digestion issue', severity: 'warn', detail: `Digestion: ${latest.digestion}` });
    }
    if (typeof latest.notes === 'string' && /injur|pain|tweak|strain|sharp|hurt/i.test(latest.notes)) {
      flags.push({ key: 'injury', label: 'Injury reported', severity: 'bad', detail: latest.notes.slice(0, 140) });
    }
  }

  return flags;
}

/** Highest-priority flag, phrased as a coaching directive. */
export function deriveOneThing(flags: Flag[]): string | null {
  const priority = ['injury', 'missed_checkin', 'weight_stall', 'sleep_low', 'rhr_up', 'adherence_low', 'hunger_high', 'energy_low', 'digestion'];
  for (const key of priority) {
    const f = flags.find((x) => x.key === key);
    if (f) {
      switch (key) {
        case 'injury': return `${f.detail ?? 'Injury reported'} — adjust training to work around it this week.`;
        case 'missed_checkin': return `${f.detail} — reach out before the data goes stale.`;
        case 'weight_stall': return 'Weight has stalled 2 weeks — time to adjust intake or output.';
        case 'sleep_low': return `${f.detail} — recovery is the lever this week.`;
        case 'rhr_up': return `${f.detail} — watch fatigue/stress, consider a lighter week.`;
        case 'adherence_low': return `${f.detail} — tighten tracking before changing the plan.`;
        case 'hunger_high': return 'Hunger is running high — check protein/fiber/volume before pushing the deficit.';
        case 'energy_low': return 'Energy/motivation is low — assess sleep, deficit depth, and training load.';
        case 'digestion': return `${f.detail} — address before it affects adherence.`;
      }
    }
  }
  return null;
}

// ── METRIC TILES ────────────────────────────────────────────────────────────

function buildTile(
  key: string,
  label: string,
  series: number[],
  opts: { unit?: string; dp?: number; goodWhen?: 'up' | 'down' | 'either' } = {},
): MetricTile | null {
  const clean = series.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (!clean.length) return null;
  const dp = opts.dp ?? 1;
  const current = clean[clean.length - 1];
  const prev = clean.length >= 2 ? clean[0] : current;
  const delta = current - prev;
  const direction: MetricTile['direction'] = Math.abs(delta) < Math.pow(10, -dp) ? 'flat' : delta > 0 ? 'up' : 'down';

  let deltaSeverity: Severity | undefined;
  if (opts.goodWhen && direction !== 'flat') {
    const good = (opts.goodWhen === 'up' && direction === 'up') || (opts.goodWhen === 'down' && direction === 'down');
    deltaSeverity = opts.goodWhen === 'either' ? undefined : good ? 'good' : 'warn';
  }

  return {
    key,
    label,
    value: dp === 0 ? String(Math.round(current)) : String(round(current, dp)),
    unit: opts.unit,
    delta: direction === 'flat' ? '—' : fmtDelta(delta, dp),
    deltaSeverity,
    series: clean.slice(-8),
    direction,
  };
}

export function deriveTiles(ex: CoachingExport): MetricTile[] {
  const tiles: MetricTile[] = [];

  const ws = weightSeries(ex);
  const weightTile = buildTile('weight', 'Weight', ws.map((w) => w.weight), { unit: 'lbs', dp: 1 });
  if (weightTile) tiles.push(weightTile);

  const sleep = sleepHoursFromWearable(ex);
  const sleepTile = buildTile('sleep', 'Sleep', sleep.map((s) => s.hours), { unit: 'h', dp: 1, goodWhen: 'up' });
  if (sleepTile) tiles.push(sleepTile);

  const rhr = restHrFromWearable(ex);
  const rhrTile = buildTile('rhr', 'Rest HR', rhr.map((r) => r.rhr), { unit: 'bpm', dp: 0, goodWhen: 'down' });
  if (rhrTile) tiles.push(rhrTile);

  const steps = sortByDateAsc(ex.biometrics?.stepHistory ?? [], 'date').map((s) => s.steps);
  const stepsTile = buildTile('steps', 'Steps', steps, { dp: 0 });
  if (stepsTile) tiles.push(stepsTile);

  // Adherence: single 7-day number; show as a flat tile with the value.
  const adh = ex.nutrition?.adherencePct7d;
  if (typeof adh === 'number') {
    tiles.push({
      key: 'adherence',
      label: 'Adherence',
      value: String(Math.round(adh)),
      unit: '%',
      delta: undefined,
      series: [adh],
      direction: 'flat',
      deltaSeverity: adh >= 85 ? 'good' : adh < 70 ? 'bad' : 'warn',
    });
  }

  return tiles;
}

// ── WEEKLY COMPARISON (last vs this app check-in) ─────────────────────────────

export function deriveComparison(ex: CoachingExport): { window: string; rows: ComparisonRow[] } {
  const c = checkinsDesc(ex);
  const cur = c[0];
  const prev = c[1];
  if (!cur) return { window: 'No check-ins yet', rows: [] };

  const window = prev
    ? `${isoDate(prev.checked_at)} → ${isoDate(cur.checked_at)}`
    : `${isoDate(cur.checked_at)} (first check-in)`;

  const rows: ComparisonRow[] = [];

  const pushNum = (label: string, a: unknown, b: unknown, opts: { dp?: number; goodWhen?: 'up' | 'down' } = {}) => {
    const bn = num(b);
    const an = num(a);
    if (bn == null && an == null) return;
    const dp = opts.dp ?? 1;
    let delta: string | undefined;
    let severity: Severity | undefined;
    if (an != null && bn != null) {
      const d = bn - an;
      delta = Math.abs(d) < Math.pow(10, -dp) ? '—' : fmtDelta(d, dp);
      if (opts.goodWhen && delta !== '—') {
        const good = (opts.goodWhen === 'up' && d > 0) || (opts.goodWhen === 'down' && d < 0);
        severity = good ? 'good' : 'warn';
      }
    }
    rows.push({
      label,
      last: an != null ? String(round(an, dp)) : '—',
      this: bn != null ? String(round(bn, dp)) : '—',
      delta,
      severity,
    });
  };

  const pushText = (label: string, a: unknown, b: unknown) => {
    const at = a == null ? '' : String(a);
    const bt = b == null ? '' : String(b);
    if (!at && !bt) return;
    rows.push({ label, last: at || '—', this: bt || '—', isNew: !at && !!bt });
  };

  pushNum('Weight (lbs)', prev?.weight, cur.weight, { dp: 1 });
  pushNum('Hunger (1-5)', prev?.hunger_level, cur.hunger_level, { dp: 0, goodWhen: 'down' });
  pushNum('Energy', prev?.energy, cur.energy, { dp: 0, goodWhen: 'up' });
  pushNum('Mood', prev?.mood, cur.mood, { dp: 0, goodWhen: 'up' });
  pushText('Sleep quality', prev?.sleep_quality, cur.sleep_quality);
  pushText('Digestion', prev?.digestion, cur.digestion);
  pushText('Notes', prev?.notes, cur.notes);

  return { window, rows };
}

// ── DAILY GRID (last 7 days) ──────────────────────────────────────────────────

const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function deriveDailyGrid(ex: CoachingExport): DailyGrid {
  // Build the last 7 ISO dates (oldest → newest).
  const today = new Date();
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86400000);
    dates.push(d.toISOString().slice(0, 10));
  }
  const labels = dates.map((d) => WD[new Date(d + 'T00:00:00').getDay()]);

  const weightMap = new Map<string, number>();
  for (const w of ex.biometrics?.weightHistory ?? []) weightMap.set(isoDate(w.date), w.weight);
  const stepMap = new Map<string, number>();
  for (const s of ex.biometrics?.stepHistory ?? []) stepMap.set(isoDate(s.date), s.steps);
  const sleepMap = new Map<string, number>();
  for (const s of sleepHoursFromWearable(ex)) sleepMap.set(s.date, s.hours);
  const calMap = new Map<string, number>();
  for (const f of ex.nutrition?.recentFoodLogs ?? []) {
    const d = isoDate(f.logged_at as string);
    if (!d) continue;
    calMap.set(d, (calMap.get(d) ?? 0) + (num(f.calories) ?? 0));
  }

  const fmtRow = (map: Map<string, number>, dp: number, divideK = false) => {
    const vals: number[] = [];
    const cells = dates.map((d) => {
      const v = map.get(d);
      if (v == null) return '—';
      vals.push(v);
      if (divideK) return `${round(v / 1000, 1)}k`;
      return dp === 0 ? String(Math.round(v)) : String(round(v, dp));
    });
    const a = avg(vals);
    const avgStr = a == null ? undefined : divideK ? `${round(a / 1000, 1)}k` : dp === 0 ? String(Math.round(a)) : String(round(a, dp));
    return { cells, avg: avgStr };
  };

  const weight = fmtRow(weightMap, 1);
  const steps = fmtRow(stepMap, 0, true);
  const sleep = fmtRow(sleepMap, 1);
  const cals = fmtRow(calMap, 0);

  return {
    days: labels,
    rows: [
      { label: 'Weight (lbs)', values: weight.cells, avg: weight.avg },
      { label: 'Steps', values: steps.cells, avg: steps.avg },
      { label: 'Sleep (h)', values: sleep.cells, avg: sleep.avg },
      { label: 'Calories', values: cals.cells, avg: cals.avg },
    ],
  };
}

// ── LIFTING GRID ──────────────────────────────────────────────────────────────

export function deriveLiftingGrid(ex: CoachingExport, maxExercises = 8): LiftingExercise[] {
  const logs = (ex.training?.recentSetLogs ?? []).filter((l) => l.exercise_name && l.logged_at);
  if (!logs.length) return [];

  // Group by exercise → by session date.
  const byExercise = new Map<string, TrainingSetLog[]>();
  for (const l of logs) {
    const name = l.exercise_name as string;
    if (!byExercise.has(name)) byExercise.set(name, []);
    byExercise.get(name)!.push(l);
  }

  // Order exercises by most recent activity, take the top N.
  const ordered = [...byExercise.entries()]
    .map(([name, rows]) => ({
      name,
      rows,
      latest: rows.reduce((m, r) => (String(r.logged_at) > m ? String(r.logged_at) : m), ''),
    }))
    .sort((a, b) => b.latest.localeCompare(a.latest))
    .slice(0, maxExercises);

  return ordered.map(({ name, rows }) => {
    // Distinct session dates, newest → take last 3, then oldest → newest.
    const dates = [...new Set(rows.map((r) => isoDate(r.logged_at)))]
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 3)
      .sort((a, b) => a.localeCompare(b));

    const maxSet = Math.max(...rows.map((r) => r.set_number ?? 1));
    const sets: LiftingExercise['sets'] = [];
    for (let sn = 1; sn <= Math.min(maxSet, 5); sn++) {
      const cells = dates.map((d) => {
        const row = rows.find((r) => isoDate(r.logged_at) === d && (r.set_number ?? 1) === sn);
        if (!row) return '—';
        const reps = row.actual_reps ?? row.prescribed_reps;
        const wt = row.actual_weight ?? row.prescribed_weight;
        if (reps == null && wt == null) return '—';
        return `${reps ?? '?'}×${wt ?? '?'}`;
      });
      sets.push({ setNumber: sn, cells });
    }

    // Volume trend across sessions (sum reps×weight per session).
    const vol = dates.map((d) =>
      rows
        .filter((r) => isoDate(r.logged_at) === d)
        .reduce((sum, r) => sum + (r.actual_reps ?? 0) * (r.actual_weight ?? 0), 0),
    );
    let volumeTrend: LiftingExercise['volumeTrend'] = 'flat';
    if (vol.length >= 2) {
      const d = vol[vol.length - 1] - vol[0];
      const tol = vol[0] * 0.03;
      volumeTrend = Math.abs(d) <= tol ? 'flat' : d > 0 ? 'up' : 'down';
    }

    return { name, sessions: dates, sets, volumeTrend };
  });
}

// ── convenience: weight in lbs from kg (overview.currentWeightKg) ─────────────
export function kgToLbs(kg: number | null | undefined): number | null {
  return typeof kg === 'number' ? round(kg * KG_TO_LBS, 1) : null;
}
