// app/api/saved-opportunities/[noticeId]/route.ts
// Handles DELETE (unsave) for a specific opportunity

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ noticeId: string }> }
) {
  const { noticeId } = await params

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

    await prisma.saved_opportunities.deleteMany({
      where: {
        user_id: user.id,
        notice_id: noticeId,
      },
    })

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/saved-opportunities error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}