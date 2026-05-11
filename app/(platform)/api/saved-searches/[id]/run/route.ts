// app/api/saved-searches/[id]/run/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { generateAlertEmailHTML, generateAlertEmailText } from '@/lib/email-templates'
import { generateExcel, generateTXT } from '@/lib/export'
import { coalesceInFlight } from '@/lib/in-flight-coalescer'
import { resolveSamUrl } from '@/lib/samgov-api'

import { randomBytes } from 'crypto'
const resend = new Resend(process.env.RESEND_API_KEY)
const MAX_DATE_RANGE_DAYS = 364      // SAM.gov hard limit
const DEFAULT_DATE_RANGE_DAYS = 182  // 6-month rolling default when no dates saved

/**
 * Extract first name from various user name formats
 */
function extractFirstName(user: any): string | undefined {
  // Try to get first name from different possible fields
  if (user.first_name) return user.first_name
  if (user.first_name) return user.first_name
  
  // Try to extract from full name
  if (user.name) {
    const nameParts = user.name.trim().split(' ')
    return nameParts[0]
  }
  
  // Try to extract from email if nothing else available
  if (user.email) {
    const emailUsername = user.email.split('@')[0]
    // Capitalize first letter
    return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1).toLowerCase()
  }
  
  return undefined
}

/**
 * Build SAM.gov search params from savedSearchNew fields
 */
function buildSearchParams(savedSearch: any): URLSearchParams {
  const params = new URLSearchParams()

  if (savedSearch.keywords) params.set('q', savedSearch.keywords)
  if (savedSearch.solicitation_number) params.set('solnum', savedSearch.solicitation_number)
  if (savedSearch.noticeId) params.set('noticeid', savedSearch.noticeId)
  if (savedSearch.naics) params.set('naics', savedSearch.naics)
  if (savedSearch.classification_code) params.set('ccode', savedSearch.classification_code)
  if (savedSearch.agency) params.set('agency', savedSearch.agency)
  if (savedSearch.organization_code) params.set('orgcode', savedSearch.organization_code)
  if (savedSearch.set_aside) params.set('setaside', savedSearch.set_aside)
  if (savedSearch.state_of_performance) params.set('state', savedSearch.state_of_performance)
  if (savedSearch.place_of_performance_zip) params.set('zip', savedSearch.place_of_performance_zip)
  if (savedSearch.opportunity_status) params.set('status', savedSearch.opportunity_status)
  if (savedSearch.procurement_type) params.set('ptype', savedSearch.procurement_type)

  if (savedSearch.posted_after) {
    const date = new Date(savedSearch.posted_after)
    params.set('postedFrom', date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
  }
  if (savedSearch.posted_before) {
    const date = new Date(savedSearch.posted_before)
    params.set('postedTo', date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
  }
  if (savedSearch.rdl_from) {
    const date = new Date(savedSearch.rdl_from)
    params.set('rdlfrom', date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
  }
  if (savedSearch.rdl_to) {
    const date = new Date(savedSearch.rdl_to)
    params.set('rdlto', date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
  }

  if (savedSearch.max_results) {
    params.set('limit', String(savedSearch.max_results))
  }

  return params
}

/**
 * Validates and adjusts date ranges to comply with SAM.gov's 364-day limit
 */
function validateAndAdjustDateRange(params: URLSearchParams): URLSearchParams {
  const adjustedParams = new URLSearchParams(params)

  let postedFrom = adjustedParams.get('postedFrom')
  let postedTo = adjustedParams.get('postedTo')

  if (!postedFrom || !postedTo) {
    const today = new Date()
    postedTo = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - DEFAULT_DATE_RANGE_DAYS)
    postedFrom = pastDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

    adjustedParams.set('postedFrom', postedFrom)
    adjustedParams.set('postedTo', postedTo)

    console.log('📅 Added mandatory date range (6-month default):', { postedFrom, postedTo })
    return adjustedParams
  }

  const parseDate = (dateStr: string): Date | null => {
    try {
      const [month, day, year] = dateStr.split('/').map(Number)
      if (!month || !day || !year) return null
      return new Date(year, month - 1, day)
    } catch {
      return null
    }
  }

  const fromDate = parseDate(postedFrom)
  const toDate = parseDate(postedTo)

  if (!fromDate || !toDate) {
    console.error('❌ Invalid date format:', { postedFrom, postedTo })
    const today = new Date()
    postedTo = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - DEFAULT_DATE_RANGE_DAYS)
    postedFrom = pastDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

    adjustedParams.set('postedFrom', postedFrom)
    adjustedParams.set('postedTo', postedTo)
    return adjustedParams
  }

  const daysDiff = Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24))

  console.log('📅 Date range check:', { postedFrom, postedTo, daysDiff, maxAllowed: MAX_DATE_RANGE_DAYS })

  if (daysDiff > MAX_DATE_RANGE_DAYS) {
    const adjustedFrom = new Date(toDate)
    adjustedFrom.setDate(adjustedFrom.getDate() - MAX_DATE_RANGE_DAYS)

    postedFrom = adjustedFrom.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })
    adjustedParams.set('postedFrom', postedFrom)

    console.log('⚠️ Date range exceeded limit, adjusted:', {
      original: params.get('postedFrom'),
      adjusted: postedFrom,
      daysDiff,
      newDaysDiff: MAX_DATE_RANGE_DAYS,
    })
  }

  return adjustedParams
}

/**
 * Generates CSV content from opportunities
 */
function generateCSV(opportunities: any[]): string {
  if (opportunities.length === 0) return 'No opportunities found'

  const headers = [
    'Notice ID',
    'Title',
    'Type',
    'Department',
    'Posted Date',
    'Response Deadline',
    'Set-Aside',
    'NAICS Code',
    'Solicitation Number',
    'Link',
  ]

  const rows = opportunities.map((opp) => [
    opp.noticeId || '',
    (opp.title || '').replace(/"/g, '""'),
    opp.type || '',
    (opp.department?.name || opp.fullParentPathName || '').replace(/"/g, '""'),
    opp.postedDate || '',
    opp.responseDeadLine || '',
    (opp.typeOfSetAsideDescription || '').replace(/"/g, '""'),
    opp.naicsCode || '',
    opp.solicitationNumber || '',
    opp.uiLink || '',
  ])

  return [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
  ].join('\n')
}

export async function POST(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  let alertRun: any = null
  let savedSearchId: string | null = null
  
  try {
    const { id } = await ctx.params
    savedSearchId = id

    let overrideRecipients: string[] | undefined
    let overrideFormat: string | undefined
    try {
      const body = await _request.json()
      if (Array.isArray(body?.overrideRecipients)) {
        overrideRecipients = body.overrideRecipients.filter((e: any) => typeof e === 'string' && e.includes('@'))
      }
      if (typeof body?.overrideFormat === 'string') {
        overrideFormat = body.overrideFormat.toUpperCase()
      }
    } catch { /* body is optional */ }

    console.log('🔍 Running search with ID:', id)

    const session = await getServerSession(authOptions)
    const sessionEmail = session?.user?.email || null
    const sessionUserId = (session?.user as any)?.id || null

    console.log('👤 Session user:', sessionEmail, 'User ID:', sessionUserId)

    if (!sessionEmail || !sessionUserId) {
      return NextResponse.json({ error_message: 'Unauthorized' }, { status: 401 })
    }

    const savedSearch = await prisma.saved_searches_new.findUnique({
      where: { id },
      include: { users: true },
    })

    console.log('📋 Saved search found:', savedSearch ? savedSearch.name : 'NOT FOUND')

    if (!savedSearch) {
      return NextResponse.json({ error_message: 'Saved search not found' }, { status: 404 })
    }

    const ownsById = !!sessionUserId && savedSearch.user_id === sessionUserId
    const ownsByEmail = !!savedSearch.users?.email && savedSearch.users.email === sessionEmail

    if (!ownsById && !ownsByEmail) {
      console.warn('🚫 Saved search ownership mismatch')
      return NextResponse.json({ error_message: 'Saved search not found' }, { status: 404 })
    }

    console.log('🔍 Running search:', savedSearch.name)

    const searchParams = buildSearchParams(savedSearch)
    const validatedParams = validateAndAdjustDateRange(searchParams)

    alertRun = await prisma.search_runs.create({
      data: {
        id: crypto.randomUUID(),
        saved_search_id: id,
        created_at: new Date(),
        search_params: validatedParams.toString(),
        results_snapshot: {},
      },
    })

    console.log('📊 Created AlertRun:', alertRun.id)

    validatedParams.set('api_key', process.env.SAM_GOV_API_KEY!)
    if (!validatedParams.has('limit')) validatedParams.set('limit', '100')

    const { url: samUrl, extraHeaders: samHeaders } = resolveSamUrl(`https://api.sam.gov/prod/opportunities/v2/search?${validatedParams.toString()}`)
    console.log('📡 Calling SAM.gov API:', validatedParams.toString())

    const samData = await coalesceInFlight<any>(
      `sam:saved-search-run:${validatedParams.toString().replace(/api_key=[^&]+/, 'api_key=KEY')}`,
      async () => {
        const samResponse = await fetch(samUrl, {
          headers: { Accept: 'application/json', 'User-Agent': 'PreciseGovCon/1.0', ...samHeaders },
        })

        if (!samResponse.ok) {
          const errorText = await samResponse.text()
          console.error('SAM.gov API error response:', errorText)

          await prisma.search_runs.update({
            where: { id: alertRun.id },
            data: {
              error_message: `SAM.gov API error: ${samResponse.status} ${samResponse.statusText}`,
            },
          })

          await prisma.saved_searches_new.update({
            where: { id },
            data: { lastRunAt: new Date() },
          })

          throw new Error(`SAM.gov API error: ${samResponse.status} ${samResponse.statusText}`)
        }

        return await samResponse.json()
      }
    )
    const opportunities = samData.opportunitiesData || []

    console.log('✅ SAM.gov responded with', opportunities.length, 'opportunities')

    const isOverrideShare = overrideRecipients && overrideRecipients.length > 0
    const shouldSendEmail = isOverrideShare || savedSearch.subscription_enabled || savedSearch.email_notification
    const hasRecipients = isOverrideShare || (savedSearch.recipients && savedSearch.recipients.trim().length > 0)
    const shouldSend = shouldSendEmail && (hasRecipients || savedSearch.users?.email)

    let emailsSentCount = 0
    let resultsSnapshot: string[] = []

    if (shouldSend) {
      const firstName = extractFirstName(savedSearch.users)
      console.log('👤 Extracted first name:', firstName || 'none')

      let recipients: string[] = []
      if (isOverrideShare) {
        recipients = overrideRecipients!
      } else if (hasRecipients) {
        recipients = savedSearch.recipients!.split(',').map((e: string) => e.trim()).filter((e: string) => e.length > 0)
      } else if (savedSearch.users?.email) {
        recipients = [savedSearch.users.email]
      }

      console.log('📧 Sending email to:', recipients.join(', '))
      console.log('📊 Results:', opportunities.length)

      if (opportunities.length > 0 || savedSearch.send_empty_results) {
        try {
          const emailHtml = generateAlertEmailHTML({
            searchName: savedSearch.name,
            resultCount: opportunities.length,
            opportunities,
            searchParams: {
              keywords: savedSearch.keywords,
              agency: savedSearch.agency,
              naics: savedSearch.naics,
              setAside: savedSearch.set_aside,
            },
            runDate: new Date(),
            recipientName: firstName,
          })

          const emailText = generateAlertEmailText({
            searchName: savedSearch.name,
            resultCount: opportunities.length,
            opportunities,
            searchParams: {
              keywords: savedSearch.keywords,
              agency: savedSearch.agency,
              naics: savedSearch.naics,
              setAside: savedSearch.set_aside,
            },
            runDate: new Date(),
            recipientName: firstName,
          })

          const attachments: any[] = []
          const fmt = (overrideFormat ?? savedSearch.export_format)?.toUpperCase()
          const safeName = savedSearch.name.replace(/[^a-z0-9]/gi, '_')

          if (fmt && fmt !== 'NONE' && opportunities.length > 0) {
            if (fmt === 'CSV') {
              attachments.push({
                filename: `${safeName}_${Date.now()}.csv`,
                content: Buffer.from(generateCSV(opportunities)).toString('base64'),
              })
            } else if (fmt === 'EXCEL' || fmt === 'EXCEL_COMPACT') {
              const xlsBuf = await generateExcel(opportunities)
              attachments.push({
                filename: `${safeName}_${Date.now()}.xlsx`,
                content: xlsBuf,
              })
            } else if (fmt === 'TXT') {
              attachments.push({
                filename: `${safeName}_${Date.now()}.txt`,
                content: Buffer.from(generateTXT(opportunities)).toString('base64'),
              })
            } else if (fmt === 'JSON') {
              attachments.push({
                filename: `${safeName}_${Date.now()}.json`,
                content: Buffer.from(JSON.stringify(opportunities, null, 2)).toString('base64'),
              })
            }
          }

          for (const recipient of recipients) {
            const emailResult = await resend.emails.send({
              from: process.env.EMAIL_FROM || 'alerts@precisegov.com',
              to: recipient,
              subject: `${opportunities.length > 0 ? `${opportunities.length} New` : 'No'} Opportunities: ${savedSearch.name}`,
              html: emailHtml,
              text: emailText,
              attachments: attachments.length > 0 ? attachments : undefined,
            })

            console.log('✅ Alert email sent to', recipient, ':', emailResult)
            if ((emailResult as any)?.error) {
              console.error('❌ Email sending error: ', (emailResult as any).error)
            } else {
              emailsSentCount++
            }
          }
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError)
        }
      } else {
        console.log('ℹ️ Skipping email: no results and sendEmptyResults is false')
      }
    }

    await prisma.search_runs.update({
      where: { id: alertRun.id },
      data: {
        result_count: opportunities.length,
        email_sent: (emailsSentCount > 0),
      },
    })

    await prisma.saved_searches_new.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        last_result_count: opportunities.length,
        totalEmailsSent: { increment: emailsSentCount },
        updated_at: new Date(),
      },
    })

    try {
      await prisma.search_runs.create({
        data: {
          id: crypto.randomUUID(),
          saved_search_id: id,
          result_count: opportunities.length,
          new_results_count: 0,
          search_params: validatedParams.toString(),
          results_snapshot: opportunities,
          error_message: null,
          email_sent: emailsSentCount > 0,
          created_at: new Date(),
        },
      })
    } catch (runError) {
      console.log('Note: Could not create SearchRun record:', runError instanceof Error ? runError.message : runError)
    }

    return NextResponse.json({
      success: true,
      result_count: opportunities.length,
      count: opportunities.length,
      opportunities,
      email_sent: emailsSentCount > 0,
      message: `Search completed successfully. Found ${opportunities.length} opportunities.${emailsSentCount > 0 ? ` Sent ${emailsSentCount} email(s).` : ''}`,
    })
  } catch (error) {
    console.error('❌ Error running saved search:', error)

    if (alertRun) {
      try {
        await prisma.search_runs.update({
          where: { id: alertRun.id },
          data: {
            error_message: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        if (savedSearchId) {
          await prisma.saved_searches_new.update({
            where: { id: savedSearchId },
            data: { lastRunAt: new Date() },
          })
        }
      } catch (updateError) {
        console.error('Failed to update AlertRun on error: ', updateError)
      }
    }

    return NextResponse.json(
      {
        error_message: 'Failed to run search',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        result_count: 0,
      },
      { status: 500 }
    )
  }
}
