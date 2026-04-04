# Phase 8: Public Pages - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Redesign all 4 public-facing pages using the dark design foundation from Phase 7: landing page, login, apply (signup), pricing, and pending page. All pages must use zinc-950 backgrounds, Bebas Neue headings, emerald-500 accents, and the component library established in Phase 7. Replace all hardcoded light colors.

</domain>

<decisions>
## Implementation Decisions

### PUB-01: Landing Page
- Hero: Full-width zinc-950 with subtle gradient to zinc-900. Bebas Neue headline at 6xl-7xl: "YOUR BODY. YOUR PLAN. YOUR RESULTS." in white. Subheadline in Inter zinc-400. Big emerald "APPLY NOW" button. Typography IS the visual — no hero image.
- Social proof strip: "500+ Plans Created | Advanced Protocol Support | NASM Certified" — emerald text on dark
- Features section: 3-column grid of dark cards (zinc-900, white/10 borders) with emerald icon accents. Features: "Personalized Macros", "Custom Meal Plans", "Periodized Training", "Weekly Check-ins", "Supplement Guidance", "Direct Coaching"
- How it works: 3-step horizontal timeline with emerald numbered circles. Apply → Get Your Plan → Check In Weekly
- Comparison table: Dark table — "DIY vs MaxHealth Coaching" with emerald checkmarks
- Bottom CTA: Bold Bebas Neue "READY TO TRANSFORM?" with emerald button
- Navigation: Transparent/blurred dark nav that solidifies on scroll (sticky, backdrop-blur)
- Exit intent popup: Restyle to dark theme
- All existing framer-motion animations keep, just restyle

### PUB-02: Login + Apply Pages
- Login: Dark centered card (zinc-900) on zinc-950 background. MaxHealth logo with subtle emerald glow. Emerald "Sign In" button. "Apply Now" CTA below. Remove all bg-gray-50/bg-white.
- Apply (signup): Same dark card layout. "APPLY FOR COACHING" in Bebas Neue at top. Form sections grouped in zinc-900 cards with section headers. Emerald accents on selection dropdowns. Select fields styled dark (zinc-900 bg, white text). Success state shows emerald CheckCircle.
- Both pages: dark inputs (zinc-900 bg, white/10 border, emerald focus ring) from Phase 7 component library

### PUB-03: Pricing Page
- 3 dark cards (zinc-900) on zinc-950 background
- Pro card elevated: emerald border glow (border-emerald-500, shadow-emerald-500/20), "MOST POPULAR" badge in emerald, slight scale-105
- Price numbers in Bebas Neue (3xl-4xl), white
- Feature lists with emerald Check icons
- Basic/Elite: outline emerald CTA button. Pro: filled emerald CTA button.
- Trust signals below cards: Lock + "Secure payment", Calendar + "Cancel anytime", Shield + "30-day guarantee" — zinc-400 text with zinc-500 icons

### PUB-04: Pending Page
- Dark full-screen centered layout on zinc-950
- Clock icon with emerald pulse animation (animate-pulse with emerald color)
- "APPLICATION UNDER REVIEW" in Bebas Neue
- Body: "We review every application personally. You'll hear from us within 24 hours." in Inter zinc-400
- MaxHealth branding at top (logo + name)
- Link back to login in zinc-500
- Rejected state: XCircle icon in red, empathetic copy, same dark layout

### Copy & Branding Rules
- Never mention AI, generated, or automated — everything is "coach-created" or "personalized"
- "Plans Created" not "Plans Generated" in social proof
- "Advanced Protocol Support" as the safe PED-adjacent language
- Tone: confident, direct, no fluff. Bebas Neue headings are short and punchy.
- CTAs: "APPLY NOW", "GET STARTED", "READY TO TRANSFORM?" — action-oriented, uppercase

### Claude's Discretion
- Exact gradient angles and stops
- Spacing adjustments for dark layout (dark often needs more whitespace than light)
- Whether to add a subtle grid/dot pattern on the hero background
- Exact animation timing for nav solidify-on-scroll
- Mobile-specific layout adjustments

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- Phase 7 CSS vars: `bg-background` (zinc-950), `bg-card` (zinc-900), `text-primary` (emerald-500), `text-foreground` (white)
- Phase 7 animation utilities: `.transition-micro`, `.hover-card-glow`, `.animate-fade-in-up`
- `font-display` class for Bebas Neue headings
- Existing framer-motion animations on landing page — keep the motion, restyle the visuals
- shadcn Button, Card, Input, Badge, Tabs — all already dark-themed from Phase 7

### Established Patterns
- Landing page uses `useInView` for scroll-triggered animations
- Login/signup use react-hook-form + zodResolver
- Pricing cards use shadcn Card with feature lists
- All pages import from `@/components/ui/*`

### Integration Points
- `src/app/page.tsx` — Landing page (complete rewrite of visual layer)
- `src/app/login/page.tsx` — Login page
- `src/app/signup/page.tsx` — Apply page
- `src/app/pricing/page.tsx` — Pricing page
- `src/app/pending/page.tsx` — Pending page
- Existing functionality (forms, validation, API calls) stays — only visual layer changes

</code_context>

<specifics>
## Specific Ideas

- The landing page hero should feel like it punches you in the face — big, bold, dark, unapologetic
- Pricing Pro card glow effect should be subtle — not neon, just a hint of emerald in the shadow
- Login page should feel like walking into an exclusive gym, not a SaaS product
- Nav blur effect: `backdrop-blur-lg bg-zinc-950/80` that becomes `bg-zinc-950` on scroll

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 08-public-pages*
*Context gathered: 2026-04-04*
