import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Routes that live on platform.precisegovcon.com
const PLATFORM_PATHS = [
  '/search',
  '/alerts',
  '/alerts-searches',
  '/dashboard',
  '/insights',
  '/account',
  '/admin',
  '/checkout',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/reset-request',
  '/verify-email',
  '/verify-success',
  '/activate',
  '/contacts',
  '/auth',
]

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const { pathname } = request.nextUrl

  // Pass through in local development
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    return NextResponse.next()
  }

  const isPlatformHost = hostname.startsWith('platform.')
  const isPlatformPath = PLATFORM_PATHS.some(
    p => pathname === p || pathname.startsWith(p + '/')
  )

  if (isPlatformHost && !isPlatformPath) {
    // Marketing route on platform subdomain → redirect to www
    const url = request.nextUrl.clone()
    url.hostname = hostname.replace(/^platform\./, 'www.')
    return NextResponse.redirect(url, { status: 301 })
  }

  if (!isPlatformHost && isPlatformPath) {
    // Platform route on www → redirect to platform subdomain
    const url = request.nextUrl.clone()
    const base = hostname.replace(/^www\./, '')
    url.hostname = `platform.${base}`
    return NextResponse.redirect(url, { status: 302 })
  }

  return NextResponse.next()
}

export const config = {
  // Skip _next internals, static files, and API routes
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\..*|api/).*)'],
}
