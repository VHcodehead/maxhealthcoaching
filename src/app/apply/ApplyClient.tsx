'use client';

import { useEffect, useRef, useState } from 'react';
import { FormProvider, useForm, type Path, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';

import { SmoothScroll } from '@/components/marketing/SmoothScroll';
import {
  STEP_FIELDS,
  TOTAL_STEPS,
  applicationSchema,
  type ApplicationInput,
} from '@/lib/coaching/schemas';
import { clearDraft, loadDraft, saveDraft } from '@/lib/coaching/draft';

import { BackgroundGlow } from './BackgroundGlow';
import { ConfirmationScreen } from './ConfirmationScreen';
import { IntroScreen } from './IntroScreen';
import { StepShell } from './StepShell';
import { Step1Basics } from './steps/Step1Basics';
import { Step2Goal } from './steps/Step2Goal';
import { Step3Situation } from './steps/Step3Situation';
import { Step4Readiness } from './steps/Step4Readiness';
import { Step5Context } from './steps/Step5Context';
import { Step6Final } from './steps/Step6Final';

type Phase = 'intro' | 'form' | 'done';

const STEP_META: { eyebrow: string; title: string; intro?: string }[] = [
  { eyebrow: 'Basics', title: 'Who am I talking to?' },
  { eyebrow: 'Goal', title: 'What are you actually after?' },
  { eyebrow: 'Situation', title: "Where are you stuck right now?" },
  { eyebrow: 'Readiness', title: 'How ready are you for this?' },
  { eyebrow: 'Context', title: 'Tell me about your training life.' },
  { eyebrow: 'Final', title: 'Last few questions.' },
];

const DEFAULT_VALUES: Partial<ApplicationInput> = {
  struggles: [],
  inPrep: false,
};

export function ApplyClient() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const hydratedRef = useRef(false);

  // The Resolver cast works around a duplicate-type artifact between
  // react-hook-form and @hookform/resolvers in the current versions.
  const resolver = zodResolver(applicationSchema) as unknown as Resolver<ApplicationInput>;

  const methods = useForm<ApplicationInput>({
    resolver,
    mode: 'onTouched',
    defaultValues: DEFAULT_VALUES as ApplicationInput,
    shouldFocusError: true,
  });

  // Hydrate from localStorage draft (once)
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    const draft = loadDraft();
    if (!draft) return;
    methods.reset({ ...(DEFAULT_VALUES as ApplicationInput), ...(draft.values as ApplicationInput) });
    if (draft.step >= 1 && draft.step <= TOTAL_STEPS) {
      setStep(draft.step);
    }
  }, [methods]);

  // Persist draft on change (light debounce via setTimeout)
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | null = null;
    const sub = methods.watch((values) => {
      if (t) clearTimeout(t);
      t = setTimeout(() => {
        saveDraft({
          values: values as Record<string, unknown>,
          step,
          updatedAt: new Date().toISOString(),
        });
      }, 250);
    });
    return () => {
      if (t) clearTimeout(t);
      sub.unsubscribe();
    };
  }, [methods, step]);

  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBegin = () => {
    setPhase('form');
    setSubmitError(null);
    scrollToTop();
  };

  const handleBack = () => {
    setSubmitError(null);
    if (step <= 1) {
      setPhase('intro');
      return;
    }
    setStep((s) => s - 1);
    scrollToTop();
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const valid = await methods.trigger();
    if (!valid) {
      setSubmitting(false);
      setSubmitError('A few answers need attention — scroll up to see what.');
      return;
    }
    const data = methods.getValues();
    try {
      const res = await fetch('/api/coaching/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        setSubmitError("Something broke on submit. Try again in a moment.");
        setSubmitting(false);
        return;
      }
      clearDraft();
      setPhase('done');
      scrollToTop();
    } catch {
      setSubmitError('Network hiccup. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    setSubmitError(null);
    const fields = STEP_FIELDS[step - 1] as Path<ApplicationInput>[];
    const ok = await methods.trigger(fields);
    if (!ok) return;
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
      scrollToTop();
    } else {
      await submit();
    }
  };

  const meta = STEP_META[step - 1];

  return (
    <SmoothScroll>
      <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
        <BackgroundGlow />
        <FormProvider {...methods}>
          <AnimatePresence mode="wait">
            {phase === 'intro' && (
              <motion.div
                key="intro"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <IntroScreen onBegin={handleBegin} resumeStep={step > 1 ? step : undefined} />
              </motion.div>
            )}

            {phase === 'form' && (
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <StepShell
                  step={step}
                  total={TOTAL_STEPS}
                  eyebrow={meta.eyebrow}
                  title={meta.title}
                  intro={meta.intro}
                  onBack={handleBack}
                  onNext={handleNext}
                  submitting={submitting}
                  submitError={submitError}
                >
                  {step === 1 && <Step1Basics />}
                  {step === 2 && <Step2Goal />}
                  {step === 3 && <Step3Situation />}
                  {step === 4 && <Step4Readiness />}
                  {step === 5 && <Step5Context />}
                  {step === 6 && <Step6Final />}
                </StepShell>
              </motion.div>
            )}

            {phase === 'done' && (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <ConfirmationScreen />
              </motion.div>
            )}
          </AnimatePresence>
        </FormProvider>
      </div>
    </SmoothScroll>
  );
}
