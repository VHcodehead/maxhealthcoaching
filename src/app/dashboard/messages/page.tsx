'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, MessageSquare } from 'lucide-react'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  read: boolean
  createdAt: string
}

function formatMessageTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)

  if (diffHours < 24) {
    const diffMins = Math.round(diffMs / (1000 * 60))
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`
    const hrs = Math.floor(diffHours)
    return `${hrs} hour${hrs === 1 ? '' : 's'} ago`
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const [messages, setMessages] = useState<Message[]>([])
  const [coachId, setCoachId] = useState<string | null>(null)
  const [coachName, setCoachName] = useState<string>('Coach')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const clientId = session?.user?.id

  const loadThread = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch coach info
      const coachRes = await fetch('/api/coach')
      if (!coachRes.ok) throw new Error('Could not find coach')
      const coachData = await coachRes.json()
      setCoachId(coachData.userId)
      setCoachName(coachData.fullName || 'Coach')

      // Fetch message thread
      const msgRes = await fetch(`/api/messages?user_id=${coachData.userId}`)
      if (!msgRes.ok) throw new Error('Failed to load messages')
      const msgData = await msgRes.json()
      setMessages(msgData.messages || [])

      // Mark coach messages as read
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: coachData.userId }),
      }).catch(() => { /* non-critical */ })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadThread()
  }, [loadThread])

  useEffect(() => {
    if (!loading && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [loading, messages])

  const handleSend = async () => {
    if (!coachId) return
    const trimmed = content.trim()
    if (!trimmed) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: coachId, content: trimmed }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to send message')
      }

      const data = await res.json()
      setMessages((prev) => [...prev, data.message])
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
          <MessageSquare className="h-5 w-5 text-emerald-400" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight">Messages</h1>
          <p className="text-sm text-muted-foreground">
            Your conversation with {coachName}
          </p>
        </div>
      </div>

      <Card className="flex flex-col bg-card">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="size-4 text-emerald-400" />
            {coachName}
          </CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col gap-4 pt-4">
          {/* Message thread */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="py-12 text-center">
              <p className="text-sm text-destructive">{error}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={loadThread}
              >
                Retry
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No messages yet. Your coach will reach out here.
            </p>
          ) : (
            <div className="min-h-[240px] max-h-[60vh] overflow-y-auto space-y-3 pr-1">
              {messages.map((msg) => {
                const isClient = msg.senderId === clientId
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${isClient ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[11px] text-muted-foreground px-1">
                      {isClient ? 'You' : coachName}
                    </span>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                        isClient
                          ? 'bg-zinc-800 text-foreground rounded-tr-sm'
                          : 'bg-emerald-900/50 text-foreground rounded-tl-sm'
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[11px] text-muted-foreground px-1">
                      {formatMessageTime(msg.createdAt)}
                    </span>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>
          )}

          {/* Compose */}
          <div className="space-y-2 border-t border-border pt-4">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${coachName}... (Ctrl+Enter to send)`}
              rows={3}
              disabled={loading || !coachId}
              className="border-input w-full rounded-md border bg-background px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none disabled:opacity-50"
            />
            {error && !loading && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button
              onClick={handleSend}
              disabled={sending || !content.trim() || !coachId}
              className="bg-primary hover:bg-primary/90"
            >
              {sending && <Loader2 className="mr-1.5 size-3.5 animate-spin" />}
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
