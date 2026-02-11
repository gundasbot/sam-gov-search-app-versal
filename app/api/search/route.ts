import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

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

    // Create user with all required fields based on your schema
    const user = await prisma.users.create({
      data: {
        id: randomBytes(16).toString('hex'),
        first_name: firstName,
        last_name: lastName,
        email: email.toLowerCase(),
        password_hash: hashedPassword,
        phone: phone || null,
        company: company || null,
        created_at: new Date(),
        updated_at: new Date(),
        // These might also be required based on your schema
        name: `${firstName} ${lastName}`, // Some schemas have both name and first/last
        trial_active: true,
        trial_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        plan_status: 'trial',
      }
    })

    // Don't return password in response
    const { password_hash: _, ...userWithoutPassword } = user

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: userWithoutPassword
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
