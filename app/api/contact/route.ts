//app/api/contact/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

function clamp(v: unknown, max = 120) {
  return String(v ?? '').trim().slice(0, max)
}

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        phone: true,
        company: true,
        title: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    })

    console.log('Contact GET - User:', JSON.stringify(user, null, 2))

    return NextResponse.json(user || {})
  } catch (error) {
    console.error('Contact GET error:', error)
    return NextResponse.json({ error: 'Failed to load contact info' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    console.log('Contact PUT - Request body:', JSON.stringify(body, null, 2))

    const updateData: any = {}

    if (body.phone !== undefined) {
      updateData.phone = clamp(body.phone, 40) || null
    }
    if (body.company !== undefined) {
      updateData.company = clamp(body.company, 120) || null
    }
    if (body.title !== undefined) {
      updateData.title = clamp(body.title, 120) || null
    }
    if (body.address_line1 !== undefined) {
      updateData.addressLine1 = clamp(body.address_line1, 160) || null
    }
    if (body.address_line2 !== undefined) {
      updateData.addressLine2 = clamp(body.address_line2, 160) || null
    }
    if (body.city !== undefined) {
      updateData.city = clamp(body.city, 80) || null
    }
    if (body.state !== undefined) {
      updateData.state = clamp(body.state, 40) || null
    }
    if (body.zip !== undefined) {
      updateData.postalCode = clamp(body.zip, 20) || null
    }
    if (body.country !== undefined) {
      updateData.country = clamp(body.country, 60) || null
    }

    console.log('Contact PUT - Update data:', JSON.stringify(updateData, null, 2))

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true }
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const updated = await prisma.user.update({
      where: { email },
      data: updateData,
      select: {
        phone: true,
        company: true,
        title: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        postalCode: true,
        country: true,
      },
    })

    console.log('Contact PUT - Updated user:', JSON.stringify(updated, null, 2))

    return NextResponse.json(updated)
  } catch (error: any) {
    console.error('Contact PUT error details:', error)
    return NextResponse.json({ 
      error: 'Failed to save contact info',
      details: error.message,
      code: error.code
    }, { status: 500 })
  }
}