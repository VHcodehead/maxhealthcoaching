// src/app/coach/hub/page.tsx
//
// Unified Coaching Hub — coach client list (triage). Server component: gates to
// coaches, loads the linked roster from app_links, pulls one batch of triage
// snapshots from the app backend via the bridge, renders the triage list.

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { fetchCoachingSnapshots, CoachingBridgeError } from '@/lib/coaching-bridge';
import { HubBackdrop, GlassCard } from '@/components/coaching-hub/primitives';
import { TriageList } from '@/components/coaching-hub/triage-list';

export const dynamic = 'force-dynamic';

export default async function CoachHubPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'coach') redirect('/dashboard');

  const links = await prisma.appLink.findMany({
    where: { verifiedAt: { not: null } },
    select: { appUserId: true },
  });
  const appUserIds = links.map((l) => l.appUserId);

  let snapshots = null;
  let bridgeDown = false;
  try {
    snapshots = await fetchCoachingSnapshots(appUserIds);
  } catch (err) {
    if (err instanceof CoachingBridgeError) bridgeDown = true;
    else throw err;
  }

  return (
    <div className="relative min-h-full">
      <HubBackdrop />
      <div className="mx-auto max-w-3xl">
        <header className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Coaching Hub</h1>
          <p className="mt-1 text-sm text-slate-500">
            Everything your linked app clients are doing — triaged so the problems surface first.
          </p>
        </header>

        {appUserIds.length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-slate-600">No clients have linked their app account yet.</p>
            <p className="mt-1 text-xs text-slate-400">
              Clients link from their portal under “Connect your app account.”
            </p>
          </GlassCard>
        ) : bridgeDown ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-slate-600">App data is temporarily unavailable.</p>
            <p className="mt-1 text-xs text-slate-400">
              The read bridge didn’t respond. Check COACHING_BACKEND_URL / COACHING_EXPORT_SECRET.
            </p>
          </GlassCard>
        ) : (
          <TriageList snapshots={snapshots ?? []} />
        )}
      </div>
    </div>
  );
}
