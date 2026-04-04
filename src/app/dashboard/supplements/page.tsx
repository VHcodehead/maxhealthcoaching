'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Pill,
  AlertCircle,
  Loader2,
  Sun,
  Dumbbell,
  Utensils,
  Moon,
  Sunset,
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
import type { SupplementRecommendation, SupplementTiming } from '@/types/database'

const TIMING_ORDER: SupplementTiming[] = [
  'morning',
  'pre_workout',
  'post_workout',
  'with_meals',
  'evening',
  'bedtime',
]

const TIMING_CONFIG: Record<
  SupplementTiming,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  morning: { label: 'Morning', icon: Sun, color: 'text-orange-400', bg: 'bg-orange-500/10' },
  pre_workout: { label: 'Pre-Workout', icon: Dumbbell, color: 'text-red-400', bg: 'bg-red-500/10' },
  post_workout: { label: 'Post-Workout', icon: Dumbbell, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  with_meals: { label: 'With Meals', icon: Utensils, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  evening: { label: 'Evening', icon: Sunset, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  bedtime: { label: 'Bedtime', icon: Moon, color: 'text-violet-400', bg: 'bg-violet-500/10' },
}

const CATEGORY_COLORS: Record<string, string> = {
  vitamin: 'bg-amber-500/20 text-amber-400',
  mineral: 'bg-slate-500/20 text-slate-400',
  performance: 'bg-red-500/20 text-red-400',
  recovery: 'bg-blue-500/20 text-blue-400',
  protein: 'bg-purple-500/20 text-purple-400',
  health: 'bg-emerald-500/20 text-emerald-400',
  organ_support: 'bg-teal-500/20 text-teal-400',
  sleep: 'bg-violet-500/20 text-violet-400',
  hormonal: 'bg-pink-500/20 text-pink-400',
}

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export default function SupplementsPage() {
  const [supplements, setSupplements] = useState<SupplementRecommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSupplements() {
      try {
        const res = await fetch('/api/supplements')
        if (!res.ok) throw new Error('Failed to fetch supplements')
        const data = await res.json()
        setSupplements(data.supplements || [])
      } catch (err) {
        setError('Failed to load supplements.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchSupplements()
  }, [])

  // Group by timing
  const grouped = TIMING_ORDER.reduce<Record<SupplementTiming, SupplementRecommendation[]>>(
    (acc, timing) => {
      acc[timing] = supplements.filter((s) => s.timing === timing)
      return acc
    },
    {} as Record<SupplementTiming, SupplementRecommendation[]>
  )

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-5 w-32 animate-pulse rounded bg-muted" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[...Array(2)].map((_, j) => (
                    <div key={j} className="h-16 animate-pulse rounded bg-muted" />
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
            <div className="rounded-full bg-red-500/20 p-3">
              <AlertCircle className="h-6 w-6 text-red-400" />
            </div>
            <div>
              <p className="font-semibold">Failed to load supplements</p>
              <p className="mt-1 text-sm text-muted-foreground">{error}</p>
            </div>
            <Button
              onClick={() => window.location.reload()}
              className="bg-primary hover:bg-primary/90"
            >
              Try again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (supplements.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-emerald-500/10 p-4">
              <Pill className="h-10 w-10 text-emerald-400" />
            </div>
            <div>
              <p className="text-lg font-semibold">No supplements yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your coach has not assigned any supplements to you yet. Check
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
        <h1 className="font-display text-2xl font-bold tracking-tight lg:text-3xl">
          Supplements
        </h1>
        <p className="mt-1 text-muted-foreground">
          Your recommended supplement protocol, organized by timing.
        </p>
      </motion.div>

      {/* Timing Sections */}
      <div className="grid gap-6 sm:grid-cols-2">
        {TIMING_ORDER.map((timing, sectionIndex) => {
          const items = grouped[timing]
          if (items.length === 0) return null
          const config = TIMING_CONFIG[timing]
          const Icon = config.icon

          return (
            <motion.div
              key={timing}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: sectionIndex * 0.08 }}
            >
              <Card className="bg-card">
                <CardHeader className={config.bg}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${config.bg}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-base">{config.label}</CardTitle>
                      <CardDescription>{items.length} supplement{items.length !== 1 ? 's' : ''}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  {items.map((supp) => (
                    <div key={supp.id} className="rounded-lg border border-white/10 bg-card p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{supp.name}</span>
                          <Badge className={CATEGORY_COLORS[supp.category] || 'bg-zinc-700 text-zinc-300'} variant="secondary">
                            {formatLabel(supp.category)}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="font-medium text-foreground">{supp.dosage} {supp.unit}</span>
                        <span>{formatLabel(supp.frequency)}</span>
                        <span>{formatLabel(supp.form)}</span>
                        {supp.brand && <span>{supp.brand}</span>}
                      </div>
                      {supp.notes && (
                        <p className="mt-2 rounded bg-muted/50 p-2 text-xs text-muted-foreground">
                          {supp.notes}
                        </p>
                      )}
                      {supp.cycling_instructions && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          Cycling: {supp.cycling_instructions}
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
