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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import type { Exercise, TrainingDay } from '@/types/database'

interface EditTrainingDayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  day: TrainingDay
  weekIndex: number
  dayIndex: number
  onSave: (weekIndex: number, dayIndex: number, updatedDay: TrainingDay) => void
}

export function EditTrainingDayDialog({
  open,
  onOpenChange,
  day,
  weekIndex,
  dayIndex,
  onSave,
}: EditTrainingDayDialogProps) {
  const [saving, setSaving] = useState(false)
  const [exercises, setExercises] = useState<Exercise[]>(
    day.exercises.map((ex) => ({ ...ex }))
  )

  // Day-level fields
  const [dayName, setDayName] = useState(day.day_name || day.day || '')
  const [sessionName, setSessionName] = useState(day.session_name || day.name || '')
  const [muscleGroups, setMuscleGroups] = useState(
    day.muscle_groups?.join(', ') || ''
  )
  const [warmup, setWarmup] = useState(day.warmup?.join('\n') || '')
  const [cooldown, setCooldown] = useState(day.cooldown || '')
  const [dayNotes, setDayNotes] = useState(day.notes || '')

  // Cardio
  const [cardioEnabled, setCardioEnabled] = useState(!!day.cardio)
  const [cardioType, setCardioType] = useState(day.cardio?.type || '')
  const [cardioDuration, setCardioDuration] = useState(
    day.cardio?.duration_minutes || 20
  )

  const handleExerciseChange = (
    index: number,
    field: keyof Exercise,
    value: string | number | string[]
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
        day_name: dayName,
        day: dayName,
        session_name: sessionName,
        name: sessionName,
        muscle_groups: muscleGroups
          ? muscleGroups.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
        warmup: warmup
          ? warmup.split('\n').map((s) => s.trim()).filter(Boolean)
          : [],
        cooldown: cooldown || undefined,
        notes: dayNotes || undefined,
        cardio: cardioEnabled && cardioType
          ? { type: cardioType, duration_minutes: cardioDuration }
          : null,
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
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            Edit: {day.day_name || day.day} - {day.session_name || day.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details">
          <TabsList>
            <TabsTrigger value="details">Day Details</TabsTrigger>
            <TabsTrigger value="exercises">Exercises</TabsTrigger>
          </TabsList>

          {/* Tab 1: Day Details */}
          <TabsContent value="details" className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Day Name</Label>
                <Input
                  value={dayName}
                  onChange={(e) => setDayName(e.target.value)}
                  placeholder="e.g. Monday"
                />
              </div>
              <div>
                <Label className="text-xs">Session Name</Label>
                <Input
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="e.g. Upper Body A"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Muscle Groups (comma-separated)</Label>
              <Input
                value={muscleGroups}
                onChange={(e) => setMuscleGroups(e.target.value)}
                placeholder="e.g. Chest, Shoulders, Triceps"
              />
            </div>

            <div>
              <Label className="text-xs">Warmup (one item per line)</Label>
              <textarea
                value={warmup}
                onChange={(e) => setWarmup(e.target.value)}
                placeholder={"5 min light cardio\nArm circles\nBand pull-aparts"}
                rows={3}
                className="border-input mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              />
            </div>

            <div>
              <Label className="text-xs">Cooldown</Label>
              <Input
                value={cooldown}
                onChange={(e) => setCooldown(e.target.value)}
                placeholder="e.g. 5 min stretching"
              />
            </div>

            {/* Cardio toggle */}
            <div className="space-y-2 rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cardio-toggle"
                  checked={cardioEnabled}
                  onChange={(e) => setCardioEnabled(e.target.checked)}
                  className="size-4 rounded border-gray-300"
                />
                <Label htmlFor="cardio-toggle" className="text-xs">
                  Include Cardio
                </Label>
              </div>
              {cardioEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Type</Label>
                    <Input
                      value={cardioType}
                      onChange={(e) => setCardioType(e.target.value)}
                      placeholder="e.g. Incline walk"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={cardioDuration}
                      onChange={(e) =>
                        setCardioDuration(Number(e.target.value))
                      }
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <Label className="text-xs">Day Notes</Label>
              <textarea
                value={dayNotes}
                onChange={(e) => setDayNotes(e.target.value)}
                placeholder="General coaching notes for this day..."
                rows={2}
                className="border-input mt-1 w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
              />
            </div>
          </TabsContent>

          {/* Tab 2: Exercises */}
          <TabsContent value="exercises" className="space-y-4 pt-2">
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
                    <Label className="text-xs">RIR</Label>
                    <Input
                      type="number"
                      value={ex.rir ?? ''}
                      placeholder="Reps in reserve"
                      onChange={(e) =>
                        handleExerciseChange(
                          i,
                          'rir',
                          e.target.value ? Number(e.target.value) : 0
                        )
                      }
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Intensity Technique</Label>
                    <select
                      value={ex.intensity_technique ?? 'none'}
                      onChange={(e) =>
                        handleExerciseChange(i, 'intensity_technique', e.target.value)
                      }
                      className="h-9 w-full rounded-md border bg-background px-2 text-sm"
                    >
                      <option value="none">None</option>
                      <option value="drop_set">Drop Set</option>
                      <option value="rest_pause">Rest-Pause</option>
                      <option value="superset">Superset</option>
                    </select>
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
                  <Label className="text-xs">Form Cues (comma-separated)</Label>
                  <Input
                    value={ex.form_cues?.join(', ') ?? ''}
                    placeholder="e.g. Retract scapula, Drive through heels"
                    onChange={(e) =>
                      handleExerciseChange(
                        i,
                        'form_cues',
                        e.target.value
                          ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                          : []
                      )
                    }
                  />
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
          </TabsContent>
        </Tabs>

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
