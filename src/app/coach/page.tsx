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
  DollarSign,
  ArrowRight,
  Clock,
  Loader2,
} from 'lucide-react'
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

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true)

        const [clientsRes, activityRes] = await Promise.all([
          fetch('/api/admin/clients'),
          fetch('/api/coach/activity'),
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
  // Placeholder MRR (would be calculated from Stripe in production)
  const mrr = activeClients * 149

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
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
        <h1 className="text-2xl font-bold tracking-tight">Coach Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your coaching practice
        </p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Total Clients</CardDescription>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalClients}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Active</CardDescription>
            <UserCheck className="size-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {activeClients}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Overdue Check-ins</CardDescription>
            <AlertTriangle className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-500">
              {overdueClients}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardDescription>Monthly Revenue</CardDescription>
            <DollarSign className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${mrr.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Estimated MRR</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent activity feed */}
        <Card>
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
              <div className="space-y-4">
                {recentActivity.map((activity, i) => (
                  <div key={i}>
                    <div
                      className="flex cursor-pointer items-center justify-between rounded-lg p-2 transition-colors hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/coach/clients/${activity.clientId}`)
                      }
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex size-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-medium text-emerald-700">
                          {activity.clientName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
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
                              ? 'bg-emerald-100 text-emerald-700'
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
                    {i < recentActivity.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common coach tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => router.push('/coach/clients')}
            >
              <span className="flex items-center gap-2">
                <Users className="size-4" />
                View All Clients
              </span>
              <ArrowRight className="size-4" />
            </Button>

            {overdueClients > 0 && (
              <Button
                variant="outline"
                className="w-full justify-between border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 hover:text-amber-800"
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
              className="w-full justify-between"
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
              className="w-full justify-between"
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
