'use client';

// src/app/client/link/page.tsx
//
// Unified Coaching Hub — client-facing identity link UI (drives the Phase 0
// email-code flow). Step 1: enter app email → code sent. Step 2: enter code →
// linked. On success, returns to the portal home.

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/coaching-hub/primitives';
import { Loader2, CheckCircle2 } from 'lucide-react';

type Step = 'email' | 'code' | 'done';

export default function LinkAppAccountPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [appEmail, setAppEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const res = await fetch('/api/app-link/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'Could not send a code.');
      } else {
        setInfo(json.message ?? 'Code sent.');
        setStep('code');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/app-link/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? 'That code did not work.');
      } else {
        setStep('done');
        setTimeout(() => router.push('/client'), 1400);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="pt-6">
      <h1 className="text-2xl font-bold text-slate-900">Connect your app account</h1>
      <p className="mt-1 text-sm text-slate-500">
        Link your MyPocketCoach app so your coach can see your training, nutrition, and progress.
      </p>

      <GlassCard className="mt-6 p-6">
        {step === 'email' && (
          <form onSubmit={requestCode} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-700">Your app email</label>
              <input
                type="email"
                required
                value={appEmail}
                onChange={(e) => setAppEmail(e.target.value)}
                placeholder="the email you use in the app"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {busy && <Loader2 className="size-4 animate-spin" />} Send code
            </button>
          </form>
        )}

        {step === 'code' && (
          <form onSubmit={verifyCode} className="space-y-4">
            {info && <p className="text-sm text-emerald-700">{info}</p>}
            <div>
              <label className="text-sm font-medium text-slate-700">6-digit code</label>
              <input
                inputMode="numeric"
                pattern="\d{6}"
                maxLength={6}
                required
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white/70 px-3 py-2.5 text-center text-lg tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-emerald-300"
              />
            </div>
            {error && <p className="text-sm text-rose-600">{error}</p>}
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
              >
                {busy && <Loader2 className="size-4 animate-spin" />} Verify & link
              </button>
              <button
                type="button"
                onClick={() => { setStep('email'); setCode(''); setError(null); }}
                className="text-sm text-slate-500 hover:text-slate-700"
              >
                Use a different email
              </button>
            </div>
          </form>
        )}

        {step === 'done' && (
          <div className="flex items-center gap-3 text-emerald-700">
            <CheckCircle2 className="size-6" />
            <p className="text-sm font-medium">Linked! Taking you to your portal…</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
