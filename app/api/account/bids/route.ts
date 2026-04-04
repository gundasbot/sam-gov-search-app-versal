import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getToken } from 'next-auth/jwt'

export const runtime = 'nodejs'

const sql = neon(process.env.DATABASE_URL!)

type BidStatus = 'draft' | 'submitted' | 'awarded' | 'not_awarded'

type StoredBid = {
  id: string
  opportunityId: string
  opportunityTitle: string
  dueDate: string
  status: BidStatus
  value?: number
  created_at: string
  updated_at: string
  activity: Array<{ at: string; action: string }>
}

async function authedEmail(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) return null
  const token = await getToken({ req, secret })
  const email = (token as any)?.email || (token as any)?.users?.email || (token as any)?.sub
  return typeof email === 'string' && email.length ? email : null
}

function normalizeStatus(input: any): BidStatus {
  const s = String(input || '').toLowerCase()
  if (s === 'submitted' || s === 'awarded' || s === 'not_awarded') return s
  return 'draft'
}

function getBidsFromSubscriptions(subscriptions: any): StoredBid[] {
  const raw = subscriptions?.bids
  if (!Array.isArray(raw)) return []
  return raw.filter(Boolean)
}

async function getUserSubscriptions(email: string) {
  const rows = await sql`SELECT subscriptions FROM users WHERE email=${email} LIMIT 1`
  return rows[0]?.subscriptions ?? {}
}

async function setUserSubscriptions(email: string, subscriptions: any) {
  await sql`
    UPDATE users
    SET subscriptions = ${JSON.stringify(subscriptions)}::jsonb
    WHERE email = ${email}
  `
}

export async function GET(req: NextRequest) {
  try {
    const email = await authedEmail(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const subscriptions = await getUserSubscriptions(email)
    const bids = getBidsFromSubscriptions(subscriptions)
      .sort((a, b) => +new Date(b.updated_at || b.created_at || 0) - +new Date(a.updated_at || a.created_at || 0))

    return NextResponse.json(bids)
  } catch (error) {
    console.error('Error fetching bids:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const email = await authedEmail(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const opportunityId = String(body?.opportunityId || '').trim()
    const opportunityTitle = String(body?.opportunityTitle || '').trim()
    const dueDate = String(body?.dueDate || '').trim()

    if (!opportunityId || !opportunityTitle || !dueDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const now = new Date().toISOString()
    const bid: StoredBid = {
      id: crypto.randomUUID(),
      opportunityId,
      opportunityTitle,
      dueDate,
      status: normalizeStatus(body?.status),
      value: typeof body?.value === 'number' ? body.value : undefined,
      created_at: now,
      updated_at: now,
      activity: [{ at: now, action: 'Bid created' }],
    }

    const subscriptions = await getUserSubscriptions(email)
    const bids = getBidsFromSubscriptions(subscriptions)
    const nextSubscriptions = { ...subscriptions, bids: [bid, ...bids] }
    await setUserSubscriptions(email, nextSubscriptions)

    return NextResponse.json(bid)
  } catch (error) {
    console.error('Error creating bid:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const email = await authedEmail(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const bidId = String(body?.id || '').trim()
    if (!bidId) return NextResponse.json({ error: 'Bid id is required' }, { status: 400 })

    const subscriptions = await getUserSubscriptions(email)
    const bids = getBidsFromSubscriptions(subscriptions)
    const idx = bids.findIndex((b) => b.id === bidId)
    if (idx === -1) return NextResponse.json({ error: 'Bid not found' }, { status: 404 })

    const existing = bids[idx]
    const now = new Date().toISOString()
    const nextStatus = body?.status ? normalizeStatus(body.status) : existing.status
    const statusChanged = nextStatus !== existing.status

    const updated: StoredBid = {
      ...existing,
      opportunityTitle: body?.opportunityTitle ? String(body.opportunityTitle) : existing.opportunityTitle,
      dueDate: body?.dueDate ? String(body.dueDate) : existing.dueDate,
      value: typeof body?.value === 'number' ? body.value : existing.value,
      status: nextStatus,
      updated_at: now,
      activity: [
        ...(existing.activity || []),
        { at: now, action: statusChanged ? `Status changed to ${nextStatus}` : 'Bid updated' },
      ],
    }

    const nextBids = [...bids]
    nextBids[idx] = updated
    const nextSubscriptions = { ...subscriptions, bids: nextBids }
    await setUserSubscriptions(email, nextSubscriptions)

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating bid:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const email = await authedEmail(req)
    if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const bidId = req.nextUrl.searchParams.get('id') || ''
    if (!bidId) return NextResponse.json({ error: 'Bid id is required' }, { status: 400 })

    const subscriptions = await getUserSubscriptions(email)
    const bids = getBidsFromSubscriptions(subscriptions)
    const nextBids = bids.filter((b) => b.id !== bidId)
    const nextSubscriptions = { ...subscriptions, bids: nextBids }
    await setUserSubscriptions(email, nextSubscriptions)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting bid:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
