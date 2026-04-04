---
phase: "07-design-foundation"
plan: "02"
subsystem: "ui-components"
tags: ["dark-mode", "shadcn", "design-system", "animation", "tailwind"]
dependency_graph:
  requires: ["07-01"]
  provides: ["dark-surface-components", "animation-utilities"]
  affects: ["all-ui-components", "globals.css"]
tech_stack:
  added: []
  patterns: ["dark-only-css-vars", "css-utility-animations", "emerald-accent-system"]
key_files:
  created: []
  modified:
    - src/components/ui/button.tsx
    - src/components/ui/badge.tsx
    - src/components/ui/input.tsx
    - src/components/ui/tabs.tsx
    - src/components/ui/dialog.tsx
    - src/components/ui/table.tsx
    - src/components/ui/dropdown-menu.tsx
    - src/app/globals.css
decisions:
  - "Tabs active state uses primary (emerald) colors instead of background variant — clearer visual contrast on dark surfaces"
  - "Table header gets bg-muted background — distinguishes header from body rows on zinc-900"
  - "Dialog overlay upgraded to bg-black/60 backdrop-blur-sm — adds depth and separation from content"
  - "Input uses bg-input (oklch 5% white) directly — removes conditional dark: override"
metrics:
  duration: "~3 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 2
  tasks_total: 3
  files_modified: 8
---

# Phase 7 Plan 02: Component Dark Surface Overrides Summary

All shadcn UI components styled for dark-only surfaces with emerald-500 accent system. Animation utility classes added to globals.css for consistent motion across the app.

## What Was Built

### Task 1: Override shadcn component styles for dark surfaces

Removed ALL `dark:` prefixed Tailwind classes from every shadcn component file. Since dark is the only mode, these classes were dead code that could conflict with base styles.

**button.tsx:**
- `destructive` variant: removed `dark:bg-destructive/60` and `dark:focus-visible:ring-destructive/40`
- `outline` variant: changed to emerald-themed `border-primary/50 bg-transparent text-primary hover:bg-primary/10` — replaces generic `dark:bg-input/30` approach
- `ghost` variant: removed `dark:hover:bg-accent/50`
- Base: removed `dark:aria-invalid:ring-destructive/40`

**input.tsx:**
- Replaced `dark:bg-input/30 bg-transparent` with `bg-input` (CSS var is already oklch 5% white)
- Removed `dark:aria-invalid:ring-destructive/40`

**badge.tsx:**
- `destructive` variant: removed `dark:bg-destructive/60` and `dark:focus-visible:ring-destructive/40`
- Base: removed `dark:aria-invalid:ring-destructive/40`

**tabs.tsx:**
- Removed all `dark:` prefixed classes (6 total)
- Active state changed from `data-[state=active]:bg-background` to `data-[state=active]:bg-primary data-[state=active]:text-primary-foreground` — emerald active tab

**dialog.tsx:**
- Overlay: `bg-black/50` → `bg-black/60 backdrop-blur-sm` for depth
- Close button: `ring-offset-background` → `ring-offset-card`

**table.tsx:**
- TableHeader: added `bg-muted` to distinguish header rows

**dropdown-menu.tsx:**
- DropdownMenuItem: removed `dark:data-[variant=destructive]:focus:bg-destructive/20`

**card.tsx, progress.tsx:** No changes needed — already use semantic vars that auto-resolve to dark palette.

### Task 2: Add animation utility classes to globals.css

Added `@layer utilities` block and `@keyframes` definitions:

- `.transition-micro` — 200ms ease for buttons, links, interactive elements
- `.transition-page` — 400ms ease for page-level transitions
- `.hover-card-glow` — scale(1.01) + emerald border glow on card hover
- `.hover-brightness` — filter brightness(1.1) on hover
- `.animate-fade-in-up` — fade + translateY(8px→0) entrance for page content
- `.animate-count-up` — fade + translateY(4px→0) for stat numbers (pairs with Framer Motion)

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

- [x] Zero `dark:` classes in `src/components/ui/` (confirmed via grep)
- [x] Build passes without errors
- [x] Animation utilities present in globals.css
- [x] All commits exist

## Self-Check: PASSED
