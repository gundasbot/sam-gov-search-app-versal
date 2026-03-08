import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

type UserPreferences = {
  setAsides: string[]
  naicsCodes: string[]
  agencies: string[]
  contractSizeMin?: number
  contractSizeMax?: number
  keywords: string[]
  states: string[]
  businessType: string
  completedOnboarding: boolean
}

const DEFAULT_PREFS: UserPreferences = {
  setAsides: [],
  naicsCodes: [],
  agencies: [],
  keywords: [],
  states: [],
  businessType: 'SDVOSB',
  completedOnboarding: false,
}

function sanitizePreferences(input: any): UserPreferences {
  const arr = (v: any) => Array.isArray(v) ? v.map((x: any) => String(x).trim()).filter(Boolean) : []
  const num = (v: any) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
  const unique = (list: string[]) => Array.from(new Set(list.map(s => s.toUpperCase() === 'REMOTE/NATIONWIDE' ? s : s)))

  return {
    setAsides: unique(arr(input?.setAsides)),
    naicsCodes: unique(arr(input?.naicsCodes)),
    agencies: unique(arr(input?.agencies)).slice(0, 8),
    keywords: unique(arr(input?.keywords).map(k => k.toLowerCase())).slice(0, 30),
    states: unique(arr(input?.states)),
    contractSizeMin: num(input?.contractSizeMin),
    contractSizeMax: num(input?.contractSizeMax),
    businessType: String(input?.businessType || 'SDVOSB').trim() || 'SDVOSB',
    completedOnboarding: Boolean(input?.completedOnboarding),
  }
}

async function getSessionEmail() {
  const session = await getServerSession(authOptions)
  return session?.user?.email?.toLowerCase().trim() || null
}

function extractPreferences(subscriptions: any): UserPreferences {
  if (!subscriptions || typeof subscriptions !== 'object') return DEFAULT_PREFS
  const existing = (subscriptions as any).dashboardPreferences
  if (!existing) return DEFAULT_PREFS
  return { ...DEFAULT_PREFS, ...sanitizePreferences(existing) }
}

async function savePreferences(email: string, prefs: UserPreferences) {
  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true, subscriptions: true },
  })

  if (!user) {
    throw new Error('User not found')
  }

  const current = user.subscriptions && typeof user.subscriptions === 'object'
    ? (user.subscriptions as Record<string, unknown>)
    : {}

  const nextSubscriptions = {
    ...current,
    dashboardPreferences: prefs,
  }

  await prisma.users.update({
    where: { id: user.id },
    data: {
      subscriptions: nextSubscriptions,
      updated_at: new Date(),
    },
  })

  return prefs
}

export async function GET() {
  try {
    const email = await getSessionEmail()
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.users.findUnique({
      where: { email },
      select: { subscriptions: true },
    })

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json(extractPreferences(user.subscriptions))
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to fetch preferences' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const email = await getSessionEmail()
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const prefs = sanitizePreferences(body)

    const saved = await savePreferences(email, prefs)
    return NextResponse.json({ success: true, preferences: saved })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Failed to save preferences' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  return POST(request)
}
