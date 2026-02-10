import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

export const runtime = 'nodejs'

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined
}

const prisma = global.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') global.prisma = prisma

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (typeof newPassword !== 'string' || newPassword.length < 8) {
      return NextResponse.json(
        { error: 'New password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // Get user with password_hash (NOT password!)
    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        password_hash: true,
      },
    })

    if (!user || !user.password_hash) {
      return NextResponse.json({ error: 'User not found or no password set' }, { status: 404 })
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash)

    if (!isPasswordValid) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 })
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Update password_hash (NOT password!)
    await prisma.users.update({
      where: { email },
      data: {
        password_hash: hashedPassword,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    })
  } catch (error: any) {
    console.error('Password change error:', error)
    return NextResponse.json(
      {
        error: 'Failed to change password',
        details: error?.message ?? String(error),
      },
      { status: 500 }
    )
  }
}
