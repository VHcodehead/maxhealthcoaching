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
