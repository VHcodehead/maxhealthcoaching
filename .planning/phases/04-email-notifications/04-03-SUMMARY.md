---
phase: 04-email-notifications
plan: 03
subsystem: ui
tags: [react, nextjs, messaging, chat-ui, unread-badges, client-components]

# Dependency graph
requires:
  - phase: 04-email-notifications/04-02
    provides: Message model in Prisma and /api/messages REST endpoint (GET/POST/PATCH)
provides:
  - ClientMessages expandable chat-bubble component for coach client detail page
  - /dashboard/messages page for clients to exchange messages with coach
  - /api/coach GET endpoint to retrieve coach userId and name
  - Unread message badge on client sidebar Messages nav item
  - Per-client unread message badges on coach clients list
affects: [coach-dashboard, client-dashboard, messaging, notifications]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Chat bubble layout: sender right-aligned emerald, receiver left-aligned gray
    - Expandable section component matching CoachNotes pattern (Card + ChevronDown/Up toggle)
    - Non-blocking mark-as-read PATCH call on thread open (.catch() swallowed)
    - Unread badge as emerald pill (h-5 min-w-5 rounded-full) consistent across sidebar and list

key-files:
  created:
    - src/components/coach/client-messages.tsx
    - src/app/dashboard/messages/page.tsx
    - src/app/api/coach/route.ts
  modified:
    - src/app/coach/clients/[id]/page.tsx
    - src/app/dashboard/layout.tsx
    - src/app/coach/clients/page.tsx

key-decisions:
  - "ClientMessages uses session.user.id to distinguish coach vs client bubbles — no extra profile fetch needed"
  - "Ctrl+Enter keyboard shortcut for sending messages added as UX improvement"
  - "Messages nav item placed between Supplements and Progress in sidebar order"
  - "Unread count badge replaces active indicator dot on Messages nav when count > 0"

patterns-established:
  - "Unread badge pattern: emerald pill h-5 min-w-5, 99+ cap, ml-auto in flex row"
  - "Chat bubble: max-w-[75%] rounded-2xl, sender=emerald-600 text-white rounded-tr-sm, receiver=gray-100 rounded-tl-sm"

requirements-completed: [MSG-01, MSG-02]

# Metrics
duration: 18min
completed: 2026-03-31
---

# Phase 04 Plan 03: Message Thread UI and Unread Badges Summary

**Chat-bubble messaging UI for coach (expandable on client detail page) and client (/dashboard/messages), plus unread count badges on both dashboards**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-31T22:27:16Z
- **Completed:** 2026-03-31T22:45:00Z
- **Tasks:** 2 (Task 3 is checkpoint:human-verify, paused)
- **Files modified:** 6

## Accomplishments

- Coach sees expandable Messages section on client detail page with chat-bubble style thread
- Client sees /dashboard/messages page with full thread and compose area
- /api/coach GET endpoint returns coach userId and name for client-side use
- Client dashboard sidebar shows Messages nav item with live unread count badge
- Coach clients list shows per-client unread message pill badges

## Task Commits

Each task was committed atomically:

1. **Task 1: Build message thread components and pages** - `18b0ade` (feat)
2. **Task 2: Add unread message badges to coach and client dashboards** - `d595c7b` (feat)
3. **Task 3: Verify messaging end-to-end** - Checkpoint (awaiting human verification)

## Files Created/Modified

- `src/components/coach/client-messages.tsx` - Expandable chat component for coach client detail page
- `src/app/dashboard/messages/page.tsx` - Client-facing messages page at /dashboard/messages
- `src/app/api/coach/route.ts` - Lightweight coach lookup endpoint (userId, fullName)
- `src/app/coach/clients/[id]/page.tsx` - Added ClientMessages after CoachSupplements section
- `src/app/dashboard/layout.tsx` - Added Messages nav item, unread count fetch, badge rendering
- `src/app/coach/clients/page.tsx` - Added per-client unread badge fetch and pill display

## Decisions Made

- Used `session.user.id` in ClientMessages to determine coach vs client message alignment — avoids an extra API call
- Ctrl+Enter keyboard shortcut added for faster message sending (improvement over plan)
- Unread badge replaces active indicator dot when count > 0 to avoid layout conflict
- Messages nav item placed between Supplements and Progress for logical flow

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript passed on first check for both tasks.

## User Setup Required

None - no external service configuration required for this plan.

## Next Phase Readiness

- Complete messaging system is ready for end-to-end verification (Task 3 checkpoint)
- After verification, Phase 04 (Email Notifications) will be complete
- Requirements MSG-01 and MSG-02 fulfilled pending human verification

---
*Phase: 04-email-notifications*
*Completed: 2026-03-31*
