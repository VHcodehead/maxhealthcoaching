'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, Instagram, Mail } from 'lucide-react';
import { fadeUp, stagger } from '@/lib/motion';

export function ConfirmationScreen() {
  return (
    <section className="relative z-10 mx-auto flex min-h-[100svh] max-w-2xl flex-col items-start justify-center px-5 py-20 md:px-8">
      <motion.div variants={stagger(0.1)} initial="hidden" animate="visible" className="space-y-7">
        <motion.div
          variants={fadeUp}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_40px] shadow-primary/40"
        >
          <Check className="h-7 w-7" strokeWidth={3} />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="font-display text-5xl leading-[1.02] tracking-tight text-foreground sm:text-6xl"
        >
          APPLICATION RECEIVED.
        </motion.h1>

        <motion.p variants={fadeUp} className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          If it looks like a fit, I&apos;ll reach out personally within 48 hours. If not, I&apos;ll still send a
          short note — no ghosting.
        </motion.p>

        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-border bg-card/40 p-5 text-sm text-muted-foreground"
        >
          <p className="mb-3 font-medium text-foreground">While you wait:</p>
          <ul className="space-y-2.5">
            <li className="flex items-start gap-2.5">
              <Instagram className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                Follow{' '}
                <a
                  href="https://instagram.com/coach.madmax"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-foreground underline-offset-4 hover:underline"
                >
                  @coach.madmax
                </a>{' '}
                — that&apos;s where most of the day-to-day is.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>Check your inbox for a confirmation. Reply to it with anything you forgot to mention.</span>
            </li>
          </ul>
        </motion.div>

        <motion.div variants={fadeUp}>
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Back to home
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}
