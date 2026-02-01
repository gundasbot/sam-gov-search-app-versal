import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'
import { sendTrialConfirmationEmail, sendAdminTrialNotification } from '@/lib/email'

export const runtime = 'nodejs'

const sql = neon(process.env.DATABASE_URL!)

function clamp(v: unknown, max = 255) {
  return String(v ?? '').trim().slice(0, max)
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

type Body = {
  featureName?: string
  contactContext?: string
  firstName: string
  lastName: string
  company?: string
  email: string
  phone: string
  position?: string
  message?: string
  password: string
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Body | null
    if (!body) return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })

    const firstName = clamp(body.firstName, 80)
    const lastName = clamp(body.lastName, 80)
    const company = clamp(body.company, 120)
    const email = clamp(body.email, 254).toLowerCase()
    const phone = clamp(body.phone, 50)
    const position = clamp(body.position, 120)
    const message = clamp(body.message, 2000)
    const password = String(body.password ?? '')

    if (!firstName || !lastName || !email || !phone || !password) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
    }
    if (!isValidEmail(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 })
    }
    if (password.length < 10) {
      return NextResponse.json({ error: 'Password must be at least 10 characters.' }, { status: 400 })
    }

    // Check existing user
    const existing = await sql`
      SELECT id, access_status, plan, trial_ends_at
      FROM users
      WHERE lower(email) = ${email}
      LIMIT 1
    `

    if (existing.length) {
      const u = existing[0] as any
      if ((u.access_status ?? 'active') !== 'active') {
        return NextResponse.json({ error: 'Account is disabled.', code: 'disabled' }, { status: 403 })
      }

      // If trial still active, do not reset it
      if ((u.plan ?? 'trial') === 'trial' && u.trial_ends_at) {
        const ends = new Date(u.trial_ends_at).getTime()
        if (!Number.isNaN(ends) && ends > Date.now()) {
          return NextResponse.json({ ok: true, trialEndsAt: u.trial_ends_at, alreadyExists: true })
        }
      }

      // Trial expired (do not re-issue automatically)
      return NextResponse.json(
        { error: 'Trial already used. Please upgrade to regain access.', code: 'trial_expired' },
        { status: 403 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 12)

    const inserted = await sql`
      INSERT INTO users (
        email,
        name,
        password_hash,
        first_name,
        last_name,
        phone,
        company,
        position,
        role,
        plan,
        access_status,
        trial_started_at,
        trial_ends_at,
        created_at,
        updated_at
      )
      VALUES (
        ${email},
        ${`${firstName} ${lastName}`},
        ${passwordHash},
        ${firstName},
        ${lastName},
        ${phone},
        ${company || null},
        ${position || null},
        'user',
        'trial',
        'active',
        now(),
        now() + interval '7 days',
        now(),
        now()
      )
      RETURNING trial_ends_at
    `

    const trialEndsAt = (inserted?.[0] as any)?.trial_ends_at
    
    // Send confirmation email to user
    try {
      await sendTrialConfirmationEmail({
        email,
        firstName,
        lastName,
        trialEndsAt: new Date(trialEndsAt)
      })
    } catch (emailError) {
      console.error('Failed to send trial confirmation email:', emailError)
    }
    
    // Send notification to admin
    try {
      await sendAdminTrialNotification({
        firstName,
        lastName,
        email,
        phone,
        company,
        position,
        trialEndsAt: new Date(trialEndsAt)
      })
    } catch (emailError) {
      console.error('Failed to send admin notification:', emailError)
    }
    return NextResponse.json({ ok: true, trialEndsAt })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Server error.' }, { status: 500 })
  }
}