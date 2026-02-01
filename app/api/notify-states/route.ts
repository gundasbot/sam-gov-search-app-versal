import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const runtime = 'nodejs' // Resend uses node APIs; keep it on node runtime

const resend = new Resend(process.env.RESEND_API_KEY)

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const {
      firstName,
      lastName,
      company,
      email,
      phone,
      position,
      message,
      featureName,
      contactContext,
      page,
    } = body ?? {}

    // Basic validation
    if (!firstName || !lastName || !company || !email || !phone || !position) {
      return NextResponse.json(
        { ok: false, error: 'Missing required fields.' },
        { status: 400 }
      )
    }

    if (!isValidEmail(String(email))) {
      return NextResponse.json({ ok: false, error: 'Invalid email.' }, { status: 400 })
    }

    const toEmail = process.env.LEADS_TO_EMAIL || 'sales@precisegovcon.com'
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'Precise GovCon <no-reply@precisegovcon.com>'

    const safeContext = contactContext === 'state-notify' ? 'State Notify' : 'General'
    const subject = `[${safeContext}] New request from ${firstName} ${lastName} (${company})`

    const text = [
      `New submission received`,
      ``,
      `Context: ${safeContext}`,
      `Feature: ${featureName || 'N/A'}`,
      `Page: ${page || 'N/A'}`,
      ``,
      `Name: ${firstName} ${lastName}`,
      `Company: ${company}`,
      `Title: ${position}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      ``,
      `Message:`,
      `${message || '(none)'}`,
      ``,
      `Submitted at: ${new Date().toISOString()}`,
    ].join('\n')

    const html = `
      <div style="font-family: ui-sans-serif, system-ui; line-height:1.5">
        <h2>New submission received</h2>
        <p><b>Context:</b> ${safeContext}</p>
        <p><b>Feature:</b> ${featureName || 'N/A'}</p>
        <p><b>Page:</b> ${page || 'N/A'}</p>
        <hr/>
        <p><b>Name:</b> ${firstName} ${lastName}</p>
        <p><b>Company:</b> ${company}</p>
        <p><b>Title:</b> ${position}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Phone:</b> ${phone}</p>
        <p><b>Message:</b><br/>${String(message || '(none)').replace(/\n/g, '<br/>')}</p>
        <hr/>
        <p style="color:#6b7280;font-size:12px">Submitted at ${new Date().toISOString()}</p>
      </div>
    `

    const { error } = await resend.emails.send({
      from: fromEmail,
      to: [toEmail],
      replyTo: String(email), // lets you reply directly to the requester
      subject,
      text,
      html,
    })

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Server error' },
      { status: 500 }
    )
  }
}

