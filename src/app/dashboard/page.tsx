'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Flame,
  Beef,
  CalendarCheck,
  Download,
  Dumbbell,
  UtensilsCrossed,
  ChevronRight,
  Loader2,
  AlertCircle,
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
import { Separator } from '@/components/ui/separator'
import Link from 'next/link'

interface Profile {
  fullName: string
  createdAt: string
}

interface MacroTargets {
  calorieTarget: number
  proteinG: number
  carbsG: number
  fatG: number
}

interface MealPlanDay {
  day_of_week: number
  meal_name: string
  recipe_title: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface MealPlan {
  planData: any
}

interface TrainingPlanDay {
  day_name: string
  workout_name: string
}

interface TrainingPlan {
  planData: any
}

interface CheckIn {
  id: string
  createdAt: string
  weekNumber: number
}

// Skeleton component for loading states
function SkeletonCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="space-y-3">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-8 w-32 animate-pulse rounded bg-muted" />
          <div className="h-3 w-20 animate-pulse rounded bg-muted" />
        </div>
      </CardContent>
    </Card>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: string
  subtext: string
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Card className="relative overflow-hidden">
        <div
          className={`absolute inset-y-0 left-0 w-1 ${color}`}
        />
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{subtext}</p>
            </div>
            <div className={`rounded-lg p-2.5 ${color.replace('bg-', 'bg-').replace('-600', '-100')}`}>
              <Icon className={`h-5 w-5 ${color.replace('bg-', 'text-')}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function MacroBar({
  label,
  grams,
  percentage,
  color,
}: {
  label: string
  grams: number
  percentage: number
  color: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {grams}g ({percentage}%)
        </span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
        />
      </div>
    </div>
  )
}

export default function DashboardOverview() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [macros, setMacros] = useState<MacroTargets | null>(null)
  const [todayMeals, setTodayMeals] = useState<MealPlanDay[]>([])
  const [trainingDays, setTrainingDays] = useState<TrainingPlanDay[]>([])
  const [nextCheckIn, setNextCheckIn] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/dashboard')
        if (!res.ok) throw new Error('Failed to fetch dashboard data')
        const data = await res.json()

        // Profile
        if (data.profile) {
          setProfile({
            fullName: data.profile.fullName,
            createdAt: data.profile.createdAt,
          })
        }

        // Macros
        if (data.macros) {
          setMacros({
            calorieTarget: data.macros.calorieTarget,
            proteinG: data.macros.proteinG,
            carbsG: data.macros.carbsG,
            fatG: data.macros.fatG,
          })
        }

        // Meal plan - planData is { days: [{ day: "Monday", meals: [...] }] }
        if (data.mealPlan?.planData) {
          const planData = data.mealPlan.planData
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
          const todayName = dayNames[new Date().getDay()]
          const days = planData.days || planData
          if (Array.isArray(days)) {
            const todayPlan = days.find((d: any) => d.day === todayName)
            if (todayPlan?.meals) {
              setTodayMeals(todayPlan.meals.map((m: any) => ({
                day_of_week: new Date().getDay(),
                meal_name: m.name || m.meal_name,
                recipe_title: m.recipe_title,
                calories: m.macro_totals?.calories || m.calories || 0,
                protein: m.macro_totals?.protein || m.protein || 0,
                carbs: m.macro_totals?.carbs || m.carbs || 0,
                fat: m.macro_totals?.fat || m.fat || 0,
              })))
            }
          }
        }

        // Training plan - planData is { weeks: [{ week: 1, days: [...] }] }
        if (data.trainingPlan?.planData) {
          const planData = data.trainingPlan.planData
          const weeks = planData.weeks || planData
          if (Array.isArray(weeks) && weeks.length > 0) {
            const week1 = weeks[0]
            const days = week1.days || []
            setTrainingDays(days.map((d: any) => ({
              day_name: d.day_name || d.day,
              workout_name: d.session_name || d.workout_name || 'Training',
            })))
          }
        }

        // Calculate next check-in (7 days from last check-in)
        if (data.checkIns && data.checkIns.length > 0) {
          const lastDate = new Date(data.checkIns[0].createdAt)
          const nextDate = new Date(lastDate)
          nextDate.setDate(nextDate.getDate() + 7)
          const daysUntil = Math.ceil(
            (nextDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
          )
          setNextCheckIn(
            daysUntil <= 0
              ? 'Today'
              : daysUntil === 1
                ? 'Tomorrow'
                : `In ${daysUntil} days`
          )
        } else {
          setNextCheckIn('Not scheduled')
        }
      } catch (err) {
        setError('Failed to load dashboard data. Please try again.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        {/* Skeleton greeting */}
        <div className="mb-8 space-y-2">
          <div className="h-8 w-64 animate-pulse rounded bg-muted" />
          <div className="h-4 w-48 animate-pulse rounded bg-muted" />
        </div>
        {/* Skeleton stat cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        {/* Skeleton content */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-muted" />
                ))}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-6 animate-pulse rounded bg-muted" />
                ))}
              </div>
            </CardContent>
          </Card>
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
              <p className="font-semibold">Something went wrong</p>
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

  const totalCaloriesFromMacros = macros
    ? macros.proteinG * 4 + macros.carbsG * 4 + macros.fatG * 9
    : 0
  const proteinPct = macros
    ? Math.round(((macros.proteinG * 4) / totalCaloriesFromMacros) * 100)
    : 0
  const carbsPct = macros
    ? Math.round(((macros.carbsG * 4) / totalCaloriesFromMacros) * 100)
    : 0
  const fatPct = macros
    ? Math.round(((macros.fatG * 9) / totalCaloriesFromMacros) * 100)
    : 0

  const firstName = profile?.fullName?.split(' ')[0] || 'there'

  return (
    <div className="p-6 lg:p-8">
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Here is your coaching overview for today.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={Flame}
          label="Daily Calories"
          value={macros ? `${macros.calorieTarget.toLocaleString()} kcal` : '--'}
          subtext="Target intake"
          color="bg-emerald-600"
          delay={0.1}
        />
        <StatCard
          icon={Beef}
          label="Protein Target"
          value={macros ? `${macros.proteinG}g` : '--'}
          subtext={macros ? `${proteinPct}% of total calories` : ''}
          color="bg-blue-600"
          delay={0.2}
        />
        <StatCard
          icon={CalendarCheck}
          label="Next Check-in"
          value={nextCheckIn || '--'}
          subtext="Weekly progress review"
          color="bg-violet-600"
          delay={0.3}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Macro Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="rounded-md bg-emerald-100 p-1.5">
                  <Flame className="h-4 w-4 text-emerald-600" />
                </div>
                Macro Breakdown
              </CardTitle>
              <CardDescription>
                Your daily macro targets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {macros ? (
                <div className="space-y-5">
                  <MacroBar
                    label="Protein"
                    grams={macros.proteinG}
                    percentage={proteinPct}
                    color="bg-blue-500"
                  />
                  <MacroBar
                    label="Carbohydrates"
                    grams={macros.carbsG}
                    percentage={carbsPct}
                    color="bg-amber-500"
                  />
                  <MacroBar
                    label="Fat"
                    grams={macros.fatG}
                    percentage={fatPct}
                    color="bg-rose-500"
                  />
                  <Separator />
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span>Total Daily Calories</span>
                    <span className="text-lg font-bold text-emerald-600">
                      {macros.calorieTarget.toLocaleString()} kcal
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No macro targets set yet.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Your coach will set these up for you.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* This Week's Training */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="rounded-md bg-violet-100 p-1.5">
                    <Dumbbell className="h-4 w-4 text-violet-600" />
                  </div>
                  This Week&apos;s Training
                </CardTitle>
                <Link href="/dashboard/training">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <CardDescription>Week 1 overview</CardDescription>
            </CardHeader>
            <CardContent>
              {trainingDays.length > 0 ? (
                <div className="space-y-2">
                  {trainingDays.map((day, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-50 text-xs font-bold text-violet-600">
                          {day.day_name?.slice(0, 2).toUpperCase() || `D${i + 1}`}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{day.day_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {day.workout_name}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Scheduled
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <Dumbbell className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No training plan available yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Meal Plan */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55 }}
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <div className="rounded-md bg-amber-100 p-1.5">
                    <UtensilsCrossed className="h-4 w-4 text-amber-600" />
                  </div>
                  Today&apos;s Meal Plan
                </CardTitle>
                <Link href="/dashboard/meals">
                  <Button variant="ghost" size="sm" className="gap-1 text-xs">
                    View all
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </div>
              <CardDescription>
                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}&apos;s meals
              </CardDescription>
            </CardHeader>
            <CardContent>
              {todayMeals.length > 0 ? (
                <div className="space-y-2">
                  {todayMeals.map((meal, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-lg border px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{meal.meal_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {meal.recipe_title}
                        </p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="font-mono text-xs"
                      >
                        {meal.calories} kcal
                      </Badge>
                    </div>
                  ))}
                  <Separator className="my-3" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Total</span>
                    <span className="font-bold text-emerald-600">
                      {todayMeals.reduce((sum, m) => sum + (m.calories || 0), 0)}{' '}
                      kcal
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 py-8 text-center">
                  <UtensilsCrossed className="h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">
                    No meals planned for today.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Download PDF */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.65 }}
        >
          <Card className="flex h-full flex-col items-center justify-center border-dashed">
            <CardContent className="flex flex-col items-center gap-4 pt-6 text-center">
              <div className="rounded-full bg-emerald-50 p-4">
                <Download className="h-8 w-8 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold">Download Your Plan</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get a PDF of your complete meal and training plan.
                </p>
              </div>
              <Button className="mt-2 gap-2 bg-emerald-600 hover:bg-emerald-700">
                <Download className="h-4 w-4" />
                Download PDF
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
