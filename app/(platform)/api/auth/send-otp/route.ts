import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import crypto from 'crypto'
import { sendEmail } from '@/lib/email/send'

export const runtime = 'nodejs'

const sql = neon(process.env.DATABASE_URL!)
const AUTH_EMAIL_ALERT_TO = process.env.AUTH_EMAIL_ALERT_TO || 'admin@precisegovcon.com'

async function ensureOtpTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS otp_codes (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      code_hash TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`CREATE INDEX IF NOT EXISTS idx_otp_codes_email ON otp_codes(email)`
  await sql`CREATE INDEX IF NOT EXISTS idx_otp_codes_expires_at ON otp_codes(expires_at)`
}

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

function jsonError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status })
}

async function alertAuthEmailFailure(stage: string, email: string, error: unknown) {
  try {
    const anyErr = error as any
    const message = String(anyErr?.message || error || stage)
    const stack = String(anyErr?.stack || '').slice(0, 5000)
    await sendEmail({
      to: AUTH_EMAIL_ALERT_TO,
      subject: `[Precise GovCon] Auth email failed: ${stage}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;">
          <h2>Auth Email Failure</h2>
          <p><strong>Stage:</strong> ${stage}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Error:</strong> ${message}</p>
          ${stack ? `<pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:14px;border-radius:8px;">${stack}</pre>` : ''}
        </div>
      `,
      text: `Auth Email Failure\nStage: ${stage}\nEmail: ${email}\nError: ${message}${stack ? `\n\n${stack}` : ''}`,
    })
  } catch (alertErr) {
    console.error('send-otp: Failed to alert admin:', alertErr)
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureOtpTable()

    const body = await req.json().catch(() => ({} as any))
    const email = String(body.email ?? '').trim().toLowerCase()
    if (!email) return jsonError('Email is required', 400)

    console.log('send-otp: Checking user for email:', email)

    const users = await sql`
      SELECT id, first_name, email_verified
      FROM users WHERE email = ${email} LIMIT 1
    ` as any[]

    if (!users.length) return jsonError('Account not found', 404)

    const user = users[0]
    if (!user.email_verified) return jsonError('Email not verified', 400)

    const code = crypto.randomInt(100000, 999999).toString()
    const codeHash = sha256(code)
    const otpId = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    await sql`DELETE FROM otp_codes WHERE email = ${email} AND used_at IS NULL AND expires_at > NOW()`
    await sql`INSERT INTO otp_codes (id, email, code_hash, expires_at) VALUES (${otpId}, ${email}, ${codeHash}, ${expiresAt.toISOString()})`

    const name = String(user.first_name || 'there')
    const year = new Date().getFullYear()

    try {
      await sendEmail({
      to: email,
      subject: `Your Precise GovCon sign-in code: ${code}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Inter,'Segoe UI',Arial,sans-serif">
  <div style="max-width:560px;margin:32px auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%);padding:28px 32px;text-align:center">
      <a href="https://precisegovcon.com" style="display:inline-flex;align-items:center;gap:12px;background:#1e293b;border-radius:10px;padding:10px 18px;border:1px solid rgba(249,115,22,0.35);text-decoration:none">
        <img src="https://precisegovcon.com/logo.svg" alt="PreciseGovCon" width="36" height="36" style="display:block;border-radius:6px;flex-shrink:0" />
        <span style="font-size:22px;font-weight:900;color:#ffffff;letter-spacing:-0.5px;font-family:Inter,Arial,sans-serif">Precise</span><span style="font-size:22px;font-weight:900;color:#f97316;letter-spacing:-0.5px;font-family:Inter,Arial,sans-serif">GovCon</span>
      </a>
      <p style="color:#94a3b8;font-size:11px;margin:10px 0 0;letter-spacing:0.1em;text-transform:uppercase;font-weight:600">Federal Opportunity Intelligence</p>
    </div>

    <!-- Body -->
    <div style="padding:36px 32px">
      <p style="font-size:16px;color:#0f172a;font-weight:700;margin:0 0 6px">Hi ${name},</p>
      <p style="font-size:15px;color:#475569;margin:0 0 28px;line-height:1.6">
        You requested a one-time sign-in code for your Precise GovCon account. Use the code below to complete your sign-in.
      </p>

      <!-- Code box -->
      <div style="background:#f8fafc;border:2px solid #e2e8f0;border-radius:14px;padding:28px;text-align:center;margin:0 0 28px">
        <p style="font-size:11px;font-weight:700;color:#94a3b8;letter-spacing:0.12em;text-transform:uppercase;margin:0 0 14px">Your sign-in code</p>
        <p style="font-size:42px;font-weight:900;letter-spacing:14px;margin:0;color:#0f172a;font-family:'Courier New',monospace">${code}</p>
        <p style="font-size:12px;color:#94a3b8;margin:14px 0 0">Expires in <strong style="color:#f97316">15 minutes</strong></p>
      </div>

      <!-- Steps -->
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:18px 22px;margin:0 0 24px">
        <p style="font-size:13px;font-weight:700;color:#c2410c;margin:0 0 10px">How to use this code:</p>
        <ol style="margin:0;padding-left:18px;color:#7c3c00;font-size:13px;line-height:2">
          <li>Return to the PreciseGovCon login page</li>
          <li>Select the <strong>Code</strong> tab</li>
          <li>Enter this 6-digit code</li>
          <li>Click <strong>Verify &amp; Sign In</strong></li>
        </ol>
      </div>

      <p style="font-size:13px;color:#94a3b8;line-height:1.6;margin:0">
        If you did not request this code, you can safely ignore this email. Your account remains secure and no changes have been made.
      </p>
    </div>

    <!-- Footer -->
    <div style="border-top:1px solid #e2e8f0;padding:20px 32px;background:#f8fafc;text-align:center">
      <p style="font-size:12px;color:#94a3b8;margin:0;line-height:1.8">
        &copy; ${year} Precise GovCon &middot; PreciseGovCon<br>
        <a href="https://precisegovcon.com" style="color:#f97316;text-decoration:none;font-weight:600">precisegovcon.com</a>
        &nbsp;&middot;&nbsp;
        <a href="https://precisegovcon.com/privacy" style="color:#94a3b8;text-decoration:none">Privacy Policy</a>
        &nbsp;&middot;&nbsp;
        <a href="https://precisegovcon.com/support" style="color:#94a3b8;text-decoration:none">Support</a>
      </p>
    </div>

  </div>
</body>
</html>`,
      })
    } catch (emailErr) {
      console.error('send-otp: Email send failed:', emailErr)
      await alertAuthEmailFailure('send_otp_failed', email, emailErr)
      return jsonError('Failed to send code. Please try again or contact support.', 500)
    }

    console.log('send-otp: Success for email:', email)
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('send-otp error:', err)
    return jsonError('Failed to send OTP', 500, err?.message)
  }
}
