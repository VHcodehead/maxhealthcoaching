'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface FieldShellProps {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: React.ReactNode;
  htmlFor?: string;
}

export function FieldShell({ label, hint, error, optional, children, htmlFor }: FieldShellProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor={htmlFor}
        className="flex items-baseline justify-between text-sm font-medium text-foreground"
      >
        <span>{label}</span>
        {optional && <span className="text-xs font-normal text-muted-foreground">optional</span>}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

const fieldBase =
  'w-full rounded-lg border border-border bg-input/40 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 outline-none transition-colors focus:border-primary/60 focus:bg-input/60 focus:ring-2 focus:ring-primary/30 aria-[invalid=true]:border-destructive/60 aria-[invalid=true]:ring-destructive/20';

interface DecoratedProps {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
}

type InputBase = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'children' | 'name'>;
type TextFieldProps = DecoratedProps & InputBase & { name: string };

export const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, hint, error, optional, name, className, ...rest },
  ref,
) {
  const id = rest.id ?? `f-${name}`;
  return (
    <FieldShell label={label} hint={hint} error={error} optional={optional} htmlFor={id}>
      <input
        ref={ref}
        id={id}
        name={name}
        aria-invalid={!!error}
        className={cn(fieldBase, className)}
        {...rest}
      />
    </FieldShell>
  );
});

type TextareaBase = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'children' | 'name'>;
type TextareaFieldProps = DecoratedProps & TextareaBase & { name: string };

export const TextareaField = React.forwardRef<HTMLTextAreaElement, TextareaFieldProps>(
  function TextareaField({ label, hint, error, optional, name, className, ...rest }, ref) {
    const id = rest.id ?? `f-${name}`;
    return (
      <FieldShell label={label} hint={hint} error={error} optional={optional} htmlFor={id}>
        <textarea
          ref={ref}
          id={id}
          name={name}
          rows={rest.rows ?? 4}
          aria-invalid={!!error}
          className={cn(fieldBase, 'min-h-[88px] resize-y leading-relaxed', className)}
          {...rest}
        />
      </FieldShell>
    );
  },
);
