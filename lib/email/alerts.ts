// lib/email/alerts.ts
import { sendEmail } from './send'
import { generateExcelBinary } from '@/lib/export'

export interface AlertEmailData {
  to: string | string[]
  alertName: string
  resultCount: number
  results: any[]
  alert_id: string
  frequency: string
  recipientName?: string
}

function normalizeRecipients(to: string | string[]): string[] {
  const out: string[] = []

  const add = (v: any) => {
    if (!v) return
    if (Array.isArray(v)) {
      v.forEach(add)
      return
    }
    if (typeof v === 'string') {
      v.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((e) => out.push(e))
    }
  }

  add(to)
  return Array.from(new Set(out))
}

// Returns "Good morning", "Good afternoon", or "Good evening" based on current Eastern time
function getTimeOfDayGreeting(): string {
  const now = new Date()
  const eastern = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  const hour = eastern.getHours()

  if (hour >= 5 && hour < 12) return 'Good morning'
  if (hour >= 12 && hour < 17) return 'Good afternoon'
  return 'Good evening'
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function safeDateLabel(value: any): string {
  try {
    if (!value) return 'N/A'
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return 'N/A'
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return 'N/A'
  }
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-z0-9_\-]/gi, '_').substring(0, 80)
}

export async function sendAlertEmail(data: AlertEmailData) {
  const { to, alertName, resultCount, results, alert_id: alertId, frequency, recipientName } = data

  const recipients = normalizeRecipients(to)
  if (!recipients.length) {
    throw new Error('sendAlertEmail: no recipients provided')
  }

  // Generate Excel attachment from full result set
  const excelBuffer = await generateExcelBinary(results)
  const filename = `${sanitizeFilename(alertName)}_${new Date().toISOString().split('T')[0]}.xlsx`

  const html = generateAlertEmailHTML({
    alertName, resultCount,
    results: (results || []).slice(0, 10), alert_id: alertId,
    frequency,
    recipientName,
  })

  const text = generateAlertEmailText({
    alertName, resultCount,
    results: (results || []).slice(0, 10), alert_id: alertId,
    recipientName,
  })

  const resp = await sendEmail({
    to: recipients,
    subject: `🎯 ${alertName} — ${resultCount} New ${resultCount === 1 ? 'Opportunity' : 'Opportunities'}`,
    html,
    text,
    attachments: resultCount > 0
      ? [{
          file_name: filename,
          content: excelBuffer.toString('base64'),
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        }]
      : [],
  })

  return resp
}

function generateAlertEmailHTML(data: {
  alertName: string
  resultCount: number
  results: any[]
  alert_id: string
  frequency: string
  recipientName?: string
}): string {
  const { alertName, resultCount, results, alert_id: alertId, frequency, recipientName } = data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const greeting = getTimeOfDayGreeting()
  const name = recipientName ? `, ${escapeHtml(recipientName.split(' ')[0])}` : ''
  const filename = `${sanitizeFilename(alertName)}_${new Date().toISOString().split('T')[0]}.xlsx`

  const opportunityCards = results
    .map((opp, index) => `
      <tr>
        <td style="padding: 0 0 16px 0;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="background: #0f172a; border: 1px solid #334155; border-left: 4px solid #06b6d4; border-radius: 10px; padding: 20px;">

                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="vertical-align: top; width: 32px;">
                      <div style="width: 26px; height: 26px; border-radius: 50%; background: linear-gradient(135deg, #06b6d4, #3b82f6);">
                        <span style="color: #fff; font-size: 12px; font-weight: 700; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: block; text-align: center; line-height: 26px;">${index + 1}</span>
                      </div>
                    </td>
                    <td style="padding-left: 12px;">
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9; font-size: 15px; font-weight: 700; line-height: 1.4;">
                        ${escapeHtml(opp.title || 'Untitled Opportunity')}
                      </div>
                    </td>
                  </tr>
                </table>

                <div style="margin-top: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #94a3b8; font-size: 13px;">
                  📍 ${escapeHtml(opp.fullParentPathName || opp.department || 'Agency Not Specified')}
                </div>

                ${opp.solicitation_number ? `
                <div style="margin-top: 5px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b; font-size: 12px;">
                  📋 Solicitation: ${escapeHtml(opp.solicitation_number)}
                </div>` : ''}

                <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 14px;">
                  <tr>
                    <td style="width: 50%; vertical-align: top;">
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;">Posted</div>
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #cbd5e1; font-size: 13px; font-weight: 600;">${safeDateLabel(opp.postedDate)}</div>
                    </td>
                    <td style="width: 50%; vertical-align: top;">
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ef4444; font-size: 10px; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 3px;">Deadline</div>
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #fca5a5; font-size: 13px; font-weight: 600;">${safeDateLabel(opp.responseDeadLine)}</div>
                    </td>
                  </tr>
                </table>

                ${opp.typeOfSetAside || opp.setAside ? `
                <div style="margin-top: 12px;">
                  <span style="display: inline-block; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 14px; padding: 3px 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #10b981; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.4px;">
                    ${escapeHtml(opp.typeOfSetAside || opp.setAside)}
                  </span>
                </div>` : ''}

                ${opp.uiLink ? `
                <div style="margin-top: 12px;">
                  <a href="${opp.uiLink}" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #06b6d4; font-size: 12px; text-decoration: none; font-weight: 600;">
                    View on SAM.gov →
                  </a>
                </div>` : ''}

              </td>
            </tr>
          </table>
        </td>
      </tr>
    `)
    .join('')

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(alertName)} — New Opportunities</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%;">

          <!-- Logo -->
          <tr>
            <td style="padding: 0 0 20px 0;">
              <a href="${appUrl}" style="text-decoration: none; display: inline-block;">
                <img src="${appUrl}/precise-govcon-logo.jpg" width="180" alt="Precise GovCon" style="display: block; height: auto;" />
              </a>
            </td>
          </tr>

          <!-- Main card -->
          <tr>
            <td style="background: #1e293b; border: 1px solid #334155; border-radius: 16px; overflow: hidden;">

              <!-- Gradient accent bar -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="height: 4px; background: linear-gradient(90deg, #10b981, #06b6d4, #3b82f6);"></td>
                </tr>
              </table>

              <!-- Header: greeting + alert name + badge -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 28px 28px 0 28px;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #94a3b8; font-size: 15px; margin-bottom: 6px;">
                      ${greeting}${name},
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #f1f5f9; font-size: 22px; font-weight: 800; line-height: 1.3;">
                      ${escapeHtml(alertName)}
                    </div>
                    <div style="margin-top: 10px;">
                      <span style="display: inline-block; background: rgba(6, 182, 212, 0.1); border: 1px solid rgba(6, 182, 212, 0.25); border-radius: 20px; padding: 4px 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #06b6d4; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.6px;">
                        ${escapeHtml(frequency)} Alert
                      </span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Result count banner -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 22px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.2); border-radius: 10px; padding: 16px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align: middle; width: 40px;">
                                <div style="width: 36px; height: 36px; border-radius: 50%; background: linear-gradient(135deg, #10b981, #06b6d4);">
                                  <span style="color: #fff; font-size: 18px; display: block; text-align: center; line-height: 36px;">✓</span>
                                </div>
                              </td>
                              <td style="padding-left: 14px;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #10b981; font-size: 15px; font-weight: 700;">
                                  ${resultCount} new federal contract${resultCount !== 1 ? 's' : ''} matching your criteria
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Excel attachment notice -->
              ${resultCount > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 0 28px 22px 28px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="background: rgba(6, 182, 212, 0.07); border: 1px solid rgba(6, 182, 212, 0.2); border-radius: 10px; padding: 16px 20px;">
                          <table width="100%" cellpadding="0" cellspacing="0">
                            <tr>
                              <td style="vertical-align: middle; width: 36px;">
                                <span style="font-size: 22px; display: block;">📊</span>
                              </td>
                              <td style="padding-left: 12px;">
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #cbd5e1; font-size: 14px; font-weight: 600;">
                                  Excel Export Attached
                                </div>
                                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b; font-size: 12px; margin-top: 3px;">
                                  ${escapeHtml(filename)} — all ${resultCount} opportunities with full details
                                </div>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Opportunity preview cards -->
              ${results.length > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 0 28px;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #334155;">
                      📋 Preview — First ${results.length} Result${results.length !== 1 ? 's' : ''}
                    </div>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      ${opportunityCards}
                    </table>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- "and X more" -->
              ${resultCount > results.length ? `
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 14px 28px 0 28px; text-align: center;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #64748b; font-size: 13px;">
                      … and <span style="color: #06b6d4; font-weight: 700;">${resultCount - results.length} more</span> in the attached Excel file
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- CTA button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 24px 28px 28px 28px; text-align: center;">
                    <a href="${appUrl}/saved-searches" style="display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: #ffffff; text-decoration: none; padding: 13px 30px; border-radius: 10px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; font-weight: 700; letter-spacing: 0.3px;">
                      View in Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 24px 0 0 0;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-top: 1px solid #334155; padding-top: 20px;">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #475569; font-size: 12px; line-height: 1.8; text-align: center;">
                      You're receiving this because you subscribed to "<strong style="color: #64748b;">${escapeHtml(alertName)}</strong>"<br/>
                      <a href="${appUrl}/alerts" style="color: #06b6d4; text-decoration: none;">Manage Alert Settings</a>
                      &nbsp;·&nbsp;
                      <a href="${appUrl}/search" style="color: #06b6d4; text-decoration: none;">New Search</a>
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #334155; font-size: 11px; text-align: center; margin-top: 12px;">
                      © ${new Date().getFullYear()} Precise Govcon LLC · Richmond, Virginia · SDVOSB
                    </div>
                  </td>
                </tr>
              </table>
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

function generateAlertEmailText(data: {
  alertName: string
  resultCount: number
  results: any[]
  alert_id: string
  recipientName?: string
}): string {
  const { alertName, resultCount, results, recipientName } = data
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const greeting = getTimeOfDayGreeting()
  const name = recipientName ? `, ${recipientName.split(' ')[0]}` : ''
  const filename = `${sanitizeFilename(alertName)}_${new Date().toISOString().split('T')[0]}.xlsx`

  let text = `${greeting}${name},\n\n`
  text += `${alertName}\n`
  text += `${resultCount} New Contract ${resultCount === 1 ? 'Opportunity' : 'Opportunities'} Found\n\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  text += `📊 Attached: ${filename} — full dataset with all ${resultCount} opportunities\n\n`
  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  text += `Preview (First ${results.length} Results)\n\n`

  results.forEach((opp, index) => {
    text += `${index + 1}. ${opp.title || 'Untitled Opportunity'}\n`
    text += `   Agency: ${opp.fullParentPathName || opp.department || 'Not specified'}\n`
    if (opp.solicitation_number) {
      text += `   Solicitation: ${opp.solicitation_number}\n`
    }
    text += `   Posted: ${safeDateLabel(opp.postedDate)}\n`
    text += `   Deadline: ${safeDateLabel(opp.responseDeadLine)}\n`
    if (opp.typeOfSetAside || opp.setAside) {
      text += `   Set-Aside: ${opp.typeOfSetAside || opp.setAside}\n`
    }
    if (opp.uiLink) {
      text += `   Link: ${opp.uiLink}\n`
    }
    text += `\n`
  })

  if (resultCount > results.length) {
    text += `… and ${resultCount - results.length} more in the attached Excel file.\n\n`
  }

  text += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
  text += `View in Dashboard: ${appUrl}/saved-searches\n`
  text += `Manage Alerts: ${appUrl}/alerts\n\n`
  text += `© ${new Date().getFullYear()} Precise Govcon LLC · Richmond, Virginia · SDVOSB\n`

  return text
}

// Re-export for compatibility
export { sendEmail } from './send'