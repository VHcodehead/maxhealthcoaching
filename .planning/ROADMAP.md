# Roadmap: MaxHealth Coaching

## Milestones

- ✅ **v1.0 Production Launch** - Phases 1-6 (shipped 2026-04-01)
- 🚧 **v1.1 Dark Athletic Hybrid Redesign** - Phases 7-10 (in progress)

## Phases

<details>
<summary>✅ v1.0 Production Launch (Phases 1-6) - SHIPPED 2026-04-01</summary>

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
- [x] 01-01-PLAN.md — Shared infrastructure: Resend email service, rate limiter, Prisma token models, schemas, middleware
- [x] 01-02-PLAN.md — Password reset flow: forgot-password and reset-password pages + API routes
- [x] 01-03-PLAN.md — Email verification on signup + rate limiting on all auth endpoints

### Phase 2: Client Vetting
**Goal**: New signups cannot access the platform until the coach manually approves them
**Depends on**: Phase 1
**Requirements**: VET-01, VET-02, VET-03
**Success Criteria** (what must be TRUE):
  1. A newly registered user lands in a "pending" state and cannot access the client dashboard until approved
  2. Coach can see a list of pending applicants in the dashboard and approve or reject each one
  3. The login page displays an "Apply Now" call-to-action that directs visitors to the application flow
**Plans:** 2/2 plans complete

Plans:
- [x] 02-01-PLAN.md — Application form, data model, pending state middleware, and /pending holding page
- [x] 02-02-PLAN.md — Coach approve/reject workflow, approval emails, and Apply Now CTAs

### Phase 3: Coach Editing
**Goal**: Coach can fully edit every aspect of a client's plan with no gaps in the editing interface
**Depends on**: Phase 2
**Requirements**: EDIT-01, EDIT-02, EDIT-03, EDIT-04
**Success Criteria** (what must be TRUE):
  1. Coach can add a new meal to any day of a client's meal plan and remove individual meals without regenerating the whole plan
  2. Coach can add and remove individual exercises from any training day
  3. Coach can edit cardio prescriptions per training day (type, duration, frequency) and the changes persist and display correctly to the client
  4. All generated plan content — macros, meals, training, supplements — is editable inline with changes saving and reflecting on the client side
**Plans:** 2/2 plans complete

Plans:
- [x] 03-01-PLAN.md — Add and remove individual meals from client meal plans with day total recalculation
- [x] 03-02-PLAN.md — Verify and fix exercise/cardio editing, full editability audit across all content types

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
**Plans:** 3/3 plans complete

Plans:
- [x] 04-01-PLAN.md — Four notification email send functions and triggers in existing API routes
- [x] 04-02-PLAN.md — Message data model (Prisma) and /api/messages endpoint (GET/POST/PATCH)
- [x] 04-03-PLAN.md — Message thread UI for coach and client, unread badges on both dashboards

### Phase 5: Payment Readiness
**Goal**: The platform can accept real money — Stripe production configuration is verified and webhooks handle all subscription events
**Depends on**: Phase 1
**Requirements**: PAY-01, PAY-02
**Success Criteria** (what must be TRUE):
  1. Switching to production Stripe keys requires only an environment variable change — no code changes needed
  2. The webhook endpoint correctly handles all relevant Stripe subscription lifecycle events (created, updated, canceled, payment failed) and database state reflects each event accurately
**Plans:** 1/1 plans complete

Plans:
- [x] 05-01-PLAN.md — Audit env-var config for production key swap, harden webhook with idempotency and edge case handling

### Phase 6: Pipeline Verification
**Goal**: Every critical user flow works end-to-end in a production-like environment before the first real client is onboarded
**Depends on**: Phase 2, Phase 3, Phase 4, Phase 5
**Requirements**: PIPE-01, PIPE-02, PIPE-03
**Success Criteria** (what must be TRUE):
  1. A full client lifecycle runs without errors: signup triggers vetting, coach approves, client completes onboarding, plan is generated, check-in is submitted, auto-adjustment is proposed, coach reviews and approves
  2. Stripe checkout completes and subscription status is active and correct in both Stripe and the platform database
  3. All coach editing operations (add/remove meals, add/remove exercises, edit cardio, macro overrides) save correctly and the updated content is visible on the client dashboard
**Plans:** 2/2 plans complete

Plans:
- [x] 06-01-PLAN.md — Code audit of all three pipelines (lifecycle, Stripe, editing), bug fixes, build verification
- [x] 06-02-PLAN.md — Human walkthrough of entire product end-to-end before launch

</details>

### v1.1 Dark Athletic Hybrid Redesign (In Progress)

**Milestone Goal:** Transform the entire site from generic SaaS template to premium fitness coaching platform that commands $499/mo — dark zinc-950 theme, emerald accents, bold condensed typography, glass-effect cards, consistent animation system.

#### Phase 7: Design Foundation
**Goal**: Every page on the site can consume a single source of design truth — color tokens, typography scale, component variants, and animation primitives — that all subsequent phases apply
**Depends on**: Phase 6
**Requirements**: THEME-01, THEME-02, THEME-03, THEME-04
**Success Criteria** (what must be TRUE):
  1. The site background is zinc-950 globally — no white or light-gray backgrounds appear on any page
  2. Emerald-500 is the consistent primary accent color for all interactive elements (buttons, active states, focus rings) across the entire app
  3. A bold condensed heading font and a clean body font are loaded and applied to all headings and body text site-wide
  4. All buttons, cards, form inputs, and badges have dark-surface variants available as reusable classes or components
  5. Interactive elements (buttons, links, modals) share a consistent transition/animation behavior — no jarring instant state changes
**Plans**: 2 plans

Plans:
- [x] 07-01-PLAN.md — Dark palette CSS variables + Bebas Neue font loading
- [x] 07-02-PLAN.md — Component overrides for dark surfaces + animation utilities

#### Phase 8: Public Pages
**Goal**: Prospects visiting the site encounter a premium, high-conversion dark-themed experience before ever creating an account
**Depends on**: Phase 7
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04
**Success Criteria** (what must be TRUE):
  1. The landing page hero reads immediately as a premium fitness brand — dark background, bold condensed headline, emerald CTA button, above the fold with no light artifacts
  2. The pricing page presents three tiers on dark cards with emerald highlights, and tier differences are immediately scannable without reading fine print
  3. Login and Apply pages match the dark brand — no white form panels or light backgrounds visible
  4. The pending/waiting page communicates brand quality rather than a bare holding message — dark-themed with reassuring copy and styling
**Plans**: 2 plans

Plans:
- [x] 08-01-PLAN.md — Landing page dark restyle (hero, nav, features, comparison, pricing, FAQ, footer)
- [x] 08-02-PLAN.md — Auth pages dark restyle (login, apply, pricing, pending)

#### Phase 9: Dashboards
**Goal**: Both coaches and clients operate inside a cohesive dark athletic interface — every data view, editing surface, and navigation element is on-brand
**Depends on**: Phase 7
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, COACH-01, COACH-02, COACH-03
**Success Criteria** (what must be TRUE):
  1. The client sidebar is dark with emerald active states — no light sidebar or white nav elements appear
  2. Client macro overview displays stat cards and a macro visualization ring on a dark surface with high-contrast labels
  3. Meal plan and training plan pages use dark cards with clear macro and exercise data — day/week navigation is visible and styled
  4. The coach client list shows dark cards with clearly styled status badges and unread message indicators
  5. The coach client detail page uses dark expandable sections and editing dialogs — editing actions are visually distinct from read state
**Plans**: 4 plans

Plans:
- [x] 09-01-PLAN.md — Client layout, overview, meals, and training dark restyle
- [x] 09-02-PLAN.md — Client supplements, messages, progress, and referral dark restyle
- [x] 09-03-PLAN.md — Coach overview, client list, settings, and content dark restyle
- [x] 09-04-PLAN.md — Coach client detail page and all coach components dark restyle

#### Phase 10: Onboarding
**Goal**: New clients experience a premium, brand-consistent intake flow from first question through plan generation — the quality of the form matches the quality of the coaching
**Depends on**: Phase 8
**Requirements**: ONBOARD-01, ONBOARD-02
**Success Criteria** (what must be TRUE):
  1. The multi-step onboarding form is fully dark-themed with a visible step progress indicator and dark card-style answer selections
  2. The plan-generating loading page is dark-themed with a premium animation — no bare spinner or white background visible during the wait
  3. The visual quality of the onboarding flow matches the landing page — a prospect who signs up after seeing the landing page is not surprised by a style regression
**Plans**: 2 plans

Plans:
- [ ] 10-01-PLAN.md — Onboarding multi-step form dark restyle (9 steps, SelectableCards, TagInput, progress bar)
- [ ] 10-02-PLAN.md — Generating page, check-in page, and success page dark restyle

## Progress

**Execution Order:**
v1.1 phases execute in order: 7 → 8 → 9 → 10
Note: Phase 9 (Dashboards) depends only on Phase 7 and could theoretically run in parallel with Phase 8, but sequential ordering keeps the design consistent.

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Security and Auth | v1.0 | 3/3 | Complete | 2026-03-31 |
| 2. Client Vetting | v1.0 | 2/2 | Complete | 2026-04-01 |
| 3. Coach Editing | v1.0 | 2/2 | Complete | 2026-04-01 |
| 4. Email Notifications | v1.0 | 3/3 | Complete | 2026-04-01 |
| 5. Payment Readiness | v1.0 | 1/1 | Complete | 2026-04-01 |
| 6. Pipeline Verification | v1.0 | 2/2 | Complete | 2026-04-01 |
| 7. Design Foundation | v1.1 | 2/2 | Complete | 2026-04-04 |
| 8. Public Pages | v1.1 | 2/2 | Complete | 2026-04-04 |
| 9. Dashboards | v1.1 | 4/4 | Complete | 2026-04-04 |
| 10. Onboarding | 1/2 | In Progress|  | - |
