'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!sessionId) return;

    async function verifyAndRefresh() {
      try {
        // Activate subscription in DB immediately (don't wait for webhook)
        const res = await fetch('/api/checkout/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        });

        if (!res.ok) {
          setError(true);
          return;
        }

        setVerified(true);
      } catch {
        setError(true);
      }
    }

    verifyAndRefresh();
  }, [sessionId]);

  const handleContinue = () => {
    window.location.href = '/onboarding';
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-lg text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 bg-emerald-900/50 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </motion.div>

        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Welcome to MaxHealth Coaching!
        </h1>

        <p className="text-zinc-400 text-lg mb-2">
          Your payment was successful. You&apos;re officially part of the team.
        </p>

        <div className="bg-zinc-900 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            Here&apos;s what happens next:
          </h3>
          <ol className="space-y-2 text-sm text-zinc-400">
            <li className="flex gap-2">
              <span className="font-semibold text-emerald-400">1.</span>
              Complete your 5-minute onboarding profile
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-emerald-400">2.</span>
              We calculate your personalized macro targets
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-emerald-400">3.</span>
              Your coach builds your custom meal plan & training program
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-emerald-400">4.</span>
              Start your transformation immediately
            </li>
          </ol>
        </div>

        {error ? (
          <p className="text-sm text-zinc-400 mb-4">
            If you&apos;re not redirected,{' '}
            <a href="/onboarding" className="text-emerald-400 underline">click here to continue</a>.
          </p>
        ) : !verified ? (
          <Button size="lg" className="bg-primary hover:bg-primary/90" disabled>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Activating your account...
          </Button>
        ) : (
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90"
            onClick={handleContinue}
          >
            Start Onboarding <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
