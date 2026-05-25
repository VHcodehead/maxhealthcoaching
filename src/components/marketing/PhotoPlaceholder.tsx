'use client';

import { ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoPlaceholderProps {
  label?: string;
  aspect?: string;
  className?: string;
  variant?: 'flat' | 'subtle' | 'spotlight';
}

const variants: Record<NonNullable<PhotoPlaceholderProps['variant']>, string> = {
  flat: 'bg-gradient-to-br from-zinc-900 via-zinc-950 to-black',
  subtle: 'bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-black',
  spotlight:
    'bg-[radial-gradient(circle_at_50%_50%,oklch(0.696_0.17_162.48_/_0.12),transparent_70%),linear-gradient(to_bottom_right,#0a0a0a,#000)]',
};

export function PhotoPlaceholder({
  label,
  aspect = '4/5',
  className,
  variant = 'flat',
}: PhotoPlaceholderProps) {
  return (
    <div
      className={cn(
        'relative flex items-center justify-center overflow-hidden rounded-2xl border border-border/60',
        variants[variant],
        className,
      )}
      style={aspect === 'auto' ? undefined : { aspectRatio: aspect }}
    >
      <div className="text-center text-muted-foreground/35">
        <ImageIcon className="mx-auto mb-1.5 h-7 w-7" strokeWidth={1.25} />
        {label && (
          <p className="px-3 text-[10px] uppercase tracking-[0.18em]">{label}</p>
        )}
      </div>
    </div>
  );
}
