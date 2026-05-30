// src/components/coaching-hub/panels.tsx
//
// Unified Coaching Hub — read panels (server-safe): metric tiles, weekly
// comparison, daily grid, lifting grid. All take pre-derived view models from
// coaching-derive.ts.

import { cn } from '@/lib/utils';
import {
  GlassCard,
  Sparkline,
  DirectionArrow,
  severityText,
} from './primitives';
import type {
  MetricTile,
  ComparisonRow,
  DailyGrid,
  LiftingExercise,
  Severity,
} from '@/lib/coaching-derive';

export function MetricTiles({ tiles }: { tiles: MetricTile[] }) {
  if (!tiles.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <GlassCard key={t.key} className="p-3">
          <div className="text-xs font-medium text-slate-500">{t.label}</div>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-xl font-semibold text-slate-900">{t.value}</span>
            {t.unit && <span className="text-xs text-slate-400">{t.unit}</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-xs">
            {t.delta && <span className={severityText(t.deltaSeverity)}>{t.delta}</span>}
            <DirectionArrow direction={t.direction} />
          </div>
          <div className="mt-1">
            <Sparkline series={t.series} />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

export function ComparisonTable({
  window,
  rows,
}: {
  window: string;
  rows: ComparisonRow[];
}) {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">No check-ins logged yet.</p>;
  }
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Weekly Review</h3>
        <span className="text-xs text-slate-400">{window}</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2 text-left font-medium">Metric</th>
              <th className="px-3 py-2 text-right font-medium">Last</th>
              <th className="px-3 py-2 text-right font-medium">This</th>
              <th className="px-3 py-2 text-right font-medium">Δ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const changed = r.delta && r.delta !== '—';
              return (
                <tr
                  key={r.label}
                  className={cn(
                    'border-t border-slate-100',
                    r.isNew ? 'bg-rose-50/60' : changed ? 'bg-amber-50/40' : '',
                  )}
                >
                  <td className="px-3 py-2 text-slate-600">{r.label}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{r.last}</td>
                  <td className="px-3 py-2 text-right font-medium text-slate-900">
                    {r.this}
                    {r.isNew && <span className="ml-1 text-[10px] font-bold text-rose-600">NEW</span>}
                  </td>
                  <td className={cn('px-3 py-2 text-right', severityText(r.severity))}>
                    {r.delta ?? ''}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Deep check-in (prep_checkins) — the portal weekly check-in, surfaced to the
// coach. Subjective coaching signal the app's light check-in doesn't capture.
export interface DeepCheckinView {
  weekOf: string;
  weight: number | null;
  hunger: number | null;
  stress: number | null;
  energyMotivation: number | null;
  sleepDeclined: boolean | null;
  sleepDeclinedWhy: string | null;
  strengthTrend: string | null;
  exerciseIssues: string | null;
  digestionIssues: string | null;
  untrackedMeals: string | null;
  cardioCompleted: boolean | null;
  win: string | null;
  didntGoWell: string | null;
  otherInfo: string | null;
  fastedBP: string | null;
  fastedGlucose: number | null;
  waistCircumference: number | null;
  avgSteps: number | null;
  avgRestingHR: number | null;
  menstrualStatus: string | null;
}

export function DeepCheckinReview({ cur, prev }: { cur: DeepCheckinView | null; prev: DeepCheckinView | null }) {
  if (!cur) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-400">
        No portal deep check-in submitted yet.
      </div>
    );
  }

  const numRow = (label: string, c: number | null, p: number | null, opts: { goodWhen?: 'up' | 'down' } = {}) => {
    if (c == null && p == null) return null;
    let delta: string | null = null;
    let sev: Severity | undefined;
    if (c != null && p != null) {
      const d = Math.round((c - p) * 10) / 10;
      delta = d === 0 ? '—' : `${d < 0 ? '▼' : '▲'}${Math.abs(d)}`;
      if (opts.goodWhen && d !== 0) {
        const good = (opts.goodWhen === 'up' && d > 0) || (opts.goodWhen === 'down' && d < 0);
        sev = good ? 'good' : 'warn';
      }
    }
    return (
      <tr className="border-t border-slate-100">
        <td className="px-3 py-2 text-slate-600">{label}</td>
        <td className="px-3 py-2 text-right text-slate-500">{p ?? '—'}</td>
        <td className="px-3 py-2 text-right font-medium text-slate-900">{c ?? '—'}</td>
        <td className={cn('px-3 py-2 text-right', severityText(sev))}>{delta ?? ''}</td>
      </tr>
    );
  };

  const textBlock = (label: string, c: string | null, p: string | null, flag?: boolean) => {
    if (!c && !p) return null;
    return (
      <div className={cn('rounded-xl border px-3 py-2', flag ? 'border-rose-200 bg-rose-50/60' : 'border-slate-200 bg-white/50')}>
        <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
          {flag && <span className="ml-1 text-rose-600">⚠</span>}
        </div>
        {p && <div className="mt-1 text-xs text-slate-400">last: {p}</div>}
        <div className="mt-0.5 text-sm text-slate-800">{c || '—'}</div>
      </div>
    );
  };

  const injuryFlag = !!(cur.exerciseIssues && /injur|pain|tweak|strain|sharp|hurt/i.test(cur.exerciseIssues));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Deep Check-in</h3>
        <span className="text-xs text-slate-400">week of {cur.weekOf}</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200/70">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50/80 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-3 py-2 text-left font-medium">Metric</th>
              <th className="px-3 py-2 text-right font-medium">Last</th>
              <th className="px-3 py-2 text-right font-medium">This</th>
              <th className="px-3 py-2 text-right font-medium">Δ</th>
            </tr>
          </thead>
          <tbody>
            {numRow('Weight (lbs)', cur.weight, prev?.weight ?? null)}
            {numRow('Hunger (1-5)', cur.hunger, prev?.hunger ?? null, { goodWhen: 'down' })}
            {numRow('Stress (1-10)', cur.stress, prev?.stress ?? null, { goodWhen: 'down' })}
            {numRow('Energy (1-10)', cur.energyMotivation, prev?.energyMotivation ?? null, { goodWhen: 'up' })}
            {numRow('Waist (in)', cur.waistCircumference, prev?.waistCircumference ?? null)}
            {numRow('Avg steps', cur.avgSteps, prev?.avgSteps ?? null)}
            {numRow('Resting HR', cur.avgRestingHR, prev?.avgRestingHR ?? null, { goodWhen: 'down' })}
            {numRow('Fasted glucose', cur.fastedGlucose, prev?.fastedGlucose ?? null)}
          </tbody>
        </table>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {textBlock('Strength trend', cur.strengthTrend, prev?.strengthTrend ?? null)}
        {textBlock('Exercise issues', cur.exerciseIssues, prev?.exerciseIssues ?? null, injuryFlag)}
        {textBlock('Sleep', cur.sleepDeclined ? `Declined — ${cur.sleepDeclinedWhy ?? 'no reason given'}` : 'OK', prev ? (prev.sleepDeclined ? 'Declined' : 'OK') : null, !!cur.sleepDeclined)}
        {textBlock('Digestion', cur.digestionIssues, prev?.digestionIssues ?? null)}
        {textBlock('Untracked meals', cur.untrackedMeals, prev?.untrackedMeals ?? null)}
        {textBlock('Cardio', cur.cardioCompleted == null ? null : cur.cardioCompleted ? 'All sessions done ✓' : 'Missed sessions', prev ? (prev.cardioCompleted ? 'Done' : 'Missed') : null, cur.cardioCompleted === false)}
        {textBlock('Fasted BP', cur.fastedBP, prev?.fastedBP ?? null)}
        {textBlock('Menstrual status', cur.menstrualStatus, prev?.menstrualStatus ?? null)}
        {textBlock('Win', cur.win, prev?.win ?? null)}
        {textBlock("Didn't go well", cur.didntGoWell, prev?.didntGoWell ?? null)}
        {textBlock('Other info', cur.otherInfo, prev?.otherInfo ?? null)}
      </div>
    </div>
  );
}

export function DailyGridPanel({ grid }: { grid: DailyGrid }) {
  const hasData = grid.rows.some((r) => r.values.some((v) => v !== '—'));
  if (!hasData) return <p className="text-sm text-slate-500">No daily data in the last 7 days.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-slate-400">
            <th className="px-2 py-2 text-left font-medium">Daily</th>
            {grid.days.map((d, i) => (
              <th key={i} className="px-2 py-2 text-center font-medium">{d}</th>
            ))}
            <th className="px-2 py-2 text-center font-medium">Avg</th>
          </tr>
        </thead>
        <tbody>
          {grid.rows.map((row) => (
            <tr key={row.label} className="border-t border-slate-100">
              <td className="px-2 py-2 text-slate-600">{row.label}</td>
              {row.values.map((v, i) => (
                <td key={i} className={cn('px-2 py-2 text-center', v === '—' ? 'text-slate-300' : 'text-slate-800')}>
                  {v}
                </td>
              ))}
              <td className="px-2 py-2 text-center font-medium text-slate-900">{row.avg ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function LiftingGridPanel({ exercises }: { exercises: LiftingExercise[] }) {
  if (!exercises.length) return <p className="text-sm text-slate-500">No logged training sets yet.</p>;
  const trendMark = (t: LiftingExercise['volumeTrend']) =>
    t === 'up' ? <span className="text-emerald-600">▲ vol</span> : t === 'down' ? <span className="text-rose-600">▼ vol</span> : <span className="text-slate-400">→ vol</span>;

  return (
    <div className="space-y-4">
      {exercises.map((ex) => (
        <div key={ex.name} className="overflow-x-auto">
          <div className="mb-1 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-700">{ex.name}</h4>
            <span className="text-xs">{trendMark(ex.volumeTrend)}</span>
          </div>
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-slate-400">
                <th className="px-2 py-1.5 text-left font-medium">Set</th>
                {ex.sessions.map((d) => (
                  <th key={d} className="px-2 py-1.5 text-center font-medium">{d.slice(5)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ex.sets.map((s) => (
                <tr key={s.setNumber} className="border-t border-slate-100">
                  <td className="px-2 py-1.5 text-slate-500">Set {s.setNumber}</td>
                  {s.cells.map((c, i) => (
                    <td key={i} className={cn('px-2 py-1.5 text-center tabular-nums', c === '—' ? 'text-slate-300' : 'text-slate-800')}>
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
