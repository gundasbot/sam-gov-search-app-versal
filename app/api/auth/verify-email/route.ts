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
import { getBrand } from '@/lib/email/brand'
import { sendSignupWelcomeEmailOnce } from '@/lib/email/signup-welcome'

export const dynamic = 'force-dynamic'

const DEFAULT_TRIAL_DAYS = 7

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function normalizeTrialDays(value: number | null | undefined, fallback = DEFAULT_TRIAL_DAYS): number {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback
  return Math.min(365, Math.max(1, Math.round(value)))
}

function extractTrialDaysFromText(value: string | null | undefined, fallback = DEFAULT_TRIAL_DAYS): number {
  if (!value) return fallback
  const match = String(value).match(/(\d{1,3})/)
  if (!match) return fallback
  return normalizeTrialDays(parseInt(match[1], 10), fallback)
}

async function resolveTrialDaysForUserOfferCode(offerCode: string | null | undefined): Promise<number> {
  const code = String(offerCode || '').toUpperCase().trim()
  if (!code) return DEFAULT_TRIAL_DAYS

  const offer = await prisma.offer_codes.findFirst({
    where: { code, active: true },
    select: {
      type: true,
      trial_days: true,
      discount: true,
      description: true,
      expires_at: true,
      max_usage: true,
      usage_count: true,
    },
  })

  if (!offer) return DEFAULT_TRIAL_DAYS
  if (offer.expires_at && new Date(offer.expires_at) < new Date()) return DEFAULT_TRIAL_DAYS
  if (offer.max_usage && offer.usage_count >= offer.max_usage) return DEFAULT_TRIAL_DAYS
  if (String(offer.type || '').toLowerCase() !== 'trial') return DEFAULT_TRIAL_DAYS

  // Use the explicit trial_days field first; fall back to parsing the discount/description text
  if (offer.trial_days != null) return normalizeTrialDays(offer.trial_days)
  return extractTrialDaysFromText(offer.discount || offer.description || '', DEFAULT_TRIAL_DAYS)
}

// ─── core verification logic ──────────────────────────────────────────────────

async function verifyAndActivate(rawToken: string): Promise<
  | { ok: true;  user: { id: string; email: string; name: string | null }; planTier: string; trialDays: number }
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
      email_verified: true, plan_tier: true, offer_code: true,
    },
  })

  if (!user) {
    return { ok: false, error: 'Account not found.' }
  }

  if (user.email_verified) {
    // Already verified — still log them in
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: now, updated_at: now },
    }).catch(() => {})
    await prisma.email_verification_tokens.delete({ where: { token_hash: tokenHash } }).catch(() => {})
    return {
      ok: true,
      user: { id: user.id, email: user.email, name: user.name },
      planTier: user.plan_tier || 'BASIC',
      trialDays: DEFAULT_TRIAL_DAYS,
    }
  }

  // ── Activate the account ──────────────────────────────────────────────────
  const trialDays = await resolveTrialDaysForUserOfferCode(user.offer_code)
  const trialEndsAt = endOfDay(new Date(now.getTime() + trialDays * 86400000))

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
      last_login_at:    now,
      updated_at:       now,
    },
  })

  // Delete used token (non-critical)
  await prisma.email_verification_tokens.delete({ where: { token_hash: tokenHash } }).catch(() => {})

  // Send welcome email non-blocking (deduped to one per user)
  sendWelcomeEmailSilent(
    user.id,
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
    planTier: user.plan_tier || 'BASIC',
    trialDays,
  }
}

// ─── mint session cookie ──────────────────────────────────────────────────────

async function mintSessionCookie(
  userId: string,
  email: string,
  name: string | null,
  planTier: string,
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
      tier:            planTier,
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

  const { user, planTier, trialDays } = result
  const isSecure = req.url.startsWith('https')
  const { cookieName, cookieValue } = await mintSessionCookie(
    user.id, user.email, user.name, planTier, isSecure
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
  response.cookies.set('pgc_welcome', JSON.stringify({ firstName, planTier: 'BASIC', trialDays }), {
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
      message: `Email verified! Your ${result.trialDays}-day trial is now active.`,
      user:    result.user,
    })
  } catch (err: any) {
    console.error('❌ verify-email POST error:', err)
    return NextResponse.json({ error: 'Verification failed.' }, { status: 500 })
  }
}

// ─── non-blocking welcome email ────────────────────────────────────────────────

function sendWelcomeEmailSilent(userId: string, email: string, name: string) {
  void sendSignupWelcomeEmailOnce({
    userId,
    email,
    name,
    source: 'email_verification',
  }).catch((e: any) => {
    console.error('Welcome email failed (non-blocking):', e?.message || e)
  })
}

function buildWelcomeEmail(name: string, appUrl: string, brandName: string, trialDays = DEFAULT_TRIAL_DAYS): string {
  const brand = getBrand()
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr>
          <td style="padding:40px 40px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);
                     border-radius:16px 16px 0 0;text-align:center;">
            <img src="${brand.logoUrl}" alt="${brand.name}"
                 style="max-width:200px;height:auto;display:block;margin:0 auto 12px;border:0;" />
            <p style="margin:0;color:#cbd5e1;font-size:11px;font-weight:600;letter-spacing:0.05em;">
              ${brand.tagline}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#1e293b;font-size:20px;font-weight:900;">
              Welcome, ${name}! 🎉
            </p>
            <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
              Your <strong>${trialDays}-day free trial</strong> is now active. You have full access to:
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
