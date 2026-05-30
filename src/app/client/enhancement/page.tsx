// src/app/client/enhancement/page.tsx
//
// Unified Coaching Hub — Phase 3 client enhancement surface (private). Gated by
// AppLink.isEnhanced. Server component: loads protocol + bloodwork history,
// passes sex (for sex-aware scan) into the interactive client.

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { GlassCard } from '@/components/coaching-hub/primitives';
import { EnhancementClient } from '@/components/coaching-hub/enhancement-client';

export const dynamic = 'force-dynamic';

export default async function EnhancementPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  const userId = session.user.id;

  const link = await prisma.appLink.findFirst({
    where: { userId, verifiedAt: { not: null } },
    select: { isEnhanced: true, sex: true },
  });

  if (!link) {
    return (
      <div className="pt-6">
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-slate-600">Link your app account first.</p>
          <Link href="/client/link" className="mt-3 inline-block text-sm font-semibold text-emerald-700">Connect now →</Link>
        </GlassCard>
      </div>
    );
  }
  if (!link.isEnhanced) {
    return (
      <div className="pt-6">
        <GlassCard className="p-6 text-center">
          <p className="text-sm text-slate-600">Enhancement tracking isn’t enabled on your account.</p>
          <p className="mt-1 text-xs text-slate-400">Your coach turns this on when it’s relevant.</p>
        </GlassCard>
      </div>
    );
  }

  const [protocols, bloodwork] = await Promise.all([
    prisma.enhancementProtocol.findMany({
      where: { userId, active: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.bloodworkUpload.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
      take: 5,
      select: { id: true, labName: true, testDate: true, outOfRangeCount: true, parseStatus: true, uploadedAt: true },
    }),
  ]);

  return (
    <EnhancementClient
      sex={link.sex}
      protocols={protocols.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        dose: p.dose,
        doseUnit: p.doseUnit,
        frequency: p.frequency,
        timing: p.timing,
        coachGuidance: p.coachGuidance,
        clientReported: p.clientReported,
      }))}
      bloodwork={bloodwork.map((b) => ({
        id: b.id,
        labName: b.labName,
        testDate: b.testDate ? new Date(b.testDate).toISOString().slice(0, 10) : null,
        outOfRangeCount: b.outOfRangeCount,
        parseStatus: b.parseStatus,
        uploadedAt: new Date(b.uploadedAt).toISOString().slice(0, 10),
      }))}
    />
  );
}
