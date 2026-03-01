// app/api/browsing-status/route.ts
import { NextRequest, NextResponse } from 'next/server'

/**
 * Browsing gate — cookie names MUST match middleware (proxy.ts):
 *   browsing_start_time  (unix ms)
 *   delay_count          (integer)
 */

const BROWSING_TIME_LIMIT_MS = 20 * 60 * 1000   // 20 min  ← updated from 15
const MAX_DELAYS = 2

const COOKIE_START  = 'browsing_start_time'
const COOKIE_DELAYS = 'delay_count'

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
 * GET — returns current browsing status.
 *
 * Field names returned match what BrowsingTimerBanner.tsx reads:
 *   timeRemaining  (seconds)   ← banner countdown
 *   isExpired      (boolean)   ← triggers modal
 *   delayCount     (integer)
 *   maxDelays      (integer)
 */
export async function GET(request: NextRequest) {
  const startCookie = request.cookies.get(COOKIE_START)?.value
  const delayCookie = request.cookies.get(COOKIE_DELAYS)?.value

  const now        = Date.now()
  const startMs    = parseIntSafe(startCookie) || now
  const delayCount = parseIntSafe(delayCookie, 0)

  const elapsedMs       = Math.max(0, now - startMs)
  const remainingMs     = Math.max(0, BROWSING_TIME_LIMIT_MS - elapsedMs)
  const timeRemaining   = Math.floor(remainingMs / 1000)   // ← banner reads this
  const isExpired       = elapsedMs >= BROWSING_TIME_LIMIT_MS || delayCount >= MAX_DELAYS

  const res = NextResponse.json({
    timeRemaining,           // ← BrowsingTimerBanner
    isExpired,               // ← BrowsingTimerBanner
    delayCount,
    maxDelays: MAX_DELAYS,
    canBrowse: !isExpired,
    // legacy aliases so nothing else breaks
    remainingSeconds: timeRemaining,
    shouldPromptSignIn: isExpired,
  })

  // Stamp cookies on first visit (mirrors middleware)
  if (!startCookie) res.cookies.set(COOKIE_START,  String(now), cookieOptions())
  if (!delayCookie) res.cookies.set(COOKIE_DELAYS, '0',         cookieOptions())

  return res
}

/**
 * POST — user clicks "Give me a little more time".
 * Increments delay_count (capped at MAX_DELAYS).
 * Does NOT reset start time — elapsed keeps accumulating.
 */
export async function POST(request: NextRequest) {
  const startCookie   = request.cookies.get(COOKIE_START)?.value
  const delayCookie   = request.cookies.get(COOKIE_DELAYS)?.value

  const now           = Date.now()
  const startMs       = parseIntSafe(startCookie) || now
  const currentDelays = parseIntSafe(delayCookie, 0)

  const elapsedMs     = Math.max(0, now - startMs)
  const remainingMs   = Math.max(0, BROWSING_TIME_LIMIT_MS - elapsedMs)
  const timeRemaining = Math.floor(remainingMs / 1000)

  // Already maxed out
  if (currentDelays >= MAX_DELAYS) {
    return NextResponse.json({
      ok: false,
      message: 'Maximum browsing extensions used.',
      delayCount:    currentDelays,
      maxDelays:     MAX_DELAYS,
      timeRemaining,
      newTimeLimit:  timeRemaining,  // ← banner reads this after delay
      canBrowse:     false,
      isExpired:     true,
    })
  }

  const nextDelayCount = currentDelays + 1
  const isExpired      = nextDelayCount >= MAX_DELAYS && remainingMs <= 0

  const res = NextResponse.json({
    ok:           true,
    delayCount:   nextDelayCount,
    maxDelays:    MAX_DELAYS,
    timeRemaining,
    newTimeLimit: timeRemaining,     // ← banner sets timeRemaining from this
    canBrowse:    !isExpired,
    isExpired,
  })

  res.cookies.set(COOKIE_START,  String(startMs),        cookieOptions())
  res.cookies.set(COOKIE_DELAYS, String(nextDelayCount), cookieOptions())

  return res
}