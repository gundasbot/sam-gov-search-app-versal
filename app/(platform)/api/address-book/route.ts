// app/api/address-book/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

type RecipientContactRecord = {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  name: string | null
  phone: string | null
  organization: string | null
  notes: string | null
  use_count: number
  last_used_at: Date | null
  created_at: Date
}

function mapContact(c: RecipientContactRecord) {
  return {
    id: c.id,
    email: c.email,
    firstName: c.first_name ?? null,
    lastName: c.last_name ?? null,
    // legacy fallback: if first/last are empty, split the old `name` field
    name: c.name ?? null,
    phone: c.phone ?? null,
    organization: c.organization ?? null,
    notes: c.notes ?? null,
    useCount: c.use_count,
    lastUsedAt: c.last_used_at?.toISOString() ?? null,
    createdAt: c.created_at.toISOString(),
  }
}

export async function GET() {
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

    const contacts = await prisma.recipient_contacts.findMany({
      where: { user_id: user.id },
      orderBy: [{ use_count: 'desc' }, { created_at: 'desc' }],
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        name: true,
        phone: true,
        organization: true,
        notes: true,
        use_count: true,
        last_used_at: true,
        created_at: true,
      },
    })

    return NextResponse.json(contacts.map(mapContact))
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
    const { email, firstName, lastName, phone, organization, notes } = body

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

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
        id: randomBytes(12).toString('hex'),
        user_id: user.id,
        email: email.trim(),
        first_name: firstName?.trim() || null,
        last_name: lastName?.trim() || null,
        // keep name as combined for legacy compatibility
        name: [firstName?.trim(), lastName?.trim()].filter(Boolean).join(' ') || null,
        phone: phone?.trim() || null,
        organization: organization?.trim() || null,
        notes: notes?.trim() || null,
        use_count: 0,
        updated_at: new Date(),
      },
    })

    return NextResponse.json(mapContact(contact), { status: 201 })
  } catch (error) {
    console.error('[address-book POST]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
