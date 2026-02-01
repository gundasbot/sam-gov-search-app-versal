// app/api/contact/enterprise/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { generateEnterpriseInquiryEmail, generateCustomerConfirmationEmail } from '@/lib/email-templates/enterprise-inquiry'

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
      html: generateEnterpriseInquiryEmail({
        customerName: name,
        customerEmail: email,
        companyName: company,
        phoneNumber: phone,
        message,
      }),
    })

    // Send confirmation email to customer
    const customerEmail = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>',
      to: email,
      subject: 'Thank you for your enterprise inquiry',
      html: generateCustomerConfirmationEmail(name),
    })

    console.log('✅ Enterprise inquiry emails sent:', {
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