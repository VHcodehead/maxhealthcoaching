---
phase: 01-security-and-auth
plan: "01"
subsystem: auth
tags: [resend, email, rate-limiting, prisma, zod, middleware]

# Dependency graph
requires: []
provides:
  - Resend email client with branded HTML templates (sendPasswordResetEmail, sendVerificationEmail)
  - In-memory rate limiter with configurable windows and preset configs (LOGIN/SIGNUP/RESET_LIMIT)
  - PasswordResetToken Prisma model with hashed token and expiry
  - EmailVerificationToken Prisma model with hashed token and expiry
  - Zod schemas for forgot-password and reset-password forms
  - Middleware updated to allow unauthenticated access to /forgot-password, /reset-password, /verify-email
affects: [02-password-reset, 03-email-verification, 04-notifications]

# Tech tracking
tech-stack:
  added: [resend@4.x]
  patterns:
    - "Branded HTML emails via buildBrandedHtml helper with MaxHealth green (#059669) theme"
    - "In-memory rate limiting via module-level Map with TTL-based expiry and lazy cleanup"
    - "Prisma token models use hashed_token column — raw tokens never stored"

key-files:
  created:
    - src/lib/email.ts
    - src/lib/rate-limit.ts
  modified:
    - src/lib/validations.ts
    - prisma/schema.prisma
    - src/middleware.ts

key-decisions:
  - "Used Resend SDK (not SendGrid) — matches project decision logged in STATE.md"
  - "Rate limiter is in-memory (no Redis) — adequate for single-instance Next.js; upgrade to Redis if horizontal scaling needed"
  - "Lazy cleanup + periodic sweep every 100 calls prevents unbounded Map growth without a scheduled job"
  - "PasswordResetToken and EmailVerificationToken are separate models (not a polymorphic tokens table) for type safety"

patterns-established:
  - "Email: all outbound emails go through sendEmail() in src/lib/email.ts — never call Resend directly from routes"
  - "Rate limiting: call rateLimit(key, config) at the top of API route handlers, return 429 on success:false"
  - "Token models: always store hashedToken (SHA-256 of raw token), never the raw token itself"

requirements-completed: [AUTH-01, AUTH-03]

# Metrics
duration: 12min
completed: 2026-03-31
---

# Phase 1 Plan 01: Auth Infrastructure Summary

**Resend email service with branded HTML templates, in-memory rate limiter with preset configs, PasswordResetToken and EmailVerificationToken Prisma models, and Zod schemas wired into updated middleware**

## Performance

- **Duration:** 12 min
- **Started:** 2026-03-31T18:59:45Z
- **Completed:** 2026-03-31T19:11:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Email service ready: `sendPasswordResetEmail` and `sendVerificationEmail` produce MaxHealth-branded HTML emails via Resend SDK — Plans 02 and 03 can import and call immediately
- Rate limiter ready: `rateLimit(key, config)` with `LOGIN_LIMIT`, `SIGNUP_LIMIT`, and `RESET_LIMIT` presets covers all auth endpoints
- Prisma schema extended: `PasswordResetToken` and `EmailVerificationToken` models with `onDelete: Cascade` and `@@map` conventions; Prisma client regenerated
- Middleware allows unauthenticated access to `/forgot-password`, `/reset-password`, `/verify-email` — pages can be built without auth bypass hacks

## Task Commits

Each task was committed atomically:

1. **Task 1: Create email service, rate limiter, and Zod schemas** - `5559c91` (feat)
2. **Task 2: Add Prisma token models and update middleware public routes** - `7d0f84a` (feat)

**Plan metadata:** (docs commit to follow)

## Files Created/Modified

- `src/lib/email.ts` - Resend client wrapper, buildBrandedHtml helper, sendPasswordResetEmail, sendVerificationEmail, sendEmail
- `src/lib/rate-limit.ts` - rateLimit function, RateLimitConfig type, LOGIN_LIMIT / SIGNUP_LIMIT / RESET_LIMIT presets
- `src/lib/validations.ts` - Added forgotPasswordSchema and resetPasswordSchema at end of file
- `prisma/schema.prisma` - Added PasswordResetToken and EmailVerificationToken models; added relations to User model
- `src/middleware.ts` - Added /forgot-password, /reset-password, /verify-email to publicRoutes array

## Decisions Made

- Used Resend (not SendGrid) — matches project decision recorded during planning phase
- In-memory Map for rate limiting rather than Redis — appropriate for current single-instance deployment; upgrade path is clear if scaling is needed
- Separate token models (not polymorphic) — keeps Prisma types explicit and avoids string-based type discrimination
- Lazy cleanup with periodic sweep every 100 calls — prevents memory leak without needing a cron job or setInterval

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Environment variables required before Plans 02 and 03 can execute end-to-end:**

- `RESEND_API_KEY` — Resend API key from resend.com dashboard
- `RESEND_FROM_EMAIL` (optional) — Override sender address (defaults to `MaxHealth Coaching <noreply@maxhealthfitness.com>`)

No dashboard configuration steps required beyond obtaining the API key.

## Next Phase Readiness

- Plan 02 (password reset flow) can proceed immediately — all infrastructure it depends on is in place
- Plan 03 (email verification + rate limiting) can proceed immediately — same infrastructure shared
- `RESEND_API_KEY` env var must be provisioned in `.env.local` (and production secrets) before email delivery will work in test/prod environments

---
*Phase: 01-security-and-auth*
*Completed: 2026-03-31*
