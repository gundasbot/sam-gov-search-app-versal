import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Resend } from 'resend'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service is not configured' }, { status: 500 })
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { first_name: true, subscriptions: true },
    })

    const subscriptions =
      user?.subscriptions && typeof user.subscriptions === 'object' && !Array.isArray(user.subscriptions)
        ? (user.subscriptions as Record<string, unknown>)
        : {}

    const prefs =
      subscriptions.settingsNotifications &&
      typeof subscriptions.settingsNotifications === 'object' &&
      !Array.isArray(subscriptions.settingsNotifications)
        ? (subscriptions.settingsNotifications as Record<string, boolean>)
        : {}

    if (prefs.emailAlerts === false) {
      return NextResponse.json(
        { error: 'Email alerts are disabled in your notification settings.' },
        { status: 400 }
      )
    }

    const enabledKeys = Object.entries(prefs)
      .filter(([, value]) => Boolean(value))
      .map(([key]) => key)

    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>'
    const name = user?.first_name?.trim() || 'there'

    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject: 'Your Precise GovCon Notification Digest',
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;padding:20px;background:#f8fafc;color:#0f172a;">
          <h2 style="margin:0 0 10px;">Hi ${name}, here is your digest</h2>
          <p style="margin:0 0 10px;color:#334155;">Enabled notification channels: ${enabledKeys.length ? enabledKeys.join(', ') : 'none configured'}</p>
          <p style="margin:0;color:#334155;">This route is now active and can be triggered by scheduler/cron next.</p>
        </div>
      `,
      text: `Hi ${name}, here is your digest. Enabled notification channels: ${enabledKeys.length ? enabledKeys.join(', ') : 'none configured'}.`,
    })

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to send digest email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id || null, enabledChannels: enabledKeys })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to send digest notification', details: errorMessage(error) },
      { status: 500 }
    )
  }
}
