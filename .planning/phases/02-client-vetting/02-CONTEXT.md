# Phase 2: Client Vetting - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

New signups land in a "pending" state until the coach manually approves them. Coach sees pending applications on dashboard and can approve/reject. Login page gets "Apply Now" CTA. Does NOT include email notifications for approval/rejection (that's Phase 4) — but uses Resend (already wired from Phase 1) for immediate approval/rejection emails as a courtesy.

</domain>

<decisions>
## Implementation Decisions

### Application Form (replaces bare signup)
- Signup page reframed as "Apply for Coaching" — not "Create your account"
- 9 fields collected on application:
  1. **Full Name** — text (already exists in current signup)
  2. **Email** — email (already exists)
  3. **Password** — password (already exists)
  4. **Goal** — select: "Lose fat & get lean" / "Build muscle & size" / "Lose fat while building muscle (body recomposition)" / "Improve overall health & fitness" / "Competition / show prep"
  5. **Experience Level** — select: Beginner / Intermediate / Advanced
  6. **Training Commitment** — select: 3 days/week / 4 days/week / 5 days/week / 6+ days/week
  7. **Gender** — select: Male / Female
  8. **Age** — number input
  9. **Height & Weight** — US units only (ft/in for height, lbs for weight). No metric toggle on the application form.
  10. **Why now?** — textarea: "What's driving you to seek coaching right now?" (primary seriousness filter)
  11. **How did you find us?** — text input (marketing tracking)
- Application data stored in a new `Application` model or as JSON on the Profile

### Pending State
- New signups get `subscriptionStatus: 'pending_approval'`
- Middleware blocks pending users from `/dashboard`, `/onboarding`, `/checkin`, `/generating`
- Pending users redirected to a `/pending` holding page: "Your application is under review. We'll email you when you're approved."
- The pending page should feel professional — MaxHealth branding, reassuring copy

### Coach Approval UX
- New "Pending Applications" card on coach dashboard — displayed at the top, above client roster
- Each applicant shows: name, email, signup date, goal, experience, commitment, age, gender, height/weight, and the "Why now?" answer
- Two action buttons per applicant: green "Approve" and red "Reject"
- Approve: sets `subscriptionStatus: 'none'` (allows them to proceed to pricing/checkout normally) + sends approval email
- Reject: marks profile as `subscriptionStatus: 'rejected'` (soft delete, no hard delete) + sends rejection email
- Approval email: "Great news — you've been accepted into MaxHealth Coaching! Click here to get started."
- Rejection email: "Unfortunately we're not able to take on new clients at this time. We'll reach out if a spot opens up."

### Apply Now CTA
- **Login page**: Change "Don't have an account? Sign up" → "Want to work with me? Apply Now" — links to `/signup`
- **Landing page (/)**: Add prominent "Apply Now" CTA button in the hero section, linking to `/signup`
- Signup page heading: "Apply for Coaching" (not "Create your account")

### Pre-fill for Onboarding
- Application data (goal, experience, gender, age, height, weight) should be stored so it can pre-fill the full onboarding questionnaire after approval+payment — avoid making them re-enter this info

### Claude's Discretion
- Exact Prisma model design (new Application model vs JSON field on Profile)
- Pending page styling details
- Application form layout (single page vs multi-step)
- How application data maps to onboarding fields for pre-fill

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/signup/page.tsx`: Current signup form — extend with application fields
- `src/lib/validations.ts`: Zod schemas — add application schema
- `src/lib/email.ts`: Resend service with branded templates — use for approval/rejection emails
- `src/app/coach/page.tsx`: Coach dashboard — add pending applications section
- `src/app/api/admin/clients/route.ts`: Already computes client `status: 'pending'` for onboarding-incomplete clients

### Established Patterns
- react-hook-form + zodResolver for all forms
- Coach dashboard uses `Promise.all()` to load multiple data sources
- Profile model has `subscriptionStatus` field — can add `'pending_approval'` and `'rejected'` values
- Middleware checks `subscriptionStatus` to gate routes — extend for `pending_approval`
- Sonner toasts for success/error feedback

### Integration Points
- `src/middleware.ts`: Add `pending_approval` check to redirect to `/pending` page
- `src/app/api/auth/signup/route.ts`: Set `subscriptionStatus: 'pending_approval'` and store application data
- `src/app/api/admin/clients/route.ts`: Add endpoint or filter for pending approval clients
- `prisma/schema.prisma`: May need Application model or extend Profile with application fields

</code_context>

<specifics>
## Specific Ideas

- Goal labels must be plain language, not gym jargon — "Lose fat & get lean" not "Cut"
- "Why now?" textarea is the primary filter for seriousness — display it prominently on the coach approval screen
- Application form uses US units only (lbs, ft/in) — no metric toggle
- The pending page should feel reassuring, not like a rejection — "We review every application personally"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-client-vetting*
*Context gathered: 2026-03-31*
