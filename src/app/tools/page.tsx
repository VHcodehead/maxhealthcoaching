'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, UtensilsCrossed, Dumbbell, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

function TDEECalculator() {
  const [form, setForm] = useState({ age: '', sex: 'male', weight: '', height: '', activity: '1.55' });
  const [result, setResult] = useState<{ bmr: number; tdee: number } | null>(null);

  const calculate = () => {
    const age = parseFloat(form.age);
    const weight = parseFloat(form.weight);
    const height = parseFloat(form.height);
    const activity = parseFloat(form.activity);

    if (!age || !weight || !height) return;

    let bmr: number;
    if (form.sex === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    setResult({ bmr: Math.round(bmr), tdee: Math.round(bmr * activity) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-emerald-600" /> TDEE Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Age</Label>
            <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="25" />
          </div>
          <div>
            <Label>Sex</Label>
            <select
              className="w-full h-9 rounded-md border border-zinc-200 px-3 text-sm"
              value={form.sex}
              onChange={(e) => setForm({ ...form, sex: e.target.value })}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="75" />
          </div>
          <div>
            <Label>Height (cm)</Label>
            <Input type="number" value={form.height} onChange={(e) => setForm({ ...form, height: e.target.value })} placeholder="175" />
          </div>
        </div>
        <div>
          <Label>Activity Level</Label>
          <select
            className="w-full h-9 rounded-md border border-zinc-200 px-3 text-sm"
            value={form.activity}
            onChange={(e) => setForm({ ...form, activity: e.target.value })}
          >
            <option value="1.2">Sedentary</option>
            <option value="1.375">Lightly Active</option>
            <option value="1.55">Moderately Active</option>
            <option value="1.725">Very Active</option>
            <option value="1.9">Athlete</option>
          </select>
        </div>
        <Button onClick={calculate} className="w-full bg-emerald-600 hover:bg-emerald-700">Calculate TDEE</Button>

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-50 rounded-lg p-4 text-center">
            <p className="text-sm text-zinc-600">Your estimated TDEE</p>
            <p className="text-3xl font-bold text-emerald-600">{result.tdee} cal/day</p>
            <p className="text-xs text-zinc-500 mt-1">BMR: {result.bmr} cal/day</p>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function MacroCalculator() {
  const [form, setForm] = useState({ calories: '', weight: '', goal: 'cut' });
  const [result, setResult] = useState<{ protein: number; fat: number; carbs: number } | null>(null);

  const calculate = () => {
    const calories = parseFloat(form.calories);
    const weight = parseFloat(form.weight);
    if (!calories || !weight) return;

    const weightLbs = weight * 2.205;
    const proteinPerLb = form.goal === 'cut' ? 1.1 : form.goal === 'bulk' ? 0.9 : 1.0;
    const protein = Math.round(weightLbs * proteinPerLb);
    const fat = Math.round((calories * 0.27) / 9);
    const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

    setResult({ protein, fat, carbs: Math.max(carbs, 50) });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-emerald-600" /> Macro Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Daily Calories</Label>
            <Input type="number" value={form.calories} onChange={(e) => setForm({ ...form, calories: e.target.value })} placeholder="2200" />
          </div>
          <div>
            <Label>Weight (kg)</Label>
            <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="75" />
          </div>
        </div>
        <div>
          <Label>Goal</Label>
          <select
            className="w-full h-9 rounded-md border border-zinc-200 px-3 text-sm"
            value={form.goal}
            onChange={(e) => setForm({ ...form, goal: e.target.value })}
          >
            <option value="cut">Fat Loss (Cut)</option>
            <option value="bulk">Muscle Gain (Bulk)</option>
            <option value="recomp">Body Recomposition</option>
          </select>
        </div>
        <Button onClick={calculate} className="w-full bg-emerald-600 hover:bg-emerald-700">Calculate Macros</Button>

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-50 rounded-lg p-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-600">{result.protein}g</p>
                <p className="text-xs text-zinc-500">Protein</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{result.carbs}g</p>
                <p className="text-xs text-zinc-500">Carbs</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-emerald-600">{result.fat}g</p>
                <p className="text-xs text-zinc-500">Fat</p>
              </div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

function OneRMCalculator() {
  const [form, setForm] = useState({ weight: '', reps: '' });
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    const weight = parseFloat(form.weight);
    const reps = parseFloat(form.reps);
    if (!weight || !reps || reps < 1) return;

    // Epley formula
    const oneRM = reps === 1 ? weight : Math.round(weight * (1 + reps / 30));
    setResult(oneRM);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-emerald-600" /> 1RM Calculator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Weight Lifted (kg)</Label>
            <Input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: e.target.value })} placeholder="100" />
          </div>
          <div>
            <Label>Reps Completed</Label>
            <Input type="number" value={form.reps} onChange={(e) => setForm({ ...form, reps: e.target.value })} placeholder="5" />
          </div>
        </div>
        <Button onClick={calculate} className="w-full bg-emerald-600 hover:bg-emerald-700">Calculate 1RM</Button>

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-emerald-50 rounded-lg p-4 text-center">
            <p className="text-sm text-zinc-600">Estimated One-Rep Max</p>
            <p className="text-3xl font-bold text-emerald-600">{result} kg</p>
            <div className="grid grid-cols-4 gap-2 mt-3 text-xs text-zinc-500">
              <div><span className="font-semibold">{Math.round(result * 0.85)}kg</span><br />85% (5 reps)</div>
              <div><span className="font-semibold">{Math.round(result * 0.75)}kg</span><br />75% (8 reps)</div>
              <div><span className="font-semibold">{Math.round(result * 0.65)}kg</span><br />65% (12 reps)</div>
              <div><span className="font-semibold">{Math.round(result * 0.50)}kg</span><br />50% (20 reps)</div>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}

export default function ToolsPage() {
  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="text-xl font-bold tracking-tight">
            Max<span className="text-emerald-600">Health</span>
          </a>
          <Button asChild variant="outline" size="sm">
            <a href="/pricing">Get Full Plan <ArrowRight className="w-3 h-3 ml-1" /></a>
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Badge variant="secondary" className="mb-3">Free Tools</Badge>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Free Fitness Calculators
          </h1>
          <p className="text-zinc-500 max-w-lg mx-auto">
            Get a taste of the data-driven approach behind MaxHealth Coaching. For personalized plans built around your exact numbers,{' '}
            <a href="/pricing" className="text-emerald-600 underline">get started here</a>.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <TDEECalculator />
          <MacroCalculator />
          <OneRMCalculator />

          {/* CTA Card */}
          <Card className="bg-zinc-900 text-white border-0">
            <CardContent className="flex flex-col items-center justify-center h-full text-center p-8">
              <h3 className="text-xl font-bold mb-2">Want the full picture?</h3>
              <p className="text-zinc-400 text-sm mb-4">
                Get a complete custom meal plan, training program, and personalized macro targets — all tailored to your body and goals.
              </p>
              <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
                <a href="/pricing">Start Your Plan <ArrowRight className="w-4 h-4 ml-1" /></a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
