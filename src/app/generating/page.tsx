'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, UtensilsCrossed, Dumbbell, CheckCircle, Loader2 } from 'lucide-react';

const steps = [
  {
    id: 'macros',
    label: 'Calculating your macro targets',
    description: 'Analyzing your body composition, activity level, and goals...',
    icon: Calculator,
    endpoint: '/api/macros',
  },
  {
    id: 'meal-plan',
    label: 'Generating your meal plan',
    description: 'Creating 7 days of personalized meals with your dietary preferences...',
    icon: UtensilsCrossed,
    endpoint: '/api/meal-plan',
  },
  {
    id: 'training-plan',
    label: 'Building your training program',
    description: 'Designing a progressive program tailored to your experience and goals...',
    icon: Dumbbell,
    endpoint: '/api/training-plan',
  },
];

type StepStatus = 'pending' | 'loading' | 'complete' | 'error';

export default function GeneratingPage() {
  const router = useRouter();
  const [stepStatuses, setStepStatuses] = useState<Record<string, StepStatus>>({
    macros: 'pending',
    'meal-plan': 'pending',
    'training-plan': 'pending',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generatePlans() {
      for (const step of steps) {
        setStepStatuses((prev) => ({ ...prev, [step.id]: 'loading' }));

        try {
          const res = await fetch(step.endpoint, { method: 'POST' });
          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.error || 'Generation failed');
          }

          setStepStatuses((prev) => ({ ...prev, [step.id]: 'complete' }));
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          setStepStatuses((prev) => ({ ...prev, [step.id]: 'error' }));
          setError(`${step.label} failed: ${message}`);
          return;
        }
      }

      // All done — redirect after brief delay
      setTimeout(() => router.push('/dashboard'), 1500);
    }

    generatePlans();
  }, [router]);

  const allComplete = Object.values(stepStatuses).every((s) => s === 'complete');

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-4xl font-display uppercase tracking-wider text-foreground mb-2">
            {allComplete ? 'YOUR PLANS ARE READY!' : 'BUILDING YOUR CUSTOM PLANS'}
          </h1>
          <p className="text-zinc-400">
            {allComplete
              ? 'Redirecting to your dashboard...'
              : 'This usually takes 30–60 seconds. Hang tight.'}
          </p>
        </motion.div>

        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = stepStatuses[step.id];
            const Icon = step.icon;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                  status === 'loading'
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : status === 'complete'
                    ? 'border-emerald-500/30 bg-emerald-950/20'
                    : status === 'error'
                    ? 'border-red-500/30 bg-red-950/20'
                    : 'border-white/10 bg-zinc-900'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    status === 'complete'
                      ? 'bg-emerald-500'
                      : status === 'loading'
                      ? 'bg-emerald-900/50'
                      : status === 'error'
                      ? 'bg-red-900/50'
                      : 'bg-zinc-800'
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {status === 'complete' ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <CheckCircle className="w-5 h-5 text-white" />
                      </motion.div>
                    ) : status === 'loading' ? (
                      <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                    ) : status === 'error' ? (
                      <Icon className="w-5 h-5 text-red-500" />
                    ) : (
                      <Icon className="w-5 h-5 text-zinc-400" />
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className={`font-medium text-sm ${
                      status === 'complete'
                        ? 'text-emerald-400'
                        : status === 'loading'
                        ? 'text-emerald-400'
                        : status === 'error'
                        ? 'text-red-400'
                        : 'text-zinc-400'
                    }`}
                  >
                    {step.label}
                    {status === 'complete' && ' ✓'}
                  </p>
                  {status === 'loading' && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-emerald-400/70 mt-1"
                    >
                      {step.description}
                    </motion.p>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-red-950/20 border border-red-500/30 rounded-xl text-center"
          >
            <p className="text-sm text-red-400 mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-sm text-red-400 underline"
            >
              Try again
            </button>
          </motion.div>
        )}

        {allComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <div className="w-8 h-8 border-2 border-emerald-900 border-t-emerald-400 rounded-full animate-spin mx-auto" />
          </motion.div>
        )}
      </div>
    </div>
  );
}
