import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/send'
import { getBrand } from '@/lib/email/brand'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Priority = 'low' | 'normal' | 'high'

const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  normal: 'Normal',
  high: 'High',
}

const PRIORITY_ETA: Record<Priority, string> = {
  low: 'within 2 business days',
  normal: 'within 1 business day',
  high: 'same business day (priority queue)',
}

function sanitize(input: unknown, max = 4000): string {
  return String(input ?? '').trim().slice(0, max)
}

function getPriority(input: unknown): Priority {
  const v = String(input ?? '').toLowerCase().trim()
  if (v === 'low' || v === 'high' || v === 'normal') return v
  return 'normal'
}

function makeTicketId(): string {
  const stamp = Date.now().toString().slice(-6)
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PGC-${stamp}${rand}`
}

function supportOpsHtml(params: {
  ticketId: string
  subject: string
  message: string
  priority: Priority
  name: string
  email: string
  plan: string
}) {
  const { ticketId, subject, message, priority, name, email, plan } = params
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;background:#f6f8fb;padding:20px;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:18px 20px;background:#0f172a;color:#fff;">
        <h2 style="margin:0;font-size:18px;">New Account Support Ticket</h2>
      </div>
      <div style="padding:18px 20px;">
        <p style="margin:0 0 12px 0;"><strong>Reference:</strong> ${ticketId}</p>
        <p style="margin:0 0 8px 0;"><strong>Priority:</strong> ${PRIORITY_LABEL[priority]}</p>
        <p style="margin:0 0 8px 0;"><strong>Subject:</strong> ${subject}</p>
        <p style="margin:0 0 8px 0;"><strong>User:</strong> ${name || 'Unknown'}</p>
        <p style="margin:0 0 8px 0;"><strong>Email:</strong> ${email}</p>
        <p style="margin:0 0 16px 0;"><strong>Plan:</strong> ${plan}</p>
        <div style="border:1px solid #e2e8f0;background:#f8fafc;border-radius:8px;padding:12px;white-space:pre-wrap;">
          ${message || 'No message provided.'}
        </div>
      </div>
    </div>
  </div>`
}

function userAckHtml(params: {
  ticketId: string
  subject: string
  priority: Priority
  userName: string
  appUrl: string
  brandName: string
  supportEmail: string
}) {
  const { ticketId, subject, priority, userName, appUrl, brandName, supportEmail } = params
  const eta = PRIORITY_ETA[priority]
  return `
  <div style="font-family:Segoe UI,Arial,sans-serif;background:#f6f8fb;padding:20px;">
    <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
      <div style="padding:20px;background:linear-gradient(135deg,#1a4bff,#0ea5e9);color:#fff;">
        <h2 style="margin:0;font-size:20px;">We received your support request</h2>
      </div>
      <div style="padding:20px;">
        <p style="margin:0 0 10px 0;">Hi ${userName || 'there'},</p>
        <p style="margin:0 0 14px 0;">Thank you for contacting ${brandName}. Your ticket is now in our queue.</p>
        <p style="margin:0 0 8px 0;"><strong>Reference ID:</strong> ${ticketId}</p>
        <p style="margin:0 0 8px 0;"><strong>Priority:</strong> ${PRIORITY_LABEL[priority]}</p>
        <p style="margin:0 0 8px 0;"><strong>Expected response:</strong> ${eta}</p>
        <p style="margin:0 0 14px 0;"><strong>Subject:</strong> ${subject}</p>
        <div style="border:1px solid #dbeafe;background:#eff6ff;border-radius:8px;padding:12px;margin:0 0 14px 0;">
          <p style="margin:0 0 8px 0;"><strong>What happens next</strong></p>
          <p style="margin:0 0 6px 0;">1. We review and acknowledge your request.</p>
          <p style="margin:0 0 6px 0;">2. We send pertinent next steps and required details by email.</p>
          <p style="margin:0;">3. Reply with your reference ID if you need to add context.</p>
        </div>
        <p style="margin:0 0 14px 0;">Need immediate help? Email <a href="mailto:${supportEmail}">${supportEmail}</a>.</p>
        <a href="${appUrl}/account?tab=support" style="display:inline-block;background:#1a4bff;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">Open Support Center</a>
      </div>
    </div>
  </div>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))

    const subject = sanitize(body?.subject, 180)
    const message = sanitize(body?.message, 5000)
    const priority = getPriority(body?.priority)

    const userName = sanitize(body?.userInfo?.name, 120)
    const userEmail = sanitize(body?.userInfo?.email, 160).toLowerCase()
    const userPlan = sanitize(body?.userInfo?.plan, 40) || 'NONE'

    if (!subject || !message || !userEmail) {
      return NextResponse.json({ error: 'Subject, message, and email are required.' }, { status: 400 })
    }

    const ticketId = makeTicketId()
    const brand = getBrand()

    const supportTo = process.env.SUPPORT_EMAIL || brand.supportEmail || 'support@precisegovcon.com'

    await sendEmail({
      to: supportTo,
      subject: `[Account Support] ${ticketId} • ${PRIORITY_LABEL[priority]} • ${subject}`,
      html: supportOpsHtml({
        ticketId,
        subject,
        message,
        priority,
        name: userName,
        email: userEmail,
        plan: userPlan,
      }),
      text: [
        `Reference: ${ticketId}`,
        `Priority: ${PRIORITY_LABEL[priority]}`,
        `Subject: ${subject}`,
        `User: ${userName}`,
        `Email: ${userEmail}`,
        `Plan: ${userPlan}`,
        '',
        message,
      ].join('\n'),
      replyTo: userEmail,
    })

    await sendEmail({
      to: userEmail,
      subject: `Support Ticket Received (${ticketId})`,
      html: userAckHtml({
        ticketId,
        subject,
        priority,
        userName,
        appUrl: brand.appUrl,
        brandName: brand.name,
        supportEmail: supportTo,
      }),
      text: [
        `Hi ${userName || 'there'},`,
        '',
        `We received your support request.`,
        `Reference ID: ${ticketId}`,
        `Priority: ${PRIORITY_LABEL[priority]}`,
        `Expected response: ${PRIORITY_ETA[priority]}`,
        `Subject: ${subject}`,
        '',
        `What happens next:`,
        `1) We review and acknowledge your request.`,
        `2) We send pertinent next steps and required details by email.`,
        `3) Reply with your reference ID if you need to add context.`,
        '',
        `Support: ${supportTo}`,
      ].join('\n'),
    })

    return NextResponse.json({
      ok: true,
      ticketId,
      eta: PRIORITY_ETA[priority],
      message: 'Support request submitted and acknowledgement email sent.',
    })
  } catch (error) {
    console.error('Support ticket API error:', error)
    return NextResponse.json(
      { error: 'Could not submit support ticket. Please try again shortly.' },
      { status: 500 },
    )
  }
}
