'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Pencil, Check, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InlineEditableTextProps {
  value: string
  onSave: (value: string) => void | Promise<void>
  label?: string
  placeholder?: string
  multiline?: boolean
  className?: string
}

export function InlineEditableText({
  value,
  onSave,
  label,
  placeholder,
  multiline,
  className,
}: InlineEditableTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
    }
  }, [editing])

  useEffect(() => {
    setDraft(value)
  }, [value])

  const handleSave = async () => {
    await onSave(draft)
    setEditing(false)
  }

  const handleCancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleCancel()
    }
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      handleSave()
    }
  }

  if (editing) {
    return (
      <div className={cn('flex items-start gap-2', className)}>
        {multiline ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={3}
            className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
          />
        ) : (
          <Input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
          />
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={handleSave}
        >
          <Check className="size-4 text-emerald-600" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-8 shrink-0"
          onClick={handleCancel}
        >
          <X className="size-4 text-muted-foreground" />
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group inline-flex cursor-pointer items-start gap-1',
        className
      )}
      onClick={() => setEditing(true)}
    >
      {label && (
        <span className="text-sm font-medium text-muted-foreground">
          {label}:{' '}
        </span>
      )}
      <span className={cn('text-sm', !value && 'italic text-muted-foreground')}>
        {value || placeholder || 'Click to edit'}
      </span>
      <Pencil className="mt-0.5 size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </div>
  )
}
