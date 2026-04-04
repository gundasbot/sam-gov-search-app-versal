// middleware/proxy.ts - JWT-only auth check (no Prisma — Edge Runtime compatible)
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

const PUBLIC_PATHS = [
  '/', '/pricing', '/about', '/contact', '/services',
  '/login', '/signup', '/api', '/verify-email', '/auto-login',
  '/features', '/support', '/privacy', '/terms', '/security', '/accessibility'
]

const BROWSING_TIME_LIMIT_MS = 20 * 60 * 1000 // 20 minutes (consistent with browsing-status.ts)
const MAX_DELAYS = 2

const COOKIE_START  = 'browsing_start_time'
const COOKIE_DELAYS = 'delay_count'

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static files and public paths
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

    // Authenticated users should be able to navigate protected app pages.
    // Subscription/upgrade UX is handled in-page to avoid forced route jumps.
    return NextResponse.next()
  }

  // ── NOT AUTHENTICATED ────────────────────────────────────────────
  const isProtectedPath = PROTECTED_PATHS.some(path =>
    pathname === path || pathname.startsWith(`${path}/`)
  )

  if (!isProtectedPath) return NextResponse.next()

  if (pathname === '/account' || pathname.startsWith('/account/')) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', '/account')
    return NextResponse.redirect(loginUrl)
  }

  // ── Browsing gate for anonymous users on /search etc ──────────────
  const startCookie  = request.cookies.get(COOKIE_START)?.value
  const delayCookie  = request.cookies.get(COOKIE_DELAYS)?.value
  const delayCount   = parseInt(delayCookie || '0', 10)

  const now       = Date.now()
  const startMs   = startCookie ? parseInt(startCookie, 10) : now
  const elapsedMs = now - startMs

  const response = NextResponse.next()

  // Stamp cookies on first visit
  if (!startCookie) {
    response.cookies.set(COOKIE_START, String(now), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
    })
  }

  if (elapsedMs > BROWSING_TIME_LIMIT_MS && delayCount >= MAX_DELAYS) {
    // Completely out of time AND delays — redirect to login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    loginUrl.searchParams.set('reason', 'time_expired')
    return NextResponse.redirect(loginUrl)
  }

  // Still has time OR has delays left — allow through.
  // The BrowsingTimerBanner component handles showing the modal UI.
  const remainingSec = Math.max(0, Math.floor((BROWSING_TIME_LIMIT_MS - elapsedMs) / 1000))
  response.headers.set('X-Time-Remaining',  String(remainingSec))
  response.headers.set('X-Delay-Count',     String(delayCount))
  response.headers.set('X-Max-Delays',      String(MAX_DELAYS))
  if (elapsedMs > BROWSING_TIME_LIMIT_MS) {
    response.headers.set('X-Browsing-Expired', 'true')
  }

  return response
}

function generateFingerprint(request: NextRequest): string {
  const ip            = (request as any).ip || request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent     = request.headers.get('user-agent') || 'unknown'
  const acceptLang    = request.headers.get('accept-language') || 'unknown'
  const str           = `${ip}-${userAgent}-${acceptLang}`
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
