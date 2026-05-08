// lib/email/send.ts
import { Resend } from 'resend'
import nodemailer from 'nodemailer'
import { getBrand } from './brand'

const RESEND_API_KEY = process.env.RESEND_API_KEY || ''
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null

// ── PurelyMail / SMTP transport (used when SMTP_HOST + SMTP_USER + SMTP_PASS are set) ──
function buildSmtpTransport(): ReturnType<typeof nodemailer.createTransport> | null {
  const host = (process.env.SMTP_HOST || '').trim()
  const user = (process.env.SMTP_USER || '').trim()
  const pass = (process.env.SMTP_PASS || '').trim()
  if (!host || !user || !pass) return null

  const port = parseInt(process.env.SMTP_PORT || '587', 10)
  const secure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465
  const rejectUnauthorized = (process.env.SMTP_TLS_REJECT_UNAUTHORIZED || '').toLowerCase() !== 'false'

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass }, tls: { rejectUnauthorized } })
}

let _smtpTransport: ReturnType<typeof nodemailer.createTransport> | null | undefined = undefined
function getSmtpTransport() {
  if (_smtpTransport !== undefined) return _smtpTransport
  _smtpTransport = buildSmtpTransport()
  return _smtpTransport
}

export interface EmailAttachment {
  file_name: string
  content: string
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
  from,
  replyTo,
  cc,
  bcc,
  attachments,
}: EmailOptions) {
  const brand = getBrand()
  const defaultFrom =
    process.env.EMAIL_FROM ||
    process.env.RESEND_FROM_EMAIL ||
    'Precise GovCon <noreply@precisegovcon.com>'
  const resolvedFrom = from || defaultFrom

  const toList = normalizeEmails(to)
  const ccList = normalizeEmails(cc)
  const bccList = normalizeEmails(bcc)

  if (!toList.length) throw new Error('sendEmail: recipient list is empty')
  if (!subject?.trim()) throw new Error('sendEmail: subject is required')
  if (!html?.trim()) throw new Error('sendEmail: html is required')

  // ── SMTP path (PurelyMail or any SMTP provider) ───────────────────────────
  const smtp = getSmtpTransport()
  if (smtp) {
    try {
      const info = await smtp.sendMail({
        from: resolvedFrom,
        to: toList.join(', '),
        subject,
        html,
        text,
        replyTo,
        cc: ccList.length ? ccList.join(', ') : undefined,
        bcc: bccList.length ? bccList.join(', ') : undefined,
      })
      console.log('✅ Email sent via SMTP:', { messageId: info.messageId, to: toList, subject, brand: brand.name })
      return { success: true, data: { id: info.messageId } }
    } catch (smtpErr) {
      console.error('❌ SMTP send failed — falling back to Resend:', smtpErr)
      // Fall through to Resend below
    }
  }

  // ── Resend path (primary when no SMTP, fallback when SMTP fails) ──────────
  try {
    if (!resend) {
      throw new Error(
        'Neither SMTP nor RESEND_API_KEY is configured. Add SMTP_HOST/SMTP_USER/SMTP_PASS or RESEND_API_KEY to your environment.'
      )
    }

    const payload: any = {
      from: resolvedFrom,
      to: toList,
      subject,
      html,
      text,
    }

    if (replyTo) payload.reply_to = replyTo
    if (ccList.length) payload.cc = ccList
    if (bccList.length) payload.bcc = bccList

    if (attachments?.length) {
      payload.attachments = attachments.map((a) => ({
        file_name: a.file_name,
        content: a.content,
        content_type: a.contentType,
      }))
    }

    const { data, error } = await resend.emails.send(payload)

    if (error) {
      console.error('❌ Resend error sending email:', { message: error.message, to: toList, subject })
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('✅ Email sent via Resend:', { id: data?.id, to: toList, subject, brand: brand.name })
    return { success: true, data }
  } catch (error) {
    console.error('❌ Email send error:', error)
    throw error
  }
}
