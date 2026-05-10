import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Resend } from 'resend'
import { authOptions } from '@/lib/auth'

export const runtime = 'nodejs'

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'Email service is not configured' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    const notificationType = String(body?.notificationType || 'general').trim() || 'general'

    const resend = new Resend(process.env.RESEND_API_KEY)
    const from = process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>'

    const { data, error } = await resend.emails.send({
      from,
      to: [email],
      subject: `Notification Test: ${notificationType}`,
      html: `
        <div style="font-family:Segoe UI,Arial,sans-serif;padding:20px;background:#f8fafc;color:#0f172a;">
          <h2 style="margin:0 0 12px;color:#0f172a;">Precise GovCon Notification Test</h2>
          <p style="margin:0 0 8px;">Notification type: <strong>${notificationType}</strong></p>
          <p style="margin:0;color:#334155;">If you received this email, your notification route is working.</p>
        </div>
      `,
      text: `Precise GovCon Notification Test\nNotification type: ${notificationType}\nIf you received this email, your notification route is working.`,
    })

    if (error) {
      return NextResponse.json({ error: error.message || 'Failed to send test email' }, { status: 500 })
    }

    return NextResponse.json({ success: true, id: data?.id || null })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to send test notification', details: errorMessage(error) },
      { status: 500 }
    )
  }
}
