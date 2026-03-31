---
phase: 01-security-and-auth
plan: "02"
subsystem: auth
tags: [password-reset, email, resend, react-hook-form, zod, prisma, rate-limiting, nextjs]

# Dependency graph
requires:
  - phase: 01-security-and-auth/01-01
    provides: email.ts sendPasswordResetEmail, rate-limit.ts RESET_LIMIT, Prisma PasswordResetToken model, forgotPasswordSchema/resetPasswordSchema in validations.ts

provides:
  - POST /api/auth/forgot-password — rate-limited token generation + email dispatch with email enumeration prevention
  - POST /api/auth/reset-password — single-use token validation, password update, token deletion in Prisma transaction
  - /forgot-password page — email input form with persistent success confirmation
  - /reset-password page — password + confirm form reading token from URL search params
  - Login page Forgot password? link pointing to /forgot-password (was href="#")

affects: [01-03, future-auth-flows, password-management]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Lazy SDK initialization for Resend to prevent build-time throw when env var absent
    - Generic "if that email is registered" response to prevent email enumeration
    - SHA-256 hash stored in DB, raw token sent in URL (never store raw tokens)
    - Prisma transaction for atomic password update + token deletion (single-use guarantee)
    - Suspense wrapping for useSearchParams() in Next.js App Router pages

key-files:
  created:
    - src/app/api/auth/forgot-password/route.ts
    - src/app/api/auth/reset-password/route.ts
    - src/app/forgot-password/page.tsx
    - src/app/reset-password/page.tsx
  modified:
    - src/app/login/page.tsx
    - src/lib/email.ts
    - src/lib/auth.config.ts

key-decisions:
  - "Lazy Resend initialization in email.ts: prevents build-time Error when RESEND_API_KEY is not set in build environment"
  - "emailVerified coerced with !!user.emailVerified in auth.config.ts: NextAuth types emailVerified as Date|null, not boolean"

patterns-established:
  - "Token hashing pattern: crypto.randomBytes(32).toString('hex') raw token in URL, sha256 hash in DB"
  - "Forgot-password success state: replace form with confirmation message (not toast) so message persists without user action"
  - "Reset-password error state: inline server error with link to request-new-token, not just toast"

requirements-completed: [AUTH-01, AUTH-04]

# Metrics
duration: 16min
completed: 2026-03-31
---

# Phase 01 Plan 02: Password Reset Flow Summary

**Full password reset flow via email: hashed token generation, Resend dispatch, single-use token validation, and Prisma atomic password update with email enumeration prevention**

## Performance

- **Duration:** 16 min
- **Started:** 2026-03-31T19:14:31Z
- **Completed:** 2026-03-31T19:30:31Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Two new API routes: `POST /api/auth/forgot-password` (rate-limited, generates token, sends email, generic response) and `POST /api/auth/reset-password` (validates hash, updates password, deletes token atomically)
- Two new pages: `/forgot-password` with email form + persistent success confirmation, and `/reset-password` with Suspense + URL token reading + password form + inline error state
- Login page "Forgot password?" link fixed from `href="#"` to `href="/forgot-password"`
- Fixed pre-existing build failure from eager Resend SDK initialization in `email.ts`
- Fixed pre-existing type error in `auth.config.ts` for `emailVerified` boolean coercion

## Task Commits

Each task was committed atomically:

1. **Task 1: Create forgot-password and reset-password API routes** - `fd01c08` (feat)
2. **Task 2: Create forgot-password page, reset-password page, and fix login link** - `54d2ddc` (feat)

## Files Created/Modified
- `src/app/api/auth/forgot-password/route.ts` — POST endpoint: rate limit, generate token, SHA-256 hash, store, send email, generic response
- `src/app/api/auth/reset-password/route.ts` — POST endpoint: hash incoming token, find unexpired record, bcrypt hash new password, Prisma transaction
- `src/app/forgot-password/page.tsx` — Email form with MaxHealth branding, success confirmation replaces form on submit
- `src/app/reset-password/page.tsx` — Password + confirm form, reads token from useSearchParams, inline error on 400, redirects to login on success
- `src/app/login/page.tsx` — Changed Forgot password? link from `href="#"` to `href="/forgot-password"`
- `src/lib/email.ts` — Changed from eager to lazy Resend instantiation to prevent build-time Error
- `src/lib/auth.config.ts` — Fixed emailVerified boolean coercion (`!!user.emailVerified`)

## Decisions Made
- Lazy Resend initialization: the Resend SDK constructor throws immediately when `RESEND_API_KEY` is missing. Moved to a `getResend()` lazy factory so the build succeeds without the key — it only throws at request time when actually needed.
- `!!user.emailVerified` coercion: NextAuth's built-in `User.emailVerified` is typed as `Date | null`. The project's custom JWT extension expects `boolean`, so coercion at assignment is required.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed eager Resend SDK initialization causing build failure**
- **Found during:** Task 2 (build verification)
- **Issue:** `const resend = new Resend(process.env.RESEND_API_KEY)` at module top-level throws `Error: Missing API key` during Next.js build's "Collecting page data" phase when `RESEND_API_KEY` is absent
- **Fix:** Replaced with `getResend()` lazy factory function — only instantiates on first call
- **Files modified:** `src/lib/email.ts`
- **Verification:** `npm run build` completes successfully
- **Committed in:** `54d2ddc` (Task 2 commit)

**2. [Rule 1 - Bug] Fixed emailVerified type mismatch in auth.config.ts**
- **Found during:** Task 2 (build verification) — `npm run build` TypeScript pass caught it
- **Issue:** `token.emailVerified = user.emailVerified ?? false` assigns `Date | false` to a `boolean` JWT field. Pre-existing, introduced by plan 01-01 work left uncommitted.
- **Fix:** Changed to `!!user.emailVerified` for correct boolean coercion; session callback line auto-fixed by linter with `(session.user as any).emailVerified`
- **Files modified:** `src/lib/auth.config.ts`
- **Verification:** TypeScript pass in `npm run build` passes cleanly
- **Committed in:** `54d2ddc` (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking build issue, 1 pre-existing type bug)
**Impact on plan:** Both fixes required for build to succeed. No scope creep — directly blocked the `npm run build` verification criterion.

## Issues Encountered
- ZodError in `reset-password/route.ts` used `.errors[0]` but Zod's `ZodError` exposes `.issues` not `.errors`. Caught by `npx tsc --noEmit` and fixed inline before committing.

## User Setup Required
**External service requires configuration.** Add to `.env.local`:
```
RESEND_API_KEY=re_xxxxxxxxxxxx
```
The password reset email flow will throw at request time (not build time) until this key is set. Obtain from [resend.com/api-keys](https://resend.com/api-keys).

## Next Phase Readiness
- Password reset flow is complete and functional once `RESEND_API_KEY` is provisioned
- Plan 01-03 (email verification) was already executed before this plan — all auth infrastructure is now in place
- The full auth suite (signup, login, email verification, password reset) is operational

---
*Phase: 01-security-and-auth*
*Completed: 2026-03-31*

## Self-Check: PASSED

All created files exist on disk. Both task commits (fd01c08, 54d2ddc) confirmed in git log.
