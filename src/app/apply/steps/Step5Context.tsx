'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';
import { TextField, TextareaField } from '@/components/marketing/FormField';
import { RadioCardGroup } from '@/components/marketing/RadioCardGroup';
import { cn } from '@/lib/utils';
import {
  EXPERIENCE_OPTIONS,
  GYM_OPTIONS,
  TRACKS_FOOD_OPTIONS,
  type ApplicationInput,
  type TrainingExperience,
} from '@/lib/coaching/schemas';

export function Step5Context() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ApplicationInput>();

  const inPrep = useWatch({ control, name: 'inPrep' });

  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">Training experience</span>
        <Controller
          control={control}
          name="trainingExperience"
          render={({ field }) => (
            <RadioCardGroup<TrainingExperience>
              name={field.name}
              options={EXPERIENCE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.trainingExperience?.message}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">Do you currently track food?</span>
        <Controller
          control={control}
          name="tracksFood"
          render={({ field }) => (
            <RadioCardGroup
              name={field.name}
              options={TRACKS_FOOD_OPTIONS}
              value={field.value as 'yes' | 'sometimes' | 'no' | undefined}
              onChange={field.onChange}
              error={errors.tracksFood?.message as string | undefined}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">Gym access</span>
        <Controller
          control={control}
          name="gymAccess"
          render={({ field }) => (
            <RadioCardGroup
              name={field.name}
              options={GYM_OPTIONS}
              value={field.value as 'full' | 'limited' | 'home' | 'none' | undefined}
              onChange={field.onChange}
              error={errors.gymAccess?.message as string | undefined}
            />
          )}
        />
      </div>

      <TextareaField
        label="Injuries, limitations, or health considerations I should know about?"
        placeholder="Anything that affects training or nutrition. Skip if none."
        optional
        rows={3}
        {...register('injuries')}
        error={errors.injuries?.message}
      />

      <div className="space-y-3 rounded-2xl border border-border bg-card/30 p-4">
        <span className="block text-sm font-medium text-foreground">
          Are you currently in prep or planning a show?
        </span>
        <Controller
          control={control}
          name="inPrep"
          render={({ field }) => (
            <div className="flex gap-2">
              {[
                { v: false, label: 'No' },
                { v: true, label: 'Yes' },
              ].map((opt) => {
                const selected = field.value === opt.v;
                return (
                  <button
                    key={String(opt.v)}
                    type="button"
                    onClick={() => field.onChange(opt.v)}
                    className={cn(
                      'h-10 flex-1 rounded-full border text-sm font-medium transition-all',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border bg-transparent text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        />

        {inPrep && (
          <div className="grid gap-4 pt-3 sm:grid-cols-2">
            <TextField
              label="Show date or window"
              placeholder="e.g. May 2026"
              {...register('showDate')}
              error={errors.showDate?.message}
            />
            <TextField
              label="Federation / category"
              placeholder="NPC Men's Physique"
              optional
              {...register('federation')}
              error={errors.federation?.message}
            />
            <TextField
              label="Current stage"
              placeholder="Offseason / prep week 8 / post-show"
              optional
              {...register('prepStage')}
              error={errors.prepStage?.message}
            />
            <TextField
              label="Current coach (if any)"
              placeholder="Name or 'none'"
              optional
              {...register('currentCoach')}
              error={errors.currentCoach?.message}
            />
          </div>
        )}
      </div>
    </div>
  );
}
