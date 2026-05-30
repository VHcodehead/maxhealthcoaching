// src/app/client/page.tsx
//
// Unified Coaching Hub — Phase 2 client portal home ("Your Week"). Server
// component: if not app-linked, prompts to connect; otherwise shows this
// week's snapshot from the client's own deep check-ins + the check-in CTA.
// (Pinned coach note arrives in Phase 4.)

import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, Link2 } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GlassCard } from '@/components/coaching-hub/primitives';

export const dynamic = 'force-dynamic';

function fmt(n: number | null | undefined, unit = ''): string {
  if (n == null) return '—';
  return `${n}${unit}`;
}

function delta(cur: number | null | undefined, prev: number | null | undefined): string | null {
  if (cur == null || prev == null) return null;
  const d = Math.round((cur - prev) * 10) / 10;
  if (d === 0) return '—';
  return `${d < 0 ? '▼' : '▲'}${Math.abs(d)}`;
}

export default async function ClientHome() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = session.user.id;
  const firstName = (session.user.name ?? '').split(' ')[0] || 'there';

  const link = await prisma.appLink.findFirst({
    where: { userId, verifiedAt: { not: null } },
    select: { id: true, isPrep: true },
  });

  if (!link) {
    return (
      <div className="pt-6">
        <h1 className="text-2xl font-bold text-slate-900">Hey {firstName} 👋</h1>
        <GlassCard className="mt-6 p-6">
          <div className="flex items-start gap-3">
            <Link2 className="mt-0.5 size-5 text-emerald-600" />
            <div>
              <h2 className="font-semibold text-slate-800">Connect your app account</h2>
              <p className="mt-1 text-sm text-slate-500">
                Link MyPocketCoach so your coach can see your training and progress, and you can do your weekly check-in here.
              </p>
              <Link
                href="/client/link"
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Connect now <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </GlassCard>
      </div>
    );
  }

  const recent = await prisma.prepCheckin.findMany({
    where: { userId },
    orderBy: { weekOf: 'desc' },
    take: 2,
  });
  const cur = recent[0];
  const prev = recent[1];

  return (
    <div className="pt-6">
      <div className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Hey {firstName} 👋</h1>
        {link.isPrep && (
          <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">Prep</span>
        )}
      </div>

      {cur ? (
        <GlassCard className="mt-6 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Your Week</h2>
            <span className="text-xs text-slate-400">week of {new Date(cur.weekOf).toISOString().slice(0, 10)}</span>
          </div>
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <Stat label="Weight" value={fmt(cur.weight, ' lbs')} delta={delta(cur.weight, prev?.weight)} />
            <Stat label="Stress" value={fmt(cur.stress, '/10')} delta={delta(cur.stress, prev?.stress)} />
            <Stat label="Energy" value={fmt(cur.energyMotivation, '/10')} delta={delta(cur.energyMotivation, prev?.energyMotivation)} />
          </dl>
        </GlassCard>
      ) : (
        <GlassCard className="mt-6 p-5">
          <p className="text-sm text-slate-600">No check-in yet this week. Knock it out below 👇</p>
        </GlassCard>
      )}

      <Link
        href="/client/checkin"
        className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-600 px-5 py-4 text-white shadow-[0_8px_30px_rgba(5,150,105,0.25)] hover:bg-emerald-700"
      >
        <span className="font-semibold">{cur ? 'Update this week’s check-in' : 'Start weekly check-in'}</span>
        <ArrowRight className="size-5" />
      </Link>
    </div>
  );
}

function Stat({ label, value, delta }: { label: string; value: string; delta: string | null }) {
  return (
    <div className="rounded-xl border border-white/70 bg-white/50 p-3">
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-lg font-semibold text-slate-900">{value}</dd>
      {delta && <dd className="text-xs text-slate-400">{delta} vs last</dd>}
    </div>
  );
}
