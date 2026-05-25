'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { TextField, TextareaField } from '@/components/marketing/FormField';
import { RadioCardGroup } from '@/components/marketing/RadioCardGroup';
import { GOAL_OPTIONS, type ApplicationInput, type GoalType } from '@/lib/coaching/schemas';

export function Step2Goal() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ApplicationInput>();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">What are you looking for help with?</span>
        <Controller
          control={control}
          name="goalType"
          render={({ field }) => (
            <RadioCardGroup<GoalType>
              name={field.name}
              options={GOAL_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.goalType?.message}
            />
          )}
        />
      </div>

      <TextareaField
        label="What is your main goal — in your own words?"
        placeholder="Tell me what you want, specifically. The more concrete, the better."
        {...register('goalNarrative')}
        error={errors.goalNarrative?.message}
      />

      <TextareaField
        label="Why does this matter to you right now?"
        placeholder="What's driving this? A deadline, a moment, a feeling — be honest."
        {...register('motivation')}
        error={errors.motivation?.message}
      />

      <TextField
        label="Timeline you're working toward"
        placeholder="e.g. 12 weeks, by my wedding in October, summer 2026"
        {...register('timeline')}
        error={errors.timeline?.message}
      />
    </div>
  );
}
