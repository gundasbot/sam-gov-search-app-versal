// app/api/auth/auto-login/route.ts
// This route is no longer used - auto-login was removed in favour of
// simple email pre-fill after verification. Kept as a stub to avoid 404s
// from any old email links still in circulation.
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  // Old auto-login links just go to the login page
  return NextResponse.redirect(new URL('/?mode=login', request.url))
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ ok: false, error: 'Auto-login is no longer supported' }, { status: 410 })
}