'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/motion';

interface IntroScreenProps {
  onBegin: () => void;
  resumeStep?: number;
}

export function IntroScreen({ onBegin, resumeStep }: IntroScreenProps) {
  return (
    <section className="relative z-10 mx-auto flex min-h-[100svh] max-w-2xl flex-col items-start justify-center px-5 py-20 md:px-8">
      <motion.div variants={stagger(0.1)} initial="hidden" animate="visible" className="space-y-7">
        <motion.div variants={fadeUp}>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to CoachMax
          </Link>
        </motion.div>

        <motion.span
          variants={fadeUp}
          className="inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium uppercase tracking-wider text-primary"
        >
          1:1 Coaching Application
        </motion.span>

        <motion.h1
          variants={fadeUp}
          className="font-display text-5xl leading-[1.02] tracking-tight text-foreground sm:text-6xl md:text-7xl"
        >
          THIS ISN&apos;T A SALES PAGE.
          <br />
          <span className="text-primary">IT&apos;S AN APPLICATION.</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          1:1 coaching is $299/mo on top of the My Pocket Coach app subscription. I take on a limited
          number of clients at a time. The next few minutes decide if we&apos;re a fit.
        </motion.p>

        <motion.ul variants={fadeUp} className="space-y-2.5 text-sm text-muted-foreground">
          {[
            'Six short steps. Most people finish in under 5 minutes.',
            'Answer honestly — vague answers tell me you aren’t ready.',
            'If it’s a fit, I reach out personally within 48 hours.',
          ].map((line) => (
            <li key={line} className="flex gap-2.5">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div variants={fadeUp} className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onBegin}
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_-6px] shadow-primary/40 transition-all hover:shadow-primary/60 active:scale-[0.98]"
          >
            {resumeStep ? `Resume — step ${resumeStep}` : 'Begin application'}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground/80">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> ~5 minutes
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Reviewed personally
            </span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
