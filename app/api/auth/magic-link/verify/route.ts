// app/api/auth/magic-link/verify/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export const runtime = 'nodejs'

function sha256(s: string) {
  return crypto.createHash('sha256').update(s).digest('hex')
}

// GET /api/auth/magic-link/verify?token=xxx
// Called when user clicks the email link — signs them in and redirects
export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://precisegovcon.com'
  const errorUrl = `${baseUrl}/login?error=invalid-link`

  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return NextResponse.redirect(errorUrl)

    const tokenHash = sha256(token)
    const now = new Date()

    // Find valid token
    const tokenRow = await prisma.auto_login_tokens.findFirst({
      where: {
        token_hash: tokenHash,
        used_at: null,
        expires_at: { gt: now },
      },
      select: { id: true, user_id: true },
    })

    if (!tokenRow) {
      return NextResponse.redirect(`${baseUrl}/login?error=expired-link`)
    }

    // Mark used
    await prisma.auto_login_tokens.update({
      where: { id: tokenRow.id },
      data: { used_at: now },
    })

    // Get user
    const user = await prisma.users.findUnique({
      where: { id: tokenRow.user_id },
      select: { id: true, email: true, is_suspended: true },
    })

    if (!user || user.is_suspended) {
      return NextResponse.redirect(errorUrl)
    }

    // Generate a short-lived autoLoginToken and redirect to login page
    // The login page will auto-submit it via signIn('credentials', { autoLoginToken })
    const autoToken = crypto.randomBytes(32).toString('hex')
    const autoHash = sha256(autoToken)

    await prisma.auto_login_tokens.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        token_hash: autoHash,
        expires_at: new Date(Date.now() + 2 * 60 * 1000), // 2 min to use
      },
    })

    // Redirect to a page that auto-completes sign-in
    return NextResponse.redirect(
      `${baseUrl}/auth/magic-signin?token=${autoToken}&email=${encodeURIComponent(user.email)}`
    )
  } catch (err: any) {
    console.error('magic-link verify error:', err)
    return NextResponse.redirect(errorUrl)
  }
}
