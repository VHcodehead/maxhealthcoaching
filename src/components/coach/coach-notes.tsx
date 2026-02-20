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
import { Loader2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import type { CoachNote, CoachNoteCategory } from '@/types/database'

const CATEGORY_COLORS: Record<string, string> = {
  general: 'bg-gray-100 text-gray-700',
  nutrition: 'bg-blue-100 text-blue-700',
  training: 'bg-purple-100 text-purple-700',
  check_in: 'bg-amber-100 text-amber-700',
}

const CATEGORIES: { value: CoachNoteCategory; label: string }[] = [
  { value: 'general', label: 'General' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'training', label: 'Training' },
  { value: 'check_in', label: 'Check-in' },
]

interface CoachNotesProps {
  clientId: string
}

export function CoachNotes({ clientId }: CoachNotesProps) {
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState<CoachNote[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [category, setCategory] = useState<CoachNoteCategory>('general')
  const [content, setContent] = useState('')

  const loadNotes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/notes?user_id=${clientId}`)
      if (!res.ok) throw new Error('Failed to load notes')
      const data = await res.json()
      setNotes(data.notes || [])
    } catch {
      setError('Failed to load notes')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (expanded && notes.length === 0 && !loading) {
      loadNotes()
    }
  }, [expanded, notes.length, loading, loadNotes])

  const handleSubmit = async () => {
    if (!content.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: clientId,
          category,
          content: content.trim(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to add note')
      }

      const data = await res.json()
      setNotes((prev) => [data.note, ...prev])
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note')
    } finally {
      setSaving(false)
    }
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-emerald-600" />
            <CardTitle>Coach Notes</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{notes.length} notes</Badge>
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
          {/* Add Note Form */}
          <div className="space-y-3 rounded-lg border border-dashed p-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Add Note</span>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as CoachNoteCategory)
                }
                className="h-8 rounded-md border bg-background px-2 text-sm"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write a coaching note..."
              rows={3}
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleSubmit}
              disabled={saving || !content.trim()}
              size="sm"
            >
              {saving && <Loader2 className="mr-1 size-3 animate-spin" />}
              Save Note
            </Button>
          </div>

          {/* Notes List */}
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No coaching notes yet
            </p>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-lg border p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <Badge className={CATEGORY_COLORS[note.category] || CATEGORY_COLORS.general}>
                      {CATEGORIES.find((c) => c.value === note.category)?.label || note.category}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(note.created_at)}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
