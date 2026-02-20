'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, ArrowLeft, Scissors, TrendingUp, RefreshCw,
  Dumbbell, Home, User, AlertTriangle, Clock, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

const TOTAL_STEPS = 9;

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 200 : -200, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -200 : 200, opacity: 0 }),
};

type FormData = {
  age: number; sex: 'male' | 'female'; height_cm: number; weight_kg: number;
  goal: string; goal_weight_kg: number;
  activity_level: string;
  body_fat_percentage: number | undefined; body_fat_unsure: boolean;
  diet_type: string; disliked_foods: string[]; allergies: string[];
  meals_per_day: number; meal_timing_window: string;
  cooking_skill: string; budget: string; restaurant_frequency: string;
  injuries: string[]; injury_notes: string;
  workout_frequency: number; workout_location: string; experience_level: string;
  home_equipment: string[]; split_preference: string; time_per_session: number;
  cardio_preference: string;
  average_steps: number; sleep_hours: number; stress_level: string; job_type: string;
  plan_duration_weeks: number;
};

function SelectableCard({ selected, onClick, children, className = '' }: {
  selected: boolean; onClick: () => void; children: React.ReactNode; className?: string;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all p-4 ${selected ? 'ring-2 ring-emerald-500 bg-emerald-50 border-emerald-300' : 'hover:border-zinc-300'} ${className}`}
      onClick={onClick}
    >
      {children}
    </Card>
  );
}

function TagInput({ tags, setTags, placeholder }: { tags: string[]; setTags: (t: string[]) => void; placeholder: string }) {
  const [input, setInput] = useState('');
  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {tags.map((tag, i) => (
          <Badge key={i} variant="secondary" className="cursor-pointer" onClick={() => setTags(tags.filter((_, j) => j !== i))}>
            {tag} &times;
          </Badge>
        ))}
      </div>
      <Input
        placeholder={placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && input.trim()) {
            e.preventDefault();
            setTags([...tags, input.trim()]);
            setInput('');
          }
        }}
      />
      <p className="text-xs text-zinc-400 mt-1">Press Enter to add</p>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<FormData>({
    age: 0, sex: 'male', height_cm: 0, weight_kg: 0,
    goal: '', goal_weight_kg: 0,
    activity_level: '',
    body_fat_percentage: undefined, body_fat_unsure: false,
    diet_type: 'no_restrictions', disliked_foods: [], allergies: [],
    meals_per_day: 3, meal_timing_window: '', cooking_skill: 'medium',
    budget: 'medium', restaurant_frequency: '',
    injuries: [], injury_notes: '',
    workout_frequency: 3, workout_location: 'gym', experience_level: 'beginner',
    home_equipment: [], split_preference: 'full_body', time_per_session: 60,
    cardio_preference: 'moderate',
    average_steps: 8000, sleep_hours: 7, stress_level: 'medium', job_type: 'desk',
    plan_duration_weeks: 8,
  });

  const update = useCallback((partial: Partial<FormData>) => {
    setForm(prev => ({ ...prev, ...partial }));
  }, []);

  const canProceed = (): boolean => {
    switch (step) {
      case 1: return form.age >= 16 && form.height_cm >= 100 && form.weight_kg >= 30;
      case 2: return !!form.goal && form.goal_weight_kg >= 30;
      case 3: return !!form.activity_level;
      case 4: return form.body_fat_unsure || (form.body_fat_percentage !== undefined && form.body_fat_percentage >= 3);
      case 5: return !!form.diet_type;
      case 6: return true;
      case 7: return !!form.workout_location && !!form.experience_level && !!form.split_preference;
      case 8: return true;
      case 9: return !!form.plan_duration_weeks;
      default: return false;
    }
  };

  const goNext = () => { if (canProceed()) { setDirection(1); setStep(s => Math.min(s + 1, TOTAL_STEPS)); } };
  const goBack = () => { setDirection(-1); setStep(s => Math.max(s - 1, 1)); };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save');
      router.push('/generating');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const stepTitles = ['Personal Info', 'Goals', 'Activity Level', 'Body Fat %', 'Diet Preferences', 'Injuries', 'Training', 'Lifestyle', 'Plan Duration'];

  const toggleArray = (arr: string[], item: string) =>
    arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];

  const cmToFtIn = (cm: number) => { const inches = cm / 2.54; return `${Math.floor(inches / 12)}'${Math.round(inches % 12)}"`; };
  const kgToLbs = (kg: number) => `${Math.round(kg * 2.205)} lbs`;

  return (
    <div className="min-h-screen bg-zinc-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-lg font-bold tracking-tight">Max<span className="text-emerald-600">Health</span></span>
            <span className="text-xs text-zinc-400">Step {step} of {TOTAL_STEPS}</span>
          </div>
          <Progress value={(step / TOTAL_STEPS) * 100} className="h-1.5" />
          <p className="text-sm font-medium text-zinc-600 mt-1">{stepTitles[step - 1]}</p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.25, ease: 'easeInOut' }}
          >
            {/* STEP 1: Personal Info */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Tell us about yourself</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Age</Label>
                    <Input type="number" value={form.age || ''} onChange={e => update({ age: parseInt(e.target.value) || 0 })} placeholder="25" />
                  </div>
                  <div>
                    <Label>Sex</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <SelectableCard selected={form.sex === 'male'} onClick={() => update({ sex: 'male' })}>
                        <p className="text-center text-sm font-medium">Male</p>
                      </SelectableCard>
                      <SelectableCard selected={form.sex === 'female'} onClick={() => update({ sex: 'female' })}>
                        <p className="text-center text-sm font-medium">Female</p>
                      </SelectableCard>
                    </div>
                  </div>
                </div>
                <div>
                  <Label>Height (cm)</Label>
                  <Input type="number" value={form.height_cm || ''} onChange={e => update({ height_cm: parseFloat(e.target.value) || 0 })} placeholder="175" />
                  {form.height_cm > 0 && <p className="text-xs text-zinc-400 mt-1">{cmToFtIn(form.height_cm)}</p>}
                </div>
                <div>
                  <Label>Weight (kg)</Label>
                  <Input type="number" value={form.weight_kg || ''} onChange={e => update({ weight_kg: parseFloat(e.target.value) || 0 })} placeholder="75" />
                  {form.weight_kg > 0 && <p className="text-xs text-zinc-400 mt-1">{kgToLbs(form.weight_kg)}</p>}
                </div>
              </div>
            )}

            {/* STEP 2: Goals */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">What&apos;s your goal?</h2>
                <div className="grid gap-3">
                  {[
                    { val: 'cut', icon: Scissors, title: 'Cut', desc: 'Lose body fat while preserving muscle mass' },
                    { val: 'bulk', icon: TrendingUp, title: 'Bulk', desc: 'Build muscle mass and strength' },
                    { val: 'recomp', icon: RefreshCw, title: 'Recomposition', desc: 'Build muscle while maintaining your weight' },
                  ].map(g => {
                    const Icon = g.icon;
                    return (
                      <SelectableCard key={g.val} selected={form.goal === g.val} onClick={() => update({ goal: g.val })}>
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${form.goal === g.val ? 'bg-emerald-500 text-white' : 'bg-zinc-100'}`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-medium">{g.title}</p>
                            <p className="text-xs text-zinc-500">{g.desc}</p>
                          </div>
                        </div>
                      </SelectableCard>
                    );
                  })}
                </div>
                <div>
                  <Label>Goal weight (kg)</Label>
                  <Input type="number" value={form.goal_weight_kg || ''} onChange={e => update({ goal_weight_kg: parseFloat(e.target.value) || 0 })} placeholder="70" />
                  {form.goal_weight_kg > 0 && <p className="text-xs text-zinc-400 mt-1">{kgToLbs(form.goal_weight_kg)}</p>}
                </div>
              </div>
            )}

            {/* STEP 3: Activity Level */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">How active are you?</h2>
                  <p className="text-sm text-amber-600 mt-2 bg-amber-50 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    It&apos;s better to underestimate than overestimate your activity level. Most people are less active than they think.
                  </p>
                </div>
                <div className="space-y-3">
                  {[
                    { val: 'sedentary', title: 'Sedentary', desc: 'Little to no exercise. Desk job, minimal walking. Example: Office worker who drives to work and watches TV in the evening.' },
                    { val: 'lightly_active', title: 'Lightly Active', desc: 'Light exercise 1-3 days/week. Some walking. Example: Office worker who takes short walks, light yoga, or occasional gym sessions.' },
                    { val: 'moderate', title: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week. Example: Regular gym-goer with an active hobby like cycling, swimming, or recreational sports.' },
                    { val: 'very_active', title: 'Very Active', desc: 'Hard exercise 6-7 days/week. Example: Dedicated athlete, construction worker, or someone training twice daily.' },
                    { val: 'athlete', title: 'Athlete', desc: 'Professional/competitive level training. Example: Competitive athlete, professional sports, military training, or physical labor + daily training.' },
                  ].map(a => (
                    <SelectableCard key={a.val} selected={form.activity_level === a.val} onClick={() => update({ activity_level: a.val })}>
                      <p className="font-medium text-sm">{a.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{a.desc}</p>
                    </SelectableCard>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 4: Body Fat % */}
            {step === 4 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Estimate your body fat %</h2>
                <p className="text-sm text-zinc-500">Select the image that most closely matches your physique, or choose &quot;I&apos;m not sure&quot; below.</p>

                {!form.body_fat_unsure && (
                  <>
                    <p className="text-xs font-medium text-zinc-400 uppercase">
                      {form.sex === 'male' ? 'Male' : 'Female'} Reference
                    </p>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {(form.sex === 'male'
                        ? [{ range: '8-10%', val: 9 }, { range: '12-15%', val: 13 }, { range: '18-20%', val: 19 }, { range: '22-25%', val: 23 }, { range: '28-30%', val: 29 }, { range: '35%+', val: 37 }]
                        : [{ range: '15-18%', val: 16 }, { range: '20-22%', val: 21 }, { range: '25-28%', val: 26 }, { range: '30-33%', val: 31 }, { range: '35-38%', val: 36 }, { range: '40%+', val: 42 }]
                      ).map(bf => (
                        <div
                          key={bf.range}
                          className={`aspect-[3/4] bg-zinc-100 rounded-lg flex flex-col items-center justify-center cursor-pointer border-2 transition-all text-center p-1 ${
                            form.body_fat_percentage === bf.val ? 'border-emerald-500 bg-emerald-50' : 'border-transparent hover:border-zinc-300'
                          }`}
                          onClick={() => update({ body_fat_percentage: bf.val, body_fat_unsure: false })}
                        >
                          <p className="text-[10px] text-zinc-400 mb-1">BF% Ref</p>
                          <p className="text-xs font-bold">{bf.range}</p>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.body_fat_unsure}
                    onChange={e => update({ body_fat_unsure: e.target.checked, body_fat_percentage: undefined })}
                    className="rounded border-zinc-300"
                  />
                  <span className="text-sm">I&apos;m not sure</span>
                </label>
                {form.body_fat_unsure && (
                  <p className="text-sm text-zinc-500 bg-zinc-100 rounded-lg p-3">
                    No problem! We&apos;ll use the Mifflin-St Jeor formula to estimate your caloric needs. You can update this later for more accurate results.
                  </p>
                )}
              </div>
            )}

            {/* STEP 5: Diet Preferences */}
            {step === 5 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Diet preferences</h2>

                <div>
                  <Label className="mb-2 block">Diet type</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { val: 'no_restrictions', label: 'No Restrictions' }, { val: 'standard', label: 'Standard' },
                      { val: 'keto', label: 'Keto' }, { val: 'vegan', label: 'Vegan' },
                      { val: 'vegetarian', label: 'Vegetarian' }, { val: 'paleo', label: 'Paleo' },
                      { val: 'gluten_free', label: 'Gluten-Free' }, { val: 'dairy_free', label: 'Dairy-Free' },
                      { val: 'halal', label: 'Halal' }, { val: 'kosher', label: 'Kosher' },
                    ].map(d => (
                      <Badge
                        key={d.val}
                        variant={form.diet_type === d.val ? 'default' : 'outline'}
                        className={`cursor-pointer text-xs py-1 px-3 ${form.diet_type === d.val ? 'bg-emerald-600 hover:bg-emerald-700' : 'hover:bg-zinc-100'}`}
                        onClick={() => update({ diet_type: d.val })}
                      >
                        {d.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Disliked foods</Label>
                  <TagInput tags={form.disliked_foods} setTags={t => update({ disliked_foods: t })} placeholder="e.g., liver, brussels sprouts..." />
                </div>

                <div>
                  <Label>Allergies</Label>
                  <TagInput tags={form.allergies} setTags={t => update({ allergies: t })} placeholder="e.g., peanuts, shellfish..." />
                </div>

                <div>
                  <div className="flex justify-between">
                    <Label>Meals per day</Label>
                    <span className="text-sm font-semibold text-emerald-600">{form.meals_per_day}</span>
                  </div>
                  <Slider min={1} max={8} step={1} value={[form.meals_per_day]} onValueChange={([v]) => update({ meals_per_day: v })} className="mt-2" />
                </div>

                <div>
                  <Label>Meal timing window</Label>
                  <Input placeholder="e.g., 8am - 8pm" value={form.meal_timing_window} onChange={e => update({ meal_timing_window: e.target.value })} />
                </div>

                <div>
                  <Label className="mb-2 block">Cooking skill</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { val: 'low', label: 'Low', desc: 'Basics only' },
                      { val: 'medium', label: 'Medium', desc: 'Can follow recipes' },
                      { val: 'high', label: 'High', desc: 'Enjoys cooking' },
                    ].map(c => (
                      <SelectableCard key={c.val} selected={form.cooking_skill === c.val} onClick={() => update({ cooking_skill: c.val })}>
                        <p className="text-sm font-medium text-center">{c.label}</p>
                        <p className="text-xs text-zinc-500 text-center">{c.desc}</p>
                      </SelectableCard>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Budget</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map(b => (
                      <SelectableCard key={b} selected={form.budget === b} onClick={() => update({ budget: b })}>
                        <p className="text-sm font-medium text-center capitalize">{b}</p>
                      </SelectableCard>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>How often do you eat out per week?</Label>
                  <Input placeholder="e.g., 2-3 times" value={form.restaurant_frequency} onChange={e => update({ restaurant_frequency: e.target.value })} />
                </div>
              </div>
            )}

            {/* STEP 6: Injuries */}
            {step === 6 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Any injuries or limitations?</h2>
                  <p className="text-sm text-zinc-500 mt-1">This helps us avoid exercises that might aggravate existing issues.</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['Shoulder', 'Elbow', 'Wrist', 'Back', 'Hip', 'Knee', 'Ankle', 'Neck'].map(injury => (
                    <SelectableCard
                      key={injury}
                      selected={form.injuries.includes(injury.toLowerCase())}
                      onClick={() => update({ injuries: toggleArray(form.injuries, injury.toLowerCase()) })}
                    >
                      <p className="text-sm font-medium text-center">{injury}</p>
                    </SelectableCard>
                  ))}
                </div>
                <div>
                  <Label>Additional notes</Label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                    placeholder="Describe any injuries, limitations, or health conditions..."
                    value={form.injury_notes}
                    onChange={e => update({ injury_notes: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* STEP 7: Training Preferences */}
            {step === 7 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Training preferences</h2>

                <div>
                  <Label className="mb-2 block">Workout frequency (days/week)</Label>
                  <div className="flex gap-2">
                    {[2, 3, 4, 5, 6].map(d => (
                      <SelectableCard key={d} selected={form.workout_frequency === d} onClick={() => update({ workout_frequency: d })} className="flex-1">
                        <p className="text-center font-bold">{d}</p>
                      </SelectableCard>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Location</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectableCard selected={form.workout_location === 'home'} onClick={() => update({ workout_location: 'home' })}>
                      <div className="text-center"><Home className="w-6 h-6 mx-auto mb-1" /><p className="text-sm font-medium">Home</p></div>
                    </SelectableCard>
                    <SelectableCard selected={form.workout_location === 'gym'} onClick={() => update({ workout_location: 'gym' })}>
                      <div className="text-center"><Dumbbell className="w-6 h-6 mx-auto mb-1" /><p className="text-sm font-medium">Gym</p></div>
                    </SelectableCard>
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Experience level</Label>
                  <div className="space-y-2">
                    {[
                      { val: 'beginner', title: 'Beginner', desc: 'New to structured training (< 1 year)' },
                      { val: 'intermediate', title: 'Intermediate', desc: 'Consistent training for 1-3 years' },
                      { val: 'advanced', title: 'Advanced', desc: '3+ years of serious training' },
                    ].map(e => (
                      <SelectableCard key={e.val} selected={form.experience_level === e.val} onClick={() => update({ experience_level: e.val })}>
                        <p className="font-medium text-sm">{e.title}</p>
                        <p className="text-xs text-zinc-500">{e.desc}</p>
                      </SelectableCard>
                    ))}
                  </div>
                </div>

                {form.workout_location === 'home' && (
                  <div>
                    <Label className="mb-2 block">Equipment at home</Label>
                    <div className="flex flex-wrap gap-2">
                      {['Dumbbells', 'Resistance Bands', 'Barbell + Rack', 'Pull-up Bar', 'Cables/Pulley', 'Bench', 'Kettlebells', 'None'].map(eq => (
                        <Badge
                          key={eq}
                          variant={form.home_equipment.includes(eq.toLowerCase()) ? 'default' : 'outline'}
                          className={`cursor-pointer py-1 px-3 ${form.home_equipment.includes(eq.toLowerCase()) ? 'bg-emerald-600' : ''}`}
                          onClick={() => update({ home_equipment: toggleArray(form.home_equipment, eq.toLowerCase()) })}
                        >
                          {eq}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label className="mb-2 block">Split preference</Label>
                  <div className="space-y-2">
                    {[
                      { val: 'full_body', title: 'Full Body', desc: 'Train all muscle groups each session' },
                      { val: 'upper_lower', title: 'Upper/Lower', desc: 'Alternate upper and lower body days' },
                      { val: 'ppl', title: 'PPL', desc: 'Push, Pull, Legs rotation' },
                      { val: 'bro_split', title: 'Bro Split', desc: 'One muscle group per day' },
                      { val: 'strength', title: 'Strength Focus', desc: 'Powerlifting-style squat/bench/deadlift focus' },
                    ].map(s => (
                      <SelectableCard key={s.val} selected={form.split_preference === s.val} onClick={() => update({ split_preference: s.val })}>
                        <div className="flex justify-between items-center">
                          <div><p className="font-medium text-sm">{s.title}</p><p className="text-xs text-zinc-500">{s.desc}</p></div>
                        </div>
                      </SelectableCard>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between">
                    <Label>Time per session (minutes)</Label>
                    <span className="text-sm font-semibold text-emerald-600">{form.time_per_session} min</span>
                  </div>
                  <Slider min={15} max={180} step={5} value={[form.time_per_session]} onValueChange={([v]) => update({ time_per_session: v })} className="mt-2" />
                </div>

                <div>
                  <Label className="mb-2 block">Cardio preference</Label>
                  <div className="grid grid-cols-4 gap-2">
                    {['none', 'light', 'moderate', 'high'].map(c => (
                      <SelectableCard key={c} selected={form.cardio_preference === c} onClick={() => update({ cardio_preference: c })}>
                        <p className="text-sm font-medium text-center capitalize">{c}</p>
                      </SelectableCard>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 8: Lifestyle */}
            {step === 8 && (
              <div className="space-y-6">
                <h2 className="text-2xl font-bold">Lifestyle</h2>

                <div>
                  <Label>Average daily steps</Label>
                  <Input type="number" value={form.average_steps} onChange={e => update({ average_steps: parseInt(e.target.value) || 0 })} placeholder="8000" />
                  <p className="text-xs text-zinc-400 mt-1">Check your phone&apos;s health app for a rough average</p>
                </div>

                <div>
                  <Label>Average sleep (hours)</Label>
                  <Input type="number" step="0.5" value={form.sleep_hours} onChange={e => update({ sleep_hours: parseFloat(e.target.value) || 0 })} placeholder="7" />
                </div>

                <div>
                  <Label className="mb-2 block">Stress level</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'medium', 'high'].map(s => (
                      <SelectableCard key={s} selected={form.stress_level === s} onClick={() => update({ stress_level: s })}>
                        <p className="text-sm font-medium text-center capitalize">{s}</p>
                      </SelectableCard>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Job type</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <SelectableCard selected={form.job_type === 'desk'} onClick={() => update({ job_type: 'desk' })}>
                      <div className="text-center"><User className="w-5 h-5 mx-auto mb-1" /><p className="text-sm font-medium">Desk Job</p></div>
                    </SelectableCard>
                    <SelectableCard selected={form.job_type === 'active'} onClick={() => update({ job_type: 'active' })}>
                      <div className="text-center"><Dumbbell className="w-5 h-5 mx-auto mb-1" /><p className="text-sm font-medium">Active Job</p></div>
                    </SelectableCard>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 9: Plan Duration */}
            {step === 9 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">Choose your plan length</h2>
                  <p className="text-sm text-zinc-500 mt-1">How long do you want your training program to be?</p>
                </div>
                <div className="space-y-3">
                  {[
                    { weeks: 4, title: '4 Weeks', desc: 'Perfect for a quick kickstart or trying us out', badge: '' },
                    { weeks: 8, title: '8 Weeks', desc: 'Ideal for meaningful body composition changes', badge: 'Recommended' },
                    { weeks: 12, title: '12 Weeks', desc: 'Full transformation program for maximum results', badge: '' },
                  ].map(p => (
                    <SelectableCard key={p.weeks} selected={form.plan_duration_weeks === p.weeks} onClick={() => update({ plan_duration_weeks: p.weeks })}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-bold ${form.plan_duration_weeks === p.weeks ? 'bg-emerald-500 text-white' : 'bg-zinc-100'}`}>
                            {p.weeks}w
                          </div>
                          <div>
                            <p className="font-medium">{p.title}</p>
                            <p className="text-xs text-zinc-500">{p.desc}</p>
                          </div>
                        </div>
                        {p.badge && <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-xs">{p.badge}</Badge>}
                      </div>
                    </SelectableCard>
                  ))}
                </div>

                <div className="bg-zinc-100 rounded-xl p-4 mt-6">
                  <p className="text-sm font-medium mb-1 flex items-center gap-1"><Clock className="w-4 h-4" /> Almost done!</p>
                  <p className="text-xs text-zinc-500">After you submit, we&apos;ll calculate your macros and generate your personalized meal plan and training program. This takes about 30-60 seconds.</p>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between mt-8 gap-3">
          {step > 1 ? (
            <Button variant="outline" onClick={goBack} className="flex-1 sm:flex-none">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          ) : <div />}

          {step < TOTAL_STEPS ? (
            <Button
              onClick={goNext}
              disabled={!canProceed()}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700"
            >
              Next <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canProceed()}
              className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> Submitting...</>
              ) : (
                <>Generate My Plans <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
