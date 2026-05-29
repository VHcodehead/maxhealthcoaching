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

const BACKEND_URL = process.env.COACHING_BACKEND_URL || '';
const EXPORT_SECRET = process.env.COACHING_EXPORT_SECRET || '';

export interface ResolvedAppUser {
  appUserId: string;
  name: string | null;
  email: string;
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

async function bridgeFetch(path: string): Promise<Response> {
  assertConfigured();
  const base = BACKEND_URL.replace(/\/+$/, '');
  return fetch(`${base}${path}`, {
    method: 'GET',
    headers: {
      'X-Export-Token': EXPORT_SECRET,
      Accept: 'application/json',
    },
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
 * Used by the coach hub (Phase 1+). Returns the raw payload; shape is owned by
 * the backend's CoachingExport type.
 */
export async function fetchCoachingExport(appUserId: string): Promise<unknown> {
  const res = await bridgeFetch(`/coaching-export/${encodeURIComponent(appUserId)}`);
  if (!res.ok) {
    throw new CoachingBridgeError(`export failed (${res.status})`, res.status);
  }
  const json = (await res.json()) as { success: boolean; data?: unknown };
  if (!json.success) {
    throw new CoachingBridgeError('export returned success=false');
  }
  return json.data;
}
