'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Pill, ChevronDown, ChevronUp, Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import type {
  SupplementRecommendation,
  SupplementFrequency,
  SupplementTiming,
  SupplementCategory,
  SupplementForm,
} from '@/types/database'

const CATEGORY_COLORS: Record<string, string> = {
  vitamin: 'bg-amber-100 text-amber-700',
  mineral: 'bg-slate-100 text-slate-700',
  performance: 'bg-red-100 text-red-700',
  recovery: 'bg-blue-100 text-blue-700',
  protein: 'bg-purple-100 text-purple-700',
  health: 'bg-emerald-100 text-emerald-700',
}

const TIMING_COLORS: Record<string, string> = {
  morning: 'bg-orange-100 text-orange-700',
  pre_workout: 'bg-red-100 text-red-700',
  post_workout: 'bg-blue-100 text-blue-700',
  with_meals: 'bg-emerald-100 text-emerald-700',
  evening: 'bg-indigo-100 text-indigo-700',
  bedtime: 'bg-violet-100 text-violet-700',
}

const FREQUENCIES: { value: SupplementFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'as_needed', label: 'As Needed' },
  { value: 'cycling', label: 'Cycling' },
]

const TIMINGS: { value: SupplementTiming; label: string }[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'pre_workout', label: 'Pre-Workout' },
  { value: 'post_workout', label: 'Post-Workout' },
  { value: 'with_meals', label: 'With Meals' },
  { value: 'evening', label: 'Evening' },
  { value: 'bedtime', label: 'Bedtime' },
]

const CATEGORIES: { value: SupplementCategory; label: string }[] = [
  { value: 'vitamin', label: 'Vitamin' },
  { value: 'mineral', label: 'Mineral' },
  { value: 'performance', label: 'Performance' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'protein', label: 'Protein' },
  { value: 'health', label: 'Health' },
]

const FORMS: { value: SupplementForm; label: string }[] = [
  { value: 'capsule', label: 'Capsule' },
  { value: 'powder', label: 'Powder' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'softgel', label: 'Softgel' },
]

interface CoachSupplementsProps {
  clientId: string
}

interface SupplementFormData {
  name: string
  dosage: string
  unit: string
  frequency: SupplementFrequency
  timing: SupplementTiming
  category: SupplementCategory
  form: SupplementForm
  brand: string
  cycling_instructions: string
  notes: string
}

const emptyForm: SupplementFormData = {
  name: '',
  dosage: '',
  unit: 'mg',
  frequency: 'daily',
  timing: 'morning',
  category: 'health',
  form: 'capsule',
  brand: '',
  cycling_instructions: '',
  notes: '',
}

function formatLabel(str: string) {
  return str.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
}

export function CoachSupplements({ clientId }: CoachSupplementsProps) {
  const [expanded, setExpanded] = useState(false)
  const [supplements, setSupplements] = useState<SupplementRecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<SupplementFormData>(emptyForm)

  const loadSupplements = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/supplements?user_id=${clientId}`)
      if (!res.ok) throw new Error('Failed to load supplements')
      const data = await res.json()
      setSupplements(data.supplements || [])
    } catch {
      setError('Failed to load supplements')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (expanded && supplements.length === 0 && !loading) {
      loadSupplements()
    }
  }, [expanded, supplements.length, loading, loadSupplements])

  const handleSubmitAdd = async () => {
    if (!formData.name.trim() || !formData.dosage.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/supplements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: clientId,
          ...formData,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add supplement')
      }

      const data = await res.json()
      setSupplements((prev) => [data.supplement, ...prev])
      setFormData(emptyForm)
      setShowAddForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add supplement')
    } finally {
      setSaving(false)
    }
  }

  const handleStartEdit = (supp: SupplementRecommendation) => {
    setEditingId(supp.id)
    setFormData({
      name: supp.name,
      dosage: supp.dosage,
      unit: supp.unit,
      frequency: supp.frequency,
      timing: supp.timing,
      category: supp.category,
      form: supp.form,
      brand: supp.brand || '',
      cycling_instructions: supp.cycling_instructions || '',
      notes: supp.notes || '',
    })
  }

  const handleSaveEdit = async () => {
    if (!editingId) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/supplements/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update supplement')
      }

      const data = await res.json()
      setSupplements((prev) =>
        prev.map((s) => (s.id === editingId ? data.supplement : s))
      )
      setEditingId(null)
      setFormData(emptyForm)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update supplement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/supplements/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      setSupplements((prev) =>
        prev.map((s) => (s.id === id ? { ...s, active: false } : s))
      )
    } catch {
      setError('Failed to delete supplement')
    }
  }

  const renderFormFields = () => (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <div>
          <Label className="text-xs">Name *</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Vitamin D3"
          />
        </div>
        <div>
          <Label className="text-xs">Dosage *</Label>
          <Input
            value={formData.dosage}
            onChange={(e) => setFormData((p) => ({ ...p, dosage: e.target.value }))}
            placeholder="e.g. 5000"
          />
        </div>
        <div>
          <Label className="text-xs">Unit</Label>
          <Input
            value={formData.unit}
            onChange={(e) => setFormData((p) => ({ ...p, unit: e.target.value }))}
            placeholder="mg, IU, g"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div>
          <Label className="text-xs">Frequency</Label>
          <select
            value={formData.frequency}
            onChange={(e) => setFormData((p) => ({ ...p, frequency: e.target.value as SupplementFrequency }))}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            {FREQUENCIES.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Timing</Label>
          <select
            value={formData.timing}
            onChange={(e) => setFormData((p) => ({ ...p, timing: e.target.value as SupplementTiming }))}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            {TIMINGS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Category</Label>
          <select
            value={formData.category}
            onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value as SupplementCategory }))}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <Label className="text-xs">Form</Label>
          <select
            value={formData.form}
            onChange={(e) => setFormData((p) => ({ ...p, form: e.target.value as SupplementForm }))}
            className="h-9 w-full rounded-md border bg-background px-2 text-sm"
          >
            {FORMS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <Label className="text-xs">Brand (optional)</Label>
          <Input
            value={formData.brand}
            onChange={(e) => setFormData((p) => ({ ...p, brand: e.target.value }))}
            placeholder="e.g. NOW Foods"
          />
        </div>
        <div>
          <Label className="text-xs">Notes (optional)</Label>
          <Input
            value={formData.notes}
            onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
            placeholder="Additional instructions"
          />
        </div>
      </div>

      {formData.frequency === 'cycling' && (
        <div>
          <Label className="text-xs">Cycling Instructions</Label>
          <Input
            value={formData.cycling_instructions}
            onChange={(e) => setFormData((p) => ({ ...p, cycling_instructions: e.target.value }))}
            placeholder="e.g. 8 weeks on, 4 weeks off"
          />
        </div>
      )}
    </div>
  )

  const activeSupps = supplements.filter((s) => s.active)
  const inactiveSupps = supplements.filter((s) => !s.active)

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="size-5 text-emerald-600" />
            <CardTitle>Supplements</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{activeSupps.length} active</Badge>
            {expanded ? (
              <ChevronUp className="size-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-5 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Add Button / Form */}
          {!showAddForm ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFormData(emptyForm)
                setShowAddForm(true)
                setEditingId(null)
              }}
            >
              <Plus className="mr-1 size-3" />
              Add Supplement
            </Button>
          ) : (
            <div className="space-y-3 rounded-lg border border-dashed p-4">
              <span className="text-sm font-medium">New Supplement</span>
              {renderFormFields()}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <div className="flex gap-2">
                <Button onClick={handleSubmitAdd} disabled={saving || !formData.name.trim() || !formData.dosage.trim()} size="sm">
                  {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
                  Save
                </Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setError(null) }}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Supplements List */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : activeSupps.length === 0 && inactiveSupps.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No supplements assigned yet
            </p>
          ) : (
            <div className="space-y-3">
              {activeSupps.map((supp) => (
                <div key={supp.id} className="rounded-lg border p-3">
                  {editingId === supp.id ? (
                    <div className="space-y-3">
                      {renderFormFields()}
                      {error && <p className="text-sm text-destructive">{error}</p>}
                      <div className="flex gap-2">
                        <Button onClick={handleSaveEdit} disabled={saving} size="sm">
                          {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
                          <Check className="mr-1 size-3" />
                          Save
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => { setEditingId(null); setError(null) }}>
                          <X className="mr-1 size-3" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{supp.name}</span>
                          <Badge className={CATEGORY_COLORS[supp.category] || 'bg-gray-100 text-gray-700'}>
                            {formatLabel(supp.category)}
                          </Badge>
                          <Badge className={TIMING_COLORS[supp.timing] || 'bg-gray-100 text-gray-700'}>
                            {formatLabel(supp.timing)}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => handleStartEdit(supp)}>
                            <Pencil className="size-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="size-7" onClick={() => handleDelete(supp.id)}>
                            <Trash2 className="size-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>{supp.dosage} {supp.unit}</span>
                        <span>{formatLabel(supp.frequency)}</span>
                        <span>{formatLabel(supp.form)}</span>
                        {supp.brand && <span>{supp.brand}</span>}
                      </div>
                      {supp.cycling_instructions && (
                        <p className="mt-1 text-xs text-muted-foreground">Cycling: {supp.cycling_instructions}</p>
                      )}
                      {supp.notes && (
                        <p className="mt-1 text-xs text-muted-foreground">Notes: {supp.notes}</p>
                      )}
                    </>
                  )}
                </div>
              ))}

              {inactiveSupps.length > 0 && (
                <div className="pt-2">
                  <p className="mb-2 text-xs font-medium text-muted-foreground">Inactive</p>
                  {inactiveSupps.map((supp) => (
                    <div key={supp.id} className="rounded-lg border border-dashed p-3 opacity-50">
                      <div className="flex items-center gap-2">
                        <span className="text-sm line-through">{supp.name}</span>
                        <span className="text-xs text-muted-foreground">{supp.dosage} {supp.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
