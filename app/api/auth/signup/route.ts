// app/api/auth/signup/route.ts - FIXED
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { getVerificationEmailHtml, getVerificationEmailText } from '@/lib/email/verification-email'
import { getBrand } from '@/lib/email/brand'

const TRIAL_DAYS = 7

// ✨ Helper functions to normalize plan selection
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

    // Accept both snake_case (landing page) and camelCase (AccessControlModal)
    const first_name: string = (body.first_name || body.firstName || '').trim()
    const last_name: string  = (body.last_name  || body.lastName  || '').trim()
    const phone: string | undefined   = (body.phone   || '').trim() || undefined
    const company: string | undefined = (body.company || '').trim() || undefined

    // Validation
    if (!email || !password || !first_name || !last_name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // ✨ Normalize plan selection
    const pendingTier = selectedPlanTier ? normalizeTier(selectedPlanTier) : null
    const pendingInterval = selectedBillingInterval ? normalizeInterval(selectedBillingInterval) : 'MONTHLY'

    const now = new Date()

    // ✨ Create user with pending plan (trial NOT active yet)
    const user = await prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        email: normalizedEmail,
        password_hash: passwordHash,
        first_name: first_name.trim(),
        last_name: last_name.trim(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        name: `${first_name.trim()} ${last_name.trim()}`,
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

    console.log('✅ User created with pending plan:', {
      email: user.email,
      tier: pendingTier || 'BASIC',
      interval: pendingInterval,
    })

    // Generate verification token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create verification token
    await prisma.email_verification_tokens.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: new Date(),
      },
    })

    // Get brand and app URL
    const brand = getBrand()
    const verificationUrl = `${brand.appUrl}/api/auth/verify-email?token=${rawToken}`

    const selectedPlanName = pendingTier ? 
      (pendingTier === 'BASIC' ? 'Basic' : 
       pendingTier === 'PROFESSIONAL' ? 'Professional' : 
       'Enterprise') : 'Professional'

    // 🔧 FIXED: Properly handle email sending failures
    let emailSent = false
    let emailError: string | null = null

    try {
      console.log('📧 Attempting to send verification email...')
      console.log('📧 Recipient:', user.email)
      console.log('📧 API Key exists:', !!process.env.RESEND_API_KEY)
      console.log('📧 FROM email:', process.env.RESEND_FROM_EMAIL)

      const html = getVerificationEmailHtml({
        first_name: first_name,
        verificationUrl: verificationUrl,
      })

      const text = getVerificationEmailText({
        first_name: first_name,
        verificationUrl: verificationUrl,
      })

      const result = await sendEmail({
        to: user.email,
        subject: `Verify Your Email - ${brand.name}`,
        html,
        text,
      })
      
      console.log('✅ Verification email sent successfully:', {
        success: result.success,
        data: result.data,
        to: user.email,
      })

      emailSent = true

    } catch (error: any) {
      console.error('❌ FAILED to send verification email:', {
        error: error.message,
        statusCode: error.statusCode,
        name: error.name,
      })

      // Check if it's the Resend test domain restriction
      if (error.message?.includes('can only send testing emails')) {
        emailError = 'test_domain_restriction'
      } else {
        emailError = 'email_send_failed'
      }
    }

    // 🎯 FIXED: Return appropriate response based on email status
    if (!emailSent) {
      // Email failed to send
      if (emailError === 'test_domain_restriction') {
        // Delete the user we just created since they can't verify
        await prisma.users.delete({ where: { id: user.id } })
        await prisma.email_verification_tokens.deleteMany({ where: { user_id: user.id } })

        return NextResponse.json(
          { 
            error: 'This email address cannot receive verification emails in test mode. Please sign up with preciseanalyticsllc@gmail.com instead, or contact support.',
            errorCode: 'TEST_DOMAIN_RESTRICTION'
          },
          { status: 400 }
        )
      } else {
        // Other email error - keep account but warn user
        return NextResponse.json(
          { 
            success: true,
            emailSent: false,
            message: 'Account created but verification email failed to send. Please contact support.',
            user_id: user.id,
            warning: 'EMAIL_SEND_FAILED'
          },
          { status: 201 }
        )
      }
    }

    // ✅ Email sent successfully
    return NextResponse.json(
      { 
        success: true,
        emailSent: true,
        message: `Account created successfully! Check your email to verify and activate your ${selectedPlanName} trial.`,
        user_id: user.id 
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