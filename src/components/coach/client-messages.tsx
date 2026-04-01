'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react'
import { useSession } from 'next-auth/react'

interface Message {
  id: string
  senderId: string
  receiverId: string
  content: string
  read: boolean
  createdAt: string
}

interface ClientMessagesProps {
  clientId: string
  clientName: string
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

export function ClientMessages({ clientId, clientName }: ClientMessagesProps) {
  const { data: session } = useSession()
  const [expanded, setExpanded] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [content, setContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  const loadMessages = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/messages?user_id=${clientId}`)
      if (!res.ok) throw new Error('Failed to load messages')
      const data = await res.json()
      setMessages(data.messages || [])

      // Mark incoming messages as read
      await fetch('/api/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderId: clientId }),
      }).catch(() => { /* non-critical */ })
    } catch {
      setError('Failed to load messages')
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (expanded) {
      loadMessages()
    }
  }, [expanded, loadMessages])

  useEffect(() => {
    if (expanded && messages.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [expanded, messages])

  const handleSend = async () => {
    const trimmed = content.trim()
    if (!trimmed) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId: clientId, content: trimmed }),
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

  const coachId = session?.user?.id

  return (
    <Card>
      <CardHeader
        className="cursor-pointer"
        onClick={() => setExpanded((prev) => !prev)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="size-5 text-emerald-600" />
            <CardTitle>Messages</CardTitle>
          </div>
          <div className="flex items-center gap-2">
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
          {/* Message thread */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : messages.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No messages yet. Start the conversation.
            </p>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-3 pr-1">
              {messages.map((msg) => {
                const isCoach = msg.senderId === coachId
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${isCoach ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[11px] text-muted-foreground px-1">
                      {isCoach ? 'You' : clientName}
                    </span>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                        isCoach
                          ? 'bg-emerald-600 text-white rounded-tr-sm'
                          : 'bg-gray-100 text-gray-900 rounded-tl-sm'
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
          <div className="space-y-2 rounded-lg border border-dashed p-3">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${clientName}... (Ctrl+Enter to send)`}
              rows={3}
              className="border-input w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] focus-visible:outline-none"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button
              onClick={handleSend}
              disabled={sending || !content.trim()}
              size="sm"
            >
              {sending && <Loader2 className="mr-1 size-3 animate-spin" />}
              Send
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
