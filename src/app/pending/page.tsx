'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Dumbbell, Clock, XCircle } from 'lucide-react';

function PendingContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  const isRejected = status === 'rejected';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Dumbbell className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-display text-3xl tracking-tight">
            MAX<span className="text-primary">HEALTH</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Your Personal Training Partner</p>
        </div>

        <div className="text-center space-y-6">
          <div className="flex justify-center">
            {isRejected ? (
              <XCircle className="h-16 w-16 text-destructive" />
            ) : (
              <Clock className="h-16 w-16 text-primary animate-pulse" />
            )}
          </div>

          <div className="space-y-3">
            <h2 className="font-display text-2xl">
              {isRejected ? 'APPLICATION NOT ACCEPTED' : 'APPLICATION UNDER REVIEW'}
            </h2>
            <p className="text-muted-foreground">
              {isRejected ? (
                "Unfortunately, we're not able to take on new clients at this time. We'll reach out if a spot opens up."
              ) : (
                "We review every application personally to ensure MaxHealth Coaching is the right fit. You'll receive an email once your application has been reviewed."
              )}
            </p>
          </div>

          {!isRejected && (
            <p className="text-sm text-muted-foreground">
              This usually takes less than 24 hours.
            </p>
          )}

          <Link
            href="/login"
            className="inline-block text-sm font-medium text-primary text-muted-foreground/50 hover:underline"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PendingPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading...</div>
      </div>
    }>
      <PendingContent />
    </Suspense>
  );
}
