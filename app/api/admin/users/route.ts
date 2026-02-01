//app/api/admin/users/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

// IMPORTANT:
//   Do NOT create a new PrismaClient in each route.
//   Do NOT call prisma.$disconnect() per-request.
//   In Next.js dev/hot-reload this frequently causes:
//     prisma:error Error in PostgreSQL connection: Error { kind: Closed, cause: None }

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, email: true, role: true },
    })

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        isActive: true,
        isSuspended: true,
        planTier: true,
        planStatus: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Admin users GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const admin = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, role: true },
    })

    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({} as any))
    const userId = String(body?.userId ?? '')
    const action = String(body?.action ?? '')

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }

    // Supported actions in the existing admin UI
    // - activate: sets isActive=true, isSuspended=false
    // - suspend: sets isSuspended=true
    // - unsuspend: sets isSuspended=false
    // - setRole: sets role
    let data: any = {}

    if (action === 'activate') {
      data = { isActive: true, isSuspended: false }
    } else if (action === 'suspend') {
      data = { isSuspended: true }
    } else if (action === 'unsuspend') {
      data = { isSuspended: false }
    } else if (action === 'setRole') {
      const role = String(body?.role ?? '')
      if (!role) return NextResponse.json({ error: 'Missing role' }, { status: 400 })
      data = { role }
    } else {
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        company: true,
        role: true,
        isActive: true,
        isSuspended: true,
        planTier: true,
        planStatus: true,
        subscriptionStatus: true,
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        lastLoginAt: true,
      },
    })

    return NextResponse.json({ user: updated })
  } catch (error) {
    console.error('Admin users POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}