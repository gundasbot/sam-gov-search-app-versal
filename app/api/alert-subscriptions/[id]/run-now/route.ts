// app/api/alert-subscriptions/[id]/run-now/route.ts
// POST /api/alert-subscriptions/[id]/run-now
// Manually runs an alert: queries SAM.gov, sends email, logs the run

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendAlertEmail } from '@/lib/email'
import { generateEnhancedCSV } from '@/lib/csv-export-enhanced'
import { generateExcel, generateExcelBinary, generateTXT, generateXLSB } from '@/lib/export'
import { randomBytes } from 'crypto'

// ─── Helpers ──────────────────────────────────────────────────────────────────
const ALERT_PARAMS_MARKER = '__ALERT_PARAMS__:'
const SAM_SEARCH_BASE =
  process.env.SAM_UPSTREAM_BASE ||
  'https://api.sam.gov/prod/opportunities/v2/search'

function getSamApiKey(): string {
  return (
    process.env.SAM_GOV_API_KEY ||
    process.env.SAM_API_KEY ||
    process.env.SAMGOV_API_KEY ||
    process.env.SAMGOVAPIKEY ||
    process.env.SAM_APIKEY ||
    ''
  )
}

function toSamGovDate(v: Date | string | null | undefined): string {
  if (!v) return ''
  const s = String(v).trim()
  if (!s) return ''
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
  const date = v instanceof Date ? v : new Date(s)
  if (isNaN(date.getTime())) return s
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${date.getFullYear()}`
}

function parseJson(raw: string | null): Record<string, any> {
  if (!raw) return {}
  try { return JSON.parse(raw) } catch { return {} }
}

function parseAlertDescription(raw: unknown): { params: Record<string, any> } {
  if (typeof raw !== 'string' || !raw.trim()) return { params: {} }
  const source = raw.trim()
  const markerIndex = source.lastIndexOf(ALERT_PARAMS_MARKER)
  if (markerIndex < 0) return { params: {} }

  const jsonPart = source.slice(markerIndex + ALERT_PARAMS_MARKER.length).trim()
  try {
    const parsed = JSON.parse(jsonPart)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { params: parsed as Record<string, any> }
    }
  } catch {
    // no-op: just return empty params
  }
  return { params: {} }
}

function parseRecipients(raw: string | null): string[] {
  if (!raw) return []
  // Could be JSON array of recipient objects or comma-separated emails
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) {
      return parsed
        .flatMap((r: any) => [r.email, r.phone].filter(Boolean))
        .filter((v: string) => v.includes('@')) // only emails for now
    }
  } catch { /* fall through to comma split */ }
  return raw.split(',').map(e => e.trim()).filter(Boolean)
}

// ─── POST ─────────────────────────────────────────────────────────────────────

async function buildAttachment(
  alertName: string,
  format: string | undefined,
  opportunities: any[],
  params: { keyword: string; naics: string; agency: string; setAside: string },
): Promise<{ file_name: string; content: string | Buffer } | undefined> {
  const fmt = (format || 'CSV').toUpperCase().replace(/\s+/g, '_')
  if (fmt === 'NONE') return undefined

  const dateStr = new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }).replace(/\//g, '-')
  const safeName = alertName.replace(/[^a-zA-Z0-9 _-]/g, '').trim()

  switch (fmt) {
    case 'EXCEL':
      return { file_name: `${safeName} ${dateStr}.xlsx`, content: await generateExcel(opportunities) }

    case 'EXCEL_COMPACT':
    case 'EXCEL_(COMPACT)':
      return { file_name: `${safeName} ${dateStr}.xlsx`, content: await generateExcelBinary(opportunities) }

    case 'XLSB':
      return { file_name: `${safeName} ${dateStr}.xlsb`, content: generateXLSB(opportunities) }

    case 'TXT':
      return { file_name: `${safeName} ${dateStr}.txt`, content: generateTXT(opportunities) }

    default: // CSV
      return {
        file_name: `${safeName} ${dateStr}.csv`,
        content: generateEnhancedCSV({
          searchName: alertName,
          result_count: opportunities.length,
          search_params: {
            keywords: params.keyword || undefined,
            naics: params.naics || undefined,
            agency: params.agency || undefined,
            setAside: params.setAside || undefined,
          },
          opportunities,
          runDate: new Date(),
        }),
      }
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the alert subscription
    const alert = await prisma.alert_subscriptions.findFirst({
      where: { id, user_id: session.user.id },
      include: {
        users: {
          select: { id: true, email: true, name: true, first_name: true },
        },
        saved_searches_v2: true,
      },
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    // Parse optional body — sendEmailNow, runId, formats[], overrideRecipients[]
    let sendEmailNow = true
    let runId: string | undefined
    let requestFormats: string[] | null = null
    let overrideRecipients: string[] = []
    try {
      const body = await req.json()
      if (body?.sendEmailNow === false) sendEmailNow = false
      if (typeof body?.runId === 'string' && body.runId) runId = body.runId
      if (Array.isArray(body?.formats) && body.formats.length > 0) {
        requestFormats = body.formats.map((f: any) => String(f))
      }
      if (Array.isArray(body?.overrideRecipients)) {
        overrideRecipients = body.overrideRecipients.map((e: any) => String(e)).filter((e: string) => e.includes('@'))
      }
    } catch { /* body is optional */ }

    // ── runId fast-path: use stored results to send email only ───────────────
    if (runId && sendEmailNow) {
      const storedRun = await prisma.subscription_runs.findFirst({
        where: { id: runId, subscription_id: id },
        select: { results_snapshot: true, result_count: true, search_params: true },
      })
      const storedOpps: any[] = Array.isArray(storedRun?.results_snapshot) ? storedRun!.results_snapshot as any[] : []
      const storedCount = storedRun?.result_count ?? storedOpps.length
      const storedParams = storedRun?.search_params as any || {}

      let emailSent = false
      if (storedOpps.length > 0 || alert.send_empty_results) {
        const storedEmails = parseRecipients(alert.recipients)
        const recipientEmails = Array.from(new Set([...storedEmails, ...overrideRecipients]))
        if (recipientEmails.length > 0) {
          const kw2 = storedParams.keyword || storedParams.keywords || storedParams.title || ''
          const nc2 = storedParams.ncode || storedParams.naics || ''
          const ag2 = storedParams.deptname || storedParams.agency || storedParams.organizationName || ''
          const sa2 = Array.isArray(storedParams.setAsides) ? storedParams.setAsides.join(',') : (storedParams.typeOfSetAside || storedParams.setAside || '')
          const searchCriteria: Array<{ label: string; value: string }> = []
          if (kw2) searchCriteria.push({ label: 'Keywords', value: kw2 })
          if (nc2) searchCriteria.push({ label: 'NAICS', value: nc2 })
          if (ag2) searchCriteria.push({ label: 'Agency', value: ag2 })
          if (sa2) searchCriteria.push({ label: 'Set-Aside', value: sa2 })
          const topResults = storedOpps.slice(0, 10).map((opp: any) => ({
            title: opp.title || 'Untitled Opportunity',
            agency: opp.department || opp.organizationName || opp.agency || 'Unknown',
            solicitationNumber: opp.solicitationNumber || opp.noticeId || '',
            naics: opp.naicsCode || (opp.naics?.[0]) || '',
            responseDeadline: opp.responseDeadLine || opp.archiveDate || '',
            url: opp.uiLink || `https://sam.gov/opp/${opp.noticeId || ''}`,
          }))
          const formatsToUse: string[] = requestFormats ?? (storedParams.format ? [storedParams.format] : ['CSV'])
          const builtAttachments = (
            await Promise.all(
              formatsToUse.map(fmt => buildAttachment(alert.name, fmt, storedOpps, { keyword: kw2, naics: nc2, agency: ag2, setAside: sa2 }))
            )
          ).filter((a): a is NonNullable<typeof a> => a != null)
          try {
            await sendAlertEmail({
              to: recipientEmails,
              searchName: alert.name,
              totalResults: storedCount,
              searchCriteria,
              topResults,
              attachments: builtAttachments.length > 0 ? builtAttachments : undefined,
            })
            emailSent = true
            console.log('✅ Email sent from stored results')
          } catch (emailErr) {
            console.error('❌ Email failed (non-fatal):', emailErr)
          }
        }
      }
      return NextResponse.json({ ok: true, alertId: alert.id, alertName: alert.name, runId, status: 'SUCCESS', resultCount: storedCount, emailSent })
    }

    console.log('🔔 Running alert:', alert.name)

    // Parse stored search params from linked saved search + embedded alert params.
    let searchParams: Record<string, any> = {}

    const savedSearch = alert.saved_searches_v2
    if (savedSearch) {
      searchParams = {
        keyword: savedSearch.keywords,
        naics: savedSearch.naics,
        agency: savedSearch.agency,
        setAside: savedSearch.set_aside,
        state: savedSearch.state_of_performance,
        ptype: savedSearch.procurement_type,
        postedAfter: savedSearch.posted_after,
        postedBefore: savedSearch.posted_before,
      }
    }

    // Legacy params payload support.
    const legacyParams = parseJson((alert as any).params)
    const embeddedParams = parseAlertDescription(alert.description).params
    searchParams = { ...searchParams, ...embeddedParams, ...legacyParams }
    searchParams.format = searchParams.format || alert.export_format || 'CSV'

    // ── Build SAM.gov request ────────────────────────────────────────────────
    const samUrl = new URL(SAM_SEARCH_BASE)

    // Keyword / title
    const keyword = searchParams.keyword || searchParams.keywords || searchParams.title || ''
    if (keyword) samUrl.searchParams.set('title', keyword)

    // NAICS
    const naics = searchParams.ncode || searchParams.naics || ''
    if (naics) samUrl.searchParams.set('ncode', naics)

    // PSC / classification code
    const ccode = searchParams.ccode || searchParams.classificationCode || ''
    if (ccode) samUrl.searchParams.set('ccode', ccode)

    // Agency / organization
    const agency = searchParams.deptname || searchParams.agency || searchParams.organizationName || ''
    if (agency) samUrl.searchParams.set('organizationName', agency)

    // Set-asides (can be array or comma string)
    const setAside = Array.isArray(searchParams.setAsides)
      ? searchParams.setAsides.join(',')
      : (searchParams.typeOfSetAside || searchParams.setAside || '')
    if (setAside) samUrl.searchParams.set('typeOfSetAside', setAside)

    // States (can be array or comma string)
    const state = Array.isArray(searchParams.states)
      ? searchParams.states.join(',')
      : (searchParams.state || searchParams.state_of_performance || '')
    if (state) samUrl.searchParams.set('state', state)

    // Procurement types
    const ptype = Array.isArray(searchParams.ptypes)
      ? searchParams.ptypes.join(',')
      : (searchParams.ptype || searchParams.procurement_type || '')
    if (ptype) samUrl.searchParams.set('ptype', ptype)

    // Solicitation number
    if (searchParams.solnum || searchParams.solicitationNumber) {
      samUrl.searchParams.set('solnum', searchParams.solnum || searchParams.solicitationNumber)
    }

    // Date filters
    const requestedPostedFrom = searchParams.postedFrom || searchParams.posted_after || ''
    const requestedPostedTo = searchParams.postedTo || searchParams.rdlto || searchParams.posted_before || ''
    const fallbackWindowDays = Number(process.env.SAM_ALERT_DEFAULT_WINDOW_DAYS || 182) || 182
    const fallbackToDate = new Date()
    const fallbackFromDate = new Date(fallbackToDate)
    fallbackFromDate.setDate(fallbackFromDate.getDate() - fallbackWindowDays)
    const normalizedPostedFrom = requestedPostedFrom
      ? toSamGovDate(requestedPostedFrom)
      : toSamGovDate(fallbackFromDate)
    const normalizedPostedTo = requestedPostedTo
      ? toSamGovDate(requestedPostedTo)
      : toSamGovDate(fallbackToDate)

    samUrl.searchParams.set('postedFrom', normalizedPostedFrom)
    samUrl.searchParams.set('postedTo', normalizedPostedTo)

    // Limit & API key
    samUrl.searchParams.set('limit', String(alert.max_results || 100))
    const samApiKey = getSamApiKey()
    if (samApiKey) samUrl.searchParams.set('api_key', samApiKey)

    const logQuery = new URLSearchParams(samUrl.searchParams)
    if (logQuery.has('api_key')) logQuery.set('api_key', '***')
    console.log('📡 SAM.gov query:', logQuery.toString())

    // ── Execute SAM.gov search ───────────────────────────────────────────────
    let opportunities: any[] = []
    let resultCount = 0
    let errorMessage: string | null = null

    try {
      if (!samApiKey) {
        throw new Error('Missing SAM.gov API key (set SAM_GOV_API_KEY, SAM_API_KEY, or SAMGOVAPIKEY in .env.local)')
      }

      const samResponse = await fetch(samUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
        signal: AbortSignal.timeout(30000),
      })

      if (!samResponse.ok) {
        const errText = await samResponse.text()
        console.error('SAM.gov error:', errText)
        throw new Error(`SAM.gov ${samResponse.status}: ${samResponse.statusText}`)
      }

      const samData = await samResponse.json()
      opportunities = samData.opportunitiesData || []
      resultCount = opportunities.length
      console.log(`✅ SAM.gov returned ${resultCount} results`)
    } catch (apiErr) {
      errorMessage = apiErr instanceof Error ? apiErr.message : 'SAM.gov request failed'
      console.error('SAM.gov error:', apiErr)
    }

    // ── Log the run in subscription_runs ────────────────────────────────────
    const runRecord = await prisma.subscription_runs.create({
      data: {
        id: randomBytes(12).toString('hex'),
        subscription_id: alert.id,
        status: errorMessage ? 'ERROR' : 'SUCCESS',
        result_count: resultCount,
        new_results_count: resultCount,
        search_params: {
          keyword, naics, ccode, agency, setAside, state, ptype,
          postedFrom: normalizedPostedFrom,
          postedTo: normalizedPostedTo,
        },
        results_snapshot: opportunities,
        error_message: errorMessage,
      },
    })

    // ── Update alert last_run metadata ───────────────────────────────────────
    await prisma.alert_subscriptions.update({
      where: { id: alert.id },
      data: {
        last_run_at: new Date(),
        last_result_count: resultCount,
        last_error: errorMessage,
        updated_at: new Date(),
      },
    })

    // ── Send email notification (only when sendEmailNow = true) ──────────────
    let emailSent = false
    const shouldSendEmail = sendEmailNow && (resultCount > 0 || alert.send_empty_results)

    if (alert.email_notification && shouldSendEmail) {
      // Resolve recipient emails from recipients field
      const storedEmails = parseRecipients(alert.recipients)
      // Merge stored + any one-time override emails (deduplicated)
      const recipientEmails = Array.from(new Set([...storedEmails, ...overrideRecipients]))

      if (recipientEmails.length > 0) {
        try {
          console.log(`📧 Sending to: ${recipientEmails.join(', ')}`)

          // Build criteria summary for email
          const searchCriteria: Array<{ label: string; value: string }> = []
          if (keyword) searchCriteria.push({ label: 'Keywords', value: keyword })
          if (naics) searchCriteria.push({ label: 'NAICS', value: naics })
          if (agency) searchCriteria.push({ label: 'Agency', value: agency })
          if (setAside) searchCriteria.push({ label: 'Set-Aside', value: setAside })
          if (state) searchCriteria.push({ label: 'State', value: state })
          if (ptype) searchCriteria.push({ label: 'Type', value: ptype })

          // Format top results for email
          const topResults = opportunities.slice(0, 10).map((opp: any) => ({
            title: opp.title || 'Untitled Opportunity',
            agency: opp.department || opp.organizationName || opp.agency || 'Unknown',
            solicitationNumber: opp.solicitationNumber || opp.noticeId || '',
            naics: opp.naicsCode || (opp.naics?.[0]) || '',
            responseDeadline: opp.responseDeadLine || opp.archiveDate || '',
            url: opp.uiLink || `https://sam.gov/opp/${opp.noticeId || ''}`,
          }))

          // Determine which formats to generate attachments for
          // Use requestFormats from body if provided, else fall back to stored format
          const formatsToUse: string[] = requestFormats ?? (searchParams.format ? [searchParams.format] : ['CSV'])
          const attachmentParams = { keyword, naics, agency, setAside }

          // Build all requested attachments (skip NONE entries)
          const builtAttachments = (
            await Promise.all(
              formatsToUse.map(fmt => buildAttachment(alert.name, fmt, opportunities, attachmentParams))
            )
          ).filter((a): a is NonNullable<typeof a> => a != null)

          console.log(`📎 Attachments: ${builtAttachments.map(a => a.file_name).join(', ') || 'none'}`)

          await sendAlertEmail({
            to: recipientEmails,
            searchName: alert.name,
            totalResults: resultCount,
            searchCriteria,
            topResults,
            attachments: builtAttachments.length > 0 ? builtAttachments : undefined,
          })

          emailSent = true
          console.log('✅ Email sent')
        } catch (emailErr) {
          console.error('❌ Email failed (non-fatal):', emailErr)
        }
      } else {
        console.log('📭 No valid recipient emails found')
      }
    } else {
      console.log(`📭 Skipping email: email_notification=${alert.email_notification}, results=${resultCount}, sendEmpty=${alert.send_empty_results}`)
    }

    return NextResponse.json({
      ok: true,
      alertId: alert.id,
      alertName: alert.name,
      runId: runRecord.id,
      status: errorMessage ? 'ERROR' : 'SUCCESS',
      resultCount,
      emailSent,
      error: errorMessage,
    })
  } catch (error) {
    console.error('[POST run-now]', error)
    return NextResponse.json({ error: 'Failed to run alert' }, { status: 500 })
  }
}
