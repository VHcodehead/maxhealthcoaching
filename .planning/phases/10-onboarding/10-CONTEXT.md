# Phase 10: Onboarding - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Restyle the onboarding multi-step form and the plan generating/loading page to the dark athletic hybrid theme. Last phase of v1.1 redesign. Preserve all form logic, step navigation, API calls, and animations.

</domain>

<decisions>
## Implementation Decisions

### ONBOARD-01: Onboarding Flow
- Background: zinc-950 (bg-background)
- Step progress bar: zinc-800 track, emerald-500 fill
- Step counter and title: Bebas Neue font-display, white text
- SelectableCard (goal selection, etc.): zinc-900 background, white/10 border. Selected: emerald-500 ring, emerald-950/30 background
- Form inputs: zinc-900 bg, white/10 border, emerald focus ring (already set from Phase 7)
- Labels: zinc-400 (text-muted-foreground)
- Tag input badges: emerald-900/30 bg, emerald-400 text
- Navigation buttons: emerald-500 primary "Next", zinc-800 "Back"
- Goal icons: keep existing color coding but on dark surfaces
- Unit toggle: styled dark to match
- Replace all bg-white, bg-gray-50, text-zinc-900 with dark equivalents

### ONBOARD-02: Generating/Loading Page
- Background: zinc-950
- Loading animation: premium feel — pulsing emerald dumbbell icon or animated emerald ring
- "BUILDING YOUR PLAN" in Bebas Neue, large, white
- Subtext: "This takes about 30 seconds..." in zinc-400
- Progress steps (if shown): emerald checkmarks as each plan component completes
- No white backgrounds, no light spinners
- Replace the basic Loader2 spinner with something more premium

### Claude's Discretion
- Exact progress bar step indicators vs smooth bar
- Loading animation details (CSS keyframes vs framer-motion)
- Spacing adjustments for dark layout
- Whether to add a subtle background pattern to onboarding

</decisions>

<code_context>
## Existing Code Insights

### Files to Modify
- `src/app/onboarding/page.tsx` — Multi-step form (~large file, 9 steps)
- `src/app/generating/page.tsx` — Plan generation loading page
- `src/app/checkin/page.tsx` — Check-in form (bonus — also needs dark restyle)
- `src/app/success/page.tsx` — Post-checkout success page (bonus)

### Reusable from Phase 7
- All semantic CSS vars (bg-background, bg-card, text-foreground, etc.)
- font-display class for Bebas Neue
- Dark input, button, card, badge components
- Animation utilities

### Patterns
- Onboarding uses framer-motion slideVariants for step transitions
- SelectableCard component with ring-2 ring-emerald-500 on selection
- Progress component from shadcn/ui

</code_context>

<specifics>
## Specific Ideas

- The generating page is a moment of anticipation — make it feel premium, not like a loading screen
- Onboarding should feel like a journey, not a chore — dark background with emerald accents guides the eye

</specifics>

<deferred>
## Deferred Ideas

None — final phase.

</deferred>

---

*Phase: 10-onboarding*
*Context gathered: 2026-04-04*
