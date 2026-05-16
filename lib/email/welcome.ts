// lib/email/welcome.ts
import { sendEmail } from './send'
import { getBrand } from './brand'

const PLATFORM_URL  = 'https://platform.precisegovcon.com'
const MARKETING_URL = 'https://www.precisegovcon.com'

export async function sendWelcomeEmail(email: string, name: string, trialDays = 7) {
  const brand = getBrand()
  const firstName = name.split(' ')[0] || 'there'

  return sendEmail({
    to: email,
    subject: `Welcome to Precise GovCon, ${firstName} — your platform is ready`,
    html: getWelcomeEmailHtml(firstName, trialDays),
    text: getWelcomeEmailText(firstName, trialDays),
  })
}

function getWelcomeEmailHtml(firstName: string, trialDays = 7): string {
  const brand = getBrand()

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to ${brand.name}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f4f8;">
    <tr>
      <td align="center" style="padding:36px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(15,23,42,0.14);border:1px solid #e2e8f0;">

          <!-- Logo header -->
          <tr>
            <td style="padding:28px 32px 20px;background-color:#ffffff;text-align:center;border-bottom:2px solid #e2e8f0;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                   style="max-width:200px;height:auto;display:inline-block;border:0;margin-bottom:10px;" />
              <div style="font-size:13px;color:#475569;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;">${brand.tagline}</div>
            </td>
          </tr>

          <!-- Hero banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%);padding:36px 32px 30px;text-align:center;">
              <h1 style="margin:0 0 10px;color:#ffffff;font-size:30px;font-weight:900;letter-spacing:-0.3px;line-height:1.25;">
                Welcome aboard, ${firstName}!
              </h1>
              <p style="margin:0;color:#94a3b8;font-size:17px;font-weight:500;line-height:1.5;">
                Your ${trialDays}-day free trial is active and your platform is ready to use.
              </p>
            </td>
          </tr>

          <!-- Platform link highlight -->
          <tr>
            <td style="padding:28px 32px 0;background-color:#ffffff;">
              <p style="margin:0 0 16px;color:#0f172a;font-size:18px;font-weight:700;line-height:1.5;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 20px;color:#334155;font-size:16px;line-height:1.7;">
                Thank you for joining <strong style="color:#0f172a;">Precise GovCon</strong> — your dedicated platform for
                discovering, tracking, and winning government contract opportunities. We built this tool
                specifically for small businesses navigating the federal, state, and local contracting landscape.
              </p>

              <!-- Platform access box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:linear-gradient(135deg,#0f172a,#1e3a5f);border-radius:14px;margin-bottom:24px;">
                <tr>
                  <td style="padding:24px 24px;text-align:center;">
                    <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;">
                      Your Platform Login &amp; Bookmark
                    </p>
                    <p style="margin:0 0 16px;color:#ffffff;font-size:22px;font-weight:900;letter-spacing:0.5px;">
                      platform.precisegovcon.com
                    </p>
                    <a href="${PLATFORM_URL}/dashboard"
                       style="display:inline-block;padding:14px 40px;background:#16a34a;color:#ffffff;text-decoration:none;font-weight:800;font-size:17px;border-radius:10px;letter-spacing:0.2px;">
                      Go to Your Dashboard &rarr;
                    </a>
                    <p style="margin:12px 0 0;color:#64748b;font-size:12px;">
                      Bookmark this link for quick access every time you log in.
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Quick actions -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td width="48%" style="padding-right:8px;">
                    <a href="${PLATFORM_URL}/search" style="display:block;padding:14px 16px;background:#f0fdf4;border:2px solid #86efac;border-radius:10px;text-decoration:none;text-align:center;">
                      <div style="font-size:22px;margin-bottom:6px;">&#128269;</div>
                      <div style="color:#15803d;font-size:14px;font-weight:800;">Search Contracts</div>
                      <div style="color:#4ade80;font-size:12px;font-weight:600;margin-top:2px;">Start exploring now</div>
                    </a>
                  </td>
                  <td width="4%"></td>
                  <td width="48%" style="padding-left:8px;">
                    <a href="${PLATFORM_URL}/alerts" style="display:block;padding:14px 16px;background:#eff6ff;border:2px solid #93c5fd;border-radius:10px;text-decoration:none;text-align:center;">
                      <div style="font-size:22px;margin-bottom:6px;">&#128276;</div>
                      <div style="color:#1d4ed8;font-size:14px;font-weight:800;">Set Up Alerts</div>
                      <div style="color:#60a5fa;font-size:12px;font-weight:600;margin-top:2px;">Never miss an opportunity</div>
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- What's included -->
          <tr>
            <td style="padding:0 32px 24px;background-color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
                <tr>
                  <td style="padding:20px 22px;">
                    <p style="margin:0 0 14px;color:#0f172a;font-size:17px;font-weight:800;">
                      What&#39;s included in your ${trialDays}-day trial:
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr><td style="padding:0 0 10px;">
                        <table cellpadding="0" cellspacing="0" border="0"><tr>
                          <td width="24" valign="top" style="color:#16a34a;font-size:16px;padding-top:1px;">&#10003;</td>
                          <td style="color:#334155;font-size:15px;line-height:1.6;font-weight:500;">Unlimited searches across federal, state &amp; local opportunities</td>
                        </tr></table>
                      </td></tr>
                      <tr><td style="padding:0 0 10px;">
                        <table cellpadding="0" cellspacing="0" border="0"><tr>
                          <td width="24" valign="top" style="color:#16a34a;font-size:16px;padding-top:1px;">&#10003;</td>
                          <td style="color:#334155;font-size:15px;line-height:1.6;font-weight:500;">Real-time contract alerts by NAICS code, keyword &amp; agency</td>
                        </tr></table>
                      </td></tr>
                      <tr><td style="padding:0 0 10px;">
                        <table cellpadding="0" cellspacing="0" border="0"><tr>
                          <td width="24" valign="top" style="color:#16a34a;font-size:16px;padding-top:1px;">&#10003;</td>
                          <td style="color:#334155;font-size:15px;line-height:1.6;font-weight:500;">Save &amp; track opportunities — monitor deadlines in one place</td>
                        </tr></table>
                      </td></tr>
                      <tr><td style="padding:0 0 10px;">
                        <table cellpadding="0" cellspacing="0" border="0"><tr>
                          <td width="24" valign="top" style="color:#16a34a;font-size:16px;padding-top:1px;">&#10003;</td>
                          <td style="color:#334155;font-size:15px;line-height:1.6;font-weight:500;">AI-powered market insights &amp; trend analysis</td>
                        </tr></table>
                      </td></tr>
                      <tr><td style="padding:0;">
                        <table cellpadding="0" cellspacing="0" border="0"><tr>
                          <td width="24" valign="top" style="color:#16a34a;font-size:16px;padding-top:1px;">&#10003;</td>
                          <td style="color:#334155;font-size:15px;line-height:1.6;font-weight:500;">Export results to CSV / Excel for team collaboration</td>
                        </tr></table>
                      </td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Helpful tips -->
          <tr>
            <td style="padding:0 32px 28px;background-color:#ffffff;">
              <p style="margin:0 0 16px;color:#0f172a;font-size:17px;font-weight:800;">
                4 tips to get the most out of your trial:
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr><td style="padding:0 0 14px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%"
                         style="background:#f8fafc;border-left:3px solid #16a34a;border-radius:0 8px 8px 0;padding:0;">
                    <tr>
                      <td style="padding:12px 16px;">
                        <p style="margin:0 0 3px;color:#0f172a;font-size:15px;font-weight:700;">1. Filter by your NAICS codes first</p>
                        <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
                          Head to <a href="${PLATFORM_URL}/search" style="color:#16a34a;text-decoration:none;font-weight:600;">Search</a> and enter your NAICS codes to see contracts that match your specific capabilities. Saved searches run automatically and alert you to new matches.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0 0 14px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%"
                         style="background:#f8fafc;border-left:3px solid #1d4ed8;border-radius:0 8px 8px 0;">
                    <tr>
                      <td style="padding:12px 16px;">
                        <p style="margin:0 0 3px;color:#0f172a;font-size:15px;font-weight:700;">2. Turn on email alerts</p>
                        <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
                          Go to <a href="${PLATFORM_URL}/alerts" style="color:#1d4ed8;text-decoration:none;font-weight:600;">Alerts</a> and create keyword or agency-specific alerts. You&#39;ll receive a digest the moment matching opportunities are posted — no more manual checking.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0 0 14px;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%"
                         style="background:#f8fafc;border-left:3px solid #7c3aed;border-radius:0 8px 8px 0;">
                    <tr>
                      <td style="padding:12px 16px;">
                        <p style="margin:0 0 3px;color:#0f172a;font-size:15px;font-weight:700;">3. Check the Insights dashboard</p>
                        <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
                          Visit <a href="${PLATFORM_URL}/insights" style="color:#7c3aed;text-decoration:none;font-weight:600;">Insights</a> for AI-generated market trends, top agencies by spend, and set-aside breakdowns. Use this to prioritize which opportunities to pursue.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
                <tr><td style="padding:0;">
                  <table cellpadding="0" cellspacing="0" border="0" width="100%"
                         style="background:#f8fafc;border-left:3px solid #ea580c;border-radius:0 8px 8px 0;">
                    <tr>
                      <td style="padding:12px 16px;">
                        <p style="margin:0 0 3px;color:#0f172a;font-size:15px;font-weight:700;">4. Bookmark your direct platform link</p>
                        <p style="margin:0;color:#475569;font-size:13px;line-height:1.6;">
                          Save <strong>platform.precisegovcon.com</strong> to your browser bookmarks or home screen for instant access. This is your dedicated app URL — separate from the marketing site.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td></tr>
              </table>
            </td>
          </tr>

          <!-- Support box -->
          <tr>
            <td style="padding:0 32px 28px;background-color:#ffffff;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;">
                <tr>
                  <td style="padding:16px 20px;text-align:center;">
                    <p style="margin:0 0 4px;color:#15803d;font-size:15px;font-weight:700;">
                      Need help getting started?
                    </p>
                    <p style="margin:0 0 6px;color:#166534;font-size:13px;line-height:1.6;">
                      Our team responds within one business day.
                    </p>
                    <a href="mailto:${brand.supportEmail}" style="color:#16a34a;font-size:14px;font-weight:700;text-decoration:none;">
                      ${brand.supportEmail}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Trial reminder bar -->
          <tr>
            <td style="padding:14px 24px;background:#0f172a;text-align:center;">
              <p style="margin:0;color:#94a3b8;font-size:13px;font-weight:600;">
                Your ${trialDays}-day trial includes full platform access — subscribe anytime from
                <a href="${PLATFORM_URL}/account/billing" style="color:#4ade80;text-decoration:none;font-weight:700;">Account &rarr; Billing</a>
                to keep it going.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 32px;background-color:#f8fafc;text-align:center;border-top:1px solid #e2e8f0;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                   style="max-width:130px;height:auto;display:inline-block;border:0;opacity:0.85;margin-bottom:12px;" />
              <p style="margin:0 0 4px;color:#334155;font-size:13px;font-weight:700;">
                &copy; ${new Date().getFullYear()} ${brand.name} &mdash; All rights reserved.
              </p>
              <p style="margin:0 0 10px;color:#64748b;font-size:12px;font-weight:500;">
                Richmond, Virginia
              </p>
              <p style="margin:0 0 8px;font-size:12px;">
                <a href="${MARKETING_URL}/privacy" style="color:#64748b;text-decoration:none;margin:0 6px;">Privacy Policy</a>
                &bull;
                <a href="${MARKETING_URL}/terms" style="color:#64748b;text-decoration:none;margin:0 6px;">Terms of Service</a>
                &bull;
                <a href="${MARKETING_URL}/support" style="color:#64748b;text-decoration:none;margin:0 6px;">Support</a>
              </p>
              <p style="margin:0;color:#94a3b8;font-size:11px;">
                You&#39;re receiving this because you created an account at precisegovcon.com.
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

function getWelcomeEmailText(firstName: string, trialDays = 7): string {
  const brand = getBrand()

  return `
${brand.name.toUpperCase()} — ${brand.tagline}
${'─'.repeat(60)}

Welcome aboard, ${firstName}!
Your ${trialDays}-day free trial is active and your platform is ready.

Hi ${firstName},

Thank you for joining Precise GovCon — your dedicated platform for
discovering, tracking, and winning government contract opportunities.

YOUR PLATFORM LOGIN & BOOKMARK
────────────────────────────────
  platform.precisegovcon.com

  → Go to Your Dashboard:   ${PLATFORM_URL}/dashboard
  → Search Contracts:        ${PLATFORM_URL}/search
  → Set Up Alerts:           ${PLATFORM_URL}/alerts
  → Market Insights:         ${PLATFORM_URL}/insights

Save platform.precisegovcon.com to your bookmarks for quick access.

WHAT'S INCLUDED IN YOUR ${trialDays}-DAY TRIAL:
─────────────────────────────────────────────
  ✓ Unlimited searches across federal, state & local opportunities
  ✓ Real-time contract alerts by NAICS code, keyword & agency
  ✓ Save & track opportunities — monitor deadlines in one place
  ✓ AI-powered market insights & trend analysis
  ✓ Export results to CSV / Excel for team collaboration

4 TIPS TO GET THE MOST OUT OF YOUR TRIAL:
──────────────────────────────────────────
  1. Filter by your NAICS codes first
     Head to Search and enter your NAICS codes to see contracts
     that match your capabilities. Save the search to get automatic alerts.

  2. Turn on email alerts
     Go to Alerts and create keyword or agency-specific alerts. You'll
     receive a digest the moment matching opportunities are posted.

  3. Check the Insights dashboard
     Visit Insights for AI-generated market trends, top agencies by
     spend, and set-aside breakdowns to prioritize your pipeline.

  4. Bookmark your direct platform link
     Save platform.precisegovcon.com to your browser or home screen
     for instant access every time you log in.

NEED HELP?
──────────
  Email: ${brand.supportEmail}
  We respond within one business day.

Your ${trialDays}-day trial includes full access. Subscribe anytime from
Account → Billing to keep it going.

${'─'.repeat(60)}
© ${new Date().getFullYear()} ${brand.name}
Richmond, Virginia

Privacy: ${MARKETING_URL}/privacy
Terms:   ${MARKETING_URL}/terms
  `.trim()
}
