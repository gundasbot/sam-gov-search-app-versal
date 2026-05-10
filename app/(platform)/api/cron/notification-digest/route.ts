import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

type NotificationPrefs = {
  emailAlerts?: boolean
  dailyDigest?: boolean
  weeklyReport?: boolean
  opportunityReminders?: boolean
  systemNotifications?: boolean
  smsAlerts?: boolean
}

function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    return process.env.NODE_ENV === 'development'
  }

  return authHeader === `Bearer ${cronSecret}`
}

function normalizePrefs(raw: unknown): NotificationPrefs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {}
  return raw as NotificationPrefs
}

function shouldSendDaily(nowUtc: Date): boolean {
  return nowUtc.getUTCHours() === 13
}

function shouldSendWeekly(nowUtc: Date): boolean {
  const isMonday = nowUtc.getUTCDay() === 1
  const targetHour = nowUtc.getUTCHours() === 13
  return isMonday && targetHour
}

function buildDigestHtml(name: string, kind: 'daily' | 'weekly', enabledChannels: string[]) {
  const title = kind === 'weekly' ? 'Weekly Digest' : 'Daily Digest'
  const channels = enabledChannels.length ? enabledChannels.join(', ') : 'none configured'

  return `
    <div style="font-family:Segoe UI,Arial,sans-serif;padding:20px;background:#f8fafc;color:#0f172a;">
      <h2 style="margin:0 0 10px;">Hi ${name}, your ${title} is ready</h2>
      <p style="margin:0 0 8px;color:#334155;">Enabled channels: ${channels}</p>
      <p style="margin:0;color:#334155;">This message was sent by the scheduled notification service.</p>
    </div>
  `
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'RESEND_API_KEY is not configured' }, { status: 500 })
  }

  const nowUtc = new Date()
  const url = new URL(req.url)
  const force = url.searchParams.get('force') === '1'

  const runDaily = force || shouldSendDaily(nowUtc)
  const runWeekly = force || shouldSendWeekly(nowUtc)

  if (!runDaily && !runWeekly) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'Not in daily/weekly send window',
      timestamp: nowUtc.toISOString(),
    })
  }

  const users = await prisma.users.findMany({
    where: { is_active: true },
    select: {
      id: true,
      email: true,
      first_name: true,
      subscriptions: true,
    },
  })

  const resend = new Resend(process.env.RESEND_API_KEY)
  const from = process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>'

  const result = {
    totalUsers: users.length,
    attempted: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    errors: [] as string[],
  }

  for (const user of users) {
    try {
      const subscriptions =
        user.subscriptions && typeof user.subscriptions === 'object' && !Array.isArray(user.subscriptions)
          ? (user.subscriptions as Record<string, unknown>)
          : {}

      const prefs = normalizePrefs(subscriptions.settingsNotifications)

      if (prefs.emailAlerts === false) {
        result.skipped++
        continue
      }

      const wantsDaily = prefs.dailyDigest !== false
      const wantsWeekly = Boolean(prefs.weeklyReport)

      let digestKind: 'daily' | 'weekly' | null = null
      if (runWeekly && wantsWeekly) {
        digestKind = 'weekly'
      } else if (runDaily && wantsDaily) {
        digestKind = 'daily'
      }

      if (!digestKind) {
        result.skipped++
        continue
      }

      const enabledChannels = Object.entries(prefs)
        .filter(([, value]) => Boolean(value))
        .map(([key]) => key)

      result.attempted++

      const subject =
        digestKind === 'weekly'
          ? 'Your Precise GovCon Weekly Notification Digest'
          : 'Your Precise GovCon Daily Notification Digest'

      const { error } = await resend.emails.send({
        from,
        to: [user.email],
        subject,
        html: buildDigestHtml(user.first_name?.trim() || 'there', digestKind, enabledChannels),
        text: `${digestKind === 'weekly' ? 'Weekly' : 'Daily'} digest for ${user.email}. Enabled channels: ${enabledChannels.join(', ') || 'none configured'}.`,
      })

      if (error) {
        result.failed++
        result.errors.push(`${user.email}: ${error.message || 'send failure'}`)
      } else {
        result.sent++
      }
    } catch (error: unknown) {
      result.failed++
      const msg = error instanceof Error ? error.message : String(error)
      result.errors.push(`${user.email}: ${msg}`)
    }
  }

  return NextResponse.json({
    ok: true,
    runDaily,
    runWeekly,
    timestamp: nowUtc.toISOString(),
    ...result,
  })
}
