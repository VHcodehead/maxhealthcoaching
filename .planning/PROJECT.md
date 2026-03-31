# MaxHealth Coaching

## What This Is

A full-stack coaching platform where Max (fitness coach with bodybuilding competition experience) manages paying clients through personalized macro calculations, custom meal plans, periodized training programs, supplement protocols, and weekly check-ins with automatic macro adjustments. Built with Next.js 15, Prisma, PostgreSQL (Railway), Stripe, and OpenAI.

## Core Value

Clients get a fully personalized coaching experience — macros, meals, training, supplements — with weekly accountability check-ins where the coach adjusts everything based on real progress data.

## Requirements

### Validated

<!-- Shipped and confirmed working. -->

- Auth: Email/password signup and login with role-based access (coach/client/admin)
- Onboarding: 9-step questionnaire collecting body stats, goals, diet, training preferences, lifestyle
- Macro calculation: Auto-generated targets using Katch-McArdle or Mifflin-St Jeor based on body fat knowledge
- Meal plan generation: 7-day personalized plans with grocery lists (coach-created, delivered via platform)
- Training plan generation: Periodized programs matching client goals, experience, equipment
- Coach dashboard: Client roster, status tracking, activity feed, pending macro adjustments
- Coach editing: Inline editing of meal plans, training plans, macro overrides
- Weekly check-ins: Weight, waist, adherence, steps, sleep, notes, progress photos
- Auto macro adjustments: Triggered on >50kcal swing, creates pending review for coach
- Coach approval flow: Accept/dismiss/modify proposed macro changes
- Supplement protocols: Full CRUD with catalog library (41 entries), searchable dropdown, dosage guidance
- Coach notes: Per-client notes with categories (general, nutrition, training, check_in)
- Stripe integration: Checkout, webhooks, subscription management (test mode)
- Client dashboard: Macros, meal plan, training plan, supplements, check-in views
- Progress photos: Upload front/side/back with storage, side-by-side comparison
- Blog system: CRUD with slug-based routing, published/draft states
- Referral system: Code generation, discount tracking
- Unit system: Imperial-default with metric toggle

### Active

<!-- Current scope: Production Launch milestone -->

(Defined in REQUIREMENTS.md)

### Out of Scope

- Mobile app — web-first, responsive design sufficient for now
- Real-time chat — not needed, coach communicates through notes and plan updates
- AI branding — never mention AI to clients; plans are "coach-created"
- Multi-coach support — Max is the only coach for now

## Context

- Max is a competitive bodybuilder with prep conditioning experience
- Has 4-week transformation photos and competition videos for marketing
- Platform capacity: 20 clients max (configured in coach settings)
- Pricing: Basic $149/mo, Pro $299/mo, Elite $499/mo
- Currently in Stripe test mode — needs production keys to charge
- "Forgot password?" link on login is non-functional (points to #)
- No client vetting/application flow — anyone can sign up directly
- No email verification or password reset
- No email notifications (check-in reminders, plan ready, etc.)
- Social media marketing docs created (scripts, calendar, strategy) in repo root

## Constraints

- **Tech stack**: Next.js 15 App Router, Prisma, PostgreSQL (Railway), Tailwind CSS, Stripe
- **Hosting**: Railway (PostgreSQL + likely deployment target)
- **AI**: OpenAI for plan generation — internal tool only, never client-facing
- **Timeline**: Launch within 2 weeks — start taking paying clients
- **Budget**: Solo founder, minimal infrastructure costs
- **Security**: Must protect client health data, no exposed secrets

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| NextAuth credentials provider | Simple email/password, no OAuth complexity for v1 | ✓ Good |
| OpenAI for plan generation | Fast, high-quality meal/training plans | ✓ Good — but never expose to clients |
| Railway PostgreSQL | Simple managed DB, good free tier | ✓ Good |
| Stripe subscriptions | Industry standard, handles recurring billing | — Pending (still in test mode) |
| No application flow at signup | Fast to build initially | ⚠️ Revisit — need vetting before launch |
| Resend for email service | Modern, Next.js-native, generous free tier (3k/mo), simple API | — Pending (Phase 1) |

---
*Last updated: 2026-03-31 after v1.0 roadmap approved*
