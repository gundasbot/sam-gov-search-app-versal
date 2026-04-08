import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendWelcomeEmail } from '@/lib/email/welcome'

type WelcomeSource =
  | 'email_signup'
  | 'email_verification'
  | 'google_signup'
  | 'google_signin'
  | 'credentials_signin'

export async function sendSignupWelcomeEmailOnce(params: {
  userId?: string | null
  email: string
  name?: string | null
  source: WelcomeSource
}) {
  const email = String(params.email || '').toLowerCase().trim()
  if (!email) return { sent: false as const, reason: 'missing_email' as const }

  const campaign = 'welcome_signup'
  const where = params.userId
    ? { userId: params.userId, campaign }
    : { email, campaign }

  const existing = await prisma.email_logs.findFirst({
    where: {
      ...where,
      status: 'sent',
    },
    select: { id: true },
  })

  if (existing) {
    return { sent: false as const, reason: 'already_sent' as const }
  }

  const fallbackName = email.split('@')[0] || 'there'
  const safeName = String(params.name || fallbackName).trim() || fallbackName

  try {
    const result = await sendWelcomeEmail(email, safeName)
    const messageId = (result as any)?.data?.id

    await prisma.email_logs.create({
      data: {
        id: crypto.randomUUID(),
        email,
        campaign,
        subject: 'Welcome to Precise GovCon',
        status: 'sent',
        resendMessageId: messageId || undefined,
        userId: params.userId || null,
        metadata: {
          source: params.source,
          sentAt: new Date().toISOString(),
        },
      },
    })

    return { sent: true as const, reason: 'sent' as const }
  } catch (error: any) {
    // Log failure non-blocking so signup/signin flow continues.
    try {
      await prisma.email_logs.create({
        data: {
          id: crypto.randomUUID(),
          email,
          campaign,
          subject: 'Welcome to Precise GovCon',
          status: 'failed',
          userId: params.userId || null,
          metadata: {
            source: params.source,
            error: error?.message || 'unknown',
            failedAt: new Date().toISOString(),
          },
        },
      })
    } catch {
      // If logging fails we still do not block the auth flow.
    }

    return { sent: false as const, reason: 'send_failed' as const }
  }
}
