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

type PreferencesInput = Partial<UserPreferences>

type ValidationResult = {
  ok: boolean
  preferences?: UserPreferences
  errors: string[]
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

const MAX_ITEMS = {
  setAsides: 32,
  naicsCodes: 200,
  agencies: 15,
  keywords: 50,
  states: 70,
} as const

const MAX_LENGTH = {
  setAsides: 64,
  naicsCodes: 16,
  agencies: 120,
  keywords: 80,
  states: 32,
  businessType: 64,
} as const

const CACHE_HEADERS = {
  'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
}

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function uniq(list: string[]): string[] {
  return Array.from(new Set(list))
}

function normalizeString(value: unknown): string {
  return String(value || '').trim()
}

function normalizeNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  return undefined
}

function normalizeStringList(
  value: unknown,
  fieldName: keyof typeof MAX_ITEMS,
  itemMaxLength: number,
  errors: string[],
  forceLowerCase = false
): string[] {
  if (!Array.isArray(value)) {
    errors.push(`${fieldName} must be an array`)
    return []
  }

  if (value.length > MAX_ITEMS[fieldName]) {
    errors.push(`${fieldName} supports at most ${MAX_ITEMS[fieldName]} entries`)
  }

  const normalized: string[] = []
  for (const raw of value.slice(0, MAX_ITEMS[fieldName])) {
    const text = normalizeString(raw)
    if (!text) continue
    if (text.length > itemMaxLength) {
      errors.push(`${fieldName} entries must be ${itemMaxLength} characters or less`)
      continue
    }
    normalized.push(forceLowerCase ? text.toLowerCase() : text)
  }

  return uniq(normalized)
}

function buildFromAny(subscriptions: unknown): UserPreferences {
  if (!isObject(subscriptions)) return { ...DEFAULT_PREFS }
  const rawDashboardPreferences = subscriptions.dashboardPreferences
  if (!isObject(rawDashboardPreferences)) return { ...DEFAULT_PREFS }

  const result: UserPreferences = {
    setAsides: Array.isArray(rawDashboardPreferences.setAsides)
      ? uniq(rawDashboardPreferences.setAsides.map((value) => normalizeString(value)).filter(Boolean)).slice(0, MAX_ITEMS.setAsides)
      : [],
    naicsCodes: Array.isArray(rawDashboardPreferences.naicsCodes)
      ? uniq(rawDashboardPreferences.naicsCodes.map((value) => normalizeString(value)).filter(Boolean)).slice(0, MAX_ITEMS.naicsCodes)
      : [],
    agencies: Array.isArray(rawDashboardPreferences.agencies)
      ? uniq(rawDashboardPreferences.agencies.map((value) => normalizeString(value)).filter(Boolean)).slice(0, MAX_ITEMS.agencies)
      : [],
    keywords: Array.isArray(rawDashboardPreferences.keywords)
      ? uniq(rawDashboardPreferences.keywords.map((value) => normalizeString(value).toLowerCase()).filter(Boolean)).slice(0, MAX_ITEMS.keywords)
      : [],
    states: Array.isArray(rawDashboardPreferences.states)
      ? uniq(rawDashboardPreferences.states.map((value) => normalizeString(value)).filter(Boolean)).slice(0, MAX_ITEMS.states)
      : [],
    contractSizeMin: normalizeNumber(rawDashboardPreferences.contractSizeMin),
    contractSizeMax: normalizeNumber(rawDashboardPreferences.contractSizeMax),
    businessType: normalizeString(rawDashboardPreferences.businessType) || DEFAULT_PREFS.businessType,
    completedOnboarding: Boolean(rawDashboardPreferences.completedOnboarding),
  }

  if (
    typeof result.contractSizeMin === 'number' &&
    typeof result.contractSizeMax === 'number' &&
    result.contractSizeMin > result.contractSizeMax
  ) {
    const min = result.contractSizeMin
    result.contractSizeMin = result.contractSizeMax
    result.contractSizeMax = min
  }

  return result
}

function validateFull(input: unknown): ValidationResult {
  const errors: string[] = []
  const body = isObject(input) ? input : {}

  const setAsides = normalizeStringList(body.setAsides, 'setAsides', MAX_LENGTH.setAsides, errors)
  const naicsCodes = normalizeStringList(body.naicsCodes, 'naicsCodes', MAX_LENGTH.naicsCodes, errors)
  const agencies = normalizeStringList(body.agencies, 'agencies', MAX_LENGTH.agencies, errors)
  const keywords = normalizeStringList(body.keywords, 'keywords', MAX_LENGTH.keywords, errors, true)
  const states = normalizeStringList(body.states, 'states', MAX_LENGTH.states, errors)

  const businessType = normalizeString(body.businessType)
  if (!businessType) errors.push('businessType is required')
  if (businessType.length > MAX_LENGTH.businessType) {
    errors.push(`businessType must be ${MAX_LENGTH.businessType} characters or less`)
  }

  const contractSizeMin = normalizeNumber(body.contractSizeMin)
  const contractSizeMax = normalizeNumber(body.contractSizeMax)
  if (contractSizeMin != null && contractSizeMin < 0) errors.push('contractSizeMin cannot be negative')
  if (contractSizeMax != null && contractSizeMax < 0) errors.push('contractSizeMax cannot be negative')
  if (
    typeof contractSizeMin === 'number' &&
    typeof contractSizeMax === 'number' &&
    contractSizeMin > contractSizeMax
  ) {
    errors.push('contractSizeMin cannot be greater than contractSizeMax')
  }

  const completedOnboarding = typeof body.completedOnboarding === 'boolean'
    ? body.completedOnboarding
    : Boolean(body.completedOnboarding)

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return {
    ok: true,
    errors: [],
    preferences: {
      setAsides,
      naicsCodes,
      agencies,
      keywords,
      states,
      contractSizeMin,
      contractSizeMax,
      businessType: businessType || DEFAULT_PREFS.businessType,
      completedOnboarding,
    },
  }
}

function validatePatch(input: unknown, current: UserPreferences): ValidationResult {
  const errors: string[] = []
  const body = isObject(input) ? input : {}
  const has = (key: keyof UserPreferences) => Object.prototype.hasOwnProperty.call(body, key)

  const next: UserPreferences = { ...current }

  if (has('setAsides')) {
    next.setAsides = normalizeStringList(body.setAsides, 'setAsides', MAX_LENGTH.setAsides, errors)
  }
  if (has('naicsCodes')) {
    next.naicsCodes = normalizeStringList(body.naicsCodes, 'naicsCodes', MAX_LENGTH.naicsCodes, errors)
  }
  if (has('agencies')) {
    next.agencies = normalizeStringList(body.agencies, 'agencies', MAX_LENGTH.agencies, errors)
  }
  if (has('keywords')) {
    next.keywords = normalizeStringList(body.keywords, 'keywords', MAX_LENGTH.keywords, errors, true)
  }
  if (has('states')) {
    next.states = normalizeStringList(body.states, 'states', MAX_LENGTH.states, errors)
  }
  if (has('businessType')) {
    const businessType = normalizeString(body.businessType)
    if (!businessType) {
      errors.push('businessType cannot be empty')
    } else if (businessType.length > MAX_LENGTH.businessType) {
      errors.push(`businessType must be ${MAX_LENGTH.businessType} characters or less`)
    } else {
      next.businessType = businessType
    }
  }

  if (has('contractSizeMin')) {
    const value = normalizeNumber(body.contractSizeMin)
    if (value != null && value < 0) errors.push('contractSizeMin cannot be negative')
    next.contractSizeMin = value
  }
  if (has('contractSizeMax')) {
    const value = normalizeNumber(body.contractSizeMax)
    if (value != null && value < 0) errors.push('contractSizeMax cannot be negative')
    next.contractSizeMax = value
  }

  if (has('completedOnboarding')) {
    next.completedOnboarding = Boolean(body.completedOnboarding)
  }

  if (
    typeof next.contractSizeMin === 'number' &&
    typeof next.contractSizeMax === 'number' &&
    next.contractSizeMin > next.contractSizeMax
  ) {
    errors.push('contractSizeMin cannot be greater than contractSizeMax')
  }

  if (errors.length > 0) {
    return { ok: false, errors }
  }

  return { ok: true, preferences: next, errors: [] }
}

async function getSessionUser() {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id?.trim()
  if (userId) return { id: userId, email: session?.user?.email?.toLowerCase().trim() || null }

  const email = session?.user?.email?.toLowerCase().trim()
  if (!email) return null

  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true, email: true },
  })
  if (!user) return null
  return { id: user.id, email: user.email }
}

async function savePreferencesForUser(userId: string, preferences: UserPreferences) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { subscriptions: true },
  })
  if (!user) throw new Error('User not found')

  const currentSubscriptions = isObject(user.subscriptions)
    ? (user.subscriptions as Record<string, unknown>)
    : {}

  const nextSubscriptions = {
    ...currentSubscriptions,
    dashboardPreferences: preferences,
  }

  await prisma.users.update({
    where: { id: userId },
    data: {
      subscriptions: nextSubscriptions,
      updated_at: new Date(),
    },
  })

  return preferences
}

export async function GET() {
  try {
    const user = await getSessionUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
    }

    const row = await prisma.users.findUnique({
      where: { id: user.id },
      select: { subscriptions: true },
    })
    if (!row) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: NO_STORE_HEADERS })
    }

    return NextResponse.json(buildFromAny(row.subscriptions), { headers: CACHE_HEADERS })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch preferences'
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
    }

    const body = await request.json().catch(() => ({}))
    const validation = validateFull(body)
    if (!validation.ok || !validation.preferences) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const saved = await savePreferencesForUser(user.id, validation.preferences)
    return NextResponse.json({ success: true, preferences: saved }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to save preferences'
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser()
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE_HEADERS })
    }

    const currentRow = await prisma.users.findUnique({
      where: { id: user.id },
      select: { subscriptions: true },
    })
    if (!currentRow) {
      return NextResponse.json({ error: 'User not found' }, { status: 404, headers: NO_STORE_HEADERS })
    }

    const current = buildFromAny(currentRow.subscriptions)
    const body = await request.json().catch(() => ({}))
    const validation = validatePatch(body, current)
    if (!validation.ok || !validation.preferences) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400, headers: NO_STORE_HEADERS }
      )
    }

    const saved = await savePreferencesForUser(user.id, validation.preferences)
    return NextResponse.json({ success: true, preferences: saved }, { headers: NO_STORE_HEADERS })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to update preferences'
    return NextResponse.json({ error: message }, { status: 500, headers: NO_STORE_HEADERS })
  }
}
