import { Pool, QueryResultRow } from 'pg'

declare global {
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined
}

function stripWrappingQuotes(v: string) {
  const s = v.trim()
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1)
  }
  return s
}

function getDbUrl() {
  const raw = process.env.DATABASE_URL ?? ''
  const url = stripWrappingQuotes(raw)
  if (!url) {
    // This makes the problem obvious instead of pg trying random defaults like "base"
    throw new Error('DATABASE_URL is missing in server runtime. Check .env.local and restart `npm run dev`.')
  }
  return url
}

function getPool() {
  if (global.__pgPool) return global.__pgPool

  const connectionString = getDbUrl()
  const host = (() => {
    try {
      return new URL(connectionString).host
    } catch {
      return '(unparseable DATABASE_URL)'
    }
  })()

  // Log once in dev so we can confirm it’s NOT "base"
  if (process.env.NODE_ENV !== 'production') {
    console.log('[DB] Using DATABASE_URL host:', host)
  }

  const pool = new Pool({
    connectionString,
    ssl: connectionString.includes('sslmode=require') || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
  })

  if (process.env.NODE_ENV !== 'production') global.__pgPool = pool
  return pool
}

export async function dbQuery<T extends QueryResultRow = any>(text: string, params?: any[]) {
  const pool = getPool()
  return pool.query<T>(text, params)
}
