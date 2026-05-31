'use client';

// src/app/client/layout.tsx
//
// Unified Coaching Hub — Phase 2 client portal shell. Light glassmorphism,
// separate from the existing native /dashboard. Minimal top bar + sign out.

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { HubBackdrop } from '@/components/coaching-hub/primitives';
import { LogOut } from 'lucide-react';

export default function ClientPortalLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/login');
  };

  return (
    <div className="relative min-h-screen text-slate-900">
      <HubBackdrop />
      <header className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
        <Link href="/client" className="flex items-center gap-2">
          <span className="text-lg font-bold text-emerald-600">MaxHealth</span>
        </Link>
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700"
        >
          <LogOut className="size-4" /> Sign out
        </button>
      </header>
      <main className="mx-auto max-w-2xl px-4 pb-16">{children}</main>
    </div>
  );
}
