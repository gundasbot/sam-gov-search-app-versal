import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { two_factor_enabled: true, two_factor_secret: true },
    })

    return NextResponse.json({
      enabled: Boolean(user?.two_factor_enabled),
      hasPendingSetup: Boolean(user?.two_factor_secret && !user?.two_factor_enabled),
      method: 'authenticator_app',
    })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to load 2FA settings', details: errorMessage(error) },
      { status: 500 }
    )
  }
}
