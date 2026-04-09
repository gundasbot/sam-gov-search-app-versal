// app/api/outreach/test-contractors/route.ts

import { getServerSession } from 'next-auth'
import { NextRequest, NextResponse } from 'next/server'
import { isEmailAdmin } from '@/lib/admin'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.toLowerCase().trim()
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = await isEmailAdmin(email)
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return null
}

export async function POST(req: NextRequest) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await req.json()
    const { name, email, naics_code, state, business_type } = body

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    const contractor = await prisma.contractors.create({
      data: {
        id: crypto.randomUUID(),
        name,
        email,
        naics_code: naics_code || null,
        state: state || null,
        business_type: business_type || null,
        score: 0,
        pipeline_stage: 'new',
        contacted: false,
        enrolled: false,
        is_test: true,
      },
    })

    return NextResponse.json({ contractor }, { status: 201 })
  } catch (err: any) {
    console.error('POST /api/outreach/test-contractors failed')
    return NextResponse.json({ error: 'Failed to create test contractor' }, { status: 500 })
  }
}

export async function DELETE() {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const result = await prisma.contractors.deleteMany({
      where: { is_test: true },
    })
    return NextResponse.json({ deleted: result.count })
  } catch (err: any) {
    console.error('DELETE /api/outreach/test-contractors failed')
    return NextResponse.json({ error: 'Failed to delete test contractors' }, { status: 500 })
  }
}
