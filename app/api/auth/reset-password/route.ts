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

function isStrongEnough(pw: string) {
  return pw.length >= 10
}

function safeIdent(name: string) {
  if (!/^[a-zA-Z0-9_]+$/.test(name)) throw new Error('Invalid identifier')
  return name
}

export async function POST(req: NextRequest) {
  console.log('ðŸ” === RESET PASSWORD API CALLED ===')
  console.log('ðŸ“¡ Request URL:', req.url)
  console.log('ðŸ“¡ Request method:', req.method)
  console.log('ðŸ“¡ Request headers:', Object.fromEntries(req.headers.entries()))
  
  try {
    // Read and log raw body
    const text = await req.text()
    console.log('ðŸ“¦ Raw body:', text)
    
    let body
    try {
      body = JSON.parse(text)
      console.log('âœ… Parsed body:', {
        tokenLength: body?.token?.length || 0,
        tokenPreview: body?.token ? body.token.substring(0, 10) + '...' : 'none',
        passwordLength: body?.password?.length || 0,
        passwordPreview: body?.password ? '*** (hidden)' : 'none'
      })
    } catch (parseError) {
      console.error('âŒ JSON parse error:', parseError)
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400 })
    }
    
    const token = String(body?.token || '').trim()
    const password = String(body?.password || '')
    
    if (!token || token.length < 20) {
      console.log('âŒ Invalid token (too short):', token.length)
      console.log('âŒ Token value:', token)
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }
    
    // Calculate and log token hash
    const tokenHash = sha256(token)
    console.log('ðŸ”¢ Token hash calculated:', {
      token: token.substring(0, 20) + '...',
      hash: tokenHash,
      hashPreview: tokenHash.substring(0, 20) + '...',
      hashLength: tokenHash.length
    })
    
    if (!isStrongEnough(password)) {
      console.log('âŒ Password too weak:', {
        length: password.length,
        meetsRequirement: password.length >= 10
      })
      return NextResponse.json({ error: 'Password must be at least 10 characters' }, { status: 400 })
    }
    
    console.log('ðŸ” Querying database for token hash...')
    console.log('ðŸ” SQL Query: SELECT id, email, expires_at, used_at FROM password_reset_tokens WHERE tokenHash = $1')
    console.log('ðŸ” Query parameter (hash):', tokenHash)
    
    const r = await pool.query(
      `select id, email, expires_at, used_at
       from password_reset_tokens
       where tokenHash = $1
       limit 1`,
      [tokenHash]
    )
    
    console.log('ðŸ“Š Database query result:', {
      rowsFound: r.rows?.length || 0,
      rowCount: r.rowCount,
      row: r.rows?.[0] ? {
        id: r.rows[0].id,
        email: r.rows[0].email,
        expires_at: r.rows[0].expires_at,
        used_at: r.rows[0].used_at,
        expires_at_type: typeof r.rows[0].expires_at,
        used_at_type: typeof r.rows[0].used_at
      } : null
    })
    
    if (!r.rows?.length) {
      console.log('âŒ Token not found in database. Possible issues:')
      console.log('   1. Hash mismatch between Node.js and DB insertion')
      console.log('   2. Token was deleted')
      console.log('   3. Different hash algorithm used')
      console.log('âš ï¸  Recommended: Check if the hash in DB matches:', tokenHash)
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
    }
    
    const row = r.rows[0]
    console.log('âœ… Token found. Checking validity...')
    
    if (row.used_at) {
      console.log('âŒ Token already used:', {
        used_at: row.used_at,
        used_at_iso: row.used_at?.toISOString(),
        current_time: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Token already used' }, { status: 400 })
    }
    
    console.log('âœ… Token not yet used. Checking expiration...')
    const exp = new Date(row.expires_at)
    const now = new Date()
    console.log('â° Time check:', {
      expires_at: row.expires_at,
      expires_at_iso: exp.toISOString(),
      current_time_iso: now.toISOString(),
      expires_at_timestamp: exp.getTime(),
      current_timestamp: now.getTime(),
      is_expired: now.getTime() > exp.getTime(),
      time_difference_minutes: (now.getTime() - exp.getTime()) / (1000 * 60)
    })
    
    if (Date.now() > exp.getTime()) {
      console.log('âŒ Token expired:', {
        expired_at: exp.toISOString(),
        current_time: now.toISOString(),
        minutes_expired: (now.getTime() - exp.getTime()) / (1000 * 60)
      })
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }
    
    console.log('âœ… Token is valid. Hashing new password...')
    
    // hash new password
    const passwordHash = await bcrypt.hash(password, 12)
    console.log('ðŸ” Password hashed with bcrypt (cost 12)')
    
    // update user password
    const usersTable = safeIdent(process.env.AUTH_USERS_TABLE || 'users')
    const passwordColumn = safeIdent(process.env.AUTH_PASSWORD_COLUMN || 'password_hash')
    
    console.log('ðŸ—ï¸ Environment variables:', {
      AUTH_USERS_TABLE: process.env.AUTH_USERS_TABLE || 'users (default)',
      AUTH_PASSWORD_COLUMN: process.env.AUTH_PASSWORD_COLUMN || 'password_hash (default)',
      sanitized_table: usersTable,
      sanitized_column: passwordColumn
    })
    
    // NOTE: column/table are identifiers, not parameterized; safeIdent() restricts format
    const updateSql = `update ${usersTable} set ${passwordColumn} = $1 where email = $2`
    console.log('ðŸ“ Update SQL:', updateSql)
    console.log('ðŸ“ Update parameters:', [
      passwordHash.substring(0, 20) + '...',
      row.email
    ])
    
    console.log('ðŸš€ Executing user update...')
    const updated = await pool.query(updateSql, [passwordHash, row.email])
    console.log('ðŸ“Š User update result:', {
      rowCount: updated.rowCount || 0,
      command: updated.command,
      oid: updated.oid
    })
    
    // If no rows updated, still mark token used? Usually NO. Return helpful error.
    if ((updated.rowCount || 0) < 1) {
      console.log('âŒ No user found to update:', {
        email: row.email,
        table: usersTable,
        column: passwordColumn,
        possible_issues: [
          'Email does not exist in users table',
          'Table/column names are incorrect',
          'Database connection issue'
        ]
      })
      return NextResponse.json(
        { error: 'No user found for that email (check users table/column env vars).' },
        { status: 400 }
      )
    }
    
    console.log('âœ… User password updated successfully')
    
    // mark token as used
    console.log('ðŸ·ï¸ Marking token as used...')
    await pool.query(`update password_reset_tokens set used_at = now() where id = $1`, [row.id])
    console.log('âœ… Token marked as used')
    
    console.log('ðŸŽ‰ Password reset completed successfully for:', row.email)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (e) {
    console.error('ðŸ’¥ Unhandled error in password reset:', e)
    const msg = e instanceof Error ? e.message : 'Reset failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
