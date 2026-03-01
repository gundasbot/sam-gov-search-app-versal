// app/api/auth/signup/route.ts
// FIXES vs previous version:
//  • Does NOT delete the user on test-domain email failure — keeps account, shows clear instructions
//  • Returns structured error codes the modal can act on
//  • Properly passes first_name & last_name from camelCase body

import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { getVerificationEmailHtml, getVerificationEmailText } from '@/lib/email/verification-email'
import { getBrand } from '@/lib/email/brand'

const TRIAL_DAYS = 7

function normalizeTier(raw: any): string | null {
  const v = String(raw || '').toUpperCase().trim()
  if (v === 'BASIC' || v === 'PROFESSIONAL' || v === 'ENTERPRISE') return v
  return null
}

function normalizeInterval(raw: any): string {
  const v = String(raw || '').toLowerCase().trim()
  return v === 'annual' ? 'ANNUAL' : 'MONTHLY'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, selectedPlanTier, selectedBillingInterval } = body

    // Accept both camelCase (modal) and snake_case (landing page)
    const first_name: string = (body.first_name || body.firstName || '').trim()
    const last_name: string  = (body.last_name  || body.lastName  || '').trim()
    const phone: string | undefined   = (body.phone   || '').trim() || undefined
    const company: string | undefined = (body.company || '').trim() || undefined

    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    const existingUser = await prisma.users.findUnique({ where: { email: normalizedEmail } })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    const passwordHash = await hash(password, 12)
    const pendingTier     = selectedPlanTier ? normalizeTier(selectedPlanTier) : null
    const pendingInterval = selectedBillingInterval ? normalizeInterval(selectedBillingInterval) : 'MONTHLY'
    const now = new Date()

    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        password_hash: passwordHash,
        first_name,
        last_name,
        phone: phone ?? null,
        company: company ?? null,
        name: `${first_name} ${last_name}`,
        role: 'user',
        plan: 'trial',
        plan_tier: pendingTier || 'BASIC',
        plan_status: 'pending',
        trial_active: false,
        trial_started_at: null,
        trial_expires_at: null,
        trial_ends_at: null,
        billing_interval: pendingInterval,
        email_verified: null,
        is_active: false,
        is_suspended: false,
        updated_at: now,
      },
    })

    // Generate verification token
    const rawToken  = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)

    await prisma.email_verification_tokens.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: now,
      },
    })

    const brand           = getBrand()
    const verificationUrl = `${brand.appUrl}/api/auth/verify-email?token=${rawToken}`

    const selectedPlanName =
      pendingTier === 'BASIC'         ? 'Basic'
      : pendingTier === 'ENTERPRISE'  ? 'Enterprise'
      : 'Professional'

    // ── Send verification email ───────────────────────────────────────────────
    let emailSent  = false
    let emailError: string | null = null

    try {
      const html = getVerificationEmailHtml({ first_name, verificationUrl })
      const text = getVerificationEmailText({ first_name, verificationUrl })

      const result = await sendEmail({
        to: user.email,
        subject: `Verify Your Email – ${brand.name}`,
        html,
        text,
      })

      console.log('✅ Verification email sent:', { to: user.email, success: result.success })
      emailSent = true

    } catch (error: any) {
      console.error('❌ Verification email failed:', error.message)
      if (error.message?.includes('can only send testing emails')) {
        emailError = 'test_domain_restriction'
      } else {
        emailError = 'email_send_failed'
      }
    }

    if (!emailSent) {
      if (emailError === 'test_domain_restriction') {
        // Keep the account — let the user know they must use the allowed test address
        return NextResponse.json(
          {
            success: false,
            emailSent: false,
            errorCode: 'TEST_DOMAIN_RESTRICTION',
            error:
              "We're in test mode and can only send emails to preciseanalyticsllc@gmail.com. " +
              'Your account has been created — please contact support or sign up with the test address.',
            user_id: user.id,
          },
          { status: 400 }
        )
      }

      // Generic failure — account is created, but email didn't go out
      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          warning: 'EMAIL_SEND_FAILED',
          message:
            'Account created, but your verification email failed to send. ' +
            'Please use the "Resend verification email" option or contact support.',
          user_id: user.id,
        },
        { status: 201 }
      )
    }

    // ✅ All good
    return NextResponse.json(
      {
        success: true,
        emailSent: true,
        message: `Account created! Check your inbox to verify your email and activate your ${selectedPlanName} trial.`,
        user_id: user.id,
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('❌ Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}