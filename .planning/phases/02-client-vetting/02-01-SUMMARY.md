---
phase: 02-client-vetting
plan: "01"
subsystem: auth
tags: [prisma, zod, next-auth, middleware, forms, react-hook-form]

# Dependency graph
requires:
  - phase: 01-security-and-auth
    provides: Signup API route, middleware auth pattern, Prisma Profile model
provides:
  - Application fields on Profile model (10 fields: goal, experience, commitment, gender, age, height, weight, motivation, source)
  - applicationSchema Zod validation for coaching application form
  - Signup API storing application data and setting pending_approval status
  - 'Apply for Coaching' signup page with 11 fields and confirmation screen
  - Middleware enforcement blocking pending_approval/rejected users to /pending
  - /pending holding page with dynamic copy per approval status
affects: [coach-dashboard, client-approval, onboarding]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Application gating pattern: new signups set pending_approval, blocked from platform until coach approves
    - Form-to-DB field mapping: applicationSchema validates camelCase API, maps to snake_case DB columns via Prisma
    - Suspense wrapper for useSearchParams in server-safe client pages

key-files:
  created:
    - src/app/pending/page.tsx
  modified:
    - prisma/schema.prisma
    - src/lib/validations.ts
    - src/app/api/auth/signup/route.ts
    - src/app/signup/page.tsx
    - src/middleware.ts
    - generated/prisma (regenerated)

key-decisions:
  - "Application fields stored directly on Profile (not a separate Application model) — keeps schema simple and pre-fills onboarding later"
  - "No auto-login after application submit — user must wait for approval, sees confirmation screen"
  - "Rejected status handled same as pending_approval in middleware with query param ?status=rejected for different /pending copy"

patterns-established:
  - "Pending gating: subscriptionStatus === 'pending_approval' blocks all routes, redirects to /pending"
  - "Rejected gating: subscriptionStatus === 'rejected' redirects to /pending?status=rejected"

requirements-completed: [VET-01, VET-03]

# Metrics
duration: 18min
completed: 2026-03-31
---

# Phase 02 Plan 01: Client Vetting — Application Form & Pending State Summary

**Coaching application flow: 11-field 'Apply for Coaching' form stores vetting data on Profile with pending_approval gating via middleware and /pending holding page**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-31T20:15:00Z
- **Completed:** 2026-03-31T20:33:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Added 10 application fields to Profile Prisma model and regenerated client for type-safe access
- Created applicationSchema extending signUpSchema with all coaching vetting fields (goal, experience, commitment, gender, age, height ft/in, weight, motivation, source)
- Rewrote signup API to validate against applicationSchema, store all application data, and set subscriptionStatus to 'pending_approval'
- Rewrote signup page as multi-section 'Apply for Coaching' form with confirmation screen on success (no auto-login)
- Added pending_approval and rejected middleware blocks redirecting to /pending before all other route checks
- Created /pending page with Suspense-wrapped useSearchParams showing 'Application Under Review' or 'Application Not Accepted' copy

## Task Commits

Each task was committed atomically:

1. **Task 1: Add application fields to Profile, create applicationSchema, update signup API** - `7b07e11` (feat)
2. **Task 2: Rewrite signup page as application form, add pending middleware, create /pending page** - `34d47f7` (feat)

**Plan metadata:** (pending)

## Files Created/Modified
- `prisma/schema.prisma` - Added 10 application fields to Profile model
- `src/lib/validations.ts` - Added applicationSchema extending signUpSchema
- `src/app/api/auth/signup/route.ts` - Validates applicationSchema, stores fields, sets pending_approval
- `src/app/signup/page.tsx` - Rewritten as 'Apply for Coaching' form with sections and confirmation screen
- `src/middleware.ts` - Added pending_approval and rejected status blocks before other route checks
- `src/app/pending/page.tsx` - New holding page with dynamic status messaging

## Decisions Made
- Application fields stored directly on Profile (not a separate Application model) — matches plan intent: simpler schema and natural pre-fill for onboarding later
- No auto-login after application submit — user must wait for approval; client sees confirmation screen and link to login
- Rejected status handled in middleware same as pending_approval but with `?status=rejected` query param so /pending can show different copy
- Prisma client regenerated (`prisma generate`) to expose new Profile fields — db push deferred to live environment with DB access

## Deviations from Plan

None — plan executed exactly as written.

One note: `npx prisma db push` could not connect to localhost:5432 (no local DB in this environment). Ran `npx prisma generate` instead to update the generated client from schema. This is sufficient for TypeScript correctness; the migration runs against the live DB on deploy.

## Issues Encountered
- Prisma db push failed (no local DB) — resolved with `prisma generate` to update generated types, allowing TypeScript to compile cleanly

## User Setup Required
None — no new external service configuration required. When running against a live database, run `npx prisma db push` (or migration) to apply the new Profile columns.

## Next Phase Readiness
- Application form and pending state enforcement is complete and build-verified
- Coach approval UI (Phase 02 Plan 02) can now build on pending_approval status
- The `applicationGoal`, `applicationExperience`, etc. fields are available for display in the coach's client list/vetting queue
- No blockers

---
*Phase: 02-client-vetting*
*Completed: 2026-03-31*
