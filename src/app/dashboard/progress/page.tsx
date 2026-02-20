'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Camera,
  Scale,
  AlertCircle,
  CheckCircle2,
  ArrowLeftRight,
  X,
  ImageIcon,
  Loader2,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'

interface ProgressPhoto {
  id: string
  checkInId: string
  photoType: string // 'front' | 'side' | 'back'
  storagePath: string
  signed_url?: string
}

interface CheckIn {
  id: string
  createdAt: string
  weekNumber: number
  weightKg: number | null
  adherenceRating: number | null
  notes: string | null
  progressPhotos: ProgressPhoto[]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function WeightChart({ checkIns }: { checkIns: CheckIn[] }) {
  const weightsData = checkIns
    .filter((c) => c.weightKg != null)
    .sort(
      (a, b) =>
        new Date(a.createdAt).getTime() -
        new Date(b.createdAt).getTime()
    )

  if (weightsData.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <Scale className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">
            No weight data recorded yet.
          </p>
        </CardContent>
      </Card>
    )
  }

  const weights = weightsData.map((c) => c.weightKg as number)
  const minWeight = Math.min(...weights)
  const maxWeight = Math.max(...weights)
  const range = maxWeight - minWeight || 1
  const chartHeight = 160

  // Calculate trend
  const firstWeight = weights[0]
  const lastWeight = weights[weights.length - 1]
  const weightChange = lastWeight - firstWeight
  const isDown = weightChange < 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-md bg-emerald-100 p-1.5">
                <Scale className="h-4 w-4 text-emerald-600" />
              </div>
              Weight Trend
            </CardTitle>
            <div className="flex items-center gap-1.5">
              {weightChange !== 0 && (
                <>
                  {isDown ? (
                    <TrendingDown className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <TrendingUp className="h-4 w-4 text-rose-500" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      isDown ? 'text-emerald-600' : 'text-rose-500'
                    }`}
                  >
                    {weightChange > 0 ? '+' : ''}
                    {weightChange.toFixed(1)} kg
                  </span>
                </>
              )}
            </div>
          </div>
          <CardDescription>
            {weightsData.length} check-in{weightsData.length !== 1 ? 's' : ''}{' '}
            recorded
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Simple SVG chart */}
          <div className="relative">
            <svg
              viewBox={`0 0 ${Math.max(weightsData.length * 60, 300)} ${chartHeight + 40}`}
              className="h-48 w-full"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                const y = 20 + (1 - pct) * chartHeight
                const weightVal = (minWeight + pct * range).toFixed(1)
                return (
                  <g key={pct}>
                    <line
                      x1={40}
                      y1={y}
                      x2={Math.max(weightsData.length * 60, 300) - 10}
                      y2={y}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                      strokeDasharray="4,4"
                    />
                    <text
                      x={36}
                      y={y + 4}
                      textAnchor="end"
                      className="fill-muted-foreground text-[10px]"
                    >
                      {weightVal}
                    </text>
                  </g>
                )
              })}

              {/* Line path */}
              {weightsData.length > 1 && (
                <path
                  d={weightsData
                    .map((d, i) => {
                      const x =
                        40 +
                        (i / (weightsData.length - 1)) *
                          (Math.max(weightsData.length * 60, 300) - 60)
                      const y =
                        20 +
                        (1 - ((d.weightKg as number) - minWeight) / range) *
                          chartHeight
                      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
                    })
                    .join(' ')}
                  fill="none"
                  stroke="#059669"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              )}

              {/* Data points */}
              {weightsData.map((d, i) => {
                const x =
                  weightsData.length === 1
                    ? Math.max(weightsData.length * 60, 300) / 2
                    : 40 +
                      (i / (weightsData.length - 1)) *
                        (Math.max(weightsData.length * 60, 300) - 60)
                const y =
                  20 +
                  (1 - ((d.weightKg as number) - minWeight) / range) *
                    chartHeight
                return (
                  <g key={d.id}>
                    <circle
                      cx={x}
                      cy={y}
                      r={5}
                      fill="white"
                      stroke="#059669"
                      strokeWidth={2.5}
                    />
                    <text
                      x={x}
                      y={chartHeight + 36}
                      textAnchor="middle"
                      className="fill-muted-foreground text-[9px]"
                    >
                      {new Date(d.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </text>
                  </g>
                )
              })}
            </svg>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function PhotoThumbnail({
  photo,
  label,
  onClick,
}: {
  photo: ProgressPhoto | undefined
  label: string
  onClick?: () => void
}) {
  if (!photo?.signed_url) {
    return (
      <div className="flex aspect-[3/4] w-full items-center justify-center rounded-lg border-2 border-dashed border-muted bg-muted/30">
        <div className="text-center">
          <ImageIcon className="mx-auto h-6 w-6 text-muted-foreground/40" />
          <p className="mt-1 text-[10px] text-muted-foreground">{label}</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={onClick}
      className="group relative aspect-[3/4] w-full overflow-hidden rounded-lg border bg-muted transition-all hover:ring-2 hover:ring-emerald-500"
    >
      <img
        src={photo.signed_url}
        alt={label}
        className="h-full w-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2">
        <p className="text-[10px] font-medium text-white">{label}</p>
      </div>
    </button>
  )
}

export default function ProgressPage() {
  const [checkIns, setCheckIns] = useState<CheckIn[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [compareMode, setCompareMode] = useState(false)
  const [selectedCheckIns, setSelectedCheckIns] = useState<string[]>([])
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProgress() {
      try {
        const res = await fetch('/api/checkin')
        if (!res.ok) throw new Error('Failed to fetch progress data')
        const data = await res.json()

        if (data.checkIns) {
          // Map progressPhotos to include signed_url via the photos API route
          const checkInsWithPhotoUrls = data.checkIns.map((checkIn: CheckIn) => ({
            ...checkIn,
            progressPhotos: (checkIn.progressPhotos || []).map((photo: ProgressPhoto) => ({
              ...photo,
              signed_url: `/api/photos/${photo.storagePath}`,
            })),
          }))
          setCheckIns(checkInsWithPhotoUrls)
        }
      } catch (err) {
        setError('Failed to load progress data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchProgress()
  }, [])

  const toggleCheckInSelection = (id: string) => {
    setSelectedCheckIns((prev) => {
      if (prev.includes(id)) {
        return prev.filter((cId) => cId !== id)
      }
      if (prev.length >= 2) {
        return [prev[1], id]
      }
      return [...prev, id]
    })
  }

  const getCheckInPhotos = (checkInId: string) => {
    const checkIn = checkIns.find((c) => c.id === checkInId)
    return checkIn?.progressPhotos || []
  }

  const getPhotoByType = (checkInId: string, type: string) => {
    const photos = getCheckInPhotos(checkInId)
    return photos.find((p) => p.photoType === type)
  }

  const compareCheckInsData = useMemo(() => {
    if (selectedCheckIns.length !== 2) return null
    return selectedCheckIns.map((id) =>
      checkIns.find((c) => c.id === id)
    ).filter(Boolean) as CheckIn[]
  }, [selectedCheckIns, checkIns])

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-72 animate-pulse rounded bg-muted" />
        </div>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="h-48 animate-pulse rounded bg-muted" />
          </CardContent>
        </Card>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="h-16 w-16 animate-pulse rounded bg-muted" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-48 animate-pulse rounded bg-muted" />
                    <div className="h-3 w-64 animate-pulse rounded bg-muted" />
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
              <p className="font-semibold">Failed to load progress</p>
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

  if (checkIns.length === 0) {
    return (
      <div className="p-6 lg:p-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            Progress
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track your weight, photos, and check-in history.
          </p>
        </motion.div>
        <Card className="max-w-lg">
          <CardContent className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="rounded-full bg-emerald-50 p-4">
              <TrendingUp className="h-10 w-10 text-emerald-300" />
            </div>
            <div>
              <p className="text-lg font-semibold">No check-ins yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Your progress will appear here after your first check-in.
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
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
              Progress
            </h1>
            <p className="mt-1 text-muted-foreground">
              Track your weight, photos, and check-in history.
            </p>
          </div>
          <Button
            variant={compareMode ? 'default' : 'outline'}
            className={
              compareMode
                ? 'gap-2 bg-emerald-600 hover:bg-emerald-700'
                : 'gap-2'
            }
            onClick={() => {
              setCompareMode(!compareMode)
              setSelectedCheckIns([])
            }}
          >
            <ArrowLeftRight className="h-4 w-4" />
            {compareMode ? 'Exit Compare' : 'Compare Photos'}
          </Button>
        </div>
      </motion.div>

      {/* Compare Mode Banner */}
      {compareMode && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6"
        >
          <Card className="border-emerald-200 bg-emerald-50/50">
            <CardContent className="flex items-center gap-3 pt-6">
              <ArrowLeftRight className="h-5 w-5 text-emerald-600" />
              <p className="text-sm text-emerald-800">
                Select two check-ins below to compare photos side by side.{' '}
                <span className="font-medium">
                  {selectedCheckIns.length}/2 selected
                </span>
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Side-by-Side Comparison */}
      {compareMode && compareCheckInsData && compareCheckInsData.length === 2 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Camera className="h-4 w-4 text-emerald-600" />
                Photo Comparison
              </CardTitle>
              <CardDescription>
                {formatDate(compareCheckInsData[0].createdAt)} vs{' '}
                {formatDate(compareCheckInsData[1].createdAt)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                {['front', 'side', 'back'].map((type) => (
                  <div key={type}>
                    <p className="mb-2 text-center text-sm font-semibold capitalize">
                      {type}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {compareCheckInsData.map((ci) => {
                        const photo = getPhotoByType(ci.id, type)
                        return (
                          <div key={ci.id} className="space-y-1">
                            <PhotoThumbnail
                              photo={photo}
                              label={`${type} - ${formatDate(ci.createdAt)}`}
                              onClick={() =>
                                photo?.signed_url &&
                                setLightboxPhoto(photo.signed_url)
                              }
                            />
                            <p className="text-center text-[10px] text-muted-foreground">
                              {formatDate(ci.createdAt)}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Weight Chart */}
      <div className="mb-8">
        <WeightChart checkIns={checkIns} />
      </div>

      {/* Check-in History */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="mb-4 text-lg font-semibold">Check-in History</h2>
        <div className="space-y-4">
          {checkIns.map((checkIn, i) => {
            const checkInPhotos = checkIn.progressPhotos || []
            const isSelected = selectedCheckIns.includes(checkIn.id)
            const frontPhoto = checkInPhotos.find(
              (p) => p.photoType === 'front'
            )
            const sidePhoto = checkInPhotos.find(
              (p) => p.photoType === 'side'
            )
            const backPhoto = checkInPhotos.find(
              (p) => p.photoType === 'back'
            )

            return (
              <motion.div
                key={checkIn.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className={`transition-all ${
                    compareMode
                      ? 'cursor-pointer hover:border-emerald-300'
                      : ''
                  } ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/30 ring-1 ring-emerald-500'
                      : ''
                  }`}
                  onClick={() =>
                    compareMode && toggleCheckInSelection(checkIn.id)
                  }
                >
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 sm:flex-row">
                      {/* Date and weight */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          {compareMode && (
                            <div
                              className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                                isSelected
                                  ? 'border-emerald-500 bg-emerald-500'
                                  : 'border-muted-foreground/30'
                              }`}
                            >
                              {isSelected && (
                                <CheckCircle2 className="h-4 w-4 text-white" />
                              )}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <p className="font-semibold">
                                {formatDate(checkIn.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {checkIn.weightKg != null && (
                            <Badge
                              variant="outline"
                              className="gap-1 text-xs"
                            >
                              <Scale className="h-3 w-3" />
                              {checkIn.weightKg} kg
                            </Badge>
                          )}
                          {checkIn.adherenceRating != null && (
                            <Badge
                              variant="secondary"
                              className={`gap-1 text-xs ${
                                checkIn.adherenceRating >= 8
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : checkIn.adherenceRating >= 5
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-red-100 text-red-700'
                              }`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {checkIn.adherenceRating}/10 adherence
                            </Badge>
                          )}
                        </div>

                        {checkIn.notes && (
                          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                            {checkIn.notes}
                          </p>
                        )}
                      </div>

                      {/* Photo thumbnails */}
                      {checkInPhotos.length > 0 && (
                        <div className="flex gap-2 sm:w-48">
                          <PhotoThumbnail
                            photo={frontPhoto}
                            label="Front"
                            onClick={() =>
                              frontPhoto?.signed_url &&
                              setLightboxPhoto(frontPhoto.signed_url)
                            }
                          />
                          <PhotoThumbnail
                            photo={sidePhoto}
                            label="Side"
                            onClick={() =>
                              sidePhoto?.signed_url &&
                              setLightboxPhoto(sidePhoto.signed_url)
                            }
                          />
                          <PhotoThumbnail
                            photo={backPhoto}
                            label="Back"
                            onClick={() =>
                              backPhoto?.signed_url &&
                              setLightboxPhoto(backPhoto.signed_url)
                            }
                          />
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </motion.div>

      {/* Photo Lightbox */}
      <Dialog
        open={!!lightboxPhoto}
        onOpenChange={() => setLightboxPhoto(null)}
      >
        <DialogContent className="max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Progress Photo</DialogTitle>
            <DialogDescription>Full size progress photo</DialogDescription>
          </DialogHeader>
          {lightboxPhoto && (
            <img
              src={lightboxPhoto}
              alt="Progress photo"
              className="h-auto max-h-[80vh] w-full rounded-lg object-contain"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
