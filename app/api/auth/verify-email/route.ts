// app/api/auth/verify-email/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// WHAT THIS FILE DOES:
//   GET  /api/auth/verify-email?token=<raw>
//     1. Verifies the token
//     2. Sends welcome email (non-blocking)
//     3. Mints a NextAuth session cookie → user is LOGGED IN
//     4. Sets a short-lived pgc_welcome cookie for the banner
//     5. Redirects to /search
//
//   POST /api/auth/verify-email
//     Programmatic verification (returns JSON)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/email/verification'
import { sendWelcomeEmail } from '@/lib/email/welcome'
import { encode } from 'next-auth/jwt'

export const dynamic = 'force-dynamic'

async function mintSessionToken(userId: string, email: string, name: string | null): Promise<string> {
  const secret = process.env.NEXTAUTH_SECRET!
  const maxAge = 30 * 24 * 60 * 60

  return encode({
    secret,
    token: {
      sub: userId,
      id: userId,
      email,
      name: name ?? undefined,
      role: 'user',
      tier: 'BASIC',
      interval: null,
      status: 'trialing',
      hasSubscription: false,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + maxAge,
      jti: crypto.randomUUID(),
    } as any,
    maxAge,
  })
}

// ─── GET ─────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const rawToken = req.nextUrl.searchParams.get('token')

  if (!rawToken) {
    return NextResponse.redirect(new URL('/?error=invalid-token', req.url))
  }

  try {
    const result = await verifyEmailToken(rawToken)

    if (!result.success) {
      const msg = encodeURIComponent(result.error || 'verification-failed')
      return NextResponse.redirect(new URL(`/?error=${msg}`, req.url))
    }

    if (result.alreadyVerified) {
      return NextResponse.redirect(new URL('/?mode=login&message=already-verified', req.url))
    }

    const user = result.user!

    // 1. Send welcome email — non-blocking, never fails the flow
    sendWelcomeEmail(
      user.email,
      user.name || 'there'
    ).catch((e) => console.error('Welcome email failed (non-blocking):', e))

    // 2. Mint session JWT
    const sessionToken = await mintSessionToken(
      user.id,
      user.email,
      user.name ?? null
    )

    // 3. Build redirect to /search
    const isSecure = req.url.startsWith('https')
    const cookieName = isSecure
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'

    const firstName = user.name?.split(' ')[0] || 'there'
    const planTier  = 'PROFESSIONAL'

    const response = NextResponse.redirect(new URL('/search', req.url))

    // Session cookie — logs the user in
    response.cookies.set(cookieName, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: 30 * 24 * 60 * 60,
    })

    // Welcome banner cookie — JS-readable, cleared by WelcomeBanner component
    response.cookies.set('pgc_welcome', JSON.stringify({ firstName, planTier }), {
      httpOnly: false,
      sameSite: 'lax',
      secure: isSecure,
      path: '/',
      maxAge: 60,
    })

    console.log('Auto-login set for:', user.email, '→ redirecting to /search')
    return response

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.redirect(new URL('/?error=verification-failed', req.url))
  }
}

// ─── POST ────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    const result = await verifyEmailToken(token)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Verification failed' }, { status: 400 })
    }

    if (!result.alreadyVerified && result.user) {
      sendWelcomeEmail(
        result.user.email,
        result.user.name || 'there'
      ).catch((e) => console.error('Welcome email failed:', e))
    }

    return NextResponse.json({
      success: true,
      message: result.alreadyVerified
        ? 'Email already verified'
        : 'Email verified! Your trial is now active.',
      alreadyVerified: result.alreadyVerified,
      trialActivated: result.trialActivated,
      trial: result.trial,
      user: result.user,
    })

  } catch (error: any) {
    console.error('Email verification error:', error)
    return NextResponse.json({ error: 'Failed to verify email.' }, { status: 500 })
  }
}