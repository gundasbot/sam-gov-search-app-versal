import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

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
    const currentPassword = String(body?.currentPassword || '')

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required to disable 2FA' }, { status: 400 })
    }

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, password_hash: true, two_factor_enabled: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (!user.two_factor_enabled) return NextResponse.json({ enabled: false })
    if (!user.password_hash) {
      return NextResponse.json(
        { error: 'Password login is not enabled for this account' },
        { status: 400 }
      )
    }

    const ok = await bcrypt.compare(currentPassword, user.password_hash)
    if (!ok) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    await prisma.$transaction([
      prisma.users.update({
        where: { id: user.id },
        data: {
          two_factor_enabled: false,
          two_factor_secret: null,
          updated_at: new Date(),
        },
      }),
      prisma.two_factor_backup_codes.deleteMany({ where: { user_id: user.id } }),
    ])

    return NextResponse.json({ enabled: false, method: 'authenticator_app' })
  } catch (error: unknown) {
    return NextResponse.json(
      { error: 'Failed to disable 2FA', details: errorMessage(error) },
      { status: 500 }
    )
  }
}
