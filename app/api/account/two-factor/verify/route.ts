import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { enableTwoFactor } from '@/lib/auth/two-factor'

export const runtime = 'nodejs'

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const token = String(body?.token || '').trim()
    if (!token) {
      return NextResponse.json({ error: 'Verification code is required' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const result = await enableTwoFactor(user.id, token)

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Invalid verification code' }, { status: 400 })
    }

    return NextResponse.json({
      enabled: true,
      method: 'authenticator_app',
      backupCodes: result.backupCodes || [],
      message: '2FA enabled successfully.',
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to verify 2FA setup', details: errorMessage(error) },
      { status: 500 }
    )
  }
}
