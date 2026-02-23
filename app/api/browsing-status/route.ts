// app/api/browsing-status/route.ts
import { NextRequest, NextResponse } from 'next/server'

/**
 * Browsing gate — cookie names MUST match middleware (proxy.ts):
 *   browsing_start_time  (unix ms)
 *   delay_count          (integer)
 */

const BROWSING_TIME_LIMIT_MS = 15 * 60 * 1000   // 15 min in ms  (matches middleware)
const MAX_DELAYS = 2

const COOKIE_START    = 'browsing_start_time'    // ← synced with proxy.ts
const COOKIE_DELAYS   = 'delay_count'

function parseIntSafe(v: string | undefined | null, fallback = 0) {
  const n = parseInt(v || '', 10)
  return Number.isFinite(n) ? n : fallback
}

function cookieOptions(maxAgeSec = 60 * 60 * 24) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSec,
  }
}

/**
 * GET — returns current browsing status
 */
export async function GET(request: NextRequest) {
  const startCookie   = request.cookies.get(COOKIE_START)?.value
  const delayCookie   = request.cookies.get(COOKIE_DELAYS)?.value

  const now           = Date.now()
  const startMs       = parseIntSafe(startCookie) || now
  const delayCount    = parseIntSafe(delayCookie, 0)

  const elapsedMs         = Math.max(0, now - startMs)
  const elapsedSeconds    = Math.floor(elapsedMs / 1000)
  const remainingMs       = Math.max(0, BROWSING_TIME_LIMIT_MS - elapsedMs)
  const remainingSeconds  = Math.floor(remainingMs / 1000)

  const timeExpired         = elapsedMs >= BROWSING_TIME_LIMIT_MS
  const outOfDelays         = delayCount >= MAX_DELAYS
  const shouldPromptSignIn  = timeExpired || outOfDelays
  const canBrowse           = !shouldPromptSignIn

  const res = NextResponse.json({
    elapsedSeconds,
    remainingSeconds,        // ← what BrowsingTimerBanner reads
    delayCount,
    maxDelays: MAX_DELAYS,
    canBrowse,
    shouldPromptSignIn,      // ← what BrowsingTimerBanner reads
  })

  // Set cookies if missing (mirrors middleware behaviour)
  if (!startCookie) {
    res.cookies.set(COOKIE_START, String(now), cookieOptions())
  }
  if (!delayCookie) {
    res.cookies.set(COOKIE_DELAYS, '0', cookieOptions())
  }

  return res
}

/**
 * POST — user clicks "Browse X More Minutes"
 * Increments delay_count (capped at MAX_DELAYS).
 * Does NOT reset the start time — elapsed time keeps accumulating.
 */
export async function POST(request: NextRequest) {
  const startCookie    = request.cookies.get(COOKIE_START)?.value
  const delayCookie    = request.cookies.get(COOKIE_DELAYS)?.value

  const now            = Date.now()
  const startMs        = parseIntSafe(startCookie) || now
  const currentDelays  = parseIntSafe(delayCookie, 0)

  const elapsedMs         = Math.max(0, now - startMs)
  const remainingMs       = Math.max(0, BROWSING_TIME_LIMIT_MS - elapsedMs)
  const remainingSeconds  = Math.floor(remainingMs / 1000)

  // Already maxed out
  if (currentDelays >= MAX_DELAYS) {
    return NextResponse.json({
      ok: false,
      message: 'Maximum browsing extensions used.',
      delayCount: currentDelays,
      maxDelays: MAX_DELAYS,
      remainingSeconds,
      canBrowse: false,
      shouldPromptSignIn: true,
    })
  }

  const nextDelayCount = currentDelays + 1
  const canBrowse      = nextDelayCount < MAX_DELAYS || remainingMs > 0

  const res = NextResponse.json({
    ok: true,
    delayCount: nextDelayCount,
    maxDelays: MAX_DELAYS,
    remainingSeconds,
    canBrowse,
    shouldPromptSignIn: !canBrowse,
  })

  res.cookies.set(COOKIE_START,  String(startMs),          cookieOptions())
  res.cookies.set(COOKIE_DELAYS, String(nextDelayCount),   cookieOptions())

  return res
}