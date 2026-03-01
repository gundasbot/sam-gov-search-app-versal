// app/api/address-book/route.ts
// Place this file at: app/api/address-book/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Look up the user record to get the user.id (schema uses user_id, not email)
    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const contacts = await prisma.recipient_contacts.findMany({
      where: { user_id: user.id },
      orderBy: [
        { use_count: 'desc' },
        { created_at: 'desc' },
      ],
    })

    // Normalize field names for the frontend (camelCase)
    const normalized = contacts.map(c => ({
      id: c.id,
      email: c.email,
      name: c.name,
      organization: c.organization,
      notes: c.notes,
      useCount: c.use_count,
      lastUsedAt: c.last_used_at?.toISOString() ?? null,
      createdAt: c.created_at.toISOString(),
    }))

    return NextResponse.json(normalized)
  } catch (error) {
    console.error('[address-book GET]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.users.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const { email, name, organization, notes } = body

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Check for duplicate email for this user
    const existing = await prisma.recipient_contacts.findFirst({
      where: { user_id: user.id, email: email.trim() },
    })
    if (existing) {
      return NextResponse.json(
        { error: 'A contact with this email already exists in your address book' },
        { status: 409 }
      )
    }

    const contact = await prisma.recipient_contacts.create({
      data: {
        id: crypto.randomUUID(),
        user_id: user.id,
        email: email.trim(),
        name: name?.trim() || null,
        organization: organization?.trim() || null,
        notes: notes?.trim() || null,
        use_count: 0,
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      id: contact.id,
      email: contact.email,
      name: contact.name,
      organization: contact.organization,
      notes: contact.notes,
      useCount: contact.use_count,
      lastUsedAt: contact.last_used_at?.toISOString() ?? null,
      createdAt: contact.created_at.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error('[address-book POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}