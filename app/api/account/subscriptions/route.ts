import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'
const sql = neon(process.env.DATABASE_URL!)

async function authedEmail(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null
  const token = await getToken({ req, secret })
  const email = (token as any)?.email || (token as any)?.user?.email || (token as any)?.sub
  return typeof email === 'string' && email.length ? email : null
}

export async function GET(req: NextRequest) {
  const email = await authedEmail(req)
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`SELECT subscriptions FROM users WHERE email=${email} LIMIT 1`
  return NextResponse.json({ subscriptions: rows[0]?.subscriptions ?? {} })
}

export async function POST(req: NextRequest) {
  const email = await authedEmail(req)
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))

  const rows = await sql`
    UPDATE users
    SET subscriptions = ${JSON.stringify(body)}::jsonb
    WHERE email = ${email}
    RETURNING subscriptions
  `
  return NextResponse.json({ subscriptions: rows[0]?.subscriptions ?? body })
}