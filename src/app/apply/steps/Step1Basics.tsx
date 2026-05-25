'use client';

import { useFormContext } from 'react-hook-form';
import { TextField } from '@/components/marketing/FormField';
import type { ApplicationInput } from '@/lib/coaching/schemas';

export function Step1Basics() {
  const {
    register,
    formState: { errors },
  } = useFormContext<ApplicationInput>();

  return (
    <div className="space-y-5">
      <TextField
        label="Full name"
        placeholder="Jane Doe"
        autoComplete="name"
        {...register('name')}
        error={errors.name?.message}
      />
      <TextField
        label="Email"
        type="email"
        placeholder="you@example.com"
        autoComplete="email"
        {...register('email')}
        error={errors.email?.message}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Phone"
          type="tel"
          placeholder="(555) 555-5555"
          autoComplete="tel"
          optional
          {...register('phone')}
          error={errors.phone?.message}
        />
        <TextField
          label="Instagram / TikTok"
          placeholder="@yourhandle"
          optional
          {...register('socialHandle')}
          error={errors.socialHandle?.message}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Age"
          type="number"
          inputMode="numeric"
          placeholder="28"
          {...register('age', { valueAsNumber: true })}
          error={errors.age?.message}
        />
        <TextField
          label="Timezone or city"
          placeholder="EST / New York"
          {...register('timezone')}
          error={errors.timezone?.message}
        />
      </div>
    </div>
  );
}
