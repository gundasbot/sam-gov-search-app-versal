// app/api/alert-subscriptions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscriptions = await prisma.saved_searches_new.findMany({
      where: {
        user_id: session.user.id, // ✅ FIX
        subscription_enabled: true, // ✅ FIX (only enabled)
      },
      include: {
        _count: {
          select: {
            search_runs: true,
            search_exports: true,
          },
        },
      },
      orderBy: { updated_at: 'desc' },
    })

    return NextResponse.json({
      subscriptions: subscriptions.map((s: any) => ({
        ...s,
        active: s.subscription_enabled,
        file_format: s.export_format,
        counts: {
          runs: s?._count?.search_runs ?? 0,
          exports: s?._count?.search_exports ?? 0,
        },
      })),
    })
  } catch (error: any) {
    console.error('Error fetching alert subscriptions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alert subscriptions', details: error?.message },
      { status: 500 }
    )
  }
}
