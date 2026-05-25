import { cn } from '@/lib/utils';

interface BrandWordmarkProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-2xl',
};

export function BrandWordmark({ className, size = 'md' }: BrandWordmarkProps) {
  return (
    <span
      className={cn(
        'font-bold tracking-tight text-foreground select-none',
        sizes[size],
        className,
      )}
    >
      Coach<span className="text-primary">Max</span>
    </span>
  );
}
