// lib/email/verification-email.ts
import { getBrand } from './brand'

// ─────────────────────────────────────────────────────────────────────────────
// Shared layout helpers
// ─────────────────────────────────────────────────────────────────────────────

function emailWrapper(brand: ReturnType<typeof getBrand>, bodyContent: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${brand.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0fdf4;font-family:Aptos,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdf4;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);border:1px solid #d1fae5;">

          <!-- Logo header -->
          <tr>
            <td style="padding:28px 40px 20px;background-color:#ffffff;text-align:center;border-bottom:2px solid #d1fae5;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                style="max-width:200px;height:auto;display:inline-block;border:0;margin-bottom:8px;" />
              <div style="font-size:12px;color:#059669;letter-spacing:0.3px;font-family:Aptos,'Segoe UI',sans-serif;font-weight:600;">${brand.tagline}</div>
            </td>
          </tr>

          ${bodyContent}

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;background-color:#f0fdf4;text-align:center;border-top:2px solid #d1fae5;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                style="max-width:140px;height:auto;display:inline-block;border:0;margin-bottom:12px;" />
              <p style="margin:0 0 6px;color:#6b7280;font-size:14px;line-height:1.6;font-family:Aptos,'Segoe UI',sans-serif;">
                If you did not initiate this request, you can safely ignore this email.
              </p>
              <p style="margin:0;color:#374151;font-size:13px;font-weight:700;font-family:Aptos,'Segoe UI',sans-serif;">
                &copy; ${new Date().getFullYear()} ${brand.name}
              </p>
              <p style="margin:4px 0 0;color:#6b7280;font-size:12px;font-family:Aptos,'Segoe UI',sans-serif;">
                VETERAN-OWNED Small Business &middot; Richmond, Virginia
              </p>
              <p style="margin:8px 0 0;font-size:13px;">
                <a href="https://precisegovcon.com/privacy" style="color:#059669;text-decoration:none;font-weight:600;font-family:Aptos,'Segoe UI',sans-serif;">Privacy Policy</a>
                &nbsp;&bull;&nbsp;
                <a href="https://precisegovcon.com/terms" style="color:#059669;text-decoration:none;font-weight:600;font-family:Aptos,'Segoe UI',sans-serif;">Terms of Service</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// Verification email (sent after signup)
// ─────────────────────────────────────────────────────────────────────────────

export function getVerificationEmailHtml(params: {
  first_name: string
  verificationUrl: string
}) {
  const brand = getBrand()

  const body = `
          <!-- Green accent header -->
          <tr>
            <td style="background:linear-gradient(135deg,#166534 0%,#14532d 100%);padding:36px 40px 28px;text-align:center;">
              <div style="width:72px;height:72px;margin:0 auto 16px;background:rgba(255,255,255,0.15);border-radius:18px;text-align:center;line-height:72px;font-size:36px;">
                &#9989;
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Welcome to ${brand.name}!
              </h1>
              <p style="margin:8px 0 0;color:#bbf7d0;font-size:15px;">Your account is almost ready</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;background-color:#ffffff;">
              <p style="margin:0 0 18px;color:#1e293b;font-size:18px;font-weight:700;font-family:Aptos,'Segoe UI',sans-serif;">
                Hi ${params.first_name},
              </p>
              <p style="margin:0 0 28px;color:#374151;font-size:16px;line-height:1.8;font-family:Aptos,'Segoe UI',sans-serif;">
                Thanks for signing up! Click the button below to verify your email and activate your
                <strong style="color:#059669;">7-day free trial</strong> &mdash; no credit card required.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <a href="${params.verificationUrl}"
                       style="display:inline-block;padding:16px 44px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;font-size:17px;border-radius:12px;box-shadow:0 8px 24px rgba(22,163,74,0.35);">
                      Verify Email &amp; Start Trial &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What happens next -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;color:#065f46;font-size:16px;font-weight:800;font-family:Aptos,'Segoe UI',sans-serif;">
                      What happens next:
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="padding:0 0 10px;color:#065f46;font-size:15px;line-height:1.6;font-family:Aptos,'Segoe UI',sans-serif;font-weight:500;">&#10003;&nbsp; Your email will be verified instantly</td></tr>
                      <tr><td style="padding:0 0 10px;color:#065f46;font-size:15px;line-height:1.6;font-family:Aptos,'Segoe UI',sans-serif;font-weight:500;">&#10003;&nbsp; Your 7-day free trial starts immediately</td></tr>
                      <tr><td style="padding:0 0 10px;color:#065f46;font-size:15px;line-height:1.6;font-family:Aptos,'Segoe UI',sans-serif;font-weight:500;">&#10003;&nbsp; You will be redirected to sign in</td></tr>
                      <tr><td style="padding:0;color:#065f46;font-size:15px;line-height:1.6;font-family:Aptos,'Segoe UI',sans-serif;font-weight:500;">&#10003;&nbsp; Start searching federal contracts right away</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;color:#cbd5e1;font-size:14px;font-family:Aptos,'Segoe UI',sans-serif;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;padding:16px;background:#f0fdf4;border:2px solid #86efac;border-radius:8px;color:#166534;font-size:13px;word-break:break-all;font-family:Aptos,'Segoe UI','Courier New',monospace;font-weight:600;line-height:1.6;">
                ${params.verificationUrl}
              </p>

              <!-- Expiry notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;">
                <tr>
                  <td style="padding:14px 18px;text-align:center;">
                    <p style="margin:0;color:#92400e;font-size:15px;font-weight:700;font-family:Aptos,'Segoe UI',sans-serif;">
                      &#9201; This link expires in 24 hours
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Feature cards -->
          <tr>
            <td style="padding:0 40px 36px;background-color:#ffffff;">
              <p style="margin:0 0 18px;color:#1e293b;font-size:16px;font-weight:800;text-align:center;font-family:Aptos,'Segoe UI',sans-serif;">
                What you get with ${brand.name}:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding:0 0 12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;width:44px;vertical-align:middle;font-size:22px;">&#128269;</td>
                        <td style="padding:14px 16px 14px 0;vertical-align:middle;">
                          <p style="margin:0 0 3px;color:#1e293b;font-size:14px;font-weight:700;font-family:Aptos,'Segoe UI',sans-serif;">Search 1,000+ Federal Contracts</p>
                          <p style="margin:0;color:#374151;font-size:13px;font-family:Aptos,'Segoe UI',sans-serif;">Real-time access to opportunities from SAM.gov</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="background:#14532d;border:1px solid #166534;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;width:44px;vertical-align:middle;font-size:22px;">&#127919;</td>
                        <td style="padding:14px 16px 14px 0;vertical-align:middle;">
                          <p style="margin:0 0 3px;color:#1e293b;font-size:14px;font-weight:700;font-family:Aptos,'Segoe UI',sans-serif;">Filter by Set-Asides</p>
                          <p style="margin:0;color:#374151;font-size:13px;font-family:Aptos,'Segoe UI',sans-serif;">SDVOSB, 8(a), HUBZone, WOSB &amp; more</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                           style="background:#431407;border:1px solid #9a3412;border-radius:10px;">
                      <tr>
                        <td style="padding:14px 16px;width:44px;vertical-align:middle;font-size:22px;">&#128276;</td>
                        <td style="padding:14px 16px 14px 0;vertical-align:middle;">
                          <p style="margin:0 0 3px;color:#1e293b;font-size:14px;font-weight:700;font-family:Aptos,'Segoe UI',sans-serif;">Track &amp; Save Opportunities</p>
                          <p style="margin:0;color:#374151;font-size:13px;font-family:Aptos,'Segoe UI',sans-serif;">Never miss a deadline with smart notifications</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`

  return emailWrapper(brand, body)
}

export function getVerificationEmailText(params: {
  first_name: string
  verificationUrl: string
}) {
  const brand = getBrand()
  return `
${brand.name.toUpperCase()} — ${brand.tagline}

Welcome to ${brand.name}!

Hi ${params.first_name},

Thanks for signing up! Verify your email and start your 7-day free trial:
${params.verificationUrl}

What happens next:
- Your email will be verified instantly
- Your 7-day free trial starts immediately
- You will be redirected to sign in
- Start searching federal contracts right away

This link expires in 24 hours.

If you did not create an account with ${brand.name}, you can safely ignore this email.

---
(c) ${new Date().getFullYear()} ${brand.name}
VETERAN-OWNED Small Business · Richmond, Virginia
`.trim()
}

// ─────────────────────────────────────────────────────────────────────────────
// Password reset email
// ─────────────────────────────────────────────────────────────────────────────

export function getPasswordResetEmailHtml(params: {
  first_name: string
  resetUrl: string
}) {
  const brand = getBrand()

  const body = `
          <!-- Blue accent header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1e3a5f 0%,#1e2d4f 100%);padding:36px 40px 28px;text-align:center;">
              <div style="width:72px;height:72px;margin:0 auto 16px;background:rgba(255,255,255,0.12);border-radius:18px;text-align:center;line-height:72px;font-size:36px;">
                &#128274;
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Reset Your Password
              </h1>
              <p style="margin:8px 0 0;color:#bfdbfe;font-size:15px;">
                We received a request to reset your ${brand.name} password
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;background-color:#1e293b;">
              <p style="margin:0 0 18px;color:#f1f5f9;font-size:17px;font-weight:600;">
                Hi ${params.first_name},
              </p>
              <p style="margin:0 0 28px;color:#cbd5e1;font-size:15px;line-height:1.7;">
                Click the button below to set a new password. If you did not request this,
                you can safely ignore this email &mdash; your password will not change.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <a href="${params.resetUrl}"
                       style="display:inline-block;padding:16px 44px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:17px;border-radius:12px;box-shadow:0 8px 24px rgba(37,99,235,0.35);">
                      Reset Password &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Security notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#1e3a5f;border:1px solid #1d4ed8;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;color:#93c5fd;font-size:15px;font-weight:700;">
                      Security reminders:
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="padding:0 0 8px;color:#dbeafe;font-size:14px;line-height:1.6;">&#10003;&nbsp; This link expires in <strong>30 minutes</strong></td></tr>
                      <tr><td style="padding:0 0 8px;color:#dbeafe;font-size:14px;line-height:1.6;">&#10003;&nbsp; The link can only be used once</td></tr>
                      <tr><td style="padding:0;color:#dbeafe;font-size:14px;line-height:1.6;">&#10003;&nbsp; ${brand.name} will never ask for your password by email</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Fallback link -->
              <p style="margin:0 0 8px;color:#94a3b8;font-size:13px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin:0 0 24px;padding:14px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#94a3b8;font-size:12px;word-break:break-all;font-family:'Courier New',monospace;">
                ${params.resetUrl}
              </p>

              <!-- Did not request -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#fef3c7;border:2px solid #f59e0b;border-radius:8px;">
                <tr>
                  <td style="padding:14px 18px;text-align:center;">
                    <p style="margin:0;color:#92400e;font-size:15px;font-weight:700;font-family:Aptos,'Segoe UI',sans-serif;">
                      &#9888; If you did NOT make this request, please contact
                      <a href="mailto:${brand.supportEmail}" style="color:#fbbf24;text-decoration:underline;">${brand.supportEmail}</a>
                      immediately.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>`

  return emailWrapper(brand, body)
}

export function getPasswordResetEmailText(params: {
  first_name: string
  resetUrl: string
}) {
  const brand = getBrand()
  return `
${brand.name.toUpperCase()} — ${brand.tagline}

Reset Your Password

Hi ${params.first_name},

We received a request to reset your ${brand.name} password.

Reset your password here:
${params.resetUrl}

Security reminders:
- This link expires in 30 minutes
- The link can only be used once
- ${brand.name} will never ask for your password by email

If you did NOT request this, contact ${brand.supportEmail} immediately.

---
(c) ${new Date().getFullYear()} ${brand.name}
VETERAN-OWNED Small Business · Richmond, Virginia
`.trim()
}