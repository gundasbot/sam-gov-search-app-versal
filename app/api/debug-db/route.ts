import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { isEmailAdmin } from '@/lib/admin'
import { authOptions } from '@/lib/auth'
import { dbQuery } from '@/lib/db'

async function requireAdmin() {
  const session = await getServerSession(authOptions)
  const email = session?.user?.email?.toLowerCase().trim()
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const isAdmin = await isEmailAdmin(email)
  if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return null
}

export async function GET() {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    // Use a lightweight, universal query for Postgres
    const { rows } = await dbQuery<{ now: string }>('select now() as now')

    return NextResponse.json({
      ok: true,
      now: rows?.[0]?.now ?? null,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? 'Unknown error',
      },
      { status: 500 }
    )
  }
}
