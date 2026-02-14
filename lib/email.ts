// lib/email.ts - ENHANCED WITH PRECISE GOVCON BRANDING
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// Brand config (email-safe)
const BRAND_NAME = process.env.BRAND_NAME || 'Precise GovCon'
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@precisegovcon.com'

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, '')
}

function resolveAppUrl() {
  // Prefer explicit app URL, then Vercel, then production domain fallback
  const explicit =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    ''

  if (explicit) return normalizeBaseUrl(explicit)

  const vercel = process.env.VERCEL_URL
  if (vercel) return normalizeBaseUrl(`https://${vercel}`)

  return 'https://precisegovcon.com'
}

function resolveBrandLogoUrl(appUrl: string) {
  const raw = process.env.BRAND_LOGO_URL || process.env.COMPANY_LOGO_URL || ''

  // Email clients require absolute URLs. Convert relative paths to absolute.
  if (raw) {
    if (/^https?:\/\//i.test(raw)) return raw
    if (raw.startsWith('/')) return `${appUrl}${raw}`
    return `${appUrl}/${raw}`
  }

  // Use the actual Precise GovCon logo path from public folder
  return `${appUrl}/logo.png`
}

const APP_URL = resolveAppUrl()
const BRAND_LOGO_URL = resolveBrandLogoUrl(APP_URL)

// PRECISE GOVCON BRAND COLORS
const BRAND_COLORS = {
  navy: '#1e3a4c',
  green: '#7cb342',
  orange: '#ff9800',
  lightGray: '#f5f5f5',
  white: '#ffffff',
  textDark: '#2c3e50',
  textLight: '#6b7280',
}

interface AlertEmailData {
  to: string[]
  searchName: string
  totalResults: number
  searchCriteria: Array<{ label: string; value: string }>
  topResults: Array<{
    title: string
    agency: string
    solicitationNumber?: string
    naics?: string
    responseDeadline?: string
    url: string
  }>
  csvAttachment?: {
    file_name: string
    content: string
  }
  date?: string
}

/**
 * Send enhanced alert email with Precise GovCon branding
 */
export async function sendAlertEmail({
  to,
  searchName,
  totalResults,
  searchCriteria,
  topResults,
  csvAttachment,
  date,
}: AlertEmailData) {
  try {
    const emailHtml = generateAlertEmailHtml({
      searchName,
      totalResults,
      searchCriteria,
      topResults,
      date,
    })

    const attachments = csvAttachment
      ? [
          {
            file_name: csvAttachment.file_name,
            content: csvAttachment.content,
          },
        ]
      : []

    // Use proper from address with display name to avoid default avatars
    const result = await resend.emails.send({
      from: `Precise GovCon <alerts@precisegovcon.com>`,
      to,
      subject: `${totalResults} New Opportunities: ${searchName}`,
      html: emailHtml,
      attachments,
    })

    return { success: true, result }
  } catch (error) {
    console.error('Error sending alert email:', error)
    return { success: false, error }
  }
}

function generateAlertEmailHtml({
  searchName,
  totalResults,
  searchCriteria,
  topResults,
  date,
}: {
  searchName: string
  totalResults: number
  searchCriteria: Array<{ label: string; value: string }>
  topResults: Array<{
    title: string
    agency: string
    solicitationNumber?: string
    naics?: string
    responseDeadline?: string
    url: string
  }>
  date?: string
}) {
  const formattedDate =
    date ||
    new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  // Generate criteria pills
  const criteriaPills = searchCriteria
    .filter((c) => c.value && c.value.trim().length > 0)
    .slice(0, 6)
    .map(
      (criteria) => `
        <span style="
          display: inline-block;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin: 4px 6px 4px 0;
          backdrop-filter: blur(10px);
        ">
          ${escapeHtml(criteria.label)}: ${escapeHtml(criteria.value)}
        </span>
      `,
    )
    .join('')

  // Generate top opportunities cards
  const opportunitiesHtml = topResults
    .slice(0, 10)
    .map(
      (opp, index) => `
      <div style="
        background: white;
        border-radius: 16px;
        padding: 20px;
        margin-bottom: 16px;
        border-left: 4px solid ${BRAND_COLORS.green};
        box-shadow: 0 4px 12px rgba(0,0,0,0.08);
      ">
        <h3 style="
          margin: 0 0 12px 0;
          font-size: 16px;
          font-weight: 700;
          color: ${BRAND_COLORS.textDark};
          line-height: 1.3;
        ">
          ${index + 1}. ${escapeHtml(opp.title)}
        </h3>

        <div style="margin-bottom: 12px;">
          <p style="margin: 6px 0; font-size: 13px; color: ${BRAND_COLORS.textLight};">
            <strong style="color: ${BRAND_COLORS.textDark};">Agency:</strong> ${escapeHtml(opp.agency)}
          </p>
          ${
            opp.solicitationNumber
              ? `<p style="margin: 6px 0; font-size: 13px; color: ${BRAND_COLORS.textLight};">
              <strong style="color: ${BRAND_COLORS.textDark};">Solicitation #:</strong> ${escapeHtml(
                opp.solicitationNumber,
              )}
            </p>`
              : ''
          }
          ${
            opp.naics
              ? `<p style="margin: 6px 0; font-size: 13px; color: ${BRAND_COLORS.textLight};">
              <strong style="color: ${BRAND_COLORS.textDark};">NAICS:</strong> ${escapeHtml(opp.naics)}
            </p>`
              : ''
          }
          ${
            opp.responseDeadline
              ? `<p style="margin: 6px 0; font-size: 13px; color: #dc2626;">
              <strong>⏰ Response Deadline:</strong> ${escapeHtml(opp.responseDeadline)}
            </p>`
              : ''
          }
        </div>

        <a href="${escapeHtml(opp.url)}"
           style="
             display: inline-block;
             background: ${BRAND_COLORS.navy};
             color: white;
             padding: 10px 16px;
             border-radius: 10px;
             text-decoration: none;
             font-size: 13px;
             font-weight: 600;
           ">
          View Opportunity →
        </a>
      </div>
    `,
    )
    .join('')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(searchName)} - Opportunities Alert</title>
</head>
<body style="margin: 0; padding: 0; background: ${BRAND_COLORS.lightGray}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;">
  <div style="max-width: 640px; margin: 0 auto; padding: 24px 12px;">
    <div style="background: white; border-radius: 24px; overflow: hidden; box-shadow: 0 12px 30px rgba(0,0,0,0.12);">

      <!-- Header with ONLY Precise GovCon Logo (triangular logo removed) -->
      <div style="background: linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, #2d5266 100%); padding: 40px 32px; text-align: center; border-radius: 0 0 24px 24px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width: 280px; height: auto; display: inline-block; border: 0;" />
        </div>
        <div style="background: ${BRAND_COLORS.green}; color: white; padding: 12px 20px; border-radius: 12px; display: inline-block; font-size: 12px; font-weight: 700; letter-spacing: 0.08em;">
          📊 NEW OPPORTUNITIES ALERT
        </div>
      </div>

      <!-- Content -->
      <div style="padding: 32px;">
        <h1 style="margin: 0 0 8px 0; font-size: 24px; font-weight: 800; color: ${BRAND_COLORS.textDark};">
          Good ${getTimeGreeting()}, Norman!
        </h1>
        <p style="margin: 0 0 24px 0; font-size: 15px; color: ${BRAND_COLORS.textLight}; line-height: 1.5;">
          Take a moment this weekend to explore these opportunities.
        </p>

        <!-- Summary Card -->
        <div style="background: ${BRAND_COLORS.green}; padding: 24px; border-radius: 18px; color: white; margin-bottom: 28px;">
          <div style="text-align: center; margin-bottom: 18px;">
            <div style="font-size: 46px; font-weight: 900; line-height: 1; margin-bottom: 6px;">
              ${totalResults}
            </div>
            <div style="font-size: 12px; font-weight: 800; letter-spacing: 0.12em; opacity: 0.95;">
              OPPORTUNITIES FOUND
            </div>
          </div>

          <div style="margin-bottom: 14px;">
            <div style="font-size: 12px; font-weight: 800; margin-bottom: 10px; opacity: 0.95;">
              Search Criteria
            </div>
            <div>${criteriaPills}</div>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; opacity: 0.95; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.25);">
            <div><strong>Alert Name:</strong> ${escapeHtml(searchName)}</div>
            <div>📅 ${escapeHtml(formattedDate)}</div>
          </div>
        </div>

        <!-- Top Opportunities -->
        <h2 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: ${BRAND_COLORS.textDark};">
          Top 10 Opportunities
        </h2>

        ${opportunitiesHtml}

        <!-- CTA -->
        <div style="text-align: center; margin-top: 28px; padding: 24px; background: ${BRAND_COLORS.lightGray}; border-radius: 16px;">
          <p style="margin: 0 0 16px 0; font-size: 14px; color: ${BRAND_COLORS.textLight};">
            Want to see all ${totalResults} opportunities?
          </p>
          <a href="${APP_URL}/alerts"
             style="
               display: inline-block;
               background: ${BRAND_COLORS.orange};
               color: white;
               padding: 14px 28px;
               border-radius: 12px;
               text-decoration: none;
               font-size: 14px;
               font-weight: 700;
               box-shadow: 0 6px 16px rgba(255,152,0,0.35);
             ">
            View Full Results in Dashboard →
          </a>
        </div>
      </div>

      <!-- Footer with ONLY Precise GovCon Logo -->
      <div style="background: ${BRAND_COLORS.navy}; padding: 32px; color: rgba(255,255,255,0.85); font-size: 12px; text-align: center;">
        <div style="text-align: center; margin-bottom: 24px;">
          <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width: 200px; height: auto; opacity: 0.9; display: inline-block; border: 0;" />
        </div>

        <p style="margin: 0 0 10px 0; line-height: 1.6;">
          You're receiving this email because you subscribed to opportunity alerts on ${BRAND_NAME}.
        </p>
        <p style="margin: 0 0 10px 0; line-height: 1.6;">
          Need help? Reply to this email or contact us at<br/>
          <a href="mailto:${SUPPORT_EMAIL}" style="color: ${BRAND_COLORS.green}; text-decoration: none;">${SUPPORT_EMAIL}</a>
        </p>
        <p style="margin: 18px 0 0 0; opacity: 0.65;">
          © ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.<br/>
          <span style="font-size: 11px; opacity: 0.8;">VETERAN-OWNED Small Business · Richmond, Virginia</span>
        </p>
      </div>
    </div>
  </div>
</body>
</html>`
}

// Helper functions
function escapeHtml(text?: string | null) {
  const s = String(text ?? '')
  if (!s) return ''
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getTimeGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  return 'evening'
}

/**
 * Notify support about new access requests
 */
export async function notifySupportNewAccessRequest({
  email,
  name,
  company,
  message,
}: {
  email: string
  name: string
  company?: string
  message?: string
}) {
  try {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, #2d5266 100%); padding: 24px; text-align: center; border-radius: 16px 16px 0 0;">
          <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width: 200px; height: auto; display: inline-block; border: 0;" />
        </div>
        <div style="padding: 24px; background: white; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: ${BRAND_COLORS.navy};">New Access Request</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          ${company ? `<p><strong>Company:</strong> ${escapeHtml(company)}</p>` : ''}
          ${message ? `<p><strong>Message:</strong><br/>${escapeHtml(message)}</p>` : ''}
          <hr style="margin: 24px 0;" />
          <p style="color: ${BRAND_COLORS.textLight}; font-size: 12px;">
            Sent from ${BRAND_NAME} access request form.
          </p>
        </div>
      </div>
    `

    const result = await resend.emails.send({
      from: `Precise GovCon <system@precisegovcon.com>`,
      to: SUPPORT_EMAIL,
      subject: `New Access Request from ${name}`,
      html,
    })

    return { success: true, result }
  } catch (error) {
    console.error('Error sending support notification:', error)
    return { success: false, error }
  }
}

/**
 * Trial email helpers
 */
export async function sendTrialConfirmationEmail({
  to,
  name,
  trial_ends_at,
}: {
  to: string
  name: string
  trial_ends_at: Date
}) {
  try {
    const formatted = trial_ends_at.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const html = `
      <div style="margin:0;padding:0;background:${BRAND_COLORS.lightGray};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:24px 12px;">
          <div style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.12);">
            <div style="background:linear-gradient(135deg,${BRAND_COLORS.navy} 0%, #2d5266 100%);padding:36px 28px;text-align:center;">
              <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width:260px;height:auto;margin-bottom:18px;display:inline-block;border:0;" />
              <div style="background:${BRAND_COLORS.orange};color:white;padding:10px 18px;border-radius:12px;display:inline-block;font-size:12px;font-weight:800;letter-spacing:0.10em;">
                🎉 TRIAL ACTIVATED
              </div>
            </div>

            <div style="padding:30px;">
              <h2 style="margin:0 0 10px 0;color:${BRAND_COLORS.textDark};font-size:22px;font-weight:800;">Welcome, ${escapeHtml(
                name,
              )}!</h2>
              <p style="margin:0 0 18px 0;color:${BRAND_COLORS.textLight};line-height:1.6;font-size:14px;">
                Your ${BRAND_NAME} trial is now active. You have full access to all features until <strong>${formatted}</strong>.
              </p>

              <div style="background:${BRAND_COLORS.lightGray};border-radius:16px;padding:18px;margin:18px 0;">
                <p style="margin:0;color:${BRAND_COLORS.textDark};font-weight:700;">What you can do next:</p>
                <ul style="margin:10px 0 0 18px;color:${BRAND_COLORS.textLight};line-height:1.6;font-size:14px;">
                  <li>Run advanced searches on SAM.gov opportunities</li>
                  <li>Create Saved Searches & custom alert subscriptions</li>
                  <li>Export opportunities to CSV</li>
                  <li>Use AI-powered insights to prioritize bids</li>
                </ul>
              </div>

              <div style="text-align:center;margin-top:22px;">
                <a href="${APP_URL}/dashboard"
                  style="display:inline-block;background:${BRAND_COLORS.green};color:white;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;">
                  Go to Dashboard →
                </a>
              </div>

              <p style="margin:22px 0 0 0;color:${BRAND_COLORS.textLight};font-size:12px;line-height:1.6;text-align:center;">
                Questions? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLORS.green};text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
            </div>

            <div style="background:${BRAND_COLORS.navy};padding:24px;color:rgba(255,255,255,0.85);text-align:center;font-size:12px;">
              <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width:160px;height:auto;margin-bottom:12px;opacity:0.9;display:inline-block;border:0;" />
              <p style="margin:8px 0 0 0;">© ${new Date().getFullYear()} ${BRAND_NAME}</p>
              <p style="margin:4px 0 0 0;font-size:11px;opacity:0.8;">VETERAN-OWNED Small Business · Richmond, Virginia</p>
            </div>
          </div>
        </div>
      </div>
    `

    const result = await resend.emails.send({
      from: `Precise GovCon <system@precisegovcon.com>`,
      to,
      subject: `Your ${BRAND_NAME} Trial is Active`,
      html,
    })

    return { success: true, result }
  } catch (error) {
    console.error('Error sending trial confirmation email:', error)
    return { success: false, error }
  }
}

export async function sendAdminTrialNotification({
  to,
  userEmail,
  userName,
  trial_ends_at,
}: {
  to: string
  userEmail: string
  userName: string
  trial_ends_at: Date
}) {
  try {
    const formatted = trial_ends_at.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, ${BRAND_COLORS.navy} 0%, #2d5266 100%); padding: 24px; text-align: center; border-radius: 16px 16px 0 0;">
          <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width: 200px; height: auto; display: inline-block; border: 0;" />
        </div>
        <div style="padding: 24px; background: white; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 16px 16px;">
          <h2 style="color: ${BRAND_COLORS.navy};">New Trial Started</h2>
          <p><strong>User:</strong> ${escapeHtml(userName)} (${escapeHtml(userEmail)})</p>
          <p><strong>Trial ends:</strong> ${formatted}</p>
          <p><a href="${APP_URL}/admin" style="color: ${BRAND_COLORS.green};">Open Admin Dashboard</a></p>
        </div>
      </div>
    `

    const result = await resend.emails.send({
      from: `Precise GovCon <system@precisegovcon.com>`,
      to,
      subject: `New Trial: ${userName}`,
      html,
    })

    return { success: true, result }
  } catch (error) {
    console.error('Error sending admin trial notification:', error)
    return { success: false, error }
  }
}

export async function sendTrialExpired({
  to,
  name,
}: {
  to: string
  name: string
}) {
  try {
    const html = `
      <div style="margin:0;padding:0;background:${BRAND_COLORS.lightGray};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:24px 12px;">
          <div style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.12);">
            <div style="background:linear-gradient(135deg,${BRAND_COLORS.navy} 0%, #2d5266 100%);padding:36px 28px;text-align:center;">
              <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width:260px;height:auto;margin-bottom:18px;display:inline-block;border:0;" />
              <div style="background:#dc2626;color:white;padding:10px 18px;border-radius:12px;display:inline-block;font-size:12px;font-weight:800;letter-spacing:0.10em;">
                ⏳ TRIAL ENDED
              </div>
            </div>

            <div style="padding:30px;">
              <h2 style="margin:0 0 10px 0;color:${BRAND_COLORS.textDark};font-size:22px;font-weight:800;">Hi ${escapeHtml(
                name,
              )},</h2>
              <p style="margin:0 0 18px 0;color:${BRAND_COLORS.textLight};line-height:1.6;font-size:14px;">
                Your ${BRAND_NAME} trial has ended. Upgrade now to keep receiving alerts and access advanced search features.
              </p>

              <div style="text-align:center;margin-top:22px;">
                <a href="${APP_URL}/pricing"
                  style="display:inline-block;background:${BRAND_COLORS.orange};color:white;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;">
                  Upgrade Now →
                </a>
              </div>

              <p style="margin:22px 0 0 0;color:${BRAND_COLORS.textLight};font-size:12px;line-height:1.6;text-align:center;">
                Need help choosing a plan? Email <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLORS.green};text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
            </div>

            <div style="background:${BRAND_COLORS.navy};padding:24px;color:rgba(255,255,255,0.85);text-align:center;font-size:12px;">
              <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width:160px;height:auto;margin-bottom:12px;opacity:0.9;display:inline-block;border:0;" />
              <p style="margin:8px 0 0 0;">© ${new Date().getFullYear()} ${BRAND_NAME}</p>
            </div>
          </div>
        </div>
      </div>
    `

    const result = await resend.emails.send({
      from: `Precise GovCon <system@precisegovcon.com>`,
      to,
      subject: `${BRAND_NAME} Trial Ended`,
      html,
    })

    return { success: true, result }
  } catch (error) {
    console.error('Error sending trial expired email:', error)
    return { success: false, error }
  }
}

export async function sendTrialReminder3Days({
  to,
  name,
  trial_ends_at,
}: {
  to: string
  name: string
  trial_ends_at: Date
}) {
  try {
    const formatted = trial_ends_at.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    const html = `
      <div style="margin:0;padding:0;background:${BRAND_COLORS.lightGray};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:24px 12px;">
          <div style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.12);">
            <div style="background:linear-gradient(135deg,${BRAND_COLORS.navy} 0%, #2d5266 100%);padding:36px 28px;text-align:center;">
              <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width:260px;height:auto;margin-bottom:18px;display:inline-block;border:0;" />
              <div style="background:${BRAND_COLORS.green};color:white;padding:10px 18px;border-radius:12px;display:inline-block;font-size:12px;font-weight:800;letter-spacing:0.10em;">
                🔔 TRIAL REMINDER
              </div>
            </div>

            <div style="padding:30px;">
              <h2 style="margin:0 0 10px 0;color:${BRAND_COLORS.textDark};font-size:22px;font-weight:800;">Hi ${escapeHtml(
                name,
              )},</h2>
              <p style="margin:0 0 18px 0;color:${BRAND_COLORS.textLight};line-height:1.6;font-size:14px;">
                Just a reminder — your ${BRAND_NAME} trial ends in <strong>3 days</strong> on <strong>${formatted}</strong>.
              </p>
              <p style="margin:0 0 18px 0;color:${BRAND_COLORS.textLight};line-height:1.6;font-size:14px;">
                Upgrade now to keep your Saved Searches, Alert Subscriptions, exports, and insights uninterrupted.
              </p>

              <div style="text-align:center;margin-top:22px;">
                <a href="${APP_URL}/pricing"
                  style="display:inline-block;background:${BRAND_COLORS.orange};color:white;padding:12px 22px;border-radius:12px;text-decoration:none;font-weight:800;font-size:14px;">
                  View Plans & Upgrade →
                </a>
              </div>

              <p style="margin:22px 0 0 0;color:${BRAND_COLORS.textLight};font-size:12px;line-height:1.6;text-align:center;">
                Questions? Email <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLORS.green};text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
            </div>

            <div style="background:${BRAND_COLORS.navy};padding:24px;color:rgba(255,255,255,0.85);text-align:center;font-size:12px;">
              <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width:160px;height:auto;margin-bottom:12px;opacity:0.9;display:inline-block;border:0;" />
              <p style="margin:8px 0 0 0;">© ${new Date().getFullYear()} ${BRAND_NAME}</p>
            </div>
          </div>
        </div>
      </div>
    `

    const result = await resend.emails.send({
      from: `Precise GovCon <system@precisegovcon.com>`,
      to,
      subject: `Your ${BRAND_NAME} Trial Ends in 3 Days`,
      html,
    })

    return { success: true, result }
  } catch (error) {
    console.error('Error sending trial reminder email:', error)
    return { success: false, error }
  }
}

/**
 * Send confirmation email to user when they request access
 */
export async function sendAccessRequestConfirmation({
  to,
  name,
  company,
}: {
  to: string
  name: string
  company?: string
}) {
  try {
    const html = `
      <div style="margin:0;padding:0;background:${BRAND_COLORS.lightGray};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
        <div style="max-width:640px;margin:0 auto;padding:24px 12px;">
          <div style="background:white;border-radius:24px;overflow:hidden;box-shadow:0 12px 30px rgba(0,0,0,0.12);">
            <div style="background:linear-gradient(135deg,${BRAND_COLORS.navy} 0%, #2d5266 100%);padding:36px 28px;text-align:center;">
              <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width:260px;height:auto;margin-bottom:18px;display:inline-block;border:0;" />
              <div style="background:${BRAND_COLORS.green};color:white;padding:10px 18px;border-radius:12px;display:inline-block;font-size:12px;font-weight:800;letter-spacing:0.10em;">
                ✅ ACCESS REQUEST RECEIVED
              </div>
            </div>

            <div style="padding:30px;">
              <h2 style="margin:0 0 10px 0;color:${BRAND_COLORS.textDark};font-size:22px;font-weight:800;">Thank you, ${escapeHtml(
                name,
              )}!</h2>
              <p style="margin:0 0 18px 0;color:${BRAND_COLORS.textLight};line-height:1.6;font-size:14px;">
                We've received your access request for ${BRAND_NAME}. Our team will review your request and get back to you within 1-2 business days.
              </p>
              
              ${company ? `<p style="margin:0 0 18px 0;color:${BRAND_COLORS.textLight};line-height:1.6;font-size:14px;"><strong>Company:</strong> ${escapeHtml(company)}</p>` : ''}

              <div style="background:${BRAND_COLORS.lightGray};border-radius:16px;padding:18px;margin:18px 0;">
                <p style="margin:0 0 10px 0;color:${BRAND_COLORS.textDark};font-weight:700;">What happens next?</p>
                <ul style="margin:10px 0 0 18px;color:${BRAND_COLORS.textLight};line-height:1.6;font-size:14px;">
                  <li>Our team reviews your request</li>
                  <li>We'll email you with next steps</li>
                  <li>You'll get access to your free trial</li>
                  <li>Start finding government contracts that match your business</li>
                </ul>
              </div>

              <p style="margin:22px 0 0 0;color:${BRAND_COLORS.textLight};font-size:12px;line-height:1.6;text-align:center;">
                Questions? Contact <a href="mailto:${SUPPORT_EMAIL}" style="color:${BRAND_COLORS.green};text-decoration:none;">${SUPPORT_EMAIL}</a>
              </p>
            </div>

            <div style="background:${BRAND_COLORS.navy};padding:24px;color:rgba(255,255,255,0.85);text-align:center;font-size:12px;">
              <img src="${BRAND_LOGO_URL}" alt="${BRAND_NAME}" style="max-width:160px;height:auto;margin-bottom:12px;opacity:0.9;display:inline-block;border:0;" />
              <p style="margin:8px 0 0 0;">© ${new Date().getFullYear()} ${BRAND_NAME}</p>
            </div>
          </div>
        </div>
      </div>
    `

    const result = await resend.emails.send({
      from: `Precise GovCon <access@precisegovcon.com>`,
      to,
      subject: `Your ${BRAND_NAME} Access Request Has Been Received`,
      html,
    })

    return { success: true, result }
  } catch (error) {
    console.error('Error sending access request confirmation email:', error)
    return { success: false, error }
  }
}