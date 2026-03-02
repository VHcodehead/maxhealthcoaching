'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, AlertTriangle, Check, X, Minus, Plus } from 'lucide-react'
import { calculateMacros } from '@/lib/macros'
import { useUnits } from '@/hooks/use-units'
import type { PendingMacroAdjustment } from '@/types/database'

interface PendingMacroReviewProps {
  adjustment: PendingMacroAdjustment
  clientGoal?: string
  clientBodyFatPercentage?: number
  onResolved: () => void
}

export function PendingMacroReview({
  adjustment,
  clientGoal,
  clientBodyFatPercentage,
  onResolved,
}: PendingMacroReviewProps) {
  const units = useUnits()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [coachNote, setCoachNote] = useState('')
  const [calorieTarget, setCalorieTarget] = useState(adjustment.proposed_calories)
  const [protein, setProtein] = useState(adjustment.proposed_protein_g)
  const [fat, setFat] = useState(adjustment.proposed_fat_g)
  const [carbs, setCarbs] = useState(adjustment.proposed_carbs_g)

  // Recalculate macros when coach changes calorie target
  useEffect(() => {
    if (calorieTarget !== adjustment.proposed_calories) {
      const recalc = calculateMacros(
        calorieTarget,
        adjustment.new_weight_kg,
        clientGoal ?? 'recomp',
        clientBodyFatPercentage
      )
      setProtein(recalc.protein)
      setFat(recalc.fat)
      setCarbs(recalc.carbs)
    } else {
      setProtein(adjustment.proposed_protein_g)
      setFat(adjustment.proposed_fat_g)
      setCarbs(adjustment.proposed_carbs_g)
    }
  }, [calorieTarget, adjustment, clientGoal, clientBodyFatPercentage])

  const handleAction = async (action: 'approve' | 'dismiss') => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/macro-adjustments/${adjustment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          calorie_target: action === 'approve' ? calorieTarget : undefined,
          coach_note: coachNote || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `Failed to ${action} adjustment`)
      }

      onResolved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSaving(false)
    }
  }

  const weightDiff = adjustment.new_weight_kg - adjustment.previous_weight_kg
  const weightSign = weightDiff > 0 ? '+' : ''
  const calorieDiff = calorieTarget - adjustment.current_calories
  const calorieSign = calorieDiff > 0 ? '+' : ''

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 space-y-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="size-5 text-amber-600 mt-0.5 shrink-0" />
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            Macro Adjustment Pending Review
          </h3>
          <p className="text-sm text-amber-700">
            Weight change detected — review and approve or dismiss the proposed macro update.
          </p>
        </div>
      </div>

      {/* Weight change context */}
      <div className="rounded-md bg-white/60 p-3">
        <p className="text-sm font-medium text-amber-900">Weight Change</p>
        <p className="text-lg font-bold text-amber-800">
          {units.displayWeight(adjustment.previous_weight_kg)} → {units.displayWeight(adjustment.new_weight_kg)}{' '}
          <span className={weightDiff < 0 ? 'text-emerald-600' : 'text-amber-600'}>
            ({weightSign}{units.system === 'imperial' ? (units.kgToLbs(weightDiff)).toFixed(1) : weightDiff.toFixed(1)} {units.weightUnit})
          </span>
        </p>
      </div>

      {/* Current vs Proposed comparison */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-md bg-white/60 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">Current Macros</p>
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Calories:</span> <span className="font-medium">{adjustment.current_calories}</span></p>
            <p><span className="text-muted-foreground">Protein:</span> <span className="font-medium">{adjustment.current_protein_g}g</span></p>
            <p><span className="text-muted-foreground">Carbs:</span> <span className="font-medium">{adjustment.current_carbs_g}g</span></p>
            <p><span className="text-muted-foreground">Fat:</span> <span className="font-medium">{adjustment.current_fat_g}g</span></p>
          </div>
        </div>
        <div className="rounded-md bg-amber-100/50 p-3 border border-amber-200">
          <p className="text-xs font-medium text-amber-800 mb-2">Proposed Macros</p>
          <div className="space-y-1 text-sm">
            <p><span className="text-muted-foreground">Calories:</span> <span className="font-bold text-amber-900">{adjustment.proposed_calories}</span></p>
            <p><span className="text-muted-foreground">Protein:</span> <span className="font-medium">{adjustment.proposed_protein_g}g</span></p>
            <p><span className="text-muted-foreground">Carbs:</span> <span className="font-medium">{adjustment.proposed_carbs_g}g</span></p>
            <p><span className="text-muted-foreground">Fat:</span> <span className="font-medium">{adjustment.proposed_fat_g}g</span></p>
          </div>
        </div>
      </div>

      {/* Coach calorie target adjustment */}
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Calorie Target (adjustable)</Label>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setCalorieTarget((prev) => prev - 50)}
            disabled={saving}
          >
            <Minus className="size-3" />
          </Button>
          <Input
            type="number"
            value={calorieTarget}
            onChange={(e) => setCalorieTarget(Number(e.target.value))}
            className="w-28 text-center"
            disabled={saving}
          />
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => setCalorieTarget((prev) => prev + 50)}
            disabled={saving}
          >
            <Plus className="size-3" />
          </Button>
          <span className="text-sm text-muted-foreground">
            ({calorieSign}{calorieDiff} from current)
          </span>
        </div>

        {calorieTarget !== adjustment.proposed_calories && (
          <div className="rounded-md bg-white/60 p-2 text-sm">
            <p className="text-muted-foreground">
              Adjusted macros: <span className="font-medium">{protein}g P</span> / <span className="font-medium">{carbs}g C</span> / <span className="font-medium">{fat}g F</span>
            </p>
          </div>
        )}
      </div>

      {/* Coach note */}
      <div>
        <Label className="text-xs">Coach Note (optional)</Label>
        <textarea
          value={coachNote}
          onChange={(e) => setCoachNote(e.target.value)}
          placeholder="Reason for adjustment..."
          rows={2}
          className="border-input mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
          disabled={saving}
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={() => handleAction('approve')}
          disabled={saving}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? (
            <Loader2 className="mr-1 size-3 animate-spin" />
          ) : (
            <Check className="mr-1 size-3" />
          )}
          Approve & Update Macros
        </Button>
        <Button
          variant="ghost"
          onClick={() => handleAction('dismiss')}
          disabled={saving}
          size="sm"
        >
          <X className="mr-1 size-3" />
          Dismiss
        </Button>
      </div>
    </div>
  )
}
