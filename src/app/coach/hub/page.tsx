// src/app/coach/hub/page.tsx
//
// Unified Coaching Hub — coach client list (triage). Server component: gates to
// coaches, loads the linked roster from app_links, pulls one batch of triage
// snapshots from the app backend via the bridge, renders the triage list.

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { fetchCoachingRoster, CoachingBridgeError } from '@/lib/coaching-bridge';
import { HubBackdrop, GlassCard } from '@/components/coaching-hub/primitives';
import { TriageList } from '@/components/coaching-hub/triage-list';

export const dynamic = 'force-dynamic';

export default async function CoachHubPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'coach') redirect('/dashboard');

  // Roster = the coach's EXISTING coach_clients links (legacy /admin dashboard).
  // COACH_ADMIN_EMAIL maps the hub coach to their Supabase admin row when the
  // maxhealthcoaching login differs from the admin email; falls back to session.
  const coachEmail = process.env.COACH_ADMIN_EMAIL ?? session.user.email ?? '';

  let snapshots = null;
  let bridgeDown = false;
  try {
    snapshots = await fetchCoachingRoster(coachEmail);
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

        {bridgeDown ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-slate-600">App data is temporarily unavailable.</p>
            <p className="mt-1 text-xs text-slate-400">
              The read bridge didn’t respond. Check COACHING_BACKEND_URL / COACHING_EXPORT_SECRET.
            </p>
          </GlassCard>
        ) : (snapshots ?? []).length === 0 ? (
          <GlassCard className="p-8 text-center">
            <p className="text-sm text-slate-600">No active clients found on your roster.</p>
            <p className="mt-1 text-xs text-slate-400">
              The hub shows your active coach_clients links. Check COACH_ADMIN_EMAIL maps to your admin account.
            </p>
          </GlassCard>
        ) : (
          <TriageList snapshots={snapshots ?? []} />
        )}
      </div>
    </div>
  );
}
