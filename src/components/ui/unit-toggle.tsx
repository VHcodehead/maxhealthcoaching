'use client'

import type { UnitSystem } from '@/lib/units'

interface UnitToggleProps {
  system: UnitSystem
  onToggle: (system: UnitSystem) => void
}

export function UnitToggle({ system, onToggle }: UnitToggleProps) {
  return (
    <div className="inline-flex rounded-lg border border-zinc-200 bg-zinc-100 p-0.5 text-xs font-medium">
      <button
        type="button"
        className={`rounded-md px-2.5 py-1 transition-colors ${
          system === 'imperial'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
        onClick={() => onToggle('imperial')}
      >
        lbs/in
      </button>
      <button
        type="button"
        className={`rounded-md px-2.5 py-1 transition-colors ${
          system === 'metric'
            ? 'bg-white text-zinc-900 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
        onClick={() => onToggle('metric')}
      >
        kg/cm
      </button>
    </div>
  )
}
