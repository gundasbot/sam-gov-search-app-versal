// app/api/contact/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

function clamp(v: unknown, max = 120) {
  return String(v ?? '').trim().slice(0, max)
}

// Generate ICS calendar invite
function generateICS(name: string, email: string, date: string, time: string, certifications: string) {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  // Parse the date and time
  const meetingDate = new Date(date + 'T' + convertTo24Hour(time))
  const startDate = meetingDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  // Meeting is 30 minutes
  const endDate = new Date(meetingDate.getTime() + 30 * 60000)
  const endDateStr = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Precise GovCon//Set-Aside Consultation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${timestamp}-${email}@precisegovcon.com`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${startDate}`,
    `DTEND:${endDateStr}`,
    `SUMMARY:Set-Aside Certification Consultation - ${name}`,
    `DESCRIPTION:Consultation about: ${certifications}\\n\\nClient: ${name}\\nEmail: ${email}`,
    'LOCATION:Video Conference (Link to be sent)',
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'ORGANIZER;CN=Precise GovCon:mailto:contact@precisegovcon.com',
    `ATTENDEE;CN=${name};RSVP=TRUE:mailto:${email}`,
    `ATTENDEE;CN=Precise GovCon Team;RSVP=FALSE:mailto:contact@preciseanalytics.io`,
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Set-Aside Certification Consultation in 15 minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n')

  return icsContent
}

// Convert 12-hour time to 24-hour for ICS
function convertTo24Hour(time12h: string) {
  const [time, modifier] = time12h.split(' ')
  let [hours, minutes] = time.split(':')
  
  if (hours === '12') {
    hours = '00'
  }
  
  if (modifier === 'PM') {
    hours = String(parseInt(hours, 10) + 12)
  }
  
  return `${hours.padStart(2, '0')}:${minutes || '00'}:00`
}

// POST - Handle contact form submissions (public, no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, company, message, preferredDate, preferredTime, certifications, subject } = body

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Build plain text email content (fallback)
    const emailContent = `
New Set-Aside Certification Inquiry

From: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ''}
${company ? `Company: ${company}` : ''}

Interested Certifications:
${certifications || 'Not specified'}

${preferredDate ? `Preferred Date: ${preferredDate}` : ''}
${preferredTime ? `Preferred Time: ${preferredTime}` : ''}

${message ? `Message:\n${message}` : 'No additional message'}

---
Submitted: ${new Date().toLocaleString()}
    `.trim()

    // Build HTML email for internal team
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 30px 40px; text-align: center;">
              <div style="background-color: white; display: inline-block; padding: 15px 25px; border-radius: 8px; margin-bottom: 15px;">
                <h1 style="margin: 0; color: #065f46; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">
                  PRECISE<span style="color: #ea580c;">GOVCON</span>
                </h1>
              </div>
              <p style="margin: 0; color: #d1fae5; font-size: 14px; font-weight: 600;">
                contracting intelligence and procurement experts
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 24px; font-weight: 700;">
                New Set-Aside Certification Inquiry
              </h2>

              <!-- Contact Information -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #065f46; font-size: 14px;">From:</strong>
                          <span style="color: #374151; font-size: 16px; font-weight: 600; margin-left: 8px;">${name}</span>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #065f46; font-size: 14px;">Email:</strong>
                          <a href="mailto:${email}" style="color: #0891b2; text-decoration: none; margin-left: 8px;">${email}</a>
                        </td>
                      </tr>
                      ${phone ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #065f46; font-size: 14px;">Phone:</strong>
                          <a href="tel:${phone}" style="color: #0891b2; text-decoration: none; margin-left: 8px;">${phone}</a>
                        </td>
                      </tr>
                      ` : ''}
                      ${company ? `
                      <tr>
                        <td style="padding: 8px 0;">
                          <strong style="color: #065f46; font-size: 14px;">Company:</strong>
                          <span style="color: #374151; margin-left: 8px;">${company}</span>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Interested Certifications -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: 700; text-transform: uppercase;">
                      Interested Certifications
                    </h3>
                    ${certifications ? certifications.split(',').map((cert: string) => `
                      <span style="display: inline-block; background-color: #10b981; color: white; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 600; margin: 4px 4px 4px 0;">${cert}</span>
                    `).join('') : '<span style="color: #9ca3af;">Not specified</span>'}
                  </td>
                </tr>
              </table>

              <!-- Preferred Date/Time -->
              ${preferredDate || preferredTime ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 20px; background-color: #fef3c7; border-radius: 6px; border-left: 4px solid #f59e0b;">
                    <h3 style="margin: 0 0 12px 0; color: #92400e; font-size: 16px; font-weight: 700;">
                      Preferred Meeting Time
                    </h3>
                    ${preferredDate ? `
                    <p style="margin: 4px 0; color: #78350f; font-size: 15px;">
                      <strong>Date:</strong> ${new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    ` : ''}
                    ${preferredTime ? `
                    <p style="margin: 4px 0; color: #78350f; font-size: 15px;">
                      <strong>Time:</strong> ${preferredTime}
                    </p>
                    ` : ''}
                    ${preferredDate && preferredTime ? `
                    <p style="margin: 12px 0 0 0; padding: 12px; background-color: #fef9c3; border-radius: 4px; color: #854d0e; font-size: 13px;">
                      <strong>ðŸ“… Calendar invite attached</strong> - Add this meeting to your calendar!
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Message -->
              ${message ? `
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td>
                    <h3 style="margin: 0 0 12px 0; color: #065f46; font-size: 16px; font-weight: 700;">
                      Message
                    </h3>
                    <div style="padding: 16px; background-color: #f9fafb; border-radius: 6px; color: #374151; line-height: 1.6;">
                      ${message.replace(/\n/g, '<br>')}
                    </div>
                  </td>
                </tr>
              </table>
              ` : ''}

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #e5e7eb; padding-top: 20px; margin-top: 20px;">
                <tr>
                  <td style="text-align: center; color: #9ca3af; font-size: 12px;">
                    <p style="margin: 4px 0;">Submitted: ${new Date().toLocaleString()}</p>
                    <p style="margin: 4px 0;">Sent from precisegovcon.com</p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer Bar -->
          <tr>
            <td style="background-color: #065f46; padding: 20px; text-align: center;">
              <p style="margin: 0; color: #d1fae5; font-size: 13px;">
                Â© ${new Date().getFullYear()} Precise GovCon. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    // Build customer confirmation HTML
    const customerConfirmationHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #065f46 0%, #047857 100%); padding: 30px 40px; text-align: center;">
              <div style="background-color: white; display: inline-block; padding: 15px 25px; border-radius: 8px; margin-bottom: 15px;">
                <h1 style="margin: 0; color: #065f46; font-size: 28px; font-weight: 900; letter-spacing: -0.5px;">
                  PRECISE<span style="color: #ea580c;">GOVCON</span>
                </h1>
              </div>
              <p style="margin: 0; color: #d1fae5; font-size: 14px; font-weight: 600;">
                contracting intelligence and procurement experts
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="width: 80px; height: 80px; background-color: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px;">
                  <span style="font-size: 40px;">âœ…</span>
                </div>
                <h2 style="margin: 0 0 12px 0; color: #065f46; font-size: 32px; font-weight: 900;">
                  Request Received!
                </h2>
                <p style="margin: 0; color: #6b7280; font-size: 18px; font-weight: 600;">
                  Thank you for your interest in set-aside certifications
                </p>
              </div>

              <!-- Confirmation Details -->
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
                    <h3 style="margin: 0 0 16px 0; color: #065f46; font-size: 18px; font-weight: 700;">
                      ðŸ“§ Confirmation sent to: ${email}
                    </h3>
                    <p style="margin: 0 0 12px 0; color: #374151; font-size: 15px; line-height: 1.6;">
                      We've received your inquiry about <strong>${certifications || 'set-aside certifications'}</strong> and will contact you within 24 hours.
                    </p>
                    ${preferredDate && preferredTime ? `
                    <p style="margin: 12px 0 0 0; padding: 16px; background-color: #fef3c7; border-radius: 6px; color: #92400e; font-size: 14px; font-weight: 600;">
                      ðŸ“… <strong>Meeting Request:</strong><br/>
                      ${new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${preferredTime}<br/>
                      <span style="font-size: 13px; color: #78350f;">Calendar invite attached - add this to your calendar!</span>
                    </p>
                    ` : ''}
                  </td>
                </tr>
              </table>

              <!-- What Happens Next -->
              <h3 style="margin: 0 0 20px 0; color: #111827; font-size: 20px; font-weight: 700;">
                What happens next?
              </h3>
              <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                <tr>
                  <td style="padding: 16px; background-color: #f9fafb; border-radius: 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="display: flex; align-items: flex-start;">
                            <span style="display: inline-block; min-width: 32px; height: 32px; background-color: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px;">1</span>
                            <span style="color: #374151; font-size: 15px; line-height: 1.6; display: inline-block; padding-top: 4px;">Our team will review your submission and eligibility requirements</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="display: flex; align-items: flex-start;">
                            <span style="display: inline-block; min-width: 32px; height: 32px; background-color: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px;">2</span>
                            <span style="color: #374151; font-size: 15px; line-height: 1.6; display: inline-block; padding-top: 4px;">We'll contact you within 24 hours to schedule your free consultation</span>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 12px 0;">
                          <div style="display: flex; align-items: flex-start;">
                            <span style="display: inline-block; min-width: 32px; height: 32px; background-color: #10b981; color: white; border-radius: 50%; text-align: center; line-height: 32px; font-weight: 700; margin-right: 12px;">3</span>
                            <span style="color: #374151; font-size: 15px; line-height: 1.6; display: inline-block; padding-top: 4px;">During the call, we'll discuss your specific situation and certification options</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Contact Info -->
              <table width="100%" cellpadding="0" cellspacing="0" style="border-top: 2px solid #e5e7eb; padding-top: 24px; margin-top: 24px;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
                      Questions? Contact us anytime:
                    </p>
                    <p style="margin: 4px 0;">
                      <a href="mailto:contact@preciseanalytics.io" style="color: #0891b2; text-decoration: none; font-weight: 600;">contact@preciseanalytics.io</a>
                    </p>
                    <p style="margin: 4px 0;">
                      <a href="https://precisegovcon.com" style="color: #0891b2; text-decoration: none; font-weight: 600;">precisegovcon.com</a>
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #065f46; padding: 24px; text-align: center;">
              <p style="margin: 0 0 8px 0; color: #d1fae5; font-size: 13px; font-weight: 600;">
                Â© ${new Date().getFullYear()} Precise GovCon. All rights reserved.
              </p>
              <p style="margin: 0; color: #a7f3d0; font-size: 12px;">
                Helping businesses unlock federal contracting opportunities
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim()

    // Log to console
    console.log('=== New Contact Form Submission ===')
    console.log(emailContent)
    console.log('===================================')

    // Prepare calendar invite if date and time provided
    let icsContent: string | null = null
    if (preferredDate && preferredTime) {
      icsContent = generateICS(name, email, preferredDate, preferredTime, certifications || 'Set-aside certifications')
      console.log('ðŸ“… Calendar invite generated')
    }

    // Send email using Resend
    if (process.env.RESEND_API_KEY) {
      try {
        // 1. Send internal notification to team
        const teamEmailData: any = {
          from: 'Precise GovCon <contact@precisegovcon.com>',
          to: 'contact@preciseanalytics.io',
          subject: subject || `New Set-Aside Certification Inquiry from ${name}`,
          text: emailContent,
          html: htmlContent,
          replyTo: email,
        }

        if (icsContent) {
          teamEmailData.attachments = [
            {
              filename: 'meeting.ics',
              content: Buffer.from(icsContent).toString('base64'),
            }
          ]
        }

        const teamResult = await resend.emails.send(teamEmailData)
        console.log('âœ… Team notification sent:', teamResult)

        // 2. Send confirmation to customer
        const customerEmailData: any = {
          from: 'Precise GovCon <contact@precisegovcon.com>',
          to: email,
          subject: `Confirmation: Your Set-Aside Certification Inquiry`,
          text: `Thank you for your interest in set-aside certifications!\n\nWe've received your inquiry and will contact you within 24 hours at ${email}.\n\n${preferredDate && preferredTime ? `Meeting Request: ${new Date(preferredDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at ${preferredTime}\n\nA calendar invite is attached to this email.\n\n` : ''}Best regards,\nPrecise GovCon Team\n\nQuestions? Reply to this email or visit precisegovcon.com`,
          html: customerConfirmationHTML,
          replyTo: 'contact@preciseanalytics.io',
        }

        if (icsContent) {
          customerEmailData.attachments = [
            {
              filename: 'consultation.ics',
              content: Buffer.from(icsContent).toString('base64'),
            }
          ]
        }

        const customerResult = await resend.emails.send(customerEmailData)
        console.log('âœ… Customer confirmation sent:', customerResult)

      } catch (emailError) {
        console.error('âŒ Email sending failed:', emailError)
        // Don't fail the request if email fails - still return success to user
      }
    } else {
      console.warn('âš ï¸ RESEND_API_KEY not found - email not sent (only logged to console)')
      console.warn('Add RESEND_API_KEY to .env.local to enable email sending')
    }

    return NextResponse.json({
      success: true,
      message: `Thank you! A confirmation has been sent to ${email}. We will contact you within 24 hours.`,
      customerEmail: email
    })

  } catch (error) {
    console.error('Contact form POST error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

// GET - Load user contact info (requires auth)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        phone: true,
        company: true,
        title: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    })

    console.log('Contact GET - User:', JSON.stringify(user, null, 2))
    return NextResponse.json(user)
  } catch (error) {
    console.error('Contact GET error:', error)
    return NextResponse.json(
      { error: 'Failed to load contact info' },
      { status: 500 }
    )
  }
}

// PUT - Update user contact info (requires auth)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('Contact PUT - Request body:', JSON.stringify(body, null, 2))

    const updateData: any = {}
    if (body.phone !== undefined) updateData.phone = clamp(body.phone, 40) || null
    if (body.company !== undefined) updateData.company = clamp(body.company, 120) || null
    if (body.title !== undefined) updateData.title = clamp(body.title, 120) || null
    if (body.addressline1 !== undefined) updateData.addressLine1 = clamp(body.addressline1, 160) || null
    if (body.addressline2 !== undefined) updateData.addressLine2 = clamp(body.addressline2, 160) || null
    if (body.city !== undefined) updateData.city = clamp(body.city, 80) || null
    if (body.state !== undefined) updateData.state = clamp(body.state, 40) || null
    if (body.zip !== undefined) updateData.postalCode = clamp(body.zip, 20) || null
    if (body.country !== undefined) updateData.country = clamp(body.country, 60) || null

    console.log('Contact PUT - Update data:', JSON.stringify(updateData, null, 2))

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email },
      select: { id: true }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updated = await prisma.users.update({
      where: { email },
      data: updateData,
      select: {
        phone: true,
        company: true,
        title: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    })

    console.log('Contact PUT - Updated user:', JSON.stringify(updated, null, 2))
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Contact PUT error details:', error)
    return NextResponse.json(
      { error: 'Failed to save contact info', details: error.message, code: error.code },
      { status: 500 }
    )
  }
}
