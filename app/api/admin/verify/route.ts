//app/api/admin/verify/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()
    
    if (!email) {
      return NextResponse.json({ isAdmin: false })
    }
    
    const user = await prisma.users.findUnique({
      where: { email },
      select: { role: true }
    })
    
    return NextResponse.json({ isAdmin: user?.role === 'admin' })
    
  } catch (error) {
    console.error('Admin verification error:', error)
    return NextResponse.json({ isAdmin: false })
  }
}
