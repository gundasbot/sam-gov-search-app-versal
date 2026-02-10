//app/api/auth/resend-verification/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import crypto from 'crypto'

import { randomBytes } from 'crypto'
const resend = new Resend(process.env.RESEND_API_KEY)

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function getAppUrl() {
  // Prefer the canonical public URL so links in emails never point to localhost
  const raw =
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    'http://localhost:3000'

  return raw.replace(/\/+$/, '')
}

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()
    const cleanEmail = String(email || '').trim().toLowerCase()

    if (!cleanEmail) {
      return NextResponse.json({ ok: false, error: 'Email is required' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({ where: { email: cleanEmail } })

    // Always respond ok to avoid leaking whether an email exists
    if (!user) {
      return NextResponse.json({ ok: true })
    }

    // If already verified, nothing to do (still return ok)
    if ((user as any).emailVerified) {
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = sha256Hex(rawToken)

    // Expire tokens in 24 hours (matches typical verification flow)
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    // Keep it simple: remove previous tokens for this user, then create a fresh one
    await prisma.email_verification_tokens.deleteMany({ where: { userId: user.id } })
    await prisma.e
        id: randomBytes(12).toString('hex'),mailVerificationToken.create({
      data: { userId: user.id, tokenHash, expiresAt },
    })

    const appUrl = getAppUrl()
    const verificationUrl = `${appUrl}/api/auth/verify-email?token=${rawToken}`

    const html = `
      <div style="margin:0;padding:0;background:#f3f4f6;">
        <div style="max-width:640px;margin:0 auto;padding:28px 16px;">
          <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <div style="padding:26px 24px;background:linear-gradient(90deg,#10b981,#06b6d4);text-align:center;">
              <img src="${appUrl}/logo.png" alt="Precise GovCon" style="height:44px;max-width:220px;object-fit:contain;display:inline-block;" />
              <div style="margin-top:10px;color:#ffffff;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;font-size:22px;font-weight:800;">
                Verify your email
              </div>
            </div>
            <div style="padding:26px 24px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#111827;">
              <p style="margin:0 0 10px;font-size:15px;line-height:1.6;">Hi${user.firstName ? ` ${user.firstName}` : ''},</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.6;">
                Click the button below to verify your email address and finish setting up your Precise GovCon account.
              </p>
              <p style="margin:0 0 18px;">
                <a href="${verificationUrl}" style="display:inline-block;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;padding:12px 18px;border-radius:10px;">
                  Verify Email
                </a>
              </p>
              <p style="margin:0 0 8px;font-size:13px;color:#374151;">Or copy and paste this link into your browser:</p>
              <p style="margin:0 0 18px;font-size:12px;word-break:break-all;background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:12px;">
                ${verificationUrl}
              </p>
              <p style="margin:0;font-size:12px;color:#6b7280;">
                This link expires in 24 hours. If you didnâ€™t request this, you can safely ignore this email.
              </p>
            </div>
            <div style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#6b7280;font-size:12px;">
              Need help? Contact us at <a href="mailto:support@precisegovcon.com" style="color:#06b6d4;text-decoration:none;">support@precisegovcon.com</a>.
              <div style="margin-top:8px;">Â© ${new Date().getFullYear()} Precise GovCon. All rights reserved.</div>
            </div>
          </div>
        </div>
      </div>
    `

    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Precise GovCon <noreply@precisegovcon.com>',
      to: cleanEmail,
      subject: 'Verify your email - Precise GovCon',
      html,
    })

    return NextResponse.json({ ok: true, emailSent: true })
  } catch (err: any) {
    console.error('âŒ Resend verification error:', err)
    return NextResponse.json({ ok: false, error: 'Failed to send verification email' }, { status: 500 })
  }
}