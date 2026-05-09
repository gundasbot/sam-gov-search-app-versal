// app/api/auth/signup/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// CANONICAL signup endpoint. This is the only signup endpoint used.
//
// Flow:
//   POST /api/auth/signup
//   → creates user (unverified, trial NOT yet started)
//   → creates email_verification_token
//   → sends verification email with link to /api/auth/verify-email?token=<raw>
//   → returns { success: true, emailSent: true }
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { getBrand } from '@/lib/email/brand'
import { sendSignupWelcomeEmailOnce } from '@/lib/email/signup-welcome'
import Stripe from 'stripe'

export const runtime = 'nodejs'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

function normalizeTier(raw: unknown): 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE' {
  const v = String(raw ?? '').toUpperCase().trim()
  if (v === 'PROFESSIONAL') return 'PROFESSIONAL'
  if (v === 'ENTERPRISE') return 'ENTERPRISE'
  return 'BASIC'
}

function normalizeInterval(raw: unknown): 'MONTHLY' | 'ANNUAL' {
  return /annual|year/i.test(String(raw ?? '')) ? 'ANNUAL' : 'MONTHLY'
}

export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Accept both camelCase and snake_case field names
    const email      = String(body.email ?? '').toLowerCase().trim()
    const password   = String(body.password ?? '')
    const first_name = String(body.first_name || body.firstName || '').trim()
    const last_name  = String(body.last_name  || body.lastName  || '').trim()
    const phone      = String(body.phone      || '').trim() || undefined
    const company    = String(body.company    || '').trim() || undefined
    const job_title  = String(body.jobTitle   || body.job_title || body.title || body.role || '').trim() || undefined
    const trialCode  = String(body.trialCode  || body.trial_code || body.code || '').toUpperCase().trim() || undefined

    const pendingTier     = normalizeTier(body.selectedPlanTier || body.plan)
    const pendingInterval = normalizeInterval(body.selectedBillingInterval || body.billing)

    // ── Validate ──────────────────────────────────────────────────────────────
    if (!email || !password || !first_name) {
      return NextResponse.json(
        { error: 'Name, email, and password are required' },
        { status: 400 }
      )
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // ── Validate trial/offer code if provided ─────────────────────────────────
    let validatedCode: { id: string; code: string; type: string; discount: string } | null = null
    if (trialCode) {
      const offerCode = await prisma.offer_codes.findFirst({
        where: {
          code: trialCode,
          active: true,
        },
        select: { id: true, code: true, type: true, discount: true, max_usage: true, usage_count: true, expires_at: true },
      })

      if (!offerCode) {
        // Don't block signup, just log and continue without the code
        console.warn(`⚠️ Invalid trial code attempted: ${trialCode}`)
      } else {
        // Check if expired
        if (offerCode.expires_at && new Date(offerCode.expires_at) < new Date()) {
          console.warn(`⚠️ Expired trial code attempted: ${trialCode}`)
        } 
        // Check if max usage exceeded
        else if (offerCode.max_usage && offerCode.usage_count >= offerCode.max_usage) {
          console.warn(`⚠️ Exhausted trial code attempted: ${trialCode}`)
        } else {
          validatedCode = offerCode
          console.log(`✅ Valid trial code applied: ${trialCode}`)
        }
      }
    }

    // ── Duplicate check ───────────────────────────────────────────────────────
    const existing = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email_verified: true },
    })

    if (existing) {
      // If unverified, allow re-send without revealing the account exists
      if (!existing.email_verified) {
        await resendVerification(existing.id, email, first_name)
        return NextResponse.json({
          success: true,
          emailSent: true,
          message: 'Verification email resent. Please check your inbox.',
        })
      }
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // ── Create user (NOT yet active — trial starts on email verification) ─────
    const passwordHash = await hash(password, 12)
    const now = new Date()

    const user = await prisma.users.create({
      data: {
        id:               crypto.randomUUID(),
        updated_at:       now,
        email,
        first_name,
        last_name,
        name:             `${first_name} ${last_name}`,
        password_hash:    passwordHash,
        phone:            phone ?? null,
        company:          company ?? null,
        job_title:        job_title ?? null,
        offer_code:       validatedCode?.code ?? null,
        role:             'user',
        plan:             'trial',
        plan_tier:        pendingTier,
        plan_status:      'pending_verification',
        subscription_status: 'pending_verification',
        billing_interval: pendingInterval,
        trial_active:     false,          // starts on email click
        trial_started_at: null,
        trial_expires_at: null,
        trial_ends_at:    null,
        email_verified:   null,
        is_active:        false,
        is_suspended:     false,
      },
    })

    // Send welcome email at signup creation (non-blocking/deduped).
    const signupTrialDays = await resolveTrialDaysForCode(validatedCode?.code)
    await sendSignupWelcomeEmailOnce({
      userId: user.id,
      email: user.email,
      name: `${first_name} ${last_name}`.trim() || first_name,
      source: 'email_signup',
      trialDays: signupTrialDays,
    })

    // Notify admin portal: stop cold outreach to this contact and mark as converted.
    const adminUrl = process.env.ADMIN_PORTAL_URL || process.env.NEXT_PUBLIC_ADMIN_URL || ''
    const cronSecret = process.env.CRON_SECRET || ''
    if (adminUrl && cronSecret) {
      fetch(`${adminUrl}/api/outreach/convert`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${cronSecret}` },
        body:    JSON.stringify({ email: user.email, source: 'signup' }),
      }).catch(() => null) // fire-and-forget, never block signup
    }

    // ── Increment offer code usage if one was applied ─────────────────────────
    if (validatedCode) {
      try {
        // Increment usage count
        await prisma.offer_codes.update({
          where: { id: validatedCode.id },
          data: { usage_count: { increment: 1 } },
        })
        
        // Log the redemption for tracking
        await prisma.$executeRaw`
          INSERT INTO code_redemptions (id, user_id, offer_code_id, code, redeemed_at, source)
          VALUES (
            ${crypto.randomUUID()},
            ${user.id},
            ${validatedCode.id},
            ${validatedCode.code},
            NOW(),
            'signup'
          )
          ON CONFLICT DO NOTHING
        `
        
        console.log(`📊 Code redeemed: ${validatedCode.code} by user ${user.id}`)
      } catch (err) {
        console.warn(`⚠️ Failed to log offer code redemption:`, err)
        // Don't fail signup if redemption logging fails
      }
    }

    // ── Send verification email ───────────────────────────────────────────────
    const emailSent = await resendVerification(user.id, email, first_name)

    // Build response with code confirmation if applicable
    const codeApplied = validatedCode ? {
      codeApplied: true,
      code: validatedCode.code,
      codeType: validatedCode.type,
      codeDiscount: validatedCode.discount,
    } : { codeApplied: false }

    // ── Create Stripe customer + setup session ─────────────────────────────
    let setupUrl: string | null = null
    try {
      const brand = getBrand()
      const customerName = `${first_name} ${last_name}`.trim() || undefined

      // Find or create Stripe customer
      let stripeCustomerId: string | undefined
      const existingList = await stripe.customers.list({ email, limit: 1 })
      if (existingList.data[0]?.id) {
        stripeCustomerId = existingList.data[0].id
      } else {
        const customer = await stripe.customers.create({
          email,
          name: customerName,
          metadata: { user_id: user.id },
        })
        stripeCustomerId = customer.id
      }

      // Save customer ID to user record
      await prisma.users.update({
        where: { id: user.id },
        data: { stripe_customer_id: stripeCustomerId },
      })

      // Create a Checkout Session in setup mode to collect payment method
      const setupSession = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'setup',
        payment_method_types: ['card'],
        success_url: `${brand.appUrl}/signup?setup=done&email=${encodeURIComponent(email)}`,
        cancel_url: `${brand.appUrl}/signup?setup=skip&email=${encodeURIComponent(email)}`,
        metadata: { user_id: user.id, email },
      })
      setupUrl = setupSession.url
    } catch (stripeErr) {
      // Non-fatal — signup still succeeds, payment can be added later
      console.warn('⚠️ Stripe setup session creation failed during signup:', stripeErr)
    }

    if (!emailSent) {
      return NextResponse.json(
        {
          success: true,
          emailSent: false,
          warning: 'EMAIL_SEND_FAILED',
          message: 'Account created but verification email failed to send. Contact support.',
          user_id: user.id,
          setupUrl,
          ...codeApplied,
        },
        { status: 201 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        emailSent: true,
        message: validatedCode 
          ? `Account created with code ${validatedCode.code} applied! Check your inbox to verify your email.`
          : 'Account created! Check your inbox to verify your email and start your free trial.',
        user_id: user.id,
        setupUrl,
        ...codeApplied,
      },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('❌ Signup error:', err)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}

// ─── helper: create token + send email ────────────────────────────────────────

async function resolveTrialDaysForCode(offerCode: string | null | undefined): Promise<number> {
  const code = String(offerCode || '').toUpperCase().trim()
  if (!code) return 7
  const offer = await prisma.offer_codes.findFirst({
    where: { code, active: true },
    select: { type: true, trial_days: true, discount: true, description: true, expires_at: true, max_usage: true, usage_count: true },
  })
  if (!offer) return 7
  if (offer.expires_at && new Date(offer.expires_at) < new Date()) return 7
  if (offer.max_usage && offer.usage_count >= offer.max_usage) return 7
  if (String(offer.type || '').toLowerCase() !== 'trial') return 7
  if (offer.trial_days != null) return Math.min(365, Math.max(1, Math.round(offer.trial_days)))
  const match = String(offer.discount || offer.description || '').match(/(\d{1,3})/)
  return match ? Math.min(365, Math.max(1, parseInt(match[1], 10))) : 7
}

async function resendVerification(
  userId: string,
  email: string,
  firstName: string
): Promise<boolean> {
  try {
    // Delete any existing tokens for this user
    await prisma.email_verification_tokens.deleteMany({ where: { user_id: userId } })

    const rawToken  = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.email_verification_tokens.create({
      data: {
        id:         crypto.randomUUID(),
        user_id:    userId,
        token_hash: tokenHash,
        expires_at: expiresAt,
        created_at: new Date(),
      },
    })

    // Look up offer code to show the correct trial duration in the email
    const userRow = await prisma.users.findUnique({
      where: { id: userId },
      select: { offer_code: true },
    }).catch(() => null)
    const trialDays = await resolveTrialDaysForCode(userRow?.offer_code)

    const brand      = getBrand()
    const verifyUrl  = `${brand.appUrl}/api/auth/verify-email?token=${rawToken}`
    const name       = firstName || 'there'

    const html = buildVerificationEmail(name, verifyUrl, trialDays)
    const text = `Hi ${name},\n\nVerify your email and start your ${trialDays}-day free trial:\n${verifyUrl}\n\nLink expires in 24 hours.`

    await sendEmail({
      to:      email,
      subject: `Verify Your Email – ${brand.name}`,
      html,
      text,
    })

    console.log('✅ Verification email sent to:', email)
    return true
  } catch (err: any) {
    console.error('❌ Verification email error:', err.message)
    return false
  }
}

function buildVerificationEmail(name: string, verifyUrl: string, trialDays = 7): string {
  const brand = getBrand()
  return `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 20px;">
      <table width="600" cellpadding="0" cellspacing="0"
             style="background:#ffffff;border-radius:16px;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
        <tr>
          <td style="padding:40px 40px 24px;background:linear-gradient(135deg,#0f172a,#1e293b);
                     border-radius:16px 16px 0 0;text-align:center;">
            <img src="${brand.logoUrl}" alt="${brand.name}"
                 style="max-width:200px;height:auto;display:block;margin:0 auto 12px;border:0;" />
            <p style="margin:0;color:#cbd5e1;font-size:11px;font-weight:600;letter-spacing:0.05em;">
              ${brand.tagline}
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 8px;color:#1e293b;font-size:16px;font-weight:700;">Hi ${name},</p>
            <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">
              You're one click away from activating your <strong>${trialDays}-day free trial</strong>.<br>
              Verify your email to get instant access.
            </p>
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td align="center" style="padding:16px 0 32px;">
                <a href="${verifyUrl}"
                   style="display:inline-block;padding:16px 48px;background:#059669;
                          color:#ffffff;text-decoration:none;font-weight:900;font-size:16px;
                          border-radius:12px;letter-spacing:0.02em;">
                  Verify Email &amp; Start Free Trial →
                </a>
              </td></tr>
            </table>
            <p style="margin:0 0 8px;color:#64748b;font-size:13px;">Or paste this link in your browser:</p>
            <p style="margin:0 0 24px;padding:12px;background:#f1f5f9;border-radius:8px;
                      color:#334155;font-size:12px;word-break:break-all;font-family:monospace;">
              ${verifyUrl}
            </p>
            <p style="margin:0;color:#94a3b8;font-size:13px;">
              This link expires in 24 hours. If you didn't sign up, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 40px;background:#f8fafc;border-radius:0 0 16px 16px;text-align:center;">
            <p style="margin:0;color:#94a3b8;font-size:12px;">
              © ${new Date().getFullYear()} Precise GovCon LLC · Richmond, Virginia
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}
