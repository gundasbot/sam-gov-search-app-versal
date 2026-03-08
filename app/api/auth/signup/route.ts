// app/api/auth/signup/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL signup endpoint.
// DELETE app/api/auth/register/route.ts — use this one only.
//
// Flow:
//   POST /api/auth/signup
//   → creates user (unverified, trial NOT yet started)
//   → creates email_verification_token
//   → sends verification email with link to /api/auth/verify-email?token=<raw>
//   → returns { success: true, emailSent: true }
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { getBrand } from '@/lib/email/brand'

export const runtime = 'nodejs'

function normalizeTier(raw: unknown): 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' {
  const v = String(raw ?? '').toUpperCase().trim()
  if (v === 'PROFESSIONAL') return 'PROFESSIONAL'
  if (v === 'ENTERPRISE') return 'ENTERPRISE'
  return 'BASIC'
}

function normalizeInterval(raw: unknown): 'MONTHLY' | 'ANNUAL' {
  return /annual|year/i.test(String(raw ?? '')) ? 'ANNUAL' : 'MONTHLY'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Accept both camelCase and snake_case field names
    const email      = String(body.email ?? '').toLowerCase().trim()
    const password   = String(body.password ?? '')
    const first_name = String(body.first_name || body.firstName || '').trim()
    const last_name  = String(body.last_name  || body.lastName  || '').trim()
    const phone      = String(body.phone      || '').trim() || undefined
    const company    = String(body.company    || '').trim() || undefined

    const pendingTier     = normalizeTier(body.selectedPlanTier || body.plan)
    const pendingInterval = normalizeInterval(body.selectedBillingInterval || body.billing)

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'First name, last name, email, and password are required' },
        { status: 400 }
      )
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    const existing = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email_verified: true },
    })

    if (existing) {
      // If unverified, allow re-send without revealing the account exists
      if (!existing.email_verified) {
        await resendVerification(existing.id, email, first_name)
        return NextResponse.json({
          success: true,
          emailSent: true,
          message: 'Verification email resent. Please check your inbox.',
        })
      }
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // ── Create user (NOT yet active — trial starts on email verification) ─────
    const passwordHash = await hash(password, 12)
    const now = new Date()

    const user = await prisma.users.create({
      data: {
        id:               crypto.randomUUID(),
        updated_at:       now,
        email,
        first_name,
        last_name,
        name:             `${first_name} ${last_name}`,
        password_hash:    passwordHash,
        phone:            phone ?? null,
        company:          company ?? null,
        role:             'user',
        plan:             'trial',
        plan_tier:        pendingTier,
        plan_status:      'pending_verification',
        subscription_status: 'pending_verification',
        billing_interval: pendingInterval,
        trial_active:     false,          // starts on email click
        trial_started_at: null,
        trial_expires_at: null,
        trial_ends_at:    null,
        email_verified:   null,
        is_active:        false,
        is_suspended:     false,
      },
    })

    // ── Send verification email ───────────────────────────────────────────────
    const emailSent = await resendVerification(user.id, email, first_name)

    if (!emailSent) {
      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          warning: 'EMAIL_SEND_FAILED',
          message: 'Account created but verification email failed to send. Contact support.',
          user_id: user.id,
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        emailSent: true,
        message: 'Account created! Check your inbox to verify your email and start your free trial.',
        user_id: user.id,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('❌ Signup error:', err)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}

// ─── helper: create token + send email ────────────────────────────────────────

async function resendVerification(
  userId: string,
  email: string,
  firstName: string
): Promise<boolean> {
  try {
    // Delete any existing tokens for this user
    await prisma.email_verification_tokens.deleteMany({ where: { user_id: userId } })

    const rawToken  = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.email_verification_tokens.create({
      data: {
        id:         crypto.randomUUID(),
        user_id:    userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: new Date(),
      },
    })

    const brand      = getBrand()
    const verifyUrl  = `${brand.appUrl}/api/auth/verify-email?token=${rawToken}`
    const name       = firstName || 'there'

    const html = buildVerificationEmail(name, verifyUrl)
    const text = `Hi ${name},\n\nVerify your email and start your free trial:\n${verifyUrl}\n\nLink expires in 24 hours.`

    await sendEmail({
      to:      email,
      subject: `Verify Your Email – ${brand.name}`,
      html,
      text,
    })

    console.log('✅ Verification email sent to:', email)
    return true
  } catch (err: any) {
    console.error('❌ Verification email error:', err.message)
    return false
  }
}

function buildVerificationEmail(name: string, verifyUrl: string): string {
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr>
          <td style="padding:40px;background:linear-gradient(135deg,#0f172a,#1e293b);
                     border-radius:16px 16px 0 0;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:900;">
              PRECISE<span style="color:#f97316;">GOVCON</span>
            </h1>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:700;">Hi ${name},</p>
            <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
              You're one click away from activating your <strong>7-day free trial</strong>.<br>
              Verify your email to get instant access.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:16px 0 32px;">
                <a href="${verifyUrl}"
                   style="display:inline-block;padding:16px 48px;background:#059669;
                          color:#ffffff;text-decoration:none;font-weight:900;font-size:16px;
                          border-radius:12px;letter-spacing:0.02em;">
                  Verify Email &amp; Start Free Trial →
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or paste this link in your browser:</p>
            <p style="margin:0 0 24px;padding:12px;background:#f1f5f9;border-radius:8px;
                      color:#334155;font-size:12px;word-break:break-all;font-family:monospace;">
              ${verifyUrl}
            </p>
            <p style="margin:0;color:#94a3b8;font-size:13px;">
              This link expires in 24 hours. If you didn't sign up, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#f8fafc;border-radius:0 0 16px 16px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              © ${new Date().getFullYear()} Precise GovCon LLC · Richmond, Virginia
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}