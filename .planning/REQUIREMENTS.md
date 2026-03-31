# Requirements: MaxHealth Coaching

**Defined:** 2026-03-31
**Core Value:** Clients get a fully personalized coaching experience with weekly accountability and real progress-based adjustments.

## v1.0 Requirements

Requirements for production launch. Each maps to roadmap phases.

### Authentication & Security

- [ ] **AUTH-01**: User can reset password via email link (token-based)
- [ ] **AUTH-02**: User receives email verification after signup
- [ ] **AUTH-03**: Login and signup endpoints are rate-limited against brute force
- [ ] **AUTH-04**: "Forgot password?" link on login page works end-to-end

### Client Vetting

- [ ] **VET-01**: New signups land in "pending" state until coach approves
- [ ] **VET-02**: Coach can view pending applications and approve/reject from dashboard
- [ ] **VET-03**: Login page has "Apply Now" CTA directing to application flow

### Coach Editing

- [ ] **EDIT-01**: Coach can add, edit, and remove individual meals from a client's meal plan
- [ ] **EDIT-02**: Coach can add, edit, and remove exercises from training days
- [ ] **EDIT-03**: Coach can edit cardio prescriptions (type, duration, frequency) per training day
- [ ] **EDIT-04**: All generated plan content (macros, meals, training, supplements) is fully editable by coach

### Email Notifications

- [ ] **NOTIF-01**: Client receives email when their plan is generated and ready
- [ ] **NOTIF-02**: Client receives weekly check-in reminder email
- [ ] **NOTIF-03**: Coach receives email when a client submits a check-in
- [ ] **NOTIF-04**: Client receives email when coach approves a macro adjustment

### Pipeline Verification

- [ ] **PIPE-01**: Full client lifecycle works end-to-end (signup → onboarding → plan generation → check-in → auto-adjust → coach review)
- [ ] **PIPE-02**: Stripe checkout flow completes and subscription activates correctly
- [ ] **PIPE-03**: All coach editing operations save and display correctly to client

### Payment Readiness

- [ ] **PAY-01**: Stripe environment supports production key swap (env var config verified)
- [ ] **PAY-02**: Webhook endpoint handles all subscription lifecycle events correctly

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Analytics

- **ANALYTICS-01**: Coach can view signup funnel metrics (leads → paying clients)
- **ANALYTICS-02**: Coach can view client engagement metrics (check-in consistency, adherence trends)

### Compliance

- **COMP-01**: Privacy policy and Terms of Service acceptance at signup
- **COMP-02**: Client can export their personal data (GDPR readiness)

### Communication

- **COMM-01**: In-app messaging between coach and client
- **COMM-02**: Client receives push notifications on mobile browsers

## Out of Scope

| Feature | Reason |
|---------|--------|
| Mobile app | Web-first, responsive design sufficient for launch |
| Real-time chat | Not needed — coach communicates through notes and plan updates |
| AI/automation branding | Never expose AI to clients — plans are "coach-created" |
| Multi-coach support | Max is the only coach, not needed until scaling |
| OAuth/social login | Email/password sufficient for coaching clientele |
| Automated meal plan regeneration | Coach controls all plan changes manually |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| VET-01 | — | Pending |
| VET-02 | — | Pending |
| VET-03 | — | Pending |
| EDIT-01 | — | Pending |
| EDIT-02 | — | Pending |
| EDIT-03 | — | Pending |
| EDIT-04 | — | Pending |
| NOTIF-01 | — | Pending |
| NOTIF-02 | — | Pending |
| NOTIF-03 | — | Pending |
| NOTIF-04 | — | Pending |
| PIPE-01 | — | Pending |
| PIPE-02 | — | Pending |
| PIPE-03 | — | Pending |
| PAY-01 | — | Pending |
| PAY-02 | — | Pending |

**Coverage:**
- v1.0 requirements: 20 total
- Mapped to phases: 0
- Unmapped: 20

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after initial definition*
