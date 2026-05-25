'use client';

import { cn } from '@/lib/utils';

interface ScaleFieldProps {
  label: string;
  hint?: string;
  error?: string;
  value: number | undefined;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  leftLabel?: string;
  rightLabel?: string;
}

export function ScaleField({
  label,
  hint,
  error,
  value,
  onChange,
  min = 1,
  max = 10,
  leftLabel,
  rightLabel,
}: ScaleFieldProps) {
  const items = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium text-foreground">{label}</span>
      <div className="rounded-xl border border-border bg-card/40 p-3">
        <div className="flex flex-wrap gap-1.5">
          {items.map((n) => {
            const selected = value === n;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onChange(n)}
                aria-pressed={selected}
                className={cn(
                  'min-w-[40px] flex-1 rounded-md border px-2 py-2 text-sm font-medium transition-all',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground shadow-[0_0_18px_-2px] shadow-primary/40'
                    : 'border-border bg-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground',
                )}
              >
                {n}
              </button>
            );
          })}
        </div>
        {(leftLabel || rightLabel) && (
          <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground/70">
            <span>{leftLabel}</span>
            <span>{rightLabel}</span>
          </div>
        )}
      </div>
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
