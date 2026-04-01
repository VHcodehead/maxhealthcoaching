# Phase 4: Email Notifications + Messaging - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Four transactional email notifications (plan ready, check-in reminder, coach check-in alert, macro adjustment approved) plus a simple per-client message thread for coach-client communication. Does NOT include real-time chat, push notifications, or in-app notification system.

</domain>

<decisions>
## Implementation Decisions

### NOTIF-01: Plan Generated & Ready
- Trigger: After meal plan + training plan generation completes (in `/generating` flow or `/api/meal-plan` + `/api/training-plan`)
- Subject: "Your personalized plan is ready!"
- Body: "Hey [name], your custom meal plan and training program are ready to go." + green "View My Plan" button → `/dashboard`
- Tone: Exciting, motivating

### NOTIF-02: Weekly Check-in Reminder
- Trigger: API route `/api/cron/checkin-reminders` called by external cron (Railway cron or cron-job.org)
- Protected by `CRON_SECRET` env var in request header
- Timing: Saturday morning (check-in window opens Saturday 6pm UTC)
- Sends to all active clients who haven't checked in this week
- Subject: "Time for your weekly check-in"
- Body: "Hey [name], it's check-in time!" + "Submit Check-in" button → `/checkin`
- Skip clients who already submitted this week

### NOTIF-03: Coach Notified on Client Check-in
- Trigger: In check-in POST handler (`/api/checkin/route.ts`), after successful save
- Subject: "[Client Name] submitted their week [N] check-in"
- Body: Quick summary (weight, adherence, notes snippet) + "Review Check-in" button → `/coach/clients/[id]`
- Sent to coach email

### NOTIF-04: Macro Adjustment Approved
- Trigger: In macro adjustment approval handler (`/api/admin/macro-adjustments/[id]/route.ts`), when coach approves
- Subject: "Your macros have been updated"
- Body: "Hey [name], I've adjusted your macros. [old → new calories]." + "View Updated Macros" button → `/dashboard`

### Email Template Pattern
- All 4 emails use the existing `buildBrandedHtml` from `src/lib/email.ts`
- MaxHealth green (#059669), "Hey [name]," greeting, branded footer
- Add new send functions: `sendPlanReadyEmail`, `sendCheckinReminderEmail`, `sendCheckinNotificationEmail`, `sendMacroApprovedEmail`

### Simple Message Thread (MSG)
- New `Message` Prisma model: id, senderId, receiverId, content, read, createdAt
- Per-client conversation thread — coach and client see the same messages
- Coach sees message thread on client detail page (expandable section, like supplements/notes)
- Client sees message thread on a new `/dashboard/messages` page
- New messages appear on page refresh (no WebSocket, no polling)
- Unread message count badge on coach dashboard (per client) and client dashboard nav
- Coach can send messages from client detail page
- Client can send messages from their messages page
- API: `/api/messages?user_id=xxx` GET (load thread), POST (send message), PATCH (mark read)

### Claude's Discretion
- Exact cron endpoint security implementation (header check vs query param)
- Message thread UI layout details
- How to determine "this week" for check-in reminder logic (reuse existing `isClientOverdue`)
- Email send failure handling (non-blocking, log error, don't crash the request)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/email.ts`: Resend client with `buildBrandedHtml`, lazy init — add 4 new send functions
- `src/lib/checkin-schedule.ts`: Has `isClientOverdue` — reuse for determining who needs a reminder
- `src/app/api/checkin/route.ts`: Check-in POST handler — add NOTIF-03 trigger here
- `src/app/api/admin/macro-adjustments/[id]/route.ts`: Approval handler — add NOTIF-04 trigger here
- `src/app/generating/page.tsx`: Plan generation flow — add NOTIF-01 trigger after completion
- `src/components/coach/coach-notes.tsx`: Existing expandable notes section — message thread follows same pattern

### Established Patterns
- Non-blocking email sends (wrap in try/catch, don't await in request path)
- Coach dashboard loads data via `Promise.all` from multiple endpoints
- Client dashboard has sidebar nav with sections (meals, training, supplements, etc.)
- Expandable card sections on coach client detail page

### Integration Points
- `prisma/schema.prisma`: Add `Message` model with sender/receiver relations
- `src/app/coach/clients/[id]/page.tsx`: Add message thread section
- `src/app/dashboard/page.tsx`: Add unread message badge
- New page: `src/app/dashboard/messages/page.tsx`

</code_context>

<specifics>
## Specific Ideas

- Check-in reminder should feel like a friendly nudge, not a nag
- Coach check-in notification should include enough data to decide if they need to look at it now (weight change, adherence)
- Message thread should be simple — no typing indicators, no read receipts, just messages with timestamps
- Unread badge is important — coach needs to know when a client messages them

</specifics>

<deferred>
## Deferred Ideas

- Real-time chat (WebSockets, typing indicators) — v2 if demand warrants
- Push notifications for mobile browsers — v2
- In-app notification bell/inbox — v2

</deferred>

---

*Phase: 04-email-notifications*
*Context gathered: 2026-03-31*
