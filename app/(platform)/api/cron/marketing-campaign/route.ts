import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'
import { createUnsubscribeToken } from '@/lib/marketing-unsubscribe'

export const runtime = 'nodejs'

type NotificationPrefs = {
  marketingEmails?: boolean
}

type MarketingPrefs = {
  optIn?: boolean
}

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) return process.env.NODE_ENV === 'development'
  return authHeader === `Bearer ${cronSecret}`
}

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function isOptedIn(subscriptions: unknown): boolean {
  const root = asObject(subscriptions)
  const marketing = asObject(root.marketingPreferences) as MarketingPrefs
  if (typeof marketing.optIn === 'boolean') return marketing.optIn

  const settings = asObject(root.settingsNotifications) as NotificationPrefs
  if (typeof settings.marketingEmails === 'boolean') return settings.marketingEmails

  return false
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
  }

  const url = new URL(req.url)
  const campaign = url.searchParams.get('campaign') || 'Precise GovCon Updates'
  const subject = url.searchParams.get('subject') || `${campaign} - Product Updates`
  const headline = url.searchParams.get('headline') || 'Latest updates from Precise GovCon'
  const body =
    url.searchParams.get('body') ||
    'New capability improvements are now available in your account. Sign in to review your newest tools and automation options.'

  const users = await prisma.users.findMany({
    where: { is_active: true },
    select: {
      email: true,
      first_name: true,
      subscriptions: true,
    },
  })

  const appBase = process.env.NEXT_PUBLIC_APP_URL || 'https://www.precisegovcon.com'
  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>'

  const result = { total: users.length, eligible: 0, sent: 0, failed: 0, errors: [] as string[] }

  for (const user of users) {
    try {
      if (!isOptedIn(user.subscriptions)) continue
      result.eligible++

      const token = createUnsubscribeToken(user.email)
      const unsubUrl = `${appBase}/api/marketing/unsubscribe?token=${encodeURIComponent(token)}`
      const name = user.first_name?.trim() || 'there'

      const { error } = await resend.emails.send({
        from,
        to: [user.email],
        subject,
        html: `
          <div style="font-family:Segoe UI,Arial,sans-serif;padding:20px;background:#fff7ed;color:#7c2d12;">
            <h2 style="margin:0 0 10px;">${headline}</h2>
            <p style="margin:0 0 10px;">Hi ${name},</p>
            <p style="margin:0 0 14px;">${body}</p>
            <p style="margin:18px 0 0;font-size:12px;color:#9a3412;">
              Marketing email for ${campaign}. <a href="${unsubUrl}" style="color:#ea580c;">Unsubscribe</a>
            </p>
          </div>
        `,
        text: `${headline}\n\nHi ${name},\n${body}\n\nUnsubscribe: ${unsubUrl}`,
      })

      if (error) {
        result.failed++
        result.errors.push(`${user.email}: ${error.message || 'send failed'}`)
      } else {
        result.sent++
      }
    } catch (error: unknown) {
      result.failed++
      result.errors.push(`${user.email}: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  return NextResponse.json({ ok: true, campaign, subject, ...result, timestamp: new Date().toISOString() })
}
