---
phase: 09-dashboards
plan: "03"
subsystem: coach-dashboard
tags: [dark-theme, coach, ui, restyling]
dependency_graph:
  requires: [07-design-foundation, 08-public-pages]
  provides: [dark-coach-overview, dark-client-list, dark-settings, dark-content]
  affects: [coach-dashboard-layout]
tech_stack:
  added: []
  patterns: [semantic-css-variables, font-display, colored-left-borders, dark-badge-patterns]
key_files:
  created: []
  modified:
    - src/app/coach/page.tsx
    - src/app/coach/clients/page.tsx
    - src/app/coach/settings/page.tsx
    - src/app/coach/content/page.tsx
decisions:
  - "Status badges use /20 background opacity + /400 text color pattern for dark surfaces (emerald-400, amber-400, zinc-400)"
  - "Coach stat cards use 4-color left-border system: emerald (total), blue (active), violet (overdue), amber (pending)"
  - "Quick action alert buttons use amber-500/10 bg + amber-500/40 border — consistent with dark amber treatment"
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_modified: 4
---

# Phase 9 Plan 03: Coach Dashboard Dark Restyle Summary

Dark athletic hybrid theme applied to all 4 coach-facing dashboard pages — stat cards with colored left borders, font-display titles, and bright status badges on dark backgrounds throughout.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Dark restyle coach overview and client list pages | 0478eae | page.tsx, clients/page.tsx |
| 2 | Dark restyle coach settings and content pages | e9de2e5 | settings/page.tsx, content/page.tsx |

## What Was Built

**Coach Overview (page.tsx):**
- Page title upgraded to `font-display text-3xl`
- 4 stat cards with colored left borders: emerald (total clients), blue (active), violet (overdue), amber (pending macro reviews)
- Stat values use `font-display text-3xl` for Bebas Neue impact
- Pending applications card: `bg-card border-l-4 border-l-amber-500` with `bg-zinc-800` blockquotes for "Why now?" field
- Recent activity feed: `divide-y divide-white/10` separators, `bg-primary/20` avatar circles
- Quick action buttons: `hover:border-primary` emerald hover, amber alert variants for pending/overdue items
- Reject button updated to dark-friendly `border-red-500/50 text-red-400` from light-mode `hover:bg-red-50`

**Client List (clients/page.tsx):**
- Page title upgraded to `font-display text-3xl`
- Status badges: `bg-emerald-500/20 text-emerald-400` (active), `bg-amber-500/20 text-amber-400` (overdue), `bg-zinc-700/50 text-zinc-400` (pending)
- Unread message pills: `bg-primary text-primary-foreground` emerald-500 with white text
- Active filter tab: `bg-primary text-primary-foreground` instead of `bg-emerald-600`
- Table row/separator borders: `border-white/10`
- Suspense spinner: `border-border border-t-primary` dark pattern

**Settings (settings/page.tsx):**
- Page title upgraded to `font-display text-3xl`
- All cards: `bg-card`
- Success banner: `bg-primary/10 border-primary/30 text-primary` replacing light `bg-emerald-50`
- Save button: `bg-primary hover:bg-primary/90` replacing `bg-emerald-600`
- Textarea: `border-border bg-background text-foreground` explicit dark styling
- Checkboxes: `accent-primary border-border`
- Separator: `border-white/10`

**Content (content/page.tsx):**
- Page title upgraded to `font-display text-3xl`
- Cards: `bg-card` on both blog and transformations panels
- Action buttons: `bg-primary hover:bg-primary/90 text-primary-foreground`
- Published badge: `bg-primary/20 text-primary border-primary/30`
- Featured badge: `bg-amber-500/20 text-amber-400 border-amber-500/30`
- Table headers: `bg-muted/50` dark header rows
- Table rows/separators: `border-white/10`
- Textareas in dialogs: `border-border bg-background text-foreground`
- Checkboxes: `accent-primary border-border`

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- src/app/coach/page.tsx: FOUND
- src/app/coach/clients/page.tsx: FOUND
- src/app/coach/settings/page.tsx: FOUND
- src/app/coach/content/page.tsx: FOUND
- Commit 0478eae: FOUND
- Commit e9de2e5: FOUND
- Zero light-mode artifacts in all 4 files: VERIFIED
- Build: PASSED
