// lib/email/welcome.ts
import { sendEmail } from './send'
import { getBrand } from './brand'

export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  const brand = getBrand()
  const firstName = name.split(' ')[0] || 'there'

  await sendEmail({
    to: email,
    subject: `You're in, ${firstName}! Your Precise GovCon trial is active 🚀`,
    html: getWelcomeEmailHtml(firstName),
    text: getWelcomeEmailText(firstName),
  })
}

function getWelcomeEmailHtml(firstName: string): string {
  const brand = getBrand()
  const appUrl = brand.appUrl

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
            <td style="background:linear-gradient(135deg,#166534 0%,#14532d 100%);padding:36px 40px 28px;text-align:center;">
              <div style="width:72px;height:72px;margin:0 auto 16px;background:rgba(255,255,255,0.15);border-radius:18px;text-align:center;line-height:72px;font-size:36px;">
                🚀
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                You're in, ${firstName}!
              </h1>
              <p style="margin:8px 0 0;color:#bbf7d0;font-size:15px;">
                Your 7-day free trial is now active — no credit card required.
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
                Welcome to <strong style="color:#ffffff;">Precise GovCon</strong> — your all-in-one platform for finding,
                tracking, and winning government contract opportunities. Your email is verified and your
                <strong style="color:#4ade80;">7-day free trial</strong> is live. Start exploring now.
              </p>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 32px;">
                    <a href="${appUrl}/search"
                       style="display:inline-block;padding:16px 48px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:700;font-size:17px;border-radius:12px;box-shadow:0 8px 24px rgba(22,163,74,0.35);">
                      Start Searching Now &rarr;
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
                      <tr><td style="padding:0 0 8px;color:#dcfce7;font-size:14px;line-height:1.6;">&#10003; Unlimited opportunity searches across federal, state &amp; local</td></tr>
                      <tr><td style="padding:0 0 8px;color:#dcfce7;font-size:14px;line-height:1.6;">&#10003; Real-time contract alerts by NAICS code, keyword &amp; agency</td></tr>
                      <tr><td style="padding:0 0 8px;color:#dcfce7;font-size:14px;line-height:1.6;">&#10003; Save &amp; track opportunities through your pipeline</td></tr>
                      <tr><td style="padding:0 0 8px;color:#dcfce7;font-size:14px;line-height:1.6;">&#10003; Export results to CSV / Excel</td></tr>
                      <tr><td style="padding:0;color:#dcfce7;font-size:14px;line-height:1.6;">&#10003; Advanced filtering &amp; saved searches</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Getting started steps -->
              <p style="margin:0 0 14px;color:#f1f5f9;font-size:15px;font-weight:700;">
                3 things to do right now:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr><td style="padding:0 0 12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="28" valign="top" style="color:#4ade80;font-size:15px;font-weight:800;padding-top:1px;">1.</td>
                      <td style="color:#cbd5e1;font-size:14px;line-height:1.6;"><strong style="color:#f1f5f9;">Set up your NAICS code filters</strong> — focus on contracts that match your capabilities</td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0 0 12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="28" valign="top" style="color:#4ade80;font-size:15px;font-weight:800;padding-top:1px;">2.</td>
                      <td style="color:#cbd5e1;font-size:14px;line-height:1.6;"><strong style="color:#f1f5f9;">Enable email alerts</strong> — get notified the moment new matching opportunities are posted</td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="28" valign="top" style="color:#4ade80;font-size:15px;font-weight:800;padding-top:1px;">3.</td>
                      <td style="color:#cbd5e1;font-size:14px;line-height:1.6;"><strong style="color:#f1f5f9;">Save your first opportunity</strong> — track deadlines and submission requirements</td>
                    </tr>
                  </table>
                </td></tr>
              </table>

              <!-- VOSB callout -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:linear-gradient(135deg,#1e1b4b,#312e81);border:1px solid #4338ca;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 22px;text-align:center;">
                    <p style="margin:0 0 4px;color:#c7d2fe;font-size:14px;font-weight:700;">
                      &#127482;&#127480; Built for businesses like yours
                    </p>
                    <p style="margin:0;color:#a5b4fc;font-size:13px;line-height:1.6;">
                      Precise GovCon is a Minority-Owned, Veteran-Owned Small Business based in Richmond, Virginia —
                      we understand the contracting landscape because we operate in it.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Support box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#1e3a5f;border:1px solid #1e40af;border-radius:8px;">
                <tr>
                  <td style="padding:16px 20px;text-align:center;">
                    <p style="margin:0 0 6px;color:#bfdbfe;font-size:14px;">
                      Questions? We typically respond within one business day.
                    </p>
                    <p style="margin:0;color:#93c5fd;font-size:13px;">
                      <a href="mailto:${brand.supportEmail}" style="color:#60a5fa;text-decoration:underline;">${brand.supportEmail}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Trial reminder bar -->
          <tr>
            <td style="padding:16px 40px;background:#0c1a0c;border-top:1px solid #14532d;text-align:center;">
              <p style="margin:0;color:#86efac;font-size:13px;font-weight:600;">
                &#9200; Your 7-day trial gives you full access — subscribe any time from account settings to keep it going.
              </p>
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
                Minority-Owned &middot; Veteran-Owned Small Business &middot; Richmond, Virginia
              </p>
              <p style="margin:8px 0 0;font-size:12px;">
                <a href="https://precisegovcon.com/privacy" style="color:#64748b;text-decoration:none;">Privacy</a>
                &nbsp;&bull;&nbsp;
                <a href="https://precisegovcon.com/terms" style="color:#64748b;text-decoration:none;">Terms</a>
              </p>
              <p style="margin:8px 0 0;color:#334155;font-size:11px;">
                You're receiving this because you created an account at precisegovcon.com.
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

function getWelcomeEmailText(firstName: string): string {
  const brand = getBrand()
  const appUrl = brand.appUrl

  return `
${brand.name.toUpperCase()} — ${brand.tagline}

You're in, ${firstName}! Your 7-day free trial is now active.

Hi ${firstName},

Welcome to Precise GovCon — your all-in-one platform for finding, tracking, and winning government contract opportunities. Your email is verified and your 7-day free trial is live.

Start searching now: ${appUrl}/search

WHAT'S INCLUDED IN YOUR TRIAL:
- Unlimited opportunity searches across federal, state & local
- Real-time contract alerts by NAICS code, keyword & agency
- Save & track opportunities through your pipeline
- Export results to CSV / Excel
- Advanced filtering & saved searches

3 THINGS TO DO RIGHT NOW:
1. Set up your NAICS code filters — focus on contracts that match your capabilities
2. Enable email alerts — get notified the moment new matching opportunities are posted
3. Save your first opportunity — track deadlines and submission requirements

Your 7-day trial gives you full access. Subscribe any time from account settings to keep it going.

Questions? Email us at ${brand.supportEmail} — we respond within one business day.

---
© ${new Date().getFullYear()} ${brand.name}
Minority-Owned · Veteran-Owned Small Business · Richmond, Virginia
https://precisegovcon.com
  `.trim()
}