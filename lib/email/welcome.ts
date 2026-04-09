// lib/email/welcome.ts
import { sendEmail } from './send'
import { getBrand } from './brand'

const LIVE_SITE_URL = 'https://www.precisegovcon.com'

export async function sendWelcomeEmail(email: string, name: string) {
  const brand = getBrand()
  const firstName = name.split(' ')[0] || 'there'

  return sendEmail({
    to: email,
    subject: `You're in, ${firstName}! Your Precise GovCon trial is active 🚀`,
    html: getWelcomeEmailHtml(firstName),
    text: getWelcomeEmailText(firstName),
  })
}

function resolveWelcomeAppUrl(rawUrl: string): string {
  const candidate = (rawUrl || '').trim()
  if (!candidate) return LIVE_SITE_URL

  try {
    const parsed = new URL(candidate)
    const host = parsed.hostname.toLowerCase()
    if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host.endsWith('.local')) {
      return LIVE_SITE_URL
    }
    return `${parsed.protocol}//${parsed.host}`.replace(/\/$/, '')
  } catch {
    if (candidate.includes('localhost') || candidate.includes('127.0.0.1')) {
      return LIVE_SITE_URL
    }
    return candidate.replace(/\/$/, '')
  }
}

function getDomainLabel(appUrl: string): string {
  try {
    return new URL(appUrl).hostname
  } catch {
    return appUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '')
  }
}

function getWelcomeEmailHtml(firstName: string): string {
  const brand = getBrand()
  const appUrl = resolveWelcomeAppUrl(brand.appUrl)
  const domainLabel = getDomainLabel(appUrl)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${brand.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef6ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#eef6ff;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:22px;overflow:hidden;box-shadow:0 16px 40px rgba(15,23,42,0.18);border:1px solid #bfdbfe;">

          <!-- Logo header -->
          <tr>
            <td style="padding:24px 28px 16px;background-color:#ffffff;text-align:center;border-bottom:1px solid #dbeafe;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                   style="max-width:220px;height:auto;display:inline-block;border:0;margin-bottom:8px;" />
              <div style="font-size:13px;color:#334155;font-weight:600;letter-spacing:0.2px;">${brand.tagline}</div>
            </td>
          </tr>

          <!-- Hero banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#22c55e 0%,#16a34a 100%);padding:30px 28px 26px;text-align:center;">
              <div style="width:74px;height:74px;margin:0 auto 14px;background:#dcfce7;border-radius:18px;text-align:center;line-height:74px;font-size:34px;">
                🚀
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:34px;font-weight:900;letter-spacing:-0.4px;line-height:1.2;">
                You're in, ${firstName}!
              </h1>
              <p style="margin:8px 0 0;color:#f0fdf4;font-size:18px;font-weight:700;line-height:1.4;">
                Your 7-day free trial is now active — no credit card required.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:30px 28px 24px;background-color:#ffffff;">
              <p style="margin:0 0 14px;color:#0f172a;font-size:23px;font-weight:800;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 24px;color:#1e293b;font-size:18px;line-height:1.65;font-weight:500;">
                Welcome to <strong style="color:#0f172a;">Precise GovCon</strong> — your all-in-one platform for finding,
                tracking, and winning government contract opportunities. Your email is verified and your
                <strong style="color:#15803d;">7-day free trial</strong> is live. Start exploring now.
              </p>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 24px;">
                    <a href="${appUrl}/search"
                       style="display:inline-block;padding:16px 42px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:800;font-size:20px;border-radius:12px;box-shadow:0 8px 20px rgba(22,163,74,0.25);">
                      Start Searching Now &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- What's included -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;margin-bottom:24px;">
                <tr>
                  <td style="padding:18px 18px;">
                    <p style="margin:0 0 12px;color:#14532d;font-size:20px;font-weight:800;">
                      What's included in your trial:
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="padding:0 0 8px;color:#14532d;font-size:16px;line-height:1.65;font-weight:600;">&#10003; Unlimited opportunity searches across federal, state &amp; local</td></tr>
                      <tr><td style="padding:0 0 8px;color:#14532d;font-size:16px;line-height:1.65;font-weight:600;">&#10003; Real-time contract alerts by NAICS code, keyword &amp; agency</td></tr>
                      <tr><td style="padding:0 0 8px;color:#14532d;font-size:16px;line-height:1.65;font-weight:600;">&#10003; Save &amp; track opportunities through your pipeline</td></tr>
                      <tr><td style="padding:0 0 8px;color:#14532d;font-size:16px;line-height:1.65;font-weight:600;">&#10003; Export results to CSV / Excel</td></tr>
                      <tr><td style="padding:0;color:#14532d;font-size:16px;line-height:1.65;font-weight:600;">&#10003; Advanced filtering &amp; saved searches</td></tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Getting started steps -->
              <p style="margin:0 0 10px;color:#0f172a;font-size:20px;font-weight:800;">
                3 things to do right now:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:22px;">
                <tr><td style="padding:0 0 12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="30" valign="top" style="color:#16a34a;font-size:19px;font-weight:900;padding-top:1px;">1.</td>
                      <td style="color:#1e293b;font-size:17px;line-height:1.65;"><strong style="color:#0f172a;">Set up your NAICS code filters</strong> — focus on contracts that match your capabilities</td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0 0 12px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="30" valign="top" style="color:#16a34a;font-size:19px;font-weight:900;padding-top:1px;">2.</td>
                      <td style="color:#1e293b;font-size:17px;line-height:1.65;"><strong style="color:#0f172a;">Enable email alerts</strong> — get notified the moment new matching opportunities are posted</td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                    <tr>
                      <td width="30" valign="top" style="color:#16a34a;font-size:19px;font-weight:900;padding-top:1px;">3.</td>
                      <td style="color:#1e293b;font-size:17px;line-height:1.65;"><strong style="color:#0f172a;">Save your first opportunity</strong> — track deadlines and submission requirements</td>
                    </tr>
                  </table>
                </td></tr>
              </table>

              <!-- VOSB callout -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:linear-gradient(135deg,#eff6ff,#dbeafe);border:2px solid #93c5fd;border-radius:12px;margin-bottom:22px;">
                <tr>
                  <td style="padding:16px 16px;text-align:center;">
                    <p style="margin:0 0 4px;color:#1d4ed8;font-size:18px;font-weight:800;">
                      &#127482;&#127480; Built for businesses like yours
                    </p>
                    <p style="margin:0;color:#1e3a8a;font-size:15px;line-height:1.65;font-weight:600;">
                      Precise GovCon is a Minority-Owned, Veteran-Owned Small Business based in Richmond, Virginia —
                      we understand the contracting landscape because we operate in it.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Support box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#eff6ff;border:2px solid #93c5fd;border-radius:10px;">
                <tr>
                  <td style="padding:16px 16px;text-align:center;">
                    <p style="margin:0 0 6px;color:#1e3a8a;font-size:16px;font-weight:700;">
                      Questions? We typically respond within one business day.
                    </p>
                    <p style="margin:0;color:#1d4ed8;font-size:16px;font-weight:700;">
                      <a href="mailto:${brand.supportEmail}" style="color:#1d4ed8;text-decoration:underline;">${brand.supportEmail}</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Trial reminder bar -->
          <tr>
            <td style="padding:14px 20px;background:#dcfce7;border-top:1px solid #86efac;text-align:center;">
              <p style="margin:0;color:#14532d;font-size:15px;font-weight:700;">
                &#9200; Your 7-day trial gives you full access — subscribe any time from account settings to keep it going.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 20px;background-color:#f8fafc;text-align:center;border-top:1px solid #dbeafe;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                   style="max-width:140px;height:auto;display:inline-block;border:0;opacity:0.9;margin-bottom:10px;" />
              <p style="margin:0;color:#334155;font-size:13px;font-weight:700;">
                &copy; ${new Date().getFullYear()} ${brand.name}
              </p>
              <p style="margin:4px 0 0;color:#475569;font-size:12px;font-weight:600;">
                Minority-Owned &middot; Veteran-Owned Small Business &middot; Richmond, Virginia
              </p>
              <p style="margin:8px 0 0;font-size:13px;font-weight:700;">
                <a href="${appUrl}/privacy" style="color:#334155;text-decoration:none;">Privacy</a>
                &nbsp;&bull;&nbsp;
                <a href="${appUrl}/terms" style="color:#334155;text-decoration:none;">Terms</a>
              </p>
              <p style="margin:8px 0 0;color:#64748b;font-size:12px;font-weight:600;">
                You're receiving this because you created an account at ${domainLabel}.
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
  const appUrl = resolveWelcomeAppUrl(brand.appUrl)

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
${appUrl}
  `.trim()
}
