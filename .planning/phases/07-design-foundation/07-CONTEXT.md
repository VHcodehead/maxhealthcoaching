# Phase 7: Design Foundation - Context

**Gathered:** 2026-04-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Establish the global design system that all subsequent phases consume: dark color palette, typography, component overrides, and animation primitives. No page-level redesigns — just the foundation tokens and component library updates.

</domain>

<decisions>
## Implementation Decisions

### THEME-01: Dark Color Palette
- Rewrite `:root` CSS variables to dark-by-default (not `.dark` class toggle — dark IS the only mode)
- Background: zinc-950 (#09090b) as `--background`
- Card surfaces: zinc-900 (#18181b) as `--card`
- Elevated surfaces: zinc-800 (#27272a) for popovers, dropdowns
- Primary accent: emerald-500 (#10b981) as `--primary`
- Primary foreground: white on emerald buttons
- Text: white (#fafafa) for headings, zinc-400 (#a1a1aa) for body/muted
- Borders: white/10 opacity for subtle separation
- Input backgrounds: white/5 with white/10 borders
- Destructive: red-500 for delete/error states
- Keep existing macro colors (blue=protein, amber=carbs, rose=fat) but brighten for dark backgrounds
- Sidebar: zinc-900 background, emerald-500 active indicator
- Remove the `.dark` class variant entirely — site is always dark

### THEME-02: Typography
- Display/heading font: **Bebas Neue** (Google Font) — ultra condensed, all-caps display
- Body font: **Inter** (already loaded) — clean, readable
- Bebas Neue used for: hero headings, page titles, stat card values, section headers
- Inter used for: body text, labels, form inputs, descriptions, navigation
- Font sizes: larger than current — hero text at 5xl-7xl, page titles at 3xl-4xl
- Letter spacing: tracking-wider on Bebas Neue headings for readability
- CSS variable: `--font-display` for Bebas Neue, `--font-sans` for Inter (already exists)

### THEME-03: Component Library Overrides
- **Buttons**: Emerald-500 fill with white text (primary), zinc-800 with white text (secondary), transparent with emerald border (outline). Hover: slightly brighter. Larger padding.
- **Cards**: zinc-900 background, white/10 border, subtle shadow. No white cards anywhere.
- **Inputs**: zinc-900 background, white/10 border, white text, zinc-500 placeholder. Focus: emerald-500 ring.
- **Badges**: Filled variants on dark — emerald/10 bg with emerald-400 text, etc. Not outline style.
- **Select/Dropdown**: zinc-900 background, zinc-800 items, emerald highlight on hover
- **Dialogs**: zinc-900 background, white/10 border, backdrop blur
- **Tables**: zinc-900 header, alternating zinc-900/zinc-950 rows, white/10 borders
- **Tabs**: zinc-800 inactive, emerald-500 bg with white text active
- **Progress bars**: zinc-800 track, emerald-500 fill

### THEME-04: Animation System
- Page transitions: fade + slight y-translate (already using framer-motion — keep)
- Card hover: subtle scale(1.01) + border color shift to emerald-500/30
- Button hover: brightness increase (not color shift)
- Stat numbers: count-up animation on mount
- Progress bars: width animation with ease-out (already exists — keep)
- Consistent duration: 200ms for micro-interactions, 400ms for page transitions
- No new animation library needed — framer-motion covers everything

### Claude's Discretion
- Exact oklch values for the dark palette (convert from hex targets above)
- Whether to create utility classes or just override CSS vars
- Exact Bebas Neue font weights to load (400 is likely sufficient since it's display-only)
- Shadow values for dark card depth
- Exact border-radius adjustments (current 0.625rem is fine)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/globals.css`: CSS variable system with `:root` and `.dark` — rewrite `:root` to be dark, remove `.dark`
- `src/app/layout.tsx`: Font loading via `next/font/google` — add Bebas Neue here
- All shadcn components in `src/components/ui/` use semantic vars (`bg-background`, `text-foreground`, `bg-card`) — changing vars changes everything
- Framer Motion already imported throughout — animation system is in place

### Established Patterns
- shadcn/ui CSS variables using oklch color space
- `@theme inline` block maps CSS vars to Tailwind classes
- Components use `bg-background`, `text-foreground`, `bg-card`, `border-border` etc.
- Inter loaded via `next/font/google` with `--font-sans` CSS variable

### Integration Points
- `src/app/globals.css`: PRIMARY — rewrite all color variables here
- `src/app/layout.tsx`: Add Bebas Neue font, apply `dark` class or rewrite body classes
- `src/components/ui/*.tsx`: May need individual component tweaks after var changes
- Every page uses `bg-gray-50`, `bg-white`, `bg-zinc-50` etc. directly — these hardcoded colors need to be found and replaced with semantic vars or dark equivalents in Phases 8-10

</code_context>

<specifics>
## Specific Ideas

- The shadcn CSS variable system is the leverage point — changing `:root` vars propagates to every component automatically
- Pages that hardcode `bg-white`, `bg-gray-50`, etc. will need manual updates in later phases — Phase 7 just sets the foundation
- Bebas Neue should feel like it owns the space — big, bold, unapologetic
- The emerald accent on dark should feel like a glow, not a sticker

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 07-design-foundation*
*Context gathered: 2026-04-03*
