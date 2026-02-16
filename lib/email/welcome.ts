// lib/email/welcome.ts
import { sendEmail } from './send'
import { getBrand } from './brand'

export async function sendWelcomeEmail(email: string, name: string) {
  const brand = getBrand()
  const firstName = name.split(' ')[0] || 'there'

  const html = getWelcomeEmailHtml(firstName)
  const text = getWelcomeEmailText(firstName)

  await sendEmail({
    to: email,
    subject: `Welcome to ${brand.name}! Your Trial is Active`,
    html,
    text,
  })
}

function getWelcomeEmailHtml(firstName: string) {
  const brand = getBrand()
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${brand.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#1e293b;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">

          <!-- Logo header -->
          <tr>
            <td style="padding:30px 40px 20px;background-color:#0f172a;text-align:center;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                style="max-width:220px;height:auto;display:inline-block;border:0;margin-bottom:8px;" />
              <div style="font-size:11px;color:#94a3b8;letter-spacing:0.3px;">${brand.tagline}</div>
            </td>
          </tr>

          <!-- Success header -->
          <tr>
            <td style="background:linear-gradient(135deg,#166534 0%,#14532d 100%);padding:36px 40px 28px;text-align:center;">
              <div style="width:72px;height:72px;margin:0 auto 16px;background:rgba(255,255,255,0.15);border-radius:18px;text-align:center;line-height:72px;font-size:36px;">
                🎉
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Your Trial is Active!
              </h1>
              <p style="margin:8px 0 0;color:#bbf7d0;font-size:15px;">Start searching federal contracts now</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;background-color:#1e293b;">
              <p style="margin:0 0 18px;color:#f1f5f9;font-size:17px;font-weight:600;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 28px;color:#cbd5e1;font-size:15px;line-height:1.7;">
                Your email is verified and your <strong style="color:#4ade80;">7-day free trial</strong> is now active! 
                You can now access all features of ${brand.name}.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <a href="${brand.appUrl}/dashboard"
                       style="display:inline-block;padding:16px 44px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;font-size:17px;border-radius:12px;box-shadow:0 8px 24px rgba(22,163,74,0.35);">
                      Go to Dashboard &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What's included -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#14532d;border:1px solid #166534;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;color:#86efac;font-size:15px;font-weight:700;">
                      What's included in your trial:
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="padding:0 0 8px;color:#dcfce7;font-size:14px;line-height:1.6;">✓ Unlimited opportunity searches</td></tr>
                      <tr><td style="padding:0 0 8px;color:#dcfce7;font-size:14px;line-height:1.6;">✓ Real-time contract alerts</td></tr>
                      <tr><td style="padding:0 0 8px;color:#dcfce7;font-size:14px;line-height:1.6;">✓ Save & track opportunities</td></tr>
                      <tr><td style="padding:0;color:#dcfce7;font-size:14px;line-height:1.6;">✓ Advanced filtering & search</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Getting started -->
              <p style="margin:0 0 12px;color:#f1f5f9;font-size:15px;font-weight:700;">
                Getting Started Tips:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr>
                  <td style="padding:0 0 12px;color:#cbd5e1;font-size:14px;line-height:1.6;">
                    1. <strong style="color:#f1f5f9;">Set up your search filters</strong> – Focus on the contracts that matter to you
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 0 12px;color:#cbd5e1;font-size:14px;line-height:1.6;">
                    2. <strong style="color:#f1f5f9;">Enable email alerts</strong> – Get notified about new opportunities
                  </td>
                </tr>
                <tr>
                  <td style="padding:0;color:#cbd5e1;font-size:14px;line-height:1.6;">
                    3. <strong style="color:#f1f5f9;">Save your favorites</strong> – Track deadlines and submission requirements
                  </td>
                </tr>
              </table>

              <!-- Support -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#1e3a5f;border:1px solid #1e40af;border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;text-align:center;">
                    <p style="margin:0 0 6px;color:#bfdbfe;font-size:14px;">
                      Need help getting started?
                    </p>
                    <p style="margin:0;color:#93c5fd;font-size:13px;">
                      Contact us at <a href="mailto:${brand.supportEmail}" style="color:#60a5fa;text-decoration:underline;">${brand.supportEmail}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;background-color:#0f172a;text-align:center;border-top:1px solid rgba(100,116,139,0.2);">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                style="max-width:140px;height:auto;display:inline-block;border:0;opacity:0.85;margin-bottom:12px;" />
              <p style="margin:0;color:#475569;font-size:12px;font-weight:600;">
                &copy; ${new Date().getFullYear()} ${brand.name}
              </p>
              <p style="margin:4px 0 0;color:#475569;font-size:11px;">
                VETERAN-OWNED Small Business &middot; Richmond, Virginia
              </p>
              <p style="margin:8px 0 0;font-size:12px;">
                <a href="https://precisegovcon.com/privacy" style="color:#64748b;text-decoration:none;">Privacy</a>
                &nbsp;&bull;&nbsp;
                <a href="https://precisegovcon.com/terms" style="color:#64748b;text-decoration:none;">Terms</a>
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

function getWelcomeEmailText(firstName: string) {
  const brand = getBrand()
  
  return `
${brand.name.toUpperCase()} — ${brand.tagline}

Your Trial is Active!

Hi ${firstName},

Your email is verified and your 7-day free trial is now active! You can now access all features of ${brand.name}.

Go to Dashboard: ${brand.appUrl}/dashboard

What's included in your trial:
✓ Unlimited opportunity searches
✓ Real-time contract alerts
✓ Save & track opportunities
✓ Advanced filtering & search

Getting Started Tips:
1. Set up your search filters – Focus on the contracts that matter to you
2. Enable email alerts – Get notified about new opportunities
3. Save your favorites – Track deadlines and submission requirements

Need help? Contact us at ${brand.supportEmail}

---
© ${new Date().getFullYear()} ${brand.name}
VETERAN-OWNED Small Business · Richmond, Virginia
`.trim()
}