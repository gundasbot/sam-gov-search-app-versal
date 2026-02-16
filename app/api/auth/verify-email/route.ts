// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/email/verification'
import { sendWelcomeEmail } from '@/lib/email/welcome'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// Helper to create a session token
async function createSessionToken(userId: string, email: string) {
  const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret')
  
  const token = await new SignJWT({ userId, email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret)
  
  return token
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/?mode=login&error=invalid-token', req.url))
  }

  try {
    const result = await verifyEmailToken(token)

    if (!result.success) {
      const errorMsg = encodeURIComponent(result.error || 'verification-failed')
      return NextResponse.redirect(new URL(`/?mode=login&error=${errorMsg}`, req.url))
    }

    if (result.alreadyVerified) {
      // Already verified - just redirect to login
      return NextResponse.redirect(new URL('/?mode=login&message=already-verified', req.url))
    }

    // ✅ VERIFIED! Now set up success state
    const user = result.user!
    
    // Send welcome email only if using verified domain
    if (process.env.RESEND_FROM_EMAIL?.includes('@precisegovcon.com')) {
      try {
        await sendWelcomeEmail(user.email, user.name || 'there')
        console.log('✅ Welcome email sent to', user.email)
      } catch (emailError) {
        console.error('❌ Failed to send welcome email (non-blocking):', emailError)
      }
    } else {
      console.log('ℹ️ Skipping welcome email - using test domain (@resend.dev)')
    }

    // Redirect to success page with pre-filled email
    const email = encodeURIComponent(user.email)
    const name = encodeURIComponent(user.name || 'there')
    
    return NextResponse.redirect(
      new URL(`/?mode=login&verified=true&email=${email}&name=${name}`, req.url)
    )

  } catch (error) {
    console.error('❌ Email verification error:', error)
    return NextResponse.redirect(new URL('/?mode=login&error=verification-failed', req.url))
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    const result = await verifyEmailToken(token)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Verification failed' }, { status: 400 })
    }

    // Send welcome email only if using verified domain
    if (!result.alreadyVerified && result.user && process.env.RESEND_FROM_EMAIL?.includes('@precisegovcon.com')) {
      try {
        await sendWelcomeEmail(result.user.email, result.user.name || 'there')
      } catch (emailError) {
        console.error('❌ Failed to send welcome email (non-blocking):', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      message: result.alreadyVerified ? 'Email already verified' : 'Email verified successfully! Please sign in to start your trial.',
      alreadyVerified: result.alreadyVerified,
      trialActivated: result.trialActivated,
      trial: result.trial,
      user: result.user,
    })

  } catch (error: any) {
    console.error('❌ Email verification error:', error)
    return NextResponse.json({ error: 'Failed to verify email.' }, { status: 500 })
  }
}