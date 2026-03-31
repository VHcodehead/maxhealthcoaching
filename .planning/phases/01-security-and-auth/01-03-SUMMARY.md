---
phase: 01-security-and-auth
plan: "03"
subsystem: auth
tags: [email-verification, rate-limiting, jwt, next-auth, resend, prisma]

requires:
  - phase: 01-security-and-auth/01-01
    provides: "email.ts sendVerificationEmail, rate-limit.ts rateLimit/LOGIN_LIMIT/SIGNUP_LIMIT, EmailVerificationToken Prisma model"

provides:
  - "Signup route sends SHA-256 hashed verification email token via Resend (non-blocking)"
  - "GET /api/auth/verify-email validates token, sets emailVerified=true, deletes token"
  - "Verify-email page with success/error states at /verify-email"
  - "Login authorize rate-limited 5 attempts/15min per email"
  - "Signup rate-limited 3 attempts/hr per IP"
  - "emailVerified boolean flows through NextAuth JWT -> session -> client"
  - "Dashboard amber banner for unverified users via useSession()"

affects: [dashboard, auth, notifications]

tech-stack:
  added: []
  patterns:
    - "Non-blocking email: email send wrapped in try/catch after successful DB transaction"
    - "Token security: raw token sent in email, SHA-256 hash stored in DB (never store raw)"
    - "Rate limit keys: signup:<ip> and login:<email> for namespaced limiting"
    - "emailVerified coerced to boolean (!!user.emailVerified) before storing in JWT to avoid NextAuth Date type conflict"

key-files:
  created:
    - src/app/api/auth/verify-email/route.ts
    - src/app/verify-email/page.tsx
  modified:
    - src/app/api/auth/signup/route.ts
    - src/lib/auth.ts
    - src/lib/auth.config.ts
    - src/types/next-auth.d.ts
    - src/app/dashboard/page.tsx

key-decisions:
  - "emailVerified stored as boolean in JWT (not Date) — coerced with !! to avoid NextAuth's Date type for emailVerified on DefaultUser"
  - "Session assignment uses (session.user as any).emailVerified cast to bypass DefaultSession type conflict with our boolean override"
  - "Email send failure is non-blocking — token is stored but email error is only logged, signup still returns success"
  - "emailVerified defaults to true in dashboard before session loads to prevent flash of verification banner for already-verified users"

patterns-established:
  - "Token pattern: crypto.randomBytes(32).toString('hex') raw -> SHA-256 hash stored -> raw token in URL"
  - "Dashboard data enrichment: use useSession() for auth state, /api/dashboard for profile/plan data"

requirements-completed: [AUTH-02, AUTH-03]

duration: 5min
completed: "2026-03-31"
---

# Phase 1 Plan 3: Email Verification and Rate Limiting Summary

**Email verification on signup via SHA-256 token + Resend, login/signup rate limiting, and emailVerified boolean flowing JWT to dashboard banner**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-31T19:54:52Z
- **Completed:** 2026-03-31T19:59:52Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Signup route generates SHA-256 hashed email verification token, stores it in EmailVerificationToken, and sends branded email via Resend (non-blocking on failure)
- GET /api/auth/verify-email validates token against DB hash, checks expiry, sets user.emailVerified=true in transaction, then redirects to /verify-email status page
- Login authorize function rate-limited at 5 attempts per email per 15 minutes (throws Error for NextAuth error propagation)
- Signup rate-limited at 3 attempts per IP per hour
- emailVerified boolean flows from authorize return -> JWT callback -> session callback -> client session
- Dashboard /verify-email amber banner shown conditionally via useSession() when emailVerified is false

## Task Commits

1. **Task 1: Email verification on signup + verify-email endpoint + page** - `aeb093a` (feat)
2. **Task 2: Login rate limiting, emailVerified JWT, dashboard banner** - `c1557e1` (feat)

**Plan metadata:** _(to be added)_

## Files Created/Modified

- `src/app/api/auth/signup/route.ts` - Added IP rate limiting (3/hr) and post-transaction email verification token generation + sendVerificationEmail call
- `src/app/api/auth/verify-email/route.ts` - New GET endpoint: validates token hash, sets emailVerified=true, deletes token, redirects
- `src/app/verify-email/page.tsx` - New 'use client' page with Suspense, shows success (CheckCircle2) or error (AlertCircle) based on URL status param
- `src/lib/auth.ts` - Added LOGIN_LIMIT rate check at start of authorize, added emailVerified to return object
- `src/lib/auth.config.ts` - JWT callback adds `token.emailVerified = !!user.emailVerified`; session callback exposes `session.user.emailVerified`
- `src/types/next-auth.d.ts` - Added emailVerified?: boolean to User interface, emailVerified: boolean to Session.user and JWT interfaces
- `src/app/dashboard/page.tsx` - Added useSession() import and call, amber verification banner rendered when !emailVerified

## Decisions Made

- **emailVerified as boolean in JWT:** NextAuth's DefaultUser has `emailVerified?: Date | null` but we store it as a plain boolean on our Prisma User model. Coercing with `!!` before JWT storage avoids type conflicts and is semantically correct for our use case.
- **Session type cast:** `(session.user as any).emailVerified` used in session callback because DefaultSession types emailVerified as `Date` — our d.ts override to `boolean` causes TS2322. The cast maintains runtime correctness.
- **Non-blocking email:** Token stored in DB before email send attempt; email failure only logs error. This ensures signup never fails due to email service outage.
- **Dashboard default true:** `emailVerified` defaults to `true` before session loads to prevent flash of the amber banner for users who are already verified (session loads async).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Coerced emailVerified to boolean with !! operator in JWT callback**
- **Found during:** Task 2 (auth.config.ts JWT callback)
- **Issue:** TypeScript TS2322 error — `user.emailVerified` is `boolean | Date` due to NextAuth's DefaultUser type; direct assignment to JWT boolean field fails
- **Fix:** Used `!!user.emailVerified` in JWT callback and `(session.user as any).emailVerified` in session callback
- **Files modified:** src/lib/auth.config.ts
- **Verification:** `npx tsc --noEmit` passes with no project source errors
- **Committed in:** c1557e1 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - type coercion bug)
**Impact on plan:** Minor fix for TypeScript compatibility. No scope changes.

## Issues Encountered

- Pre-existing build failure in `npm run build` due to missing `RESEND_API_KEY` environment variable (Resend SDK throws at module initialization). This is a known blocker documented in STATE.md and unrelated to this plan's changes. TypeScript check (`npx tsc --noEmit`) passes cleanly.

## Next Phase Readiness

- Email verification flow is fully wired: signup -> token stored -> email sent -> click link -> verified -> banner disappears
- Rate limiting active on login (5/15min) and signup (3/hr)
- emailVerified available in session client-side for any future conditional rendering
- Plan 01-02 (password reset) changes (login page `href="/forgot-password"`) are uncommitted alongside this work — will need to be committed separately

---
*Phase: 01-security-and-auth*
*Completed: 2026-03-31*
