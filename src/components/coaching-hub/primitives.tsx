// src/components/coaching-hub/primitives.tsx
//
// Unified Coaching Hub — shared light-glassmorphism primitives. Server-safe
// (no hooks). Accent is emerald (the maxhealthcoaching brand colour used across
// the existing coach UI + transactional emails).

import { cn } from '@/lib/utils';
import type { Severity, Flag } from '@/lib/coaching-derive';

export const GLASS =
  'rounded-2xl border border-white/70 bg-white/60 backdrop-blur-xl shadow-[0_8px_30px_rgba(31,45,90,0.10)]';

export function GlassCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn(GLASS, className)}>{children}</div>;
}

/** Soft light gradient-mesh background for the hub surfaces. */
export function HubBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#eaf0fb] via-[#f5f8fc] to-[#eafaf6]" />
      <div className="absolute -left-24 -top-24 size-96 rounded-full bg-sky-300/30 blur-3xl" />
      <div className="absolute right-0 top-1/3 size-96 rounded-full bg-violet-300/25 blur-3xl" />
      <div className="absolute bottom-0 left-1/3 size-96 rounded-full bg-emerald-300/25 blur-3xl" />
    </div>
  );
}

export function severityText(sev?: Severity): string {
  switch (sev) {
    case 'good':
      return 'text-emerald-600';
    case 'warn':
      return 'text-amber-600';
    case 'bad':
      return 'text-rose-600';
    default:
      return 'text-slate-500';
  }
}

function severityChip(sev?: Severity): string {
  switch (sev) {
    case 'good':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'bad':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'warn':
    default:
      return 'bg-amber-50 text-amber-700 border-amber-200';
  }
}

export function FlagChip({ flag }: { flag: Flag }) {
  return (
    <span
      title={flag.detail}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium',
        severityChip(flag.severity),
      )}
    >
      <span className="text-[10px]">{flag.severity === 'bad' ? '⚠' : flag.severity === 'good' ? '✓' : '⚠'}</span>
      {flag.label}
    </span>
  );
}

export function DirectionArrow({ direction }: { direction: 'up' | 'down' | 'flat' }) {
  const ch = direction === 'up' ? '↗' : direction === 'down' ? '↘' : '→';
  return <span className="text-slate-400">{ch}</span>;
}

/**
 * Inline SVG sparkline. No chart lib — renders a polyline normalised to the
 * series min/max. Oldest → newest left to right.
 */
export function Sparkline({
  series,
  width = 96,
  height = 28,
  className,
}: {
  series: number[];
  width?: number;
  height?: number;
  className?: string;
}) {
  const pts = series.filter((n) => typeof n === 'number' && !Number.isNaN(n));
  if (pts.length < 2) {
    return (
      <svg width={width} height={height} className={className} aria-hidden>
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="3 3" />
      </svg>
    );
  }
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const span = max - min || 1;
  const stepX = width / (pts.length - 1);
  const coords = pts.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / span) * (height - 4) - 2;
    return [x, y] as const;
  });
  const d = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const rising = pts[pts.length - 1] >= pts[0];
  const stroke = rising ? '#059669' : '#e11d48';
  const [lastX, lastY] = coords[coords.length - 1];

  return (
    <svg width={width} height={height} className={className} aria-hidden>
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r={2} fill={stroke} />
    </svg>
  );
}
