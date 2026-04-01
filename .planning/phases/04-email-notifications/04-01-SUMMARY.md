---
phase: 04-email-notifications
plan: 01
subsystem: api
tags: [email, resend, notifications, cron, transactional-email]

# Dependency graph
requires:
  - phase: 01-security-and-auth
    provides: email.ts with Resend SDK, sendEmail helper, and buildBrandedHtml pattern
  - phase: 02-client-vetting
    provides: Profile model with fullName/email, role/subscriptionStatus/onboardingCompleted fields
  - phase: 03-coach-editing
    provides: CheckIn model, PendingMacroAdjustment model

provides:
  - Four transactional email send functions in email.ts (plan-ready, check-in reminder, coach check-in alert, macro approved)
  - /api/cron/checkin-reminders GET endpoint with CRON_SECRET auth for weekly reminders
  - Plan-ready email trigger in /api/training-plan POST handler
  - Coach notification trigger in /api/checkin POST handler
  - Client macro approval trigger in /api/admin/macro-adjustments/[id] PUT handler

affects: [deployment, phase-05-stripe-billing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fire-and-forget email sends using .catch() pattern (no await in route handlers)
    - CRON_SECRET Bearer token auth for cron endpoints
    - Promise.allSettled for concurrent bulk email sending

key-files:
  created:
    - src/app/api/cron/checkin-reminders/route.ts
  modified:
    - src/lib/email.ts
    - src/app/api/training-plan/route.ts
    - src/app/api/checkin/route.ts
    - src/app/api/admin/macro-adjustments/[id]/route.ts

key-decisions:
  - "All email sends in route handlers are non-blocking (fire-and-forget with .catch()) — API response latency not affected by email delivery"
  - "Cron endpoint uses CRON_SECRET Bearer token auth (not NextAuth session) — cron jobs don't have user sessions"
  - "Promise.allSettled used in cron endpoint so one email failure doesn't abort remaining sends"
  - "Coach email in checkin route uses hardcoded 'Coach' as name — single-coach platform, no need to fetch coach name"

patterns-established:
  - "Non-blocking email: sendXxxEmail(...).catch(err => console.error(...)) — never await email sends in route handlers"
  - "Cron auth: Bearer ${process.env.CRON_SECRET} checked before any DB queries"
  - "Bulk send: Promise.allSettled over per-item async tasks with per-item error tracking"

requirements-completed: [NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04]

# Metrics
duration: 15min
completed: 2026-03-31
---

# Phase 4 Plan 1: Email Notifications Summary

**Four transactional emails wired across the platform using non-blocking Resend sends: plan-ready, weekly check-in reminder cron, coach check-in alert, and macro approval notification**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-31
- **Completed:** 2026-04-01T00:15:12Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Added four email send functions to email.ts following the established buildBrandedHtml pattern
- Created /api/cron/checkin-reminders endpoint with CRON_SECRET auth, eligible-client filtering via hasCheckedInThisWeek, and Promise.allSettled bulk sending
- Wired plan-ready, coach check-in, and macro approval email triggers into existing API routes as fire-and-forget sends

## Task Commits

1. **Task 1: Add four notification email send functions to email.ts** - `8e2a46d` (feat)
2. **Task 2: Wire email triggers and create cron endpoint** - `dd7065b` (feat)

**Plan metadata:** _(to follow)_

## Files Created/Modified

- `src/lib/email.ts` - Added sendPlanReadyEmail, sendCheckinReminderEmail, sendCheckinNotificationEmail, sendMacroApprovedEmail
- `src/app/api/cron/checkin-reminders/route.ts` - New cron endpoint for weekly check-in reminders
- `src/app/api/training-plan/route.ts` - Added plan-ready email trigger after successful plan save
- `src/app/api/checkin/route.ts` - Added coach notification after check-in submission
- `src/app/api/admin/macro-adjustments/[id]/route.ts` - Added client notification after macro approval

## Decisions Made

- All email sends in route handlers are non-blocking (.catch() pattern) — API response latency is not affected by email delivery
- Cron endpoint uses CRON_SECRET Bearer token auth rather than NextAuth session, since cron jobs have no user context
- Promise.allSettled used in the cron endpoint so a single email failure does not abort remaining sends; errors are counted and returned in the response
- Coach name hardcoded as "Coach" in the check-in notification email — single-coach platform, no need to look up coach name

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**CRON_SECRET environment variable must be provisioned** before the /api/cron/checkin-reminders endpoint is functional. Set it on the hosting platform (e.g., Vercel) and configure the cron job scheduler (e.g., Vercel Cron or an external scheduler) to call `GET /api/cron/checkin-reminders` weekly with `Authorization: Bearer <CRON_SECRET>`.

RESEND_API_KEY must also be set (established in Phase 1).

## Next Phase Readiness

- All four notification emails are implemented and ready for production use
- Phase 5 (Stripe Billing) can proceed independently
- Cron job scheduling must be configured on the deployment platform before reminders activate

## Self-Check: PASSED

- src/lib/email.ts: FOUND
- src/app/api/cron/checkin-reminders/route.ts: FOUND
- .planning/phases/04-email-notifications/04-01-SUMMARY.md: FOUND
- Commit 8e2a46d: FOUND
- Commit dd7065b: FOUND

---
*Phase: 04-email-notifications*
*Completed: 2026-03-31*
