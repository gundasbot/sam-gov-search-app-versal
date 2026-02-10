// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

const TRIAL_DAYS = 7

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function addDays(from: Date, days: number) {
  const x = new Date(from)
  x.setDate(x.getDate() + days)
  return x
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      const errorUrl = new URL('/verify-email', req.url)
      errorUrl.searchParams.set('status', 'error')
      errorUrl.searchParams.set('message', 'Missing verification token')
      return NextResponse.redirect(errorUrl)
    }

    const tokenHash = sha256Hex(token)
    const now = new Date()

    const tokenRecord = await prisma.emailVerificationToken.findFirst({
      where: {
        tokenHash,
        expiresAt: { gt: now },
      },
      include: {
        user: true,
      },
    })

    if (!tokenRecord) {
      const errorUrl = new URL('/verify-email', req.url)
      errorUrl.searchParams.set('status', 'error')
      errorUrl.searchParams.set('message', 'Verification link expired or invalid')
      return NextResponse.redirect(errorUrl)
    }

    const user = tokenRecord.user
    const isFirstTimeVerification = !user.emailVerified

    // Already verified â€” just issue an auto-login token
    if (user.emailVerified) {
      const autoLoginToken = crypto.randomBytes(32).toString('hex')
      const autoLoginHash = sha256Hex(autoLoginToken)
      const autoLoginExpiry = new Date(Date.now() + 30 * 60 * 1000)

      await prisma.auto_login_tokens.create({
        data: {
          id: crypto.randomUUID(),
          user_id: user.id,
          token_hash: autoLoginHash,
          expires_at: autoLoginExpiry,
          used_at: null,
        },
      })

      await prisma.emailVerificationToken.delete({
        where: { id: tokenRecord.id },
      })

      console.log(`âœ… Already verified user ${user.email} - Auto-login token created`)

      const successUrl = new URL('/verify-email', req.url)
      successUrl.searchParams.set('status', 'success')
      successUrl.searchParams.set('autoLogin', autoLoginToken)
      successUrl.searchParams.set('welcome', 'false')
      return NextResponse.redirect(successUrl)
    }

    // First time â€” verify email + start trial
    const trialExpires = endOfDay(addDays(now, TRIAL_DAYS))

    await prisma.users.update({
      where: { id: user.id },
      data: {
        emailVerified: now,
        trial_active: true,
        trialStartedAt: now,
        trial_expires_at: trialExpires,
        trial_ends_at: trialExpires,
        plan: 'BASIC',
        plan_tier: 'BASIC',
        plan_status: 'trialing',
        isActive: true,
      },
    })

    await prisma.emailVerificationToken.delete({
      where: { id: tokenRecord.id },
    })

    const autoLoginToken = crypto.randomBytes(32).toString('hex')
    const autoLoginHash = sha256Hex(autoLoginToken)
    const autoLoginExpiry = new Date(Date.now() + 30 * 60 * 1000)

    await prisma.auto_login_tokens.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        token_hash: autoLoginHash,
        expires_at: autoLoginExpiry,
        used_at: null,
      },
    })

    console.log(`âœ… Email verified for ${user.email} - Trial started - Auto-login token created`)

    const successUrl = new URL('/verify-email', req.url)
    successUrl.searchParams.set('status', 'success')
    successUrl.searchParams.set('autoLogin', autoLoginToken)
    successUrl.searchParams.set('welcome', 'true')
    return NextResponse.redirect(successUrl)
    
  } catch (error: any) {
    console.error('âŒ Email verification error:', error)
    const errorUrl = new URL('/verify-email', req.url)
    errorUrl.searchParams.set('status', 'error')
    errorUrl.searchParams.set('message', 'Verification failed. Please try again.')
    return NextResponse.redirect(errorUrl)
  }
}
