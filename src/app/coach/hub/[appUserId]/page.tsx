// src/app/coach/hub/[appUserId]/page.tsx
//
// Unified Coaching Hub — client detail (the centerpiece). Server component:
// gates to coaches, confirms the app user is a linked client, pulls the full
// read-only export via the bridge, derives the view models, renders the hero +
// THE ONE THING + flags + metric tiles + tabbed panels.

import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchCoachingExport, CoachingBridgeError } from '@/lib/coaching-bridge';
import {
  deriveFlags,
  deriveOneThing,
  deriveTiles,
  deriveComparison,
  deriveDailyGrid,
  deriveLiftingGrid,
  kgToLbs,
} from '@/lib/coaching-derive';
import { HubBackdrop, GlassCard, FlagChip } from '@/components/coaching-hub/primitives';
import {
  MetricTiles,
  ComparisonTable,
  DailyGridPanel,
  LiftingGridPanel,
} from '@/components/coaching-hub/panels';
import { ClientDetailTabs, type HubPhoto } from '@/components/coaching-hub/client-detail-tabs';
import type { CoachingExport } from '@/lib/coaching-types';

export const dynamic = 'force-dynamic';

function BiometricsPanel({ ex }: { ex: CoachingExport }) {
  const latest = ex.biometrics?.wearable?.[0];
  const measurements = ex.biometrics?.measurements ?? [];
  const supplements = ex.biometrics?.supplements ?? [];
  const hasAny = latest || measurements.length || supplements.length;
  if (!hasAny) return <p className="text-sm text-slate-500">No biometric data yet.</p>;

  return (
    <div className="space-y-4 text-sm">
      {latest && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">Latest wearable</h4>
          <div className="flex flex-wrap gap-4 text-slate-700">
            {latest.sleep_hours != null && <span>Sleep <strong>{latest.sleep_hours}h</strong></span>}
            {latest.resting_heart_rate != null && <span>Rest HR <strong>{latest.resting_heart_rate} bpm</strong></span>}
            {latest.hrv != null && <span>HRV <strong>{latest.hrv}</strong></span>}
          </div>
        </div>
      )}
      <div className="flex gap-6 text-xs text-slate-500">
        <span>{measurements.length} body measurements logged</span>
        <span>{supplements.length} supplements tracked</span>
      </div>
    </div>
  );
}

function collectPhotos(ex: CoachingExport): HubPhoto[] {
  const out: HubPhoto[] = [];
  for (const p of ex.photos ?? []) {
    if (p.image_url) out.push({ url: p.image_url, date: (p.created_at ?? '').slice(0, 10) });
  }
  for (const c of ex.checkins ?? []) {
    const date = (c.checked_at ?? '').slice(0, 10);
    for (const key of ['photo_front_url', 'photo_side1_url', 'photo_side2_url', 'photo_back_url'] as const) {
      const url = c[key] as string | null | undefined;
      if (url) out.push({ url, date });
    }
  }
  return out;
}

export default async function CoachHubClientPage({
  params,
}: {
  params: Promise<{ appUserId: string }>;
}) {
  const { appUserId } = await params;

  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'coach') redirect('/dashboard');

  // Only linked app users are viewable.
  const link = await prisma.appLink.findFirst({
    where: { appUserId, verifiedAt: { not: null } },
    select: { id: true, isPrep: true, isEnhanced: true },
  });
  if (!link) notFound();

  let ex: CoachingExport | null = null;
  let bridgeDown = false;
  try {
    ex = await fetchCoachingExport(appUserId);
  } catch (err) {
    if (err instanceof CoachingBridgeError) bridgeDown = true;
    else throw err;
  }

  if (bridgeDown || !ex) {
    return (
      <div className="relative min-h-full">
        <HubBackdrop />
        <BackLink />
        <GlassCard className="mx-auto mt-6 max-w-2xl p-8 text-center">
          <p className="text-sm text-slate-600">Couldn’t load this client’s app data.</p>
          <p className="mt-1 text-xs text-slate-400">The read bridge didn’t respond.</p>
        </GlassCard>
      </div>
    );
  }

  const profile = ex.overview.profile;
  const flags = deriveFlags(ex);
  const oneThing = deriveOneThing(flags);
  const tiles = deriveTiles(ex);
  const comparison = deriveComparison(ex);
  const dailyGrid = deriveDailyGrid(ex);
  const lifting = deriveLiftingGrid(ex);
  const photos = collectPhotos(ex);

  const weightLbs = kgToLbs(profile.currentWeightKg);
  const needsReview = flags.some((f) => f.severity === 'bad') || flags.length >= 2;

  return (
    <div className="relative min-h-full">
      <HubBackdrop />
      <div className="mx-auto max-w-4xl">
        <BackLink />

        {/* Hero */}
        <GlassCard className="mt-4 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900">{profile.name ?? 'Unnamed client'}</h1>
              <p className="mt-0.5 text-sm capitalize text-slate-500">
                {(profile.goal ?? 'general').replace(/_/g, ' ')}
                {weightLbs != null && <span className="text-slate-400"> · {weightLbs} lbs</span>}
                {link.isPrep && <span className="ml-1 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">Prep</span>}
                {link.isEnhanced && <span className="ml-1 rounded-full bg-sky-100 px-2 py-0.5 text-[11px] font-medium text-sky-700">Enhanced</span>}
              </p>
            </div>
            <span
              className={
                needsReview
                  ? 'rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700'
                  : 'rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700'
              }
            >
              {needsReview ? '● Needs review' : '● On track'}
            </span>
          </div>

          {oneThing && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3">
              <span className="text-[11px] font-bold uppercase tracking-wide text-amber-600">The one thing</span>
              <p className="mt-0.5 text-sm font-medium text-slate-800">{oneThing}</p>
            </div>
          )}

          {flags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {flags.map((f) => (
                <FlagChip key={f.key} flag={f} />
              ))}
            </div>
          )}
        </GlassCard>

        {/* Metric tiles */}
        <div className="mt-4">
          <MetricTiles tiles={tiles} />
        </div>

        {/* Tabs */}
        <GlassCard className="mt-4 p-5">
          <ClientDetailTabs
            weeklyReview={<ComparisonTable window={comparison.window} rows={comparison.rows} />}
            daily={<DailyGridPanel grid={dailyGrid} />}
            lifting={<LiftingGridPanel exercises={lifting} />}
            biometrics={<BiometricsPanel ex={ex} />}
            photos={photos}
          />
        </GlassCard>

        <p className="mt-3 text-center text-[11px] text-slate-400">
          Read-only snapshot · generated {new Date(ex.exportMeta.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function BackLink() {
  return (
    <Link href="/coach/hub" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
      <ArrowLeft className="size-4" /> Clients
    </Link>
  );
}
