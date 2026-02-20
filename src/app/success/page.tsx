'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          router.push('/onboarding');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
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
          className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="w-10 h-10 text-emerald-600" />
        </motion.div>

        <h1 className="text-3xl font-bold tracking-tight mb-3">
          Welcome to MaxHealth Coaching!
        </h1>

        <p className="text-zinc-500 text-lg mb-2">
          Your payment was successful. You&apos;re officially part of the team.
        </p>

        <div className="bg-zinc-50 rounded-xl p-6 mb-8 text-left">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            Here&apos;s what happens next:
          </h3>
          <ol className="space-y-2 text-sm text-zinc-600">
            <li className="flex gap-2">
              <span className="font-semibold text-emerald-600">1.</span>
              Complete your 5-minute onboarding profile
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-emerald-600">2.</span>
              We calculate your personalized macro targets
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-emerald-600">3.</span>
              Your coach builds your custom meal plan & training program
            </li>
            <li className="flex gap-2">
              <span className="font-semibold text-emerald-600">4.</span>
              Start your transformation immediately
            </li>
          </ol>
        </div>

        <Button
          size="lg"
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => router.push('/onboarding')}
        >
          Start Onboarding <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-xs text-zinc-400 mt-4">
          Redirecting automatically in {countdown}s...
        </p>
      </motion.div>
    </div>
  );
}
