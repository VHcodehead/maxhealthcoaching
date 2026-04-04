---
phase: 09-dashboards
plan: "01"
subsystem: client-dashboard
tags: [dark-theme, dashboard, layout, meals, training, typography]
dependency_graph:
  requires: [phase-07-design-foundation, phase-08-public-pages]
  provides: [dark-client-sidebar, dark-client-overview, dark-meals-page, dark-training-page]
  affects: [client-ux, brand-consistency]
tech_stack:
  added: []
  patterns: [semantic-css-vars, font-display-bebas, emerald-accent-system, dark-surface-pattern]
key_files:
  created: []
  modified:
    - src/app/dashboard/layout.tsx
    - src/app/dashboard/page.tsx
    - src/app/dashboard/meals/page.tsx
    - src/app/dashboard/training/page.tsx
decisions:
  - "Active nav state uses bg-primary text-primary-foreground (not bg-emerald-50 text-emerald-700)"
  - "Sidebar user section uses explicit bg-zinc-800 rather than bg-card for depth separation"
  - "Day totals macro values use font-display for impact consistency with overview stat cards"
  - "bg-white/20 on tab count badges is intentional (opacity overlay on dark active tab, not light-mode)"
metrics:
  duration_seconds: 325
  completed_date: "2026-04-04"
  tasks_completed: 2
  files_modified: 4
---

# Phase 9 Plan 01: Client Dashboard Dark Restyle Summary

Dark athletic hybrid theme applied to all 4 core client dashboard pages using Phase 7 semantic CSS variables — zinc-900 surfaces, emerald-500 accents, Bebas Neue display typography.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Dark restyle client sidebar layout and overview page | 4a06bd1 | layout.tsx, page.tsx |
| 2 | Dark restyle client meals and training pages | 6da419c | meals/page.tsx, training/page.tsx |

## What Was Built

### layout.tsx (DASH-01)
- Sidebar: `bg-card` (zinc-900) with `border-white/10` right border
- Active nav item: `bg-primary text-primary-foreground` (emerald-500 + white)
- Inactive nav: `text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300`
- User section footer: explicit `bg-zinc-800` for depth separation
- Mobile header: `bg-background` with `border-white/10`
- Sheet sidebar: `bg-card border-white/10`
- Logo text updated to `text-emerald-500` (brighter for dark bg)
- Avatar fallback: `bg-emerald-600 text-white` (was `bg-emerald-100 text-emerald-700`)

### page.tsx (DASH-02)
- Welcome heading: `font-display text-3xl lg:text-4xl`
- Stat values: `font-display text-3xl` (Bebas Neue — bold visual impact)
- Stat icon containers: `bg-zinc-800` (was colored-100 light variants)
- Email verification banner: `bg-amber-900/20 border-amber-800/40 text-amber-400`
- Macro progress tracks: `bg-zinc-800` (was `bg-gray-100`)
- Download card: `border-dashed border-primary bg-card` with `bg-emerald-500/10` icon bg
- All card icon backgrounds use `bg-color-500/10 text-color-400` dark pattern
- `text-emerald-600` totals updated to `text-emerald-400`

### meals/page.tsx (DASH-03)
- Page title: `font-display text-3xl lg:text-4xl`
- Day tab list: `bg-zinc-800` inactive, active `bg-primary text-primary-foreground`
- Meal cards: `bg-card border-white/10`
- Macro badges: filled dark variants — emerald/10 bg + emerald-400 text for calories, blue for protein, amber for carbs, rose for fat
- Day totals card: `bg-emerald-900/20 border-emerald-500/20` with `text-emerald-400`, values use `font-display`
- Instruction step circles: `bg-emerald-500/10 text-emerald-400` (was `bg-emerald-100 text-emerald-700`)
- Grocery list: `bg-card border-white/10` accordion, `text-emerald-400` category titles
- Swap dialog: `bg-card border-white/10` with dark badge styling

### training/page.tsx (DASH-04)
- Page title: `font-display text-3xl lg:text-4xl`
- Week tab list: `bg-zinc-800` inactive, active `bg-primary text-primary-foreground`
- Day card header: `bg-gradient-to-r from-emerald-950/50 to-transparent`
- Day icon circle: `bg-primary text-primary-foreground` (was `bg-emerald-600`)
- Exercise count badge: `bg-emerald-500/10 text-emerald-400`
- Warmup block: `bg-orange-900/20 border-orange-500/20` with `text-orange-400`
- Cardio block: `bg-blue-900/20 border-blue-500/20` with `text-blue-400`
- Exercise number circles: `bg-primary text-primary-foreground`
- Table header: `bg-muted text-foreground`, rows: `odd:bg-card even:bg-zinc-950 hover:bg-zinc-800`
- Table borders: `border-white/10` throughout
- Program overview: `bg-emerald-900/20 border-emerald-500/20 text-emerald-400`
- Progression rules: `bg-violet-900/20 border-violet-500/20 text-violet-400`
- Empty state: `bg-emerald-500/10` icon container (was `bg-emerald-50`)

## Verification

Build passes with zero errors. All light-mode artifacts removed from target files:
- No `bg-white`, `bg-gray-50`, `bg-zinc-50`
- No `text-zinc-900`, `text-gray-900`
- No `border-zinc-200`, `border-gray-200`

Note: `bg-white/20` in meals/page.tsx line 528 is intentional — it's an opacity overlay on the active tab count badge (transparent white on dark emerald background), not a light-mode color.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

Files exist:
- FOUND: src/app/dashboard/layout.tsx
- FOUND: src/app/dashboard/page.tsx
- FOUND: src/app/dashboard/meals/page.tsx
- FOUND: src/app/dashboard/training/page.tsx

Commits exist:
- FOUND: 4a06bd1 (Task 1)
- FOUND: 6da419c (Task 2)
