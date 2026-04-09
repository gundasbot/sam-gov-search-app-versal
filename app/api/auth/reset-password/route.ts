import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { Pool } from 'pg'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function isStrongEnough(password: string) {
  return password.length >= 10
}

function safeIdent(name: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error('Invalid identifier')
  return name
}

type ResetTokenRow = {
  id: string
  email: string
  expires_at: string | Date
  used_at: string | Date | null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const token = String(body?.token || '').trim()
    const password = String(body?.password || '')

    if (!token || token.length < 20) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    if (!isStrongEnough(password)) {
      return NextResponse.json({ error: 'Password must be at least 10 characters' }, { status: 400 })
    }

    const tokenHash = sha256(token)

    const result = await pool.query<ResetTokenRow>(
      `select id, email, expires_at, used_at
       from password_reset_tokens
       where tokenHash = $1
       limit 1`,
      [tokenHash]
    )

    if (!result.rows?.length) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }

    const row = result.rows[0]
    if (row.used_at) {
      return NextResponse.json({ error: 'Token already used' }, { status: 400 })
    }

    const expiresAt = new Date(row.expires_at)
    if (Number.isNaN(expiresAt.getTime()) || Date.now() > expiresAt.getTime()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const usersTable = safeIdent(process.env.AUTH_USERS_TABLE || 'users')
    const passwordColumn = safeIdent(process.env.AUTH_PASSWORD_COLUMN || 'password_hash')

    const updateSql = `update ${usersTable} set ${passwordColumn} = $1 where email = $2`
    const updated = await pool.query(updateSql, [passwordHash, row.email])

    if ((updated.rowCount || 0) < 1) {
      return NextResponse.json(
        { error: 'No user found for that email (check users table/column env vars).' },
        { status: 400 }
      )
    }

    await pool.query(`update password_reset_tokens set used_at = now() where id = $1`, [row.id])
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    console.error('Password reset failed')
    return NextResponse.json({ error: 'Reset failed' }, { status: 500 })
  }
}
