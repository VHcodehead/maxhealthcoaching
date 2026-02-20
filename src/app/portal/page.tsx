'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';

export default function PortalPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'loading') return;

    async function redirectToPortal() {
      try {
        if (!session?.user) {
          window.location.href = '/login';
          return;
        }

        const res = await fetch('/api/portal', { method: 'POST' });
        const data = await res.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          setError('Unable to open billing portal. Please contact support.');
        }
      } catch {
        setError('Something went wrong. Please try again.');
      } finally {
        setLoading(false);
      }
    }

    redirectToPortal();
  }, [session, status]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      {loading ? (
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400 mx-auto mb-3" />
          <p className="text-zinc-500">Redirecting to billing portal...</p>
        </div>
      ) : error ? (
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <a href="/dashboard" className="text-emerald-600 underline">Back to dashboard</a>
        </div>
      ) : null}
    </div>
  );
}
