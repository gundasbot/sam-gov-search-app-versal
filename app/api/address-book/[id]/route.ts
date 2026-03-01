import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const contact = await prisma.recipient_contacts.findFirst({
      where: { id, user_id: user.id },
    })
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    const body = await req.json()
    const { email, firstName, lastName, phone, organization, notes } = body

    // If email is changing, check for duplicate
    if (email && email.trim() !== contact.email) {
      const duplicate = await prisma.recipient_contacts.findFirst({
        where: { user_id: user.id, email: email.trim(), NOT: { id } },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'A contact with this email already exists in your address book' },
          { status: 409 }
        )
      }
    }

    const updatedFirstName = firstName !== undefined ? (firstName?.trim() || null) : contact.first_name
    const updatedLastName  = lastName  !== undefined ? (lastName?.trim()  || null) : contact.last_name

    const updated = await prisma.recipient_contacts.update({
      where: { id },
      data: {
        ...(email        !== undefined && { email:        email.trim() }),
        first_name: updatedFirstName,
        last_name:  updatedLastName,
        // keep combined name in sync
        name: [updatedFirstName, updatedLastName].filter(Boolean).join(' ') || contact.name || null,
        ...(phone        !== undefined && { phone:        phone?.trim()        || null }),
        ...(organization !== undefined && { organization: organization?.trim() || null }),
        ...(notes        !== undefined && { notes:        notes?.trim()        || null }),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({
      id:           updated.id,
      email:        updated.email,
      firstName:    updated.first_name ?? null,
      lastName:     updated.last_name  ?? null,
      name:         updated.name       ?? null,
      phone:        updated.phone      ?? null,
      organization: updated.organization ?? null,
      notes:        updated.notes      ?? null,
      useCount:     updated.use_count,
      lastUsedAt:   updated.last_used_at?.toISOString() ?? null,
      createdAt:    updated.created_at.toISOString(),
    })
  } catch (error) {
    console.error('[address-book PATCH]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const contact = await prisma.recipient_contacts.findFirst({
      where: { id, user_id: user.id },
    })
    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    await prisma.recipient_contacts.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[address-book DELETE]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
