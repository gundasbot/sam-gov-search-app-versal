import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic'

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

    if (!firstName || !lastName || !email || !inquiryType || !message) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }

    if (!process.env.RESEND_API_KEY) {
      // Don’t crash prod — return a useful error so UI can show a fallback
      return NextResponse.json(
        { error: 'Email service is not configured. Please email support@precisegovcon.com.' },
        { status: 500 }
      )
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const to = getSupportTo()
    const from = getFrom()

    const subject = `[Support] ${inquiryType} — ${firstName} ${lastName}`
    const text = [
      `Name: ${firstName} ${lastName}`,
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      company ? `Company: ${company}` : null,
      `Inquiry Type: ${inquiryType}`,
      '',
      `Message:`,
      message,
    ]
      .filter(Boolean)
      .join('\n')

    await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject,
      text,
    })

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Could not send message. Please email support@precisegovcon.com.' },
      { status: 500 }
    )
  }
}
