'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, Sparkles, Target, Dumbbell, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const quizSteps = [
  {
    question: "What's your primary fitness goal?",
    key: 'goal',
    icon: Target,
    options: [
      { value: 'lose_fat', label: 'Lose Body Fat', description: 'Get leaner while preserving muscle' },
      { value: 'build_muscle', label: 'Build Muscle', description: 'Gain size and strength' },
      { value: 'recomp', label: 'Body Recomposition', description: 'Build muscle & lose fat simultaneously' },
      { value: 'general', label: 'General Health', description: 'Feel better and move better' },
    ],
  },
  {
    question: "What's your training experience?",
    key: 'experience',
    icon: Dumbbell,
    options: [
      { value: 'beginner', label: 'Beginner', description: 'New to structured training' },
      { value: 'intermediate', label: 'Intermediate', description: '1-3 years consistent training' },
      { value: 'advanced', label: 'Advanced', description: '3+ years of serious training' },
    ],
  },
  {
    question: "What's your biggest struggle?",
    key: 'biggest_struggle',
    icon: AlertCircle,
    options: [
      { value: 'nutrition', label: 'Nutrition', description: "I don't know what to eat" },
      { value: 'consistency', label: 'Consistency', description: "I can't stick to a plan" },
      { value: 'programming', label: 'Training Program', description: "I don't know what to do in the gym" },
      { value: 'accountability', label: 'Accountability', description: 'I need someone keeping me on track' },
    ],
  },
  {
    question: 'What timeline are you thinking?',
    key: 'timeline',
    icon: Clock,
    options: [
      { value: '4_weeks', label: '4 Weeks', description: 'Quick kickstart' },
      { value: '8_weeks', label: '8 Weeks', description: 'Meaningful changes' },
      { value: '12_weeks', label: '12 Weeks', description: 'Full transformation' },
      { value: 'ongoing', label: 'Ongoing', description: 'Long-term lifestyle' },
    ],
  },
];

export default function QuizPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [teaser, setTeaser] = useState<{
    estimated_calories: number;
    estimated_protein: number;
    recommendation: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleAnswer = async (value: string) => {
    const key = quizSteps[currentStep].key;
    const newAnswers = { ...answers, [key]: value };
    setAnswers(newAnswers);

    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Submit quiz
      try {
        const res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newAnswers),
        });
        const data = await res.json();
        if (data.teaser) {
          setTeaser(data.teaser);
        }
      } catch {
        // Show results even if API fails
      }
      setShowResults(true);
    }
  };

  const handleEmailSubmit = async () => {
    if (!email) return;
    setSubmitting(true);

    try {
      await fetch('/api/quiz', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, quiz_answers: answers }),
      });
      setShowEmailCapture(false);
      toast.success('Check your inbox for your free macro breakdown!');
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full text-center"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-emerald-600" />
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-4">Your Quick Assessment</h1>

          {teaser && (
            <div className="bg-zinc-50 rounded-xl p-6 text-left mb-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{teaser.estimated_calories}</p>
                  <p className="text-xs text-zinc-500">Est. Daily Calories</p>
                </div>
                <div className="bg-white rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-emerald-600">{teaser.estimated_protein}g</p>
                  <p className="text-xs text-zinc-500">Est. Daily Protein</p>
                </div>
              </div>
              <p className="text-sm text-zinc-600">{teaser.recommendation}</p>
            </div>
          )}

          <p className="text-zinc-500 text-sm mb-6">
            This is a rough estimate. For precise targets based on your body composition,
            activity level, and goals, get your full custom plan.
          </p>

          {!showEmailCapture ? (
            <div className="space-y-3">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
                onClick={() => setShowEmailCapture(true)}
              >
                Get Detailed Breakdown (Free) <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" className="w-full" size="lg" asChild>
                <a href="/pricing">Get Full Custom Plan →</a>
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="text-center"
              />
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                onClick={handleEmailSubmit}
                disabled={submitting || !email}
              >
                {submitting ? 'Sending...' : 'Send My Free Breakdown'}
              </Button>
              <p className="text-xs text-zinc-400">No spam. Unsubscribe anytime.</p>
            </motion.div>
          )}

          <a href="/" className="text-sm text-zinc-400 hover:text-zinc-600 mt-6 inline-block">
            ← Back to homepage
          </a>
        </motion.div>
      </div>
    );
  }

  const step = quizSteps[currentStep];
  const StepIcon = step.icon;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">
            Max<span className="text-emerald-600">Health</span>
          </a>
          <Badge variant="secondary">Free Assessment</Badge>
        </div>
      </header>

      {/* Progress */}
      <div className="max-w-2xl mx-auto w-full px-4 pt-6">
        <div className="flex gap-1">
          {quizSteps.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentStep ? 'bg-emerald-500' : 'bg-zinc-100'
              }`}
            />
          ))}
        </div>
        <p className="text-xs text-zinc-400 mt-2">
          Question {currentStep + 1} of {quizSteps.length}
        </p>
      </div>

      {/* Question */}
      <div className="flex-1 flex items-center justify-center px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="max-w-lg w-full"
          >
            <div className="text-center mb-8">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <StepIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">{step.question}</h2>
            </div>

            <div className="space-y-3">
              {step.options.map((option) => (
                <Card
                  key={option.value}
                  className="cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-all p-4"
                  onClick={() => handleAnswer(option.value)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{option.label}</p>
                      <p className="text-sm text-zinc-500">{option.description}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-zinc-300" />
                  </div>
                </Card>
              ))}
            </div>

            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="flex items-center gap-1 text-sm text-zinc-400 hover:text-zinc-600 mt-6 mx-auto"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
