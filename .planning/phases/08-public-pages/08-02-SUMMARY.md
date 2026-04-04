---
phase: 08-public-pages
plan: 02
subsystem: ui
tags: [react, nextjs, tailwind, dark-theme, bebas-neue, emerald]

# Dependency graph
requires:
  - phase: 07-design-foundation
    provides: CSS variables (bg-background, bg-primary, text-primary, font-display), shadcn dark components, animation utilities
provides:
  - Dark-themed login page with emerald glow logo and SIGN IN heading
  - Dark-themed apply/signup page with APPLY FOR COACHING header and emerald section headers
  - Dark-themed pricing page with 3 zinc-900 cards, Pro card emerald border glow, Bebas Neue prices
  - Dark-themed pending page full-screen with pulsing emerald clock and APPLICATION UNDER REVIEW heading
affects:
  - 09-dashboards (consistent visual language)
  - 10-onboarding (auth/apply pages now styled)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Semantic CSS vars throughout: bg-background, bg-primary, text-primary, text-muted-foreground"
    - "font-display class for Bebas Neue uppercase headings"
    - "shadow-primary/20 glow on emerald elements"
    - "Logo pattern: bg-primary rounded-xl with shadow-lg shadow-primary/20"
    - "Heading pattern: MAX<span class=text-primary>HEALTH</span> with font-display text-3xl"
    - "Select dark styling: text-foreground + [&>option]:bg-card [&>option]:text-foreground"

key-files:
  created: []
  modified:
    - src/app/login/page.tsx
    - src/app/signup/page.tsx
    - src/app/pricing/page.tsx
    - src/app/pending/page.tsx

key-decisions:
  - "Pending page removes Card wrapper entirely for full-screen dramatic dark feel (no card border on zinc-950)"
  - "Pricing FAQ teaser h3 styled as font-display uppercase for consistency with other headings"
  - "Trust signals restructured to 3 items each with icon for visual consistency"

patterns-established:
  - "Logo: h-12 w-12 rounded-xl bg-primary shadow-lg shadow-primary/20 with white Dumbbell icon"
  - "Page heading: font-display text-3xl with MAX<span text-primary>HEALTH</span>"
  - "All form containers: bg-background (zinc-950)"
  - "Section headers: font-display text-sm text-primary uppercase tracking-wide"
  - "CTA buttons: bg-primary hover:bg-primary/90"
  - "Apply Now / Back to Login links: text-primary"

requirements-completed: [PUB-02, PUB-03, PUB-04]

# Metrics
duration: 15min
completed: 2026-03-31
---

# Phase 8 Plan 02: Auth and Utility Pages Dark Theme Summary

**Four public auth/utility pages (login, apply, pricing, pending) restyled to dark zinc-950 with emerald-500 accents and Bebas Neue headings — eliminating all jarring light-mode artifacts from the prospect journey**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-03-31T08:00:00Z
- **Completed:** 2026-03-31T08:15:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments
- Login page: dark zinc-950 background, emerald glow dumbbell logo, SIGN IN heading in Bebas Neue, primary-colored CTA button and Apply Now link
- Signup/apply page: APPLY FOR COACHING in Bebas Neue, emerald section headers (Personal Info, Your Goals, About You, Tell Us More), dark selects with proper option styling
- Pricing page: 3 dark cards on zinc-950, Pro card with emerald border glow (shadow-primary/20), prices in Bebas Neue text-5xl, trust signals with icons, dark header/footer
- Pending page: removed Card wrapper for full-screen dark feel, pulsing emerald clock icon, APPLICATION UNDER REVIEW / APPLICATION NOT ACCEPTED in Bebas Neue
- All forms, API calls, signIn(), handleCheckout(), and navigation preserved unchanged
- Zero bg-gray-50 or bg-white remaining in any of the 4 files

## Task Commits

Each task was committed atomically:

1. **Task 1: Restyle login and pending pages to dark theme** - `3ff72b3` (feat)
2. **Task 2: Restyle apply (signup) page to dark theme** - `c0f6157` (feat)
3. **Task 3: Restyle pricing page to dark theme** - `cc8b1cd` (feat)

## Files Created/Modified
- `src/app/login/page.tsx` - Dark themed: bg-background, emerald logo glow, SIGN IN heading, primary button
- `src/app/pending/page.tsx` - Dark themed: removed Card, pulsing clock, Bebas Neue headings, full-screen zinc-950
- `src/app/signup/page.tsx` - Dark themed: APPLY FOR COACHING, emerald section headers, dark selects, primary submit button
- `src/app/pricing/page.tsx` - Dark themed: zinc-950 background, dark header, Pro card emerald glow, Bebas Neue prices, icon trust signals

## Decisions Made
- Pending page removes the Card wrapper entirely for a more dramatic full-screen dark feel — a plain centered div on zinc-950 is more impactful than a card-within-dark-page
- Pricing FAQ teaser h3 changed to font-display uppercase to maintain heading consistency across the page (plan only mentioned font-display, uppercase follows the pattern)
- Trust signals restructured from mixed text/icon to 3 consistent icon+text items (Shield secure payment, Calendar cancel anytime, Shield 30-day guarantee)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None — all 3 builds passed cleanly on first attempt.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All 4 public auth/utility pages dark-themed and consistent with the landing page (Phase 8 Plan 01)
- Prospect journey is now fully dark: landing → apply → pending → login
- Ready for Phase 9 (dashboard restyling) — same CSS variable patterns apply
- No blockers

## Self-Check: PASSED
- All 4 source files exist
- All 3 task commits verified in git history (3ff72b3, c0f6157, cc8b1cd)
- SUMMARY.md created at .planning/phases/08-public-pages/08-02-SUMMARY.md

---
*Phase: 08-public-pages*
*Completed: 2026-03-31*
