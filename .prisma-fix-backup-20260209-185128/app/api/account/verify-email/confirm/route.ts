// app/api/account/verify-email/confirm/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const tokenHash = sha256Hex(token)

    const record = await prisma.emailVerificationToken.findUnique({
      where: { token_hash: tokenHash },
      include: { user: { select: { id: true, email: true } } },
    })

    if (!record) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    if (record.expires_at.getTime() < Date.now()) {
      await prisma.emailVerificationToken.delete({ where: { token_hash: tokenHash } })
      return NextResponse.json({ error: 'Token expired' }, { status: 400 })
    }

    await prisma.users.update({
      where: { id: record.user_id },
      data: { email_verified: new Date() },
    })

    await prisma.emailVerificationToken.delete({ where: { token_hash: tokenHash } })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Verify email confirm error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email', details: error?.message },
      { status: 500 }
    )
  }
}
