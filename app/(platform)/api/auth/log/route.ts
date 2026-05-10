import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Some libraries (and some setups) may call this endpoint with GET (prefetch / health check)
// while others POST logs. If either returns HTML/405, NextAuth client can crash when parsing.
export async function GET() {
  return NextResponse.json({ ok: true })
}

export async function POST(req: Request) {
  try {
    // Accept anything (don’t throw) so callers never get HTML error responses.
    // You can later store these logs in DB if you want.
    const contentType = req.headers.get('content-type') || ''
    let payload: any = null

    if (contentType.includes('application/json')) {
      payload = await req.json().catch(() => null)
    } else {
      const text = await req.text().catch(() => '')
      payload = text || null
    }

    // Optional: console log during dev
    if (process.env.NODE_ENV !== 'production') {
      console.log('📩 /api/auth/log', payload)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    // Never return HTML here. Always JSON.
    return NextResponse.json({ ok: false }, { status: 200 })
  }
}
