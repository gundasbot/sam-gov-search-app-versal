const LIVE_SITE_URL = 'https://www.precisegovcon.com'
const DEV_FALLBACK_URL = 'http://localhost:3000'
const PROD_ALLOWED_HOSTS = new Set(['www.precisegovcon.com', 'precisegovcon.com'])

function trimTrailingSlash(value: string): string {
  return value.replace(/\/+$/, '')
}

function parseUrl(raw?: string | null): URL | null {
  const value = String(raw ?? '').trim()
  if (!value) return null
  try {
    return new URL(value)
  } catch {
    return null
  }
}

function isPrivateIpv4Host(hostname: string): boolean {
  if (!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname)) return false
  const [a, b] = hostname.split('.').map(Number)
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  )
}

export function isLocalOrPrivateHost(hostname: string): boolean {
  const host = String(hostname || '').toLowerCase().trim()
  if (!host) return false
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '0.0.0.0' ||
    host === '::1' ||
    host.endsWith('.local') ||
    isPrivateIpv4Host(host)
  )
}

function pickUrl(
  candidates: Array<string | undefined | null>,
  opts?: { allowLocal?: boolean }
): string | null {
  for (const candidate of candidates) {
    const parsed = parseUrl(candidate)
    if (!parsed) continue
    if (!opts?.allowLocal && isLocalOrPrivateHost(parsed.hostname)) continue
    return trimTrailingSlash(parsed.origin)
  }
  return null
}

export function resolvePublicAppUrl(...candidates: Array<string | undefined | null>): string {
  return (
    pickUrl(candidates, { allowLocal: false }) ||
    LIVE_SITE_URL
  )
}

export function resolveRequestOrigin(
  input?: Request | { url?: string; nextUrl?: URL } | URL | string | null
): string | null {
  if (!input) return null
  if (typeof input === 'string') {
    const parsed = parseUrl(input)
    return parsed ? trimTrailingSlash(parsed.origin) : null
  }
  if (input instanceof URL) return trimTrailingSlash(input.origin)

  const withNextUrl = input as { nextUrl?: URL; url?: string }
  if (withNextUrl.nextUrl) return trimTrailingSlash(withNextUrl.nextUrl.origin)

  const parsed = parseUrl(withNextUrl.url)
  return parsed ? trimTrailingSlash(parsed.origin) : null
}

export function resolveAuthBaseUrl(
  requestLike?: Request | { url?: string; nextUrl?: URL } | URL | string | null
): string {
  const requestOrigin = resolveRequestOrigin(requestLike)
  const envUrl = pickUrl(
    [process.env.NEXTAUTH_URL, process.env.APP_URL, process.env.NEXT_PUBLIC_APP_URL],
    { allowLocal: true }
  )

  if (process.env.NODE_ENV !== 'production') {
    return requestOrigin || envUrl || DEV_FALLBACK_URL
  }

  const safePublic = resolvePublicAppUrl(
    process.env.NEXTAUTH_URL,
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    LIVE_SITE_URL
  )

  if (!requestOrigin) return safePublic

  const requestHost = parseUrl(requestOrigin)?.hostname.toLowerCase() || ''
  const safeHost = parseUrl(safePublic)?.hostname.toLowerCase() || ''

  if (!requestHost) return safePublic
  if (requestHost === safeHost || PROD_ALLOWED_HOSTS.has(requestHost)) return requestOrigin

  return safePublic
}

