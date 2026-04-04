import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateTwoFactorSecret } from '@/lib/auth/two-factor'

export const runtime = 'nodejs'

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function POST() {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, two_factor_enabled: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (user.two_factor_enabled) {
      return NextResponse.json({ error: '2FA is already enabled for this account' }, { status: 400 })
    }

    const setup = await generateTwoFactorSecret(user.id, user.email)

    return NextResponse.json({
      method: 'authenticator_app',
      qrCode: setup.qrCode,
      secret: setup.secret,
      otpauth: setup.otpauth,
      message: 'Scan this QR code in your authenticator app and enter the 6-digit code to verify.',
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to start 2FA setup', details: errorMessage(error) },
      { status: 500 }
    )
  }
}
