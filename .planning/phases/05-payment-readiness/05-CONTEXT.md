# Phase 5: Payment Readiness - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Verify and harden Stripe integration for production use. Ensure switching from test to production keys requires only env var changes. Audit webhook handler for edge cases. Does NOT include new payment features, plan changes, or billing portal modifications.

</domain>

<decisions>
## Implementation Decisions

### PAY-01: Production Key Swap
- Verify that all Stripe references use env vars (STRIPE_SECRET_KEY, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_*)
- No hardcoded test keys or test mode checks in code
- Lazy `stripe()` factory already exists in `src/lib/stripe.ts` — reads env at runtime
- Verify `NEXT_PUBLIC_APP_URL` is used for success/cancel URLs (not hardcoded localhost)
- Document which env vars need to change for production (checklist in SUMMARY)

### PAY-02: Webhook Hardening
- Audit all 4 event handlers for edge cases:
  - `checkout.session.completed`: Handle missing `user_id` in metadata gracefully (log, don't crash)
  - `customer.subscription.updated`: Handle unknown status values (default to 'canceled')
  - `customer.subscription.deleted`: Already clean
  - `invoice.payment_failed`: Already clean
- Add idempotency guard: check if subscription status already matches before updating (prevent duplicate event issues)
- Add basic webhook event logging (console.log event type + customer ID for debugging)
- Verify `current_period_end` is correctly parsed from Unix timestamp

### Claude's Discretion
- Whether to add a webhook event log table or just console.log
- Exact error handling patterns for edge cases
- Whether to add Stripe CLI test instructions to documentation

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/stripe.ts`: Lazy Stripe init, PLANS config with env-based price IDs
- `src/app/api/webhooks/stripe/route.ts`: All 4 event types handled
- `src/app/api/checkout/route.ts`: Customer creation, checkout session
- `src/app/api/checkout/verify/route.ts`: Post-redirect verification
- `src/app/api/portal/route.ts`: Billing portal access

### Established Patterns
- Lazy init pattern (`stripe()` factory) — ensures env vars read at runtime
- `updateMany` instead of `update` for webhook handlers (handles edge case where profile might not exist)
- Metadata includes `user_id` and `plan` on both session and subscription

### Integration Points
- `.env.local`: Contains all Stripe env vars (currently test keys)
- `src/middleware.ts`: Gates `/dashboard` and `/checkin` on `subscriptionStatus === 'active'`
- `src/app/pricing/page.tsx`: Displays plan cards, initiates checkout

</code_context>

<specifics>
## Specific Ideas

- This is primarily an audit phase — the code is mostly correct already
- Focus on edge cases that could cause production issues (duplicate webhooks, missing metadata)
- Document the production switchover checklist clearly

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-payment-readiness*
*Context gathered: 2026-04-01*
