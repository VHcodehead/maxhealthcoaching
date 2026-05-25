'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { TextareaField } from '@/components/marketing/FormField';
import { RadioCardGroup } from '@/components/marketing/RadioCardGroup';
import { STRUGGLE_OPTIONS, type ApplicationInput, type Struggle } from '@/lib/coaching/schemas';

export function Step3Situation() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ApplicationInput>();

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">
          What are you struggling with most? <span className="text-xs font-normal text-muted-foreground">(pick any that apply)</span>
        </span>
        <Controller
          control={control}
          name="struggles"
          render={({ field }) => (
            <RadioCardGroup<Struggle>
              mode="multi"
              name={field.name}
              options={STRUGGLE_OPTIONS}
              value={(field.value ?? []) as Struggle[]}
              onChange={field.onChange}
              error={errors.struggles?.message as string | undefined}
            />
          )}
        />
      </div>

      <TextareaField
        label="What have you tried before?"
        placeholder="Programs, coaches, apps, DIY — what's on the list?"
        {...register('triedBefore')}
        error={errors.triedBefore?.message}
      />

      <TextareaField
        label="Why do you think it hasn't worked yet?"
        hint="The most honest answer here is the most useful one."
        placeholder="Be real with me."
        {...register('whyFailed')}
        error={errors.whyFailed?.message}
      />
    </div>
  );
}
