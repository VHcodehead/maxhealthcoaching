'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Search,
  Loader2,
  AlertTriangle,
  Users,
} from 'lucide-react'
import type { Profile, CheckIn, MacroTargets, OnboardingResponse } from '@/types/database'

interface ClientWithData extends Profile {
  status: 'active' | 'overdue' | 'pending'
  last_check_in: CheckIn | null
  check_in_count: number
  macros: MacroTargets | null
  onboarding: OnboardingResponse | null
}

type StatusFilter = 'all' | 'active' | 'overdue' | 'pending'

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className: string }> = {
  active: {
    label: 'Active',
    variant: 'default',
    className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
  },
  overdue: {
    label: 'Overdue',
    variant: 'destructive',
    className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  },
  pending: {
    label: 'Pending',
    variant: 'secondary',
    className: '',
  },
}

function SkeletonRow() {
  return (
    <TableRow>
      {Array.from({ length: 6 }).map((_, i) => (
        <TableCell key={i}>
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
        </TableCell>
      ))}
    </TableRow>
  )
}

export default function ClientsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center p-12"><div className="w-8 h-8 border-2 border-zinc-200 border-t-zinc-600 rounded-full animate-spin" /></div>}>
      <ClientsContent />
    </Suspense>
  )
}

function ClientsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientWithData[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(
    (searchParams.get('status') as StatusFilter) || 'all'
  )

  useEffect(() => {
    async function loadClients() {
      try {
        setLoading(true)
        const res = await fetch('/api/admin/clients')
        if (!res.ok) {
          throw new Error('Failed to load clients')
        }
        const data = await res.json()
        setClients(data.clients || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clients')
      } finally {
        setLoading(false)
      }
    }

    loadClients()
  }, [])

  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      const matchesStatus =
        statusFilter === 'all' || client.status === statusFilter
      const searchLower = search.toLowerCase()
      const matchesSearch =
        !search ||
        client.full_name.toLowerCase().includes(searchLower) ||
        client.email.toLowerCase().includes(searchLower)
      return matchesStatus && matchesSearch
    })
  }, [clients, statusFilter, search])

  const counts = useMemo(() => {
    return {
      all: clients.length,
      active: clients.filter((c) => c.status === 'active').length,
      overdue: clients.filter((c) => c.status === 'overdue').length,
      pending: clients.filter((c) => c.status === 'pending').length,
    }
  }, [clients])

  function formatDate(dateStr: string | null | undefined) {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  function subscriptionLabel(status: string) {
    const labels: Record<string, string> = {
      active: 'Active',
      past_due: 'Past Due',
      canceled: 'Canceled',
      trialing: 'Trial',
      none: 'None',
    }
    return labels[status] || status
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
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">
          Manage and monitor all your coaching clients
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="size-5 text-emerald-600" />
              Client List
            </CardTitle>

            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Status filter tabs */}
          <div className="flex gap-1 pt-2">
            {(
              [
                { value: 'all', label: 'All' },
                { value: 'active', label: 'Active' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'pending', label: 'Pending' },
              ] as const
            ).map((tab) => (
              <Button
                key={tab.value}
                variant={statusFilter === tab.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(tab.value)}
                className={
                  statusFilter === tab.value
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                    : ''
                }
              >
                {tab.label}
                <span className="ml-1.5 text-xs opacity-70">
                  ({counts[tab.value]})
                </span>
              </Button>
            ))}
          </div>
        </CardHeader>

        <Separator />

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Last Check-in</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              ) : filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="size-8 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {search || statusFilter !== 'all'
                          ? 'No clients match your filters'
                          : 'No clients yet'}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClients.map((client) => {
                  const config = statusConfig[client.status]
                  return (
                    <TableRow
                      key={client.user_id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/coach/clients/${client.user_id}`)
                      }
                    >
                      <TableCell className="font-medium">
                        {client.full_name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {client.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={config.variant}
                          className={config.className}
                        >
                          {config.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subscriptionLabel(client.subscription_status)}
                      </TableCell>
                      <TableCell>
                        {client.last_check_in
                          ? formatDate(client.last_check_in.created_at)
                          : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/coach/clients/${client.user_id}`)
                          }}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
