# MaxHealth Coaching

A production-grade personal trainer client portal with AI-powered meal plans, custom training programs, automated macro calculations, weekly check-ins, and a full coach dashboard.

**Live at:** [maxhealthcoaching.com](https://maxhealthcoaching.com)

## Features

### For Clients
- **Paywall-first flow** — Stripe Checkout → Onboarding → Plan generation
- **9-step onboarding wizard** — Body stats, goals, activity level, body fat %, diet, injuries, training preferences, lifestyle, plan duration
- **Automated macro targets** — Katch-McArdle (with BF%) or Mifflin-St Jeor fallback, TDEE calculation, goal-specific calorie/macro targets
- **AI meal plans** — 7-day meal plans via OpenAI with recipes, ingredient amounts, instructions, swap options, and grocery lists
- **Training programs** — 4/8/12-week periodized programs matched to experience, equipment, injuries, and goals
- **Weekly check-ins** — Weight, waist, adherence, steps, sleep, notes + progress photos (front/side/back)
- **Progress tracking** — Weight chart, check-in timeline, photo comparisons
- **Referral system** — Unique referral codes with tracking

### For Coaches
- **Client dashboard** — View all clients, status tracking, overdue check-in alerts
- **Client deep-dive** — Full onboarding answers, macros, plans, check-in timeline, photo comparisons
- **Plan regeneration** — Regenerate meal plans or training plans for any client
- **Content management** — Blog posts and transformation case studies
- **Settings** — Client capacity, promotional pricing, welcome messages
- **Lead pipeline** — View quiz completions and email captures

### Marketing / Lead Capture
- **Premium landing page** — Hero, features, how it works, comparison table, testimonials, pricing, FAQ
- **Free assessment quiz** — 4-question quiz funnel with teaser results → email capture
- **Free calculators** — TDEE, macro, and 1RM calculators driving traffic
- **Exit-intent popup** — Email capture on homepage exit
- **Blog** — SEO-friendly content with embedded CTAs
- **Results page** — Transformation case studies

## Tech Stack

- **Framework:** Next.js 15 (App Router) + TypeScript
- **UI:** Tailwind CSS + shadcn/ui + Framer Motion
- **Auth & DB:** Supabase (Auth + Postgres + Storage)
- **Payments:** Stripe Checkout + Webhooks
- **AI:** OpenAI API (GPT-4o) with structured JSON outputs
- **Validation:** Zod
- **Hosting:** Railway

## Setup

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd training-website
npm install
```

### 2. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in:

```bash
cp .env.local.example .env.local
```

**Required variables:**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `STRIPE_SECRET_KEY` | Stripe secret key (test mode: `sk_test_...`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (`pk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `STRIPE_PRICE_BASIC` | Stripe Price ID for Basic plan |
| `STRIPE_PRICE_PRO` | Stripe Price ID for Pro plan |
| `STRIPE_PRICE_ELITE` | Stripe Price ID for Elite plan |
| `OPENAI_API_KEY` | OpenAI API key |
| `NEXT_PUBLIC_APP_URL` | App URL (`http://localhost:3000` locally) |

### 3. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run `supabase/schema.sql`
3. (Optional) Run `supabase/seed.sql` for demo data
4. Enable Email Auth in Authentication → Providers
5. Create a Storage bucket called `progress-photos` (set to private)
6. Add Storage policy: authenticated users can upload to their own folder

### 4. Stripe Setup

1. Create a Stripe account and enable test mode
2. Create 3 Products with monthly recurring prices:
   - Basic ($49/mo)
   - Pro ($99/mo)
   - Elite ($199/mo)
3. Copy each Price ID to your env vars
4. Set up a webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`
5. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

For local development, use [Stripe CLI](https://stripe.com/docs/stripe-cli):
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Create a Coach Account

1. Sign up normally through the app
2. In Supabase SQL Editor, update the user's role:
```sql
UPDATE profiles SET role = 'coach' WHERE email = 'your-email@example.com';
```
3. Log in again — you'll have access to `/coach`

## Deploy to Railway

1. Connect your GitHub repo to Railway
2. Add all environment variables
3. Set the build command: `npm run build`
4. Set the start command: `npm start`
5. Update `NEXT_PUBLIC_APP_URL` to your Railway URL
6. Update Stripe webhook URL to your Railway URL

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Landing page
│   ├── login/                # Auth pages
│   ├── signup/
│   ├── pricing/              # Stripe checkout
│   ├── success/              # Post-payment
│   ├── onboarding/           # 9-step wizard
│   ├── generating/           # Plan generation progress
│   ├── dashboard/            # Client dashboard
│   │   ├── meals/            # Meal plan view
│   │   ├── training/         # Training plan view
│   │   ├── progress/         # Photo tracking
│   │   └── referral/         # Referral program
│   ├── checkin/              # Weekly check-in
│   ├── coach/                # Coach dashboard
│   │   ├── clients/          # Client list + detail
│   │   ├── content/          # Blog + transformations
│   │   └── settings/         # Coach settings
│   ├── quiz/                 # Free assessment
│   ├── tools/                # Free calculators
│   ├── results/              # Transformation stories
│   ├── blog/                 # Blog listing + posts
│   ├── portal/               # Stripe billing portal
│   └── api/                  # API routes
│       ├── auth/             # Auth callback + signup
│       ├── webhooks/stripe/  # Stripe webhooks
│       ├── checkout/         # Create Stripe session
│       ├── onboarding/       # Save onboarding
│       ├── macros/           # Calculate macros
│       ├── meal-plan/        # Generate meal plan (OpenAI)
│       ├── training-plan/    # Generate training plan (OpenAI)
│       ├── checkin/          # Submit check-in
│       ├── upload-photo/     # Upload progress photo
│       ├── admin/clients/    # Coach: get all clients
│       ├── leads/            # Save email leads
│       ├── quiz/             # Quiz + lead capture
│       ├── referral/         # Referral data
│       ├── portal/           # Stripe billing portal
│       └── generate-pdf/     # PDF data endpoint
├── components/ui/            # shadcn/ui components
├── lib/
│   ├── supabase/             # Supabase client/server
│   ├── stripe.ts             # Stripe config + plans
│   ├── macros.ts             # BMR/TDEE/macro calculations
│   ├── openai.ts             # OpenAI config + schemas
│   ├── validations.ts        # Zod schemas
│   └── utils.ts              # Utility functions
├── types/
│   └── database.ts           # TypeScript types
└── middleware.ts              # Auth + subscription guards
```

## Disclaimers

MaxHealth Coaching provides fitness and nutrition guidance. This is not medical advice. Consult your physician before starting any new diet or exercise program. Results vary based on individual effort, adherence, and starting point.
