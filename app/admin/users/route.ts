import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function isAdminRole(role?: string | null) {
  const r = (role ?? '').toLowerCase().trim()
  return r === 'admin' || r === 'super_admin' || r === 'superadmin' || r === 'super-admin'
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (from `users` table)
    const adminUser = await prisma.users.findUnique({
      where: { email },
      select: { role: true },
    })

    if (!isAdminRole(adminUser?.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all users (exclude password_hash and other sensitive fields)
    const rows = await prisma.users.findMany({
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        created_at: true,
        updated_at: true,
        phone: true,
        company: true,
        city: true,
        state: true,
        country: true,
        postal_code: true,

        // Optional: include useful admin fields (safe)
        plan_tier: true,
        plan_status: true,
        account_status: true,
        last_login_at: true,
        is_active: true,
        is_suspended: true,
        trial_active: true,
        trial_expires_at: true,
        stripe_customer_id: true,
        stripe_subscription_id: true,
      },
      orderBy: { created_at: 'desc' },
    })

    // Return camelCase to keep your frontend clean/consistent
    const users = rows.map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      role: u.role,
      createdAt: u.created_at,
      updatedAt: u.updated_at,
      phone: u.phone,
      company: u.company,
      city: u.city,
      state: u.state,
      country: u.country,
      postalCode: u.postal_code,

      planTier: u.plan_tier,
      planStatus: u.plan_status,
      accountStatus: u.account_status,
      lastLoginAt: u.last_login_at,
      isActive: u.is_active,
      isSuspended: u.is_suspended,
      trialActive: u.trial_active,
      trialExpiresAt: u.trial_expires_at,
      stripeCustomerId: u.stripe_customer_id,
      stripeSubscriptionId: u.stripe_subscription_id,
    }))

    return NextResponse.json({ users })
  } catch (error: any) {
    console.error('Admin users fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()

    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin (from `users` table)
    const adminUser = await prisma.users.findUnique({
      where: { email },
      select: { role: true },
    })

    if (!isAdminRole(adminUser?.role)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, role } = body as { userId?: string; role?: string }

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Update user role
    const updated = await prisma.users.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        role: true,
        updated_at: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User role updated', users: {
        id: updated.id,
        email: updated.email,
        role: updated.role,
        updatedAt: updated.updated_at,
      },
    })
  } catch (error: any) {
    console.error('Admin user update error:', error)
    return NextResponse.json(
      { error: 'Failed to update user', details: error?.message ?? String(error) },
      { status: 500 }
    )
  }
}