// lib/email/sequence/day-5-midtrial.ts
import { sendEmail } from '../send'
import { getBrand } from '../brand'

export async function sendMidTrialEmail(email: string, name: string): Promise<void> {
  const brand = getBrand()
  const firstName = name.split(' ')[0] || 'there'

  await sendEmail({
    to: email,
    subject: `Halfway through your trial, ${firstName}! 🎯 Here's what you might be missing...`,
    html: getMidTrialEmailHtml(firstName),
    text: getMidTrialEmailText(firstName),
  })
}

function getMidTrialEmailHtml(firstName: string): string {
  const brand = getBrand()
  const appUrl = brand.appUrl

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Halfway through your trial</title>
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

          <!-- Hero banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#f97316 0%,#f59e0b 100%);padding:36px 40px 28px;text-align:center;">
              <div style="width:72px;height:72px;margin:0 auto 16px;background:rgba(255,255,255,0.15);border-radius:18px;text-align:center;line-height:72px;font-size:36px;">
                ⏳
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                Halfway there, ${firstName}!
              </h1>
              <p style="margin:8px 0 0;color:#fed7aa;font-size:15px;">
                You have 3 days left in your free trial.
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
                You're already discovering federal opportunities with Precise GovCon! Before your trial ends,
                here are the most powerful features that help contractors win more contracts:
              </p>

              <!-- Feature highlights -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#14532d;border:1px solid #166534;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 16px;color:#86efac;font-size:15px;font-weight:700;">
                      Top features contractors love:
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="padding:0 0 12px;"><strong style="color:#dcfce7;font-size:14px;">📧 Email Alerts</strong><br><span style="color:#cbd5e1;font-size:13px;">Get instant notifications when new opportunities match your NAICS codes</span></td></tr>
                      <tr><td style="padding:0 0 12px;"><strong style="color:#dcfce7;font-size:14px;">💾 Saved Searches</strong><br><span style="color:#cbd5e1;font-size:13px;">Save your best search filters and run them again instantly</span></td></tr>
                      <tr><td style="padding:0 0 12px;"><strong style="color:#dcfce7;font-size:14px;">📊 Advanced Filtering</strong><br><span style="color:#cbd5e1;font-size:13px;">Filter by set-asides, agency, deadline, and more</span></td></tr>
                      <tr><td style="padding:0;"><strong style="color:#dcfce7;font-size:14px;">📥 CSV Export</strong><br><span style="color:#cbd5e1;font-size:13px;">Export search results directly to your CRM or spreadsheet</span></td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <a href="${appUrl}/search"
                       style="display:inline-block;padding:16px 48px;background:#f97316;color:#ffffff;text-decoration:none;font-weight:700;font-size:17px;border-radius:12px;box-shadow:0 8px 24px rgba(249,115,22,0.35);">
                      Explore Premium Features &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.6;font-style:italic;">
                Your trial ends in 3 days. After that, you can subscribe to continue using Precise GovCon — or
                <a href="${appUrl}/pricing" style="color:#f97316;text-decoration:none;">check out our pricing plans</a> to see which tier fits your team best.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;background-color:#0f172a;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#64748b;font-size:12px;">
                Hi, this is Precise GovCon. You're getting this email because your trial is active.
                <br><a href="${appUrl}/account" style="color:#f97316;text-decoration:none;">Manage preferences</a>
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

function getMidTrialEmailText(firstName: string): string {
  return `
Halfway there, ${firstName}!

You have 3 days left in your free trial.

Hi ${firstName},

You're already discovering federal opportunities with Precise GovCon! Before your trial ends, here are the most powerful features:

📧 EMAIL ALERTS
Get instant notifications when new opportunities match your NAICS codes

💾 SAVED SEARCHES
Save your best search filters and run them again instantly

📊 ADVANCED FILTERING
Filter by set-asides, agency, deadline, and more

📥 CSV EXPORT
Export search results directly to your CRM or spreadsheet

Your trial ends in 3 days. After that, you can subscribe to continue using Precise GovCon.

Explore Premium Features: ${process.env.NEXTAUTH_URL || 'https://precisegovcon.com'}/search
Check our pricing: ${process.env.NEXTAUTH_URL || 'https://precisegovcon.com'}/pricing

—
Precise GovCon
${process.env.SUPPORT_EMAIL || 'support@precisegovcon.com'}
  `
}
