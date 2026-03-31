'use client'

import React, { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, AlertCircle } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const message = searchParams.get('message')

  if (status === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-6 pt-10 pb-10 text-center">
            <div className="rounded-full bg-emerald-100 p-4">
              <CheckCircle2 className="h-10 w-10 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Email verified!
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Your email has been verified. You&apos;re all set!
              </p>
            </div>
            <Link href="/dashboard">
              <Button className="bg-emerald-600 hover:bg-emerald-700">
                Go to Dashboard
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center gap-6 pt-10 pb-10 text-center">
          <div className="rounded-full bg-red-100 p-4">
            <AlertCircle className="h-10 w-10 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">
              Verification failed
            </h1>
            <p className="mt-2 text-sm text-gray-600">
              {message
                ? decodeURIComponent(message)
                : 'Something went wrong'}
            </p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  )
}
