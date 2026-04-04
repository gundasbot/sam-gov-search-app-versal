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

function getSettingsNotifications(input: unknown): JsonRecord {
  const root = asObject(input)
  return asObject(root.settingsNotifications)
}

function changedKeys(beforeObj: JsonRecord, afterObj: JsonRecord): string[] {
  const keys = new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)])
  const changed: string[] = []
  for (const key of keys) {
    if (JSON.stringify(beforeObj[key]) !== JSON.stringify(afterObj[key])) {
      changed.push(key)
    }
  }
  return changed.sort()
}

async function ensurePreferenceAuditTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS subscription_preference_events (
      id BIGSERIAL PRIMARY KEY,
      user_email TEXT NOT NULL,
      source TEXT,
      changed_keys JSONB,
      before_settings JSONB,
      after_settings JSONB,
      changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_subscription_preference_events_user_email
    ON subscription_preference_events (user_email)
  `

  await sql`
    CREATE INDEX IF NOT EXISTS idx_subscription_preference_events_changed_at
    ON subscription_preference_events (changed_at)
  `
}

async function authedEmail(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null
  const token = await getToken({ req, secret })
  const email = (token as any)?.email || (token as any)?.users?.email || (token as any)?.sub
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
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const beforeRows = await sql`SELECT subscriptions FROM users WHERE email=${email} LIMIT 1`
  const beforeSubscriptions = beforeRows[0]?.subscriptions ?? {}

  const rows = await sql`
    UPDATE users
    SET subscriptions = COALESCE(subscriptions, '{}'::jsonb) || ${JSON.stringify(body)}::jsonb
    WHERE email = ${email}
    RETURNING subscriptions
  `

  const afterSubscriptions = rows[0]?.subscriptions ?? body

  const beforeSettings = getSettingsNotifications(beforeSubscriptions)
  const afterSettings = getSettingsNotifications(afterSubscriptions)
  const changed = changedKeys(beforeSettings, afterSettings)

  if (changed.length) {
    await ensurePreferenceAuditTable()

    await sql`
      INSERT INTO subscription_preference_events (
        user_email,
        source,
        changed_keys,
        before_settings,
        after_settings
      ) VALUES (
        ${email},
        ${'account_settings'},
        ${JSON.stringify(changed)}::jsonb,
        ${JSON.stringify(beforeSettings)}::jsonb,
        ${JSON.stringify(afterSettings)}::jsonb
      )
    `
  }

  return NextResponse.json({
    subscriptions: afterSubscriptions,
    settingsNotifications: afterSettings,
    changedKeys: changed,
    persistedAt: new Date().toISOString(),
    adminNotificationSent: false,
    notificationMode: 'audit_only',
  })
}
