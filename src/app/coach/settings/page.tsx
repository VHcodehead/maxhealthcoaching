'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Loader2,
  Settings,
  Save,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react'
import type { CoachSettings } from '@/types/database'

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [settings, setSettings] = useState<CoachSettings | null>(null)
  const [form, setForm] = useState({
    max_clients: 20,
    spots_remaining: 5,
    promo_active: false,
    promo_end: '',
    promo_discount_percent: 0,
    welcome_message: '',
  })

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true)

      const res = await fetch('/api/coach/settings')
      if (!res.ok) {
        throw new Error('Failed to load settings')
      }

      const data = await res.json()

      if (data.settings) {
        const s = data.settings
        setSettings(s)
        setForm({
          max_clients: s.maxClients ?? s.max_clients ?? 20,
          spots_remaining: s.spotsRemaining ?? s.spots_remaining ?? 5,
          promo_active: s.promoActive ?? s.promo_active ?? false,
          promo_end: s.promoEnd || s.promo_end
            ? new Date(s.promoEnd || s.promo_end).toISOString().split('T')[0]
            : '',
          promo_discount_percent: s.promoDiscountPercent ?? s.promo_discount_percent ?? 0,
          welcome_message: s.welcomeMessage ?? s.welcome_message ?? '',
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
  }, [loadSettings])

  async function handleSave() {
    try {
      setSaving(true)
      setSuccess(false)
      setError(null)

      const res = await fetch('/api/coach/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxClients: form.max_clients,
          spotsRemaining: form.spots_remaining,
          promoActive: form.promo_active,
          promoEnd: form.promo_end || null,
          promoDiscountPercent: form.promo_discount_percent,
          welcomeMessage: form.welcome_message,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save settings')
      }

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      await loadSettings()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your coaching practice configuration
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Success banner */}
      {success && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle className="size-4 shrink-0" />
          Settings saved successfully!
        </div>
      )}

      {/* Capacity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="size-5 text-emerald-600" />
            <CardTitle>Client Capacity</CardTitle>
          </div>
          <CardDescription>
            Set the maximum number of clients you can handle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="max-clients">Maximum Clients</Label>
              <Input
                id="max-clients"
                type="number"
                min={1}
                max={100}
                value={form.max_clients}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    max_clients: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                The total number of clients you can accept
              </p>
            </div>

            <div>
              <Label htmlFor="spots-remaining">Spots Remaining</Label>
              <Input
                id="spots-remaining"
                type="number"
                min={0}
                max={form.max_clients}
                value={form.spots_remaining}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    spots_remaining: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Shown on pricing page to create urgency
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promo Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Promotional Settings</CardTitle>
          <CardDescription>
            Configure limited-time promotions for new clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="promo-active"
              checked={form.promo_active}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  promo_active: e.target.checked,
                }))
              }
              className="size-4 rounded border accent-emerald-600"
            />
            <Label htmlFor="promo-active">
              Enable promotional pricing
            </Label>
          </div>

          {form.promo_active && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="promo-end">Promo End Date</Label>
                <Input
                  id="promo-end"
                  type="date"
                  value={form.promo_end}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      promo_end: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label htmlFor="promo-discount">Discount Percentage</Label>
                <div className="relative">
                  <Input
                    id="promo-discount"
                    type="number"
                    min={0}
                    max={100}
                    value={form.promo_discount_percent}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        promo_discount_percent:
                          parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    %
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Welcome Message */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome Message</CardTitle>
          <CardDescription>
            Shown to new clients after they sign up and complete onboarding
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            value={form.welcome_message}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                welcome_message: e.target.value,
              }))
            }
            placeholder="Welcome to MaxHealth coaching! I'm excited to work with you on your fitness journey..."
            rows={6}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] outline-none"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Supports plain text. Keep it personal and encouraging.
          </p>
        </CardContent>
      </Card>

      <Separator />

      {/* Save button */}
      <div className="flex justify-end">
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="mr-1 size-4 animate-spin" />
          ) : (
            <Save className="mr-1 size-4" />
          )}
          Save Settings
        </Button>
      </div>
    </div>
  )
}
