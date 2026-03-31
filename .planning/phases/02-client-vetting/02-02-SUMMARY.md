---
phase: 02-client-vetting
plan: "02"
subsystem: coach-dashboard, api, email, landing
tags: [applications, coach-workflow, email, cta, approval, rejection]
dependency_graph:
  requires: [02-01]
  provides: [coach-approval-workflow, approval-email, rejection-email, applications-api]
  affects: [coach-dashboard, login-page, landing-page]
tech_stack:
  added: []
  patterns: [non-blocking-email, optimistic-ui, sonner-toast]
key_files:
  created:
    - src/app/api/admin/applications/route.ts
    - src/app/api/admin/applications/[id]/route.ts
  modified:
    - src/lib/email.ts
    - src/app/coach/page.tsx
    - src/app/login/page.tsx
    - src/app/page.tsx
decisions:
  - "Used fullName field (not name) from Profile model for email personalization"
  - "Non-blocking email sends — DB update completes before email attempt; error only logged"
  - "Optimistic UI on approve/reject — remove card from list immediately on success"
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_changed: 6
---

# Phase 02 Plan 02: Coach Approval/Rejection Workflow Summary

**One-liner:** Coach approval/rejection workflow with amber-accented dashboard card, non-blocking emails via Resend, and "Apply Now" CTAs replacing generic signup links.

## What Was Built

### Task 1: Applications API + Email Templates
- `GET /api/admin/applications` — returns all profiles with `subscriptionStatus: 'pending_approval'`, coach/admin auth required
- `PATCH /api/admin/applications/[id]` — accepts `{ action: 'approve' | 'reject' }`, updates status (`'none'` or `'rejected'`), sends corresponding email non-blocking
- `sendApprovalEmail` — branded "You've Been Accepted!" email with login CTA
- `sendRejectionEmail` — branded "Application Update" email with website CTA

### Task 2: Dashboard Card + CTA Updates
- Pending Applications card renders above the stats row (amber left-border accent)
- Each applicant shows: name, email, signup date, goal (mapped to display label), experience, commitment, age/gender, height/weight
- "Why now?" answer (applicationMotivation) is displayed as an amber-accented blockquote — the primary seriousness signal
- Approve (green) / Reject (red) buttons; on success the card is removed from list with a sonner toast
- Login page: "Don't have an account? Sign up" → "Want to work with me? Apply Now"
- Landing page hero: "Start Your Transformation" → "Apply Now" linking to /signup

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Profile.name reference to Profile.fullName**
- **Found during:** Task 1, TypeScript check
- **Issue:** Plan referenced `profile.name` but the Prisma schema uses `fullName` for the Profile model
- **Fix:** Changed both email send calls in `[id]/route.ts` to use `profile.fullName`
- **Files modified:** `src/app/api/admin/applications/[id]/route.ts`
- **Commit:** b6681b8

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | b6681b8 | feat(02-02): add applications API endpoints and approval/rejection emails |
| 2 | 8ccd3fb | feat(02-02): add pending applications card to dashboard and update CTAs |

## Self-Check: PASSED
