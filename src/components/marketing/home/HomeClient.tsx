'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  AnimatePresence,
  motion,
  useInView,
  useMotionTemplate,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Dumbbell,
  Flame,
  Heart,
  Instagram,
  Moon,
  Scale,
  Trophy,
  UtensilsCrossed,
  X,
} from 'lucide-react';

import { SmoothScroll } from '@/components/marketing/SmoothScroll';
import { BrandWordmark } from '@/components/marketing/BrandWordmark';
import { PhotoPlaceholder } from '@/components/marketing/PhotoPlaceholder';
import { AnimatedCounter } from '@/components/marketing/AnimatedCounter';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { fadeUp, stagger } from '@/lib/motion';
import { cn } from '@/lib/utils';

// ───────────────────────────────────────────────────────────────────────────
// Page orchestrator
// ───────────────────────────────────────────────────────────────────────────

export function HomeClient() {
  const [scrolled, setScrolled] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [footerInView, setFooterInView] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
      setStickyVisible(window.scrollY > window.innerHeight * 0.75);
      if (footerRef.current) {
        const r = footerRef.current.getBoundingClientRect();
        setFooterInView(r.top < window.innerHeight);
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <SmoothScroll>
      <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
        <Nav scrolled={scrolled} />
        <Hero />
        <ProblemSection />
        <PinnedStatement />
        <TransformationReveal />
        <TransformationRevealMobile />
        <MoatSection />
        <WhoFor />
        <Framework />
        <CoachingDiptych />
        <Results />
        <Pricing />
        <About />
        <FAQ />
        <FinalCTA />
        <HomeFooter forwardRef={footerRef} />
        <StickyMobileCTA visible={stickyVisible && !footerInView} />
      </div>
    </SmoothScroll>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Nav
// ───────────────────────────────────────────────────────────────────────────

function Nav({ scrolled }: { scrolled: boolean }) {
  const { scrollYProgress } = useScroll();
  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-300',
        scrolled
          ? 'border-b border-border/60 bg-zinc-950/80 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3.5 md:px-8">
        <Link href="/" className="transition-opacity hover:opacity-80">
          <BrandWordmark />
        </Link>
        <nav className="flex items-center gap-1 md:gap-5">
          <Link
            href="#how"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            How it works
          </Link>
          <Link
            href="#pricing"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            Pricing
          </Link>
          <Link
            href="#faq"
            className="hidden text-sm text-muted-foreground transition-colors hover:text-foreground md:inline"
          >
            FAQ
          </Link>
          <Link
            href="/apply"
            className="ml-2 inline-flex h-9 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-[0_0_24px_-6px] shadow-primary/50 transition-all hover:shadow-primary/70"
          >
            Apply <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </div>
      {/* Scroll progress indicator */}
      <motion.div
        aria-hidden
        style={{ scaleX: scrollYProgress, transformOrigin: 'left center' }}
        className="absolute bottom-0 left-0 right-0 h-px bg-primary shadow-[0_0_12px] shadow-primary/60"
      />
    </header>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Hero
// ───────────────────────────────────────────────────────────────────────────

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 140]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.1]);

  return (
    <section
      ref={ref}
      className="relative min-h-[100svh] overflow-hidden"
      aria-label="Hero"
    >
      {/* Photo layer */}
      <motion.div
        style={{ y: photoY, opacity: heroOpacity }}
        className="absolute inset-0 z-0"
      >
        <Image
          src="/images/hero/silhouette-hero.png"
          alt="CoachMax — competitive bodybuilder silhouette"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Gradient overlays — top to bottom + left bias for headline legibility */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/30 to-background" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent" />
      </motion.div>

      {/* Background ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 z-0 h-[720px] w-[820px] -translate-x-1/2 rounded-full opacity-50 blur-[140px]"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.68 0.20 245 / 0.30), transparent 70%)',
        }}
      />

      {/* Content */}
      <motion.div
        style={{ y: textY }}
        className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col justify-center px-5 pb-20 pt-24 md:px-8 md:pb-32 md:pt-32"
      >
        <motion.div variants={stagger(0.12)} initial="hidden" animate="visible" className="max-w-3xl">
          <motion.span
            variants={fadeUp}
            className="mb-5 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-primary"
          >
            1:1 Coaching with Max
          </motion.span>

          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl uppercase leading-[0.95] tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
          >
            STOP GUESSING.
            <br />
            <span className="text-primary">GET COACHED.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg"
          >
            Personal weekly oversight from a competitor who&apos;s been there — delivered through My Pocket Coach.
            Real adjustments. Real accountability. No templates.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/apply"
              className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-[0_0_40px_-6px] shadow-primary/50 transition-all hover:shadow-primary/70 active:scale-[0.98]"
            >
              Apply for coaching
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="#system"
              className="group inline-flex h-12 items-center justify-center gap-1.5 rounded-full border border-border bg-card/40 px-6 text-sm font-medium text-foreground backdrop-blur-sm transition-all hover:border-primary/50 hover:bg-card/60"
            >
              Explore My Pocket Coach
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-6 text-xs uppercase tracking-wider text-muted-foreground/70">
            From $800 / 12 weeks · Plus app subscription · Limited spots
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-muted-foreground/60"
        >
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Who this is for
// ───────────────────────────────────────────────────────────────────────────

const WHO_FOR = [
  {
    icon: Flame,
    title: 'Fat loss',
    body: 'Get lean without losing the muscle you spent years building.',
  },
  {
    icon: Dumbbell,
    title: 'Muscle gain',
    body: 'Add real size. Lean, slow, progressive — not a dirty bulk.',
  },
  {
    icon: Scale,
    title: 'Recomposition',
    body: 'Lose fat and build muscle at the same time. Tighter inputs, longer game.',
  },
  {
    icon: Trophy,
    title: 'Bodybuilding & contest prep',
    body: 'Stage-ready coaching from someone who has been on stage. Peak week handled.',
  },
  {
    icon: Heart,
    title: 'Reverse & post-show',
    body: 'Slow, intentional return. Not another crash diet.',
  },
];

function WhoFor() {
  return (
    <section id="how" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader
          eyebrow="Who this is for"
          title="Built for people who are done playing."
          intro="If any of these is you, the application is the next step."
        />
        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {WHO_FOR.map((item) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.title}
                variants={{
                  hidden: { opacity: 0, y: 28, scale: 0.97 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                whileHover={{ y: -6 }}
                transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-7 transition-colors hover:border-primary/40 hover:bg-card/60"
              >
                {/* hover glow */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background:
                      'radial-gradient(circle at 50% 0%, oklch(0.68 0.20 245 / 0.18), transparent 60%)',
                  }}
                />
                <div className="relative mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="relative mb-2 text-lg font-semibold text-foreground">{item.title}</h3>
                <p className="relative text-sm leading-relaxed text-muted-foreground">{item.body}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Hard filter — "not for" line */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-10 max-w-3xl"
        >
          <div className="relative overflow-hidden rounded-2xl border border-destructive/25 bg-destructive/[0.04] p-5 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-destructive/80">
              Not for
            </p>
            <p className="mt-2 text-sm leading-relaxed text-foreground/90 md:text-base">
              Shortcuts. People who won&apos;t track. People who want to be told what they want to hear.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Results
// ───────────────────────────────────────────────────────────────────────────

const METRICS = [
  { value: 500, suffix: '+', label: 'Clients coached' },
  { value: 84, suffix: ' day', label: 'Average transformation', after: 's' },
  { value: 95, suffix: '%', label: 'Client retention' },
];

function Results() {
  return (
    <section id="results" className="relative py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-[420px] -translate-y-1/2 opacity-30 blur-[100px]"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.68 0.20 245 / 0.20), transparent 70%)',
        }}
      />
      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader
          eyebrow="Results"
          title="Real clients. Real changes."
          intro="The system has been refined on hundreds of physiques — yours is next."
        />

        {/* Metric tiles */}
        <motion.div
          variants={stagger(0.12)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12 grid gap-5 sm:grid-cols-3"
        >
          {METRICS.map((m) => (
            <motion.div
              key={m.label}
              variants={{
                hidden: { opacity: 0, y: 24, scale: 0.96 },
                visible: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              whileHover={{ y: -4, borderColor: 'oklch(0.68 0.20 245 / 0.4)' }}
              transition={{ type: 'spring', stiffness: 280, damping: 24 }}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card/40 p-8 text-center"
            >
              {/* Subtle glow behind */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-1/2 -z-0 h-32 -translate-y-1/2 opacity-0 blur-[60px] transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background:
                    'radial-gradient(closest-side, oklch(0.68 0.20 245 / 0.30), transparent 70%)',
                }}
              />
              <p className="relative font-display text-5xl tracking-tight text-primary md:text-6xl">
                <AnimatedCounter to={m.value} suffix={m.suffix} />
              </p>
              <p className="relative mt-2 text-sm text-muted-foreground">{m.label}</p>
            </motion.div>
          ))}
        </motion.div>

        <p className="mt-10 text-center text-xs text-muted-foreground/60">
          Results vary. Individual outcomes depend on adherence, starting point, and consistency.
        </p>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Pricing
// ───────────────────────────────────────────────────────────────────────────

const COACHING_TIERS = [
  {
    name: 'Monthly',
    price: 349,
    unit: '/ month',
    perMonth: null,
    save: null,
    pitch: 'Try the relationship. Cancel any time.',
    features: [
      'Adaptive plan that auto-adjusts as you log',
      'Weekly check-in review by Max',
      'Strategic mid-cycle calls (training, prep, cardio)',
      'Direct messaging access',
      'Full specialty coverage',
    ],
    badge: null,
    highlight: false,
  },
  {
    name: '12 weeks',
    price: 800,
    unit: 'one-time',
    perMonth: 267,
    save: 247,
    pitch: 'The transformation block. A real timeline for real change.',
    features: [
      'Everything in monthly',
      'Full 12-week arc, locked in',
      'Better cadence — no monthly decision fatigue',
      'Priority application review',
    ],
    badge: 'Most popular',
    highlight: true,
  },
  {
    name: '20 weeks',
    price: 1250,
    unit: 'one-time',
    perMonth: 250,
    save: 495,
    pitch: 'Prep-aligned. Full competitive cycle, end to end.',
    features: [
      'Everything in 12-week',
      'Full prep window covered',
      'Peak-week planning included',
      'Maximum results per dollar',
    ],
    badge: 'Best value',
    highlight: false,
  },
] as const;

const APP_TRACKS = [
  {
    name: 'Regular track',
    intro: '$10',
    introUnit: 'first 2 months',
    ongoing: '$19.99',
    ongoingUnit: '/ month after',
    who: 'Transformation, fat loss, recomp, muscle gain',
  },
  {
    name: 'Prep track',
    intro: '$25',
    introUnit: 'first 2 months',
    ongoing: '$50',
    ongoingUnit: '/ month after',
    who: 'Bodybuilding, contest prep, reverse diet',
  },
] as const;

const TOTAL_EXAMPLES = [
  { label: 'Regular client · 12 weeks', total: '~$835' },
  { label: 'Regular client · 20 weeks', total: '~$1,330' },
  { label: 'Prep client · 12 weeks', total: '~$888' },
  { label: 'Prep client · 20 weeks', total: '~$1,450' },
] as const;

function Pricing() {
  return (
    <section id="pricing" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader
          eyebrow="Investment"
          title="Pick your window."
          intro="Same coaching at every tier. The difference is how long you're committing to the work. Most clients pick 12 weeks."
        />

        {/* 1:1 Coaching tiers */}
        <motion.div
          variants={stagger(0.1)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-14 grid gap-5 md:grid-cols-3"
        >
          {COACHING_TIERS.map((tier) => (
            <motion.div
              key={tier.name}
              variants={fadeUp}
              className={cn(
                'relative flex flex-col rounded-3xl border bg-card/40 p-7 transition-all md:p-8',
                tier.highlight
                  ? 'border-primary/40 shadow-[0_0_60px_-12px] shadow-primary/40 md:scale-[1.03]'
                  : 'border-border hover:border-primary/30',
              )}
            >
              {tier.highlight && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-60 blur-[70px]"
                  style={{
                    background:
                      'radial-gradient(closest-side, oklch(0.68 0.20 245 / 0.45), transparent 70%)',
                  }}
                />
              )}
              {tier.badge && (
                <span
                  className={cn(
                    'absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.15em]',
                    tier.highlight
                      ? 'bg-primary text-primary-foreground shadow-[0_0_20px] shadow-primary/50'
                      : 'border border-border bg-card text-muted-foreground',
                  )}
                >
                  {tier.badge}
                </span>
              )}

              <div className="relative">
                <p className="text-xs uppercase tracking-[0.2em] text-primary">{tier.name}</p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="font-display text-5xl tracking-tight text-foreground md:text-6xl">
                    ${tier.price.toLocaleString()}
                  </span>
                  <span className="text-sm text-muted-foreground">{tier.unit}</span>
                </div>
                {tier.perMonth && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    ≈ ${tier.perMonth}/mo
                    {tier.save && (
                      <>
                        {' '}
                        ·{' '}
                        <span className="text-primary">save ${tier.save}</span>
                      </>
                    )}
                  </p>
                )}
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{tier.pitch}</p>

                <motion.ul
                  variants={stagger(0.06)}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: '-60px' }}
                  className="mt-6 space-y-2.5"
                >
                  {tier.features.map((f) => (
                    <motion.li
                      key={f}
                      variants={{
                        hidden: { opacity: 0, x: -10 },
                        visible: {
                          opacity: 1,
                          x: 0,
                          transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
                        },
                      }}
                      className="flex items-start gap-2.5 text-sm"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <ClipboardCheck className="h-2.5 w-2.5" strokeWidth={3} />
                      </span>
                      <span className="text-foreground/85">{f}</span>
                    </motion.li>
                  ))}
                </motion.ul>

                <Link
                  href="/apply"
                  className={cn(
                    'group mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all active:scale-[0.98]',
                    tier.highlight
                      ? 'bg-primary text-primary-foreground shadow-[0_0_30px_-6px] shadow-primary/60 hover:shadow-primary/80'
                      : 'border border-border bg-transparent text-foreground hover:border-primary/40 hover:bg-card',
                  )}
                >
                  Apply
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* + App subscription */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-12"
        >
          <p className="mb-4 text-center text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
            + My Pocket Coach app
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {APP_TRACKS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-border bg-card/30 p-5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">via App Store</p>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.who}</p>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="font-display text-2xl tracking-tight text-primary">{t.intro}</span>
                  <span className="text-xs text-muted-foreground">{t.introUnit}</span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground/80">
                  then <span className="text-foreground">{t.ongoing}</span> {t.ongoingUnit}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* What you actually pay */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-10 rounded-2xl border border-border bg-card/20 p-6 md:p-7"
        >
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            What you actually pay
          </p>
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {TOTAL_EXAMPLES.map((e) => (
              <div
                key={e.label}
                className="flex items-baseline justify-between border-b border-border/60 py-2 text-sm last:border-b-0 sm:[&:nth-last-child(2)]:border-b-0"
              >
                <span className="text-muted-foreground">{e.label}</span>
                <span className="font-semibold text-foreground">{e.total}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground/70">
            Includes app intro pricing. App subscription billed by Apple / Google through the App Store. Coaching
            billed directly by Max after your application is approved. No payment on this site.
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// About
// ───────────────────────────────────────────────────────────────────────────

function About() {
  return (
    <section id="about" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="grid items-center gap-10 md:grid-cols-[1fr_1.2fr] md:gap-16">
          <motion.div
            initial={{ clipPath: 'inset(100% 0 0 0)' }}
            whileInView={{ clipPath: 'inset(0% 0 0 0)' }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-2xl border border-border"
          >
            <div className="relative aspect-[3/5]">
              <Image
                src="/images/about/max-portrait.png"
                alt="Max — coach, competitive bodybuilder"
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover object-center"
              />
            </div>
            {/* Subtle bottom-up vignette */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-background/60 to-transparent"
            />
          </motion.div>

          <motion.div
            variants={stagger(0.1)}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
          >
            <motion.p
              variants={fadeUp}
              className="mb-4 text-[11px] font-medium uppercase tracking-[0.22em] text-primary"
            >
              About
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className="font-display text-4xl uppercase leading-[1.05] tracking-tight md:text-5xl"
            >
              Who&apos;s coaching you.
            </motion.h2>
            <motion.div variants={fadeUp} className="mt-6 space-y-4 text-base leading-relaxed text-muted-foreground">
              <p>
                I&apos;m Max. I&apos;ve spent years training, competing, and building the system most coaches charge double for.
              </p>
              <p>
                I built My Pocket Coach to take cookie-cutter out of fitness. The app adapts your plan day to
                day as you log — macros pull back when you overshoot, push when you undershoot, all without
                you asking. That handles the noise. I handle the signal: weekly check-in review, strategic
                training calls, prep timing, the stuff the algorithm shouldn&apos;t decide alone.
              </p>
              <p>
                That&apos;s the value of working with me directly: an adaptive system underneath, and someone
                who&apos;s been on stage watching it run.
              </p>
            </motion.div>
            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap gap-2 text-xs"
            >
              {['Competitive athlete', 'Prep specialty', 'Founder, My Pocket Coach'].map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-border bg-card/40 px-3 py-1.5 text-muted-foreground"
                >
                  {c}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// FAQ
// ───────────────────────────────────────────────────────────────────────────

const FAQS = [
  {
    q: 'What does 1:1 coaching with you actually include?',
    a: "The app adapts your macros automatically based on what you actually log — that's the daily loop. I sit on top of that: weekly review of your check-ins, strategic adjustments to training, cardio, prep timing, and the calls the algorithm can't make. Direct messaging access between check-ins. Full specialty coverage for prep, transformation, and reverse dieting.",
  },
  {
    q: 'What does "adaptive" actually mean?',
    a: "The app sees what you log each day and adjusts your targets for the coming week. Overshoot calories on the weekend? It gently pulls them back next week instead of pretending it didn't happen. Hit a plateau? The system flags it. Then I look at the bigger picture — phase, prep stage, life stress, recovery — and make the calls the automation shouldn't make alone.",
  },
  {
    q: 'Why two charges — the app and the coaching?',
    a: "The app gives you the structure — plans, tracking, check-ins, daily targets. It's the dashboard I work inside. The coaching fee buys you me on top of that. Splitting the two keeps both products honest about what they actually do: the app is software you can use forever; the coaching is my time. Most coaches at this level deliver in spreadsheets and charge $500–1,000/mo for the privilege. The total here is roughly half that for a real, app-supported coaching relationship.",
  },
  {
    q: 'How does payment work?',
    a: "Two separate billing relationships. The My Pocket Coach app subscription is billed by Apple or Google through the App Store / Play Store in-app purchase. The 1:1 coaching fee is billed directly by me after your application is approved — Venmo, Zelle, or wire, your choice. No payment is collected on this site. You only commit anything after we talk and agree it's a fit.",
  },
  {
    q: 'What happens at the end of a 12-week or 20-week package?',
    a: "We sit down (virtually) and decide together. You can renew into the same window, drop to monthly to continue at a lighter cadence, or step back to the app on its own. I don't auto-renew packages — every commitment is intentional. That's the entire point of the package structure.",
  },
  {
    q: 'Can I just use the app without 1:1 coaching?',
    a: 'Yes. The app stands on its own and most users start there — that path is the regular signup flow, not this site. The 1:1 layer is for people who want me in the loop adjusting things weekly — especially anyone running prep, an aggressive transformation, or coming back from a reverse.',
  },
  {
    q: 'Do you take beginners?',
    a: 'Sometimes. If you have never trained before, the app alone is the right place to start. The 1:1 service is built for people with at least a year of consistent training who are ready to commit hard to a real result.',
  },
  {
    q: 'How quickly do you respond?',
    a: 'Applications get a personal response within 48 hours. Once you are a client, check-in reviews are returned within 48 hours and direct messages within 24.',
  },
  {
    q: 'Do you do contest prep specifically?',
    a: 'Yes — prep is one of my main focuses. The application will ask about your show date, federation, and current stage so I can place you correctly. Prep clients run on the Prep app tier with prep-specific features (peak week, water/sodium, peak weight tracking).',
  },
  {
    q: 'What is your refund policy?',
    a: 'Monthly is month-to-month — cancel any time. Packages are committed but if you are not getting results because of something on my end, I refund the unused portion. Honest work both ways.',
  },
  {
    q: 'What is required of me?',
    a: 'Log your food and workouts in the app — that is what makes the adaptive layer work. Submit a weekly check-in with weight + photos. Show up to your training. The app sees what you actually do; I see what the app sees. That is the entire deal.',
  },
];

function FAQ() {
  return (
    <section id="faq" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <SectionHeader
          eyebrow="FAQ"
          title="Things you might be wondering."
        />
        <div className="mt-12">
          <Accordion type="single" collapsible className="space-y-2">
            {FAQS.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.05,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <AccordionItem
                  value={`faq-${i}`}
                  className="overflow-hidden rounded-xl border border-border bg-card/40 px-5 transition-colors hover:bg-card/60"
                >
                  <AccordionTrigger className="py-4 text-left text-sm font-medium hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Final CTA
// ───────────────────────────────────────────────────────────────────────────

function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });
  const headlineScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.88, 1.04, 1.08]);
  const glowScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.8, 1.1, 1.2]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.2, 0.6, 0.3]);

  return (
    <section ref={ref} className="relative overflow-hidden py-32 md:py-40">
      {/* Background ambient glow — scroll-reactive */}
      <motion.div
        aria-hidden
        style={{ scale: glowScale, opacity: glowOpacity }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
      >
        <div
          className="h-full w-full rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, oklch(0.68 0.20 245 / 0.65), transparent 70%)',
          }}
        />
      </motion.div>
      <div className="relative mx-auto max-w-3xl px-5 text-center md:px-8">
        <motion.h2
          style={{ scale: headlineScale }}
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="font-display text-5xl uppercase leading-[1] tracking-tight md:text-7xl"
        >
          DONE WITH TEMPLATES?
        </motion.h2>
        <motion.p
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mx-auto mt-5 max-w-xl text-base text-muted-foreground md:text-lg"
        >
          Apply now. 48-hour response. If it&apos;s a fit, we get to work.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-10 flex flex-col items-center"
        >
          <Link
            href="/apply"
            className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-primary px-9 text-base font-semibold text-primary-foreground shadow-[0_0_60px_-6px] shadow-primary/60 transition-all hover:shadow-primary/80 active:scale-[0.98]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Apply for coaching
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            </span>
            <motion.span
              aria-hidden
              className="absolute inset-0 bg-white/0"
              animate={{ backgroundColor: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0)'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />
          </Link>
          <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground/70">
            Limited spots · No payment on this site
          </p>
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Footer
// ───────────────────────────────────────────────────────────────────────────

function HomeFooter({ forwardRef }: { forwardRef: React.RefObject<HTMLElement | null> }) {
  return (
    <footer ref={forwardRef} className="border-t border-border bg-card/30">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-8 md:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <BrandWordmark size="lg" />
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              1:1 coaching by Max — delivered through My Pocket Coach.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <a
              href="https://instagram.com/coach.madmax"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Instagram className="h-4 w-4" /> @coach.madmax
            </a>
            <Link href="/apply" className="transition-colors hover:text-foreground">
              Apply
            </Link>
            <Link href="#pricing" className="transition-colors hover:text-foreground">
              Pricing
            </Link>
            <Link href="#faq" className="transition-colors hover:text-foreground">
              FAQ
            </Link>
          </div>
        </div>
        <div className="mt-10 space-y-1.5 border-t border-border pt-6 text-center text-xs text-muted-foreground/60">
          <p>
            CoachMax provides fitness and nutrition guidance. This is not medical advice. Consult your physician
            before starting any new diet or exercise program.
          </p>
          <p>© 2024–{new Date().getFullYear()} CoachMax. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Sticky mobile CTA
// ───────────────────────────────────────────────────────────────────────────

function StickyMobileCTA({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/85 backdrop-blur-md md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-5 py-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">From $800 / 12 wks</p>
              <p className="text-sm font-medium text-foreground">1:1 with Max</p>
            </div>
            <Link
              href="/apply"
              className="group inline-flex h-11 items-center gap-1.5 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-[0_0_30px_-6px] shadow-primary/60"
            >
              Apply
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Shared bits
// ───────────────────────────────────────────────────────────────────────────

function SectionHeader({
  eyebrow,
  title,
  intro,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  const words = title.split(' ');

  return (
    <div ref={ref} className="mx-auto max-w-2xl text-center">
      {/* Eyebrow with chapter-line accents */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <motion.span
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'right center' }}
          className="block h-px w-8 bg-primary/60"
        />
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{ duration: 0.4, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary"
        >
          {eyebrow}
        </motion.p>
        <motion.span
          initial={{ scaleX: 0, opacity: 0 }}
          animate={inView ? { scaleX: 1, opacity: 1 } : undefined}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'left center' }}
          className="block h-px w-8 bg-primary/60"
        />
      </div>

      {/* Title — word-by-word reveal with overflow-hidden line mask */}
      <h2 className="font-display text-4xl uppercase leading-[1.05] tracking-tight text-foreground md:text-5xl lg:text-6xl">
        {words.map((word, i) => (
          <Fragment key={`${word}-${i}`}>
            <span className="inline-block overflow-hidden align-bottom">
              <motion.span
                initial={{ y: '110%' }}
                animate={inView ? { y: '0%' } : undefined}
                transition={{
                  duration: 0.7,
                  delay: 0.25 + i * 0.06,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block"
              >
                {word}
              </motion.span>
            </span>
            {i < words.length - 1 && ' '}
          </Fragment>
        ))}
      </h2>

      {intro && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={inView ? { opacity: 1, y: 0 } : undefined}
          transition={{
            duration: 0.6,
            delay: 0.35 + words.length * 0.06,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="mt-6 text-base text-muted-foreground md:text-lg"
        >
          {intro}
        </motion.p>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// PinnedStatement — sticky cinematic moment between Hero and TransformationReveal
// ───────────────────────────────────────────────────────────────────────────

function PinnedStatement() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Tightened: all three lines land within first 40% of scroll progress
  // so the user can't scroll past before the punchline appears.
  const opacityLine1 = useTransform(scrollYProgress, [0.06, 0.16, 0.78, 0.92], [0, 1, 1, 0]);
  const opacityLine2 = useTransform(scrollYProgress, [0.16, 0.26, 0.78, 0.92], [0, 1, 1, 0]);
  const opacityLine3 = useTransform(scrollYProgress, [0.26, 0.36, 0.82, 0.94], [0, 1, 1, 0]);

  const yLine1 = useTransform(scrollYProgress, [0.06, 0.16], [24, 0]);
  const yLine2 = useTransform(scrollYProgress, [0.16, 0.26], [24, 0]);
  const yLine3 = useTransform(scrollYProgress, [0.26, 0.36], [32, 0]);

  const accentScale = useTransform(scrollYProgress, [0.26, 0.4, 0.82, 0.94], [0.92, 1.04, 1.04, 0.96]);
  const glowOpacity = useTransform(scrollYProgress, [0.26, 0.4, 0.82, 0.94], [0, 0.7, 0.7, 0]);
  const lineWidth = useTransform(scrollYProgress, [0.1, 0.45], ['0%', '60%']);

  return (
    <section ref={ref} className="relative h-[170vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-background">
        {/* Ambient bg */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-zinc-950 via-background to-zinc-950"
        />
        <motion.div
          aria-hidden
          style={{ opacity: glowOpacity }}
          className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[160px]"
        >
          <div
            className="h-full w-full rounded-full"
            style={{
              background:
                'radial-gradient(closest-side, oklch(0.68 0.20 245 / 0.40), transparent 70%)',
            }}
          />
        </motion.div>

        <div className="relative z-10 mx-auto max-w-5xl px-5 text-center md:px-8">
          {/* Eyebrow */}
          <motion.p
            style={{ opacity: opacityLine1 }}
            className="mb-8 text-[11px] font-medium uppercase tracking-[0.32em] text-primary"
          >
            The truth
          </motion.p>

          {/* Three-line statement, word-by-word reveal */}
          <h2 className="font-display uppercase leading-[0.92] tracking-tight">
            <motion.span
              style={{ opacity: opacityLine1, y: yLine1 }}
              className="block text-4xl text-foreground sm:text-5xl md:text-7xl lg:text-8xl"
            >
              Most plans fail
            </motion.span>
            <motion.span
              style={{ opacity: opacityLine2, y: yLine2 }}
              className="mt-2 block text-3xl text-muted-foreground/90 sm:text-4xl md:text-5xl lg:text-6xl"
            >
              because nobody adjusts them.
            </motion.span>
            <motion.span
              style={{ opacity: opacityLine3, y: yLine3, scale: accentScale }}
              className="mt-6 block text-5xl text-primary sm:text-7xl md:text-8xl lg:text-9xl"
            >
              I do.
            </motion.span>
          </h2>

          {/* Underline accent */}
          <motion.div
            style={{ width: lineWidth }}
            className="mx-auto mt-10 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
          />
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// TransformationReveal — scroll-scrubbed before/after with glowing divider
// ───────────────────────────────────────────────────────────────────────────

function TransformationReveal() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Dark overlay covers the AFTER (right) side initially. Reveal completes
  // by 55% scroll progress so the user sees the full transformation early
  // and the section then holds the result through the rest of the pin.
  const overlayWidthPct = useTransform(scrollYProgress, [0.12, 0.55], [50, 0]);
  const overlayWidth = useMotionTemplate`${overlayWidthPct}%`;
  // Divider sits at the right edge of the visible portion.
  const dividerRight = useMotionTemplate`${overlayWidthPct}%`;

  const afterLabelOpacity = useTransform(scrollYProgress, [0.3, 0.5], [0, 1]);
  const beforeLabelOpacity = useTransform(scrollYProgress, [0.05, 0.15, 0.55, 0.85], [0, 1, 1, 0.3]);
  const contentY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const headerOpacity = useTransform(scrollYProgress, [0.02, 0.12, 0.88, 0.98], [0, 1, 1, 0]);

  return (
    <section ref={ref} className="relative hidden h-[220vh] md:block">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-background">
        {/* Ambient glow behind image */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[920px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-50 blur-[140px]"
          style={{
            background:
              'radial-gradient(closest-side, oklch(0.68 0.20 245 / 0.18), transparent 70%)',
          }}
        />

        <motion.div
          style={{ y: contentY }}
          className="relative z-10 mx-auto w-full max-w-6xl px-5 md:px-8"
        >
          {/* Header */}
          <motion.div style={{ opacity: headerOpacity }} className="mb-7 text-center">
            <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.32em] text-primary">
              12 weeks · Real change
            </p>
            <h2 className="font-display text-3xl uppercase tracking-tight md:text-5xl lg:text-6xl">
              Same body. Different signal.
            </h2>
          </motion.div>

          {/* Image area */}
          <div className="relative mx-auto aspect-[3/2] max-h-[64vh] w-full overflow-hidden rounded-2xl border border-border shadow-[0_30px_120px_-30px] shadow-primary/40">
            {/* Full combined before/after image */}
            <Image
              src="/images/transformations/max-12week-pair.png"
              alt="12-week physique transformation: before on the left, after on the right"
              fill
              sizes="(min-width: 1024px) 80vw, (min-width: 768px) 90vw, 100vw"
              className="object-cover object-center"
            />

            {/* Dark overlay covering the AFTER (right) side — retracts on scroll */}
            <motion.div
              style={{ width: overlayWidth }}
              className="absolute right-0 top-0 z-10 h-full bg-gradient-to-l from-zinc-950 from-40% via-zinc-950/98 to-zinc-950/90"
            />

            {/* Glowing emerald divider at the overlay's left edge */}
            <motion.div
              style={{ right: dividerRight }}
              className="absolute inset-y-0 z-20 w-px"
            >
              <div className="absolute inset-y-0 left-1/2 w-[2px] -translate-x-1/2 bg-primary shadow-[0_0_24px_4px] shadow-primary/60" />
              <div className="absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_32px] shadow-primary/70">
                <ChevronRight className="h-5 w-5" />
              </div>
            </motion.div>

            {/* Labels */}
            <motion.div
              style={{ opacity: beforeLabelOpacity }}
              className="absolute left-4 top-4 z-30 rounded-full border border-border bg-background/80 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-sm"
            >
              Before
            </motion.div>
            <motion.div
              style={{ opacity: afterLabelOpacity }}
              className="absolute right-4 top-4 z-30 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary-foreground shadow-[0_0_24px_-4px] shadow-primary/60 backdrop-blur-sm"
            >
              After · 12 weeks
            </motion.div>
          </div>

          {/* Scroll hint */}
          <motion.p
            style={{ opacity: headerOpacity }}
            className="mt-6 text-center text-xs uppercase tracking-[0.22em] text-muted-foreground/70"
          >
            Keep scrolling to reveal
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}

// Mobile-only static version of the transformation reveal
function TransformationRevealMobile() {
  return (
    <section className="relative bg-background py-20 md:hidden">
      <div className="mx-auto max-w-md px-5">
        <div className="mb-7 text-center">
          <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.32em] text-primary">
            12 weeks · Real change
          </p>
          <h2 className="font-display text-3xl uppercase tracking-tight">
            Same body. Different signal.
          </h2>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-border shadow-[0_20px_60px_-20px] shadow-primary/40"
        >
          <Image
            src="/images/transformations/max-12week-pair.png"
            alt="12-week physique transformation: before and after"
            fill
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute left-3 top-3 rounded-full border border-border bg-background/80 px-2.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-muted-foreground backdrop-blur-sm">
            Before
          </div>
          <div className="absolute right-3 top-3 rounded-full bg-primary/90 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-primary-foreground shadow-[0_0_18px_-4px] shadow-primary/60 backdrop-blur-sm">
            After · 12 wks
          </div>
          {/* Subtle center divider hint */}
          <div className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-primary/40" />
        </motion.div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Framework — 5-node diagram with animated connecting line
// ───────────────────────────────────────────────────────────────────────────

const FRAMEWORK_NODES = [
  { icon: UtensilsCrossed, title: 'Food', desc: 'Macros built around your goal' },
  { icon: Dumbbell, title: 'Training', desc: 'Periodized to your level' },
  { icon: Activity, title: 'Cardio', desc: 'Prescribed, not guessed' },
  { icon: Moon, title: 'Recovery', desc: 'Tracked and respected' },
  { icon: ClipboardCheck, title: 'Check-ins', desc: 'Where the adjustments happen' },
];

function Framework() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-120px' });

  return (
    <section id="system" className="relative py-24 md:py-32">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader
          eyebrow="Powered by My Pocket Coach"
          title="Five pieces. One adaptive system."
          intro="No single lever moves the needle alone. The system adapts daily as you log — and weekly, I make the calls the automation shouldn't make alone."
        />

        {/* Desktop: horizontal nodes with animated SVG line */}
        <div ref={ref} className="relative mt-20 hidden md:block">
          {/* SVG connecting line (behind nodes) */}
          <svg
            aria-hidden
            className="pointer-events-none absolute left-0 right-0 top-7 z-0 w-full"
            viewBox="0 0 1000 4"
            preserveAspectRatio="none"
            style={{ height: '4px' }}
          >
            <defs>
              <linearGradient id="frameworkLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="oklch(0.68 0.20 245 / 0)" />
                <stop offset="10%" stopColor="oklch(0.68 0.20 245 / 0.7)" />
                <stop offset="90%" stopColor="oklch(0.68 0.20 245 / 0.7)" />
                <stop offset="100%" stopColor="oklch(0.68 0.20 245 / 0)" />
              </linearGradient>
            </defs>
            <motion.line
              x1="0"
              y1="2"
              x2="1000"
              y2="2"
              stroke="url(#frameworkLineGrad)"
              strokeWidth="2"
              strokeDasharray="1000"
              initial={{ strokeDashoffset: 1000 }}
              animate={inView ? { strokeDashoffset: 0 } : undefined}
              transition={{ duration: 1.6, delay: 0.6, ease: 'easeOut' }}
            />
          </svg>

          {/* Energy pulse traveling along the line */}
          {inView && (
            <motion.div
              aria-hidden
              className="pointer-events-none absolute top-7 z-0 h-1 w-12 -translate-y-1/2 rounded-full bg-primary shadow-[0_0_24px_4px] shadow-primary/70"
              initial={{ left: '0%', opacity: 0 }}
              animate={{
                left: ['0%', '100%'],
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 2.6,
                delay: 2.2,
                repeat: Infinity,
                repeatDelay: 1.8,
                ease: 'easeInOut',
                times: [0, 0.15, 0.85, 1],
              }}
            />
          )}

          {/* Nodes */}
          <motion.div
            variants={stagger(0.14)}
            initial="hidden"
            animate={inView ? 'visible' : undefined}
            className="relative grid grid-cols-5 gap-4"
          >
            {FRAMEWORK_NODES.map((node, i) => {
              const Icon = node.icon;
              return (
                <motion.div key={node.title} variants={fadeUp} className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-primary/40 bg-card shadow-[0_0_30px_-8px] shadow-primary/40">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold uppercase tracking-wider text-foreground">
                    {node.title}
                  </h3>
                  <p className="mx-auto mt-1.5 max-w-[14ch] text-xs leading-relaxed text-muted-foreground">
                    {node.desc}
                  </p>
                  {/* tiny step number */}
                  <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/40">
                    {String(i + 1).padStart(2, '0')}
                  </p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Mobile: vertical stack with left-side connecting line */}
        <div className="relative mt-12 space-y-3 md:hidden">
          <div className="absolute left-[22px] top-2 bottom-2 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent" />
          {FRAMEWORK_NODES.map((node, i) => {
            const Icon = node.icon;
            return (
              <motion.div
                key={node.title}
                initial={{ opacity: 0, x: -16 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.5, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="relative flex items-start gap-4 rounded-xl border border-border bg-card/40 p-4 pl-12"
              >
                <div className="absolute left-2 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-card text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                    {node.title}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">{node.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// CoachingDiptych — "What you live in / What I'm watching"
// ───────────────────────────────────────────────────────────────────────────

type ClientScreen = {
  label: string;
  src: string;
  accent: string;
  cropTopPct?: number;
};

const CLIENT_SCREENS: ClientScreen[] = [
  {
    label: 'Your daily home',
    src: '/images/app/client-home.png',
    accent: "Today's macros, weight, cardio.",
  },
  {
    label: 'Check-in submitted',
    src: '/images/app/client-checkin-complete.png',
    accent: '"CoachMax will review this check-in."',
  },
  {
    label: 'Coach adjustment + note',
    src: '/images/app/coach-note.png',
    accent: 'What I changed and why — in my own voice.',
    cropTopPct: 18,
  },
];

type CoachScreen = {
  label: string;
  src: string;
  accent: string;
};

const COACH_SCREENS: CoachScreen[] = [
  {
    label: 'Client overview',
    src: '/images/app/coach-overview.png',
    accent: 'Red flags, trend reads, status at a glance.',
  },
  {
    label: 'Biometrics deep dive',
    src: '/images/app/coach-biometrics.png',
    accent: '90-day weight, steps, Oura recovery.',
  },
];

function CoachingDiptych() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-card/20 py-24 md:py-32">
      {/* Ambient bg */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full opacity-40 blur-[140px]"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.68 0.20 245 / 0.20), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-1/2 h-[420px] w-[420px] -translate-y-1/2 rounded-full opacity-30 blur-[140px]"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.68 0.20 245 / 0.18), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeader
          eyebrow="Inside coaching with me"
          title="What you live in. What I'm watching."
          intro="You live in the app — clean, daily, on your phone. I work in the dashboard — wide, data-dense, on a desktop. Same numbers, two angles, both pointed at your physique."
        />

        <motion.div
          variants={stagger(0.15)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="mt-16 grid items-start gap-12 md:grid-cols-2 md:gap-10 lg:gap-16"
        >
          {/* Client side — phone mockups */}
          <motion.div variants={fadeUp}>
            <div className="mb-5 flex items-baseline justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
                What you live in
              </p>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                In-app · iOS / Android
              </span>
            </div>
            <div className="mx-auto grid max-w-[260px] grid-cols-1 gap-6 sm:max-w-none sm:grid-cols-3 sm:gap-3">
              {CLIENT_SCREENS.map((s, i) => (
                <motion.div
                  key={s.src}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="group"
                >
                  <PhoneMockup
                    src={s.src}
                    alt={s.label}
                    floatDelay={i * 0.8}
                    cropTopPct={s.cropTopPct}
                  />
                  <p className="mt-3 text-center text-xs font-medium uppercase tracking-wider text-foreground sm:text-[10px]">
                    {s.label}
                  </p>
                  <p className="mt-1 text-center text-xs leading-snug text-muted-foreground/80 sm:text-[10px]">
                    {s.accent}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Coach side — browser mockups */}
          <motion.div variants={fadeUp}>
            <div className="mb-5 flex items-baseline justify-between">
              <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-primary">
                What I&apos;m watching
              </p>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Coach dashboard · Desktop
              </span>
            </div>
            <div className="space-y-5">
              {COACH_SCREENS.map((s, i) => (
                <motion.div
                  key={s.src}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.55, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
                >
                  <BrowserMockup src={s.src} alt={s.label} floatDelay={1.2 + i * 0.9} />
                  <div className="mt-3 flex items-baseline justify-between gap-3">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-foreground">
                      {s.label}
                    </p>
                    <p className="text-[10px] leading-snug text-muted-foreground/70">
                      {s.accent}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

interface PhoneMockupProps {
  src?: string;
  alt?: string;
  label?: string;
  floatDelay?: number;
  cropTopPct?: number;
}

function PhoneMockup({ src, alt, label, floatDelay = 0, cropTopPct = 0 }: PhoneMockupProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      animate={{ y: [0, -6, 0] }}
      transition={{
        y: { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: floatDelay },
        scale: { type: 'spring', stiffness: 280, damping: 24 },
      }}
      className="relative rounded-[24px] border border-border/80 bg-zinc-950 p-1.5 shadow-[0_30px_60px_-20px] shadow-primary/30"
    >
      {/* notch */}
      <div className="absolute left-1/2 top-2 z-10 h-3 w-12 -translate-x-1/2 rounded-full bg-zinc-900" />
      {src ? (
        <div className="relative aspect-[9/19.5] overflow-hidden rounded-[18px] bg-zinc-950">
          {/* When cropTopPct > 0, scale up from bottom origin to push the
              top portion out of the visible area (used to crop AI labels
              from the coach-note screen). */}
          <div
            className="absolute inset-0 origin-bottom"
            style={cropTopPct ? { transform: `scale(${1 + cropTopPct / 100})` } : undefined}
          >
            <Image
              src={src}
              alt={alt ?? ''}
              fill
              sizes="(min-width: 1024px) 220px, (min-width: 768px) 28vw, 30vw"
              className="object-cover object-top"
            />
          </div>
        </div>
      ) : (
        <PhotoPlaceholder
          aspect="9/19.5"
          label={label}
          variant="subtle"
          className="rounded-[18px] border-0"
        />
      )}
    </motion.div>
  );
}

interface BrowserMockupProps {
  src?: string;
  alt?: string;
  label?: string;
  floatDelay?: number;
}

function BrowserMockup({ src, alt, label, floatDelay = 0 }: BrowserMockupProps) {
  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.01 }}
      animate={{ y: [0, -8, 0] }}
      transition={{
        y: { duration: 6, repeat: Infinity, ease: 'easeInOut', delay: floatDelay },
        scale: { type: 'spring', stiffness: 280, damping: 24 },
      }}
      className="overflow-hidden rounded-xl border border-border/80 bg-zinc-950 shadow-[0_30px_60px_-20px] shadow-primary/30"
    >
      {/* browser chrome */}
      <div className="flex items-center gap-1.5 border-b border-border/60 bg-zinc-900/80 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-500/60" />
        <span className="h-2 w-2 rounded-full bg-yellow-500/60" />
        <span className="h-2 w-2 rounded-full bg-green-500/60" />
        <div className="ml-3 flex-1 truncate rounded-md bg-zinc-950/60 px-2.5 py-0.5 text-[10px] text-muted-foreground/60">
          coach.mypocketcoach.app
        </div>
      </div>
      {src ? (
        <div className="relative aspect-[16/10] bg-zinc-950">
          <Image
            src={src}
            alt={alt ?? ''}
            fill
            sizes="(min-width: 1024px) 600px, (min-width: 768px) 45vw, 95vw"
            className="object-cover object-top"
          />
        </div>
      ) : (
        <PhotoPlaceholder
          aspect="16/10"
          label={label}
          variant="subtle"
          className="rounded-none border-0"
        />
      )}
    </motion.div>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// ProblemSection — "You've already tried it all"
// ───────────────────────────────────────────────────────────────────────────

const PROBLEMS = [
  { title: 'Cookie-cutter PDFs', body: 'The same 12-week plan as 50 other people.' },
  { title: 'Plans that never adapt', body: 'Same macros at week 1 and week 12. Body changes. Plan doesn’t.' },
  { title: 'Coaches who ghost', body: 'Pay $300/mo, hear from them once. Maybe.' },
  { title: 'Random motivation', body: 'Pep talks instead of plan pivots. Nothing changes.' },
  { title: 'Guess-work macros', body: 'A free calculator, a hope, and a prayer.' },
  { title: 'Zero accountability', body: 'Nobody checks if you actually did the work.' },
];

function ProblemSection() {
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* Subtle red ambient bg (the noise) */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-20 blur-[160px]"
        style={{
          background:
            'radial-gradient(closest-side, oklch(0.637 0.237 25.331 / 0.30), transparent 70%)',
        }}
      />

      <div className="relative mx-auto max-w-6xl px-5 md:px-8">
        <SectionHeader
          eyebrow="The noise"
          title="You've already tried it all."
          intro="None of it worked. Not because you didn't try — because the inputs were broken."
        />

        <motion.div
          variants={stagger(0.08)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
        >
          {PROBLEMS.map((p) => (
            <motion.div
              key={p.title}
              variants={{
                hidden: { opacity: 0, x: -16 },
                visible: {
                  opacity: 1,
                  x: 0,
                  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="group flex items-start gap-3.5 rounded-xl border border-border/60 bg-card/30 p-5 transition-all hover:border-destructive/40 hover:bg-card/50"
            >
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-destructive/15 text-destructive transition-transform group-hover:scale-110">
                <X className="h-4 w-4" strokeWidth={3} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold uppercase tracking-wider text-foreground">{p.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-14 max-w-2xl text-center text-base text-muted-foreground md:text-lg"
        >
          You don&apos;t need more motivation. You need a system that{' '}
          <span className="font-semibold text-primary">adapts</span> — and someone who&apos;s{' '}
          <span className="font-semibold text-primary">watching</span>.
        </motion.p>
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────────────
// MoatSection — "I built the system on myself first"
// ───────────────────────────────────────────────────────────────────────────

function MoatSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  // Glow scales with scroll into focus
  const glowOpacity = useTransform(scrollYProgress, [0.1, 0.4, 0.7, 0.95], [0, 0.55, 0.55, 0]);
  const glowScale = useTransform(scrollYProgress, [0.1, 0.5, 0.95], [0.8, 1.1, 1.25]);

  return (
    <section ref={ref} className="relative overflow-hidden py-32 md:py-40">
      {/* Ambient bg — scroll-reactive emerald-blue */}
      <motion.div
        aria-hidden
        style={{ opacity: glowOpacity, scale: glowScale }}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[920px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[160px]"
      >
        <div
          className="h-full w-full rounded-full"
          style={{
            background:
              'radial-gradient(closest-side, oklch(0.68 0.20 245 / 0.40), transparent 70%)',
          }}
        />
      </motion.div>

      <div className="relative mx-auto max-w-5xl px-5 text-center md:px-8">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-10 text-[11px] font-medium uppercase tracking-[0.32em] text-primary"
        >
          The moat
        </motion.p>

        <h2 className="font-display uppercase leading-[1.05] tracking-tight">
          <MoatLine
            text="I built the system"
            delay={0.1}
            className="block text-3xl text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
          />
          <MoatLine
            text="on myself first."
            delay={0.3}
            className="mt-1 block text-3xl text-foreground sm:text-4xl md:text-5xl lg:text-6xl"
          />
          <MoatLine
            text="Then I used it on clients."
            delay={0.6}
            className="mt-6 block text-2xl text-muted-foreground sm:text-3xl md:text-4xl lg:text-5xl"
          />
          <MoatLine
            text="Then it became"
            delay={0.9}
            className="mt-6 block text-2xl text-muted-foreground sm:text-3xl md:text-4xl lg:text-5xl"
          />
          <MoatLine
            text="My Pocket Coach."
            delay={1.05}
            className="block text-2xl text-muted-foreground sm:text-3xl md:text-4xl lg:text-5xl"
          />
          <MoatLine
            text="That's why this works."
            delay={1.4}
            className="mt-10 block text-5xl text-primary sm:text-6xl md:text-7xl lg:text-8xl"
          />
        </h2>

        <motion.div
          initial={{ width: 0, opacity: 0 }}
          whileInView={{ width: '40%', opacity: 1 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, delay: 1.7, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-12 h-px bg-gradient-to-r from-transparent via-primary to-transparent"
        />
      </div>
    </section>
  );
}

function MoatLine({
  text,
  delay,
  className,
}: {
  text: string;
  delay: number;
  className?: string;
}) {
  return (
    <span className="inline-block overflow-hidden align-bottom">
      <motion.span
        initial={{ y: '110%' }}
        whileInView={{ y: '0%' }}
        viewport={{ once: true, margin: '-120px' }}
        transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
        className={cn('inline-block', className)}
      >
        {text}
      </motion.span>
    </span>
  );
}
