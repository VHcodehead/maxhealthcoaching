# Roadmap: MaxHealth Coaching

## Overview

Six phases take the platform from a functional but incomplete v0.9 prototype to a production-ready coaching business. The core product loop already works. This milestone closes every gap between "it mostly works" and "ready to charge real clients": security hardening and password reset, client vetting before anyone gets in, coach editing completeness, email notifications via an integrated email service, Stripe production keys, and a final end-to-end pipeline verification pass.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Security and Auth** - Rate limiting, password reset, and email verification (completed 2026-03-31)
- [ ] **Phase 2: Client Vetting** - Application flow and coach approval before access is granted
- [ ] **Phase 3: Coach Editing** - Audit and complete all editing capabilities (meals, exercises, cardio)
- [ ] **Phase 4: Email Notifications** - Email notifications and coach-client messaging
- [ ] **Phase 5: Payment Readiness** - Stripe production key configuration and webhook hardening
- [ ] **Phase 6: Pipeline Verification** - End-to-end lifecycle testing across all flows

## Phase Details

### Phase 1: Security and Auth
**Goal**: Users can securely manage their credentials and the platform resists brute-force attacks
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04
**Success Criteria** (what must be TRUE):
  1. User can click "Forgot password?" on the login page, receive an email with a reset link, and successfully set a new password
  2. New signup triggers an email verification message and the account is not fully accessible until verified
  3. Repeated failed login attempts are rejected with rate limiting (not just silently allowed through)
  4. The "Forgot password?" link on the login page navigates to a functional reset flow, not a dead anchor
**Plans:** 3/3 plans complete
Plans:
- [ ] 01-01-PLAN.md — Shared infrastructure: Resend email service, rate limiter, Prisma token models, schemas, middleware
- [ ] 01-02-PLAN.md — Password reset flow: forgot-password and reset-password pages + API routes
- [ ] 01-03-PLAN.md — Email verification on signup + rate limiting on all auth endpoints

### Phase 2: Client Vetting
**Goal**: New signups cannot access the platform until the coach manually approves them
**Depends on**: Phase 1
**Requirements**: VET-01, VET-02, VET-03
**Success Criteria** (what must be TRUE):
  1. A newly registered user lands in a "pending" state and cannot access the client dashboard until approved
  2. Coach can see a list of pending applicants in the dashboard and approve or reject each one
  3. The login page displays an "Apply Now" call-to-action that directs visitors to the application flow
**Plans:** 2 plans
Plans:
- [ ] 02-01-PLAN.md — Application form, data model, pending state middleware, and /pending holding page
- [ ] 02-02-PLAN.md — Coach approve/reject workflow, approval emails, and Apply Now CTAs

### Phase 3: Coach Editing
**Goal**: Coach can fully edit every aspect of a client's plan with no gaps in the editing interface
**Depends on**: Phase 2
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04
**Success Criteria** (what must be TRUE):
  1. Coach can add a new meal to any day of a client's meal plan and remove individual meals without regenerating the whole plan
  2. Coach can add and remove individual exercises from any training day
  3. Coach can edit cardio prescriptions per training day (type, duration, frequency) and the changes persist and display correctly to the client
  4. All generated plan content — macros, meals, training, supplements — is editable inline with changes saving and reflecting on the client side
**Plans:** 1/2 plans executed
Plans:
- [ ] 03-01-PLAN.md — Add and remove individual meals from client meal plans with day total recalculation
- [ ] 03-02-PLAN.md — Verify and fix exercise/cardio editing, full editability audit across all content types

### Phase 4: Email Notifications
**Goal**: Coach and clients receive the right email at the right moment throughout the coaching workflow, and can exchange messages in a per-client thread
**Depends on**: Phase 1
**Requirements**: NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, MSG-01, MSG-02
**Success Criteria** (what must be TRUE):
  1. Client receives an email when their plan is generated and ready to view
  2. Client receives a weekly reminder email prompting them to submit their check-in
  3. Coach receives an email when a client submits a check-in
  4. Client receives an email when the coach approves a macro adjustment on their behalf
  5. Coach and client can exchange messages in a per-client thread
  6. Unread message count badge is visible on coach and client dashboards
**Plans:** 3 plans
Plans:
- [ ] 04-01-PLAN.md — Four notification email send functions and triggers in existing API routes
- [ ] 04-02-PLAN.md — Message data model (Prisma) and /api/messages endpoint (GET/POST/PATCH)
- [ ] 04-03-PLAN.md — Message thread UI for coach and client, unread badges on both dashboards

### Phase 5: Payment Readiness
**Goal**: The platform can accept real money — Stripe production configuration is verified and webhooks handle all subscription events
**Depends on**: Phase 1
**Requirements**: PAY-01, PAY-02
**Success Criteria** (what must be TRUE):
  1. Switching to production Stripe keys requires only an environment variable change — no code changes needed
  2. The webhook endpoint correctly handles all relevant Stripe subscription lifecycle events (created, updated, canceled, payment failed) and database state reflects each event accurately
**Plans**: TBD

### Phase 6: Pipeline Verification
**Goal**: Every critical user flow works end-to-end in a production-like environment before the first real client is onboarded
**Depends on**: Phase 2, Phase 3, Phase 4, Phase 5
**Requirements**: PIPE-01, PIPE-02, PIPE-03
**Success Criteria** (what must be TRUE):
  1. A full client lifecycle runs without errors: signup triggers vetting, coach approves, client completes onboarding, plan is generated, check-in is submitted, auto-adjustment is proposed, coach reviews and approves
  2. Stripe checkout completes and subscription status is active and correct in both Stripe and the platform database
  3. All coach editing operations (add/remove meals, add/remove exercises, edit cardio, macro overrides) save correctly and the updated content is visible on the client dashboard
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6
Note: Phase 4 depends on Phase 1 only and can begin after Phase 1 completes. Phases 3 and 4 can run in parallel if desired.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Security and Auth | 3/3 | Complete   | 2026-03-31 |
| 2. Client Vetting | 0/2 | Planning complete | - |
| 3. Coach Editing | 1/2 | In Progress|  |
| 4. Email Notifications | 0/3 | Planning complete | - |
| 5. Payment Readiness | 0/TBD | Not started | - |
| 6. Pipeline Verification | 0/TBD | Not started | - |
