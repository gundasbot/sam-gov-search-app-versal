// app/api/cron/send-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAlertEmail } from '@/lib/email/alerts'

// Verify cron secret for security
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn('⚠️  CRON_SECRET not set - cron endpoint is unprotected!')
    return process.env.NODE_ENV === 'development'
  }

  return authHeader === `Bearer ${cronSecret}`
}

function parseRecipients(alert: any): string[] {
  // Supports several possible shapes without breaking old data:
  // - alert.recipients (string: "a@x.com, b@y.com")
  // - alert.recipients (string[])
  // - alert.ccEmails (string or string[])
  // - fallback: alert.user.email
  const out: string[] = []

  const add = (v: any) => {
    if (!v) return
    if (Array.isArray(v)) {
      v.forEach(add)
      return
    }
    if (typeof v === 'string') {
      v.split(',')
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((e) => out.push(e))
    }
  }

  add(alert.recipients)
  add(alert.ccEmails)

  // Always include owner email (unless you later add an explicit opt-out)
  if (alert?.user?.email) out.push(alert.user.email)

  // Deduplicate
  return Array.from(new Set(out))
}

function toISODateString(d: Date) {
  return d.toISOString().split('T')[0]
}

function defaultPostedRangeIfMissing(alert: any) {
  // SAM requires BOTH postedFrom and postedTo.
  // If alert doesn't include postedAfter/postedBefore, default to last 30 days.
  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - 30)

  const postedFrom = alert.postedAfter
    ? toISODateString(new Date(alert.postedAfter))
    : toISODateString(from)

  const postedTo = alert.postedBefore
    ? toISODateString(new Date(alert.postedBefore))
    : toISODateString(now)

  return { postedFrom, postedTo }
}

function shouldRunAlert(alert: any, now: Date): boolean {
  const lastRun = alert.lastRunAt ? new Date(alert.lastRunAt) : null
  if (!lastRun) return true

  const hoursSinceLastRun =
    (now.getTime() - lastRun.getTime()) / (1000 * 60 * 60)

  switch (alert.frequency) {
    case 'DAILY':
      return hoursSinceLastRun >= 23
    case 'WEEKLY':
      return hoursSinceLastRun >= 7 * 24 - 1
    case 'MONTHLY':
      return hoursSinceLastRun >= 30 * 24 - 1
    case 'AS_CHANGES':
      return hoursSinceLastRun >= 1
    default:
      return false
  }
}

async function runAlertSearch(alert: any): Promise<any[]> {
  const qs = new URLSearchParams()

  // ✅ Always supply postedFrom + postedTo (SAM requires both)
  const { postedFrom, postedTo } = defaultPostedRangeIfMissing(alert)
  qs.set('postedFrom', postedFrom)
  qs.set('postedTo', postedTo)

  // ✅ procurement type
  qs.set('ptype', alert.procurementType || 'o')

  // ✅ keyword search (align with your /api/sam route)
  if (alert.keywords) qs.set('keywords', alert.keywords)

  // ✅ NAICS
  if (alert.naics) qs.set('naics', alert.naics)

  // ✅ Agency (if your /api/sam supports it; harmless if ignored)
  if (alert.agency) qs.set('agency', alert.agency)

  // ✅ Set-aside
  // If stored as a single string today, keep it.
  // If you later store multiple, join with comma and parse server-side.
  if (alert.setAside) qs.set('setAside', alert.setAside)

  // ✅ State / location
  if (alert.stateOfPerformance) qs.set('state', alert.stateOfPerformance)

  // ✅ paging
  qs.set('limit', String(alert.maxResults || 100))
  qs.set('offset', '0')

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const apiUrl = `${baseUrl}/api/sam?${qs.toString()}`

  const response = await fetch(apiUrl, {
    headers: {
      'User-Agent': 'PreciseGovCon-Cron/1.0',
    },
    cache: 'no-store',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => 'No response body')
    throw new Error(
      `Search API failed (${response.status}): ${text.substring(0, 500)}`
    )
  }

  const data = await response.json()
  return data.opportunitiesData || data.data || data.opportunities || []
}

export async function GET(req: NextRequest) {
  if (!verifyCronSecret(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const results = {
    total: 0,
    sent: 0,
    failed: 0,
    skipped: 0,
    errors: [] as string[],
  }

  try {
    const url = new URL(req.url)
    const onlyAlertId = url.searchParams.get('alertId')

    const alerts = await prisma.search_alerts.findMany({
      where: {
        active: true,
        emailNotification: true,
        frequency: {
          in: ['DAILY', 'WEEKLY', 'MONTHLY'],
        },
        ...(onlyAlertId ? { id: onlyAlertId } : {}),
      },
      include: { users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    results.total = alerts.length
    console.log(`📧 Processing ${alerts.length} alerts at ${now.toISOString()}...`)

    for (const alert of alerts) {
      try {
        const due = shouldRunAlert(alert, now)

        if (!due) {
          results.skipped++
          console.log(`⏭️  Skipping "${alert.name}" (not due yet)`)
          continue
        }

        console.log(`🔍 Running alert "${alert.name}" for ${alert.user.email}...`)

        const searchResults = await runAlertSearch(alert)

        if (searchResults.length > 0 || alert.sendEmptyResults) {
          const recipients = parseRecipients(alert)

          const emailResp = await sendAlertEmail({
            to: recipients, // ✅ multiple recipients
            alertName: alert.name,
            resultCount: searchResults.length,
            results: searchResults,
            alertId: alert.id,
            frequency: alert.frequency,
          })

          // ✅ log provider response so we can confirm delivery
          console.log(`📨 Email provider response for "${alert.name}":`, emailResp)

          results.sent++
          console.log(
            `✅ Sent "${alert.name}" to ${recipients.join(', ')} (${searchResults.length} results)`
          )
        } else {
          results.skipped++
          console.log(`📭 Skipped "${alert.name}" (no results, sendEmptyResults=false)`)
        }

        await prisma.search_alerts.update({
          where: { id: alert.id },
          data: {
            lastRunAt: now,
            lastResultCount: searchResults.length,
            lastError: null,
          },
        })
      } catch (error) {
        results.failed++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`${alert.name}: ${errorMsg}`)

        console.error(`❌ Failed to process alert "${alert.name}":`, error)

        try {
          await prisma.search_alerts.update({
            where: { id: alert.id },
            data: {
              lastError: errorMsg.substring(0, 500),
            },
          })
        } catch (dbError) {
          console.error('Failed to log error to database:', dbError)
        }
      }
    }

    const summary = `✨ Cron job complete: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`
    console.log(summary)

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    })
  } catch (error) {
    console.error('Cron job error:', error)
    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        results,
      },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  return GET(req)
}
