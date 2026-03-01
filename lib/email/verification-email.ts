// lib/email/verification-email.ts
import { getBrand } from './brand'

// ─────────────────────────────────────────────────────────────────────────────
// Shared layout wrapper — clean white/gray, no heavy color backgrounds
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
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Aptos,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f1f5f9;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);border:1px solid #e2e8f0;">

          <!-- Logo header -->
          <tr>
            <td style="padding:28px 40px 22px;background-color:#ffffff;text-align:center;border-bottom:1px solid #e2e8f0;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                style="max-width:200px;height:auto;display:inline-block;border:0;margin-bottom:8px;" />
              <div style="font-size:11px;color:#94a3b8;letter-spacing:0.5px;font-weight:600;text-transform:uppercase;">${brand.tagline}</div>
            </td>
          </tr>

          ${bodyContent}

          <!-- Footer -->
          <tr>
            <td style="padding:22px 40px 26px;background-color:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="margin:0 0 5px;color:#94a3b8;font-size:12px;line-height:1.6;">
                If you did not initiate this request, you can safely ignore this email.
              </p>
              <p style="margin:0;color:#64748b;font-size:12px;font-weight:600;">
                &copy; ${new Date().getFullYear()} ${brand.name}
              </p>
              <p style="margin:3px 0 0;color:#94a3b8;font-size:11px;">
                Minority-Owned &middot; Veteran-Owned Small Business &middot; Richmond, Virginia
              </p>
              <p style="margin:8px 0 0;font-size:12px;">
                <a href="https://precisegovcon.com/privacy" style="color:#64748b;text-decoration:none;margin-right:10px;">Privacy Policy</a>
                <a href="https://precisegovcon.com/terms" style="color:#64748b;text-decoration:none;">Terms of Service</a>
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
// Verification email
// ─────────────────────────────────────────────────────────────────────────────

export function getVerificationEmailHtml(params: {
  first_name: string
  verificationUrl: string
}) {
  const brand = getBrand()

  const body = `
          <!-- Headline -->
          <tr>
            <td style="padding:36px 40px 8px;text-align:center;">
              <h1 style="margin:0 0 10px;color:#0f172a;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                Verify Your Email Address
              </h1>
              <p style="margin:0;color:#475569;font-size:16px;line-height:1.6;">
                Hi ${params.first_name}, you are one step away from accessing ${brand.name}.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 32px;text-align:center;">
              <a href="${params.verificationUrl}"
                 style="display:inline-block;padding:15px 44px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;border-radius:10px;letter-spacing:0.2px;">
                Verify Email &amp; Start Trial &rarr;
              </a>
              <p style="margin:14px 0 0;color:#94a3b8;font-size:13px;">
                This link expires in <strong style="color:#64748b;">24 hours</strong>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#e2e8f0;"></div>
            </td>
          </tr>

          <!-- What happens next -->
          <tr>
            <td style="padding:28px 40px 8px;">
              <p style="margin:0 0 14px;color:#374151;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;">
                What happens next
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:5px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="22" valign="top" style="padding-top:2px;">
                      <div style="width:16px;height:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:50%;text-align:center;line-height:16px;font-size:10px;color:#16a34a;font-weight:800;">&#10003;</div>
                    </td>
                    <td style="padding-left:10px;color:#374151;font-size:14px;line-height:1.6;">Your email will be verified instantly</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding:5px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="22" valign="top" style="padding-top:2px;">
                      <div style="width:16px;height:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:50%;text-align:center;line-height:16px;font-size:10px;color:#16a34a;font-weight:800;">&#10003;</div>
                    </td>
                    <td style="padding-left:10px;color:#374151;font-size:14px;line-height:1.6;">Your 7-day free trial starts immediately</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding:5px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="22" valign="top" style="padding-top:2px;">
                      <div style="width:16px;height:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:50%;text-align:center;line-height:16px;font-size:10px;color:#16a34a;font-weight:800;">&#10003;</div>
                    </td>
                    <td style="padding-left:10px;color:#374151;font-size:14px;line-height:1.6;">You are automatically signed in and taken to search</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding:5px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="22" valign="top" style="padding-top:2px;">
                      <div style="width:16px;height:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:50%;text-align:center;line-height:16px;font-size:10px;color:#16a34a;font-weight:800;">&#10003;</div>
                    </td>
                    <td style="padding-left:10px;color:#374151;font-size:14px;line-height:1.6;">Start searching federal contracts right away</td>
                  </tr></table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- Feature cards -->
          <tr>
            <td style="padding:20px 40px 28px;">
              <p style="margin:0 0 14px;color:#374151;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;">
                What you get with ${brand.name}
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:0 0 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                    <tr>
                      <td style="padding:13px 14px;width:36px;vertical-align:middle;font-size:18px;text-align:center;">&#128269;</td>
                      <td style="padding:13px 16px 13px 0;vertical-align:middle;">
                        <p style="margin:0 0 2px;color:#0f172a;font-size:14px;font-weight:700;">Search 1,000+ Federal Contracts</p>
                        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">Real-time access to opportunities from SAM.gov</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0 0 8px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                    <tr>
                      <td style="padding:13px 14px;width:36px;vertical-align:middle;font-size:18px;text-align:center;">&#127919;</td>
                      <td style="padding:13px 16px 13px 0;vertical-align:middle;">
                        <p style="margin:0 0 2px;color:#0f172a;font-size:14px;font-weight:700;">Filter by Set-Asides</p>
                        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">SDVOSB, 8(a), HUBZone, WOSB &amp; more</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                         style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                    <tr>
                      <td style="padding:13px 14px;width:36px;vertical-align:middle;font-size:18px;text-align:center;">&#128276;</td>
                      <td style="padding:13px 16px 13px 0;vertical-align:middle;">
                        <p style="margin:0 0 2px;color:#0f172a;font-size:14px;font-weight:700;">Track &amp; Save Opportunities</p>
                        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">Never miss a deadline with smart notifications</p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:0 40px 28px;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;">
                <p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:600;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin:0;font-size:12px;word-break:break-all;">
                  <a href="${params.verificationUrl}" style="color:#3b82f6;text-decoration:none;">${params.verificationUrl}</a>
                </p>
              </div>
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

Verify Your Email Address

Hi ${params.first_name},

You are one step away from accessing ${brand.name}. Click the link below to verify your email and activate your 7-day free trial.

${params.verificationUrl}

This link expires in 24 hours.

What happens next:
- Your email will be verified instantly
- Your 7-day free trial starts immediately
- You are automatically signed in and taken to search
- Start searching federal contracts right away

If you did not create an account with ${brand.name}, you can safely ignore this email.

---
(c) ${new Date().getFullYear()} ${brand.name}
Minority-Owned · Veteran-Owned Small Business · Richmond, Virginia
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
          <!-- Headline -->
          <tr>
            <td style="padding:36px 40px 8px;text-align:center;">
              <h1 style="margin:0 0 10px;color:#0f172a;font-size:26px;font-weight:800;letter-spacing:-0.5px;">
                Reset Your Password
              </h1>
              <p style="margin:0;color:#475569;font-size:16px;line-height:1.6;">
                Hi ${params.first_name}, we received a request to reset your ${brand.name} password.
              </p>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td style="padding:28px 40px 32px;text-align:center;">
              <a href="${params.resetUrl}"
                 style="display:inline-block;padding:15px 44px;background:#1d4ed8;color:#ffffff;text-decoration:none;font-weight:700;font-size:16px;border-radius:10px;letter-spacing:0.2px;">
                Reset Password &rarr;
              </a>
              <p style="margin:14px 0 0;color:#94a3b8;font-size:13px;">
                This link expires in <strong style="color:#64748b;">30 minutes</strong>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="height:1px;background:#e2e8f0;"></div>
            </td>
          </tr>

          <!-- Security reminders -->
          <tr>
            <td style="padding:28px 40px 8px;">
              <p style="margin:0 0 14px;color:#374151;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.7px;">
                Security reminders
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:5px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="22" valign="top" style="padding-top:2px;">
                      <div style="width:16px;height:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:50%;text-align:center;line-height:16px;font-size:10px;color:#2563eb;font-weight:800;">&#10003;</div>
                    </td>
                    <td style="padding-left:10px;color:#374151;font-size:14px;line-height:1.6;">This link expires in <strong>30 minutes</strong></td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding:5px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="22" valign="top" style="padding-top:2px;">
                      <div style="width:16px;height:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:50%;text-align:center;line-height:16px;font-size:10px;color:#2563eb;font-weight:800;">&#10003;</div>
                    </td>
                    <td style="padding-left:10px;color:#374151;font-size:14px;line-height:1.6;">The link can only be used once</td>
                  </tr></table>
                </td></tr>
                <tr><td style="padding:5px 0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
                    <td width="22" valign="top" style="padding-top:2px;">
                      <div style="width:16px;height:16px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:50%;text-align:center;line-height:16px;font-size:10px;color:#2563eb;font-weight:800;">&#10003;</div>
                    </td>
                    <td style="padding-left:10px;color:#374151;font-size:14px;line-height:1.6;">${brand.name} will never ask for your password by email</td>
                  </tr></table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:20px 40px 16px;">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;">
                <p style="margin:0 0 6px;color:#64748b;font-size:12px;font-weight:600;">
                  Or copy and paste this link into your browser:
                </p>
                <p style="margin:0;font-size:12px;word-break:break-all;">
                  <a href="${params.resetUrl}" style="color:#3b82f6;text-decoration:none;">${params.resetUrl}</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Did not request warning -->
          <tr>
            <td style="padding:0 40px 28px;">
              <div style="background:#fefce8;border:1px solid #fde047;border-radius:8px;padding:14px 18px;text-align:center;">
                <p style="margin:0;color:#713f12;font-size:14px;font-weight:600;">
                  Did not request this? Contact
                  <a href="mailto:${brand.supportEmail}" style="color:#92400e;font-weight:700;text-decoration:underline;">${brand.supportEmail}</a>
                  immediately.
                </p>
              </div>
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
Minority-Owned · Veteran-Owned Small Business · Richmond, Virginia
`.trim()
}