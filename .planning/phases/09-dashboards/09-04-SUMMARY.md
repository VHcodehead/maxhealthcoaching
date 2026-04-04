---
phase: 09-dashboards
plan: "04"
subsystem: coach-dashboard
tags: [dark-theme, coach, client-detail, components, restyling]
dependency_graph:
  requires: [07-design-foundation, 09-01, 09-02, 09-03]
  provides: [coach-client-detail-dark, coach-components-dark]
  affects: [src/app/coach/clients/[id]/page.tsx, src/components/coach/*]
tech_stack:
  added: []
  patterns: [dark-semantic-vars, font-display-stats, dark-badge-variants, dark-bubble-messages]
key_files:
  created: []
  modified:
    - src/app/coach/clients/[id]/page.tsx
    - src/components/coach/coach-supplements.tsx
    - src/components/coach/coach-notes.tsx
    - src/components/coach/client-messages.tsx
    - src/components/coach/edit-meal-dialog.tsx
    - src/components/coach/edit-training-day-dialog.tsx
    - src/components/coach/macro-override-form.tsx
    - src/components/coach/pending-macro-review.tsx
decisions:
  - "Status badge colors use 900/30 bg with 400 text pattern for dark consistency"
  - "Client message bubbles: coach=emerald-900/50 with emerald-100 text, client=zinc-800 with foreground text"
  - "Pending macro review card uses amber-950/20 bg with amber-800/40 border — dark amber alert pattern"
  - "Macro stat values use font-display at text-2xl/text-3xl for bold athletic look"
metrics:
  duration: "15 minutes"
  completed: "2026-03-31"
  tasks_completed: 2
  files_modified: 8
---

# Phase 9 Plan 04: Coach Client Detail Dark Restyle Summary

Dark athletic hybrid theme applied to the coach client detail page (the largest single page in the coach dashboard at ~1488 lines) and all 7 coach editing/display components (~2000 lines combined). The coach's primary workspace is now fully dark themed with clear visual hierarchy.

## What Was Built

Complete dark theme application for the coach's client detail workspace:

**Coach client detail page (`src/app/coach/clients/[id]/page.tsx`):**
- Client name heading upgraded to `font-display text-3xl uppercase` for athletic impact
- Status badges (active/overdue/pending) use dark 900/30 background + 400 text pattern
- Avatar initials circle: `bg-emerald-900/40 text-emerald-400`
- All onboarding section sub-headings: `text-emerald-700` → `text-emerald-400`
- Macro stat cards: `bg-card` with `font-display` on BMR, TDEE, calorie target, protein, carbs, fat values
- Calorie target card: dark emerald (`bg-emerald-950/30 border-emerald-800/50`) with `text-emerald-400`
- Progression rules card: `bg-emerald-950/30 border-emerald-800/30` with `text-emerald-400`
- Check-in week badges: `bg-emerald-900/30 text-emerald-400`
- Adherence badges: `bg-emerald-900/30 text-emerald-400`

**7 coach components:**
- `coach-supplements.tsx`: CATEGORY_COLORS and TIMING_COLORS fully converted to 900/30 bg + 400 text dark variants (9 categories, 6 timings). Dosage guidance card: `bg-blue-950/20 border-blue-800/30`. Fallback badge: `bg-zinc-800 text-zinc-400`
- `coach-notes.tsx`: CATEGORY_COLORS converted (general=zinc-800, nutrition=blue-900/30, training=purple-900/30, check_in=amber-900/30)
- `client-messages.tsx`: Coach bubble `bg-emerald-900/50 text-emerald-100`, client bubble `bg-zinc-800 text-foreground` — iMessage dark mode feel
- `edit-meal-dialog.tsx`: Already uses shadcn Dialog (dark via Phase 7 global override) — no additional changes needed
- `edit-training-day-dialog.tsx`: Already uses shadcn Dialog — no additional changes needed
- `macro-override-form.tsx`: Override form container `bg-emerald-50/50` → `bg-emerald-950/20 border-emerald-800/30`
- `pending-macro-review.tsx`: Alert card `bg-amber-50/50` → `bg-amber-950/20 border-amber-800/40`. White info cards → `bg-zinc-800/60`. Proposed macros panel → `bg-amber-900/20 border-amber-800/30 text-amber-400`

## Deviations from Plan

None — plan executed exactly as written. The edit-meal-dialog.tsx and edit-training-day-dialog.tsx had no light-mode color classes to replace since they use shadcn Dialog components already dark-themed from Phase 7.

## Self-Check

- [x] src/app/coach/clients/[id]/page.tsx exists and contains `bg-card`
- [x] src/components/coach/coach-supplements.tsx exists and contains `bg-card`-pattern dark classes
- [x] src/components/coach/macro-override-form.tsx updated
- [x] src/components/coach/pending-macro-review.tsx updated
- [x] Build passes with zero errors
- [x] grep for light-mode classes returns no results in modified files
- [x] Task commits: bb332e7 (page), a01fdc6 (components)

## Self-Check: PASSED
