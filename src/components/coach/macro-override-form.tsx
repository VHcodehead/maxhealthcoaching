'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface MacroOverrideFormProps {
  clientId: string
  currentCalories?: number
  currentProtein?: number
  currentCarbs?: number
  currentFat?: number
  onSaved: (macros: {
    calorie_target: number
    protein_g: number
    carbs_g: number
    fat_g: number
    formula_used: string
    version: number
  }) => void
}

export function MacroOverrideForm({
  clientId,
  currentCalories,
  currentProtein,
  currentCarbs,
  currentFat,
  onSaved,
}: MacroOverrideFormProps) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [calories, setCalories] = useState(currentCalories ?? 2000)
  const [protein, setProtein] = useState(currentProtein ?? 150)
  const [carbs, setCarbs] = useState(currentCarbs ?? 200)
  const [fat, setFat] = useState(currentFat ?? 70)
  const [explanation, setExplanation] = useState('')

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/macros', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: clientId,
          calorie_target: calories,
          protein_g: protein,
          carbs_g: carbs,
          fat_g: fat,
          explanation: explanation || 'Coach manual override',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to override macros')
      }

      const data = await res.json()
      onSaved({
        calorie_target: data.macroTarget.calorieTarget,
        protein_g: data.macroTarget.proteinG,
        carbs_g: data.macroTarget.carbsG,
        fat_g: data.macroTarget.fatG,
        formula_used: data.macroTarget.formulaUsed,
        version: data.macroTarget.version,
      })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        Override Macros
      </Button>
    )
  }

  return (
    <div className="mt-4 space-y-3 rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Coach Macro Override</Label>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <Label className="text-xs">Calories</Label>
          <Input
            type="number"
            value={calories}
            onChange={(e) => setCalories(Number(e.target.value))}
          />
        </div>
        <div>
          <Label className="text-xs">Protein (g)</Label>
          <Input
            type="number"
            value={protein}
            onChange={(e) => setProtein(Number(e.target.value))}
          />
        </div>
        <div>
          <Label className="text-xs">Carbs (g)</Label>
          <Input
            type="number"
            value={carbs}
            onChange={(e) => setCarbs(Number(e.target.value))}
          />
        </div>
        <div>
          <Label className="text-xs">Fat (g)</Label>
          <Input
            type="number"
            value={fat}
            onChange={(e) => setFat(Number(e.target.value))}
          />
        </div>
      </div>

      <div>
        <Label className="text-xs">Note (optional)</Label>
        <textarea
          value={explanation}
          onChange={(e) => setExplanation(e.target.value)}
          placeholder="Reason for override..."
          rows={2}
          className="border-input mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button onClick={handleSave} disabled={saving} size="sm">
        {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
        Save Override
      </Button>
    </div>
  )
}
