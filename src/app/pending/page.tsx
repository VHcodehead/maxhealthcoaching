'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Clock, XCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

function PendingContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const isRejected = status === 'rejected';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-600">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">MaxHealth Coaching</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your Personal Training Partner</p>
        </div>

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              {isRejected ? (
                <XCircle className="h-12 w-12 text-red-500" />
              ) : (
                <Clock className="h-12 w-12 text-emerald-600" />
              )}
            </div>
            <CardTitle className="text-xl">
              {isRejected ? 'Application Not Accepted' : 'Application Under Review'}
            </CardTitle>
            <CardDescription className="text-sm mt-2">
              {isRejected ? (
                "Unfortunately, we're not able to take on new clients at this time. We'll reach out if a spot opens up."
              ) : (
                "We review every application personally to ensure MaxHealth Coaching is the right fit. You'll receive an email once your application has been reviewed."
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4 pt-2">
            {!isRejected && (
              <p className="text-sm text-muted-foreground">
                This usually takes less than 24 hours.
              </p>
            )}
            <Link
              href="/login"
              className="inline-block text-sm font-medium text-emerald-600 hover:underline"
            >
              Back to Login
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
