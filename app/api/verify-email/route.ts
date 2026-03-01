// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/email/verification'

export const dynamic = 'force-dynamic'

// Handle GET requests (email link clicks)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token')
  
  if (!token) {
    return NextResponse.redirect(
      new URL('/auth/signin?error=invalid-token', req.url)
    )
  }

  try {
    const result = await verifyEmailToken(token)

    if (!result.success) {
      return NextResponse.redirect(
        new URL(`/auth/signin?error=${encodeURIComponent(result.error || 'verification-failed')}`, req.url)
      )
    }

    // Success - redirect to signin with success message
    if (result.alreadyVerified) {
      return NextResponse.redirect(
        new URL('/auth/signin?verified=already', req.url)
      )
    }

    // New verification - trial activated!
    return NextResponse.redirect(
      new URL('/auth/signin?verified=true&trial=started', req.url)
    )

  } catch (error) {
    console.error('❌ Email verification error:', error)
    return NextResponse.redirect(
      new URL('/auth/signin?error=verification-failed', req.url)
    )
  }
}

// Handle POST requests (from the login page verification mode)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { token } = body

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    const result = await verifyEmailToken(token)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Verification failed' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: result.alreadyVerified 
        ? 'Email already verified' 
        : 'Email verified successfully! Your trial is now active.',
      alreadyVerified: result.alreadyVerified,
      trialActivated: result.trialActivated,
      trial: result.trial,
    })

  } catch (error: any) {
    console.error('❌ Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    )
  }
}