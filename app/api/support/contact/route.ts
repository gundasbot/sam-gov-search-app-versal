//app/api/support/contact/route

import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

function getInquiryColor(inquiryType: string): string {
  const colors: Record<string, string> = {
    'Technical Support': '#ef4444',
    'Billing & Subscription': '#3b82f6',
    'Account & Access': '#a855f7',
    'Alerts & Notifications': '#ff9800',
    'Sales & Services': '#7cb342',
    'Compliance & Security': '#6366f1',
    'General Inquiry': '#06b6d4',
    'Other': '#6b7280',
  }
  return colors[inquiryType] || '#06b6d4'
}

function getInquiryColorDark(inquiryType: string): string {
  const colors: Record<string, string> = {
    'Technical Support': '#dc2626',
    'Billing & Subscription': '#2563eb',
    'Account & Access': '#9333ea',
    'Alerts & Notifications': '#f57c00',
    'Sales & Services': '#558b2f',
    'Compliance & Security': '#4f46e5',
    'General Inquiry': '#0891b2',
    'Other': '#4b5563',
  }
  return colors[inquiryType] || '#0891b2'
}

function getSupportTo() {
  return process.env.SUPPORT_EMAIL || 'support@precisegovcon.com'
}

function getFrom() {
  return (
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_FROM ||
    'Precise GovCon <noreply@precisegovcon.com>'
  )
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const firstName = String(body?.firstName ?? '').trim()
    const lastName = String(body?.lastName ?? '').trim()
    const email = String(body?.email ?? '').trim()
    const phone = String(body?.phone ?? '').trim()
    const company = String(body?.company ?? '').trim()
    const inquiryType = String(body?.inquiryType ?? '').trim()
    const message = String(body?.message ?? '').trim()

    // ✅ Message is now OPTIONAL - removed from required fields validation
    if (!firstName || !lastName || !email || !inquiryType) {
      return NextResponse.json({ 
        error: 'Missing required fields. Please provide First Name, Last Name, Email, and Inquiry Type.' 
      }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: 'Email service is not configured. Please email support@precisegovcon.com.' },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const to = getSupportTo()
    const from = getFrom()

    const subject = `[Support] ${inquiryType} — ${firstName} ${lastName}`
    
    // Build plain text version
    const textParts = [
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      company ? `Company: ${company}` : null,
      `Inquiry Type: ${inquiryType}`,
      '',
    ]
    
    if (message) {
      textParts.push(`Message:`, message)
    } else {
      textParts.push(`Message:`, 'No message provided - please follow up via email.')
    }
    
    const text = textParts.filter(Boolean).join('\n')

    // Build branded HTML email
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Support Request</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0B1633;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; background-color: #1e3a4c; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
          
          <!-- Header with Logo and Branding -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); padding: 32px 40px; text-align: center;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td align="center">
                    <div style="background-color: white; border-radius: 12px; padding: 12px; display: inline-block; margin-bottom: 16px;">
                      <img src="https://precisegovcon.com/logo.png" alt="Precise Analytics" style="width: 48px; height: 48px; display: block;" />
                    </div>
                    <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: white; letter-spacing: -0.5px;">
                      Precise <span style="color: #ff9800;">Analytics</span>
                    </h1>
                    <p style="margin: 8px 0 0 0; font-size: 14px; color: rgba(255,255,255,0.9); font-weight: 600;">
                      Government Contracting Intelligence
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Support Badge -->
          <tr>
            <td style="padding: 0 40px;">
              <div style="background: linear-gradient(135deg, ${getInquiryColor(inquiryType)}, ${getInquiryColorDark(inquiryType)}); border-radius: 12px; padding: 16px; margin: -20px 0 24px 0; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
                <p style="margin: 0; font-size: 16px; font-weight: 700; color: white;">
                  🎫 New Support Request: <span style="text-transform: uppercase; letter-spacing: 0.5px;">${inquiryType}</span>
                </p>
              </div>
            </td>
          </tr>

          <!-- Contact Information -->
          <tr>
            <td style="padding: 0 40px 32px 40px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-left: 4px solid ${getInquiryColor(inquiryType)}; border-radius: 8px; padding: 16px 20px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Full Name</p>
                      <p style="margin: 0; font-size: 18px; font-weight: 700; color: white;">${firstName} ${lastName}</p>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-left: 4px solid #06b6d4; border-radius: 8px; padding: 16px 20px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Email Address</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #06b6d4;">
                        <a href="mailto:${email}" style="color: #06b6d4; text-decoration: none;">${email}</a>
                      </p>
                    </div>
                  </td>
                </tr>

                ${phone ? `
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-left: 4px solid #10b981; border-radius: 8px; padding: 16px 20px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Phone</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: #10b981;">
                        <a href="tel:${phone}" style="color: #10b981; text-decoration: none;">${phone}</a>
                      </p>
                    </div>
                  </td>
                </tr>
                ` : ''}

                ${company ? `
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-left: 4px solid #ff9800; border-radius: 8px; padding: 16px 20px;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Company</p>
                      <p style="margin: 0; font-size: 16px; font-weight: 600; color: white;">${company}</p>
                    </div>
                  </td>
                </tr>
                ` : ''}

                ${message ? `
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="background-color: rgba(255,255,255,0.05); border-left: 4px solid ${getInquiryColor(inquiryType)}; border-radius: 8px; padding: 16px 20px;">
                      <p style="margin: 0 0 12px 0; font-size: 12px; font-weight: 700; color: rgba(255,255,255,0.6); text-transform: uppercase; letter-spacing: 1px;">Message</p>
                      <p style="margin: 0; font-size: 15px; line-height: 1.6; color: rgba(255,255,255,0.9); white-space: pre-wrap;">${message}</p>
                    </div>
                  </td>
                </tr>
                ` : `
                <tr>
                  <td style="padding-bottom: 20px;">
                    <div style="background-color: rgba(255, 152, 0, 0.1); border: 1px dashed rgba(255, 152, 0, 0.3); border-radius: 8px; padding: 16px 20px; text-align: center;">
                      <p style="margin: 0; font-size: 14px; color: rgba(255,255,255,0.7);">
                        📭 <strong style="color: #ff9800;">No message provided</strong> — Please follow up via email
                      </p>
                    </div>
                  </td>
                </tr>
                `}

              </table>

              <!-- Action Button -->
              <div style="text-align: center; margin-top: 32px;">
                <a href="mailto:${email}" style="display: inline-block; background: linear-gradient(135deg, #10b981, #06b6d4); color: white; font-size: 16px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                  📧 Reply to ${firstName}
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: rgba(0,0,0,0.3); padding: 24px 40px; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
              <p style="margin: 0 0 8px 0; font-size: 13px; color: rgba(255,255,255,0.6);">
                <strong style="color: white;">Precise Analytics</strong> • Virginia-based • Minority-owned VOSB
              </p>
              <p style="margin: 0; font-size: 12px; color: rgba(255,255,255,0.5);">
                support@precisegovcon.com • Mon–Fri 9am–5pm ET
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

    await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject,
      text,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Could not send message. Please email support@precisegovcon.com.' },
      { status: 500 }
    )
  }
}
