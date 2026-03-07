import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ ok: true })

    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { is_suspended: true },
    })

    if (user?.is_suspended) {
      return NextResponse.json({ code: 'SUSPENDED' }, { status: 403 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // fail open — NextAuth will catch auth errors
  }
}
