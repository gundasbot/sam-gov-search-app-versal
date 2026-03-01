// app/api/account/profile/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type ProfilePayload = {
  email?: string
  first_name?: string
  last_name?: string
  phone?: string
  company?: string
  title?: string
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
}

function pickString(v: any): string | null {
  if (v === undefined || v === null) return null
  if (typeof v !== 'string') return null
  const s = v.trim()
  return s.length ? s : null
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const email = session.user.email

    const user = await prisma.users.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        email_verified: true,

        first_name: true,
        last_name: true,
        phone: true,
        phone_verified: true,

        company: true,
        title: true,

        address_line1: true,
        address_line2: true,
        city: true,
        state: true,
        postal_code: true,
        country: true,

        updated_at: true,
        created_at: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Return FLAT shape (matches your /account page.tsx usage: setProfile({ ...profile, ...profileData }))
    return NextResponse.json({
      id: user.id,
      email: user.email,
      email_verified: !!user.email_verified,

      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      phone_verified: !!user.phone_verified,

      company: user.company || '',
      title: user.title || '',

      address_line1: user.address_line1 || '',
      address_line2: user.address_line2 || '',
      city: user.city || '',
      state: user.state || '',
      postal_code: user.postal_code || '',
      country: user.country || 'United States',

      created_at: user.created_at,
      updated_at: user.updated_at,
    })
  } catch (error: any) {
    console.error('Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile', details: error?.message },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionEmail = session.user.email

    const body = (await request.json().catch(() => ({}))) as ProfilePayload

    // IMPORTANT:
    // Your UI currently allows editing "email" field, but changing email safely requires:
    // - unique constraint handling
    // - resetting emailVerified
    // - updating next-auth session/email
    // To avoid breaking auth/session state, we block email changes here.
    if (typeof body.email === 'string') {
      const incomingEmail = body.email.trim()
      if (incomingEmail && incomingEmail.toLowerCase() !== sessionEmail.toLowerCase()) {
        return NextResponse.json(
          {
            error:
              'Email change is not supported in this flow yet. Please contact support to change your login email.',
          },
          { status: 400 }
        )
      }
    }

    const firstName = pickString(body.first_name)
    const lastName = pickString(body.last_name)

    // Optional: keep name in sync if you want (you also have `name` field on User)
    // We'll set name to "First Last" when either is provided.
    const computedName =
      (firstName || lastName) && `${firstName || ''} ${lastName || ''}`.trim().length
        ? `${firstName || ''} ${lastName || ''}`.trim()
        : null

    const dataToUpdate: any = {
      first_name: firstName,
      last_name: lastName,
      phone: pickString(body.phone),
      company: pickString(body.company),
      title: pickString(body.title),

      address_line1: pickString(body.address_line1),
      address_line2: pickString(body.address_line2),
      city: pickString(body.city),
      state: pickString(body.state),
      postal_code: pickString(body.postal_code),
      country: pickString(body.country),

      // keep timestamps consistent with your schema
      updated_at: new Date(),
    }

    // Only update `name` if we have a computed full name (prevents blank overwrite)
    if (computedName) {
      dataToUpdate.name = computedName
    }

    const updated = await prisma.users.update({
      where: { email: sessionEmail },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        email_verified: true,

        first_name: true,
        last_name: true,
        phone: true,
        phone_verified: true,

        company: true,
        title: true,

        address_line1: true,
        address_line2: true,
        city: true,
        state: true,
        postal_code: true,
        country: true,

        updated_at: true,
        created_at: true,
      },
    })

    return NextResponse.json({
      success: true,
      profile: {
        id: updated.id,
        email: updated.email,
        email_verified: !!updated.email_verified,

        first_name: updated.first_name || '',
        last_name: updated.last_name || '',
        phone: updated.phone || '',
        phone_verified: !!updated.phone_verified,

        company: updated.company || '',
        title: updated.title || '',

        address_line1: updated.address_line1 || '',
        address_line2: updated.address_line2 || '',
        city: updated.city || '',
        state: updated.state || '',
        postal_code: updated.postal_code || '',
        country: updated.country || 'United States',

        created_at: updated.created_at,
        updated_at: updated.updated_at,
      },
    })
  } catch (error: any) {
    console.error('Error updating user profile:', error)
    return NextResponse.json(
      { error: 'Failed to update user profile', details: error?.message },
      { status: 500 }
    )
  }
}
