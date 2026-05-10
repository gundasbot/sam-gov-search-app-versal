// app/api/delay-signin/route.ts
// Alias endpoint for "extend browsing time" button
// Forwards POST requests to the browsing-status endpoint which handles the delay logic

import { NextRequest, NextResponse } from 'next/server'

/**
 * POST — user clicks "Give me a little more time"
 * Forwards to browsing-status which handles delay increment logic
 */
export async function POST(request: NextRequest) {
  // Extract cookies from incoming request
  const startCookie = request.cookies.get('browsing_start_time')?.value
  const delayCookie = request.cookies.get('delay_count')?.value

  const now = Date.now()
  const startMs = parseInt(startCookie || String(now), 10)
  const currentDelays = parseInt(delayCookie || '0', 10)

  const BROWSING_TIME_LIMIT_MS = 20 * 60 * 1000 // 20 minutes
  const MAX_DELAYS = 2

  const elapsedMs = Math.max(0, now - startMs)
  const remainingMs = Math.max(0, BROWSING_TIME_LIMIT_MS - elapsedMs)
  const timeRemaining = Math.floor(remainingMs / 1000)

  // Already maxed out
  if (currentDelays >= MAX_DELAYS) {
    return NextResponse.json({
      ok: false,
      message: 'Maximum browsing extensions used.',
      delayCount: currentDelays,
      maxDelays: MAX_DELAYS,
      timeRemaining,
      newTimeLimit: timeRemaining,
      canBrowse: false,
      isExpired: true,
    })
  }

  const nextDelayCount = currentDelays + 1
  const isExpired = nextDelayCount >= MAX_DELAYS && remainingMs <= 0

  const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 hours
  }

  const res = NextResponse.json({
    ok: true,
    delayCount: nextDelayCount,
    maxDelays: MAX_DELAYS,
    timeRemaining,
    newTimeLimit: timeRemaining,
    canBrowse: !isExpired,
    isExpired,
  })

  res.cookies.set('browsing_start_time', String(startMs), cookieOptions)
  res.cookies.set('delay_count', String(nextDelayCount), cookieOptions)

  return res
}
