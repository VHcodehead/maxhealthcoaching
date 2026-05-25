'use client';

import { Controller, useFormContext } from 'react-hook-form';
import { TextareaField } from '@/components/marketing/FormField';
import { RadioCardGroup } from '@/components/marketing/RadioCardGroup';
import {
  FINANCIAL_OPTIONS,
  SERIOUSNESS_OPTIONS,
  type ApplicationInput,
  type FinancialReadiness,
  type Seriousness,
  type TriAnswer,
} from '@/lib/coaching/schemas';

const TRI_OPTIONS: { value: TriAnswer; label: string }[] = [
  { value: 'yes', label: 'Yes' },
  { value: 'sort_of', label: 'I think so' },
  { value: 'not_sure', label: 'Not sure' },
];

export function Step4Readiness() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<ApplicationInput>();

  return (
    <div className="space-y-7">
      <TextareaField
        label="Why do you want a coach instead of figuring it out alone?"
        placeholder="What changes when someone else is steering the plan?"
        {...register('whyCoach')}
        error={errors.whyCoach?.message}
      />

      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">
          Ready to be honest with food logs, check-ins, training, and adherence?
        </span>
        <Controller
          control={control}
          name="honesty"
          render={({ field }) => (
            <RadioCardGroup<TriAnswer>
              name={field.name}
              options={TRI_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.honesty?.message}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">
          Willing to follow a structured plan even when motivation drops?
        </span>
        <Controller
          control={control}
          name="structure"
          render={({ field }) => (
            <RadioCardGroup<TriAnswer>
              name={field.name}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'sort_of', label: 'I need accountability for that' },
                { value: 'not_sure', label: 'Not sure' },
              ]}
              value={field.value}
              onChange={field.onChange}
              error={errors.structure?.message}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">
          How serious are you about changing your physique right now?
        </span>
        <Controller
          control={control}
          name="seriousness"
          render={({ field }) => (
            <RadioCardGroup<Seriousness>
              name={field.name}
              options={SERIOUSNESS_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.seriousness?.message}
            />
          )}
        />
      </div>

      <div className="space-y-2">
        <span className="block text-sm font-medium text-foreground">
          Ready to make a financial commitment to yourself?
        </span>
        <Controller
          control={control}
          name="financialReadiness"
          render={({ field }) => (
            <RadioCardGroup<FinancialReadiness>
              name={field.name}
              options={FINANCIAL_OPTIONS}
              value={field.value}
              onChange={field.onChange}
              error={errors.financialReadiness?.message}
            />
          )}
        />
      </div>
    </div>
  );
}
