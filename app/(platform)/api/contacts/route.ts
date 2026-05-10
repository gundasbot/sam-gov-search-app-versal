// app/api/contacts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// GET /api/contacts - List all contacts for user
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = req.nextUrl.searchParams
    const query = searchParams.get('q')?.toLowerCase().trim() // Search by name/email

    let where: any = { user_id: session.user.id }

    if (query) {
      where = {
        user_id: session.user.id,
        OR: [
          { email: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          { organization: { contains: query, mode: 'insensitive' } },
        ],
      }
    }

    const contacts = await prisma.recipient_contacts.findMany({
      where,
      orderBy: { use_count: 'desc' }, // Most used first
      select: {
        id: true,
        email: true,
        name: true,
        organization: true,
        notes: true,
        use_count: true,
        last_used_at: true,
        created_at: true,
      },
    })

    return NextResponse.json({
      contacts,
      total: contacts.length,
    })
  } catch (error) {
    console.error('Error fetching contacts:', error)
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
  }
}

// POST /api/contacts - Create or add contact
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Validation
    if (!body.email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const email = body.email.toLowerCase().trim()

    // Email format validation
    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Check if contact already exists for this user
    const existing = await prisma.recipient_contacts.findUnique({
      where: {
        user_id_email: {
          user_id: session.user.id,
          email,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Contact already exists', contact: existing },
        { status: 409 }
      )
    }

    // Create new contact
    const contact = await prisma.recipient_contacts.create({
      data: {
        id: randomBytes(12).toString('hex'),
        user_id: session.user.id,
        email,
        name: body.name?.trim() || email.split('@')[0],
        organization: body.organization?.trim() || null,
        notes: body.notes?.trim() || null,
        use_count: 0,
        last_used_at: null,
        created_at: new Date(),
        updated_at: new Date(),
      },
    })

    return NextResponse.json({ contact }, { status: 201 })
  } catch (error) {
    console.error('Error creating contact:', error)
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
  }
}
