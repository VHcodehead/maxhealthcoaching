import { Resend } from 'resend';

// Lazy initialization — avoids throwing at build time when RESEND_API_KEY is not set
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY);
  }
  return _resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'MaxHealth Coaching <noreply@maxhealthfitness.com>';

function buildBrandedHtml(options: {
  heading: string;
  name: string;
  body: string;
  ctaText: string;
  ctaUrl: string;
  footnote?: string;
}): string {
  const { heading, name, body, ctaText, ctaUrl, footnote } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${heading}</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color:#059669;padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">&#127947; MaxHealth Coaching</p>
              <p style="margin:6px 0 0;font-size:13px;color:#a7f3d0;">Your Personal Training Partner</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">${heading}</h1>
              <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hey ${name},</p>
              <p style="margin:0 0 32px;font-size:15px;color:#374151;line-height:1.6;">${body}</p>
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:6px;background-color:#059669;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:6px;">${ctaText}</a>
                  </td>
                </tr>
              </table>
              ${footnote ? `<p style="margin:24px 0 0;font-size:13px;color:#6b7280;line-height:1.5;">${footnote}</p>` : ''}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:13px;color:#9ca3af;">MaxHealth Coaching &mdash; Your Personal Training Partner</p>
              <p style="margin:6px 0 0;font-size:12px;color:#d1d5db;">If you did not request this email, you can safely ignore it.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string
): Promise<void> {
  const html = buildBrandedHtml({
    heading: 'Reset Your Password',
    name,
    body: "We received a request to reset your MaxHealth Coaching account password. Click the button below to choose a new password. This link expires in 1 hour.",
    ctaText: 'Reset Password',
    ctaUrl: resetUrl,
    footnote: 'This link expires in 1 hour. If you did not request a password reset, please ignore this email — your password will remain unchanged.',
  });

  await sendEmail(to, 'Reset Your Password — MaxHealth Coaching', html);
}

export async function sendVerificationEmail(
  to: string,
  name: string,
  verifyUrl: string
): Promise<void> {
  const html = buildBrandedHtml({
    heading: 'Verify Your Email',
    name,
    body: "Thanks for signing up for MaxHealth Coaching! Please verify your email address to activate your account and start your fitness journey.",
    ctaText: 'Verify Email Address',
    ctaUrl: verifyUrl,
  });

  await sendEmail(to, 'Verify Your Email — MaxHealth Coaching', html);
}

export async function sendApprovalEmail(
  to: string,
  name: string,
  loginUrl: string
): Promise<void> {
  const html = buildBrandedHtml({
    heading: "You've Been Accepted!",
    name,
    body: "Great news — you've been accepted into MaxHealth Coaching! Click the button below to log in and get started on your fitness journey.",
    ctaText: 'Get Started',
    ctaUrl: loginUrl,
  });

  await sendEmail(to, 'Welcome to MaxHealth Coaching!', html);
}

export async function sendRejectionEmail(
  to: string,
  name: string
): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://maxhealthfitness.com';

  const html = buildBrandedHtml({
    heading: 'Application Update',
    name,
    body: "Unfortunately, we're not able to take on new clients at this time. We'll reach out if a spot opens up.",
    ctaText: 'Visit Website',
    ctaUrl: appUrl,
  });

  await sendEmail(to, 'MaxHealth Coaching — Application Update', html);
}

export async function sendPlanReadyEmail(
  to: string,
  name: string,
  dashboardUrl: string
): Promise<void> {
  const html = buildBrandedHtml({
    heading: 'Your Plan Is Ready!',
    name,
    body: "Your custom meal plan and training program are ready to go. Everything has been tailored to your goals — let's get to work!",
    ctaText: 'View My Plan',
    ctaUrl: dashboardUrl,
  });

  await sendEmail(to, 'Your personalized plan is ready! — MaxHealth Coaching', html);
}

export async function sendCheckinReminderEmail(
  to: string,
  name: string,
  checkinUrl: string
): Promise<void> {
  const html = buildBrandedHtml({
    heading: 'Time for Your Weekly Check-in',
    name,
    body: "It's check-in time! Take a few minutes to log your progress — it helps me fine-tune your plan and keep you on track.",
    ctaText: 'Submit Check-in',
    ctaUrl: checkinUrl,
  });

  await sendEmail(to, 'Time for your weekly check-in — MaxHealth Coaching', html);
}

export async function sendCheckinNotificationEmail(
  to: string,
  clientName: string,
  weekNumber: number,
  weightKg: number,
  adherenceRating: number,
  notes: string | null,
  reviewUrl: string
): Promise<void> {
  const notesSnippet = notes
    ? ` | Notes: "${notes.slice(0, 100)}${notes.length > 100 ? '...' : ''}"`
    : '';

  const html = buildBrandedHtml({
    heading: `${clientName} Submitted a Check-in`,
    name: 'Coach',
    body: `${clientName} just submitted their week ${weekNumber} check-in. Weight: ${weightKg}kg | Adherence: ${adherenceRating}/10${notesSnippet}`,
    ctaText: 'Review Check-in',
    ctaUrl: reviewUrl,
  });

  await sendEmail(to, `${clientName} submitted their week ${weekNumber} check-in`, html);
}

export interface CoachingApplicationEmailPayload {
  to: string;
  applicationId: string;
  applicantName: string;
  applicantEmail: string;
  applicantPhone?: string | null;
  applicantSocial?: string | null;
  applicantAge: number;
  applicantTimezone: string;
  goalLabel: string;
  leadScore: number;
  priority: boolean;
  scoreBreakdown: { label: string; points: number }[];
  answers: { question: string; answer: string }[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function sendCoachingApplicationNotification(
  payload: CoachingApplicationEmailPayload,
): Promise<void> {
  const {
    to,
    applicationId,
    applicantName,
    applicantEmail,
    applicantPhone,
    applicantSocial,
    applicantAge,
    applicantTimezone,
    goalLabel,
    leadScore,
    priority,
    scoreBreakdown,
    answers,
  } = payload;

  const subject = priority
    ? `Priority lead: ${applicantName} (score ${leadScore})`
    : `New coaching application: ${applicantName} (score ${leadScore})`;

  const breakdownRows = scoreBreakdown
    .map(
      (b) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#374151;font-size:13px;">${escapeHtml(b.label)}</td><td style="padding:4px 0;text-align:right;font-size:13px;font-weight:600;color:${b.points >= 0 ? '#059669' : '#dc2626'};">${b.points >= 0 ? '+' : ''}${b.points}</td></tr>`,
    )
    .join('');

  const answerRows = answers
    .map(
      (a) =>
        `<tr><td colspan="2" style="padding:14px 0 4px;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">${escapeHtml(a.question)}</td></tr><tr><td colspan="2" style="padding:0 0 4px;font-size:14px;color:#111827;white-space:pre-wrap;line-height:1.5;">${escapeHtml(a.answer)}</td></tr>`,
    )
    .join('');

  const priorityBadge = priority
    ? `<span style="display:inline-block;padding:3px 10px;background:#059669;color:#fff;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">Priority</span>`
    : `<span style="display:inline-block;padding:3px 10px;background:#e5e7eb;color:#374151;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">Standard</span>`;

  const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8" /><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#111827;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
    <tr><td align="center">
      <table width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #e5e7eb;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">${priorityBadge}<span style="font-size:13px;color:#6b7280;">Score: <strong style="color:#111827;">${leadScore}</strong></span></div>
          <h1 style="margin:0;font-size:22px;font-weight:700;">${escapeHtml(applicantName)}</h1>
          <p style="margin:6px 0 0;font-size:13px;color:#6b7280;">Goal: ${escapeHtml(goalLabel)} &middot; Age ${applicantAge} &middot; ${escapeHtml(applicantTimezone)}</p>
        </td></tr>

        <tr><td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;background:#f9fafb;">
          <div style="font-size:13px;line-height:1.7;">
            <div><strong>Email:</strong> <a href="mailto:${encodeURIComponent(applicantEmail)}" style="color:#059669;">${escapeHtml(applicantEmail)}</a></div>
            ${applicantPhone ? `<div><strong>Phone:</strong> <a href="tel:${escapeHtml(applicantPhone)}" style="color:#059669;">${escapeHtml(applicantPhone)}</a></div>` : ''}
            ${applicantSocial ? `<div><strong>Social:</strong> ${escapeHtml(applicantSocial)}</div>` : ''}
          </div>
        </td></tr>

        <tr><td style="padding:20px 28px;border-bottom:1px solid #e5e7eb;">
          <h2 style="margin:0 0 12px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Score breakdown</h2>
          <table cellpadding="0" cellspacing="0" width="100%">${breakdownRows}</table>
        </td></tr>

        <tr><td style="padding:20px 28px;">
          <h2 style="margin:0 0 4px;font-size:13px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Application</h2>
          <table cellpadding="0" cellspacing="0" width="100%">${answerRows}</table>
        </td></tr>

        <tr><td style="padding:16px 28px;border-top:1px solid #e5e7eb;background:#f9fafb;font-size:12px;color:#9ca3af;">
          Application <code>${escapeHtml(applicationId)}</code> &middot; Reply directly to this email to reach <strong style="color:#374151;">${escapeHtml(applicantName)}</strong>.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    replyTo: applicantEmail,
    subject,
    html,
  });
}

export interface CoachingApplicationConfirmationPayload {
  to: string;
  firstName: string;
  replyTo: string;
}

export async function sendCoachingApplicationConfirmation(
  payload: CoachingApplicationConfirmationPayload,
): Promise<void> {
  const { to, firstName, replyTo } = payload;
  const safeName = escapeHtml(firstName);

  const subject = "Got your application — I'll be in touch within 48 hours";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Got your application</title>
</head>
<body style="margin:0;padding:24px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#111827;font-size:15px;line-height:1.6;">
  <div style="max-width:560px;margin:0 auto;">
    <p style="margin:0 0 16px;">Hey ${safeName},</p>
    <p style="margin:0 0 16px;">Your coaching application just landed. Thanks for taking the time to fill it out properly — the answers in there tell me a lot more about whether we'll work well together than a quick DM ever could.</p>
    <p style="margin:0 0 12px;">I personally read every application that comes in. <strong>You'll hear from me within 48 hours</strong> with one of two things:</p>
    <ul style="margin:0 0 16px;padding:0 0 0 22px;">
      <li style="margin-bottom:4px;">An invite to hop on a short call so we can make sure it's a fit on both sides, or</li>
      <li>A straight answer if I'm not the right coach for what you're chasing right now</li>
    </ul>
    <p style="margin:0 0 16px;">Either way, you get a reply. If 48 hours pass and nothing's landed, just reply to this email and I'll get on it.</p>
    <p style="margin:24px 0 4px;">Talk soon,</p>
    <p style="margin:0 0 32px;"><strong>Max</strong><br /><span style="color:#6b7280;font-size:14px;">CoachMax</span></p>
    <p style="margin:0;font-size:12px;color:#9ca3af;">You're receiving this because you submitted a coaching application at maxhealthcoaching.com.</p>
  </div>
</body>
</html>`;

  await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    replyTo,
    subject,
    html,
  });
}

// ── Unified Coaching Hub notifications (Phase 4) ──────────────────────────────

const COACH_NOTIFY_EMAIL = process.env.COACH_NOTIFY_EMAIL ?? 'coach@integrativeaisolutions.com';

/** Notify the coach that a client submitted something (check-in / bloodwork). */
export async function sendCoachAlertEmail(
  clientName: string,
  what: string,
  reviewUrl: string,
): Promise<void> {
  const html = buildBrandedHtml({
    heading: `${escapeHtml(clientName)} — ${escapeHtml(what)}`,
    name: 'Coach',
    body: `${escapeHtml(clientName)} just ${escapeHtml(what)}. Open the coaching hub to review.`,
    ctaText: 'Open hub',
    ctaUrl: reviewUrl,
  });
  await sendEmail(COACH_NOTIFY_EMAIL, `${clientName} — ${what}`, html);
}

/** Notify a client that their coach posted feedback. */
export async function sendClientFeedbackEmail(
  to: string,
  name: string,
  portalUrl: string,
): Promise<void> {
  const html = buildBrandedHtml({
    heading: 'Your coach posted feedback',
    name,
    body: "Your coach reviewed your week and left feedback. Open your portal to see what's next.",
    ctaText: 'View feedback',
    ctaUrl: portalUrl,
  });
  await sendEmail(to, 'Your coach posted feedback — MaxHealth Coaching', html);
}

export async function sendAppLinkCodeEmail(
  to: string,
  name: string,
  code: string
): Promise<void> {
  const safeName = escapeHtml(name || 'there');
  const safeCode = escapeHtml(code);

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Link your MyPocketCoach account</title>
</head>
<body style="margin:0;padding:0;background-color:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <tr><td style="background-color:#059669;padding:32px 40px;text-align:center;">
          <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:0.5px;">&#127947; MaxHealth Coaching</p>
        </td></tr>
        <tr><td style="padding:40px 40px 32px;">
          <h1 style="margin:0 0 24px;font-size:24px;font-weight:700;color:#111827;">Link your app account</h1>
          <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">Hey ${safeName},</p>
          <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.6;">Enter this code on the link page to connect your MyPocketCoach app account so your coach can see your training data. The code expires in 15 minutes.</p>
          <div style="text-align:center;margin:0 0 24px;">
            <span style="display:inline-block;padding:16px 32px;font-size:34px;font-weight:700;letter-spacing:10px;color:#059669;background:#ecfdf5;border-radius:8px;border:1px solid #a7f3d0;">${safeCode}</span>
          </div>
          <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.5;">If you didn't request this, you can safely ignore this email — no account will be linked.</p>
        </td></tr>
        <tr><td style="padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
          <p style="margin:0;font-size:13px;color:#9ca3af;">MaxHealth Coaching &mdash; Your Personal Training Partner</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  await sendEmail(to, `Your MyPocketCoach link code: ${code}`, html);
}

export async function sendMacroApprovedEmail(
  to: string,
  name: string,
  oldCalories: number,
  newCalories: number,
  dashboardUrl: string
): Promise<void> {
  const html = buildBrandedHtml({
    heading: 'Your Macros Have Been Updated',
    name,
    body: `I've adjusted your macros based on your progress. Your daily calories have been updated from ${oldCalories} to ${newCalories}. Check your dashboard for the full breakdown.`,
    ctaText: 'View Updated Macros',
    ctaUrl: dashboardUrl,
  });

  await sendEmail(to, 'Your macros have been updated — MaxHealth Coaching', html);
}
