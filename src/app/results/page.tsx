'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface TransformationData {
  id: string;
  client_name: string;
  before_photo?: string;
  after_photo?: string;
  weight_lost: string;
  duration: string;
  quote: string;
}

// Placeholder transformations for demo
const placeholderTransformations: TransformationData[] = [
  {
    id: '1',
    client_name: 'Alex M.',
    weight_lost: 'Lost 25 lbs',
    duration: '12 weeks',
    quote: 'The meal plan made it so easy to stay on track. I never felt like I was dieting.',
  },
  {
    id: '2',
    client_name: 'Sarah K.',
    weight_lost: 'Lost 18 lbs',
    duration: '8 weeks',
    quote: 'The training program was perfect for my home gym setup. I saw results within the first month.',
  },
  {
    id: '3',
    client_name: 'James R.',
    weight_lost: 'Gained 12 lbs muscle',
    duration: '12 weeks',
    quote: 'As a hard gainer, finally having a structured plan with the right calories made all the difference.',
  },
  {
    id: '4',
    client_name: 'Maria L.',
    weight_lost: 'Lost 30 lbs',
    duration: '16 weeks',
    quote: 'The weekly check-ins and photo tracking kept me accountable. Best investment in myself.',
  },
];

export default function ResultsPage() {
  const [transformations, setTransformations] = useState<TransformationData[]>(placeholderTransformations);

  useEffect(() => {
    // Try to fetch real transformations
    fetch('/api/admin/clients')
      .then(() => {
        // If we had a public transformations endpoint we'd use it here
      })
      .catch(() => {
        // Use placeholders
      });
  }, []);

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
          <Badge variant="secondary" className="mb-4">Success Stories</Badge>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Real People. Real Results.
          </h1>
          <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
            Every transformation starts with a decision. Here are some of the incredible results
            our clients have achieved with MaxHealth Coaching.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {transformations.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden">
                {/* Before/After Photos */}
                <div className="grid grid-cols-2">
                  <div className="aspect-[3/4] bg-zinc-100 flex items-center justify-center relative">
                    {t.before_photo ? (
                      <img src={t.before_photo} alt="Before" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-zinc-400">
                        <p className="text-sm font-medium">Before</p>
                        <p className="text-xs">Photo placeholder</p>
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-zinc-900/70 text-white text-xs">Before</Badge>
                  </div>
                  <div className="aspect-[3/4] bg-emerald-50 flex items-center justify-center relative">
                    {t.after_photo ? (
                      <img src={t.after_photo} alt="After" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center text-emerald-600">
                        <p className="text-sm font-medium">After</p>
                        <p className="text-xs">Photo placeholder</p>
                      </div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-emerald-600 text-white text-xs">After</Badge>
                  </div>
                </div>

                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-semibold text-sm">
                      {t.client_name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold">{t.client_name}</p>
                      <p className="text-sm text-emerald-600 font-medium">{t.weight_lost} in {t.duration}</p>
                    </div>
                  </div>

                  <div className="flex gap-2 items-start">
                    <Quote className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                    <p className="text-sm text-zinc-600 italic">{t.quote}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-12 text-center text-xs text-zinc-400 max-w-2xl mx-auto">
          <p>
            Results vary. Individual outcomes depend on adherence to the program, starting point,
            genetics, and other factors. These results are not guaranteed. Always consult a physician
            before starting any new diet or exercise program.
          </p>
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Write Your Success Story?</h2>
          <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
            <a href="/pricing">Start Your Transformation <ArrowRight className="w-4 h-4 ml-2" /></a>
          </Button>
        </div>
      </div>
    </div>
  );
}
