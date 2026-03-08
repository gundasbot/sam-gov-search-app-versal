// app/api/auth/verify-email/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/auth/verify-email?token=<raw>
//   1. Validates token
//   2. Activates user: sets email_verified, trial_active, trial dates
//   3. Mints a NextAuth JWT → sets session cookie → user is logged in
//   4. Sets pgc_welcome cookie for welcome banner
//   5. Redirects to /search
//
// POST /api/auth/verify-email  (programmatic, returns JSON)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { encode } from 'next-auth/jwt'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

const TRIAL_DAYS = 7

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

// ─── core verification logic ──────────────────────────────────────────────────

async function verifyAndActivate(rawToken: string): Promise<
  | { ok: true;  user: { id: string; email: string; name: string | null } }
  | { ok: false; error: string; alreadyVerified?: boolean }
> {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const now       = new Date()

  const tokenRow = await prisma.email_verification_tokens.findUnique({
    where: { token_hash: tokenHash },
    select: { id: true, user_id: true, expires_at: true },
  })

  if (!tokenRow) {
    return { ok: false, error: 'Invalid or expired verification link.' }
  }

  if (tokenRow.expires_at < now) {
    await prisma.email_verification_tokens.delete({ where: { token_hash: tokenHash } }).catch(() => {})
    return { ok: false, error: 'This verification link has expired. Please request a new one.' }
  }

  const user = await prisma.users.findUnique({
    where: { id: tokenRow.user_id },
    select: {
      id: true, email: true, name: true, first_name: true, last_name: true,
      email_verified: true, plan_tier: true,
    },
  })

  if (!user) {
    return { ok: false, error: 'Account not found.' }
  }

  if (user.email_verified) {
    // Already verified — still log them in
    await prisma.email_verification_tokens.delete({ where: { token_hash: tokenHash } }).catch(() => {})
    return { ok: true, user: { id: user.id, email: user.email, name: user.name } }
  }

  // ── Activate the account ──────────────────────────────────────────────────
  const trialEndsAt = endOfDay(new Date(now.getTime() + TRIAL_DAYS * 86400000))

  await prisma.users.update({
    where: { id: user.id },
    data: {
      email_verified:   now,
      is_active:        true,
      plan_status:      'trialing',
      subscription_status: 'trialing',
      trial_active:     true,
      trial_started_at: now,
      trial_expires_at: trialEndsAt,
      trial_ends_at:    trialEndsAt,
      updated_at:       now,
    },
  })

  // Delete used token (non-critical)
  await prisma.email_verification_tokens.delete({ where: { token_hash: tokenHash } }).catch(() => {})

  // Send welcome email non-blocking
  sendWelcomeEmailSilent(
    user.email,
    user.name || user.first_name || 'there'
  )

  return {
    ok: true,
    user: {
      id:    user.id,
      email: user.email,
      name:  user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || null,
    },
  }
}

// ─── mint session cookie ──────────────────────────────────────────────────────

async function mintSessionCookie(
  userId: string,
  email: string,
  name: string | null,
  isSecure: boolean
): Promise<{ cookieName: string; cookieValue: string }> {
  const secret = process.env.NEXTAUTH_SECRET!
  const maxAge = 30 * 24 * 60 * 60

  const cookieValue = await encode({
    secret,
    maxAge,
    token: {
      sub:             userId,
      id:              userId,
      email,
      name:            name ?? undefined,
      role:            'user',
      tier:            'BASIC',
      status:          'trialing',
      trial_active:    true,
      hasSubscription: false,
      iat:             Math.floor(Date.now() / 1000),
      exp:             Math.floor(Date.now() / 1000) + maxAge,
      jti:             crypto.randomUUID(),
    } as any,
  })

  const cookieName = isSecure
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'

  return { cookieName, cookieValue }
}

// ─── GET ─────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  const rawToken = req.nextUrl.searchParams.get('token')

  if (!rawToken) {
    return NextResponse.redirect(new URL('/login?error=invalid-token', req.url))
  }

  const result = await verifyAndActivate(rawToken)

  if (!result.ok) {
    const msg = encodeURIComponent(result.error)
    return NextResponse.redirect(new URL(`/login?error=${msg}`, req.url))
  }

  const { user } = result
  const isSecure = req.url.startsWith('https')
  const { cookieName, cookieValue } = await mintSessionCookie(
    user.id, user.email, user.name, isSecure
  )

  const firstName = user.name?.split(' ')[0] || 'there'
  const response  = NextResponse.redirect(new URL('/search', req.url))

  // Session cookie — logs the user in automatically
  response.cookies.set(cookieName, cookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    secure:   isSecure,
    path:     '/',
    maxAge:   30 * 24 * 60 * 60,
  })

  // Welcome banner cookie — readable by JS, expires in 60s
  response.cookies.set('pgc_welcome', JSON.stringify({ firstName, planTier: 'BASIC' }), {
    httpOnly: false,
    sameSite: 'lax',
    secure:   isSecure,
    path:     '/',
    maxAge:   60,
  })

  console.log(`✅ Email verified + auto-login: ${user.email} → /search`)
  return response
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()
    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    const result = await verifyAndActivate(token)
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Email verified! Your 7-day trial is now active.',
      user:    result.user,
    })
  } catch (err: any) {
    console.error('❌ verify-email POST error:', err)
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 })
  }
}

// ─── non-blocking welcome email ────────────────────────────────────────────────

function sendWelcomeEmailSilent(email: string, name: string) {
  import('@/lib/email/send').then(({ sendEmail }) => {
    import('@/lib/email/brand').then(({ getBrand }) => {
      const brand = getBrand()
      sendEmail({
        to:      email,
        subject: `Welcome to ${brand.name} — Your Trial Is Active! 🎉`,
        html: buildWelcomeEmail(name, brand.appUrl, brand.name),
        text: `Welcome to ${brand.name}, ${name}!\n\nYour 7-day free trial is now active. Explore thousands of live government contract opportunities at ${brand.appUrl}/search\n\nGood luck!`,
      }).catch((e: any) => console.error('Welcome email failed (non-blocking):', e.message))
    })
  })
}

function buildWelcomeEmail(name: string, appUrl: string, brandName: string): string {
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
            <p style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:900;">
              Welcome, ${name}! 🎉
            </p>
            <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
              Your <strong>7-day free trial</strong> is now active. You have full access to:
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              ${['900+ live government contract opportunities', 'Real-time alerts for new opportunities', 'Advanced search &amp; filtering tools', 'Export results to CSV/Excel'].map(f => `
              <tr>
                <td style="padding:6px 0;">
                  <span style="color:#059669;font-weight:700;margin-right:8px;">✓</span>
                  <span style="color:#334155;font-size:14px;">${f}</span>
                </td>
              </tr>`).join('')}
            </table>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:8px 0 32px;">
                <a href="${appUrl}/search"
                   style="display:inline-block;padding:16px 48px;background:linear-gradient(135deg,#f97316,#f59e0b);
                          color:#ffffff;text-decoration:none;font-weight:900;font-size:16px;
                          border-radius:12px;">
                  Start Searching Now →
                </a>
              </td></tr>
            </table>
            <p style="margin:0;color:#94a3b8;font-size:13px;text-align:center;">
              Questions? Reply to this email or visit our support page.
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