import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { verifyUnsubscribeToken } from '@/lib/marketing-unsubscribe'

export const runtime = 'nodejs'
const sql = neon(process.env.DATABASE_URL!)

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token') || ''

  if (!token) {
    return new NextResponse('<h1>Invalid unsubscribe link</h1>', {
      status: 400,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  try {
    const { email } = verifyUnsubscribeToken(token)

    await sql`
      UPDATE users
      SET subscriptions =
        jsonb_set(
          jsonb_set(
            COALESCE(subscriptions, '{}'::jsonb),
            '{marketingPreferences}',
            COALESCE(subscriptions->'marketingPreferences', '{}'::jsonb) || jsonb_build_object('optIn', false, 'updatedAt', NOW(), 'unsubscribedAt', NOW()),
            true
          ),
          '{settingsNotifications}',
          COALESCE(subscriptions->'settingsNotifications', '{}'::jsonb) || jsonb_build_object('marketingEmails', false),
          true
        )
      WHERE email = ${email}
    `

    return new NextResponse(
      `
      <!doctype html>
      <html>
      <head><meta charset="utf-8" /><title>Unsubscribed</title></head>
      <body style="font-family:Segoe UI,Arial,sans-serif;background:#fff7ed;color:#7c2d12;padding:32px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #fdba74;border-radius:14px;padding:24px;">
          <h1 style="margin:0 0 8px;">You are unsubscribed</h1>
          <p style="margin:0;">Marketing emails have been disabled for ${email}.</p>
        </div>
      </body>
      </html>
      `,
      { headers: { 'content-type': 'text/html; charset=utf-8' } }
    )
  } catch {
    return new NextResponse(
      '<h1>Unsubscribe link is invalid or expired.</h1>',
      { status: 400, headers: { 'content-type': 'text/html; charset=utf-8' } }
    )
  }
}
