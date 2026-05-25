'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

type Option<V extends string> = { value: V; label: string; sub?: string };

interface BaseProps<V extends string> {
  options: ReadonlyArray<Option<V>>;
  name: string;
  error?: string;
}

interface SingleProps<V extends string> extends BaseProps<V> {
  mode?: 'single';
  value: V | undefined;
  onChange: (v: V) => void;
}

interface MultiProps<V extends string> extends BaseProps<V> {
  mode: 'multi';
  value: V[];
  onChange: (v: V[]) => void;
}

export function RadioCardGroup<V extends string>(props: SingleProps<V> | MultiProps<V>) {
  const isMulti = props.mode === 'multi';

  const isSelected = (val: V) =>
    isMulti ? (props as MultiProps<V>).value.includes(val) : (props as SingleProps<V>).value === val;

  const onSelect = (val: V) => {
    if (isMulti) {
      const p = props as MultiProps<V>;
      p.onChange(p.value.includes(val) ? p.value.filter((v) => v !== val) : [...p.value, val]);
    } else {
      (props as SingleProps<V>).onChange(val);
    }
  };

  return (
    <div className="space-y-2" role={isMulti ? 'group' : 'radiogroup'} aria-invalid={!!props.error}>
      {props.options.map((opt) => {
        const selected = isSelected(opt.value);
        return (
          <button
            key={opt.value}
            type="button"
            role={isMulti ? 'checkbox' : 'radio'}
            aria-checked={selected}
            onClick={() => onSelect(opt.value)}
            className={cn(
              'group relative flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left transition-all',
              'min-h-[56px]',
              selected
                ? 'border-primary bg-primary/10 ring-2 ring-primary/40'
                : 'border-border bg-card/40 hover:bg-card hover:border-primary/40',
            )}
          >
            <span
              className={cn(
                'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                selected ? 'border-primary bg-primary' : 'border-muted-foreground/40 bg-transparent',
                isMulti && 'rounded-md',
              )}
            >
              {selected && <Check className="h-3 w-3 text-primary-foreground" strokeWidth={3} />}
            </span>
            <span className="flex-1">
              <span className="block text-sm font-medium text-foreground">{opt.label}</span>
              {opt.sub && (
                <span className="mt-0.5 block text-xs text-muted-foreground">{opt.sub}</span>
              )}
            </span>
          </button>
        );
      })}
      {props.error && <p className="pt-1 text-xs text-destructive">{props.error}</p>}
    </div>
  );
}
