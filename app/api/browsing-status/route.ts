// app/api/browsing-status/route.ts
import { NextRequest, NextResponse } from 'next/server'

/**
 * Browsing gate
 * - Tracks how long the visitor has been browsing before showing/sign-in forcing actions
 * - Allows up to MAX_DELAYS "delay" clicks (stored in cookies)
 *
 * Cookies:
 * - browsing_start: unix ms timestamp when we started counting
 * - delay_count: number of delays used
 */

const BROWSING_TIME_LIMIT_SECONDS = 15 * 60 // 15 minutes
const MAX_DELAYS = 2

const COOKIE_BROWSING_START = 'browsing_start'
const COOKIE_DELAY_COUNT = 'delay_count'

function parseIntSafe(v: string | undefined | null, fallback = 0) {
  const n = parseInt(v || '', 10)
  return Number.isFinite(n) ? n : fallback
}

function parseMsSafe(v: string | undefined | null) {
  const n = parseInt(v || '', 10)
  return Number.isFinite(n) ? n : 0
}

function nowMs() {
  return Date.now()
}

function getElapsedSeconds(startMs: number) {
  if (!startMs) return 0
  return Math.max(0, Math.floor((nowMs() - startMs) / 1000))
}

function canContinueBrowsing(elapsedSeconds: number, delayCount: number) {
  // If they already delayed the max number of times, stop delaying.
  if (delayCount >= MAX_DELAYS) return false
  // If time limit exceeded, stop delaying.
  if (elapsedSeconds >= BROWSING_TIME_LIMIT_SECONDS) return false
  // Otherwise, they can still browse/delay sign-in.
  return true
}

function cookieOptions() {
  return {
    httpOnly: false, // client may read if you want UI behavior (safe since no secrets)
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  }
}

/**
 * GET: returns current browsing status
 * Response:
 * {
 *   elapsedSeconds,
 *   remainingSeconds,
 *   delayCount,
 *   maxDelays,
 *   canBrowse,        // true if still within time and delays available
 *   shouldPromptSignIn // true if browsing time exceeded OR delays maxed out
 * }
 */
export async function GET(request: NextRequest) {
  const browsingStartCookie = request.cookies.get(COOKIE_BROWSING_START)?.value
  const delayCountCookie = request.cookies.get(COOKIE_DELAY_COUNT)?.value

  const browsingStartMs = parseMsSafe(browsingStartCookie) || nowMs()
  const delayCount = parseIntSafe(delayCountCookie, 0)

  const elapsedSeconds = getElapsedSeconds(browsingStartMs)
  const remainingSeconds = Math.max(0, BROWSING_TIME_LIMIT_SECONDS - elapsedSeconds)

  const canBrowse = canContinueBrowsing(elapsedSeconds, delayCount)
  const shouldPromptSignIn = !canBrowse

  const res = NextResponse.json({
    elapsedSeconds,
    remainingSeconds,
    delayCount,
    maxDelays: MAX_DELAYS,
    canBrowse,
    shouldPromptSignIn,
  })

  // Ensure browsing_start cookie is set once
  if (!browsingStartCookie) {
    res.cookies.set(COOKIE_BROWSING_START, String(browsingStartMs), cookieOptions())
  }
  // Ensure delay_count exists
  if (!delayCountCookie) {
    res.cookies.set(COOKIE_DELAY_COUNT, '0', cookieOptions())
  }

  return res
}

/**
 * POST: user chose to "delay" sign-in / continue browsing.
 * Increments delay_count (up to MAX_DELAYS).
 */
export async function POST(request: NextRequest) {
  const browsingStartCookie = request.cookies.get(COOKIE_BROWSING_START)?.value
  const delayCountCookie = request.cookies.get(COOKIE_DELAY_COUNT)?.value

  const browsingStartMs = parseMsSafe(browsingStartCookie) || nowMs()
  const currentDelayCount = parseIntSafe(delayCountCookie, 0)

  const elapsedSeconds = getElapsedSeconds(browsingStartMs)

  // If already time exceeded or max delays hit, do not increment further.
  if (!canContinueBrowsing(elapsedSeconds, currentDelayCount)) {
    const res = NextResponse.json(
      {
        ok: false,
        message: 'Browsing time limit reached or maximum delays used.',
        delayCount: currentDelayCount,
        maxDelays: MAX_DELAYS,
        elapsedSeconds,
        remainingSeconds: Math.max(0, BROWSING_TIME_LIMIT_SECONDS - elapsedSeconds),
        canBrowse: false,
        shouldPromptSignIn: true,
      },
      { status: 200 }
    )

    // Keep cookies consistent
    if (!browsingStartCookie) res.cookies.set(COOKIE_BROWSING_START, String(browsingStartMs), cookieOptions())
    if (!delayCountCookie) res.cookies.set(COOKIE_DELAY_COUNT, String(currentDelayCount), cookieOptions())

    return res
  }

  const nextDelayCount = Math.min(MAX_DELAYS, currentDelayCount + 1)

  const res = NextResponse.json({
    ok: true,
    delayCount: nextDelayCount,
    maxDelays: MAX_DELAYS,
    elapsedSeconds,
    remainingSeconds: Math.max(0, BROWSING_TIME_LIMIT_SECONDS - elapsedSeconds),
    canBrowse: canContinueBrowsing(elapsedSeconds, nextDelayCount),
    shouldPromptSignIn: !canContinueBrowsing(elapsedSeconds, nextDelayCount),
  })

  res.cookies.set(COOKIE_BROWSING_START, String(browsingStartMs), cookieOptions())
  res.cookies.set(COOKIE_DELAY_COUNT, String(nextDelayCount), cookieOptions())

  return res
}
