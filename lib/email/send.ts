// lib/email/send.ts
import { Resend } from 'resend'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''

// Create the client only if configured (prevents confusing runtime behavior)
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

export interface EmailAttachment {
  file_name: string
  content: string // base64 encoded string
  contentType?: string
}

export interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text?: string
  from?: string
  replyTo?: string
  cc?: string | string[]
  bcc?: string | string[]
  attachments?: EmailAttachment[]
}

function normalizeEmails(v?: string | string[]): string[] {
  if (!v) return []
  const arr = Array.isArray(v) ? v : [v]
  const flattened: string[] = []
  for (const item of arr) {
    if (!item) continue
    if (typeof item !== 'string') continue
    item
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((e) => flattened.push(e))
  }
  return Array.from(new Set(flattened))
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from = process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>',
  replyTo,
  cc,
  bcc,
  attachments,
}: EmailOptions) {
  try {
    if (!resend) {
      throw new Error(
        'RESEND_API_KEY is not set. Cannot send email. Add RESEND_API_KEY to your environment.'
      )
    }

    const toList = normalizeEmails(to)
    const ccList = normalizeEmails(cc)
    const bccList = normalizeEmails(bcc)

    if (!toList.length) {
      throw new Error('sendEmail: recipient list is empty')
    }
    if (!subject?.trim()) {
      throw new Error('sendEmail: subject is required')
    }
    if (!html?.trim()) {
      throw new Error('sendEmail: html is required')
    }

    const payload: any = {
      from,
      to: toList,
      subject,
      html,
      text,
    }

    if (replyTo) payload.reply_to = replyTo
    if (ccList.length) payload.cc = ccList
    if (bccList.length) payload.bcc = bccList

    // Resend attachments: { file_name, content, content_type }
    if (attachments?.length) {
      payload.attachments = attachments.map((a) => ({
        file_name: a.file_name,
        content: a.content,
        content_type: a.contentType,
      }))
    }

    const { data, error } = await resend.emails.send(payload)

    if (error) {
      console.error('❌ Resend error sending email:', {
        message: error.message,
        name: (error as any).name,
        to: toList,
        subject,
      })
      throw new Error(`Failed to send email: ${error.message}`)
    }

    // ✅ log message id so you can cross-check in Resend dashboard
    console.log('✅ Email sent via Resend:', {
      id: data?.id,
      to: toList,
      subject,
    })

    return { success: true, data }
  } catch (error) {
    console.error('❌ Email send error:', error)
    throw error
  }
}
