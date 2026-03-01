// app/api/contacts/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET /api/contacts/[id] - Get single contact
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contact = await prisma.recipient_contacts.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
      select: {
        id: true,
        email: true,
        name: true,
        organization: true,
        notes: true,
        use_count: true,
        last_used_at: true,
        created_at: true,
        updated_at: true,
      },
    })

    if (!contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({ contact })
  } catch (error) {
    console.error('Error fetching contact:', error)
    return NextResponse.json({ error: 'Failed to fetch contact' }, { status: 500 })
  }
}

// PATCH /api/contacts/[id] - Update contact
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Verify ownership
    const existing = await prisma.recipient_contacts.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Validate email if provided
    if (body.email !== undefined) {
      const email = body.email.toLowerCase().trim()
      if (!EMAIL_REGEX.test(email)) {
        return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
      }

      // Check if new email already exists (for different contact)
      const duplicate = await prisma.recipient_contacts.findFirst({
        where: {
          user_id: session.user.id,
          email,
          id: { not: id },
        },
      })

      if (duplicate) {
        return NextResponse.json(
          { error: 'Email already in use by another contact' },
          { status: 409 }
        )
      }
    }

    // Build update data
    const updateData: any = {}
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.email !== undefined) updateData.email = body.email.toLowerCase().trim()
    if (body.organization !== undefined) updateData.organization = body.organization?.trim() || null
    if (body.notes !== undefined) updateData.notes = body.notes?.trim() || null
    updateData.updated_at = new Date()

    const updated = await prisma.recipient_contacts.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        organization: true,
        notes: true,
        use_count: true,
        last_used_at: true,
        created_at: true,
        updated_at: true,
      },
    })

    return NextResponse.json({ contact: updated })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 })
  }
}

// DELETE /api/contacts/[id] - Delete contact
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const existing = await prisma.recipient_contacts.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    // Delete contact
    await prisma.recipient_contacts.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Contact deleted' })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 })
  }
}
