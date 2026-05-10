// app/api/alert-subscriptions/route.ts
// GET  /api/alert-subscriptions  → list all alerts for session user
// POST /api/alert-subscriptions  → create new alert

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

const ALERT_PARAMS_MARKER = '__ALERT_PARAMS__:'

// ─── Shared helpers ───────────────────────────────────────────────────────────

export function parseRecipientsList(raw: string | null): any[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed
  } catch {}

  return raw
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .map(email => ({ email }))
}

type RecipientCandidate = {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  organization?: string
}

function normalizeRecipientCandidates(
  recipientsList: unknown,
  recipientsCsv?: string | null
): RecipientCandidate[] {
  const byEmail = new Map<string, RecipientCandidate>()

  const addCandidate = (candidate: Partial<RecipientCandidate>) => {
    const rawEmail = String(candidate.email || '').trim().toLowerCase()
    if (!rawEmail || !rawEmail.includes('@')) return
    if (byEmail.has(rawEmail)) return
    byEmail.set(rawEmail, {
      email: rawEmail,
      firstName: candidate.firstName ? String(candidate.firstName).trim() : undefined,
      lastName: candidate.lastName ? String(candidate.lastName).trim() : undefined,
      phone: candidate.phone ? String(candidate.phone).trim() : undefined,
      organization: candidate.organization ? String(candidate.organization).trim() : undefined,
    })
  }

  if (Array.isArray(recipientsList)) {
    for (const item of recipientsList) {
      if (!item) continue
      if (typeof item === 'string') {
        addCandidate({ email: item })
        continue
      }
      if (typeof item === 'object') {
        const row = item as Record<string, unknown>
        addCandidate({
          email: String(row.email || ''),
          firstName: typeof row.firstName === 'string' ? row.firstName : undefined,
          lastName: typeof row.lastName === 'string' ? row.lastName : undefined,
          phone: typeof row.phone === 'string' ? row.phone : undefined,
          organization: typeof row.organization === 'string' ? row.organization : undefined,
        })
      }
    }
  }

  if (typeof recipientsCsv === 'string' && recipientsCsv.trim()) {
    for (const part of recipientsCsv.split(',')) {
      addCandidate({ email: part })
    }
  }

  return Array.from(byEmail.values())
}

export async function syncRecipientsToAddressBook(
  userId: string,
  recipientsList: unknown,
  recipientsCsv?: string | null
) {
  const recipients = normalizeRecipientCandidates(recipientsList, recipientsCsv)
  if (!recipients.length) return

  await Promise.all(
    recipients.map((recipient) => {
      const fullName = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ').trim() || null
      return prisma.recipient_contacts.upsert({
        where: {
          user_id_email: {
            user_id: userId,
            email: recipient.email,
          },
        },
        update: {
          updated_at: new Date(),
        },
        create: {
          id: randomBytes(12).toString('hex'),
          user_id: userId,
          email: recipient.email,
          first_name: recipient.firstName || null,
          last_name: recipient.lastName || null,
          name: fullName,
          phone: recipient.phone || null,
          organization: recipient.organization || null,
          notes: null,
          updated_at: new Date(),
        },
      })
    })
  )
}

function normalizeCsvArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map(v => String(v).trim()).filter(Boolean)
  }

  return String(value)
    .split(',')
    .map(v => v.trim())
    .filter(Boolean)
}

function normalizeDateString(value: unknown): string | undefined {
  if (!value) return undefined
  const raw = String(value).trim()
  if (!raw) return undefined
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw

  const dt = new Date(raw)
  if (Number.isNaN(dt.getTime())) return undefined
  return dt.toISOString().slice(0, 10)
}

export function parseAlertDescription(raw: unknown): {
  description: string | null
  params: Record<string, any>
} {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { description: null, params: {} }
  }

  const source = raw.trim()
  const markerIndex = source.lastIndexOf(ALERT_PARAMS_MARKER)
  if (markerIndex < 0) {
    return { description: source, params: {} }
  }

  const visibleDescription = source.slice(0, markerIndex).trim() || null
  const jsonPart = source.slice(markerIndex + ALERT_PARAMS_MARKER.length).trim()

  try {
    const parsed = JSON.parse(jsonPart)
    const params = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, any>)
      : {}
    return { description: visibleDescription, params }
  } catch {
    return { description: source, params: {} }
  }
}

export function buildAlertDescription(
  description: string | null | undefined,
  params: Record<string, any>
): string | null {
  const visibleDescription = typeof description === 'string' ? description.trim() : ''

  const hasParams = Object.values(params).some(v => {
    if (v === null || v === undefined) return false
    if (Array.isArray(v)) return v.length > 0
    return String(v).trim().length > 0
  })

  if (!hasParams) return visibleDescription || null

  const payload = `${ALERT_PARAMS_MARKER}${JSON.stringify(params)}`
  return visibleDescription ? `${visibleDescription}\n${payload}` : payload
}

export function mapSavedSearchToParams(savedSearch?: any): Record<string, any> {
  if (!savedSearch) return {}

  const ptypes = normalizeCsvArray(savedSearch.procurement_type)
  const states = normalizeCsvArray(savedSearch.state_of_performance)
  const setAsides = normalizeCsvArray(savedSearch.set_aside)

  return {
    keyword: savedSearch.keywords ?? undefined,
    title: savedSearch.keywords ?? undefined,
    ptypes: ptypes.length ? ptypes : undefined,
    ptype: ptypes.length ? ptypes.join(',') : undefined,
    states: states.length ? states : undefined,
    state: states.length ? states.join(',') : undefined,
    setAsides: setAsides.length ? setAsides : undefined,
    typeOfSetAside: setAsides.length ? setAsides.join(',') : undefined,
    setAside: setAsides.length ? setAsides.join(',') : undefined,
    ncode: savedSearch.naics ?? undefined,
    ccode: undefined,
    organizationName: savedSearch.agency ?? undefined,
    deptname: savedSearch.agency ?? undefined,
    postedFrom: normalizeDateString(savedSearch.posted_after),
    postedTo: normalizeDateString(savedSearch.posted_before),
    rdlto: normalizeDateString(savedSearch.posted_before),
    format: savedSearch.export_format ?? undefined,
  }
}

export function buildSavedSearchData(params: Record<string, any>, fallbackName: string, description?: string | null) {
  const ptypes = normalizeCsvArray(params.ptypes ?? params.ptype)
  const states = normalizeCsvArray(params.states ?? params.state)
  const setAsides = normalizeCsvArray(params.setAsides ?? params.typeOfSetAside ?? params.setAside)

  return {
    name: fallbackName,
    description: description ?? null,
    keywords: params.keyword ?? params.keywords ?? params.title ?? null,
    naics: params.ncode ?? params.naics ?? null,
    agency: params.organizationName ?? params.deptname ?? params.agency ?? null,
    set_aside: setAsides.length ? setAsides.join(',') : null,
    state_of_performance: states.length ? states.join(',') : null,
    posted_after: params.postedFrom ?? params.posted_after ?? null,
    posted_before: params.postedTo ?? params.rdlto ?? params.posted_before ?? null,
    procurement_type: ptypes.length ? ptypes.join(',') : null,
  }
}

export function mapAlertRow(row: any) {
  const recipientsList = parseRecipientsList(row.recipients)
  const baseParams = mapSavedSearchToParams(row.saved_searches_v2)
  const parsedDescription = parseAlertDescription(row.description)
  const params = {
    ...baseParams,
    ...parsedDescription.params,
    format: row.export_format ?? parsedDescription.params?.format ?? baseParams.format ?? 'CSV',
  }
  return {
    id: row.id,
    name: row.name,
    description: parsedDescription.description,
    savedSearchId: row.saved_search_id ?? null,
    savedSearchName: row.saved_searches_v2?.name ?? null,
    frequency: row.frequency,
    deliveryTime: row.delivery_time ?? '09:00',
    isActive: row.active,
    lastSentAt: row.last_run_at?.toISOString() ?? null,
    lastResultCount: row.last_result_count ?? 0,
    lastError: row.last_error ?? null,
    recipients: row.recipients ?? '',
    recipientsList,
    params,
    maxResults: row.max_results ?? 100,
    sendEmptyResults: row.send_empty_results,
    emailNotification: row.email_notification,
    createdAt: row.created_at.toISOString(),
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rows = await prisma.alert_subscriptions.findMany({
      where: { user_id: session.user.id },
      orderBy: { created_at: 'desc' },
      include: { saved_searches_v2: true },
    })

    return NextResponse.json(rows.map(mapAlertRow))
  } catch (error) {
    console.error('[GET /api/alert-subscriptions]', error)
    return NextResponse.json({ error: 'Failed to fetch alerts' }, { status: 500 })
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      description,
      frequency = 'DAILY',
      deliveryTime = '09:00',
      recipients = '',
      recipientsList = [],
      params = {},
      isActive = true,
      maxResults = 100,
      sendEmptyResults = false,
      savedSearchId, // optional: connect to existing
      savedSearch,   // optional: create new
      savedSearchConnectOrCreate, // optional: connectOrCreate
    } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Alert name is required' }, { status: 400 })
    }

    const freqMap: Record<string, 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_CHANGES' | 'MANUAL'> = {
      DAILY: 'DAILY', WEEKLY: 'WEEKLY', MONTHLY: 'MONTHLY',
      AS_CHANGES: 'AS_CHANGES', MANUAL: 'MANUAL',
    }
    const freq = freqMap[String(frequency).toUpperCase()] ?? 'DAILY'

    // Extract plain email string from recipientsList for the required recipients column
    const recipientEmails = recipientsList.length > 0
      ? recipientsList
          .flatMap((r: any) => [r.email].filter(Boolean))
          .join(',')
      : (typeof recipients === 'string' ? recipients : '')

    const parsedInputDescription = parseAlertDescription(description)
    const alertDescription = buildAlertDescription(parsedInputDescription.description, params)
    const savedSearchData = buildSavedSearchData(params, name.trim(), parsedInputDescription.description)

    // Build saved_searches_v2 relation object
    let savedSearchesRelation: any = undefined
    const hasSearchCriteria = [
      savedSearchData.keywords,
      savedSearchData.naics,
      savedSearchData.agency,
      savedSearchData.set_aside,
      savedSearchData.state_of_performance,
      savedSearchData.posted_after,
      savedSearchData.posted_before,
      savedSearchData.procurement_type,
      savedSearchData.description,
    ].some(value => value != null && String(value).trim() !== '')

    const normalizedSavedSearchId = typeof savedSearchId === 'string' ? savedSearchId.trim() : ''

    if (savedSearchConnectOrCreate) {
      savedSearchesRelation = { connectOrCreate: savedSearchConnectOrCreate }
    } else if (normalizedSavedSearchId) {
      // Some callers pass IDs from older saved-search tables. connectOrCreate prevents
      // relation failures and safely seeds a v2 row if the ID is missing.
      savedSearchesRelation = {
        connectOrCreate: {
          where: { id: normalizedSavedSearchId },
          create: {
            id: normalizedSavedSearchId,
            user_id: session.user.id,
            updated_at: new Date(),
            ...savedSearchData,
          },
        },
      }
    } else if (savedSearch) {
      savedSearchesRelation = {
        create: {
          id: randomBytes(12).toString('hex'),
          user_id: session.user.id,
          updated_at: new Date(),
          ...savedSearch,
        },
      }
    } else if (hasSearchCriteria) {
      savedSearchesRelation = {
        create: {
          id: randomBytes(12).toString('hex'),
          user_id: session.user.id,
          updated_at: new Date(),
          ...savedSearchData,
        },
      }
    }

    const row = await prisma.alert_subscriptions.create({
      data: {
        id: randomBytes(12).toString('hex'),
        users: { connect: { id: session.user.id } },
        name: name.trim(),
        description: alertDescription,
        frequency: freq,
        delivery_time: deliveryTime,
        recipients: recipientEmails,
        export_format: String(params.format || 'CSV'),
        active: isActive,
        max_results: maxResults,
        send_empty_results: sendEmptyResults,
        email_notification: true,
        updated_at: new Date(),
        ...(savedSearchesRelation ? { saved_searches_v2: savedSearchesRelation } : {}),
      },
      include: { saved_searches_v2: true },
    })

    // Keep alert recipients in the shared Contacts address book.
    try {
      await syncRecipientsToAddressBook(session.user.id, recipientsList, recipientEmails)
    } catch (syncError) {
      // Non-fatal: alert creation should still succeed even if contact sync fails.
      console.error('[alert-subscriptions POST] recipient sync failed', syncError)
    }

    return NextResponse.json(mapAlertRow(row), { status: 201 })
  } catch (error) {
    console.error('[POST /api/alert-subscriptions]', error)
    return NextResponse.json({ error: 'Failed to create alert' }, { status: 500 })
  }
}
