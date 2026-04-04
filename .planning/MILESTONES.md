# Milestones

## v0.9 — Core Platform (Pre-GSD)

**Status:** Complete (built before GSD adoption)
**Phases:** 0 (pre-GSD, no phase tracking)

**What shipped:**
- Full auth system (signup/login, role-based access)
- Client onboarding (9-step questionnaire)
- Macro calculation engine (Katch-McArdle, Mifflin-St Jeor)
- AI-powered meal plan and training plan generation
- Coach dashboard with client management
- Inline editing of all plans and macros
- Weekly check-in system with progress photos
- Automatic macro adjustment proposals
- Supplement catalog with 41 entries and dosage guidance
- Stripe checkout (test mode)
- Blog, referral system, unit toggle
- Client dashboard with all plan views

**What's missing for launch:**
- Password reset, email verification
- Client vetting/application flow
- Production Stripe keys
- End-to-end pipeline testing
- Rate limiting, security hardening

## v1.0 — Production Launch

**Status:** Complete
**Phases:** 1-6 (13 plans total)

**What shipped:**
- Phase 1: Password reset, email verification, rate limiting (Resend + in-memory limiter)
- Phase 2: Client vetting (application form, pending state, coach approval/reject)
- Phase 3: Coach editing completeness (add/remove meals, exercise/cardio audit)
- Phase 4: Email notifications (4 transactional emails, cron reminders) + messaging (per-client threads, unread badges)
- Phase 5: Stripe webhook hardening, idempotency, production key readiness
- Phase 6: Pipeline verification (51-point code audit, zero bugs)

**22 requirements delivered. 28/28 integration tests passing.**
