'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  UtensilsCrossed,
  ShoppingCart,
  Repeat2,
  ChevronDown,
  Loader2,
  AlertCircle,
  Leaf,
  Beef,
  Droplets,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { ScrollArea } from '@/components/ui/scroll-area'

const DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
]

// Map day names to day_of_week numbers (0=Sunday)
const DAY_MAP: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

interface Meal {
  id: string
  day_of_week: number
  meal_name: string
  recipe_title: string
  ingredients: string[] | string | null
  instructions: string[] | string | null
  calories: number
  protein: number
  carbs: number
  fat: number
  swap_options: SwapOption[] | null
}

interface SwapOption {
  recipe_title: string
  ingredients: string[] | string
  instructions: string[] | string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface GroceryItem {
  category: string
  item: string
}

function parseToArray(value: string[] | string | null): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed
  } catch {
    // If it's a plain string, split by newlines or return as single item
    if (typeof value === 'string') {
      return value.split('\n').filter((s) => s.trim())
    }
  }
  return []
}

function MealCard({ meal }: { meal: Meal }) {
  const ingredients = parseToArray(meal.ingredients)
  const instructions = parseToArray(meal.instructions)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <Badge
                variant="secondary"
                className="mb-2 bg-emerald-50 text-emerald-700"
              >
                {meal.meal_name}
              </Badge>
              <CardTitle className="text-base">{meal.recipe_title}</CardTitle>
            </div>
            {meal.swap_options && meal.swap_options.length > 0 && (
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 gap-1.5 text-xs"
                  >
                    <Repeat2 className="h-3.5 w-3.5" />
                    Swap
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Swap Alternatives</DialogTitle>
                    <DialogDescription>
                      Choose an alternative for {meal.meal_name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-2">
                    {meal.swap_options.map((swap, i) => {
                      const swapIngredients = parseToArray(swap.ingredients)
                      return (
                        <Card key={i}>
                          <CardContent className="pt-4">
                            <p className="font-semibold">{swap.recipe_title}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <Badge variant="outline" className="text-xs">
                                <Flame className="mr-1 h-3 w-3" />
                                {swap.calories} kcal
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Beef className="mr-1 h-3 w-3" />
                                P: {swap.protein}g
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Leaf className="mr-1 h-3 w-3" />
                                C: {swap.carbs}g
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                <Droplets className="mr-1 h-3 w-3" />
                                F: {swap.fat}g
                              </Badge>
                            </div>
                            {swapIngredients.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Ingredients:
                                </p>
                                <ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                                  {swapIngredients.map((ing, j) => (
                                    <li key={j} className="flex gap-1.5">
                                      <span className="text-emerald-500">
                                        &bull;
                                      </span>
                                      {ing}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Macro badges */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="gap-1 text-xs">
              <Flame className="h-3 w-3 text-orange-500" />
              {meal.calories} kcal
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Beef className="h-3 w-3 text-blue-500" />
              P: {meal.protein}g
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Leaf className="h-3 w-3 text-amber-500" />
              C: {meal.carbs}g
            </Badge>
            <Badge variant="outline" className="gap-1 text-xs">
              <Droplets className="h-3 w-3 text-rose-500" />
              F: {meal.fat}g
            </Badge>
          </div>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Ingredients</p>
              <ul className="space-y-1">
                {ingredients.map((ing, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                    {ing}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Instructions */}
          {instructions.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold">Instructions</p>
              <ol className="space-y-2">
                {instructions.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-sm text-muted-foreground"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

function DayTotals({ meals }: { meals: Meal[] }) {
  const totals = meals.reduce(
    (acc, m) => ({
      calories: acc.calories + (m.calories || 0),
      protein: acc.protein + (m.protein || 0),
      carbs: acc.carbs + (m.carbs || 0),
      fat: acc.fat + (m.fat || 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-3">
            <Flame className="h-4 w-4 text-emerald-600" />
            <p className="text-sm font-semibold text-emerald-900">
              Day Totals
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-700">
                {totals.calories}
              </p>
              <p className="text-xs text-emerald-600/70">Calories</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">
                {totals.protein}g
              </p>
              <p className="text-xs text-blue-500/70">Protein</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">
                {totals.carbs}g
              </p>
              <p className="text-xs text-amber-500/70">Carbs</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-rose-600">
                {totals.fat}g
              </p>
              <p className="text-xs text-rose-500/70">Fat</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function MealsPage() {
  const [meals, setMeals] = useState<Meal[]>([])
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeDay, setActiveDay] = useState<string>(() => {
    const today = new Date().getDay()
    // Convert JS day (0=Sun) to our DAYS array index (0=Mon)
    const idx = today === 0 ? 6 : today - 1
    return DAYS[idx]
  })

  useEffect(() => {
    async function fetchMeals() {
      try {
        const res = await fetch('/api/meals')
        if (!res.ok) throw new Error('Failed to fetch meal plan data')
        const data = await res.json()

        if (data.mealPlan) {
          let planData = data.mealPlan.plan_data
          if (typeof planData === 'string') {
            try { planData = JSON.parse(planData) } catch { /* ignore */ }
          }

          // planData is { days: [{ day: "Monday", meals: [...] }] }
          const days = planData?.days || planData
          if (Array.isArray(days)) {
            const flatMeals: Meal[] = []
            for (const dayObj of days) {
              const dayNum = DAY_MAP[dayObj.day] ?? 0
              if (Array.isArray(dayObj.meals)) {
                for (const m of dayObj.meals) {
                  flatMeals.push({
                    id: `${dayObj.day}-${m.name}`,
                    day_of_week: dayNum,
                    meal_name: m.name || m.meal_name || 'Meal',
                    recipe_title: m.recipe_title || '',
                    ingredients: Array.isArray(m.ingredients)
                      ? m.ingredients.map((ing: any) =>
                          typeof ing === 'string' ? ing : `${ing.amount} ${ing.unit} ${ing.name}`
                        )
                      : m.ingredients,
                    instructions: m.instructions,
                    calories: m.macro_totals?.calories || m.calories || 0,
                    protein: m.macro_totals?.protein || m.protein || 0,
                    carbs: m.macro_totals?.carbs || m.carbs || 0,
                    fat: m.macro_totals?.fat || m.fat || 0,
                    swap_options: Array.isArray(m.swap_options)
                      ? m.swap_options.map((s: any) => ({
                          recipe_title: s.recipe_title || '',
                          ingredients: Array.isArray(s.ingredients)
                            ? s.ingredients.map((ing: any) =>
                                typeof ing === 'string' ? ing : `${ing.amount} ${ing.unit} ${ing.name}`
                              )
                            : s.ingredients,
                          instructions: s.instructions,
                          calories: s.macro_totals?.calories || s.calories || 0,
                          protein: s.macro_totals?.protein || s.protein || 0,
                          carbs: s.macro_totals?.carbs || s.carbs || 0,
                          fat: s.macro_totals?.fat || s.fat || 0,
                        }))
                      : null,
                  })
                }
              }
            }
            setMeals(flatMeals)
          }

          // grocery_list
          const groceryList = data.mealPlan.grocery_list
          if (Array.isArray(groceryList)) {
            setGroceryItems(groceryList)
          }
        }
      } catch (err) {
        setError('Failed to load meal plan data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchMeals()
  }, [])

  const getDayMeals = (dayName: string) => {
    const dayNum = DAY_MAP[dayName]
    return meals.filter((m) => m.day_of_week === dayNum)
  }

  // Group grocery items by category
  const groceryByCategory = groceryItems.reduce<Record<string, string[]>>(
    (acc, item) => {
      const cat = item.category || 'Other'
      if (!acc[cat]) acc[cat] = []
      acc[cat].push(item.item)
      return acc
    },
    {}
  )

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="mb-6 flex gap-2 overflow-x-auto">
          {DAYS.map((d) => (
            <div
              key={d}
              className="h-9 w-20 animate-pulse rounded-md bg-muted"
            />
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, j) => (
                      <div
                        key={j}
                        className="h-6 w-16 animate-pulse rounded-full bg-muted"
                      />
                    ))}
                  </div>
                  <div className="space-y-2">
                    {[...Array(4)].map((_, j) => (
                      <div
                        key={j}
                        className="h-4 animate-pulse rounded bg-muted"
                      />
                    ))}
                  </div>
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
              <p className="font-semibold">Failed to load meals</p>
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

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Meal Plan
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your complete 7-day nutrition plan with recipes and macros.
        </p>
      </motion.div>

      {/* Day Tabs */}
      <Tabs value={activeDay} onValueChange={setActiveDay}>
        <ScrollArea className="w-full">
          <TabsList className="mb-6 w-full justify-start">
            {DAYS.map((day) => {
              const dayMeals = getDayMeals(day)
              return (
                <TabsTrigger
                  key={day}
                  value={day}
                  className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                >
                  <span className="hidden sm:inline">{day}</span>
                  <span className="sm:hidden">{day.slice(0, 3)}</span>
                  {dayMeals.length > 0 && (
                    <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px]">
                      {dayMeals.length}
                    </span>
                  )}
                </TabsTrigger>
              )
            })}
          </TabsList>
        </ScrollArea>

        {DAYS.map((day) => {
          const dayMeals = getDayMeals(day)
          return (
            <TabsContent key={day} value={day}>
              {dayMeals.length > 0 ? (
                <div className="space-y-4">
                  {dayMeals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} />
                  ))}
                  <DayTotals meals={dayMeals} />
                </div>
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
                    <UtensilsCrossed className="h-12 w-12 text-muted-foreground/30" />
                    <p className="text-lg font-medium text-muted-foreground">
                      No meals planned for {day}
                    </p>
                    <p className="text-sm text-muted-foreground/70">
                      Your coach may not have assigned meals for this day.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          )
        })}
      </Tabs>

      {/* Grocery List */}
      {Object.keys(groceryByCategory).length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8"
        >
          <Accordion type="single" collapsible>
            <AccordionItem value="grocery">
              <AccordionTrigger className="text-base font-semibold">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-emerald-600" />
                  Grocery List
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {groceryItems.length} items
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Object.entries(groceryByCategory).map(
                    ([category, items]) => (
                      <Card key={category}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm font-semibold text-emerald-700">
                            {category}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-1.5">
                            {items.map((item, i) => (
                              <li
                                key={i}
                                className="flex items-center gap-2 text-sm text-muted-foreground"
                              >
                                <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </motion.div>
      )}
    </div>
  )
}
