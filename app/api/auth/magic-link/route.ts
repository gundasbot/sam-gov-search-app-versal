// app/api/auth/magic-link/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const runtime = 'nodejs'

const sql = neon(process.env.DATABASE_URL!)

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

// POST /api/auth/magic-link — generate and send magic link
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any))
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!email) return NextResponse.json({ error: 'Email is required' }, { status: 400 })

    // Check user exists and is verified
    const users = await sql`
      SELECT id, first_name, email_verified FROM users
      WHERE email = ${email} LIMIT 1
    ` as any[]

    if (!users.length) return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    const user = users[0]
    if (!user.email_verified) return NextResponse.json({ error: 'Email not verified' }, { status: 400 })

    // Generate secure token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = sha256(rawToken)
    const tokenId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

    // Store in auto_login_tokens (reuse existing table)
    await prisma.auto_login_tokens.create({
      data: {
        id: tokenId,
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    })

    const baseUrl = process.env.NEXTAUTH_URL || 'https://precisegovcon.com'
    const magicUrl = `${baseUrl}/api/auth/magic-link/verify?token=${rawToken}`
    const name = String(user.first_name || 'there')
    const year = new Date().getFullYear()

    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY!)
    const from = process.env.EMAIL_FROM || 'Precise GovCon <no-reply@precisegovcon.com>'

    await resend.emails.send({
      from,
      to: email,
      subject: 'Your sign-in link for Precise GovCon',
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,'Segoe UI',Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%);padding:28px 32px;text-align:center">
      <a href="https://precisegovcon.com" style="display:inline-flex;align-items:center;gap:12px;background:#1e293b;border-radius:10px;padding:10px 18px;border:1px solid rgba(249,115,22,0.35);text-decoration:none">
        <img src="https://precisegovcon.com/logo.svg" alt="PreciseGovCon" width="36" height="36" style="display:block;border-radius:6px;flex-shrink:0" />
        <span style="font-size:22px;font-weight:900;color:#ffffff;font-family:Inter,Arial,sans-serif">Precise</span><span style="font-size:22px;font-weight:900;color:#f97316;font-family:Inter,Arial,sans-serif">GovCon</span>
      </a>
      <p style="color:#94a3b8;font-size:11px;margin:10px 0 0;letter-spacing:0.1em;text-transform:uppercase;font-weight:600">Federal Opportunity Intelligence</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px;text-align:center">
      <p style="font-size:16px;color:#0f172a;font-weight:700;margin:0 0 6px;text-align:left">Hi ${name},</p>
      <p style="font-size:15px;color:#475569;margin:0 0 32px;line-height:1.6;text-align:left">
        Click the button below to sign in to your Precise GovCon account. This link expires in <strong>15 minutes</strong> and can only be used once.
      </p>

      <!-- CTA Button -->
      <a href="${magicUrl}"
        style="display:inline-block;background:#f97316;color:#ffffff;font-size:18px;font-weight:800;padding:16px 40px;border-radius:12px;text-decoration:none;letter-spacing:0.01em;box-shadow:0 4px 16px rgba(249,115,22,0.4)">
        Sign In to PreciseGovCon →
      </a>

      <p style="font-size:13px;color:#94a3b8;margin:28px 0 0;line-height:1.6">
        Or copy and paste this link into your browser:<br>
        <a href="${magicUrl}" style="color:#f97316;word-break:break-all;font-size:12px">${magicUrl}</a>
      </p>

      <div style="margin:28px 0 0;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0">
        <p style="font-size:13px;color:#475569;margin:0">
          🔒 This is a secure, one-time link. If you didn't request this, you can safely ignore this email — your account remains secure.
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e2e8f0;padding:20px 32px;background:#f8fafc;text-align:center">
      <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.8">
        &copy; ${year} Precise Analytics LLC &middot; PreciseGovCon<br>
        <a href="https://precisegovcon.com" style="color:#f97316;text-decoration:none;font-weight:600">precisegovcon.com</a>
        &nbsp;&middot;&nbsp;
        <a href="https://precisegovcon.com/support" style="color:#94a3b8;text-decoration:none">Support</a>
      </p>
    </div>
  </div>
</body>
</html>`,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('magic-link POST error:', err)
    return NextResponse.json({ error: 'Failed to send link' }, { status: 500 })
  }
}
