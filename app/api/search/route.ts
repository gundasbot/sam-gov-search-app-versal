import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma' // You'll need to set up Prisma

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, password, phone, company } = body

    // Validation
    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hash(password, 12)

    // Create user
    const user = await prisma.users.create({
      data: {
        name: `${firstName} ${lastName}`,
        email: email.toLowerCase(),
        passwordHash: hashedPassword,
      }
    })

    // Don't return password in response
    const { passwordHash: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: 'User created successfully', users: userWithoutPassword
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}