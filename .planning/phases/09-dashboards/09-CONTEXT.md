# Phase 9: Dashboards - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Restyle all client and coach dashboard pages to the dark athletic hybrid theme. 8 requirements covering: client sidebar/layout, overview, meals, training, supplements/messages/progress, coach overview, coach client list, and coach client detail. Same approach as Phase 8 — replace all hardcoded light colors with dark equivalents using Phase 7 semantic vars. Preserve all functionality.

</domain>

<decisions>
## Implementation Decisions

### DASH-01: Client Dashboard Layout/Sidebar
- Sidebar: zinc-900 background (uses `bg-card` semantic var), white/10 border-right
- Active nav item: emerald-500 background with white text (already set via `--sidebar-primary`)
- Inactive nav items: zinc-400 text, hover zinc-300
- User section at bottom: zinc-800 background
- Mobile sheet: zinc-900 background
- Header bar (mobile): zinc-950 background with white/10 border-bottom
- Logo: emerald-600 icon background stays (already dark-friendly)

### DASH-02: Client Overview
- Stat cards: zinc-900 background, colored left border (emerald, blue, violet) — keep existing color-coding
- Stat values: white text, Bebas Neue font-display for large numbers
- Macro breakdown: zinc-900 card, progress bars with emerald/blue/amber/rose fills on zinc-800 tracks
- Meal/training previews: zinc-900 cards
- "Download Plan" card: zinc-900 with emerald dashed border
- Email verification banner: dark amber (amber-900/20 bg, amber-400 text) instead of light amber

### DASH-03: Meal Plan Page
- Day tabs: zinc-800 inactive, emerald-500 active with white text
- Meal cards: zinc-900 background, white/10 borders
- Macro badges: filled dark variants (emerald/10 bg for calories, blue/10 for protein, etc.)
- Day totals card: emerald-900/20 background with emerald-400 text (instead of emerald-50)
- Grocery list: zinc-900 accordion cards
- Swap dialog: zinc-900 background

### DASH-04: Training Page
- Week tabs: same as meal day tabs (zinc-800/emerald-500)
- Training day cards: zinc-900 background with emerald gradient header (`from-emerald-950/50 to-transparent`)
- Exercise table: zinc-900 header, alternating zinc-900/zinc-950 rows, white/10 borders
- Warmup section: orange-900/20 bg with orange-400 text (dark variant of existing orange theme)
- Cardio section: blue-900/20 bg with blue-400 text
- Exercise number circles: emerald-500 bg with white text

### DASH-05: Supplements, Messages, Progress
- Supplements page: zinc-900 timing cards, existing category badge colors brightened for dark (amber-400, slate-400, red-400, etc.)
- Messages page: zinc-900 message thread, coach bubbles emerald-900/50, client bubbles zinc-800
- Progress page: zinc-900 cards for check-in history, photo comparison on dark background

### COACH-01: Coach Overview
- Stat cards: zinc-900 with colored left borders (same pattern as client)
- Pending applications card: zinc-900 with amber left border, "Why now?" blockquote in zinc-800
- Recent activity feed: zinc-900 items with white/10 separators
- Quick actions: zinc-900 cards with emerald hover

### COACH-02: Client List
- Client cards: zinc-900 background
- Status badges: bright on dark — emerald-400 "active", amber-400 "overdue", zinc-400 "pending"
- Unread message pills: emerald-500 bg with white text (already dark-friendly)

### COACH-03: Client Detail
- Expandable sections: zinc-900 headers, zinc-950 content area
- Edit dialogs: zinc-900 background (already set in Phase 7 dialog override)
- Coach notes section: zinc-900 cards
- Message thread: same as client view (DASH-05)
- Supplement section: zinc-900 cards (already dark from Phase 7 component overrides)

### Global Rules
- Replace ALL `bg-white`, `bg-gray-50`, `bg-zinc-50` with `bg-background` or `bg-card`
- Replace ALL `text-zinc-900`, `text-gray-900` with `text-foreground`
- Replace ALL `text-zinc-500`, `text-gray-500` with `text-muted-foreground`
- Replace ALL `border-zinc-200`, `border-gray-200` with `border-border`
- Apply `font-display` class to page titles and large stat values
- Keep all framer-motion animations — just restyle
- Keep all functionality — just visual layer

### Claude's Discretion
- Exact brightness values for category badge colors on dark backgrounds
- Whether to add subtle zinc-800 hover states on list items
- Spacing adjustments where dark layout needs more breathing room
- Any component-specific tweaks beyond the global rules

</decisions>

<code_context>
## Existing Code Insights

### Files to Modify
**Client Dashboard:**
- `src/app/dashboard/layout.tsx` — sidebar + mobile nav (DASH-01)
- `src/app/dashboard/page.tsx` — overview (DASH-02)
- `src/app/dashboard/meals/page.tsx` — meal plan (DASH-03)
- `src/app/dashboard/training/page.tsx` — training (DASH-04)
- `src/app/dashboard/supplements/page.tsx` — supplements (DASH-05)
- `src/app/dashboard/messages/page.tsx` — messages (DASH-05)
- `src/app/dashboard/progress/page.tsx` — progress (DASH-05)
- `src/app/dashboard/referral/page.tsx` — referral (DASH-05 bonus)

**Coach Dashboard:**
- `src/app/coach/page.tsx` — coach overview (COACH-01)
- `src/app/coach/clients/page.tsx` — client list (COACH-02)
- `src/app/coach/clients/[id]/page.tsx` — client detail (COACH-03)
- `src/app/coach/settings/page.tsx` — coach settings (bonus)
- `src/app/coach/content/page.tsx` — content management (bonus)

**Coach Components:**
- `src/components/coach/coach-supplements.tsx`
- `src/components/coach/coach-notes.tsx`
- `src/components/coach/client-messages.tsx`
- `src/components/coach/edit-meal-dialog.tsx`
- `src/components/coach/edit-training-day-dialog.tsx`
- `src/components/coach/macro-override-form.tsx`
- `src/components/coach/pending-macro-review.tsx`

### Reusable from Phase 7
- Semantic CSS vars: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary`
- `font-display` class for Bebas Neue
- Animation utilities: `.transition-micro`, `.hover-card-glow`
- All shadcn components already dark-themed

</code_context>

<specifics>
## Specific Ideas

- This is the largest phase but the most mechanical — same pattern applied everywhere
- Coach client detail page is huge (~1300 lines) — may need to be its own plan
- Message bubbles should feel like iMessage dark mode — coach=emerald tint, client=zinc
- Stat card values in Bebas Neue will give the dashboard instant personality

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 09-dashboards*
*Context gathered: 2026-04-04*
