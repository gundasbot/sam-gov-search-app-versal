// app/api/auth/forgot-password/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

const resend = new Resend(process.env.RESEND_API_KEY)

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function getAppUrl() {
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'

  return raw.replace(/\/+$/, '')
}

function getLogoUrl(appUrl: string) {
  // Prefer explicit logo URL if provided, otherwise default to /logo.png
  const envLogo = process.env.NEXT_PUBLIC_LOGO_URL
  if (envLogo && /^https?:\/\//i.test(envLogo)) return envLogo
  return `${appUrl}/logo.png`
}

function buildEmailHtml(opts: { appUrl: string; logoUrl: string; resetUrl: string; ttlMinutes: number }) {
  const { appUrl, logoUrl, resetUrl, ttlMinutes } = opts
  const year = new Date().getFullYear()

  // Accessible light-ish background (not too dark), matches your “second image” direction
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Reset your password</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      Reset your Precise GovCon password (expires in ${ttlMinutes} minutes).
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="max-width:640px;width:100%;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid #e2e8f0;">
            <tr>
              <td style="padding:20px 20px 0 20px;">
                <a href="${appUrl}" style="text-decoration:none;">
                  <img src="${logoUrl}" alt="Precise GovCon" style="height:44px;display:block;border:0;outline:none;text-decoration:none;" />
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 20px 8px 20px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;">
                <h1 style="margin:0;font-size:22px;line-height:1.25;font-weight:900;">Reset your password</h1>
                <p style="margin:10px 0 0 0;font-size:14px;line-height:1.6;color:#334155;">
                  We received a request to reset your Precise GovCon password. If you didn’t request this, you can safely ignore this email.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:14px 20px 8px 20px;">
                <a href="${resetUrl}"
                   style="display:inline-block;background:linear-gradient(90deg,#10b981,#06b6d4);
                          color:#ffffff;text-decoration:none;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
                          font-weight:800;font-size:14px;padding:12px 18px;border-radius:12px;">
                  Reset Password
                </a>
              </td>
            </tr>

            <tr>
              <td style="padding:8px 20px 0 20px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#475569;">
                <p style="margin:0;font-size:12px;line-height:1.6;">
                  If the button doesn’t work, copy and paste this link into your browser:
                </p>
                <p style="margin:8px 0 0 0;font-size:12px;line-height:1.6;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:12px;color:#0f172a;">
                  ${resetUrl}
                </p>
                <p style="margin:10px 0 0 0;font-size:12px;line-height:1.6;color:#64748b;">
                  This link expires in <strong>${ttlMinutes} minutes</strong> and can only be used once.
                </p>
              </td>
            </tr>

            <tr>
              <td style="padding:16px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#64748b;font-size:12px;line-height:1.6;">
                Need help? Email <a href="mailto:support@precisegovcon.com" style="color:#0891b2;text-decoration:none;">support@precisegovcon.com</a>.
                <div style="margin-top:6px;">© ${year} Precise GovCon. All rights reserved.</div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body?.email || '').trim().toLowerCase()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ ok: false, error: 'Valid email is required' }, { status: 400 })
    }

    // Security: do not reveal whether the email exists
    const okResponse = NextResponse.json({
      ok: true,
      message: 'If an account exists, you will receive a reset email.',
    })

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) return okResponse

    const ttlMinutes = Number(process.env.RESET_TOKEN_TTL_MINUTES || '30')
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = sha256Hex(rawToken)

    // Ensure only one active token per email
    await prisma.passwordResetToken.deleteMany({ where: { email } })

    // ✅ IMPORTANT: use Prisma field names (not mapped column names)
    await prisma.passwordResetToken.create({
      data: {
        email,
        tokenHash,
        expiresAt,
        usedAt: null,
      },
    })

    const appUrl = getAppUrl()
    const resetUrl = `${appUrl}/reset-password?token=${rawToken}`
    const logoUrl = getLogoUrl(appUrl)

    const html = buildEmailHtml({ appUrl, logoUrl, resetUrl, ttlMinutes })

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || process.env.EMAIL_FROM || 'Precise GovCon <noreply@precisegovcon.com>',
      to: email,
      subject: 'Reset your password - Precise GovCon',
      html,
    })

    return okResponse
  } catch (err) {
    console.error('❌ forgot-password route error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to process request' }, { status: 500 })
  }
}
