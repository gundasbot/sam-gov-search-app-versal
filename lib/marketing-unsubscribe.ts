import crypto from 'crypto'

const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

function getSecret(): string {
  const secret = process.env.MARKETING_UNSUBSCRIBE_SECRET || process.env.NEXTAUTH_SECRET || ''
  if (!secret) {
    throw new Error('Missing MARKETING_UNSUBSCRIBE_SECRET (or NEXTAUTH_SECRET fallback)')
  }
  return secret
}

function base64UrlEncode(input: string): string {
  return Buffer.from(input, 'utf8').toString('base64url')
}

function base64UrlDecode(input: string): string {
  return Buffer.from(input, 'base64url').toString('utf8')
}

export function createUnsubscribeToken(email: string, ttlSeconds = DEFAULT_TTL_SECONDS): string {
  const normalizedEmail = String(email || '').trim().toLowerCase()
  if (!normalizedEmail) throw new Error('Email is required')

  const exp = Math.floor(Date.now() / 1000) + ttlSeconds
  const payloadObj = { e: normalizedEmail, x: exp }
  const payload = base64UrlEncode(JSON.stringify(payloadObj))

  const sig = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url')

  return `${payload}.${sig}`
}

export function verifyUnsubscribeToken(token: string): { email: string; exp: number } {
  const [payload, providedSig] = String(token || '').split('.')
  if (!payload || !providedSig) throw new Error('Invalid token format')

  const expectedSig = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url')

  const safeProvided = Buffer.from(providedSig)
  const safeExpected = Buffer.from(expectedSig)
  if (safeProvided.length !== safeExpected.length || !crypto.timingSafeEqual(safeProvided, safeExpected)) {
    throw new Error('Invalid token signature')
  }

  const decoded = JSON.parse(base64UrlDecode(payload)) as { e?: string; x?: number }
  const email = String(decoded?.e || '').trim().toLowerCase()
  const exp = Number(decoded?.x || 0)

  if (!email || !exp) throw new Error('Invalid token payload')
  if (Math.floor(Date.now() / 1000) > exp) throw new Error('Token expired')

  return { email, exp }
}
