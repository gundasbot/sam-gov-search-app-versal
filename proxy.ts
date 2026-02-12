// proxy.ts - JWT-only auth check (no Prisma — Edge Runtime compatible)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PROTECTED_PATHS = [
  '/account',
  '/dashboard',
  '/search',
  '/opportunities',
  '/insights'
]

const PUBLIC_PATHS = ['/', '/pricing', '/about', '/contact', '/services', '/login', '/signup', '/api', '/verify-email', '/auto-login']

const BROWSING_TIME_LIMIT = 15 * 60 * 1000 // 15 minutes
const MAX_DELAYS = 2

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files, API routes, and public paths
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/api/auth') ||
    PUBLIC_PATHS.some(path => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  })

  // ── AUTHENTICATED USERS ──────────────────────────────────────────
  if (token) {
    const isProtectedPath = PROTECTED_PATHS.some(path =>
      pathname === path || pathname.startsWith(`${path}/`)
    )

    if (!isProtectedPath) return NextResponse.next()

    // /account always allowed for authenticated users
    if (pathname === '/account' || pathname.startsWith('/account/')) {
      return NextResponse.next()
    }

    // Check JWT for active subscription or trial
    const hasSubscription = token.hasSubscription as boolean
    const status = token.status as string
    const trialActive = token.trial_active as boolean
    const trialExpiresAt = token.trial_expires_at as string | null
    const trialEndsAt = token.trial_ends_at as string | null

    if (hasSubscription && (status === 'active' || status === 'trialing')) {
      console.log('✅ User has active subscription - full access granted')
      return NextResponse.next()
    }

    const trialEnd = trialExpiresAt || trialEndsAt
    if (trialActive && trialEnd && new Date(trialEnd) > new Date()) {
      console.log('✅ User has active trial - access granted')
      return NextResponse.next()
    }

    if (status === 'trialing') {
      console.log('✅ User status is trialing - access granted')
      return NextResponse.next()
    }

    // No active subscription or trial — redirect to pricing
    console.log('⚠️ No active subscription/trial - redirecting to pricing')
    const url = request.nextUrl.clone()
    url.pathname = '/pricing'
    url.searchParams.set('reason', 'trial_expired')
    return NextResponse.redirect(url)
  }

  // ── NOT AUTHENTICATED ────────────────────────────────────────────
  const isProtectedPath = PROTECTED_PATHS.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!isProtectedPath) return NextResponse.next()

  if (pathname === '/account' || pathname.startsWith('/account/')) {
    const loginUrl = new URL('/', request.url)
    loginUrl.searchParams.set('mode', 'login')
    loginUrl.searchParams.set('callbackUrl', '/account')
    return NextResponse.redirect(loginUrl)
  }

  // Browsing time limits for anonymous users
  const browsingStartTime = request.cookies.get('browsing_start_time')?.value
  const delayCount = parseInt(request.cookies.get('delay_count')?.value || '0')
  const userFingerprint = request.cookies.get('user_fingerprint')?.value

  const fingerprint = userFingerprint || generateFingerprint(request)
  const now = Date.now()
  const startTime = browsingStartTime ? parseInt(browsingStartTime) : now
  const elapsedTime = now - startTime
  const timeRemaining = BROWSING_TIME_LIMIT - elapsedTime

  const response = NextResponse.next()

  if (!browsingStartTime) {
    response.cookies.set('browsing_start_time', now.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    })
  }

  if (!userFingerprint) {
    response.cookies.set('user_fingerprint', fingerprint, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365
    })
  }

  if (elapsedTime > BROWSING_TIME_LIMIT) {
    if (delayCount >= MAX_DELAYS) {
      const loginUrl = new URL('/', request.url)
      loginUrl.searchParams.set('mode', 'login')
      loginUrl.searchParams.set('callbackUrl', pathname)
      loginUrl.searchParams.set('reason', 'time_expired')
      return NextResponse.redirect(loginUrl)
    }
    response.headers.set('X-Browsing-Expired', 'true')
    response.headers.set('X-Delay-Count', delayCount.toString())
    response.headers.set('X-Max-Delays', MAX_DELAYS.toString())
  } else {
    response.headers.set('X-Time-Remaining', Math.floor(timeRemaining / 1000).toString())
  }

  return response
}

function generateFingerprint(request: NextRequest): string {
  const ip = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'
  const acceptLanguage = request.headers.get('accept-language') || 'unknown'
  const str = `${ip}-${userAgent}-${acceptLanguage}`
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(36)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}