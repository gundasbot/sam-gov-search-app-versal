// app/api/eligibility-check/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const { name, email, company, phone, certifications } = data

    // TODO: Send email notification to sales@precisegovcon.com
    // TODO: Or save to database for follow-up
    
    // For now, just log it (you'll want to implement email/database logic)
    console.log('Eligibility Check Submission:', {
      name,
      email,
      company,
      phone,
      certifications,
      timestamp: new Date().toISOString(),
    })

    // Example: Send email using your email service
    // await sendEmail({
    //   to: 'sales@precisegovcon.com',
    //   subject: `Eligibility Check Request - ${company}`,
    //   body: `
    //     New eligibility check request:
    //     
    //     Name: ${name}
    //     Email: ${email}
    //     Company: ${company}
    //     Phone: ${phone}
    //     
    //     Certifications of Interest:
    //     ${certifications.join(', ')}
    //   `
    // })

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Eligibility check error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}