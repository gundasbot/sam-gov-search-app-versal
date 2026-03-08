// lib/email/templates/search-alert-template.tsx
// Enhanced email template for SAM.gov search alerts

import { getBrand } from '../brand'

interface EmailTemplateProps {
  searchName: string
  resultCount: number
  opportunities: any[]
  searchParams: {
    keywords?: string | null
    solicitationNumber?: string | null
    noticeId?: string | null
    naics?: string | null
    classificationCode?: string | null
    agency?: string | null
    organizationCode?: string | null
    setAside?: string | null
    stateOfPerformance?: string | null
    placeOfPerformanceZip?: string | null
    opportunityStatus?: string | null
    postedAfter?: string | Date | null
    rdlfrom?: string | Date | null
    rdlto?: string | Date | null
    procurementType?: string | null
  }
  runDate: Date
  recipientName?: string
}

export function generateSearchAlertEmail({
  searchName, resultCount,
  opportunities, searchParams,
  runDate,
  recipientName = 'Valued User',
}: EmailTemplateProps): string {
  const brand = getBrand()
  const formatDate = (date: string | Date | null) => {
    if (!date) return 'N/A'
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  // Build active search parameters display
  const activeParams: string[] = []
  if (searchParams.keywords) activeParams.push(`Keywords: ${searchParams.keywords}`)
  if (searchParams.solicitationNumber) activeParams.push(`Solicitation #: ${searchParams.solicitationNumber}`)
  if (searchParams.noticeId) activeParams.push(`Notice ID: ${searchParams.noticeId}`)
  if (searchParams.naics) activeParams.push(`NAICS: ${searchParams.naics}`)
  if (searchParams.classificationCode) activeParams.push(`Classification Code: ${searchParams.classificationCode}`)
  if (searchParams.agency) activeParams.push(`Agency: ${searchParams.agency}`)
  if (searchParams.organizationCode) activeParams.push(`Organization: ${searchParams.organizationCode}`)
  if (searchParams.setAside) activeParams.push(`Set-Aside: ${searchParams.setAside}`)
  if (searchParams.stateOfPerformance) activeParams.push(`State: ${searchParams.stateOfPerformance}`)
  if (searchParams.placeOfPerformanceZip) activeParams.push(`ZIP: ${searchParams.placeOfPerformanceZip}`)
  if (searchParams.opportunityStatus) activeParams.push(`Status: ${searchParams.opportunityStatus}`)
  if (searchParams.procurementType) activeParams.push(`Type: ${searchParams.procurementType}`)
  if (searchParams.postedAfter) activeParams.push(`Posted After: ${formatDate(searchParams.postedAfter)}`)
  if (searchParams.rdlfrom) activeParams.push(`Response Deadline From: ${formatDate(searchParams.rdlfrom)}`)
  if (searchParams.rdlto) activeParams.push(`Response Deadline To: ${formatDate(searchParams.rdlto)}`)

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SAM.gov Search Alert: ${searchName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6; line-height: 1.6;">
  
  <!-- Email Container -->
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #f3f4f6;">
    <tr>
      <td style="padding: 40px 20px;">
        
        <!-- Main Content Card -->
        <table role="presentation" style="max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 30px; text-align: center;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                   style="max-width: 180px; height: auto; display: block; margin: 0 auto 20px; border: 0;" />
              <div style="background-color: #ffffff; display: inline-block; padding: 15px 30px; border-radius: 8px; margin-bottom: 20px;">
                <h1 style="margin: 0; color: #1e3a8a; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                  🇺🇸 SAM.gov
                  <span style="color: #3b82f6;">Search Alert</span>
                </h1>
              </div>
              <p style="margin: 0; color: #ffffff; font-size: 16px; font-weight: 500;">
                Federal Contracting Opportunities
              </p>
            </td>
          </tr>

          <!-- Greeting -->
          <tr>
            <td style="padding: 30px 30px 20px;">
              <h2 style="margin: 0 0 15px; color: #1f2937; font-size: 20px; font-weight: 600;">
                Hello ${recipientName},
              </h2>
              <p style="margin: 0; color: #4b5563; font-size: 16px; line-height: 1.5;">
                Your saved search "<strong style="color: #1e3a8a;">${searchName}</strong>" has completed running on ${formatDate(runDate)}.
              </p>
            </td>
          </tr>

          <!-- Results Summary -->
          <tr>
            <td style="padding: 0 30px 30px;">
              <div style="background-color: ${resultCount > 0 ? '#dbeafe' : '#fef3c7'}; border-left: 4px solid ${resultCount > 0 ? '#3b82f6' : '#f59e0b'}; padding: 20px; border-radius: 6px;">
                <p style="margin: 0 0 5px; color: #1f2937; font-size: 14px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px;">
                  Search Results
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 32px; font-weight: 700;">
                  ${resultCount}
                  <span style="font-size: 16px; font-weight: 500; color: #6b7280;">
                    ${resultCount === 1 ? 'opportunity found' : 'opportunities found'}
                  </span>
                </p>
              </div>
            </td>
          </tr>

          <!-- Search Parameters -->
          ${activeParams.length > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                📋 Search Parameters Applied
              </h3>
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                ${activeParams.map((param, index) => `
                <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
                  <td style="padding: 10px 15px; color: #4b5563; font-size: 14px; border-bottom: 1px solid #e5e7eb;">
                    ${param}
                  </td>
                </tr>
                `).join('')}
              </table>
            </td>
          </tr>
          ` : ''}

          <!-- Opportunities Table -->
          ${resultCount > 0 ? `
          <tr>
            <td style="padding: 0 30px 30px;">
              <h3 style="margin: 0 0 15px; color: #1f2937; font-size: 16px; font-weight: 600; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                🎯 Top Opportunities
              </h3>
              <div style="overflow-x: auto;">
                <table role="presentation" style="width: 100%; border-collapse: collapse; border: 1px solid #e5e7eb; border-radius: 6px; overflow: hidden;">
                  <thead>
                    <tr style="background-color: #f3f4f6;">
                      <th style="padding: 12px 15px; text-align: left; color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #d1d5db;">Title</th>
                      <th style="padding: 12px 15px; text-align: left; color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #d1d5db;">Agency</th>
                      <th style="padding: 12px 15px; text-align: left; color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #d1d5db;">Posted</th>
                      <th style="padding: 12px 15px; text-align: left; color: #374151; font-size: 12px; font-weight: 600; text-transform: uppercase; border-bottom: 2px solid #d1d5db;">Deadline</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${opportunities.slice(0, 10).map((opp, index) => `
                    <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                      <td style="padding: 15px; color: #1f2937; font-size: 14px;">
                        <a href="${opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}" style="color: #2563eb; text-decoration: none; font-weight: 500;">
                          ${opp.title || 'Untitled'}
                        </a>
                      </td>
                      <td style="padding: 15px; color: #4b5563; font-size: 13px;">
                        ${(opp.fullParentPathName || opp.departmentName || 'N/A').substring(0, 40)}${(opp.fullParentPathName || opp.departmentName || '').length > 40 ? '...' : ''}
                      </td>
                      <td style="padding: 15px; color: #4b5563; font-size: 13px; white-space: nowrap;">
                        ${formatDate(opp.postedDate)}
                      </td>
                      <td style="padding: 15px; color: #4b5563; font-size: 13px; white-space: nowrap;">
                        ${formatDate(opp.responseDeadLine)}
                      </td>
                    </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
              ${opportunities.length > 10 ? `
              <p style="margin: 15px 0 0; color: #6b7280; font-size: 13px; font-style: italic;">
                Showing top 10 of ${opportunities.length} results. View all opportunities in your dashboard.
              </p>
              ` : ''}
            </td>
          </tr>
          ` : ''}

          <!-- CTA Button -->
          <tr>
            <td style="padding: 0 30px 40px; text-align: center;">
              <a href="https://yourapp.com/alerts" style="display: inline-block; padding: 14px 32px; background-color: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.3);">
                View Full Results in Dashboard
              </a>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                   style="max-width: 120px; height: auto; display: block; margin: 0 auto 16px; opacity: 0.8; border: 0;" />
              <p style="margin: 0 0 10px; color: #6b7280; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #1f2937;">${brand.name}</strong>
              </p>
              <p style="margin: 0 0 15px; color: #9ca3af; font-size: 12px;">
                This is an automated alert for your saved search. To manage your alerts,<br>
                visit your dashboard or contact support.
              </p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                  © ${new Date().getFullYear()} ${brand.name}. All rights reserved.<br>
                  <a href="https://precisegovcon.com/unsubscribe" style="color: #6b7280; text-decoration: none;">Unsubscribe</a> |
                  <a href="https://precisegovcon.com/privacy" style="color: #6b7280; text-decoration: none;">Privacy Policy</a>
                </p>
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
