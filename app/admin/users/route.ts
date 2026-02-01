import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()
    
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    })
    
    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    // Get all users (excluding passwords)
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        phone: true,
        company: true,
        city: true,
        state: true,
        country: true,
        postalCode: true,
      },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json({ users })
    
  } catch (error: any) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch users',
      details: error.message
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()
    
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Check if user is admin
    const adminUser = await prisma.user.findUnique({
      where: { email },
      select: { role: true }
    })
    
    if (adminUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }
    
    const body = await req.json()
    const { userId, role } = body
    
    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
      }
    })
    
    return NextResponse.json({ 
      success: true, 
      message: 'User role updated',
      user: updatedUser
    })
    
  } catch (error: any) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ 
      error: 'Failed to update user',
      details: error.message
    }, { status: 500 })
  }
}