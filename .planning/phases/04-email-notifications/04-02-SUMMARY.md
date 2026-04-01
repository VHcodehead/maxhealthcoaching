---
phase: 04-email-notifications
plan: "02"
subsystem: messaging
tags: [prisma, api, messages, coach-client]
dependency_graph:
  requires: []
  provides: [Message model, /api/messages endpoint]
  affects: [04-03-PLAN.md]
tech_stack:
  added: []
  patterns: [prisma-relations, next-api-route, auth-guard]
key_files:
  created:
    - prisma/schema.prisma (Message model + User relations)
    - src/app/api/messages/route.ts
    - src/types/database.ts (Message interface)
  modified:
    - generated/prisma/ (regenerated client)
decisions:
  - Message model uses sender/receiver UUID relations with Cascade delete, consistent with CoachNote pattern
  - Unread count endpoint serves two modes (total-only for clients, per-user breakdown for coaches) using profile.role check
  - Content validation: non-empty, max 2000 chars, receiver existence verified before create
metrics:
  duration: "~15 minutes"
  completed_date: "2026-04-01"
  tasks_completed: 2
  files_changed: 4
---

# Phase 4 Plan 02: Message Model and API Summary

**One-liner:** Prisma Message model with sender/receiver relations and /api/messages GET/POST/PATCH endpoint for coach-client threading.

## What Was Built

### Task 1: Message model in Prisma schema

Added `model Message` to `prisma/schema.prisma` with:
- `senderId` / `receiverId` as UUID foreign keys mapped to `sender_id` / `receiver_id`
- `content` String field
- `read` Boolean defaulting to false
- `createdAt` DateTime with `@default(now())`
- `sender` and `receiver` User relations using named relation strings `"sentMessages"` / `"receivedMessages"` with Cascade delete
- `@@map("messages")` for snake_case table name

Added `sentMessages Message[]` and `receivedMessages Message[]` to the User model.

Added `Message` interface to `src/types/database.ts` with `sender_id`, `receiver_id`, `content`, `read`, `created_at` fields.

Ran `npx prisma generate` — database was unreachable (no live DB in dev), so `db push` was skipped per plan instructions. Prisma client regenerated successfully with Message type available.

### Task 2: /api/messages endpoint

Created `src/app/api/messages/route.ts` with three handlers:

**GET** — dual-mode:
- `?user_id=xxx`: loads full thread between authenticated user and given user (both directions, ordered `createdAt asc`)
- `?count_only=true`: returns `unreadTotal`; if caller's profile role is `'coach'`, also returns `unreadByUser` as a `Record<string, number>` grouped by senderId

**POST** — creates a message:
- Validates content is non-empty string, max 2000 chars
- Validates receiverId exists in users table
- Creates message with `senderId = session.user.id`
- Returns 201 with created message

**PATCH** — marks messages as read:
- Body: `{ senderId: string }`
- Updates all messages where `senderId = body.senderId AND receiverId = session.user.id AND read = false`
- Returns `{ updated: count }`

All three handlers require authentication via `auth()` from `@/lib/auth`.

## Verification

```
npx prisma validate           -> PASSED
npx tsc --noEmit              -> PASSED (no output = no errors)
grep "model Message" schema   -> model Message { (found)
grep -c "export async function" route.ts -> 3 (GET, POST, PATCH)
```

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

All created files confirmed on disk. Both task commits (3e62695, 24d0112) confirmed in git log.
