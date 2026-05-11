import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ ok: true })

    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: { email_verified: true, password_hash: true, is_suspended: true },
    })

    if (!user) {
      return NextResponse.json({ code: 'ACCOUNT_NOT_FOUND' }, { status: 404 })
    }

    if (user?.is_suspended) {
      return NextResponse.json({ code: 'SUSPENDED' }, { status: 403 })
    }

    if (!user.email_verified) {
      return NextResponse.json({ code: 'EMAIL_NOT_VERIFIED' }, { status: 403 })
    }

    if (!user.password_hash) {
      return NextResponse.json({ code: 'PASSWORD_LOGIN_NOT_ENABLED' }, { status: 403 })
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true }) // fail open — NextAuth will catch auth errors
  }
}
