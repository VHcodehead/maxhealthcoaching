# Phase 6: Pipeline Verification - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

End-to-end verification of every critical user flow before the first real client is onboarded. No new features — only testing, bug fixes found during testing, and a final build check. This is the last phase before launch.

</domain>

<decisions>
## Implementation Decisions

### PIPE-01: Full Client Lifecycle
- Automated code audit: trace the entire flow through the codebase
  1. Signup (now "Apply for Coaching") → `pending_approval` status
  2. Coach approves → status becomes `none`
  3. Stripe checkout → status becomes `active`
  4. Onboarding questionnaire → macros calculated
  5. Plan generation (meal + training) → plan ready email sent
  6. Client views dashboard (meals, training, supplements, messages)
  7. Client submits weekly check-in → coach notified via email
  8. Auto-adjustment triggered (if >50kcal swing) → pending review created
  9. Coach reviews and approves → client notified via email, new macros active
- Fix any broken links, missing redirects, or data flow issues found

### PIPE-02: Stripe Checkout Flow
- Verify checkout creates customer, initiates subscription, redirects to success
- Verify success page calls verify endpoint and updates subscription status
- Verify middleware gates dashboard on active subscription
- Verify webhook handles all lifecycle events (already hardened in Phase 5)
- Note: This is Stripe test mode verification — production keys are a manual step

### PIPE-03: Coach Editing Operations
- Verify all editing operations built in Phases 1-5 save and display correctly:
  - Macro overrides
  - Meal plan editing (add/edit/remove meals)
  - Training plan editing (add/edit/remove exercises, cardio)
  - Supplement CRUD
  - Messages (send/receive/read)
- Verify client dashboard reflects all coach changes

### Final Build Check
- `npm run build` must pass with zero errors
- `prisma db push` schema in sync
- All new routes appear in build output

### Claude's Discretion
- Whether to create a formal test script or just do verification through code audit
- How to structure the verification report
- Bug fix approach (fix inline or flag for manual review)

</decisions>

<code_context>
## Existing Code Insights

### Key Files to Audit
- `src/middleware.ts`: Route gating (pending_approval, rejected, active subscription, onboarding)
- `src/app/api/auth/signup/route.ts`: Application flow entry point
- `src/app/api/admin/applications/[id]/route.ts`: Approval flow
- `src/app/api/checkout/route.ts`: Stripe checkout
- `src/app/api/checkout/verify/route.ts`: Post-checkout verification
- `src/app/generating/page.tsx`: Plan generation flow
- `src/app/api/checkin/route.ts`: Check-in submission + auto-adjustment
- `src/app/api/admin/macro-adjustments/[id]/route.ts`: Coach approval
- `src/app/coach/clients/[id]/page.tsx`: Coach editing hub

### Integration Points
- Every route in the flow depends on correct `subscriptionStatus` transitions
- JWT session must reflect current state (role, subscription, onboarding, emailVerified)
- Plan generation triggers email notification (NOTIF-01)
- Check-in triggers both auto-adjustment and coach email (NOTIF-03)

</code_context>

<specifics>
## Specific Ideas

- This is the "shake it and see what falls out" phase
- Any bugs found should be fixed immediately, not deferred
- The human checkpoint at the end is the most important part — Max needs to walk through the entire flow himself

</specifics>

<deferred>
## Deferred Ideas

None — this is the final phase.

</deferred>

---

*Phase: 06-pipeline-verification*
*Context gathered: 2026-04-01*
