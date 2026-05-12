import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production'
  const cookieName = isProd
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'

  const loginUrl = new URL('/login', request.url)
  const response = NextResponse.redirect(loginUrl)

  const baseOpts = {
    expires: new Date(0),
    path: '/',
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
  }

  // Clear cookie with domain (matches how it was set in production)
  if (isProd) {
    response.cookies.set({ name: cookieName, value: '', ...baseOpts, domain: '.precisegovcon.com' })
  }
  // Also clear without domain (covers legacy cookies or dev environment)
  response.cookies.set({ name: cookieName, value: '', ...baseOpts })

  return response
}
