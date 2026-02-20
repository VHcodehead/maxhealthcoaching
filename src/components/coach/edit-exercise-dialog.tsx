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
import type { Exercise, TrainingDay } from '@/types/database'

interface EditExerciseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  day: TrainingDay
  weekIndex: number
  dayIndex: number
  onSave: (weekIndex: number, dayIndex: number, updatedDay: TrainingDay) => void
}

export function EditExerciseDialog({
  open,
  onOpenChange,
  day,
  weekIndex,
  dayIndex,
  onSave,
}: EditExerciseDialogProps) {
  const [saving, setSaving] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>(
    day.exercises.map((ex) => ({ ...ex }))
  )

  const handleExerciseChange = (
    index: number,
    field: keyof Exercise,
    value: string | number
  ) => {
    setExercises((prev) => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const addExercise = () => {
    setExercises((prev) => [
      ...prev,
      {
        name: '',
        sets: 3,
        reps: '8-12',
        rest_seconds: 90,
        notes: '',
        substitution: '',
      },
    ])
  }

  const removeExercise = (index: number) => {
    setExercises((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updatedDay: TrainingDay = {
        ...day,
        exercises: exercises.filter((ex) => ex.name.trim() !== ''),
      }
      onSave(weekIndex, dayIndex, updatedDay)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Edit: {day.day} - {day.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base">Exercises</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addExercise}
            >
              <Plus className="mr-1 size-3" />
              Add Exercise
            </Button>
          </div>

          {exercises.map((ex, i) => (
            <div
              key={i}
              className="space-y-2 rounded-lg border p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-muted-foreground">
                  Exercise {i + 1}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExercise(i)}
                >
                  <Trash2 className="size-4 text-destructive" />
                </Button>
              </div>

              <div>
                <Label className="text-xs">Name</Label>
                <Input
                  value={ex.name}
                  onChange={(e) =>
                    handleExerciseChange(i, 'name', e.target.value)
                  }
                />
              </div>

              <div className="grid grid-cols-4 gap-2">
                <div>
                  <Label className="text-xs">Sets</Label>
                  <Input
                    type="number"
                    value={ex.sets}
                    onChange={(e) =>
                      handleExerciseChange(i, 'sets', Number(e.target.value))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Reps</Label>
                  <Input
                    value={ex.reps}
                    onChange={(e) =>
                      handleExerciseChange(i, 'reps', e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">RPE</Label>
                  <Input
                    type="number"
                    value={ex.rpe ?? ''}
                    onChange={(e) =>
                      handleExerciseChange(
                        i,
                        'rpe',
                        e.target.value ? Number(e.target.value) : 0
                      )
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Rest (sec)</Label>
                  <Input
                    type="number"
                    value={ex.rest_seconds}
                    onChange={(e) =>
                      handleExerciseChange(
                        i,
                        'rest_seconds',
                        Number(e.target.value)
                      )
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Tempo</Label>
                  <Input
                    value={ex.tempo ?? ''}
                    placeholder="e.g. 3-1-1-0 or controlled"
                    onChange={(e) =>
                      handleExerciseChange(i, 'tempo', e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs">Substitution</Label>
                  <Input
                    value={ex.substitution ?? ''}
                    placeholder="Alternative exercise"
                    onChange={(e) =>
                      handleExerciseChange(i, 'substitution', e.target.value)
                    }
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Notes</Label>
                <Input
                  value={ex.notes ?? ''}
                  placeholder="Coaching notes for this exercise"
                  onChange={(e) =>
                    handleExerciseChange(i, 'notes', e.target.value)
                  }
                />
              </div>
            </div>
          ))}
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
