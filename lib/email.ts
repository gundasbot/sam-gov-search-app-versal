// lib/email.ts
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface AlertEmailData {
  to: string[]
  searchName: string
  resultCount: number
  opportunities: any[]
  searchParams: {
    keywords?: string | null
    naics?: string | null
    agency?: string | null
    setAside?: string | null
    stateOfPerformance?: string | null
    postedAfter?: Date | string | null
    postedBefore?: Date | string | null
    procurementType?: string | null
  }
  runDate?: Date
}

// Format date helper
const formatDate = (date: Date | string | null) => {
  if (!date) return 'Not specified'
  try {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  } catch {
    return 'Invalid date'
  }
}

// Generate CSV content from opportunities
function generateCSV(opportunities: any[], searchParams: any, runDate: Date): string {
  // CSV Headers
  const headers = [
    'Notice ID',
    'Title',
    'Solicitation Number',
    'Department/Agency',
    'Office',
    'Type',
    'Set-Aside',
    'NAICS Code',
    'Posted Date',
    'Response Deadline',
    'Place of Performance (City)',
    'Place of Performance (State)',
    'Place of Performance (Zip)',
    'Description',
    'Link to SAM.gov',
    'Active Status',
    'Base Type',
    'Point of Contact Name',
    'Point of Contact Email',
    'Point of Contact Phone',
  ]

  // Escape CSV value
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return ''
    const str = String(value).replace(/"/g, '""') // Escape quotes
    // Wrap in quotes if contains comma, newline, or quote
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str}"`
    }
    return str
  }

  // Build CSV rows
  const rows = opportunities.map(opp => [
    escapeCSV(opp.noticeId),
    escapeCSV(opp.title),
    escapeCSV(opp.solicitationNumber),
    escapeCSV(opp.department || opp.fullParentPathName),
    escapeCSV(opp.office),
    escapeCSV(opp.type),
    escapeCSV(opp.setAside),
    escapeCSV(opp.naicsCode),
    escapeCSV(opp.postedDate ? formatDate(opp.postedDate) : ''),
    escapeCSV(opp.responseDeadLine ? formatDate(opp.responseDeadLine) : ''),
    escapeCSV(opp.placeOfPerformance?.city?.name),
    escapeCSV(opp.placeOfPerformance?.state?.code),
    escapeCSV(opp.placeOfPerformance?.zip),
    escapeCSV(opp.description?.substring(0, 500)), // Limit description length
    escapeCSV(opp.uiLink),
    escapeCSV(opp.active),
    escapeCSV(opp.baseType),
    escapeCSV(opp.pointOfContact?.fullName),
    escapeCSV(opp.pointOfContact?.email),
    escapeCSV(opp.pointOfContact?.phone),
  ].join(','))

  // Add metadata header rows
  const metadata = [
    `"Search Run Date","${formatDate(runDate)}"`,
    `"Total Results","${opportunities.length}"`,
    searchParams.keywords ? `"Keywords","${escapeCSV(searchParams.keywords)}"` : null,
    searchParams.naics ? `"NAICS Code","${escapeCSV(searchParams.naics)}"` : null,
    searchParams.agency ? `"Agency","${escapeCSV(searchParams.agency)}"` : null,
    searchParams.setAside ? `"Set-Aside","${escapeCSV(searchParams.setAside)}"` : null,
    searchParams.stateOfPerformance ? `"State","${escapeCSV(searchParams.stateOfPerformance)}"` : null,
    searchParams.postedAfter ? `"Posted After","${formatDate(searchParams.postedAfter)}"` : null,
    searchParams.postedBefore ? `"Posted Before","${formatDate(searchParams.postedBefore)}"` : null,
    '', // Empty row separator
  ].filter(Boolean)

  // Combine: metadata + headers + data rows
  return [
    ...metadata,
    headers.join(','),
    ...rows
  ].join('\n')
}

export async function sendAlertEmail(data: AlertEmailData) {
  const {
    to,
    searchName,
    resultCount,
    opportunities,
    searchParams,
    runDate = new Date()
  } = data

  // Build search criteria summary
  const criteria: string[] = []
  if (searchParams.keywords) criteria.push(`Keywords: ${searchParams.keywords}`)
  if (searchParams.naics) criteria.push(`NAICS: ${searchParams.naics}`)
  if (searchParams.agency) criteria.push(`Agency: ${searchParams.agency}`)
  if (searchParams.setAside) criteria.push(`Set-Aside: ${searchParams.setAside}`)
  if (searchParams.stateOfPerformance) criteria.push(`State: ${searchParams.stateOfPerformance}`)

  // Generate CSV attachment
  const csvContent = generateCSV(opportunities, searchParams, runDate)
  const csvBuffer = Buffer.from(csvContent, 'utf-8')
  const filename = `${searchName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`

  // Build opportunities HTML (show first 10)
  const opportunitiesHtml = opportunities.slice(0, 10).map((opp, idx) => `
    <div style="background: #f8f9fa; padding: 16px; margin-bottom: 16px; border-radius: 8px; border-left: 4px solid #2563eb;">
      <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #1e293b;">
        ${idx + 1}. ${opp.title || 'Untitled'}
      </h3>
      <p style="margin: 4px 0; font-size: 14px; color: #475569;">
        <strong>Agency:</strong> ${opp.department || opp.fullParentPathName || 'N/A'}<br/>
        <strong>Type:</strong> ${opp.type || 'N/A'} | <strong>Set-Aside:</strong> ${opp.setAside || 'None'}<br/>
        <strong>Posted:</strong> ${formatDate(opp.postedDate)} | <strong>Deadline:</strong> ${formatDate(opp.responseDeadLine)}<br/>
        <strong>Location:</strong> ${opp.placeOfPerformance?.city?.name || ''} ${opp.placeOfPerformance?.state?.code || 'N/A'}
      </p>
      ${opp.uiLink ? `<a href="${opp.uiLink}" style="color: #2563eb; text-decoration: none;">View on SAM.gov →</a>` : ''}
    </div>
  `).join('')

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 32px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: white; font-size: 24px;">🎯 New Contract Opportunities</h1>
        <p style="margin: 8px 0 0 0; color: #dbeafe; font-size: 16px;">${searchName}</p>
      </div>

      ${resultCount > 0 ? `
        <div style="background: #dcfce7; border: 1px solid #86efac; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; color: #166534; font-size: 16px; font-weight: 600;">
            ✅ ${resultCount} new federal contract${resultCount !== 1 ? 's' : ''} matching your criteria
          </p>
        </div>

        <div style="background: #eff6ff; border: 1px solid #93c5fd; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px 0; color: #1e40af; font-weight: 600;">📎 CSV Export Available</p>
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            Download the attached CSV file for the full dataset with all ${resultCount} opportunities<br/>
            <strong>${filename}</strong>
          </p>
        </div>

        <div style="margin-bottom: 24px;">
          <h2 style="font-size: 18px; color: #1e293b; margin-bottom: 16px;">📋 Preview (First 10 Results)</h2>
          ${opportunitiesHtml}
        </div>
      ` : `
        <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; color: #92400e;">
            No opportunities matched your search criteria this time.
          </p>
        </div>
      `}

      ${resultCount > 10 ? `
        <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
          <p style="margin: 0; color: #475569; font-size: 14px;">
            ℹ️ <strong>Note:</strong> This email shows a preview of 10 results.<br/>
            The attached CSV file contains all ${resultCount} opportunities with complete details.
          </p>
        </div>
      ` : ''}

      <div style="margin-top: 32px; padding-top: 24px; border-top: 2px solid #e2e8f0;">
        <p style="margin: 0 0 16px 0; color: #64748b; font-size: 14px;">
          You're receiving this because you subscribed to alerts for "<strong>${searchName}</strong>"
        </p>
        <p style="margin: 0; color: #94a3b8; font-size: 12px;">
          Powered by <strong>Precise GovCon</strong>
        </p>
      </div>
    </body>
    </html>
  `

  try {
    const result = await resend.emails.send({
      from: 'Precise GovCon <alerts@precisegovcon.com>',
      to,
      subject: `${resultCount > 0 ? '🎯' : '📭'} ${searchName} - ${resultCount} New Opportunities`,
      html: htmlContent,
      attachments: resultCount > 0 ? [{
        filename,
        content: csvBuffer,
      }] : undefined,
    })

    console.log('✅ Alert email sent:', result)
    return result
  } catch (error) {
    console.error('❌ Failed to send alert email:', error)
    throw error
  }
}

// Access request confirmation (user receives this)
export async function sendAccessRequestConfirmation(email: string, requestId: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%); padding: 32px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: white; font-size: 24px;">Access Request Received</h1>
      </div>
      <p>Hi there,</p>
      <p>We've received your access request for Precise GovCon and will review it shortly.</p>
      <p>Our team typically responds within 1-2 business days.</p>
      <p style="margin-top: 32px; color: #64748b; font-size: 14px;">
        Reference ID: <code>${requestId}</code>
      </p>
      <p style="color: #64748b; font-size: 14px;">
        Best regards,<br/>
        <strong>Precise GovCon Team</strong>
      </p>
    </body>
    </html>
  `

  return resend.emails.send({
    from: 'Precise GovCon <noreply@precisegovcon.com>',
    to: email,
    subject: 'Access Request Received - Precise GovCon',
    html,
  })
}

// Notify support of new access request (admin receives this)
export async function notifySupportNewAccessRequest(data: {
  requestId: string
  name: string
  email: string
  org: string
  message: string
}) {
  const { requestId, name, email, org, message } = data
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #fbbf24; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: #78350f; font-size: 20px;">🔔 New Access Request</h1>
      </div>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <p style="margin: 8px 0;"><strong>Request ID:</strong> ${requestId}</p>
        <p style="margin: 8px 0;"><strong>Name:</strong> ${name || 'N/A'}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 8px 0;"><strong>Organization:</strong> ${org || 'N/A'}</p>
        <p style="margin: 8px 0;"><strong>Message:</strong></p>
        <p style="margin: 8px 0; padding: 12px; background: white; border-radius: 4px;">${message || 'No message provided'}</p>
      </div>
    </body>
    </html>
  `

  return resend.emails.send({
    from: 'Precise GovCon <system@precisegovcon.com>',
    to: 'support@precisegovcon.com',
    subject: `New Access Request from ${name || email}`,
    html,
  })
}

// Trial confirmation (user receives this when trial starts)
export async function sendTrialConfirmationEmail(data: {
  email: string
  firstName: string
  lastName: string
  trialEndsAt: Date
}) {
  const { email, firstName, lastName, trialEndsAt } = data
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: white; font-size: 24px;">🎉 Your Trial Has Started!</h1>
      </div>
      <p>Hi ${firstName},</p>
      <p>Welcome to Precise GovCon! Your 7-day free trial has been activated.</p>
      <div style="background: #dcfce7; border: 1px solid #86efac; padding: 16px; border-radius: 8px; margin: 24px 0;">
        <p style="margin: 0; color: #166534;">
          <strong>✅ Full access to all features</strong><br/>
          <strong>📅 Trial ends:</strong> ${new Date(trialEndsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>
      <p><a href="https://precisegovcon.com/dashboard" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">Go to Dashboard →</a></p>
      <p style="margin-top: 32px; color: #64748b; font-size: 14px;">
        Need help? Reply to this email anytime.<br/>
        <strong>Precise GovCon Team</strong>
      </p>
    </body>
    </html>
  `

  return resend.emails.send({
    from: 'Precise GovCon <noreply@precisegovcon.com>',
    to: email,
    subject: 'Welcome to Precise GovCon - Your Trial Has Started!',
    html,
  })
}

// Admin notification when trial starts
export async function sendAdminTrialNotification(data: {
  firstName: string
  lastName: string
  email: string
  phone: string
  company?: string
  position?: string
  trialEndsAt: Date
}) {
  const { firstName, lastName, email, phone, company, position, trialEndsAt } = data
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #3b82f6; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: white; font-size: 20px;">🆕 New Trial Started</h1>
      </div>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
        <p style="margin: 8px 0;"><strong>Name:</strong> ${firstName} ${lastName}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin: 8px 0;"><strong>Phone:</strong> ${phone}</p>
        ${company ? `<p style="margin: 8px 0;"><strong>Company:</strong> ${company}</p>` : ''}
        ${position ? `<p style="margin: 8px 0;"><strong>Position:</strong> ${position}</p>` : ''}
        <p style="margin: 8px 0;"><strong>Trial Ends:</strong> ${new Date(trialEndsAt).toLocaleDateString('en-US')}</p>
        <p style="margin: 8px 0;"><strong>Started:</strong> ${new Date().toLocaleString('en-US')}</p>
      </div>
    </body>
    </html>
  `

  return resend.emails.send({
    from: 'Precise GovCon <system@precisegovcon.com>',
    to: 'admin@precisegovcon.com',
    subject: `New Trial: ${firstName} ${lastName}${company ? ` (${company})` : ''}`,
    html,
  })
}

// Trial expiration notice
export async function sendTrialExpired(data: {
  email: string
  firstName: string
}) {
  const { email, firstName } = data
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 32px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: white; font-size: 24px;">Your Trial Has Ended</h1>
      </div>
      <p>Hi ${firstName},</p>
      <p>Your 7-day trial of Precise GovCon has ended. We hope you found it valuable!</p>
      <p>To continue accessing federal contracting opportunities, subscribe to one of our plans:</p>
      <p><a href="https://precisegovcon.com/pricing" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Pricing →</a></p>
      <p style="margin-top: 32px; color: #64748b; font-size: 14px;">
        Questions? Reply to this email.<br/>
        <strong>Precise GovCon Team</strong>
      </p>
    </body>
    </html>
  `

  return resend.emails.send({
    from: 'Precise GovCon <noreply@precisegovcon.com>',
    to: email,
    subject: 'Your Precise GovCon Trial Has Ended',
    html,
  })
}

// 3-day trial reminder
export async function sendTrialReminder3Days(data: {
  email: string
  firstName: string
  trialEndsAt: Date
}) {
  const { email, firstName, trialEndsAt } = data
  const daysLeft = Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  
  const html = `
    <!DOCTYPE html>
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 32px; border-radius: 12px; margin-bottom: 24px;">
        <h1 style="margin: 0; color: white; font-size: 24px;">⏰ Your Trial Ends in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''}</h1>
      </div>
      <p>Hi ${firstName},</p>
      <p>Just a friendly reminder that your Precise GovCon trial ends on <strong>${new Date(trialEndsAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.</p>
      <p>Don't miss out on federal contracting opportunities. Subscribe now to continue your access:</p>
      <p><a href="https://precisegovcon.com/pricing" style="display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600;">View Pricing →</a></p>
      <p style="margin-top: 32px; color: #64748b; font-size: 14px;">
        Need more time to decide? Reply to this email.<br/>
        <strong>Precise GovCon Team</strong>
      </p>
    </body>
    </html>
  `

  return resend.emails.send({
    from: 'Precise GovCon <noreply@precisegovcon.com>',
    to: email,
    subject: `Your Trial Ends in ${daysLeft} Day${daysLeft !== 1 ? 's' : ''} - Precise GovCon`,
    html,
  })
}
