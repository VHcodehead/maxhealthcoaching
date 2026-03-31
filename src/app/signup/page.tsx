'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { toast } from 'sonner';
import { Loader2, Dumbbell, CheckCircle } from 'lucide-react';

import { applicationSchema } from '@/lib/validations';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type ApplicationFormData = z.infer<typeof applicationSchema>;

const goalOptions = [
  { value: 'lose_fat', label: 'Lose fat & get lean' },
  { value: 'build_muscle', label: 'Build muscle & size' },
  { value: 'recomp', label: 'Lose fat while building muscle (body recomposition)' },
  { value: 'general_health', label: 'Improve overall health & fitness' },
  { value: 'competition', label: 'Competition / show prep' },
];

const experienceOptions = [
  { value: 'beginner', label: 'Beginner (0-1 years)' },
  { value: 'intermediate', label: 'Intermediate (1-3 years)' },
  { value: 'advanced', label: 'Advanced (3+ years)' },
];

const commitmentOptions = [
  { value: '3', label: '3 days per week' },
  { value: '4', label: '4 days per week' },
  { value: '5', label: '5 days per week' },
  { value: '6+', label: '6+ days per week' },
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
];

export default function SignupPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApplicationFormData>({
    resolver: zodResolver(applicationSchema),
  });

  async function onSubmit(data: ApplicationFormData) {
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'Failed to submit application.');
        return;
      }

      setSubmitted(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MaxHealth Coaching</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your Personal Training Partner</p>
        </div>

        {submitted ? (
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="flex justify-center">
                <CheckCircle className="h-14 w-14 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Application Submitted!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  We review every application personally. You&apos;ll receive an email once your
                  application has been reviewed.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block text-sm font-medium text-emerald-600 hover:underline"
              >
                Back to Login
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Apply for Coaching</CardTitle>
              <CardDescription>
                Tell us about yourself and your fitness goals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                {/* Personal Info */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Personal Info
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full name</Label>
                    <Input
                      id="full_name"
                      type="text"
                      placeholder="John Doe"
                      autoComplete="name"
                      {...register('full_name')}
                    />
                    {errors.full_name && (
                      <p className="text-sm text-destructive">{errors.full_name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      {...register('email')}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="At least 8 characters"
                      autoComplete="new-password"
                      {...register('password')}
                    />
                    {errors.password && (
                      <p className="text-sm text-destructive">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                {/* Your Goals */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Your Goals
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="goal">Primary goal</Label>
                    <select
                      id="goal"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      defaultValue=""
                      {...register('goal')}
                    >
                      <option value="" disabled>Select your main goal</option>
                      {goalOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.goal && (
                      <p className="text-sm text-destructive">{errors.goal.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="experience">Training experience</Label>
                    <select
                      id="experience"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      defaultValue=""
                      {...register('experience')}
                    >
                      <option value="" disabled>Select experience level</option>
                      {experienceOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.experience && (
                      <p className="text-sm text-destructive">{errors.experience.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commitment">Training commitment</Label>
                    <select
                      id="commitment"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      defaultValue=""
                      {...register('commitment')}
                    >
                      <option value="" disabled>Select days per week</option>
                      {commitmentOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.commitment && (
                      <p className="text-sm text-destructive">{errors.commitment.message}</p>
                    )}
                  </div>
                </div>

                {/* About You */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    About You
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender</Label>
                    <select
                      id="gender"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      defaultValue=""
                      {...register('gender')}
                    >
                      <option value="" disabled>Select gender</option>
                      {genderOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                    {errors.gender && (
                      <p className="text-sm text-destructive">{errors.gender.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="age">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="e.g. 28"
                      min={16}
                      max={100}
                      {...register('age', { valueAsNumber: true })}
                    />
                    {errors.age && (
                      <p className="text-sm text-destructive">{errors.age.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Height</Label>
                    <div className="flex gap-3">
                      <div className="flex-1 space-y-1">
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="5"
                            min={3}
                            max={8}
                            {...register('height_ft', { valueAsNumber: true })}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            ft
                          </span>
                        </div>
                        {errors.height_ft && (
                          <p className="text-sm text-destructive">{errors.height_ft.message}</p>
                        )}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="relative">
                          <Input
                            type="number"
                            placeholder="10"
                            min={0}
                            max={11}
                            {...register('height_in', { valueAsNumber: true })}
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                            in
                          </span>
                        </div>
                        {errors.height_in && (
                          <p className="text-sm text-destructive">{errors.height_in.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight_lbs">Weight</Label>
                    <div className="relative">
                      <Input
                        id="weight_lbs"
                        type="number"
                        placeholder="185"
                        min={80}
                        max={600}
                        {...register('weight_lbs', { valueAsNumber: true })}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        lbs
                      </span>
                    </div>
                    {errors.weight_lbs && (
                      <p className="text-sm text-destructive">{errors.weight_lbs.message}</p>
                    )}
                  </div>
                </div>

                {/* Tell Us More */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Tell Us More
                  </h3>

                  <div className="space-y-2">
                    <Label htmlFor="motivation">
                      What&apos;s driving you to seek coaching right now?{' '}
                      <span className="text-muted-foreground font-normal">(required)</span>
                    </Label>
                    <textarea
                      id="motivation"
                      rows={4}
                      placeholder="Tell us about your goals, challenges, and what coaching means to you..."
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
                      {...register('motivation')}
                    />
                    {errors.motivation && (
                      <p className="text-sm text-destructive">{errors.motivation.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source">
                      How did you find us?{' '}
                      <span className="text-muted-foreground font-normal">(optional)</span>
                    </Label>
                    <Input
                      id="source"
                      type="text"
                      placeholder="e.g. Instagram, Google, friend referral..."
                      {...register('source')}
                    />
                    {errors.source && (
                      <p className="text-sm text-destructive">{errors.source.message}</p>
                    )}
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isLoading}
                >
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Application
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link href="/login" className="font-medium text-foreground hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
