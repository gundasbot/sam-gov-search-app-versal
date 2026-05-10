import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { isEmailAdmin } from '@/lib/admin'
import { authOptions } from '@/lib/auth'

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

  const url = process.env.DATABASE_URL || ""
  const direct = process.env.DIRECT_URL || ""

  const safeHost = (value: string) => {
    try {
      return new URL(value).host
    } catch {
      return null
    }
  }

  return NextResponse.json({
    hasDatabaseUrl: Boolean(url),
    hasDirectUrl: Boolean(direct),
    databaseUrlHasPgbouncer: url.includes("pgbouncer=true"),
    databaseUrlHasPoolerHost: url.includes("-pooler."),
    databaseUrlHost: safeHost(url),
    directUrlHost: safeHost(direct),
  })
}
