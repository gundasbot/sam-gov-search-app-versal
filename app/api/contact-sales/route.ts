import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, email, phone, company, title, interested_plan, current_plan, message } = body

    if (!name || !email || !phone || !company || !interested_plan || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const salesEmail = process.env.SALES_EMAIL || 'support@preciseanalytics.com'
    
    // Send email to sales team
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [salesEmail],
      replyTo: email,
      subject: `ðŸŽ¯ New Sales Inquiry: ${interested_plan} Plan - ${company}`,
      html: `
        <h2>ðŸŽ¯ New Sales Inquiry</h2>
        <p><strong>Plan:</strong> ${interested_plan}</p>
        
        <h3>Contact Information</h3>
        <ul>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${phone}</li>
          <li><strong>Title:</strong> ${title || 'Not provided'}</li>
        </ul>

        <h3>Company Information</h3>
        <ul>
          <li><strong>Company:</strong> ${company}</li>
          <li><strong>Current Plan:</strong> ${current_plan}</li>
          <li><strong>Interested Plan:</strong> ${interested_plan}</li>
        </ul>

        <h3>Message</h3>
        <p>${message}</p>

        <hr>
        <p><small>Inquiry received: ${new Date().toLocaleString()}</small></p>
        <p><a href="mailto:${email}">Reply to Customer</a></p>
      `
    })

    // Send confirmation to customer
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
      to: [email],
      subject: 'Thank you for your interest in Precise GovCon',
      html: `
        <h2>âœ… We Received Your Inquiry</h2>
        <p>Hi ${name},</p>
        <p>Thank you for your interest in the <strong>${interested_plan}</strong> plan!</p>
        <p>Our sales team will contact you within <strong>24 hours</strong> at <strong>${email}</strong>.</p>
        <p>Best regards,<br><strong>Precise Analytics Sales Team</strong></p>
      `
    })

    return NextResponse.json({ success: true, message: 'Inquiry sent successfully' })

  } catch (error: any) {
    console.error('Contact sales error:', error)
    return NextResponse.json({ error: 'Failed to process inquiry' }, { status: 500 })
  }
}
