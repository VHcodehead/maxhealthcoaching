'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  Users,
  UserCheck,
  AlertTriangle,
  Target,
  ArrowRight,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import type { Profile, CheckIn } from '@/types/database'

interface ClientWithData extends Profile {
  status: 'active' | 'overdue' | 'pending'
  last_check_in: CheckIn | null
  check_in_count: number
}

interface RecentActivity {
  clientName: string
  clientId: string
  weekNumber: number
  createdAt: string
  adherenceRating: number
}

export default function CoachOverviewPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientWithData[]>([])
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [pendingAdjustmentCount, setPendingAdjustmentCount] = useState(0)
  const [applications, setApplications] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)

        const [clientsRes, activityRes, adjustmentsRes, applicationsRes] = await Promise.all([
          fetch('/api/admin/clients'),
          fetch('/api/coach/activity'),
          fetch('/api/admin/macro-adjustments?status=pending'),
          fetch('/api/admin/applications'),
        ])

        if (!clientsRes.ok) {
          throw new Error('Failed to load clients')
        }
        const clientsData = await clientsRes.json()
        const clientList = clientsData.clients as ClientWithData[]
        setClients(clientList)

        if (!activityRes.ok) {
          throw new Error('Failed to load activity')
        }
        const activityData = await activityRes.json()

        if (activityData.activity) {
          const activities: RecentActivity[] = activityData.activity.map(
            (item: Record<string, unknown>) => ({
              clientName: (item.client_name as string) || 'Unknown',
              clientId: (item.clientId as string) || '',
              weekNumber: item.weekNumber as number,
              createdAt: item.createdAt as string,
              adherenceRating: item.adherenceRating as number,
            })
          )
          setRecentActivity(activities)
        }

        if (adjustmentsRes.ok) {
          const adjustmentsData = await adjustmentsRes.json()
          setPendingAdjustmentCount(adjustmentsData.adjustments?.length ?? 0)
        }

        if (applicationsRes.ok) {
          const applicationsData = await applicationsRes.json()
          setApplications(applicationsData.applications ?? [])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const totalClients = clients.length
  const activeClients = clients.filter((c) => c.status === 'active').length
  const overdueClients = clients.filter((c) => c.status === 'overdue').length

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const goalLabels: Record<string, string> = {
    lose_fat: 'Lose fat & get lean',
    build_muscle: 'Build muscle & size',
    recomp: 'Body recomposition',
    general_health: 'General health & fitness',
    competition: 'Competition / show prep',
  }

  async function handleApplicationAction(id: string, action: 'approve' | 'reject') {
    try {
      const res = await fetch(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error('Request failed')
      setApplications((prev) => prev.filter((a) => (a.id as string) !== id))
      toast(action === 'approve' ? 'Application approved' : 'Application rejected')
    } catch {
      toast('Something went wrong. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
        <AlertTriangle className="size-12 text-destructive" />
        <p className="text-lg text-muted-foreground">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Coach Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your coaching practice
        </p>
      </div>

      {/* Pending Applications */}
      {applications.length > 0 && (
        <Card className="bg-card border-l-4 border-l-amber-500">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CardTitle>Pending Applications</CardTitle>
              <Badge className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/20 border-amber-500/30">
                {applications.length}
              </Badge>
            </div>
            <CardDescription>Review and approve or reject applicants</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {applications.map((app) => {
              const id = app.id as string
              const fullName = (app.full_name as string) || 'Unknown'
              const email = app.email as string | undefined
              const createdAt = app.created_at as string | undefined
              const goal = app.application_goal as string | undefined
              const experience = app.application_experience as string | undefined
              const commitment = app.application_commitment as string | undefined
              const gender = app.application_gender as string | undefined
              const age = app.application_age as number | undefined
              const heightFt = app.application_height_ft as number | undefined
              const heightIn = app.application_height_in as number | undefined
              const weightLbs = app.application_weight_lbs as number | undefined
              const motivation = app.application_motivation as string | undefined

              return (
                <div key={id} className="rounded-lg border border-border p-4 space-y-3 bg-background/50">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-base text-foreground">{fullName}</p>
                      {email && <p className="text-sm text-muted-foreground">{email}</p>}
                      {createdAt && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Applied {formatDate(createdAt)}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        size="sm"
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        onClick={() => handleApplicationAction(id, 'approve')}
                      >
                        <CheckCircle2 className="size-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-500/50 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                        onClick={() => handleApplicationAction(id, 'reject')}
                      >
                        <XCircle className="size-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm">
                    {goal && (
                      <div>
                        <p className="text-xs text-muted-foreground">Goal</p>
                        <p className="font-medium text-foreground">{goalLabels[goal] ?? goal}</p>
                      </div>
                    )}
                    {experience && (
                      <div>
                        <p className="text-xs text-muted-foreground">Experience</p>
                        <p className="font-medium text-foreground capitalize">{experience}</p>
                      </div>
                    )}
                    {commitment && (
                      <div>
                        <p className="text-xs text-muted-foreground">Commitment</p>
                        <p className="font-medium text-foreground">{commitment} days/week</p>
                      </div>
                    )}
                    {(age || gender) && (
                      <div>
                        <p className="text-xs text-muted-foreground">Demographics</p>
                        <p className="font-medium text-foreground">
                          {[age ? `${age}y` : null, gender ? gender.charAt(0).toUpperCase() + gender.slice(1) : null].filter(Boolean).join(', ')}
                        </p>
                      </div>
                    )}
                    {(heightFt !== undefined || weightLbs !== undefined) && (
                      <div>
                        <p className="text-xs text-muted-foreground">Body Stats</p>
                        <p className="font-medium text-foreground">
                          {[
                            heightFt !== undefined ? `${heightFt}'${heightIn ?? 0}"` : null,
                            weightLbs !== undefined ? `${weightLbs} lbs` : null,
                          ].filter(Boolean).join(' / ')}
                        </p>
                      </div>
                    )}
                  </div>

                  {motivation && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Why now?</p>
                      <blockquote className="rounded-md bg-zinc-800 border-l-2 border-l-amber-500 px-3 py-2 text-sm text-foreground/80 italic">
                        {motivation}
                      </blockquote>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-l-4 border-l-emerald-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Clients</CardDescription>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold text-foreground">{totalClients}</div>
          </CardContent>
        </Card>

        <Card className="bg-card border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Active</CardDescription>
            <UserCheck className="size-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold text-blue-400">
              {activeClients}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-l-4 border-l-violet-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Overdue Check-ins</CardDescription>
            <AlertTriangle className="size-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="font-display text-3xl font-bold text-violet-400">
              {overdueClients}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-l-4 border-l-amber-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Pending Macro Reviews</CardDescription>
            <Target className="size-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className={`font-display text-3xl font-bold ${pendingAdjustmentCount > 0 ? 'text-amber-400' : 'text-foreground'}`}>
              {pendingAdjustmentCount}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent activity feed */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Latest check-ins across all clients
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No recent activity yet
              </p>
            ) : (
              <div className="divide-y divide-white/10">
                {recentActivity.map((activity, i) => (
                  <div
                    key={i}
                    className="flex cursor-pointer items-center justify-between py-3 px-2 transition-colors hover:bg-muted/50 rounded-lg"
                    onClick={() =>
                      router.push(`/coach/clients/${activity.clientId}`)
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-9 items-center justify-center rounded-full bg-primary/20 text-sm font-medium text-primary">
                        {activity.clientName
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {activity.clientName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Week {activity.weekNumber} check-in
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          activity.adherenceRating >= 7
                            ? 'default'
                            : activity.adherenceRating >= 4
                            ? 'secondary'
                            : 'destructive'
                        }
                        className={
                          activity.adherenceRating >= 7
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : ''
                        }
                      >
                        {activity.adherenceRating}/10
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        <Clock className="mr-1 inline size-3" />
                        {formatDate(activity.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common coach tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between hover:border-primary"
              onClick={() => router.push('/coach/clients')}
            >
              <span className="flex items-center gap-2">
                <Users className="size-4" />
                View All Clients
              </span>
              <ArrowRight className="size-4" />
            </Button>

            {pendingAdjustmentCount > 0 && (
              <Button
                variant="outline"
                className="w-full justify-between border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500"
                onClick={() => router.push('/coach/clients')}
              >
                <span className="flex items-center gap-2">
                  <Target className="size-4" />
                  {pendingAdjustmentCount} Macro Adjustment{pendingAdjustmentCount !== 1 ? 's' : ''} to Review
                </span>
                <ArrowRight className="size-4" />
              </Button>
            )}

            {overdueClients > 0 && (
              <Button
                variant="outline"
                className="w-full justify-between border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300 hover:border-amber-500"
                onClick={() => router.push('/coach/clients?status=overdue')}
              >
                <span className="flex items-center gap-2">
                  <AlertTriangle className="size-4" />
                  {overdueClients} Overdue Client
                  {overdueClients !== 1 ? 's' : ''}
                </span>
                <ArrowRight className="size-4" />
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full justify-between hover:border-primary"
              onClick={() => router.push('/coach/leads')}
            >
              <span className="flex items-center gap-2">
                <Users className="size-4" />
                View New Leads
              </span>
              <ArrowRight className="size-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between hover:border-primary"
              onClick={() => router.push('/coach/content')}
            >
              <span className="flex items-center gap-2">
                <Users className="size-4" />
                Manage Content
              </span>
              <ArrowRight className="size-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
