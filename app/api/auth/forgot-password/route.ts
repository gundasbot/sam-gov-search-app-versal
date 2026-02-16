// app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyEmailToken } from '@/lib/email/verification'

export const dynamic = 'force-dynamic'

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
      return NextResponse.redirect(new URL('/?mode=login&verified=already', req.url))
    }

    return NextResponse.redirect(new URL('/?mode=login&verified=true&trial=started', req.url))

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
    return NextResponse.json({ error: 'Failed to verify email. Please try again.' }, { status: 500 })
  }
}