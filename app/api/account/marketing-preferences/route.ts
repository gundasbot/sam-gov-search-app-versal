import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'
const sql = neon(process.env.DATABASE_URL!)

type JsonRecord = Record<string, unknown>

function asObject(value: unknown): JsonRecord {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as JsonRecord
  }
  return {}
}

async function authedEmail(req: NextRequest): Promise<string | null> {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null
  const token = await getToken({ req, secret })
  const email = (token as { email?: unknown; sub?: unknown })?.email || (token as { sub?: unknown })?.sub
  return typeof email === 'string' && email.length ? email.toLowerCase().trim() : null
}

function extractMarketingOptIn(subscriptions: unknown): boolean {
  const root = asObject(subscriptions)
  const marketing = asObject(root.marketingPreferences)
  if (typeof marketing.optIn === 'boolean') return marketing.optIn

  const settings = asObject(root.settingsNotifications)
  if (typeof settings.marketingEmails === 'boolean') return settings.marketingEmails

  return false
}

export async function GET(req: NextRequest) {
  const email = await authedEmail(req)
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await sql`SELECT subscriptions FROM users WHERE email=${email} LIMIT 1`
  const subscriptions = rows[0]?.subscriptions ?? {}
  const optIn = extractMarketingOptIn(subscriptions)

  return NextResponse.json({
    marketingPreferences: {
      optIn,
      source: 'subscriptions.marketingPreferences.optIn',
    },
  })
}

export async function POST(req: NextRequest) {
  const email = await authedEmail(req)
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  if (typeof body?.optIn !== 'boolean') {
    return NextResponse.json({ error: 'optIn must be a boolean' }, { status: 400 })
  }

  const rows = await sql`
    UPDATE users
    SET subscriptions =
      jsonb_set(
        jsonb_set(
          COALESCE(subscriptions, '{}'::jsonb),
          '{marketingPreferences}',
          COALESCE(subscriptions->'marketingPreferences', '{}'::jsonb) || jsonb_build_object('optIn', ${body.optIn}, 'updatedAt', NOW()),
          true
        ),
        '{settingsNotifications}',
        COALESCE(subscriptions->'settingsNotifications', '{}'::jsonb) || jsonb_build_object('marketingEmails', ${body.optIn}),
        true
      )
    WHERE email = ${email}
    RETURNING subscriptions
  `

  const subscriptions = rows[0]?.subscriptions ?? {}
  return NextResponse.json({
    marketingPreferences: {
      optIn: extractMarketingOptIn(subscriptions),
      source: 'subscriptions.marketingPreferences.optIn',
    },
    subscriptions,
    persistedAt: new Date().toISOString(),
  })
}
