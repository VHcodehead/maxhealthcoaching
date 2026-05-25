'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { TextareaField } from '@/components/marketing/FormField';
import { ScaleField } from '@/components/marketing/ScaleField';
import type { ApplicationInput } from '@/lib/coaching/schemas';

export function Step6Final() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ApplicationInput>();

  return (
    <div className="space-y-6">
      <TextareaField
        label="What would make this coaching worth it to you?"
        placeholder="If you finished the next 12 weeks and said 'that was worth every dollar' — what happened?"
        {...register('whatWorthIt')}
        error={errors.whatWorthIt?.message}
      />

      <Controller
        control={control}
        name="readinessScore"
        render={({ field }) => (
          <ScaleField
            label="On a scale of 1–10, how ready are you to actually execute?"
            value={field.value}
            onChange={field.onChange}
            min={1}
            max={10}
            leftLabel="Just exploring"
            rightLabel="Locked in"
            error={errors.readinessScore?.message}
          />
        )}
      />

      <TextareaField
        label="Anything else you want me to know?"
        optional
        rows={3}
        placeholder="The stuff that didn't fit anywhere else."
        {...register('anythingElse')}
        error={errors.anythingElse?.message}
      />
    </div>
  );
}
