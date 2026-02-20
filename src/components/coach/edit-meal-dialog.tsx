'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import type { Meal, Ingredient } from '@/types/database'

interface EditMealDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  meal: Meal
  dayIndex: number
  mealIndex: number
  onSave: (dayIndex: number, mealIndex: number, updatedMeal: Meal) => void
}

export function EditMealDialog({
  open,
  onOpenChange,
  meal,
  dayIndex,
  mealIndex,
  onSave,
}: EditMealDialogProps) {
  const [saving, setSaving] = useState(false)
  const [recipeTitle, setRecipeTitle] = useState(meal.recipe_title)
  const [ingredients, setIngredients] = useState<Ingredient[]>(
    meal.ingredients.map((i) => ({ ...i }))
  )
  const [instructions, setInstructions] = useState(meal.instructions.join('\n'))
  const [macros, setMacros] = useState({ ...meal.macro_totals })

  const handleIngredientChange = (
    index: number,
    field: keyof Ingredient,
    value: string
  ) => {
    setIngredients((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addIngredient = () => {
    setIngredients((prev) => [...prev, { name: '', amount: '', unit: 'g' }])
  }

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updatedMeal: Meal = {
        ...meal,
        recipe_title: recipeTitle,
        ingredients: ingredients.filter((i) => i.name.trim() !== ''),
        instructions: instructions
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        macro_totals: macros,
      }
      onSave(dayIndex, mealIndex, updatedMeal)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Meal: {meal.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipe Title */}
          <div>
            <Label>Recipe Title</Label>
            <Input
              value={recipeTitle}
              onChange={(e) => setRecipeTitle(e.target.value)}
              className="mt-1"
            />
          </div>

          {/* Ingredients */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Ingredients</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIngredient}
              >
                <Plus className="mr-1 size-3" />
                Add
              </Button>
            </div>
            <div className="space-y-2">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Name"
                    value={ing.name}
                    onChange={(e) =>
                      handleIngredientChange(i, 'name', e.target.value)
                    }
                    className="flex-[3]"
                  />
                  <Input
                    placeholder="Amount"
                    value={ing.amount}
                    onChange={(e) =>
                      handleIngredientChange(i, 'amount', e.target.value)
                    }
                    className="flex-1"
                  />
                  <Input
                    placeholder="Unit"
                    value={ing.unit}
                    onChange={(e) =>
                      handleIngredientChange(i, 'unit', e.target.value)
                    }
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(i)}
                    className="shrink-0"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div>
            <Label>Instructions (one per line)</Label>
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={4}
              className="border-input mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
            />
          </div>

          {/* Macro Totals */}
          <div>
            <Label>Macro Totals</Label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              <div>
                <span className="text-xs text-muted-foreground">Calories</span>
                <Input
                  type="number"
                  value={macros.calories}
                  onChange={(e) =>
                    setMacros((prev) => ({
                      ...prev,
                      calories: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Protein (g)</span>
                <Input
                  type="number"
                  value={macros.protein}
                  onChange={(e) =>
                    setMacros((prev) => ({
                      ...prev,
                      protein: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Carbs (g)</span>
                <Input
                  type="number"
                  value={macros.carbs}
                  onChange={(e) =>
                    setMacros((prev) => ({
                      ...prev,
                      carbs: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div>
                <span className="text-xs text-muted-foreground">Fat (g)</span>
                <Input
                  type="number"
                  value={macros.fat}
                  onChange={(e) =>
                    setMacros((prev) => ({
                      ...prev,
                      fat: Number(e.target.value),
                    }))
                  }
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
