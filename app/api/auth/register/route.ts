// app/api/auth/register/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import {
  createVerificationToken,
  sendVerificationEmail,
} from '@/lib/email/verification'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, password, company, plan, billing } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    const existingUser = await prisma.users.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const nameParts = (name || '').trim().split(' ')
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const planRaw = String(plan || 'PROFESSIONAL').toUpperCase()
    const planTier = planRaw === 'BASIC' || planRaw === 'ENTERPRISE' ? planRaw : 'PROFESSIONAL'
    const billingInterval = String(billing || 'monthly').toLowerCase() === 'annual' ? 'annual' : 'monthly'

    // Create user — NO token fields here (tokens live in email_verification_tokens table)
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        name: name || firstName,
        first_name: firstName || null,
        last_name: lastName || null,
        email,
        password_hash: hashedPassword,
        email_verified: null,
        updated_at: new Date(),
        company: company || null,
        plan_tier: planTier,
        billing_interval: billingInterval,
        is_active: false,
        account_status: 'pending',
        role: 'user',
      },
    })

    // Store hashed token in email_verification_tokens table
    const rawToken = await createVerificationToken(user.id, email)

    // Send branded verification email
    try {
      await sendVerificationEmail(email, name || firstName || 'there', rawToken)
      console.log('✅ Verification email sent to:', email)
    } catch (emailError) {
      console.error('❌ Verification email failed (non-blocking):', emailError)
    }

    return NextResponse.json(
      {
        message: 'Account created successfully. Please check your email to verify your account.',
        user: { id: user.id, name: user.name, email: user.email },
        emailSent: true,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    if (error?.name === 'PrismaClientValidationError') {
      return NextResponse.json(
        { error: 'Database validation error', details: error.message?.slice(0, 400) },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'An error occurred during registration' }, { status: 500 })
  }
}