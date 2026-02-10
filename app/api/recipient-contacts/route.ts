//app/api/recipient-contacts/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const createContactSchema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
  organization: z.string().optional(),
  notes: z.string().optional(),
})

// GET all contacts for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const contacts = await prisma.recipientContact.findMany({
      where: { userId: user.id },
      orderBy: [
        { useCount: 'desc' },
        { lastUsedAt: 'desc' },
        { email: 'asc' },
      ],
    })

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

// POST new contact
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const validated = createContactSchema.parse(body)

    // Check for duplicate
    const existing = await prisma.recipientContact.findUnique({
      where: {
        userId_email: {
          userId: user.id,
          email: validated.email,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Contact already exists' },
        { status: 409 }
      )
    }

    const contact = await prisma.recipientContact.create({
      data: {
        userId: user.id,
        email: validated.email,
        name: validated.name,
        organization: validated.organization,
        notes: validated.notes,
      },
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 400 })
    }
    console.error('Error creating contact:', error)
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    )
  }
}