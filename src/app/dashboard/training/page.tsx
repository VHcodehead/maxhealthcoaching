'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Dumbbell,
  Target,
  AlertCircle,
  Info,
  ChevronUp,
  Timer,
  Gauge,
  Loader2,
  Flame,
} from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Exercise {
  name: string
  sets: string | number
  reps: string | number
  rpe: string | number | null
  rest: string | null
  notes: string | null
}

interface TrainingDay {
  id: string
  day_name: string
  workout_name: string
  warmup: string[] | string | null
  exercises: Exercise[] | string | null
}

interface TrainingPlanData {
  id: string
  user_id: string
  week_number: number
  day_name: string
  workout_name: string
  warmup: string[] | string | null
  exercises: Exercise[] | string | null
  program_overview: string | null
  progression_rules: string | null
}

function parseToArray(value: string[] | string | null): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
  } catch {
    if (typeof value === 'string') {
      return value.split('\n').filter((s) => s.trim())
    }
  }
  return []
}

function parseExercises(value: Exercise[] | string | null): Exercise[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
  } catch {
    return []
  }
  return []
}

function TrainingDayCard({
  day,
  index,
}: {
  day: TrainingDay
  index: number
}) {
  const warmupSteps = parseToArray(day.warmup)
  const exercises = parseExercises(day.exercises)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.1 }}
    >
      <Card className="overflow-hidden">
        {/* Day Header */}
        <CardHeader className="bg-gradient-to-r from-emerald-50 to-transparent">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-sm font-bold text-white shadow-sm">
                {day.day_name?.slice(0, 2).toUpperCase() || 'D'}
              </div>
              <div>
                <CardTitle className="text-base">{day.day_name}</CardTitle>
                <CardDescription>{day.workout_name}</CardDescription>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-emerald-100 text-emerald-700"
            >
              <Dumbbell className="mr-1 h-3 w-3" />
              {exercises.length} exercises
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Warmup Section */}
          {warmupSteps.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <p className="text-sm font-semibold">Warm-up</p>
              </div>
              <div className="rounded-lg border border-orange-100 bg-orange-50/50 p-3">
                <ul className="space-y-1.5">
                  {warmupSteps.map((step, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2 text-sm text-muted-foreground"
                    >
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-orange-200 text-[10px] font-bold text-orange-700">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Exercise Table */}
          {exercises.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" />
                <p className="text-sm font-semibold">Exercises</p>
              </div>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-semibold">
                        Exercise
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold">
                        Sets
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold">
                        Reps
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold">
                        RPE
                      </TableHead>
                      <TableHead className="text-center text-xs font-semibold">
                        Rest
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Notes
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exercises.map((ex, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-100 text-[10px] font-bold text-emerald-700">
                              {i + 1}
                            </span>
                            {ex.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-xs">
                            {ex.sets}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center text-sm">
                          {ex.reps}
                        </TableCell>
                        <TableCell className="text-center">
                          {ex.rpe ? (
                            <Badge
                              variant="secondary"
                              className="gap-0.5 text-xs"
                            >
                              <Gauge className="h-2.5 w-2.5" />
                              {ex.rpe}
                            </Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {ex.rest ? (
                            <span className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                              <Timer className="h-3 w-3" />
                              {ex.rest}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              --
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate text-xs text-muted-foreground">
                          {ex.notes || '--'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function TrainingPage() {
  const [trainingData, setTrainingData] = useState<TrainingPlanData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeWeek, setActiveWeek] = useState('1')

  useEffect(() => {
    async function fetchTraining() {
      try {
        const res = await fetch('/api/training')
        if (!res.ok) throw new Error('Failed to fetch training plan')
        const data = await res.json()

        if (data.trainingPlan?.plan_data) {
          let planData = data.trainingPlan.plan_data
          if (typeof planData === 'string') {
            try { planData = JSON.parse(planData) } catch { /* ignore */ }
          }

          // planData is { weeks: [...], overview, program_name, progression_rules }
          const weeks = planData?.weeks || planData
          if (Array.isArray(weeks)) {
            const flat: TrainingPlanData[] = []
            for (const week of weeks) {
              const weekNum = week.week || week.week_number || 1
              const days = week.days || []
              for (const day of days) {
                flat.push({
                  id: `w${weekNum}-${day.day_name || day.day}`,
                  user_id: '',
                  week_number: weekNum,
                  day_name: day.day_name || day.day || '',
                  workout_name: day.session_name || day.workout_name || 'Training',
                  warmup: day.warmup || null,
                  exercises: day.exercises || null,
                  program_overview: planData.overview || null,
                  progression_rules: planData.progression_rules || null,
                })
              }
            }
            setTrainingData(flat)
          }
        }
      } catch (err) {
        setError('Failed to load training plan.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchTraining()
  }, [])

  // Get unique week numbers
  const weeks = Array.from(
    new Set(trainingData.map((d) => d.week_number))
  ).sort((a, b) => a - b)

  // Get data for the active week
  const weekData = trainingData.filter(
    (d) => d.week_number === parseInt(activeWeek)
  )

  // Get program overview and progression rules from first entry
  const programOverview = trainingData.find((d) => d.program_overview)
    ?.program_overview
  const progressionRules = trainingData.find((d) => d.progression_rules)
    ?.progression_rules

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="mb-6 flex gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-9 w-20 animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
                  <div className="space-y-2">
                    <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-40 animate-pulse rounded bg-muted" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(5)].map((_, j) => (
                    <div
                      key={j}
                      className="h-8 animate-pulse rounded bg-muted"
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
            <div className="rounded-full bg-red-100 p-3">
              <AlertCircle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="font-semibold">Failed to load training plan</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (trainingData.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-emerald-50 p-4">
              <Dumbbell className="h-10 w-10 text-emerald-300" />
            </div>
            <div>
              <p className="text-lg font-semibold">No training plan yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your coach has not assigned a training plan to you yet. Check
                back soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Training Plan
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your structured training program with exercises, sets, and progression.
        </p>
      </motion.div>

      {/* Program Overview */}
      {programOverview && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-900">
                    Program Overview
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-emerald-800/80">
                    {programOverview}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Progression Rules */}
      {progressionRules && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-6"
        >
          <Card className="border-violet-200 bg-violet-50/50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <ChevronUp className="mt-0.5 h-5 w-5 shrink-0 text-violet-600" />
                <div>
                  <p className="font-semibold text-violet-900">
                    Progression Rules
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-violet-800/80">
                    {progressionRules}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Week Tabs */}
      <Tabs value={activeWeek} onValueChange={setActiveWeek}>
        <ScrollArea className="w-full">
          <TabsList className="mb-6 w-full justify-start">
            {weeks.map((week) => (
              <TabsTrigger
                key={week}
                value={String(week)}
                className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
              >
                Week {week}
              </TabsTrigger>
            ))}
          </TabsList>
        </ScrollArea>

        {weeks.map((week) => {
          const days = trainingData.filter((d) => d.week_number === week)
          // Deduplicate by day_name within each week
          const uniqueDays: TrainingDay[] = []
          const seenDays = new Set<string>()
          for (const d of days) {
            const key = d.day_name
            if (!seenDays.has(key)) {
              seenDays.add(key)
              uniqueDays.push(d)
            }
          }

          return (
            <TabsContent key={week} value={String(week)}>
              <div className="space-y-6">
                {uniqueDays.map((day, index) => (
                  <TrainingDayCard key={day.id} day={day} index={index} />
                ))}
              </div>
            </TabsContent>
          )
        })}
      </Tabs>
    </div>
  )
}
