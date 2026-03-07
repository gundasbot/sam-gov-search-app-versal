// lib/email/verification.ts
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { getVerificationEmailHtml, getVerificationEmailText } from '@/lib/email/verification-email'
import { getBrand } from './brand'
import { randomBytes } from 'crypto'

export async function createVerificationToken(userId: string, email: string) {
  const token = crypto.randomBytes(32).toString('hex')
  const token_hash = crypto.createHash('sha256').update(token).digest('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)

  await prisma.email_verification_tokens.create({
    data: {
      id: randomBytes(12).toString('hex'),
      user_id: userId,
      token_hash,
      expires_at: expires,
    },
  })

  return token
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const brand = getBrand()
  const verificationUrl = `${brand.appUrl}/api/auth/verify-email?token=${token}`

  const html = getVerificationEmailHtml({
    first_name: name.split(' ')[0],
    verificationUrl,
  })

  const text = getVerificationEmailText({
    first_name: name.split(' ')[0],
    verificationUrl,
  })

  await sendEmail({
    to: email,
    subject: `Verify Your Email - ${brand.name}`,
    html,
    text,
  })
}

// ✨ UPDATED: Now activates trial after email verification
export async function verifyEmailToken(token: string) {
  const token_hash = crypto.createHash('sha256').update(token).digest('hex')

  const verificationToken = await prisma.email_verification_tokens.findUnique({
    where: { token_hash },
  })

  if (!verificationToken) {
    return { success: false, error: 'Invalid verification token' }
  }

  if (new Date() > verificationToken.expires_at) {
    return { success: false, error: 'This verification link has expired' }
  }

  const user = await prisma.users.findUnique({
    where: { id: verificationToken.user_id },
  })

  if (!user) {
    return { success: false, error: 'User not found' }
  }

  // Check if already verified
  if (user.email_verified) {
    await prisma.email_verification_tokens.delete({
      where: { token_hash },
    })
    return {
      success: true,
      alreadyVerified: true,
      trialActivated: false,
      user: { id: user.id, email: user.email, name: user.name },
    }
  }

  const now = new Date()

  // 🎯 Calculate trial dates (7 days from now)
  const trialExpiresAt = new Date(now)
  trialExpiresAt.setDate(trialExpiresAt.getDate() + 7)
  trialExpiresAt.setHours(23, 59, 59, 999) // End of day

  const trialEndsAt = new Date(trialExpiresAt) // Compatibility field

  console.log('✅ [VERIFY] Activating trial for:', user.email)
  console.log('📅 [VERIFY] Trial expires:', trialExpiresAt.toISOString())
  console.log('📋 [VERIFY] Plan tier:', user.plan_tier)
  console.log('💳 [VERIFY] Billing interval:', user.billing_interval)

  // 🎯 Verify email AND activate trial in one transaction
  await prisma.$transaction([
    prisma.users.update({
      where: { id: verificationToken.user_id },
      data: {
        email_verified: now,            // ✅ Email verified
        plan_status: 'trialing',          // ✅ Set status to trialing
        trial_active: true,              // ✅ Trial is active
        trial_started_at: now,           // ✅ Mark start time
        trial_expires_at: trialExpiresAt, // ✅ Set expiration
        trial_ends_at: trialEndsAt,      // ✅ Compatibility field
        is_active: true,                 // ✅ Account is active
        updated_at: now,
      },
    }),
    prisma.email_verification_tokens.delete({
      where: { token_hash },
    }),
  ])

  console.log('✅ [VERIFY] Email verified & trial activated successfully')

  // Send welcome email (non-blocking — don't fail verification if email fails)
  try {
    const { sendWelcomeEmail } = await import('@/lib/email/welcome')
    await sendWelcomeEmail(user.email, user.name || user.first_name || 'there')
    console.log('✅ [VERIFY] Welcome email sent to', user.email)
  } catch (emailErr) {
    console.error('❌ [VERIFY] Welcome email failed (non-blocking):', emailErr)
  }

  return {
    success: true,
    alreadyVerified: false,
    trialActivated: true,
    user: { id: user.id, email: user.email, name: user.name },
    trial: {
      tier: user.plan_tier,
      interval: user.billing_interval,
      expiresAt: trialExpiresAt.toISOString(),
    },
  }
}
