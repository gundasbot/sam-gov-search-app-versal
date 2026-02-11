// app/api/cron/send-alerts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAlertEmail } from '@/lib/email/alerts'

// Verify cron secret for security
function verifyCronSecret(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn('??  CRON_SECRET not set - cron endpoint is unprotected!')
    return process.env.NODE_ENV === 'development'
  }

  return authHeader === `Bearer ${cronSecret}`
}

function parseRecipients(alert: any): string[] {
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

  if (alert?.users?.email) out.push(alert.users.email)

  return Array.from(new Set(out))
}

function toISODateString(d: Date) {
  return d.toISOString().split('T')[0]
}

function defaultPostedRangeIfMissing(alert: any) {
  const now = new Date()
  const from = new Date(now)
  from.setDate(from.getDate() - 30)

  const postedFrom = alert.posted_after
    ? toISODateString(new Date(alert.posted_after))
    : toISODateString(from)

  const postedTo = alert.posted_before
    ? toISODateString(new Date(alert.posted_before))
    : toISODateString(now)

  return { postedFrom, postedTo }
}

function shouldRunAlert(alert: any, now: Date): boolean {
  const lastRun = alert.last_run_at ? new Date(alert.last_run_at) : null
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

  const { postedFrom, postedTo } = defaultPostedRangeIfMissing(alert)
  qs.set('postedFrom', postedFrom)
  qs.set('postedTo', postedTo)

  qs.set('ptype', alert.procurementType || 'o')

  if (alert.keywords) qs.set('keywords', alert.keywords)
  if (alert.naics) qs.set('naics', alert.naics)
  if (alert.agency) qs.set('agency', alert.agency)
  if (alert.setAside) qs.set('setAside', alert.setAside)
  if (alert.stateOfPerformance) qs.set('state', alert.stateOfPerformance)

  qs.set('limit', String(alert.max_results || 100))
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
        email_notification: true,
        frequency: {
          in: ['DAILY', 'WEEKLY', 'MONTHLY'],
        },
        ...(onlyAlertId ? { id: onlyAlertId } : {}),
      },
      include: { 
        users: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    })

    results.total = alerts.length
    console.log(`?? Processing ${alerts.length} alerts at ${now.toISOString()}...`)

    for (const alert of alerts) {
      try {
        const due = shouldRunAlert(alert, now)

        if (!due) {
          results.skipped++
          console.log(`??  Skipping "${alert.name}" (not due yet)`)
          continue
        }

        console.log(`?? Running alert "${alert.name}" for ${alert.users.email}...`)

        const searchResults = await runAlertSearch(alert)

        if (searchResults.length > 0 || alert.send_empty_results) {
          const recipients = parseRecipients(alert)

          const emailResp = await sendAlertEmail({
            to: recipients,
            alertName: alert.name,
            resultCount: searchResults.length,
            results: searchResults,
            alert_id: alert.id,
            frequency: alert.frequency,
          })

          console.log(`?? Email provider response for "${alert.name}":`, emailResp)

          results.sent++
          console.log(
            `? Sent "${alert.name}" to ${recipients.join(', ')} (${searchResults.length} results)`
          )
        } else {
          results.skipped++
          console.log(`?? Skipped "${alert.name}" (no results, sendEmptyResults=false)`)
        }

        await prisma.search_alerts.update({
          where: { id: alert.id },
          data: {
            last_run_at: now,
            last_result_count: searchResults.length,
            last_error: null,
          },
        })
      } catch (error) {
        results.failed++
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        results.errors.push(`${alert.name}: ${errorMsg}`)

        console.error(`? Failed to process alert "${alert.name}":`, error)

        try {
          await prisma.search_alerts.update({
            where: { id: alert.id },
            data: {
              last_error: errorMsg.substring(0, 500),
            },
          })
        } catch (dbError) {
          console.error('Failed to log error to database:', dbError)
        }
      }
    }

    const summary = `? Cron job complete: ${results.sent} sent, ${results.skipped} skipped, ${results.failed} failed`
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