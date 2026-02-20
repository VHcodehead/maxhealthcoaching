'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Gift,
  Copy,
  Check,
  Users,
  UserCheck,
  Link as LinkIcon,
  Share2,
  AlertCircle,
  MessageCircle,
  Twitter,
  Mail,
  Loader2,
  ExternalLink,
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

interface ReferralData {
  referral_code: string
  total_referrals: number
  completed_referrals: number
  referrals: Referral[]
}

interface Referral {
  id: string
  referred_email: string
  status: 'pending' | 'signed_up' | 'active' | 'completed'
  created_at: string
}

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  pending: { label: 'Pending', className: 'bg-amber-100 text-amber-700' },
  signed_up: {
    label: 'Signed Up',
    className: 'bg-blue-100 text-blue-700',
  },
  active: { label: 'Active', className: 'bg-emerald-100 text-emerald-700' },
  completed: {
    label: 'Completed',
    className: 'bg-violet-100 text-violet-700',
  },
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  delay,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className={`rounded-lg p-3 ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-sm text-muted-foreground">{label}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default function ReferralPage() {
  const [data, setData] = useState<ReferralData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    async function fetchReferrals() {
      try {
        const res = await fetch('/api/referral')
        if (!res.ok) throw new Error('Failed to fetch referral data')
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError('Failed to load referral data.')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchReferrals()
  }, [])

  const referralLink = data
    ? `https://maxhealthcoaching.com/signup?ref=${data.referral_code}`
    : ''

  const handleCopyCode = async () => {
    if (!data) return
    await navigator.clipboard.writeText(data.referral_code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleCopyLink = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const shareMessages = {
    twitter: `I've been working with @MaxHealthCoaching and the results have been amazing! Use my referral link to get started: ${referralLink}`,
    email: {
      subject: 'Check out MaxHealth Coaching',
      body: `Hey! I've been working with MaxHealth Coaching and wanted to share my referral link with you. They create personalized meal and training plans that actually work.\n\nSign up here: ${referralLink}\n\nLet me know if you have any questions!`,
    },
    general: `Hey! I've been getting great results with MaxHealth Coaching. Use my referral link to sign up: ${referralLink}`,
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 space-y-2">
          <div className="h-8 w-48 animate-pulse rounded bg-muted" />
          <div className="h-4 w-64 animate-pulse rounded bg-muted" />
        </div>
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
                <div className="space-y-2">
                  <div className="h-7 w-12 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 animate-pulse rounded-lg bg-muted" />
                <div className="space-y-2">
                  <div className="h-7 w-12 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="h-6 w-40 animate-pulse rounded bg-muted" />
              <div className="h-12 animate-pulse rounded bg-muted" />
              <div className="h-12 animate-pulse rounded bg-muted" />
            </div>
          </CardContent>
        </Card>
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
              <p className="font-semibold">Failed to load referral data</p>
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

  if (!data) return null

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
          Referral Program
        </h1>
        <p className="mt-1 text-muted-foreground">
          Share MaxHealth Coaching with friends and earn rewards.
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2">
        <StatCard
          icon={Users}
          label="Total Referrals"
          value={data.total_referrals}
          color="bg-emerald-600"
          delay={0.1}
        />
        <StatCard
          icon={UserCheck}
          label="Completed Referrals"
          value={data.completed_referrals}
          color="bg-violet-600"
          delay={0.2}
        />
      </div>

      {/* Referral Code & Link */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-md bg-emerald-100 p-1.5">
                <Gift className="h-4 w-4 text-emerald-600" />
              </div>
              Your Referral Code
            </CardTitle>
            <CardDescription>
              Share your unique code or link with friends and family.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Referral Code */}
            <div className="flex items-center gap-3">
              <div className="flex-1 rounded-lg border-2 border-dashed border-emerald-200 bg-emerald-50/50 px-4 py-3">
                <p className="text-center text-lg font-bold tracking-widest text-emerald-700">
                  {data.referral_code}
                </p>
              </div>
              <Button
                variant="outline"
                size="default"
                className="gap-2 shrink-0"
                onClick={handleCopyCode}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Code
                  </>
                )}
              </Button>
            </div>

            {/* Referral Link */}
            <div className="flex items-center gap-3">
              <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border bg-muted/50 px-4 py-3">
                <LinkIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <p className="truncate text-sm text-muted-foreground">
                  {referralLink}
                </p>
              </div>
              <Button
                variant="outline"
                size="default"
                className="gap-2 shrink-0"
                onClick={handleCopyLink}
              >
                {copiedLink ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Share Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="mb-8"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-md bg-blue-100 p-1.5">
                <Share2 className="h-4 w-4 text-blue-600" />
              </div>
              Share with Friends
            </CardTitle>
            <CardDescription>
              Use these pre-written messages to share on social media.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Twitter / X */}
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Twitter className="h-4 w-4" />
                <p className="text-sm font-semibold">Twitter / X</p>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                {shareMessages.twitter}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessages.twitter)}`,
                    '_blank'
                  )
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Share on X
              </Button>
            </div>

            {/* Email */}
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <p className="text-sm font-semibold">Email</p>
              </div>
              <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
                {shareMessages.email.body}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => {
                  window.open(
                    `mailto:?subject=${encodeURIComponent(shareMessages.email.subject)}&body=${encodeURIComponent(shareMessages.email.body)}`,
                    '_blank'
                  )
                }}
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Send Email
              </Button>
            </div>

            {/* General / SMS */}
            <div className="rounded-lg border p-4">
              <div className="mb-2 flex items-center gap-2">
                <MessageCircle className="h-4 w-4" />
                <p className="text-sm font-semibold">Text / Direct Message</p>
              </div>
              <p className="mb-3 text-sm text-muted-foreground">
                {shareMessages.general}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={async () => {
                  await navigator.clipboard.writeText(shareMessages.general)
                }}
              >
                <Copy className="h-3.5 w-3.5" />
                Copy Message
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Referral List */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="rounded-md bg-violet-100 p-1.5">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              Referral History
            </CardTitle>
            <CardDescription>
              Track the status of your referrals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.referrals.length > 0 ? (
              <div className="space-y-3">
                {data.referrals.map((referral, i) => {
                  const config =
                    statusConfig[referral.status] || statusConfig.pending
                  return (
                    <motion.div
                      key={referral.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + i * 0.05 }}
                      className="flex items-center justify-between rounded-lg border px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
                          {referral.referred_email?.charAt(0).toUpperCase() ||
                            '?'}
                        </div>
                        <div>
                          <p className="text-sm font-medium">
                            {referral.referred_email}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Referred on {formatDate(referral.created_at)}
                          </p>
                        </div>
                      </div>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${config.className}`}
                      >
                        {config.label}
                      </Badge>
                    </motion.div>
                  )
                })}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="rounded-full bg-muted p-3">
                  <Users className="h-8 w-8 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">
                    No referrals yet
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground/70">
                    Share your referral link above to get started.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
