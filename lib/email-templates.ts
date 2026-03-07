// lib/email-templates.ts
import { getBrand } from './email/brand'
import { sendEmail } from './email/send'

export interface EmailTemplateProps {
  searchName: string
  resultCount: number
  opportunities: any[]
  searchParams: Record<string, any>
  runDate: Date
  companyName?: string
  logoUrl?: string
  recipientName?: string
}

// ✅ Brand configuration - centralized branding for all emails
const getBrandConfig = () => {
  const brand = getBrand()
  return {
    companyName: brand.name,
    tagline: brand.tagline,
    logoUrl: brand.logoUrl,
    primaryColor: brand.colors.green,
    secondaryColor: brand.colors.orange,
    appUrl: brand.appUrl,
    supportEmail: brand.supportEmail,
  }
}

// ✅ Helper: Render a logo <img> with robust fallback
const getLogoImgTag = (logoUrl: string, alt: string) => {
  const safeAlt = String(alt || 'Precise GovCon').replaceAll('"', '&quot;')
  const safeUrl = String(logoUrl || '').replaceAll('"', '%22')
  const fallbackUrl = 'https://precisegovcon.com/precise-govcon-logo.jpg'

  return `
    <img
      src="${safeUrl}"
      alt="${safeAlt}"
      referrerpolicy="no-referrer"
      onerror="this.onerror=null;this.src='${fallbackUrl}';"
      style="height: 48px; width: auto; display: block; border: 0;"
    />
  `.trim()
}

// ✅ Dynamic time-based salutation
const getSalutation = (runDate: Date, recipientName?: string): string => {
  const hour = runDate.getHours()
  const day = runDate.toLocaleDateString('en-US', { weekday: 'long' })
  
  let greeting = ''
  if (hour >= 5 && hour < 12) {
    greeting = 'Good morning'
  } else if (hour >= 12 && hour < 17) {
    greeting = 'Good afternoon'
  } else {
    greeting = 'Good evening'
  }
  
  if (recipientName) {
    return `${greeting}, ${recipientName.split(' ')[0]}`
  }
  
  const dayGreetings: Record<string, string> = {
    'Monday': `${greeting}! Hope your week is off to a strong start`,
    'Tuesday': `${greeting}! Let's keep the momentum going`,
    'Wednesday': `${greeting}! Mid-week opportunities await`,
    'Thursday': `${greeting}! Almost to the weekend—stay focused`,
    'Friday': `${greeting}! Finish the week strong`,
    'Saturday': `${greeting}! Even weekends bring opportunities`,
    'Sunday': `${greeting}! Get a head start on next week`,
  }
  
  return dayGreetings[day] || `${greeting}!`
}

// ✅ Dynamic marketing message based on results and day
const getMarketingMessage = (resultCount: number, runDate: Date): { message: string; cta: string } => {
  const day = runDate.getDay()
  const isWeekend = day === 0 || day === 6
  
  if (resultCount === 0) {
    return {
      message: "No matches this time, but our team stays vigilant 24/7. Want help refining your search criteria to capture more relevant opportunities?",
      cta: "Let's optimize your search"
    }
  }
  
  if (resultCount >= 50) {
    return {
      message: "High volume of opportunities detected! Our analysts can help you prioritize the most winnable contracts and develop capture strategies that set you apart.",
      cta: "Talk to a capture strategist"
    }
  }
  
  if (resultCount >= 20) {
    return {
      message: "Quality opportunities are flowing! Need help with bid/no-bid decisions, proposal development, or teaming arrangements? Our procurement experts are standing by.",
      cta: "Schedule a consultation"
    }
  }
  
  if (isWeekend) {
    return {
      message: "The competition sleeps, but winning teams don't. Get ahead by having our strategists review these opportunities and craft your positioning before Monday.",
      cta: "Get weekend priority support"
    }
  }
  
  const messages = [
    {
      message: "Found opportunities that match your profile! Our team can help you quickly assess viability, identify teaming partners, and accelerate your capture planning.",
      cta: "Accelerate your capture"
    },
    {
      message: "These contracts won't wait—and neither should you. Our procurement intelligence team can provide deeper insights, past performance data, and competitor analysis.",
      cta: "Get competitive intelligence"
    },
    {
      message: "Ready to move from browsing to winning? Our experts can help you develop compelling win themes, past performance narratives, and proposal strategies.",
      cta: "Build your win strategy"
    },
    {
      message: "Opportunities are just the beginning. Our end-to-end support covers market research, teaming, proposal development, and post-award compliance.",
      cta: "Discover our services"
    },
  ]
  
  const messageIndex = day % messages.length
  return messages[messageIndex]
}

/**
 * Generate a professional HTML email for alert notifications
 */
export function generateAlertEmailHTML(props: EmailTemplateProps): string {
  const {
    searchName, resultCount,
    opportunities, searchParams,
    runDate,
    recipientName,
  } = props

  const brand = getBrandConfig()
  const companyName = props.companyName || brand.companyName
  const logoUrl = props.logoUrl || brand.logoUrl

  const salutation = getSalutation(runDate, recipientName)
  const marketing = getMarketingMessage(resultCount, runDate)

  const formattedDate = runDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const formattedTime = runDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  })

  const criteriaItems: string[] = []
  if (searchParams.keywords) criteriaItems.push(`Keywords: ${searchParams.keywords}`)
  if (searchParams.naics) criteriaItems.push(`NAICS: ${searchParams.naics}`)
  if (searchParams.agency) criteriaItems.push(`Agency: ${searchParams.agency}`)
  if (searchParams.setAside) criteriaItems.push(`Set-Aside: ${searchParams.setAside}`)

  const opportunitiesHTML = opportunities.slice(0, 10).map((opp, index) => {
    const title = opp.title || 'Untitled Opportunity'
    const solNumber = opp.solicitation_number || 'N/A'
    const agency = opp.department || opp.agency || 'N/A'
    const postedDate = opp.postedDate ? new Date(opp.postedDate).toLocaleDateString() : 'N/A'
    const responseDeadline = opp.responseDeadLine ? new Date(opp.responseDeadLine).toLocaleDateString() : 'N/A'
    const link = opp.uiLink || `https://sam.gov/opp/${opp.noticeId || ''}`

    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 16px 12px; font-size: 14px; color: #1e293b;">
          <div style="font-weight: 600; color: #0f172a; margin-bottom: 4px;">
            <a href="${link}" style="color: #0ea5e9; text-decoration: none;">${escapeHtml(title)}</a>
          </div>
          <div style="font-size: 13px; color: #64748b;">Sol #: ${escapeHtml(solNumber)}</div>
        </td>
        <td style="padding: 16px 12px; font-size: 13px; color: #475569;">${escapeHtml(agency)}</td>
        <td style="padding: 16px 12px; font-size: 13px; color: #475569; text-align: center;">${postedDate}</td>
        <td style="padding: 16px 12px; font-size: 13px; color: #475569; text-align: center;">
          <span style="display: inline-block; padding: 4px 12px; background-color: #fef3c7; color: #92400e; border-radius: 12px; font-weight: 500;">
            ${responseDeadline}
          </span>
        </td>
      </tr>
    `
  }).join('')

  const showingText = resultCount > 10 
    ? `Showing first 10 of ${resultCount} results` 
    : `Showing all ${resultCount} result${resultCount !== 1 ? 's' : ''}`

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alert: ${escapeHtml(searchName)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f8fafc;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="680" cellpadding="0" cellspacing="0" border="0" style="max-width: 680px; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          
          <!-- Header with Precise GovCon Logo -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #1e3a4c 0%, #2d5266 100%); padding: 32px; border-radius: 16px 16px 0 0;">
              <div style="margin-bottom: 20px;">
                <img src="${logoUrl}" alt="${companyName}" style="max-width: 280px; height: auto; display: inline-block; border: 0;" />
              </div>
              
              <h1 style="margin: 16px 0 0 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; text-align: center;">
                New Opportunities Found
              </h1>
              <p style="margin: 8px 0 0 0; color: #d1fae5; font-size: 16px; text-align: center;">
                Your alert "${escapeHtml(searchName)}" has new results
              </p>
            </td>
          </tr>

          <!-- Summary Stats -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #ecfdf5 0%, #dbeafe 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
                <tr>
                  <td width="50%" align="center" style="padding: 0 16px;">
                    <div style="font-size: 36px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">${resultCount}</div>
                    <div style="font-size: 14px; color: #64748b; font-weight: 500;">New Opportunities</div>
                  </td>
                  <td width="50%" align="center" style="padding: 0 16px; border-left: 2px solid #cbd5e1;">
                    <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Run Date</div>
                    <div style="font-size: 15px; color: #1e293b; font-weight: 600;">${formattedDate}</div>
                    <div style="font-size: 13px; color: #64748b; margin-top: 4px;">${formattedTime}</div>
                  </td>
                </tr>
              </table>

              <div style="margin-bottom: 24px;">
                <p style="margin: 0; font-size: 16px; color: #1e293b; font-weight: 600;">
                  ${escapeHtml(salutation)}!
                </p>
              </div>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: linear-gradient(135deg, #f0fdf4 0%, #fef3c7 100%); border-left: 4px solid #7cb342; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px 0; font-size: 15px; color: #1e293b; line-height: 1.6;">
                      ${escapeHtml(marketing.message)}
                    </p>
                    <a href="mailto:${brand.supportEmail}?subject=Consultation Request - ${escapeHtml(searchName)}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #7cb342 0%, #689f38 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">
                      ${escapeHtml(marketing.cta)} →
                    </a>
                  </td>
                </tr>
              </table>

              ${criteriaItems.length > 0 ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; border-left: 4px solid #0ea5e9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td>
                    <div style="font-size: 13px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;">
                      Search Criteria
                    </div>
                    <div style="font-size: 14px; color: #1e293b; line-height: 1.6;">
                      ${escapeHtml(criteriaItems.join(' • '))}
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td>
                    <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #0f172a;">
                      Top Opportunities
                    </h2>
                  </td>
                  <td align="right">
                    <span style="font-size: 13px; color: #64748b; font-weight: 500;">${showingText}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${resultCount > 0 ? `
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
                <thead>
                  <tr style="background-color: #f8fafc;">
                    <th align="left" style="padding: 12px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      Opportunity
                    </th>
                    <th align="left" style="padding: 12px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      Agency
                    </th>
                    <th align="center" style="padding: 12px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      Posted
                    </th>
                    <th align="center" style="padding: 12px; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">
                      Deadline
                    </th>
                  </tr>
                </thead>
                <tbody>
                  ${opportunitiesHTML}
                </tbody>
              </table>
            </td>
          </tr>
          ` : `
          <tr>
            <td style="padding: 0 32px 32px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="padding: 48px 24px; background-color: #f8fafc; border-radius: 12px;">
                <tr>
                  <td align="center">
                    <div style="font-size: 48px; margin-bottom: 16px;">🔭</div>
                    <div style="font-size: 18px; font-weight: 600; color: #475569; margin-bottom: 8px;">
                      No results found
                    </div>
                    <div style="font-size: 14px; color: #64748b;">
                      There are no opportunities matching your search criteria at this time.
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          `}

          <tr>
            <td align="center" style="padding: 0 32px 32px 32px;">
              <a href="${brand.appUrl}/alerts" style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #7cb342 0%, #689f38 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 15px;">
                View All Results in Dashboard
              </a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding: 24px 32px; background-color: #f8fafc; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
              <div style="margin-bottom: 16px;">
                <img src="${logoUrl}" alt="${companyName}" style="max-width: 180px; height: auto; display: inline-block; border: 0; opacity: 0.9;" />
              </div>
              <div style="font-size: 13px; color: #64748b; line-height: 1.6; text-align: center;">
                This is an automated alert from <strong>${escapeHtml(companyName)}</strong><br/>
                <a href="${brand.appUrl}/alerts" style="color: #0ea5e9; text-decoration: none;">Manage your alerts</a> • 
                <a href="mailto:${brand.supportEmail}" style="color: #0ea5e9; text-decoration: none;">Get support</a>
              </div>
              <div style="margin-top: 16px; font-size: 12px; color: #94a3b8; text-align: center;">
                © ${new Date().getFullYear()} ${escapeHtml(companyName)}. All rights reserved.<br/>
                <span style="font-size: 11px;">VETERAN-OWNED Small Business · Richmond, Virginia</span>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

/**
 * Generate plain text version of the email
 */
export function generateAlertEmailText(props: EmailTemplateProps): string {
  const {
    searchName, resultCount,
    opportunities, searchParams,
    runDate,
    recipientName,
  } = props

  const brand = getBrandConfig()
  const companyName = props.companyName || brand.companyName
  
  const salutation = getSalutation(runDate, recipientName)
  const marketing = getMarketingMessage(resultCount, runDate)

  const formattedDate = runDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  let text = `
=================================================================
${companyName}
${brand.tagline}
=================================================================

${salutation}!

Alert: ${searchName}
Run Date: ${formattedDate}

NEW OPPORTUNITIES FOUND: ${resultCount}

${marketing.message}

>>> ${marketing.cta}: ${brand.supportEmail}

`

  if (searchParams.keywords || searchParams.naics || searchParams.agency) {
    text += `SEARCH CRITERIA:\n`
    if (searchParams.keywords) text += `  Keywords: ${searchParams.keywords}\n`
    if (searchParams.naics) text += `  NAICS: ${searchParams.naics}\n`
    if (searchParams.agency) text += `  Agency: ${searchParams.agency}\n`
    if (searchParams.setAside) text += `  Set-Aside: ${searchParams.setAside}\n`
    text += `\n`
  }

  if (resultCount > 0) {
    text += `TOP OPPORTUNITIES:\n`
    text += `=================================================================\n\n`

    opportunities.slice(0, 10).forEach((opp, index) => {
      const title = opp.title || 'Untitled Opportunity'
      const solNumber = opp.solicitation_number || 'N/A'
      const agency = opp.department || opp.agency || 'N/A'
      const postedDate = opp.postedDate ? new Date(opp.postedDate).toLocaleDateString() : 'N/A'
      const responseDeadline = opp.responseDeadLine ? new Date(opp.responseDeadLine).toLocaleDateString() : 'N/A'
      const link = opp.uiLink || `https://sam.gov/opp/${opp.noticeId || ''}`

      text += `${index + 1}. ${title}\n`
      text += `   Sol #: ${solNumber}\n`
      text += `   Agency: ${agency}\n`
      text += `   Posted: ${postedDate} | Deadline: ${responseDeadline}\n`
      text += `   Link: ${link}\n\n`
    })

    if (resultCount > 10) {
      text += `... and ${resultCount - 10} more results.\n\n`
    }
  } else {
    text += `No opportunities found matching your search criteria.\n\n`
  }

  text += `=================================================================\n`
  text += `View all results: ${brand.appUrl}/alerts\n`
  text += `Manage alerts: ${brand.appUrl}/alerts\n`
  text += `Support: ${brand.supportEmail}\n`
  text += `=================================================================\n`
  text += `© ${new Date().getFullYear()} ${companyName}\n`
  text += `VETERAN-OWNED Small Business · Richmond, Virginia\n`

  return text.trim()
}

// Helper function
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

// -----------------------------------------------------------------------------
// Enterprise contact emails
// -----------------------------------------------------------------------------

export type EnterpriseInquiryInput = {
  name?: string
  email?: string
  company?: string
  phone?: string
  message?: string
  source?: string
}

/** Email to your internal team */
export function generateEnterpriseInquiryEmail(input: EnterpriseInquiryInput) {
  const brand = getBrandConfig()

  const name = (input.name || '').trim() || 'Unknown'
  const email = (input.email || '').trim() || 'Unknown'
  const company = (input.company || '').trim() || 'Unknown'
  const phone = (input.phone || '').trim() || 'Not provided'
  const message = (input.message || '').trim() || 'No message provided'
  const source = (input.source || '').trim() || 'Website'

  const subject = `Enterprise inquiry: ${company} (${name})`

  const text = [
    'New Enterprise Inquiry',
    '----------------------',
    `Name: ${name}`,
    `Email: ${email}`,
    `Company: ${company}`,
    `Phone: ${phone}`,
    `Source: ${source}`,
    '',
    'Message:',
    message,
    '',
    `Reply-To: ${email}`,
    `Sent via: ${brand.appUrl}`,
  ].join('\n')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0b1220;font-family:Arial, sans-serif;">
  <div style="max-width:720px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#1e3a4c 0%, #2d5266 100%);border-radius:14px;padding:24px;text-align:center;margin-bottom:16px;">
      <img src="${brand.logoUrl}" alt="${brand.companyName}" style="max-width:200px;height:auto;display:inline-block;" />
      <div style="margin-top:12px;font-size:16px;font-weight:700;color:#ffffff;">New Enterprise Inquiry</div>
    </div>

    <div style="background:#0f172a;border:1px solid rgba(148,163,184,0.25);border-radius:14px;padding:24px;">
      <div style="display:grid;grid-template-columns:1fr;gap:12px;">
        <div><span style="color:#94a3b8;">Name:</span> <strong style="color:#e2e8f0;">${escapeHtml(name)}</strong></div>
        <div><span style="color:#94a3b8;">Email:</span> <strong style="color:#e2e8f0;">${escapeHtml(email)}</strong></div>
        <div><span style="color:#94a3b8;">Company:</span> <strong style="color:#e2e8f0;">${escapeHtml(company)}</strong></div>
        <div><span style="color:#94a3b8;">Phone:</span> <strong style="color:#e2e8f0;">${escapeHtml(phone)}</strong></div>
        <div><span style="color:#94a3b8;">Source:</span> <strong style="color:#e2e8f0;">${escapeHtml(source)}</strong></div>
      </div>

      <div style="height:1px;background:rgba(148,163,184,0.25);margin:24px 0;"></div>

      <div style="color:#94a3b8;font-size:12px;font-weight:700;letter-spacing:0.6px;text-transform:uppercase;margin-bottom:8px;">
        Message
      </div>
      <pre style="white-space:pre-wrap;margin:0;background:#0b1220;border:1px solid rgba(148,163,184,0.25);padding:16px;border-radius:12px;color:#e2e8f0;">${escapeHtml(message)}</pre>
    </div>

    <div style="color:#94a3b8;font-size:12px;margin-top:16px;">
      Reply directly to <strong style="color:#e2e8f0;">${escapeHtml(email)}</strong>
    </div>
  </div>
</body>
</html>
  `.trim()

  return { subject, text, html }
}

/** Confirmation email to the customer */
export function generateCustomerConfirmationEmail(input: EnterpriseInquiryInput) {
  const brand = getBrandConfig()

  const name = (input.name || '').trim() || 'there'
  const company = (input.company || '').trim()

  const subject = `We received your request${company ? ` — ${company}` : ''}`

  const text = [
    `Hi ${name},`,
    '',
    `Thanks for reaching out about Precise GovCon Enterprise.`,
    `We received your message and will follow up shortly.`,
    '',
    `If you have any additional details (team size, agencies, NAICS focus, opportunity volume), reply to this email.`,
    '',
    `— ${brand.companyName} Team`,
  ].join('\n')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial, sans-serif;">
  <div style="max-width:720px;margin:0 auto;padding:24px;">
    <div style="background:linear-gradient(135deg,#1e3a4c 0%, #2d5266 100%);border-radius:14px;padding:24px;text-align:center;margin-bottom:16px;">
      <img src="${brand.logoUrl}" alt="${brand.companyName}" style="max-width:200px;height:auto;display:inline-block;" />
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:14px;padding:24px;">
      <p style="margin:0 0 16px 0;color:#0f172a;font-size:16px;">Hi ${escapeHtml(name)},</p>
      <p style="margin:0 0 16px 0;color:#334155;font-size:15px;line-height:1.6;">
        Thanks for reaching out about <strong>Precise GovCon Enterprise</strong>.
      </p>
      <p style="margin:0 0 16px 0;color:#334155;font-size:15px;line-height:1.6;">
        We received your message and will follow up within 1-2 business days.
      </p>
      <p style="margin:0 0 16px 0;color:#334155;font-size:15px;line-height:1.6;">
        If you have any additional details to share, just reply to this email.
      </p>

      <div style="margin-top:24px;color:#475569;font-size:14px;">
        — ${escapeHtml(brand.companyName)} Team
      </div>
    </div>

    <div style="margin-top:24px;text-align:center;">
      <img src="${brand.logoUrl}" alt="${brand.companyName}" style="max-width:140px;height:auto;display:inline-block;opacity:0.8;" />
      <p style="margin:12px 0 0 0;font-size:12px;color:#64748b;">
        <a href="mailto:${escapeHtml(brand.supportEmail)}" style="color:#0ea5e9;text-decoration:none;">${escapeHtml(brand.supportEmail)}</a>
      </p>
      <p style="margin:8px 0 0 0;font-size:11px;color:#64748b;">
        © ${new Date().getFullYear()} ${escapeHtml(brand.companyName)}<br/>
        VETERAN-OWNED Small Business · Richmond, Virginia
      </p>
    </div>
  </div>
</body>
</html>
  `.trim()

  return { subject, text, html }
}

export interface SendAlertEmailOptions {
  to: string | string[]
  alertName: string
  resultCount: number
  results: any[]
  alert_id?: string
  frequency?: string
  searchParams?: Record<string, any>
}

// Export sendAlertEmail function for sending alerts via email
export async function sendAlertEmail(options: SendAlertEmailOptions): Promise<void> {
  const {
    to,
    alertName,
    results,
    searchParams,
  } = options

  const props: EmailTemplateProps = {
    searchName: alertName,
    resultCount: results.length,
    opportunities: results,
    searchParams: searchParams || {},
    runDate: new Date(),
  }

  const html = generateAlertEmailHTML(props)
  const subject = `${results.length > 0 ? `${results.length} New` : 'No'} Opportunities: ${alertName}`

  const recipients = Array.isArray(to) ? to.join(',') : to

  await sendEmail({
    to: recipients,
    subject,
    html,
  })
}
