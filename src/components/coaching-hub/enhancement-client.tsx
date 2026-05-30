'use client';

// src/components/coaching-hub/enhancement-client.tsx
//
// Unified Coaching Hub — Phase 3 client enhancement UI (private). Three cards:
//  1. Weekly side-effect scan (sex-aware) → POST /api/client/enhancement
//  2. Your protocol (list + add/remove client-reported items, coach guidance shown)
//  3. Bloodwork (upload PDF + paste values → parse) → POST /api/client/bloodwork

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from './primitives';
import { Loader2, Plus, Trash2, Upload, CheckCircle2 } from 'lucide-react';

export interface ProtocolItem {
  id: string;
  name: string;
  category: string;
  dose: string | null;
  doseUnit: string | null;
  frequency: string | null;
  timing: string | null;
  coachGuidance: string | null;
  clientReported: boolean;
}
export interface BloodworkRow {
  id: string;
  labName: string | null;
  testDate: string | null;
  outOfRangeCount: number;
  parseStatus: string;
  uploadedAt: string;
}

const CAT = ['none', 'mild', 'notable'] as const;

export function EnhancementClient({
  sex,
  protocols,
  bloodwork,
}: {
  sex: string | null;
  protocols: ProtocolItem[];
  bloodwork: BloodworkRow[];
}) {
  const isFemale = (sex ?? '').toLowerCase().startsWith('f');

  return (
    <div className="space-y-5 pt-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Enhancement</h1>
        <p className="mt-1 text-sm text-slate-500">Private to you and your coach. Honest answers = safer guidance.</p>
      </div>
      <ScanCard isFemale={isFemale} />
      <ProtocolCard initial={protocols} />
      <BloodworkCard initial={bloodwork} />
    </div>
  );
}

// ── 1. Side-effect scan ───────────────────────────────────────────────────────

function ScanCard({ isFemale }: { isFemale: boolean }) {
  const [v, setV] = useState<Record<string, unknown>>({});
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: string, val: unknown) => setV((s) => ({ ...s, [k]: val }));

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/client/enhancement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? 'Could not submit.');
      else setDone(true);
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <GlassCard className="p-5">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="size-5" /> <span className="text-sm font-medium">Scan submitted.</span>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5">
      <h2 className="text-sm font-semibold text-slate-700">Weekly side-effect scan</h2>
      <div className="mt-4 space-y-5">
        <Group title="Estrogenic">
          <Cat label="Nipple sensitivity / lumps" k="nippleSensitivity" set={set} v={v} />
          <Cat label="Water retention / bloat" k="waterRetention" set={set} v={v} />
          <Cat label="Mood swings" k="moodSwings" set={set} v={v} />
        </Group>
        <Group title="Androgenic">
          <Cat label="Acne" k="acne" set={set} v={v} />
          <Cat label="Hair shedding" k="hairShedding" set={set} v={v} />
          <Cat label="Oily skin" k="oilySkin" set={set} v={v} />
          <Cat label="Aggression" k="aggression" set={set} v={v} />
        </Group>
        <Group title="Cardiovascular">
          <TextField label="Fasted BP" k="fastedBP" set={set} v={v} placeholder="118/72" />
          <NumField label="Resting HR" k="restingHR" set={set} v={v} placeholder="57" />
          <Cat label="Ankle / leg swelling" k="limbSwelling" set={set} v={v} />
          <YN label="Shortness of breath" k="shortnessOfBreath" set={set} v={v} />
        </Group>
        <Group title="Oral / liver">
          <YN label="Nausea" k="nausea" set={set} v={v} />
          <YN label="Appetite drop" k="appetiteDrop" set={set} v={v} />
          <YN label="Dark urine" k="darkUrine" set={set} v={v} />
          <YN label="Right-upper-quad discomfort" k="ruqDiscomfort" set={set} v={v} />
          <YN label="Lethargy" k="lethargy" set={set} v={v} />
        </Group>
        <Group title="Metabolic">
          <NumField label="Fasted glucose" k="fastedGlucose" set={set} v={v} placeholder="90" />
          <YN label="Excessive thirst" k="excessiveThirst" set={set} v={v} />
        </Group>
        <Group title="Injection site">
          <Cat label="Soreness" k="siteSoreness" set={set} v={v} />
          <YN label="Redness" k="siteRedness" set={set} v={v} />
          <YN label="Lumps" k="siteLumps" set={set} v={v} />
          <YN label="Fever" k="fever" set={set} v={v} />
        </Group>
        <Group title="Mental / sexual">
          <NumField label="Libido (1-5)" k="libido" set={set} v={v} placeholder="4" />
          <NumField label="Mood (1-10)" k="mood" set={set} v={v} placeholder="7" />
          <Cat label="Anxiety" k="anxiety" set={set} v={v} />
          <YN label="Night sweats" k="nightSweats" set={set} v={v} />
        </Group>
        {isFemale && (
          <Group title="Female-specific">
            <YN label="Voice changes" k="voiceChanges" set={set} v={v} />
            <YN label="Abnormal hair growth" k="hairGrowth" set={set} v={v} />
            <YN label="Cycle disruption" k="cycleDisruption" set={set} v={v} />
            <YN label="Clitoral changes" k="clitoralChanges" set={set} v={v} />
          </Group>
        )}
        <div>
          <label className="text-sm font-medium text-slate-700">Anything new or off?</label>
          <textarea
            rows={2}
            onChange={(e) => set('anythingOff', e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
          />
        </div>
      </div>
      {error && <p className="mt-3 text-sm text-rose-600">{error}</p>}
      <button
        onClick={submit}
        disabled={busy}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        {busy && <Loader2 className="size-4 animate-spin" />} Submit scan
      </button>
    </GlassCard>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-slate-700">{label}</span>
      {children}
    </div>
  );
}
function Cat({ label, k, set, v }: { label: string; k: string; set: (k: string, v: unknown) => void; v: Record<string, unknown> }) {
  return (
    <Row label={label}>
      <div className="flex gap-1">
        {CAT.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => set(k, c)}
            className={`rounded-md px-2.5 py-1 text-xs capitalize ${v[k] === c ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white/70 text-slate-600'}`}
          >
            {c}
          </button>
        ))}
      </div>
    </Row>
  );
}
function YN({ label, k, set, v }: { label: string; k: string; set: (k: string, v: unknown) => void; v: Record<string, unknown> }) {
  return (
    <Row label={label}>
      <div className="flex gap-1">
        <button type="button" onClick={() => set(k, false)} className={`rounded-md px-2.5 py-1 text-xs ${v[k] === false ? 'bg-slate-800 text-white' : 'border border-slate-200 bg-white/70 text-slate-600'}`}>No</button>
        <button type="button" onClick={() => set(k, true)} className={`rounded-md px-2.5 py-1 text-xs ${v[k] === true ? 'bg-rose-500 text-white' : 'border border-slate-200 bg-white/70 text-slate-600'}`}>Yes</button>
      </div>
    </Row>
  );
}
function TextField({ label, k, set, v, placeholder }: { label: string; k: string; set: (k: string, v: unknown) => void; v: Record<string, unknown>; placeholder?: string }) {
  return (
    <Row label={label}>
      <input type="text" placeholder={placeholder} value={(v[k] as string) ?? ''} onChange={(e) => set(k, e.target.value)} className="w-28 rounded-md border border-slate-200 bg-white/70 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
    </Row>
  );
}
function NumField({ label, k, set, v, placeholder }: { label: string; k: string; set: (k: string, v: unknown) => void; v: Record<string, unknown>; placeholder?: string }) {
  return (
    <Row label={label}>
      <input type="number" inputMode="decimal" placeholder={placeholder} value={(v[k] as string) ?? ''} onChange={(e) => set(k, e.target.value)} className="w-24 rounded-md border border-slate-200 bg-white/70 px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300" />
    </Row>
  );
}

// ── 2. Protocol ───────────────────────────────────────────────────────────────

function ProtocolCard({ initial }: { initial: ProtocolItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', category: 'compound', dose: '', doseUnit: '', frequency: '', timing: '' });
  const [busy, setBusy] = useState(false);

  async function add() {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/client/protocol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setForm({ name: '', category: 'compound', dose: '', doseUnit: '', frequency: '', timing: '' });
        setAdding(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }
  async function remove(id: string) {
    setItems((s) => s.filter((i) => i.id !== id));
    await fetch(`/api/client/protocol?id=${id}`, { method: 'DELETE' });
    router.refresh();
  }

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-700">Your protocol</h2>
        <button onClick={() => setAdding((a) => !a)} className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <Plus className="size-3.5" /> Add item
        </button>
      </div>

      {adding && (
        <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white/50 p-3">
          <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="col-span-2 rounded-md border border-slate-200 bg-white/70 px-2 py-1.5 text-sm" />
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="rounded-md border border-slate-200 bg-white/70 px-2 py-1.5 text-sm">
            <option value="compound">Compound</option>
            <option value="peptide">Peptide</option>
            <option value="supplement">Supplement</option>
          </select>
          <input placeholder="Dose (e.g. 200mg)" value={form.dose} onChange={(e) => setForm({ ...form, dose: e.target.value })} className="rounded-md border border-slate-200 bg-white/70 px-2 py-1.5 text-sm" />
          <input placeholder="Frequency (e.g. 2x/wk)" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="rounded-md border border-slate-200 bg-white/70 px-2 py-1.5 text-sm" />
          <input placeholder="Timing" value={form.timing} onChange={(e) => setForm({ ...form, timing: e.target.value })} className="rounded-md border border-slate-200 bg-white/70 px-2 py-1.5 text-sm" />
          <button onClick={add} disabled={busy} className="col-span-2 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60">
            {busy ? 'Adding…' : 'Add'}
          </button>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {items.length === 0 && <p className="text-sm text-slate-400">No protocol items yet.</p>}
        {items.map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200 bg-white/50 p-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-slate-800">
                  {p.name} <span className="text-xs capitalize text-slate-400">· {p.category}</span>
                </div>
                <div className="text-xs text-slate-500">
                  {[p.dose, p.frequency, p.timing].filter(Boolean).join(' · ') || '—'}
                </div>
                {p.coachGuidance && (
                  <div className="mt-1 rounded-md bg-emerald-50 px-2 py-1 text-xs text-emerald-800">
                    <span className="font-semibold">Coach:</span> {p.coachGuidance}
                  </div>
                )}
              </div>
              {p.clientReported && (
                <button onClick={() => remove(p.id)} className="text-slate-400 hover:text-rose-600">
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

// ── 3. Bloodwork ──────────────────────────────────────────────────────────────

function BloodworkCard({ initial }: { initial: BloodworkRow[] }) {
  const router = useRouter();
  const [labName, setLabName] = useState('');
  const [testDate, setTestDate] = useState('');
  const [rawText, setRawText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload() {
    if (!file && !rawText.trim()) {
      setError('Attach a file or paste your lab values.');
      return;
    }
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const fd = new FormData();
      if (file) fd.append('file', file);
      if (labName) fd.append('labName', labName);
      if (testDate) fd.append('testDate', testDate);
      if (rawText) fd.append('rawText', rawText);
      const res = await fetch('/api/client/bloodwork', { method: 'POST', body: fd });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? 'Upload failed.');
      else {
        setMsg(json.parseStatus === 'parsed' ? `Parsed — ${json.outOfRangeCount} out of range.` : 'Uploaded. Your coach will review.');
        setRawText('');
        setFile(null);
        router.refresh();
      }
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard className="p-5">
      <h2 className="text-sm font-semibold text-slate-700">Bloodwork</h2>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <input placeholder="Lab name" value={labName} onChange={(e) => setLabName(e.target.value)} className="rounded-md border border-slate-200 bg-white/70 px-2 py-1.5 text-sm" />
        <input type="date" value={testDate} onChange={(e) => setTestDate(e.target.value)} className="rounded-md border border-slate-200 bg-white/70 px-2 py-1.5 text-sm" />
      </div>
      <textarea
        rows={4}
        placeholder="Paste your lab values here (name, value, unit, reference range) — we’ll parse them automatically."
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        className="mt-2 w-full rounded-md border border-slate-200 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />
      <label className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
        <Upload className="size-4" />
        <span>{file ? file.name : 'Attach PDF / image (optional)'}</span>
        <input type="file" accept=".pdf,image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </label>
      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}
      {msg && <p className="mt-2 text-sm text-emerald-700">{msg}</p>}
      <button onClick={upload} disabled={busy} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {busy && <Loader2 className="size-4 animate-spin" />} Upload bloodwork
      </button>

      {initial.length > 0 && (
        <div className="mt-4 space-y-1.5">
          <h3 className="text-[11px] font-bold uppercase tracking-wide text-slate-400">History</h3>
          {initial.map((b) => (
            <div key={b.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white/50 px-3 py-2 text-sm">
              <span className="text-slate-700">{b.labName ?? 'Lab'} · {b.testDate ?? b.uploadedAt}</span>
              <span className={b.outOfRangeCount > 0 ? 'text-rose-600' : 'text-emerald-600'}>
                {b.parseStatus === 'parsed' ? `${b.outOfRangeCount} out of range` : b.parseStatus}
              </span>
            </div>
          ))}
        </div>
      )}
    </GlassCard>
  );
}
