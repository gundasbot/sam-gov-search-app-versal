import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

type RecipientContactUpdate = {
  updated_at: Date
  email?: string
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  phone?: string | null
  organization?: string | null
  notes?: string | null
}

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
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        name: true,
      },
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

    // Prepare update data
    const updateData: RecipientContactUpdate = {
      updated_at: new Date(),
    }

    if (email !== undefined) {
      updateData.email = email.trim()
    }

    if (firstName !== undefined) {
      updateData.first_name = firstName?.trim() || null
    }

    if (lastName !== undefined) {
      updateData.last_name = lastName?.trim() || null
    }

    // Update the combined name field for backward compatibility
    if (firstName !== undefined || lastName !== undefined) {
      const newFirstName = firstName !== undefined ? (firstName?.trim() || null) : contact.first_name
      const newLastName = lastName !== undefined ? (lastName?.trim() || null) : contact.last_name
      updateData.name = [newFirstName, newLastName].filter(Boolean).join(' ') || null
    }

    if (phone !== undefined) {
      updateData.phone = phone?.trim() || null
    }

    if (organization !== undefined) {
      updateData.organization = organization?.trim() || null
    }

    if (notes !== undefined) {
      updateData.notes = notes?.trim() || null
    }

    const updated = await prisma.recipient_contacts.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({
      id: updated.id,
      email: updated.email,
      firstName: updated.first_name ?? null,
      lastName: updated.last_name ?? null,
      name: updated.name ?? null,
      phone: updated.phone ?? null,
      organization: updated.organization ?? null,
      notes: updated.notes ?? null,
      useCount: updated.use_count,
      lastUsedAt: updated.last_used_at?.toISOString() ?? null,
      createdAt: updated.created_at.toISOString(),
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
      select: { id: true },
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