'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  RefreshCw,
  User,
  Target,
  Utensils,
  Dumbbell,
  ClipboardCheck,
  Camera,
  ChevronDown,
  ChevronUp,
  Scale,
  Ruler,
  Moon,
  Footprints,
  Pencil,
} from 'lucide-react'
import type {
  Profile,
  OnboardingResponse,
  MacroTargets,
  MealPlan,
  TrainingPlan,
  CheckIn,
  ProgressPhoto,
  Meal,
  TrainingDay,
} from '@/types/database'
import { EditMealDialog } from '@/components/coach/edit-meal-dialog'
import { EditExerciseDialog } from '@/components/coach/edit-exercise-dialog'
import { MacroOverrideForm } from '@/components/coach/macro-override-form'
import { CoachNotes } from '@/components/coach/coach-notes'

interface CheckInWithPhotos extends CheckIn {
  progress_photos: (ProgressPhoto & { url?: string })[]
}

export default function ClientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [onboarding, setOnboarding] = useState<OnboardingResponse | null>(null)
  const [macros, setMacros] = useState<MacroTargets | null>(null)
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null)
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null)
  const [checkIns, setCheckIns] = useState<CheckInWithPhotos[]>([])

  const [regeneratingMeal, setRegeneratingMeal] = useState(false)
  const [regeneratingTraining, setRegeneratingTraining] = useState(false)

  // Editing state
  const [editingMeal, setEditingMeal] = useState<{
    dayIndex: number
    mealIndex: number
    meal: Meal
  } | null>(null)
  const [editingExercise, setEditingExercise] = useState<{
    weekIndex: number
    dayIndex: number
    day: TrainingDay
  } | null>(null)
  const [savingMealEdit, setSavingMealEdit] = useState(false)
  const [savingTrainingEdit, setSavingTrainingEdit] = useState(false)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    onboarding: false,
    macros: true,
    mealPlan: false,
    trainingPlan: false,
    checkIns: true,
    photos: false,
  })

  // Photo comparison state
  const [compareWeekA, setCompareWeekA] = useState<number | null>(null)
  const [compareWeekB, setCompareWeekB] = useState<number | null>(null)

  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(`/api/admin/clients/${clientId}`)
      if (!res.ok) {
        throw new Error('Failed to load client data')
      }

      const data = await res.json()

      setProfile(data.profile || null)
      setOnboarding(data.onboarding || null)
      setMacros(data.macros || null)
      setMealPlan(data.mealPlan || null)
      setTrainingPlan(data.trainingPlan || null)
      setCheckIns((data.checkIns as CheckInWithPhotos[]) || [])

      // Set default comparison weeks if check-ins have photos
      const checkInsData = (data.checkIns as CheckInWithPhotos[]) || []
      const withPhotos = checkInsData.filter(
        (ci) => ci.progress_photos && ci.progress_photos.length > 0
      )
      if (withPhotos.length >= 2) {
        setCompareWeekA(withPhotos[withPhotos.length - 1].week_number)
        setCompareWeekB(withPhotos[0].week_number)
      } else if (withPhotos.length === 1) {
        setCompareWeekA(withPhotos[0].week_number)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load client data')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) {
      loadData()
    }
  }, [clientId, loadData])

  const handleRegenerateMealPlan = async () => {
    try {
      setRegeneratingMeal(true)
      const res = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: clientId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to regenerate meal plan')
      }
      const data = await res.json()
      setMealPlan(data.mealPlan)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to regenerate meal plan')
    } finally {
      setRegeneratingMeal(false)
    }
  }

  const handleRegenerateTrainingPlan = async () => {
    try {
      setRegeneratingTraining(true)
      const res = await fetch('/api/training-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: clientId,
          duration_weeks: onboarding?.plan_duration_weeks || 8,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to regenerate training plan')
      }
      const data = await res.json()
      setTrainingPlan(data.trainingPlan)
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Failed to regenerate training plan'
      )
    } finally {
      setRegeneratingTraining(false)
    }
  }

  const handleSaveMealEdit = async (
    dayIndex: number,
    mealIndex: number,
    updatedMeal: Meal
  ) => {
    if (!mealPlan) return
    setSavingMealEdit(true)
    try {
      const updatedDays = [...mealPlan.plan_data.days]
      const updatedMeals = [...updatedDays[dayIndex].meals]
      updatedMeals[mealIndex] = updatedMeal
      updatedDays[dayIndex] = { ...updatedDays[dayIndex], meals: updatedMeals }
      const updatedPlanData = { days: updatedDays }

      const res = await fetch('/api/admin/meal-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: clientId,
          plan_data: updatedPlanData,
          grocery_list: mealPlan.grocery_list,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save meal edit')
      }

      setMealPlan((prev) =>
        prev ? { ...prev, plan_data: updatedPlanData } : prev
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save meal edit')
    } finally {
      setSavingMealEdit(false)
    }
  }

  const handleSaveExerciseEdit = async (
    weekIndex: number,
    dayIndex: number,
    updatedDay: TrainingDay
  ) => {
    if (!trainingPlan) return
    setSavingTrainingEdit(true)
    try {
      const updatedWeeks = [...trainingPlan.plan_data.weeks]
      const updatedDays = [...updatedWeeks[weekIndex].days]
      updatedDays[dayIndex] = updatedDay
      updatedWeeks[weekIndex] = { ...updatedWeeks[weekIndex], days: updatedDays }
      const updatedPlanData = { ...trainingPlan.plan_data, weeks: updatedWeeks }

      const res = await fetch('/api/admin/training-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: clientId,
          plan_data: updatedPlanData,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save training edit')
      }

      setTrainingPlan((prev) =>
        prev ? { ...prev, plan_data: updatedPlanData } : prev
      )
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Failed to save training edit'
      )
    } finally {
      setSavingTrainingEdit(false)
    }
  }

  const handleMacroOverrideSaved = (overriddenMacros: {
    calorie_target: number
    protein_g: number
    carbs_g: number
    fat_g: number
    formula_used: string
    version: number
  }) => {
    setMacros((prev) =>
      prev
        ? {
            ...prev,
            calorie_target: overriddenMacros.calorie_target,
            protein_g: overriddenMacros.protein_g,
            carbs_g: overriddenMacros.carbs_g,
            fat_g: overriddenMacros.fat_g,
            formula_used: overriddenMacros.formula_used as MacroTargets['formula_used'],
            version: overriddenMacros.version,
          }
        : prev
    )
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function formatLabel(str: string) {
    return str
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <AlertTriangle className="size-12 text-destructive" />
        <p className="text-lg text-muted-foreground">
          {error || 'Client not found'}
        </p>
        <Button onClick={() => router.push('/coach/clients')}>
          Back to Clients
        </Button>
      </div>
    )
  }

  // Determine client status
  let clientStatus: 'active' | 'overdue' | 'pending' = 'pending'
  if (profile.onboarding_completed) {
    clientStatus = 'active'
    if (checkIns.length > 0) {
      const lastCI = checkIns[0]
      const daysSince =
        (Date.now() - new Date(lastCI.created_at).getTime()) /
        (1000 * 60 * 60 * 24)
      if (daysSince > 10) clientStatus = 'overdue'
    }
  }

  const statusColors: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    overdue: 'bg-amber-100 text-amber-700',
    pending: 'bg-gray-100 text-gray-700',
  }

  // Get check-ins with photos for comparison
  const checkInsWithPhotos = checkIns.filter(
    (ci) => ci.progress_photos && ci.progress_photos.length > 0
  )

  const photosForWeekA = checkInsWithPhotos.find(
    (ci) => ci.week_number === compareWeekA
  )?.progress_photos
  const photosForWeekB = checkInsWithPhotos.find(
    (ci) => ci.week_number === compareWeekB
  )?.progress_photos

  return (
    <div className="space-y-6">
      {/* Back button and header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/coach/clients')}
        >
          <ArrowLeft className="size-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {profile.full_name}
          </h1>
          <p className="text-muted-foreground">{profile.email}</p>
        </div>
      </div>

      {/* Profile info header card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100 text-lg font-semibold text-emerald-700">
                {profile.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{profile.full_name}</h2>
                  <Badge className={statusColors[clientStatus]}>
                    {formatLabel(clientStatus)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{profile.email}</p>
                <p className="text-xs text-muted-foreground">
                  Joined {formatDate(profile.created_at)}
                </p>
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div>
                <p className="text-muted-foreground">Subscription</p>
                <p className="font-medium">{formatLabel(profile.subscription_status)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Check-ins</p>
                <p className="font-medium">{checkIns.length}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Onboarding</p>
                <p className="font-medium">
                  {profile.onboarding_completed ? 'Completed' : 'Pending'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Onboarding Answers */}
      {onboarding && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection('onboarding')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="size-5 text-emerald-600" />
                <CardTitle>Onboarding Answers</CardTitle>
              </div>
              {expandedSections.onboarding ? (
                <ChevronUp className="size-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-5 text-muted-foreground" />
              )}
            </div>
            <CardDescription>
              Client questionnaire responses (v{onboarding.version})
            </CardDescription>
          </CardHeader>

          {expandedSections.onboarding && (
            <CardContent className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-emerald-700">
                  Personal Information
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoItem label="Age" value={`${onboarding.age} years`} />
                  <InfoItem label="Sex" value={formatLabel(onboarding.sex)} />
                  <InfoItem label="Height" value={`${onboarding.height_cm} cm`} />
                  <InfoItem label="Weight" value={`${onboarding.weight_kg} kg`} />
                </div>
              </div>

              <Separator />

              {/* Goals */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-emerald-700">
                  Goals
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoItem label="Goal" value={formatLabel(onboarding.goal)} />
                  <InfoItem
                    label="Goal Weight"
                    value={`${onboarding.goal_weight_kg} kg`}
                  />
                  <InfoItem
                    label="Activity Level"
                    value={formatLabel(onboarding.activity_level)}
                  />
                  <InfoItem
                    label="Body Fat %"
                    value={
                      onboarding.body_fat_unsure
                        ? 'Unsure'
                        : `${onboarding.body_fat_percentage || 'N/A'}%`
                    }
                  />
                </div>
              </div>

              <Separator />

              {/* Diet */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-emerald-700">
                  Diet Preferences
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoItem
                    label="Diet Type"
                    value={formatLabel(onboarding.diet_type)}
                  />
                  <InfoItem
                    label="Meals/Day"
                    value={`${onboarding.meals_per_day}`}
                  />
                  <InfoItem
                    label="Cooking Skill"
                    value={formatLabel(onboarding.cooking_skill)}
                  />
                  <InfoItem
                    label="Budget"
                    value={formatLabel(onboarding.budget)}
                  />
                  <InfoItem
                    label="Disliked Foods"
                    value={
                      onboarding.disliked_foods.length > 0
                        ? onboarding.disliked_foods.join(', ')
                        : 'None'
                    }
                  />
                  <InfoItem
                    label="Allergies"
                    value={
                      onboarding.allergies.length > 0
                        ? onboarding.allergies.join(', ')
                        : 'None'
                    }
                  />
                  <InfoItem
                    label="Meal Timing"
                    value={onboarding.meal_timing_window || 'Flexible'}
                  />
                  <InfoItem
                    label="Restaurant Frequency"
                    value={onboarding.restaurant_frequency || 'N/A'}
                  />
                </div>
              </div>

              <Separator />

              {/* Injuries */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-emerald-700">
                  Injuries &amp; Limitations
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoItem
                    label="Injuries"
                    value={
                      onboarding.injuries.length > 0
                        ? onboarding.injuries.join(', ')
                        : 'None reported'
                    }
                  />
                  <InfoItem
                    label="Notes"
                    value={onboarding.injury_notes || 'None'}
                  />
                </div>
              </div>

              <Separator />

              {/* Training */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-emerald-700">
                  Training Preferences
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoItem
                    label="Frequency"
                    value={`${onboarding.workout_frequency} days/week`}
                  />
                  <InfoItem
                    label="Location"
                    value={formatLabel(onboarding.workout_location)}
                  />
                  <InfoItem
                    label="Experience"
                    value={formatLabel(onboarding.experience_level)}
                  />
                  <InfoItem
                    label="Split"
                    value={formatLabel(onboarding.split_preference)}
                  />
                  <InfoItem
                    label="Session Length"
                    value={`${onboarding.time_per_session} min`}
                  />
                  <InfoItem
                    label="Cardio"
                    value={formatLabel(onboarding.cardio_preference)}
                  />
                  <InfoItem
                    label="Plan Duration"
                    value={`${onboarding.plan_duration_weeks} weeks`}
                  />
                  {onboarding.workout_location === 'home' && (
                    <InfoItem
                      label="Home Equipment"
                      value={
                        onboarding.home_equipment.length > 0
                          ? onboarding.home_equipment.join(', ')
                          : 'Bodyweight only'
                      }
                    />
                  )}
                </div>
              </div>

              <Separator />

              {/* Lifestyle */}
              <div>
                <h3 className="mb-3 text-sm font-semibold text-emerald-700">
                  Lifestyle
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <InfoItem
                    label="Average Steps"
                    value={onboarding.average_steps.toLocaleString()}
                  />
                  <InfoItem
                    label="Sleep"
                    value={`${onboarding.sleep_hours} hours`}
                  />
                  <InfoItem
                    label="Stress Level"
                    value={formatLabel(onboarding.stress_level)}
                  />
                  <InfoItem
                    label="Job Type"
                    value={formatLabel(onboarding.job_type)}
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Macro Targets */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('macros')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-5 text-emerald-600" />
              <CardTitle>Macro Targets</CardTitle>
            </div>
            {expandedSections.macros ? (
              <ChevronUp className="size-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground" />
            )}
          </div>
          <CardDescription>
            {macros
              ? `Calculated using ${formatLabel(macros.formula_used)} (v${macros.version})`
              : 'No macro targets generated yet'}
          </CardDescription>
        </CardHeader>

        {expandedSections.macros && macros && (
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">BMR</p>
                <p className="text-2xl font-bold">{Math.round(macros.bmr)}</p>
                <p className="text-xs text-muted-foreground">kcal/day</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 text-center">
                <p className="text-sm text-muted-foreground">TDEE</p>
                <p className="text-2xl font-bold">{Math.round(macros.tdee)}</p>
                <p className="text-xs text-muted-foreground">kcal/day</p>
              </div>
              <div className="rounded-lg border bg-emerald-50 p-4 text-center">
                <p className="text-sm text-emerald-700">Calorie Target</p>
                <p className="text-2xl font-bold text-emerald-700">
                  {Math.round(macros.calorie_target)}
                </p>
                <p className="text-xs text-emerald-600">kcal/day</p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Protein</p>
                <p className="text-xl font-bold text-blue-600">
                  {Math.round(macros.protein_g)}g
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Carbs</p>
                <p className="text-xl font-bold text-amber-600">
                  {Math.round(macros.carbs_g)}g
                </p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <p className="text-sm text-muted-foreground">Fat</p>
                <p className="text-xl font-bold text-red-500">
                  {Math.round(macros.fat_g)}g
                </p>
              </div>
            </div>

            {macros.explanation && (
              <p className="mt-4 text-sm text-muted-foreground">
                {macros.explanation}
              </p>
            )}

            <MacroOverrideForm
              clientId={clientId}
              currentCalories={macros.calorie_target}
              currentProtein={macros.protein_g}
              currentCarbs={macros.carbs_g}
              currentFat={macros.fat_g}
              onSaved={handleMacroOverrideSaved}
            />
          </CardContent>
        )}

        {expandedSections.macros && !macros && (
          <CardContent>
            <p className="py-4 text-center text-sm text-muted-foreground">
              No macro targets have been generated for this client yet.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Meal Plan */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('mealPlan')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Utensils className="size-5 text-emerald-600" />
              <CardTitle>Meal Plan</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRegenerateMealPlan()
                }}
                disabled={regeneratingMeal}
              >
                {regeneratingMeal ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 size-3" />
                )}
                Regenerate
              </Button>
              {expandedSections.mealPlan ? (
                <ChevronUp className="size-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-5 text-muted-foreground" />
              )}
            </div>
          </div>
          <CardDescription>
            {mealPlan
              ? `Version ${mealPlan.version} - Generated ${formatDate(mealPlan.created_at)}`
              : 'No meal plan generated yet'}
          </CardDescription>
        </CardHeader>

        {expandedSections.mealPlan && mealPlan && (
          <CardContent className="space-y-4">
            {mealPlan.plan_data.days.map((day, dayIndex) => (
              <div key={dayIndex} className="rounded-lg border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="font-semibold">{day.day}</h4>
                  <span className="text-xs text-muted-foreground">
                    {day.day_totals.calories} kcal | P:{day.day_totals.protein}g
                    C:{day.day_totals.carbs}g F:{day.day_totals.fat}g
                  </span>
                </div>
                <div className="space-y-2">
                  {day.meals.map((meal, mealIndex) => (
                    <div
                      key={mealIndex}
                      className="rounded bg-muted/50 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{meal.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {meal.macro_totals.calories} kcal | P:{meal.macro_totals.protein}g C:{meal.macro_totals.carbs}g F:{meal.macro_totals.fat}g
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingMeal({ dayIndex, mealIndex, meal })
                            }}
                            disabled={savingMealEdit}
                          >
                            <Pencil className="size-3" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground">
                        {meal.recipe_title}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        )}

        {expandedSections.mealPlan && !mealPlan && (
          <CardContent>
            <p className="py-4 text-center text-sm text-muted-foreground">
              No meal plan has been generated for this client yet. Click
              &quot;Regenerate&quot; to create one.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Training Plan */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('trainingPlan')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="size-5 text-emerald-600" />
              <CardTitle>Training Plan</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleRegenerateTrainingPlan()
                }}
                disabled={regeneratingTraining}
              >
                {regeneratingTraining ? (
                  <Loader2 className="mr-1 size-3 animate-spin" />
                ) : (
                  <RefreshCw className="mr-1 size-3" />
                )}
                Regenerate
              </Button>
              {expandedSections.trainingPlan ? (
                <ChevronUp className="size-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-5 text-muted-foreground" />
              )}
            </div>
          </div>
          <CardDescription>
            {trainingPlan
              ? `${trainingPlan.plan_data.program_name} - v${trainingPlan.version} (${trainingPlan.duration_weeks} weeks)`
              : 'No training plan generated yet'}
          </CardDescription>
        </CardHeader>

        {expandedSections.trainingPlan && trainingPlan && (
          <CardContent className="space-y-4">
            {trainingPlan.plan_data.overview && (
              <p className="text-sm text-muted-foreground">
                {trainingPlan.plan_data.overview}
              </p>
            )}
            {trainingPlan.plan_data.progression_rules && (
              <div className="rounded-lg bg-emerald-50 p-3">
                <p className="text-sm font-medium text-emerald-700">
                  Progression Rules
                </p>
                <p className="text-sm text-emerald-600">
                  {trainingPlan.plan_data.progression_rules}
                </p>
              </div>
            )}

            {trainingPlan.plan_data.weeks.map((week) => (
              <div key={week.week} className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">
                  Week {week.week}
                  {week.theme && (
                    <span className="ml-2 font-normal text-muted-foreground">
                      - {week.theme}
                    </span>
                  )}
                </h4>
                <div className="space-y-2">
                  {week.days.map((day, dayIndex) => {
                    const weekIndex = trainingPlan.plan_data.weeks.indexOf(week)
                    return (
                      <div
                        key={dayIndex}
                        className="rounded bg-muted/50 p-3 text-sm"
                      >
                        <div className="mb-1 flex items-center justify-between">
                          <span className="font-medium">
                            {day.day}: {day.name}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-6"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingExercise({ weekIndex, dayIndex, day })
                            }}
                            disabled={savingTrainingEdit}
                          >
                            <Pencil className="size-3" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {day.exercises.map((ex, exIndex) => (
                            <div
                              key={exIndex}
                              className="flex items-center justify-between text-xs text-muted-foreground"
                            >
                              <span>{ex.name}</span>
                              <span>
                                {ex.sets}x{ex.reps}
                                {ex.rpe ? ` @RPE${ex.rpe}` : ''}
                                {ex.rest_seconds ? ` | ${ex.rest_seconds}s rest` : ''}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </CardContent>
        )}

        {expandedSections.trainingPlan && !trainingPlan && (
          <CardContent>
            <p className="py-4 text-center text-sm text-muted-foreground">
              No training plan has been generated for this client yet. Click
              &quot;Regenerate&quot; to create one.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Check-in Timeline */}
      <Card>
        <CardHeader
          className="cursor-pointer"
          onClick={() => toggleSection('checkIns')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ClipboardCheck className="size-5 text-emerald-600" />
              <CardTitle>Check-in Timeline</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{checkIns.length} check-ins</Badge>
              {expandedSections.checkIns ? (
                <ChevronUp className="size-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-5 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>

        {expandedSections.checkIns && (
          <CardContent>
            {checkIns.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No check-ins submitted yet
              </p>
            ) : (
              <div className="space-y-4">
                {checkIns.map((ci) => (
                  <div
                    key={ci.id}
                    className="rounded-lg border p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700">
                          Week {ci.week_number}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(ci.created_at)}
                        </span>
                      </div>
                      <Badge
                        variant={
                          ci.adherence_rating >= 7
                            ? 'default'
                            : ci.adherence_rating >= 4
                            ? 'secondary'
                            : 'destructive'
                        }
                        className={
                          ci.adherence_rating >= 7
                            ? 'bg-emerald-100 text-emerald-700'
                            : ''
                        }
                      >
                        Adherence: {ci.adherence_rating}/10
                      </Badge>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-4">
                      <div className="flex items-center gap-2 text-sm">
                        <Scale className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Weight:</span>
                        <span className="font-medium">{ci.weight_kg} kg</span>
                      </div>
                      {ci.waist_cm && (
                        <div className="flex items-center gap-2 text-sm">
                          <Ruler className="size-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Waist:</span>
                          <span className="font-medium">{ci.waist_cm} cm</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Footprints className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Steps:</span>
                        <span className="font-medium">
                          {ci.steps_avg.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Moon className="size-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Sleep:</span>
                        <span className="font-medium">{ci.sleep_avg}h</span>
                      </div>
                    </div>

                    {ci.notes && (
                      <p className="mt-2 rounded bg-muted/50 p-2 text-sm text-muted-foreground">
                        {ci.notes}
                      </p>
                    )}

                    {ci.progress_photos && ci.progress_photos.length > 0 && (
                      <div className="mt-2 flex items-center gap-1 text-xs text-emerald-600">
                        <Camera className="size-3" />
                        {ci.progress_photos.length} photo
                        {ci.progress_photos.length !== 1 ? 's' : ''} attached
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Coach Notes */}
      <CoachNotes clientId={clientId} />

      {/* Photo Comparison */}
      {checkInsWithPhotos.length > 0 && (
        <Card>
          <CardHeader
            className="cursor-pointer"
            onClick={() => toggleSection('photos')}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Camera className="size-5 text-emerald-600" />
                <CardTitle>Progress Photo Comparison</CardTitle>
              </div>
              {expandedSections.photos ? (
                <ChevronUp className="size-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="size-5 text-muted-foreground" />
              )}
            </div>
            <CardDescription>
              Compare progress photos across different weeks
            </CardDescription>
          </CardHeader>

          {expandedSections.photos && (
            <CardContent className="space-y-4">
              {/* Week selectors */}
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">
                    Week A (Before)
                  </label>
                  <select
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={compareWeekA ?? ''}
                    onChange={(e) =>
                      setCompareWeekA(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  >
                    <option value="">Select week...</option>
                    {checkInsWithPhotos.map((ci) => (
                      <option key={ci.week_number} value={ci.week_number}>
                        Week {ci.week_number} ({formatDate(ci.created_at)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium">
                    Week B (After)
                  </label>
                  <select
                    className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                    value={compareWeekB ?? ''}
                    onChange={(e) =>
                      setCompareWeekB(
                        e.target.value ? Number(e.target.value) : null
                      )
                    }
                  >
                    <option value="">Select week...</option>
                    {checkInsWithPhotos.map((ci) => (
                      <option key={ci.week_number} value={ci.week_number}>
                        Week {ci.week_number} ({formatDate(ci.created_at)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo grid comparison */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Week A photos */}
                <div>
                  <h4 className="mb-2 text-center text-sm font-medium">
                    {compareWeekA ? `Week ${compareWeekA}` : 'Select a week'}
                  </h4>
                  {photosForWeekA && photosForWeekA.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {(['front', 'side', 'back'] as const).map((type) => {
                        const photo = photosForWeekA.find(
                          (p) => p.photo_type === type
                        )
                        return (
                          <div
                            key={type}
                            className="aspect-[3/4] overflow-hidden rounded-lg border bg-muted"
                          >
                            {photo && photo.url ? (
                              <img
                                src={photo.url}
                                alt={`${type} - Week ${compareWeekA}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                {formatLabel(type)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg border text-sm text-muted-foreground">
                      {compareWeekA ? 'No photos for this week' : 'Select a week to compare'}
                    </div>
                  )}
                </div>

                {/* Week B photos */}
                <div>
                  <h4 className="mb-2 text-center text-sm font-medium">
                    {compareWeekB ? `Week ${compareWeekB}` : 'Select a week'}
                  </h4>
                  {photosForWeekB && photosForWeekB.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {(['front', 'side', 'back'] as const).map((type) => {
                        const photo = photosForWeekB.find(
                          (p) => p.photo_type === type
                        )
                        return (
                          <div
                            key={type}
                            className="aspect-[3/4] overflow-hidden rounded-lg border bg-muted"
                          >
                            {photo && photo.url ? (
                              <img
                                src={photo.url}
                                alt={`${type} - Week ${compareWeekB}`}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                                {formatLabel(type)}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="flex h-32 items-center justify-center rounded-lg border text-sm text-muted-foreground">
                      {compareWeekB ? 'No photos for this week' : 'Select a week to compare'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}
      {/* Edit Dialogs */}
      {editingMeal && (
        <EditMealDialog
          open={!!editingMeal}
          onOpenChange={(open) => {
            if (!open) setEditingMeal(null)
          }}
          meal={editingMeal.meal}
          dayIndex={editingMeal.dayIndex}
          mealIndex={editingMeal.mealIndex}
          onSave={handleSaveMealEdit}
        />
      )}

      {editingExercise && (
        <EditExerciseDialog
          open={!!editingExercise}
          onOpenChange={(open) => {
            if (!open) setEditingExercise(null)
          }}
          day={editingExercise.day}
          weekIndex={editingExercise.weekIndex}
          dayIndex={editingExercise.dayIndex}
          onSave={handleSaveExerciseEdit}
        />
      )}
    </div>
  )
}

/* Helper component */
function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted/30 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value}</p>
    </div>
  )
}
