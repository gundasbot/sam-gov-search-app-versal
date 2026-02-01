// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createVerificationToken, sendVerificationEmail } from '@/lib/email/verification'

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json()

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: hashedPassword, // Changed from 'password' to 'passwordHash'
        emailVerified: null,
        isActive: true, // Set user as active
        // Optionally set other fields:
        // planStatus: 'TRIALING', // or 'INACTIVE'
        // planTier: 'FREE',
        // trialActive: true,
        // trialStartedAt: new Date(),
        // trialExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    })

    const token = await createVerificationToken(user.id, email)
    await sendVerificationEmail(email, name, token)

    return NextResponse.json({
      success: true,
      message: 'Account created! Please check your email.',
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}