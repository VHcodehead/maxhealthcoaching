'use client';

// src/app/client/checkin/page.tsx
//
// Unified Coaching Hub — Phase 2 deep weekly check-in (sectioned wizard).
// Submits to /api/client/checkin (upsert prep_checkins for the current week).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/coaching-hub/primitives';
import { Loader2, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';

interface FormState {
  weight: string;
  waistCircumference: string;
  caliperSites: string;
  avgSteps: string;
  sleepDeclined: boolean;
  sleepDeclinedWhy: string;
  avgRestingHR: string;
  stress: number;
  energyMotivation: number;
  untrackedMeals: string;
  hunger: number;
  digestionIssues: string;
  fastedGlucose: string;
  fastedBP: string;
  strengthTrend: string;
  exerciseIssues: string;
  cardioCompleted: boolean;
  menstrualStatus: string;
  win: string;
  didntGoWell: string;
  otherInfo: string;
}

const INITIAL: FormState = {
  weight: '', waistCircumference: '', caliperSites: '', avgSteps: '',
  sleepDeclined: false, sleepDeclinedWhy: '', avgRestingHR: '', stress: 5, energyMotivation: 5,
  untrackedMeals: '', hunger: 3, digestionIssues: '', fastedGlucose: '', fastedBP: '',
  strengthTrend: '', exerciseIssues: '', cardioCompleted: false,
  menstrualStatus: '', win: '', didntGoWell: '', otherInfo: '',
};

const SECTIONS = ['Body', 'Recovery', 'Nutrition', 'Training', 'Reflection'];

export default function CheckinWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [f, setF] = useState<FormState>(INITIAL);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setF((s) => ({ ...s, [k]: v }));

  async function submit() {
    setBusy(true);
    setError(null);
    const toNum = (v: string) => (v.trim() === '' ? null : Number(v));
    const toStr = (v: string) => (v.trim() === '' ? null : v.trim());
    const payload = {
      weight: toNum(f.weight),
      waistCircumference: toNum(f.waistCircumference),
      caliperSites: toStr(f.caliperSites),
      avgSteps: toNum(f.avgSteps),
      sleepDeclined: f.sleepDeclined,
      sleepDeclinedWhy: toStr(f.sleepDeclinedWhy),
      avgRestingHR: toNum(f.avgRestingHR),
      stress: f.stress,
      energyMotivation: f.energyMotivation,
      untrackedMeals: toStr(f.untrackedMeals),
      hunger: f.hunger,
      digestionIssues: toStr(f.digestionIssues),
      fastedGlucose: toNum(f.fastedGlucose),
      fastedBP: toStr(f.fastedBP),
      strengthTrend: toStr(f.strengthTrend),
      exerciseIssues: toStr(f.exerciseIssues),
      cardioCompleted: f.cardioCompleted,
      menstrualStatus: toStr(f.menstrualStatus),
      win: toStr(f.win),
      didntGoWell: toStr(f.didntGoWell),
      otherInfo: toStr(f.otherInfo),
    };
    try {
      const res = await fetch('/api/client/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not save your check-in.');
      } else {
        setDone(true);
        setTimeout(() => router.push('/client'), 1400);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="pt-10">
        <GlassCard className="p-8 text-center">
          <CheckCircle2 className="mx-auto size-10 text-emerald-600" />
          <p className="mt-3 font-medium text-slate-800">Check-in submitted. Your coach will review it.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold text-slate-900">Weekly Check-in</h1>
      <p className="mt-1 text-sm text-slate-500">
        Step {step + 1} of {SECTIONS.length} — {SECTIONS[step]}
      </p>

      {/* progress */}
      <div className="mt-3 flex gap-1.5">
        {SECTIONS.map((_, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= step ? 'bg-emerald-500' : 'bg-slate-200'}`} />
        ))}
      </div>

      <GlassCard className="mt-5 p-5">
        {step === 0 && (
          <div className="space-y-4">
            <Field label="Current weight (lbs)"><NumInput value={f.weight} onChange={(v) => set('weight', v)} placeholder="232.2" /></Field>
            <Field label="Waist circumference (in)"><NumInput value={f.waistCircumference} onChange={(v) => set('waistCircumference', v)} placeholder="32" /></Field>
            <Field label="Avg daily steps"><NumInput value={f.avgSteps} onChange={(v) => set('avgSteps', v)} placeholder="10000" /></Field>
            <Field label="Caliper sites (optional)"><TextArea value={f.caliperSites} onChange={(v) => set('caliperSites', v)} placeholder="chest 8, ab 12, thigh 10…" /></Field>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <Toggle label="Did sleep decline this week?" value={f.sleepDeclined} onChange={(v) => set('sleepDeclined', v)} />
            {f.sleepDeclined && <Field label="If so, why?"><TextArea value={f.sleepDeclinedWhy} onChange={(v) => set('sleepDeclinedWhy', v)} placeholder="travel, late nights…" /></Field>}
            <Field label="Avg resting HR (bpm)"><NumInput value={f.avgRestingHR} onChange={(v) => set('avgRestingHR', v)} placeholder="57" /></Field>
            <Scale label="Stress (1-10)" min={1} max={10} value={f.stress} onChange={(v) => set('stress', v)} />
            <Scale label="Energy / motivation (1-10)" min={1} max={10} value={f.energyMotivation} onChange={(v) => set('energyMotivation', v)} />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Field label="Any untracked meals / drinks?"><TextArea value={f.untrackedMeals} onChange={(v) => set('untrackedMeals', v)} placeholder="be honest — it helps the adjustments" /></Field>
            <Scale label="Hunger (1-5)" min={1} max={5} value={f.hunger} onChange={(v) => set('hunger', v)} />
            <Field label="Digestion issues"><TextArea value={f.digestionIssues} onChange={(v) => set('digestionIssues', v)} placeholder="bloating, regularity…" /></Field>
            <Field label="Fasted glucose (optional)"><NumInput value={f.fastedGlucose} onChange={(v) => set('fastedGlucose', v)} placeholder="90" /></Field>
            <Field label="Fasted BP (optional)"><TextInput value={f.fastedBP} onChange={(v) => set('fastedBP', v)} placeholder="118/72" /></Field>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <Field label="Strength trend this week"><TextArea value={f.strengthTrend} onChange={(v) => set('strengthTrend', v)} placeholder="maintained, slight drop on push…" /></Field>
            <Field label="Any exercise issues / pain?"><TextArea value={f.exerciseIssues} onChange={(v) => set('exerciseIssues', v)} placeholder="left forearm sharp on flexion…" /></Field>
            <Toggle label="Completed all prescribed cardio?" value={f.cardioCompleted} onChange={(v) => set('cardioCompleted', v)} />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <Field label="A win this week"><TextArea value={f.win} onChange={(v) => set('win', v)} placeholder="feeling leaner, hit a PR…" /></Field>
            <Field label="What didn't go well"><TextArea value={f.didntGoWell} onChange={(v) => set('didntGoWell', v)} placeholder="be specific" /></Field>
            <Field label="Menstrual status (if applicable)"><TextInput value={f.menstrualStatus} onChange={(v) => set('menstrualStatus', v)} placeholder="optional" /></Field>
            <Field label="Anything else your coach should know"><TextArea value={f.otherInfo} onChange={(v) => set('otherInfo', v)} placeholder="optional" /></Field>
          </div>
        )}

        {error && <p className="mt-4 text-sm text-rose-600">{error}</p>}

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-40"
          >
            <ArrowLeft className="size-4" /> Back
          </button>
          {step < SECTIONS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Continue <ArrowRight className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={busy}
              onClick={submit}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Submit check-in
            </button>
          )}
        </div>
      </GlassCard>
    </div>
  );
}

// ── tiny field primitives ─────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-1">{children}</div>
    </div>
  );
}

const inputCls =
  'w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-300';

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />;
}
function NumInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="number" inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />;
}
function TextArea({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <textarea rows={2} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputCls} />;
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="flex gap-2">
        <button type="button" onClick={() => onChange(false)} className={`rounded-lg px-3 py-1.5 text-sm ${!value ? 'bg-slate-800 text-white' : 'bg-white/70 text-slate-600 border border-slate-200'}`}>No</button>
        <button type="button" onClick={() => onChange(true)} className={`rounded-lg px-3 py-1.5 text-sm ${value ? 'bg-emerald-600 text-white' : 'bg-white/70 text-slate-600 border border-slate-200'}`}>Yes</button>
      </div>
    </div>
  );
}
function Scale({ label, min, max, value, onChange }: { label: string; min: number; max: number; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-semibold text-emerald-600">{value}</span>
      </div>
      <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-2 w-full accent-emerald-600" />
    </div>
  );
}
