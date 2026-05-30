'use client';

// src/components/coaching-hub/response-composer.tsx
//
// Unified Coaching Hub — Phase 4. Coach response composer with routing tags
// (→App / →Portal / →Enhancement) + send. Posts to /api/coach/response and
// refreshes so the new response + reviewed state appear immediately.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from './primitives';
import { Loader2, Send, CheckCircle2 } from 'lucide-react';

type Route = 'app' | 'portal' | 'enhancement';

const ROUTES: { value: Route; label: string; hint: string }[] = [
  { value: 'app', label: '→ App plan change', hint: 'Action lands in their app plan' },
  { value: 'portal', label: '→ Portal note', hint: 'Shows on their portal home' },
  { value: 'enhancement', label: '→ Enhancement', hint: 'Private enhancement guidance' },
];

export function ResponseComposer({
  appUserId,
  lastResponse,
}: {
  appUserId: string;
  lastResponse: { body: string; route: string; createdAt: string } | null;
}) {
  const router = useRouter();
  const [body, setBody] = useState('');
  const [route, setRoute] = useState<Route>('portal');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    if (!body.trim()) {
      setError('Write a response first.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/coach/response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appUserId, body, route }),
      });
      const json = await res.json();
      if (!res.ok) setError(json.error ?? 'Could not send.');
      else {
        setSent(true);
        setBody('');
        router.refresh();
        setTimeout(() => setSent(false), 2500);
      }
    } catch {
      setError('Network error.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <GlassCard className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">Your response</h3>
        {lastResponse && (
          <span className="text-xs text-slate-400">
            last: {lastResponse.route} · {new Date(lastResponse.createdAt).toLocaleDateString()}
          </span>
        )}
      </div>

      <textarea
        rows={3}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Drop overhead pressing this week, swap to neutral-grip DB work…"
        className="w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
      />

      <div className="mt-3 flex flex-wrap gap-2">
        {ROUTES.map((r) => (
          <button
            key={r.value}
            type="button"
            title={r.hint}
            onClick={() => setRoute(r.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              route === r.value ? 'bg-emerald-600 text-white' : 'border border-slate-200 bg-white/70 text-slate-600'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {error && <p className="mt-2 text-sm text-rose-600">{error}</p>}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={send}
          disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />} Save & send
        </button>
        {sent && (
          <span className="inline-flex items-center gap-1 text-sm text-emerald-700">
            <CheckCircle2 className="size-4" /> Sent & marked reviewed
          </span>
        )}
      </div>
    </GlassCard>
  );
}
