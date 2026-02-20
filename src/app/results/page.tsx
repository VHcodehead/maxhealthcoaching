'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Users, Target, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ResultsPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">
            Max<span className="text-emerald-600">Health</span>
          </a>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700" size="sm">
            <a href="/pricing">Get Started</a>
          </Button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Proven Results</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Hundreds of Clients Transformed
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            From fat loss to muscle gain, our science-backed coaching system delivers real results
            through personalized nutrition and training — not cookie-cutter templates.
          </p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            { icon: Users, stat: '500+', label: 'Clients Coached', desc: 'Men and women of all experience levels' },
            { icon: Target, stat: '10k+', label: 'Custom Plans Delivered', desc: 'Meal plans, training programs, and macro targets' },
            { icon: TrendingUp, stat: '95%', label: 'Client Satisfaction', desc: 'Clients who hit their goals and stay consistent' },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="p-8 text-center">
                    <Icon className="w-8 h-8 text-emerald-600 mx-auto mb-4" />
                    <p className="text-4xl font-bold text-emerald-600 mb-1">{item.stat}</p>
                    <p className="font-semibold mb-1">{item.label}</p>
                    <p className="text-sm text-zinc-500">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* What clients achieve */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-center mb-8">What Our Clients Achieve</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: 'Fat Loss', desc: 'Sustainable calorie deficits with high-protein meal plans that keep you full. No crash diets, no extreme restrictions — just consistent, trackable progress.' },
              { title: 'Muscle Gain', desc: 'Structured surplus nutrition paired with periodized training programs. Progressive overload, proper recovery, and the right calories to build lean mass.' },
              { title: 'Body Recomposition', desc: 'For clients who want to lose fat and build muscle simultaneously. Precision macros and strategic training to reshape your physique.' },
              { title: 'Lifestyle Transformation', desc: 'Better sleep, more energy, sustainable habits. Our coaching goes beyond the gym — we build systems that fit your real life.' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-zinc-500">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-center text-xs text-zinc-400 max-w-2xl mx-auto">
          <p>
            Results vary. Individual outcomes depend on adherence to the program, starting point,
            genetics, and other factors. These results are not guaranteed. Always consult a physician
            before starting any new diet or exercise program.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Start Your Transformation?</h2>
          <p className="text-zinc-500 mb-6">Join hundreds of clients who have transformed their bodies with personalized coaching.</p>
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <a href="/pricing">Get Started <ArrowRight className="w-4 h-4 ml-2" /></a>
          </Button>
        </div>
      </div>
    </div>
  );
}
