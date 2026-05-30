'use client';

// src/components/coaching-hub/client-detail-tabs.tsx
//
// Client wrapper: tabbed navigation for the coach client-detail view. The
// panels themselves are rendered on the server and passed in as nodes; this
// component only handles which one is visible (Radix tabs). Photos tab uses the
// interactive PhotoCompare below.

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState } from 'react';

export interface HubPhoto {
  url: string;
  date: string;
  label?: string;
}

export function ClientDetailTabs({
  weeklyReview,
  daily,
  lifting,
  biometrics,
  photos,
}: {
  weeklyReview: React.ReactNode;
  daily: React.ReactNode;
  lifting: React.ReactNode;
  biometrics: React.ReactNode;
  photos: HubPhoto[];
}) {
  return (
    <Tabs defaultValue="weekly" className="w-full">
      <TabsList className="mb-4 flex flex-wrap gap-1 bg-white/50">
        <TabsTrigger value="weekly">Weekly Review</TabsTrigger>
        <TabsTrigger value="daily">Daily</TabsTrigger>
        <TabsTrigger value="lifting">Lifting</TabsTrigger>
        <TabsTrigger value="biometrics">Biometrics</TabsTrigger>
        <TabsTrigger value="photos">Photos</TabsTrigger>
      </TabsList>
      <TabsContent value="weekly">{weeklyReview}</TabsContent>
      <TabsContent value="daily">{daily}</TabsContent>
      <TabsContent value="lifting">{lifting}</TabsContent>
      <TabsContent value="biometrics">{biometrics}</TabsContent>
      <TabsContent value="photos">
        <PhotoCompare photos={photos} />
      </TabsContent>
    </Tabs>
  );
}

function PhotoPicker({
  photos,
  value,
  onChange,
  label,
}: {
  photos: HubPhoto[];
  value: number;
  onChange: (n: number) => void;
  label: string;
}) {
  return (
    <div className="flex-1">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <select
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="rounded-md border border-slate-200 bg-white/70 px-2 py-1 text-xs text-slate-700"
        >
          {photos.map((p, i) => (
            <option key={i} value={i}>
              {p.date}
            </option>
          ))}
        </select>
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[value]?.url}
        alt={`Progress ${photos[value]?.date}`}
        className="aspect-[3/4] w-full rounded-xl border border-white/70 object-cover"
      />
    </div>
  );
}

function PhotoCompare({ photos }: { photos: HubPhoto[] }) {
  const sorted = [...photos].sort((a, b) => a.date.localeCompare(b.date));
  const [leftIdx, setLeftIdx] = useState(0);
  const [rightIdx, setRightIdx] = useState(Math.max(0, sorted.length - 1));

  if (!sorted.length) {
    return <p className="text-sm text-slate-500">No progress photos uploaded yet.</p>;
  }

  return (
    <div className="flex gap-4">
      <PhotoPicker photos={sorted} value={leftIdx} onChange={setLeftIdx} label="Earlier" />
      <PhotoPicker photos={sorted} value={rightIdx} onChange={setRightIdx} label="Later" />
    </div>
  );
}
