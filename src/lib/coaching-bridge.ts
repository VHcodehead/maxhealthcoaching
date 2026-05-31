// src/lib/coaching-bridge.ts
//
// Unified Coaching Hub — Phase 0 (ADR 008).
//
// Server-only client for the MyPocketCoach backend read bridge
// (my-coach-backend `GET /coaching-export/*`). This is how maxhealthcoaching.com
// reads app data (weight/food/training/wearables) without sharing a database,
// auth system, or user store with the app.
//
// Auth: a single shared service token (COACHING_EXPORT_SECRET) sent in the
// `X-Export-Token` header. Must match the value set on the backend (Railway).
//
// NEVER import this into client components — it carries the service secret.
// (Only ever imported from route handlers under src/app/api/, which are
// server-only by construction.)

import type { CoachingExport } from './coaching-types';

const BACKEND_URL = process.env.COACHING_BACKEND_URL || '';
const EXPORT_SECRET = process.env.COACHING_EXPORT_SECRET || '';

export interface ResolvedAppUser {
  appUserId: string;
  name: string | null;
  email: string;
}

export type WeightTrend = 'up' | 'down' | 'flat';

/** Lightweight triage row for the coach hub client list (matches backend). */
export interface CoachingSnapshot {
  appUserId: string;
  name: string | null;
  goal: string | null;
  sex: string | null;
  currentWeightLbs: number | null;
  status: 'needs_attention' | 'on_track';
  daysSinceLastCheckin: number;
  weightTrend7d: WeightTrend;
  adherencePct7d: number;
  redFlags: string[];
  lastCheckinAt: string | null;
}

/** Thrown when the bridge is misconfigured or the backend errors (not 404). */
export class CoachingBridgeError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'CoachingBridgeError';
  }
}

function assertConfigured(): void {
  if (!BACKEND_URL || !EXPORT_SECRET) {
    throw new CoachingBridgeError(
      'Coaching bridge not configured (COACHING_BACKEND_URL / COACHING_EXPORT_SECRET missing)',
    );
  }
}

async function bridgeFetch(
  path: string,
  init?: { method?: string; body?: unknown },
): Promise<Response> {
  assertConfigured();
  const base = BACKEND_URL.replace(/\/+$/, '');
  return fetch(`${base}${path}`, {
    method: init?.method ?? 'GET',
    headers: {
      'X-Export-Token': EXPORT_SECRET,
      Accept: 'application/json',
      ...(init?.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    // App data is read fresh each request; never cache on the Next.js side.
    cache: 'no-store',
  });
}

/**
 * Resolve a client's app email → Supabase user_id.
 * Returns null when no app account matches (HTTP 404). Throws on transport,
 * auth, or server errors so callers can distinguish "no account" from "bridge
 * down".
 */
export async function resolveAppUser(email: string): Promise<ResolvedAppUser | null> {
  const res = await bridgeFetch(`/coaching-export/resolve?email=${encodeURIComponent(email)}`);

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new CoachingBridgeError(`resolve failed (${res.status})`, res.status);
  }

  const json = (await res.json()) as { success: boolean; data?: ResolvedAppUser };
  if (!json.success || !json.data) {
    throw new CoachingBridgeError('resolve returned no data');
  }
  return json.data;
}

/**
 * Fetch the full read-only coaching export for a linked app user.
 * Used by the coach hub client-detail view (Phase 1+). Returns the raw payload
 * typed as CoachingExport (shape owned by the backend).
 */
export async function fetchCoachingExport(appUserId: string): Promise<CoachingExport> {
  const res = await bridgeFetch(`/coaching-export/${encodeURIComponent(appUserId)}`);
  if (!res.ok) {
    throw new CoachingBridgeError(`export failed (${res.status})`, res.status);
  }
  const json = (await res.json()) as { success: boolean; data?: CoachingExport };
  if (!json.success || !json.data) {
    throw new CoachingBridgeError('export returned no data');
  }
  return json.data;
}

/**
 * Batch triage snapshots for the coach hub client list. One backend call for
 * the whole roster. Returns [] for an empty roster without hitting the bridge.
 */
export async function fetchCoachingSnapshots(
  appUserIds: string[],
): Promise<CoachingSnapshot[]> {
  if (!appUserIds.length) return [];
  const res = await bridgeFetch('/coaching-export/snapshots', {
    method: 'POST',
    body: { appUserIds },
  });
  if (!res.ok) {
    throw new CoachingBridgeError(`snapshots failed (${res.status})`, res.status);
  }
  const json = (await res.json()) as { success: boolean; data?: CoachingSnapshot[] };
  if (!json.success || !json.data) {
    throw new CoachingBridgeError('snapshots returned no data');
  }
  return json.data;
}

/**
 * The coach's roster from the EXISTING coach_clients links (Phase 56). Lets the
 * hub show clients already linked in the legacy /admin dashboard without any
 * new app_link / email-code step. Returns [] if the coach can't be resolved.
 */
export async function fetchCoachingRoster(coachEmail: string): Promise<CoachingSnapshot[]> {
  const res = await bridgeFetch(`/coaching-export/roster?coachEmail=${encodeURIComponent(coachEmail)}`);
  if (!res.ok) throw new CoachingBridgeError(`roster failed (${res.status})`, res.status);
  const json = (await res.json()) as { success: boolean; data?: CoachingSnapshot[] };
  if (!json.success) throw new CoachingBridgeError('roster returned success=false');
  return json.data ?? [];
}

/** Does this coach own this client (active coach_clients link)? */
export async function coachOwnsClient(coachEmail: string, appUserId: string): Promise<boolean> {
  try {
    const res = await bridgeFetch(
      `/coaching-export/owns?coachEmail=${encodeURIComponent(coachEmail)}&appUserId=${encodeURIComponent(appUserId)}`,
    );
    if (!res.ok) return false;
    const json = (await res.json()) as { success: boolean; data?: { owned: boolean } };
    return !!json.data?.owned;
  } catch {
    return false;
  }
}

// ── Phase 5 write-back (server-side; called from coach-gated API routes) ──────

export interface WorkoutTemplate {
  id: number;
  workout_name: string | null;
  week_number: number | null;
  day_number: number | null;
  total_exercises: number | null;
  coach_note: string | null;
  exercises: Array<Record<string, unknown>>;
}

export async function fetchWorkoutTemplates(appUserId: string): Promise<WorkoutTemplate[]> {
  const res = await bridgeFetch(`/coaching-export/${encodeURIComponent(appUserId)}/workouts`);
  if (!res.ok) throw new CoachingBridgeError(`workouts failed (${res.status})`, res.status);
  const json = (await res.json()) as { success: boolean; data?: WorkoutTemplate[] };
  if (!json.success) throw new CoachingBridgeError('workouts returned success=false');
  return json.data ?? [];
}

async function bridgePost(path: string, body: unknown): Promise<unknown> {
  const res = await bridgeFetch(path, { method: 'POST', body });
  const json = (await res.json().catch(() => ({}))) as { success?: boolean; data?: unknown; error?: string };
  if (!res.ok || !json.success) {
    throw new CoachingBridgeError(json.error ?? `push failed (${res.status})`, res.status);
  }
  return json.data;
}

export function pushMacros(body: Record<string, unknown>) {
  return bridgePost('/coaching-export/push/macros', body);
}
export function pushCardio(body: Record<string, unknown>) {
  return bridgePost('/coaching-export/push/cardio', body);
}
export function pushTraining(templateId: number, body: Record<string, unknown>) {
  return bridgePost(`/coaching-export/push/training/${templateId}`, body);
}
