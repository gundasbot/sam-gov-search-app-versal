// app/api/admin/promote/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This route is protected by a secret admin key
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, adminSecret } = body

    // Check admin secret (set this in your .env)
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find and update user
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Update user to admin
    const updatedUser = await prisma.users.update({
      where: { email: email.toLowerCase() },
      data: { role: 'admin' }
    })

    return NextResponse.json({
      message: 'User promoted to admin successfully', users: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role
      }
    })
  } catch (error) {
    console.error('Error promoting user to admin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
