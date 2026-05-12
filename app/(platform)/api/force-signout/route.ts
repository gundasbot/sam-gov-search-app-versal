import { NextRequest, NextResponse } from 'next/server'

function clearCookieHeader(name: string, domain?: string): string {
  const parts = [
    `${name}=`,
    'Path=/',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'SameSite=Lax',
  ]
  if (domain) parts.push(`Domain=${domain}`)
  if (process.env.NODE_ENV === 'production') parts.push('Secure')
  return parts.join('; ')
}

export async function GET(request: NextRequest) {
  const isProd = process.env.NODE_ENV === 'production'
  const cookieName = isProd
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'

  const loginUrl = new URL('/login', request.url)
  const response = NextResponse.redirect(loginUrl)

  // response.cookies.set() deduplicates by name — use headers.append() to send
  // two independent Set-Cookie headers: one with the shared domain, one without.
  if (isProd) {
    response.headers.append('Set-Cookie', clearCookieHeader(cookieName, '.precisegovcon.com'))
  }
  response.headers.append('Set-Cookie', clearCookieHeader(cookieName))

  return response
}
