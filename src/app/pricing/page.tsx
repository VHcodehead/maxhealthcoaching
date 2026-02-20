'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Star, ArrowRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSession } from 'next-auth/react';

const plans = [
  {
    key: 'basic',
    name: 'Basic',
    price: 49,
    period: 'month',
    description: 'Everything you need to get started on your fitness journey.',
    features: [
      'Personalized macro & calorie targets',
      'AI-generated 7-day meal plan',
      'Custom training program',
      'Weekly check-in tracking',
      'Progress photo storage',
      'Email support',
    ],
    cta: 'Start Basic',
  },
  {
    key: 'pro',
    name: 'Pro',
    price: 99,
    period: 'month',
    popular: true,
    description: 'The most popular choice for serious results.',
    features: [
      'Everything in Basic, plus:',
      'Bi-weekly plan adjustments',
      'Priority coach review',
      'Meal swap alternatives',
      'Advanced progress analytics',
      'Weekly grocery lists',
      'Priority email support',
    ],
    cta: 'Start Pro',
  },
  {
    key: 'elite',
    name: 'Elite',
    price: 199,
    period: 'month',
    description: 'White-glove coaching for maximum results.',
    features: [
      'Everything in Pro, plus:',
      'Weekly 1-on-1 coach check-in',
      'Unlimited plan regenerations',
      'Direct messaging with coach',
      'Custom supplement guidance',
      'Priority support',
      'Exclusive community access',
    ],
    cta: 'Start Elite',
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const handleCheckout = async (planKey: string) => {
    setLoading(planKey);

    try {
      if (!session?.user) {
        router.push(`/signup?redirect=/pricing&plan=${planKey}`);
        return;
      }

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planKey }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">
            Max<span className="text-emerald-600">Health</span>
          </a>
          <a href="/login" className="text-sm text-zinc-500 hover:text-zinc-900">
            Already a member? Sign in
          </a>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Simple Pricing</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Invest in Your Transformation
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Choose the plan that fits your goals. All plans include AI-powered meal and training plans,
            personalized to your body and preferences. Cancel anytime.
          </p>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`relative flex flex-col ${
                plan.popular
                  ? 'border-emerald-500 border-2 shadow-xl shadow-emerald-500/10 scale-105'
                  : 'border-zinc-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">
                    <Star className="w-3 h-3 mr-1" /> Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-medium">{plan.name}</CardTitle>
                <p className="text-sm text-zinc-500">{plan.description}</p>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-zinc-500">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                      <span className="text-sm text-zinc-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full mt-6 ${
                    plan.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : ''
                  }`}
                  size="lg"
                  onClick={() => handleCheckout(plan.key)}
                  disabled={loading !== null}
                >
                  {loading === plan.key ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {plan.cta} <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trust Signals */}
        <div className="mt-16 text-center space-y-4">
          <div className="flex items-center justify-center gap-6 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Shield className="w-4 h-4" /> Secure payment via Stripe
            </span>
            <span>Cancel anytime</span>
            <span>30-day money-back guarantee</span>
          </div>
        </div>

        {/* FAQ Teaser */}
        <div className="mt-20 text-center">
          <h3 className="text-xl font-semibold mb-2">Have questions?</h3>
          <p className="text-zinc-500">
            Check our{' '}
            <a href="/#faq" className="text-emerald-600 underline">
              FAQ section
            </a>{' '}
            or email us at{' '}
            <a href="mailto:max@integrativeaisolutions.com" className="text-emerald-600 underline">
              max@integrativeaisolutions.com
            </a>
          </p>
        </div>
      </div>

      {/* Disclaimer */}
      <footer className="border-t py-8 mt-16">
        <div className="max-w-4xl mx-auto px-4 text-center text-xs text-zinc-400">
          <p>
            MaxHealth Coaching provides fitness and nutrition guidance based on the information you provide.
            This is not medical advice. Consult your physician before starting any new diet or exercise program.
            Results vary based on individual effort, adherence, and starting point.
          </p>
        </div>
      </footer>
    </div>
  );
}
