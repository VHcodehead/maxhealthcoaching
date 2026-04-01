---
phase: 05-payment-readiness
plan: "01"
subsystem: payments
tags: [stripe, webhooks, idempotency, production-readiness]
dependency_graph:
  requires: []
  provides: [hardened-webhook-handler, stripe-env-var-audit]
  affects: [src/app/api/webhooks/stripe/route.ts, src/lib/stripe.ts]
tech_stack:
  added: []
  patterns: [idempotency-check-before-update, per-case-try-catch, webhook-event-logging]
key_files:
  created: []
  modified:
    - src/lib/stripe.ts
    - src/app/api/webhooks/stripe/route.ts
decisions:
  - "current_period_end accessed via intersection type cast (Stripe.Subscription & { current_period_end: number }) — field exists at runtime but is not typed in the Stripe SDK Subscription interface; intersection is cleaner than double-cast"
  - "Idempotency implemented via DB read before update (not a separate idempotency table) — sufficient for webhook deduplication without schema changes"
  - "Per-case try/catch returns 200 on handler errors to prevent Stripe retry storms on permanent failures (e.g., missing profile)"
metrics:
  duration: "~15 minutes"
  completed: "2026-03-31"
  tasks_completed: 2
  files_modified: 2
---

# Phase 5 Plan 01: Stripe Production Readiness Audit and Webhook Hardening Summary

**One-liner:** Hardened Stripe webhook handler with idempotency guards, event logging, and per-case error isolation; confirmed all env-var-only config with production docs.

## What Was Built

### Task 1: Env-Var Audit (PAY-01)
Performed a comprehensive audit of all Stripe-related files across `src/`. No hardcoded keys, no `localhost` references, no test-mode conditionals were found. All files already used environment variables exclusively. Added a required env-var documentation comment block to `src/lib/stripe.ts` as in-code production documentation.

**Audit Results (all pass):**
- `src/lib/stripe.ts` — Uses `process.env.STRIPE_SECRET_KEY`, `process.env.STRIPE_PRICE_*`
- `src/app/api/checkout/route.ts` — Uses `process.env.NEXT_PUBLIC_APP_URL`
- `src/app/api/portal/route.ts` — Uses `process.env.NEXT_PUBLIC_APP_URL`
- `src/app/api/webhooks/stripe/route.ts` — Uses `process.env.STRIPE_WEBHOOK_SECRET`
- `src/app/api/checkout/verify/route.ts` — No hardcoded references
- `src/app/pricing/page.tsx` — UI text only, no keys

### Task 2: Webhook Handler Hardening (PAY-02)
Rewrote `src/app/api/webhooks/stripe/route.ts` to add production resilience:

1. **Event logging** — Every webhook now logs `[Stripe Webhook] {type} | {id} | customer: {id}` before switch dispatch
2. **Idempotency guards** — All 4 event handlers check current DB state before writing:
   - `checkout.session.completed`: Skips if `stripeSubscriptionId` already matches
   - `customer.subscription.updated`: Skips if `subscriptionStatus` already matches
   - `customer.subscription.deleted`: Skips if status is already `canceled`
   - `invoice.payment_failed`: Skips if status is already `past_due`
3. **Missing metadata handling** — `checkout.session.completed` now logs a `console.error` and breaks instead of silently skipping when `user_id` is absent
4. **Per-case try/catch** — Each case body wrapped in try/catch; errors are logged but handler returns 200 to prevent Stripe retry storms
5. **Default case** — Unknown event types are now logged instead of silently ignored
6. **Type cast cleanup** — Replaced `as unknown as { current_period_end: number }` with cleaner intersection type cast

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Intersection type for `current_period_end` | Field exists at runtime but missing from Stripe TS types; intersection type is more precise than double-cast |
| DB-read idempotency (not idempotency table) | Avoids schema migration; sufficient for Stripe's at-least-once delivery guarantee |
| Return 200 on handler errors | Permanent failures (missing profile) would cause infinite retries from Stripe on non-2xx; logging + 200 is correct production behavior |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] `subscription.current_period_end` TypeScript error**
- **Found during:** Task 2
- **Issue:** The plan suggested using `subscription.current_period_end` directly, but `current_period_end` is not typed on `Stripe.Subscription` in the installed Stripe SDK version
- **Fix:** Used intersection type cast `(subscription as Stripe.Subscription & { current_period_end: number }).current_period_end` — cleaner than the original double-cast while still compiling cleanly
- **Files modified:** `src/app/api/webhooks/stripe/route.ts`
- **Commit:** a891a57

## Verification Results

| Check | Result |
|-------|--------|
| `grep -rn "sk_test\|pk_test\|whsec_\|localhost" src/` (actual code only) | 0 matches (comment-only references excluded) |
| `npx tsc --noEmit` | Clean — no errors |
| Webhook contains `[Stripe Webhook]` logging | 11 occurrences |
| Webhook contains `Idempotent skip` paths | 4 occurrences (one per event type) |
| Webhook contains `missing user_id` error log | 1 occurrence |
| No `as unknown as` type cast | 0 occurrences |

## Production Switchover Checklist

### Environment Variables to Change

| Variable | Current (test) | Production value | Where to find |
|----------|----------------|------------------|---------------|
| `STRIPE_SECRET_KEY` | `sk_test_...` | `sk_live_...` | Stripe Dashboard > Developers > API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_...` | `pk_live_...` | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (CLI local) | `whsec_...` (endpoint-specific) | Stripe Dashboard > Developers > Webhooks > endpoint signing secret |
| `STRIPE_PRICE_BASIC` | Test price ID | Live price ID | Stripe Dashboard > Products > Basic plan price |
| `STRIPE_PRICE_PRO` | Test price ID | Live price ID | Stripe Dashboard > Products > Pro plan price |
| `STRIPE_PRICE_ELITE` | Test price ID | Live price ID | Stripe Dashboard > Products > Elite plan price |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://yourdomain.com` | Your production domain |

### Stripe Dashboard Configuration Required

1. **Create webhook endpoint:**
   - URL: `https://yourdomain.com/api/webhooks/stripe`
   - Events to subscribe:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`
   - Copy the signing secret to `STRIPE_WEBHOOK_SECRET`

2. **Create production products and prices:**
   - Basic plan: $149/mo recurring
   - Pro plan: $299/mo recurring
   - Elite plan: $499/mo recurring
   - Copy price IDs to `STRIPE_PRICE_BASIC`, `STRIPE_PRICE_PRO`, `STRIPE_PRICE_ELITE`

3. **Enable billing portal** in Stripe Dashboard > Settings > Billing > Customer portal

### Verification Steps After Switching

1. Deploy with new production env vars
2. Test a real checkout flow with a Stripe test card on production (use `4242 4242 4242 4242`)
3. Verify webhook delivery in Stripe Dashboard > Developers > Webhooks > endpoint > Recent deliveries
4. Confirm subscription status updates in your database after webhook delivery
5. Use Stripe CLI to replay events if needed: `stripe events resend evt_xxx --webhook-endpoint we_xxx`
6. Check application logs for `[Stripe Webhook]` entries confirming events are received and processed

## Self-Check: PASSED

| Item | Status |
|------|--------|
| src/lib/stripe.ts | FOUND |
| src/app/api/webhooks/stripe/route.ts | FOUND |
| 05-01-SUMMARY.md | FOUND |
| Commit 1cdbf7a (Task 1) | FOUND |
| Commit a891a57 (Task 2) | FOUND |
