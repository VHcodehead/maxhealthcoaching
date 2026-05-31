'use client';

// src/components/coaching-hub/push-panel.tsx
//
// Unified Coaching Hub — Phase 5 write-back UI. Lets the coach push macro,
// cardio, and training adjustments to the app via the coach-gated /api/coach/push/*
// routes (which proxy to the service-token bridge). Every push hits the SAME
// proven pipeline the legacy dashboard uses — this is just another caller.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from './primitives';
import type { WorkoutTemplate } from '@/lib/coaching-bridge';
import { Loader2, Dumbbell, Activity, Utensils, CheckCircle2 } from 'lucide-react';

interface MacroPrefill {
  target_protein: number | null;
  target_carbs: number | null;
  target_fat: number | null;
  final_calories: number | null;
}

export function PushPanel({
  appUserId,
  macros,
  workouts,
}: {
  appUserId: string;
  macros: MacroPrefill;
  workouts: WorkoutTemplate[];
}) {
  return (
    <GlassCard className="p-5">
      <h3 className="mb-1 text-sm font-semibold text-slate-700">Push to app</h3>
      <p className="mb-4 text-xs text-slate-400">
        Changes go straight to the client&rsquo;s app plan through the same pipeline as the main dashboard.
      </p>
      <div className="space-y-4">
        <MacroPush appUserId={appUserId} prefill={macros} />
        <CardioPush appUserId={appUserId} />
        <TrainingPush appUserId={appUserId} workouts={workouts} />
      </div>
    </GlassCard>
  );
}

function usePush() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function run(url: string, body: unknown, okMsg: string) {
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? 'Push failed.');
      else {
        setMsg(okMsg);
        router.refresh();
      }
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }
  return { busy, msg, error, run };
}

const num = (s: string) => (s.trim() === '' ? undefined : Number(s));
const fieldCls = 'w-full rounded-md border border-slate-200 bg-white/70 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300';

function Disclosure({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-slate-200 bg-white/40">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-3 py-2.5 text-sm font-medium text-slate-700">
        <span className="flex items-center gap-2">{icon}{title}</span>
        <span className="text-slate-400">{open ? '–' : '+'}</span>
      </button>
      {open && <div className="border-t border-slate-100 p-3">{children}</div>}
    </div>
  );
}

function Status({ busy, msg, error }: { busy: boolean; msg: string | null; error: string | null }) {
  return (
    <>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      {msg && <p className="mt-2 inline-flex items-center gap-1 text-sm text-emerald-700"><CheckCircle2 className="size-4" />{msg}</p>}
      {busy && <Loader2 className="ml-2 inline size-4 animate-spin text-slate-400" />}
    </>
  );
}

function MacroPush({ appUserId, prefill }: { appUserId: string; prefill: MacroPrefill }) {
  const { busy, msg, error, run } = usePush();
  const [p, setP] = useState(String(prefill.target_protein ?? ''));
  const [c, setC] = useState(String(prefill.target_carbs ?? ''));
  const [f, setF] = useState(String(prefill.target_fat ?? ''));
  const [cal, setCal] = useState(String(prefill.final_calories ?? ''));
  const [note, setNote] = useState('');

  return (
    <Disclosure title="Macros" icon={<Utensils className="size-4 text-emerald-600" />}>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="text-xs text-slate-500">Protein<input className={fieldCls} value={p} onChange={(e) => setP(e.target.value)} /></label>
        <label className="text-xs text-slate-500">Carbs<input className={fieldCls} value={c} onChange={(e) => setC(e.target.value)} /></label>
        <label className="text-xs text-slate-500">Fat<input className={fieldCls} value={f} onChange={(e) => setF(e.target.value)} /></label>
        <label className="text-xs text-slate-500">Calories<input className={fieldCls} value={cal} onChange={(e) => setCal(e.target.value)} /></label>
      </div>
      <input className={`${fieldCls} mt-2`} placeholder="Note to client (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <button
        disabled={busy}
        onClick={() => run('/api/coach/push/macros', { appUserId, target_protein: num(p), target_carbs: num(c), target_fat: num(f), final_calories: num(cal), coachNote: note || null }, 'Macros pushed')}
        className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        Push macros
      </button>
      <Status busy={busy} msg={msg} error={error} />
    </Disclosure>
  );
}

function CardioPush({ appUserId }: { appUserId: string }) {
  const { busy, msg, error, run } = usePush();
  const [freq, setFreq] = useState('');
  const [dur, setDur] = useState('');
  const [modality, setModality] = useState('walking');
  const [note, setNote] = useState('');

  return (
    <Disclosure title="Cardio" icon={<Activity className="size-4 text-emerald-600" />}>
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-slate-500">Days/wk<input className={fieldCls} value={freq} onChange={(e) => setFreq(e.target.value)} /></label>
        <label className="text-xs text-slate-500">Minutes<input className={fieldCls} value={dur} onChange={(e) => setDur(e.target.value)} /></label>
        <label className="text-xs text-slate-500">Modality
          <select className={fieldCls} value={modality} onChange={(e) => setModality(e.target.value)}>
            <option value="walking">Walking</option>
            <option value="incline_treadmill">Incline treadmill</option>
            <option value="cycling">Cycling</option>
            <option value="stairmaster">Stairmaster</option>
            <option value="elliptical">Elliptical</option>
          </select>
        </label>
      </div>
      <input className={`${fieldCls} mt-2`} placeholder="Note to client (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="mt-3 flex gap-2">
        <button
          disabled={busy}
          onClick={() => run('/api/coach/push/cardio', { appUserId, frequency_per_week: num(freq), duration_minutes: num(dur), modality, coachNote: note || null }, 'Cardio pushed')}
          className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          Push cardio
        </button>
        <button
          disabled={busy}
          onClick={() => run('/api/coach/push/cardio', { appUserId, clearOverride: true }, 'Override cleared')}
          className="rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-600"
        >
          Resume autonomous
        </button>
      </div>
      <Status busy={busy} msg={msg} error={error} />
    </Disclosure>
  );
}

interface ExRow { exerciseId: number | null; exerciseName: string; sets: number; reps: string; restSeconds: number; rpe: string; notes: string }

function TrainingPush({ appUserId, workouts }: { appUserId: string; workouts: WorkoutTemplate[] }) {
  const { busy, msg, error, run } = usePush();
  const [selId, setSelId] = useState<number | ''>(workouts[0]?.id ?? '');
  const selected = workouts.find((w) => w.id === selId);

  const seed = (w?: WorkoutTemplate): ExRow[] =>
    (w?.exercises ?? []).map((e) => ({
      exerciseId: typeof e.exerciseId === 'number' ? e.exerciseId : null,
      exerciseName: String(e.exerciseName ?? ''),
      sets: typeof e.sets === 'number' ? e.sets : 3,
      reps: String(e.reps ?? '8-12'),
      restSeconds: typeof e.restSeconds === 'number' ? e.restSeconds : 90,
      rpe: e.rpe != null ? String(e.rpe) : '',
      notes: typeof e.notes === 'string' ? e.notes : '',
    }));

  const [rows, setRows] = useState<ExRow[]>(seed(workouts[0]));

  function onSelect(id: number) {
    setSelId(id);
    setRows(seed(workouts.find((w) => w.id === id)));
  }
  function update(i: number, patch: Partial<ExRow>) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }

  if (!workouts.length) {
    return (
      <Disclosure title="Training" icon={<Dumbbell className="size-4 text-emerald-600" />}>
        <p className="text-sm text-slate-400">No active training plan / workout templates found.</p>
      </Disclosure>
    );
  }

  return (
    <Disclosure title="Training" icon={<Dumbbell className="size-4 text-emerald-600" />}>
      <select className={fieldCls} value={selId} onChange={(e) => onSelect(Number(e.target.value))}>
        {workouts.map((w) => (
          <option key={w.id} value={w.id}>
            W{w.week_number}D{w.day_number} · {w.workout_name ?? 'Workout'} ({w.total_exercises ?? w.exercises.length} ex)
          </option>
        ))}
      </select>

      <div className="mt-3 space-y-2">
        {rows.map((row, i) => (
          <div key={i} className="grid grid-cols-12 gap-1.5">
            <input className={`${fieldCls} col-span-5`} value={row.exerciseName} onChange={(e) => update(i, { exerciseName: e.target.value })} placeholder="Exercise" />
            <input className={`${fieldCls} col-span-1`} value={row.sets} onChange={(e) => update(i, { sets: Number(e.target.value) || 0 })} title="sets" />
            <input className={`${fieldCls} col-span-2`} value={row.reps} onChange={(e) => update(i, { reps: e.target.value })} title="reps" />
            <input className={`${fieldCls} col-span-2`} value={row.restSeconds} onChange={(e) => update(i, { restSeconds: Number(e.target.value) || 0 })} title="rest (s)" />
            <input className={`${fieldCls} col-span-2`} value={row.rpe} onChange={(e) => update(i, { rpe: e.target.value })} title="RPE" placeholder="RPE" />
          </div>
        ))}
      </div>

      <button
        disabled={busy || selId === ''}
        onClick={() =>
          run(
            `/api/coach/push/training/${selId}`,
            {
              appUserId,
              workoutName: selected?.workout_name ?? undefined,
              exercises: rows.map((r) => ({
                exerciseId: r.exerciseId,
                exerciseName: r.exerciseName,
                sets: r.sets,
                reps: r.reps,
                restSeconds: r.restSeconds,
                rpe: r.rpe.trim() === '' ? null : Number(r.rpe),
                notes: r.notes || null,
              })),
            },
            'Workout pushed',
          )
        }
        className="mt-3 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        Push workout
      </button>
      <Status busy={busy} msg={msg} error={error} />
    </Disclosure>
  );
}
