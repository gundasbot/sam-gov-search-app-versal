// app/api/account/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'
import { resolvePublicAppUrl } from '@/lib/url-safety'

const resend = new Resend(process.env.RESEND_API_KEY)

function getAppUrl() {
  // Outbound email links should always be public and never localhost.
  return resolvePublicAppUrl(
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL
  )
}

function getBrand() {
  return {
    name: process.env.BRAND_NAME || 'Precise GovCon',
    logoUrl: process.env.BRAND_LOGO_URL || `${getAppUrl()}/logo.png`,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@precisegovcon.com',
    from:
      process.env.RESEND_FROM_EMAIL ||
      process.env.EMAIL_FROM ||
      'Precise GovCon <noreply@precisegovcon.com>',
  }
}

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function POST(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email
    const brand = getBrand()

    // If already verified, return success (idempotent)
    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email_verified: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.email_verified) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }

    // Clear any existing tokens for this user to avoid confusion
    await prisma.email_verification_tokens.deleteMany({ where: { user_id: user.id } })

    const token = crypto.randomBytes(32).toString('hex')
    const tokenHash = sha256Hex(token)
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60) // 1 hour

    // Store ONLY the hash in DB (confirm route looks up token_hash)
    await prisma.email_verification_tokens.create({
      data: {
        id: crypto.randomUUID(), // âœ… REQUIRED by your Prisma schema
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
      },
    })

    const verifyUrl = `${getAppUrl()}/verify-email?token=${encodeURIComponent(token)}`
    const subject = `Verify your email for ${brand.name}`

    const html = `
<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#0b1220;font-family:Arial,sans-serif;color:#e2e8f0;">
    <div style="max-width:640px;margin:0 auto;padding:24px;">
      <div style="background:#0f172a;border:1px solid rgba(148,163,184,.25);border-radius:16px;overflow:hidden;">
        <div style="padding:18px 18px 12px 18px;background:linear-gradient(135deg,#0d9488 0%,#0891b2 100%);">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td style="vertical-align:middle;">
                <img src="${brand.logoUrl}" alt="${brand.name}" style="height:40px;width:auto;display:block;" />
              </td>
            </tr>
          </table>
          <div style="margin-top:12px;font-size:18px;font-weight:800;color:#fff;">Verify your email</div>
          <div style="margin-top:6px;font-size:13px;color:#d1fae5;">Confirm your address to enable full account features.</div>
        </div>

        <div style="padding:18px;">
          <p style="margin:0 0 10px 0;color:#e2e8f0;line-height:1.6;">
            Click the button below to verify <strong>${email}</strong>.
          </p>

          <div style="margin:16px 0;">
            <a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;border-radius:10px;background:#10b981;color:#0b1220;font-weight:800;text-decoration:none;">
              Verify Email â†’
            </a>
          </div>

          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.6;">
            This link expires in 1 hour. If you didnâ€™t request this, you can ignore this email.
          </p>

          <div style="margin-top:14px;color:#94a3b8;font-size:12px;">
            Need help? Contact <a href="mailto:${brand.supportEmail}" style="color:#38bdf8;text-decoration:none;">${brand.supportEmail}</a>
          </div>
        </div>
      </div>
    </div>
  </body>
</html>
    `.trim()

    const text = `Verify your email for ${brand.name}

Verify: ${verifyUrl}

This link expires in 1 hour.
Support: ${brand.supportEmail}
`

    await resend.emails.send({
      from: brand.from,
      to: email,
      subject,
      html,
      text,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error sending verification email:', error)
    return NextResponse.json(
      { error: 'Failed to send verification email', details: error?.message },
      { status: 500 }
    )
  }
}
