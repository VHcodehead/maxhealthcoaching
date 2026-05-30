'use client';

// src/components/coaching-hub/triage-list.tsx
//
// Coach hub client list — triage-first. NEEDS YOU section (any red flag) floats
// above ON TRACK. Client-side search by name. Each row links to the detail view.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { GLASS } from './primitives';
import type { CoachingSnapshot } from '@/lib/coaching-bridge';

const FLAG_LABELS: Record<string, string> = {
  missed_checkin: 'Missed check-in',
  low_adherence: 'Low adherence',
  off_track_weight: 'Off-track weight',
};

function trendArrow(t: CoachingSnapshot['weightTrend7d']): string {
  return t === 'up' ? '▲' : t === 'down' ? '▼' : '→';
}

function Row({ s }: { s: CoachingSnapshot }) {
  const needs = s.status === 'needs_attention';
  return (
    <Link
      href={`/coach/hub/${s.appUserId}`}
      className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 transition-colors hover:bg-white/50"
    >
      <span
        className={cn('size-2.5 shrink-0 rounded-full', needs ? 'bg-rose-500' : 'bg-emerald-500')}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-medium text-slate-900">{s.name ?? 'Unnamed client'}</span>
          {s.goal && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] capitalize text-slate-500">
              {s.goal.replace(/_/g, ' ')}
            </span>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {s.redFlags.map((f) => (
            <span key={f} className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700">
              ⚠ {FLAG_LABELS[f] ?? f}
            </span>
          ))}
          {!s.redFlags.length && <span className="text-[11px] text-emerald-600">On pace</span>}
        </div>
      </div>
      <div className="hidden shrink-0 text-right sm:block">
        {s.currentWeightLbs != null && (
          <div className="text-sm font-medium text-slate-700">
            {s.currentWeightLbs} <span className="text-xs text-slate-400">lbs {trendArrow(s.weightTrend7d)}</span>
          </div>
        )}
        <div className="text-[11px] text-slate-400">
          {s.daysSinceLastCheckin >= 999
            ? 'No check-in'
            : s.daysSinceLastCheckin === 0
              ? 'Checked today'
              : `Checked ${s.daysSinceLastCheckin}d ago`}
        </div>
      </div>
      <ChevronRight className="size-4 shrink-0 text-slate-300" />
    </Link>
  );
}

export function TriageList({ snapshots }: { snapshots: CoachingSnapshot[] }) {
  const [q, setQ] = useState('');

  const { needs, onTrack } = useMemo(() => {
    const filtered = snapshots.filter((s) =>
      (s.name ?? '').toLowerCase().includes(q.trim().toLowerCase()),
    );
    const sortFn = (a: CoachingSnapshot, b: CoachingSnapshot) =>
      b.redFlags.length - a.redFlags.length || b.daysSinceLastCheckin - a.daysSinceLastCheckin;
    return {
      needs: filtered.filter((s) => s.status === 'needs_attention').sort(sortFn),
      onTrack: filtered.filter((s) => s.status === 'on_track').sort(sortFn),
    };
  }, [snapshots, q]);

  return (
    <div className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search clients…"
          className={cn(GLASS, 'w-full py-2.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none')}
        />
      </div>

      <Section title="NEEDS YOU" count={needs.length} accent="rose">
        {needs.length ? needs.map((s) => <Row key={s.appUserId} s={s} />) : <Empty>Nothing flagged. Nice.</Empty>}
      </Section>

      <Section title="ON TRACK" count={onTrack.length} accent="emerald">
        {onTrack.length ? onTrack.map((s) => <Row key={s.appUserId} s={s} />) : <Empty>No clients here.</Empty>}
      </Section>
    </div>
  );
}

function Section({
  title,
  count,
  accent,
  children,
}: {
  title: string;
  count: number;
  accent: 'rose' | 'emerald';
  children: React.ReactNode;
}) {
  return (
    <div className={cn(GLASS, 'overflow-hidden')}>
      <div className="flex items-center gap-2 px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
        <span
          className={cn(
            'rounded-full px-2 py-0.5 text-[11px] font-semibold',
            accent === 'rose' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700',
          )}
        >
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="border-t border-slate-100 px-4 py-6 text-center text-sm text-slate-400">{children}</div>;
}
