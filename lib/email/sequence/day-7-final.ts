// lib/email/sequence/day-7-final.ts
import { sendEmail } from '../send'
import { getBrand } from '../brand'

export async function sendFinalChanceEmail(email: string, name: string): Promise<void> {
  const brand = getBrand()
  const firstName = name.split(' ')[0] || 'there'

  await sendEmail({
    to: email,
    subject: `Last 24 hours, ${firstName}! ⏰ Claim your 50% discount before it's gone`,
    html: getFinalChanceEmailHtml(firstName),
    text: getFinalChanceEmailText(firstName),
  })
}

function getFinalChanceEmailHtml(firstName: string): string {
  const brand = getBrand()
  const appUrl = brand.appUrl

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>⏰ Your trial ends tonight!</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#1e293b;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">

          <!-- Logo header -->
          <tr>
            <td style="padding:30px 40px 20px;background-color:#0f172a;text-align:center;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                   style="max-width:220px;height:auto;display:inline-block;border:0;margin-bottom:8px;" />
              <div style="font-size:11px;color:#94a3b8;letter-spacing:0.3px;">${brand.tagline}</div>
            </td>
          </tr>

          <!-- URGENT Hero banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#dc2626 0%,#b91c1c 100%);padding:36px 40px 28px;text-align:center;">
              <div style="width:72px;height:72px;margin:0 auto 16px;background:rgba(255,255,255,0.15);border-radius:18px;text-align:center;line-height:72px;font-size:36px;">
                ⏰
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Your trial ends tonight!
              </h1>
              <p style="margin:8px 0 0;color:#fecaca;font-size:15px;">
                But you can lock in 50% off your first month right now.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;background-color:#1e293b;">
              <p style="margin:0 0 18px;color:#f1f5f9;font-size:17px;font-weight:600;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 28px;color:#cbd5e1;font-size:15px;line-height:1.7;">
                Your Precise GovCon trial expires <strong>tonight at 10 PM</strong>. If you've found value in the platform,
                now's the time to upgrade and keep winning federal contracts — or you'll lose access.
              </p>

              <!-- Discount box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:linear-gradient(135deg,#fca5a5 0%,#fecaca 100%);border:2px solid #dc2626;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:28px 24px;text-align:center;">
                    <p style="margin:0 0 12px;color:#7f1d1d;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                      Limited-time offer
                    </p>
                    <p style="margin:0 0 12px;color:#991b1b;font-size:42px;font-weight:900;">
                      50% OFF
                    </p>
                    <p style="margin:0 0 16px;color:#7f1d1d;font-size:14px;">
                      First month of any plan
                      <br><span style="font-size:12px;">Expires tonight at 10 PM</span>
                    </p>
                    <p style="margin:0;color:#7f1d1d;font-size:12px;font-family:monospace;font-weight:700;letter-spacing:1px;">
                      CODE: TRIAL50
                    </p>
                  </td>
                </tr>
              </table>

              <!-- What you'll lose -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#14532d;border:1px solid #166534;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 14px;color:#86efac;font-size:15px;font-weight:700;">
                      ✓ Keep access to:
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="padding:0 0 8px;color:#dcfce7;font-size:14px;">• Unlimited opportunity searches</td></tr>
                      <tr><td style="padding:0 0 8px;color:#dcfce7;font-size:14px;">• Real-time email alerts</td></tr>
                      <tr><td style="padding:0 0 8px;color:#dcfce7;font-size:14px;">• Saved searches &amp; saved opportunities</td></tr>
                      <tr><td style="padding:0;color:#dcfce7;font-size:14px;">• CSV export for your team</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 16px;">
                    <a href="${appUrl}/pricing"
                       style="display:inline-block;padding:16px 48px;background:#dc2626;color:#ffffff;text-decoration:none;font-weight:700;font-size:17px;border-radius:12px;box-shadow:0 8px 24px rgba(220,38,38,0.35);">
                      Claim 50% Discount Now &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;line-height:1.6;text-align:center;">
                At $24.99/month (Basic plan), you'll pay just <strong>$12.49</strong> for your first month.<br>
                Professional plan: just <strong>$24.50</strong> instead of $49.
              </p>

              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;">
                Questions? Our team is here to help. Reply to this email or contact
                <a href="mailto:${brand.supportEmail}" style="color:#16a34a;text-decoration:none;">${brand.supportEmail}</a>.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;background-color:#0f172a;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#64748b;font-size:12px;">
                Offer expires tonight at 10 PM EST.
                <br><a href="${appUrl}/account" style="color:#f97316;text-decoration:none;">Manage email preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

function getFinalChanceEmailText(firstName: string): string {
  const brand = getBrand()
  return `
⏰ Your trial ends tonight!

But you can lock in 50% off your first month right now.

Hi ${firstName},

Your Precise GovCon trial expires TONIGHT at 10 PM. If you've found value in the platform, now's the time to upgrade and keep winning federal contracts.

LIMITED-TIME OFFER
50% OFF your first month of any plan
Code: TRIAL50 (expires tonight at 10 PM)

KEEP ACCESS TO:
✓ Unlimited opportunity searches
✓ Real-time email alerts
✓ Saved searches & saved opportunities
✓ CSV export for your team

PRICING WITH YOUR 50% DISCOUNT:
- Basic: $12.49/month (was $24.99)
- Professional: $24.50/month (was $49)
- Enterprise: $99.50/month (was $199)

Claim your discount now: ${brand.appUrl}/pricing

Questions? Contact us at ${brand.supportEmail}

—
Precise GovCon
Offer expires tonight at 10 PM EST
  `
}
