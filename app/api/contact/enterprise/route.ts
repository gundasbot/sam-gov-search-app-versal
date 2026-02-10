// app/api/contact/enterprise/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: NextRequest) {
  try {
    const { name, email, company, phone, message } = await request.json()

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      )
    }

    // Send email to sales team
    const salesEmail = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>',
      to: process.env.SALES_EMAIL || 'sales@precisegovcon.com',
      subject: `New Enterprise Inquiry from ${name}`,
      html: `
        <html>
          <body>
            <h2>New Enterprise Inquiry</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Company:</strong> ${company || 'Not provided'}</p>
            <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
            <p><strong>Message:</strong></p>
            <p>${message || 'No message provided'}</p>
          </body>
        </html>
      `,
    })

    // Send confirmation email to customer
    const customerEmail = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>',
      to: email,
      subject: 'Thank you for your enterprise inquiry',
      html: `
        <html>
          <body>
            <h2>Thank you for your inquiry, ${name}!</h2>
            <p>We have received your enterprise inquiry and our team will contact you shortly.</p>
            <p>If you have any urgent questions, please contact us at support@precisegovcon.com</p>
          </body>
        </html>
      `,
    })

    console.log('âœ… Enterprise inquiry emails sent:', {
      salesEmailId: salesEmail.data?.id,
      customerEmailId: customerEmail.data?.id,
    })

    return NextResponse.json({
      success: true,
      message: 'Your inquiry has been sent successfully',
    })
  } catch (error) {
    console.error('Enterprise contact error:', error)
    return NextResponse.json(
      { error: 'Failed to send inquiry' },
      { status: 500 }
    )
  }
}