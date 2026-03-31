# Phase 1: Security and Auth - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Password reset flow, email verification on signup, and rate limiting on auth endpoints. Uses Resend as email service. Does NOT include client vetting (Phase 2) or email notifications (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Password Reset Flow
- Crypto-random token stored in DB with 1-hour expiry
- Token is single-use (deleted after use), hashed in DB
- Flow: "Forgot password?" → enter email → Resend email with reset link → `/reset-password?token=xxx` → set new password → redirect to login with success toast
- Generic "if that email exists, we sent a link" response (no email enumeration)
- New Prisma model for password reset tokens (userId, hashedToken, expiresAt)

### Email Verification
- Non-blocking: user can sign up and use platform while unverified
- Signup triggers verification email via Resend with a verification link
- Link sets `emailVerified = true` on User model (field already exists, currently always false)
- Soft enforcement: banner shown on dashboard "Verify your email" until verified
- Non-blocking chosen because coach manually vets clients anyway (Phase 2)

### Rate Limiting
- Login: 5 attempts per email per 15 minutes, then 15-minute lockout
- Signup: 3 signups per IP per hour
- Password reset: 3 requests per email per hour
- In-memory rate limiter (Map with TTL) — no external dependency, sufficient for single-server
- Response: generic 429 "Too many attempts, try again later" — no info leakage

### Email Template Style
- MaxHealth green (#059669), dumbbell icon, clean white background
- Tone: professional but warm — "Hey [name]," not "Dear valued customer"
- Footer: "MaxHealth Coaching — Your Personal Training Partner"
- Both emails (reset + verification) share the same branded layout, different copy

### Claude's Discretion
- Exact email HTML/template structure
- Token generation implementation details (crypto.randomBytes length)
- Rate limiter cleanup strategy (periodic purge vs lazy expiry)
- Password reset page styling (should match login page aesthetic)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/auth.ts`: NextAuth v5 config with credentials provider — password reset needs to integrate here
- `src/lib/auth.config.ts`: JWT callbacks — emailVerified status should be added to JWT token
- `src/lib/validations.ts`: Zod schemas — add reset password and forgot password schemas
- `src/app/login/page.tsx`: "Forgot password?" link at line 117 currently `href="#"` — needs to point to `/forgot-password`
- `src/app/api/auth/signup/route.ts`: Signup route — add verification email trigger after user creation

### Established Patterns
- Zod validation on all API routes (signUpSchema pattern)
- bcrypt with 12 rounds for password hashing
- Prisma transactions for multi-table operations
- Sonner toast notifications for user feedback
- react-hook-form + zodResolver for forms

### Integration Points
- `prisma/schema.prisma`: Add PasswordResetToken model
- `src/middleware.ts`: Public routes list needs `/forgot-password`, `/reset-password` added
- `.env.local`: Add `RESEND_API_KEY` environment variable
- User model: `emailVerified` field exists but is never updated — verification flow will set it

</code_context>

<specifics>
## Specific Ideas

No specific requirements — standard auth patterns with MaxHealth branding.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-security-and-auth*
*Context gathered: 2026-03-31*
