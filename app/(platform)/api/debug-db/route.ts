import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { dbQuery } from '@/lib/db'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.toLowerCase().trim()
  const secret = new URL(req.url).searchParams.get('secret')
  const allowedSecret = process.env.DEBUG_SECRET

  // Allow if: session exists OR correct debug secret provided
  if (!email && secret !== allowedSecret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, any> = {}

  // Raw SQL ping
  try {
    const { rows } = await dbQuery<{ now: string }>('select now() as now')
    results.rawSql = { ok: true, now: rows?.[0]?.now ?? null }
  } catch (err: any) {
    results.rawSql = { ok: false, error: err?.message, code: err?.code }
  }

  // Prisma count query (no field access, just connectivity)
  try {
    const count = await prisma.users.count()
    results.prismaCount = { ok: true, count }
  } catch (err: any) {
    results.prismaCount = { ok: false, error: err?.message, code: err?.code, meta: (err as any)?.meta }
  }

  // Prisma findFirst with the exact fields used by the JWT callback
  try {
    const user = await prisma.users.findFirst({
      select: {
        id: true, email: true, name: true, first_name: true, last_name: true,
        role: true, plan: true, plan_tier: true, plan_status: true,
        subscription_status: true, billing_interval: true,
        trial_active: true, trial_ends_at: true, trial_expires_at: true,
        stripe_subscription_id: true, stripe_customer_id: true,
        is_suspended: true,
      },
    })
    results.prismaUserFields = { ok: true, found: !!user }
  } catch (err: any) {
    results.prismaUserFields = { ok: false, error: err?.message, code: err?.code, meta: (err as any)?.meta }
  }

  // Prisma saved_opportunities count
  try {
    const count = await prisma.saved_opportunities.count()
    results.prismaSavedOpps = { ok: true, count }
  } catch (err: any) {
    results.prismaSavedOpps = { ok: false, error: err?.message, code: err?.code, meta: (err as any)?.meta }
  }

  const allOk = Object.values(results).every((r) => r.ok)
  return NextResponse.json({ ok: allOk, results }, { status: allOk ? 200 : 500 })
}
