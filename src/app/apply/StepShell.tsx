'use client';

import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/lib/motion';

interface StepShellProps {
  step: number;
  total: number;
  eyebrow: string;
  title: string;
  intro?: string;
  children: React.ReactNode;
  onBack: () => void;
  onNext: () => void;
  submitting?: boolean;
  submitError?: string | null;
}

export function StepShell({
  step,
  total,
  eyebrow,
  title,
  intro,
  children,
  onBack,
  onNext,
  submitting = false,
  submitError = null,
}: StepShellProps) {
  const isFinal = step === total;
  const pct = Math.round((step / total) * 100);

  return (
    <section className="relative z-10 mx-auto w-full max-w-2xl px-5 pb-40 pt-10 md:px-8 md:pb-32 md:pt-16">
      {/* Progress */}
      <div className="mb-8">
        <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
          <span className="font-medium text-foreground">Step {step} of {total}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-border/60">
          <motion.div
            initial={false}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full rounded-full bg-primary shadow-[0_0_12px] shadow-primary/60"
          />
        </div>
      </div>

      <motion.div
        key={`step-${step}-header`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h2 className="font-display text-3xl leading-tight tracking-tight text-foreground sm:text-4xl">
          {title}
        </h2>
        {intro && <p className="mt-3 text-sm text-muted-foreground">{intro}</p>}
      </motion.div>

      <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-6">
        {children}
      </motion.div>

      {submitError && (
        <p className="mt-6 text-sm text-destructive" role="alert">
          {submitError}
        </p>
      )}

      {/* Desktop nav (inline) */}
      <div className="mt-10 hidden items-center justify-between md:flex">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="inline-flex h-10 items-center gap-1.5 rounded-full px-4 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <NextButton onNext={onNext} isFinal={isFinal} submitting={submitting} />
      </div>

      {/* Mobile sticky nav */}
      <div
        className={cn(
          'fixed inset-x-0 bottom-0 z-30 md:hidden',
          'border-t border-border/60 bg-background/85 backdrop-blur-md',
        )}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-3">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-sm text-muted-foreground disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <NextButton onNext={onNext} isFinal={isFinal} submitting={submitting} compact />
        </div>
      </div>
    </section>
  );
}

function NextButton({
  onNext,
  isFinal,
  submitting,
  compact = false,
}: {
  onNext: () => void;
  isFinal: boolean;
  submitting: boolean;
  compact?: boolean;
}) {
  const label = isFinal ? 'Submit application' : 'Continue';
  return (
    <button
      type="button"
      onClick={onNext}
      disabled={submitting}
      className={cn(
        'group inline-flex items-center justify-center gap-2 rounded-full bg-primary font-semibold text-primary-foreground shadow-[0_0_30px_-6px] shadow-primary/40 transition-all hover:shadow-primary/60 active:scale-[0.98] disabled:opacity-70',
        compact ? 'h-11 px-5 text-sm' : 'h-11 px-6 text-sm',
      )}
    >
      {submitting ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
        </>
      ) : (
        <>
          {label}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  );
}
