'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import {
  Calculator, UtensilsCrossed, Dumbbell, TrendingUp, Camera, UserCheck,
  ArrowRight, Check, X, ChevronDown, Star, Menu, X as XIcon, Shield, Zap, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function AnimatedSection({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [exitPopup, setExitPopup] = useState(false);
  const [exitEmail, setExitEmail] = useState('');
  const [exitSubmitted, setExitSubmitted] = useState(false);
  const [footerEmail, setFooterEmail] = useState('');
  const [footerSubmitted, setFooterSubmitted] = useState(false);
  const footerRef = useRef<HTMLElement>(null);
  const [footerInView, setFooterInView] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      if (footerRef.current) {
        const rect = footerRef.current.getBoundingClientRect();
        setFooterInView(rect.top < window.innerHeight);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const shown = sessionStorage.getItem('exit_popup_shown');
    if (shown) return;
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10) {
        setExitPopup(true);
        sessionStorage.setItem('exit_popup_shown', '1');
      }
    };
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, []);

  const submitLead = async (email: string, source: string) => {
    await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, source }),
    }).catch(() => {});
  };

  const features = [
    { icon: Calculator, title: 'Custom Macro Targets', desc: 'Science-based calorie and macro calculations using your body composition, activity, and goals.' },
    { icon: UtensilsCrossed, title: 'Custom Meal Plans', desc: '7-day meal plans with recipes, grocery lists, and swap options — tailored to your diet and preferences.' },
    { icon: Dumbbell, title: 'Training Programs', desc: 'Periodized workout plans matched to your experience, equipment, injuries, and schedule.' },
    { icon: TrendingUp, title: 'Progress Tracking', desc: 'Track weight, measurements, adherence, and see your trends over time with visual analytics.' },
    { icon: Camera, title: 'Photo Comparisons', desc: 'Secure progress photo storage with side-by-side comparisons to see your transformation.' },
    { icon: UserCheck, title: 'Coach Oversight', desc: 'Your coach reviews every check-in, adjusts your plan, and keeps you accountable.' },
  ];

  const steps = [
    { num: '01', title: 'Choose Your Plan', desc: 'Pick the coaching tier that fits your goals and budget.' },
    { num: '02', title: 'Complete Your Profile', desc: '5-minute onboarding quiz about your body, goals, diet, training, and lifestyle.' },
    { num: '03', title: 'Get Your Custom Plans', desc: 'Receive personalized macro targets, a custom meal plan, and training program built for you.' },
    { num: '04', title: 'Weekly Check-ins', desc: 'Track progress, upload photos, and get plan adjustments based on your results.' },
  ];

  const faqs = [
    { q: "What's included in my plan?", a: "Every plan includes personalized macro targets calculated from your body composition, a custom 7-day meal plan with recipes and grocery lists, a training program matched to your experience and equipment, and weekly check-in tracking. Higher tiers add coach review, plan adjustments, and direct messaging." },
    { q: "How does the meal plan work?", a: "After you complete onboarding, your coach builds a plan around your macro targets, dietary restrictions, allergies, cooking skill, budget, and preferences. You get a complete 7-day meal plan with full recipes, ingredient amounts, and macro breakdowns. Every meal also comes with 2 swap alternatives." },
    { q: "Can I cancel anytime?", a: "Yes, absolutely. There are no contracts or commitments. You can cancel your subscription at any time through your billing portal, and you'll retain access until the end of your current billing period." },
    { q: "What if I have dietary restrictions?", a: "We support a wide range of dietary preferences including standard, keto, vegan, vegetarian, paleo, gluten-free, dairy-free, halal, and kosher. You can also specify individual food allergies and disliked foods during onboarding." },
    { q: "How are training plans customized?", a: "Your training plan is built based on your experience level, available equipment, injury history, preferred split, session duration, workout frequency, and goals. Beginners get simple progressions with technique focus, while advanced lifters get periodized programs with intensity techniques." },
    { q: "Is this medical advice?", a: "No. MaxHealth Coaching provides fitness and nutrition guidance based on established exercise science principles. This is not medical advice. We always recommend consulting your physician before starting any new diet or exercise program, especially if you have existing health conditions." },
    { q: "How do weekly check-ins work?", a: "Each week, you submit your current weight, waist measurement (optional), plan adherence rating, average steps and sleep, notes, and progress photos (front, side, back). Your coach reviews this data and makes adjustments to your plan as needed." },
    { q: "What equipment do I need?", a: "That depends on you! During onboarding, you tell us whether you train at home or gym, and what equipment you have available. We build your program around what you actually have access to — even bodyweight-only works." },
  ];

  const plans = [
    { name: 'Basic', price: 149, features: ['Macro targets', 'Custom meal plan', 'Training program', 'Check-in tracking', 'Photo storage'] },
    { name: 'Pro', price: 299, popular: true, features: ['Everything in Basic', 'Bi-weekly adjustments', 'Priority coach review', 'Meal swaps', 'Analytics', 'Grocery lists'] },
    { name: 'Elite', price: 499, features: ['Everything in Pro', 'Weekly 1-on-1', 'Unlimited regenerations', 'Direct messaging', 'Supplement guidance'] },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sticky Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 backdrop-blur-lg border-b shadow-sm' : 'bg-transparent'}`}>
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-xl font-bold tracking-tight">Max<span className="text-emerald-600">Health</span></span>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#features" className="text-zinc-600 hover:text-zinc-900 transition-colors">What You Get</a>
            <a href="#how" className="text-zinc-600 hover:text-zinc-900 transition-colors">How It Works</a>
            <a href="#results" className="text-zinc-600 hover:text-zinc-900 transition-colors">Results</a>
            <a href="#pricing" className="text-zinc-600 hover:text-zinc-900 transition-colors">Pricing</a>
            <a href="#faq" className="text-zinc-600 hover:text-zinc-900 transition-colors">FAQ</a>
          </nav>
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild><Link href="/quiz">Free Assessment</Link></Button>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" asChild><Link href="/pricing">Get Started</Link></Button>
          </div>
          <button className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <XIcon className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {mobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="md:hidden bg-white border-b px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm" onClick={() => setMobileMenuOpen(false)}>What You Get</a>
            <a href="#how" className="block text-sm" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#results" className="block text-sm" onClick={() => setMobileMenuOpen(false)}>Results</a>
            <a href="#pricing" className="block text-sm" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#faq" className="block text-sm" onClick={() => setMobileMenuOpen(false)}>FAQ</a>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" className="flex-1" asChild><Link href="/quiz">Free Assessment</Link></Button>
              <Button size="sm" className="flex-1 bg-emerald-600 hover:bg-emerald-700" asChild><Link href="/pricing">Get Started</Link></Button>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-50 via-white to-emerald-50/30" />
        <div className="relative max-w-5xl mx-auto px-4 text-center py-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <Badge variant="secondary" className="mb-6 text-xs">Expert Personal Training & Nutrition</Badge>
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-6">
              Transform Your Body<br />
              <span className="text-emerald-600">With Science-Backed Coaching</span>
            </h1>
            <p className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-8 leading-relaxed">
              Personalized meal plans, custom training programs, and weekly accountability — all tailored to your body, goals, and lifestyle.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-base px-8" asChild>
                <Link href="/pricing">Start Your Transformation <ArrowRight className="w-4 h-4 ml-2" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base" asChild>
                <Link href="/quiz">Take Free Assessment</Link>
              </Button>
            </div>
            <p className="text-sm text-zinc-400">
              500+ clients transformed &bull; Personalized plans &bull; Cancel anytime
            </p>
          </motion.div>
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <ChevronDown className="w-5 h-5 text-zinc-300" />
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-8 border-y bg-zinc-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <p className="text-center text-xs text-zinc-400 uppercase tracking-widest mb-4">As Featured In</p>
          <div className="flex justify-center items-center gap-8 md:gap-12 flex-wrap">
            {["Men's Health", 'Shape', 'Muscle & Fitness', 'Healthline', 'GQ'].map((name) => (
              <div key={name} className="h-8 px-4 bg-zinc-200/50 rounded flex items-center justify-center">
                <span className="text-xs font-medium text-zinc-400">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-28">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Everything You Need</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">What You Get</h2>
            <p className="text-zinc-500 max-w-xl mx-auto">A complete system designed to eliminate guesswork and deliver results.</p>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <AnimatedSection key={i}>
                  <Card className="h-full hover:shadow-lg hover:border-emerald-200 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-emerald-500 transition-colors">
                        <Icon className="w-5 h-5 text-emerald-600 group-hover:text-white transition-colors" />
                      </div>
                      <h3 className="font-semibold mb-2">{f.title}</h3>
                      <p className="text-sm text-zinc-500 leading-relaxed">{f.desc}</p>
                    </CardContent>
                  </Card>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 md:py-28 bg-zinc-50">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatedSection className="text-center mb-16">
            <Badge variant="secondary" className="mb-4">Simple Process</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">How It Works</h2>
            <p className="text-zinc-500">From signup to results in 4 simple steps.</p>
          </AnimatedSection>
          <div className="space-y-8">
            {steps.map((step, i) => (
              <AnimatedSection key={i}>
                <div className="flex gap-6 items-start">
                  <div className="w-12 h-12 bg-emerald-600 text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">{step.num}</div>
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold mb-1">{step.title}</h3>
                    <p className="text-zinc-500">{step.desc}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* DIY vs Coached */}
      <section className="py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Why Coaching Wins</h2>
            <p className="text-zinc-500">Stop guessing. Start progressing.</p>
          </AnimatedSection>
          <AnimatedSection>
            <div className="grid grid-cols-3 gap-0 border rounded-xl overflow-hidden">
              <div className="p-4 bg-zinc-50 font-medium text-sm">&nbsp;</div>
              <div className="p-4 bg-zinc-100 text-center font-medium text-sm">Going It Alone</div>
              <div className="p-4 bg-emerald-600 text-white text-center font-medium text-sm">MaxHealth</div>
              {['Personalized nutrition', 'Progressive training', 'Weekly accountability', 'Expert adjustments', 'Progress tracking', 'Meal plans & recipes'].map((item, i) => (
                <div key={i} className="contents">
                  <div className="p-4 text-sm border-t">{item}</div>
                  <div className="p-4 text-center border-t"><X className="w-4 h-4 text-zinc-300 mx-auto" /></div>
                  <div className="p-4 text-center border-t bg-emerald-50"><Check className="w-4 h-4 text-emerald-600 mx-auto" /></div>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Results */}
      <section id="results" className="py-20 md:py-28 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Transformations</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Real People. Real Results.</h2>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Alex M.', stat: 'Lost 25 lbs in 12 weeks', quote: 'The meal plan made it so easy. I never felt like I was dieting.' },
              { name: 'Sarah K.', stat: 'Lost 18 lbs in 8 weeks', quote: 'Perfect for my home gym setup. Results within the first month.' },
              { name: 'James R.', stat: 'Gained 12 lbs muscle in 12 weeks', quote: 'Finally having the right calories made all the difference.' },
            ].map((t, i) => (
              <AnimatedSection key={i}>
                <Card>
                  <div className="grid grid-cols-2">
                    <div className="aspect-[3/4] bg-zinc-100 flex items-center justify-center text-xs text-zinc-400">Before</div>
                    <div className="aspect-[3/4] bg-emerald-50 flex items-center justify-center text-xs text-emerald-600">After</div>
                  </div>
                  <CardContent className="p-5">
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-emerald-600 font-medium mb-2">{t.stat}</p>
                    <p className="text-sm text-zinc-500 italic">&ldquo;{t.quote}&rdquo;</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
          <p className="text-center text-xs text-zinc-400 mt-6">Results vary. Individual outcomes depend on adherence and starting point.</p>
          <div className="text-center mt-6">
            <Button variant="outline" asChild><Link href="/results">See All Transformations <ArrowRight className="w-3 h-3 ml-1" /></Link></Button>
          </div>
        </div>
      </section>

      {/* Free Tools */}
      <section className="py-20 md:py-28">
        <div className="max-w-5xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Free Tools</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Free Fitness Calculators</h2>
            <p className="text-zinc-500">Get a taste of what our full system can do.</p>
          </AnimatedSection>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Calculator, name: 'TDEE Calculator', desc: 'Find your daily calorie needs' },
              { icon: UtensilsCrossed, name: 'Macro Calculator', desc: 'Get your ideal protein, carbs & fat' },
              { icon: Dumbbell, name: '1RM Calculator', desc: 'Estimate your one-rep max' },
            ].map((tool, i) => {
              const Icon = tool.icon;
              return (
                <AnimatedSection key={i}>
                  <Link href="/tools">
                    <Card className="hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer">
                      <CardContent className="p-6 text-center">
                        <Icon className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                        <h3 className="font-semibold mb-1">{tool.name}</h3>
                        <p className="text-xs text-zinc-500">{tool.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 md:py-28 bg-zinc-50">
        <div className="max-w-6xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">Pricing</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
            <p className="text-zinc-500">No hidden fees. No contracts. Cancel anytime.</p>
          </AnimatedSection>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan, i) => (
              <AnimatedSection key={i}>
                <Card className={`relative h-full flex flex-col ${plan.popular ? 'border-emerald-500 border-2 shadow-xl scale-[1.02]' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-emerald-500 text-white hover:bg-emerald-500"><Star className="w-3 h-3 mr-1" /> Most Popular</Badge>
                    </div>
                  )}
                  <CardContent className="p-6 flex flex-col flex-1">
                    <h3 className="font-semibold text-lg">{plan.name}</h3>
                    <div className="mt-2 mb-4"><span className="text-4xl font-bold">${plan.price}</span><span className="text-zinc-500">/mo</span></div>
                    <ul className="space-y-2 flex-1 mb-6">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-sm"><Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" /><span className="text-zinc-600">{f}</span></li>
                      ))}
                    </ul>
                    <Button className={plan.popular ? 'bg-emerald-600 hover:bg-emerald-700 w-full' : 'w-full'} variant={plan.popular ? 'default' : 'outline'} asChild>
                      <Link href="/pricing">Get Started <ArrowRight className="w-3 h-3 ml-1" /></Link>
                    </Button>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-8 text-xs text-zinc-400">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> Secure payments</span>
            <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Instant access</span>
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Cancel anytime</span>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4">
          <AnimatedSection className="text-center mb-12">
            <Badge variant="secondary" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
          </AnimatedSection>
          <AnimatedSection>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((faq, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-left text-sm font-medium hover:no-underline">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-zinc-500 leading-relaxed">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </AnimatedSection>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 md:py-28 bg-zinc-900 text-white">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <AnimatedSection>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Ready to Transform?</h2>
            <p className="text-zinc-400 mb-8 max-w-lg mx-auto">Join hundreds of clients who stopped guessing and started seeing real results.</p>
            <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-base px-8" asChild>
              <Link href="/pricing">Start Your Transformation <ArrowRight className="w-4 h-4 ml-2" /></Link>
            </Button>
          </AnimatedSection>
        </div>
      </section>

      {/* Footer */}
      <footer ref={footerRef} className="border-t py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <span className="text-lg font-bold tracking-tight">Max<span className="text-emerald-600">Health</span> Coaching</span>
              <p className="text-sm text-zinc-500 mt-2 max-w-sm">Expert personal training and nutrition coaching. Science-backed programs tailored to your goals.</p>
              <div className="mt-4">
                {footerSubmitted ? (
                  <p className="text-sm text-emerald-600">Subscribed!</p>
                ) : (
                  <div className="flex gap-2 max-w-xs">
                    <Input type="email" placeholder="Get fitness tips" value={footerEmail} onChange={(e) => setFooterEmail(e.target.value)} className="text-sm" />
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 shrink-0" onClick={() => { if (footerEmail) { submitLead(footerEmail, 'footer'); setFooterSubmitted(true); } }}>Subscribe</Button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Product</h4>
              <div className="space-y-2 text-sm text-zinc-500">
                <a href="/pricing" className="block hover:text-zinc-900">Pricing</a>
                <a href="/tools" className="block hover:text-zinc-900">Free Tools</a>
                <a href="/quiz" className="block hover:text-zinc-900">Free Assessment</a>
                <a href="/results" className="block hover:text-zinc-900">Results</a>
                <a href="/blog" className="block hover:text-zinc-900">Blog</a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">Support</h4>
              <div className="space-y-2 text-sm text-zinc-500">
                <a href="#faq" className="block hover:text-zinc-900">FAQ</a>
                <a href="mailto:max@integrativeaisolutions.com" className="block hover:text-zinc-900">Contact</a>
                <a href="/login" className="block hover:text-zinc-900">Sign In</a>
              </div>
            </div>
          </div>
          <div className="border-t pt-6 text-xs text-zinc-400 text-center space-y-2">
            <p>MaxHealth Coaching provides fitness and nutrition guidance. This is not medical advice. Consult your physician before starting any new diet or exercise program.</p>
            <p>&copy; 2024&ndash;{new Date().getFullYear()} MaxHealth Coaching. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Bottom Bar */}
      <div className={`fixed bottom-0 left-0 right-0 md:hidden bg-white border-t p-3 transition-transform z-40 ${footerInView ? 'translate-y-full' : 'translate-y-0'}`}>
        <Button className="w-full bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href="/pricing">Get Started &mdash; From $49/mo</Link>
        </Button>
      </div>

      {/* Exit Intent Popup */}
      <Dialog open={exitPopup} onOpenChange={setExitPopup}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Wait! Get Your Free Macro Estimate</DialogTitle>
          </DialogHeader>
          {exitSubmitted ? (
            <div className="text-center py-4">
              <Check className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <p className="font-medium">Check your inbox!</p>
              <p className="text-sm text-zinc-500">We&apos;ll send your free macro breakdown shortly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-zinc-500">Enter your email and we&apos;ll send you a free personalized macro estimate based on your goals.</p>
              <Input type="email" placeholder="your@email.com" value={exitEmail} onChange={(e) => setExitEmail(e.target.value)} />
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={() => { if (exitEmail) { submitLead(exitEmail, 'exit_intent'); setExitSubmitted(true); } }}>Send My Free Estimate</Button>
              <p className="text-xs text-zinc-400 text-center">No spam. Unsubscribe anytime.</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
