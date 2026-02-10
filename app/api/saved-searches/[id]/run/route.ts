// app/api/saved-searches/[id]/run/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Resend } from 'resend'
import { generateAlertEmailHTML, generateAlertEmailText } from '@/lib/email-templates'

import { randomBytes } from 'crypto'
const resend = new Resend(process.env.RESEND_API_KEY)
const MAX_DATE_RANGE_DAYS = 364

/**
 * Extract first name from various user name formats
 */
function extractFirstName(user: any): string | undefined {
  // Try to get first name from different possible fields
  if (user.firstName) return user.firstName
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

  // Map savedSearchNew fields to SAM.gov API parameters
  if (savedSearch.keywords) params.set('q', savedSearch.keywords)
  if (savedSearch.solicitationNumber) params.set('solnum', savedSearch.solicitationNumber)
  if (savedSearch.noticeId) params.set('noticeid', savedSearch.noticeId)
  if (savedSearch.naics) params.set('naics', savedSearch.naics)
  if (savedSearch.classificationCode) params.set('ccode', savedSearch.classificationCode)
  if (savedSearch.agency) params.set('agency', savedSearch.agency)
  if (savedSearch.organizationCode) params.set('orgcode', savedSearch.organizationCode)
  if (savedSearch.setAside) params.set('setaside', savedSearch.setAside)
  if (savedSearch.stateOfPerformance) params.set('state', savedSearch.stateOfPerformance)
  if (savedSearch.placeOfPerformanceZip) params.set('zip', savedSearch.placeOfPerformanceZip)
  if (savedSearch.opportunityStatus) params.set('status', savedSearch.opportunityStatus)
  if (savedSearch.procurementType) params.set('ptype', savedSearch.procurementType)

  // Date fields
  if (savedSearch.postedAfter) {
    const date = new Date(savedSearch.postedAfter)
    params.set('postedFrom', date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
  }
  if (savedSearch.postedBefore) {
    const date = new Date(savedSearch.postedBefore)
    params.set('postedTo', date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
  }
  if (savedSearch.rdlfrom) {
    const date = new Date(savedSearch.rdlfrom)
    params.set('rdlfrom', date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
  }
  if (savedSearch.rdlto) {
    const date = new Date(savedSearch.rdlto)
    params.set('rdlto', date.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' }))
  }

  // Max results
  if (savedSearch.maxResults) {
    params.set('limit', String(savedSearch.maxResults))
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

  // If both dates are missing, add default range (last 364 days)
  if (!postedFrom || !postedTo) {
    const today = new Date()
    postedTo = today.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

    const pastDate = new Date(today)
    pastDate.setDate(pastDate.getDate() - MAX_DATE_RANGE_DAYS)
    postedFrom = pastDate.toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' })

    adjustedParams.set('postedFrom', postedFrom)
    adjustedParams.set('postedTo', postedTo)

    console.log('📅 Added mandatory date range:', { postedFrom, postedTo })
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
    pastDate.setDate(pastDate.getDate() - MAX_DATE_RANGE_DAYS)
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
  
  try {
    const { id } = await ctx.params

    console.log('🔍 Running search with ID:', id)

    // Auth
    const session = await getServerSession(authOptions)
    const sessionEmail = session?.user?.email || null
    const sessionUserId = (session?.user as any)?.id || null

    console.log('👤 Session user:', sessionEmail, 'User ID:', sessionUserId)

    if (!sessionEmail || !sessionUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const savedSearch = await prisma.saved_searches_new.findUnique({
      where: { id },
      include: { users: true },
    })

    console.log('📋 Saved search found:', savedSearch ? savedSearch.name : 'NOT FOUND')

    if (!savedSearch) {
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 })
    }

    // Ownership check
    const ownsById = !!sessionUserId && savedSearch.userId === sessionUserId
    const ownsByEmail = !!savedSearch.user?.email && savedSearch.user.email === sessionEmail

    if (!ownsById && !ownsByEmail) {
      console.warn('🚫 Saved search ownership mismatch')
      return NextResponse.json({ error: 'Saved search not found' }, { status: 404 })
    }

    console.log('🔍 Running search:', savedSearch.name)

    const searchParams = buildSearchParams(savedSearch)
    const validatedParams = validateAndAdjustDateRange(searchParams)

    // ✅ CREATE ALERT RUN RECORD (status: running)
    alertRun = await prisma.alertRun.create({
      data: {
        searchId: id,
        userId: sessionUserId,
        status: 'running',
        startedAt: new Date(),
        searchParams: validatedParams.toString(),
        emailRecipients: [],
      },
    })

    console.log('📊 Created AlertRun:', alertRun.id)

    validatedParams.set('api_key', process.env.SAM_GOV_API_KEY!)
    if (!validatedParams.has('limit')) validatedParams.set('limit', '100')

    const samUrl = `https://api.sam.gov/prod/opportunities/v2/search?${validatedParams.toString()}`
    console.log('📡 Calling SAM.gov API:', validatedParams.toString())

    const samResponse = await fetch(samUrl, {
      headers: { Accept: 'application/json', 'User-Agent': 'PreciseGovCon/1.0' },
    })

    if (!samResponse.ok) {
      const errorText = await samResponse.text()
      console.error('SAM.gov API error response:', errorText)

      // ✅ UPDATE ALERT RUN (status: failed)
      await prisma.alertRun.update({
        where: { id: alertRun.id },
        data: {
          status: 'failed',
          completedAt: new Date(),
          error: `SAM.gov API error: ${samResponse.status} ${samResponse.statusText}`,
        },
      })

      // ✅ UPDATE SAVED SEARCH
      await prisma.saved_searches_new.update({
        where: { id },
        data: {
          lastRunAt: new Date(),
          lastRunStatus: 'failed',
          totalRuns: { increment: 1 },
        },
      })

      return NextResponse.json(
        {
          error: `SAM.gov API error: ${samResponse.status} ${samResponse.statusText}`,
          details: errorText,
          success: false,
          resultCount: 0,
        },
        { status: 200 }
      )
    }

    const samData = await samResponse.json()
    const opportunities = samData.opportunitiesData || []

    console.log('✅ SAM.gov responded with', opportunities.length, 'opportunities')

    // Email notification logic with personalization
    const shouldSendEmail = savedSearch.subscriptionEnabled || savedSearch.emailNotification
    const hasRecipients = savedSearch.recipients && savedSearch.recipients.trim().length > 0
    const shouldSend = shouldSendEmail && (hasRecipients || savedSearch.user?.email)

    let emailsSentCount = 0
    let emailRecipients: string[] = []

    if (shouldSend) {
      const firstName = extractFirstName(savedSearch.user)
      console.log('👤 Extracted first name:', firstName || 'none')

      // Determine recipients
      let recipients: string[] = []
      if (hasRecipients) {
        recipients = savedSearch.recipients!.split(',').map((e: string) => e.trim()).filter((e: string) => e.length > 0)
      } else if (savedSearch.user?.email) {
        recipients = [savedSearch.user.email]
      }

      console.log('📧 Sending email to:', recipients.join(', '))
      console.log('📊 Results:', opportunities.length)

      // Only send if we have opportunities OR sendEmptyResults is enabled
      if (opportunities.length > 0 || savedSearch.sendEmptyResults) {
        try {
          const emailHtml = generateAlertEmailHTML({
            searchName: savedSearch.name,
            resultCount: opportunities.length,
            opportunities,
            searchParams: {
              keywords: savedSearch.keywords,
              agency: savedSearch.agency,
              naics: savedSearch.naics,
              setAside: savedSearch.setAside,
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
              setAside: savedSearch.setAside,
            },
            runDate: new Date(),
            recipientName: firstName,
          })

          const attachments: any[] = []
          const fmt = savedSearch.exportFormat?.toUpperCase()

          if ((fmt === 'CSV') && opportunities.length > 0) {
            const csvContent = generateCSV(opportunities)
            attachments.push({
              filename: `${savedSearch.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.csv`,
              content: Buffer.from(csvContent).toString('base64'),
            })
          } else if ((fmt === 'JSON') && opportunities.length > 0) {
            const jsonContent = JSON.stringify(opportunities, null, 2)
            attachments.push({
              filename: `${savedSearch.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`,
              content: Buffer.from(jsonContent).toString('base64'),
            })
          }

          // Send to all recipients
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
              console.error('❌ Email sending error:', (emailResult as any).error)
            } else {
              emailsSentCount++
              emailRecipients.push(recipient)
            }
          }
        } catch (emailError) {
          console.error('❌ Failed to send email:', emailError)
        }
      } else {
        console.log('ℹ️ Skipping email: no results and sendEmptyResults is false')
      }
    }

    // ✅ UPDATE ALERT RUN (status: completed)
    await prisma.alertRun.update({
      where: { id: alertRun.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        resultCount: opportunities.length,
        emailsSent: emailsSentCount,
        emailRecipients,
      },
    })

    // ✅ UPDATE SAVED SEARCH with tracking
    await prisma.saved_searches_new.update({
      where: { id },
      data: {
        lastRunAt: new Date(),
        lastRunStatus: 'success',
        lastResultCount: opportunities.length,
        totalRuns: { increment: 1 },
        totalEmailsSent: { increment: emailsSentCount },
        updatedAt: new Date(),
      },
    })

    // Also create SearchRun for backward compatibility
    try {
      await prisma.searchRun.cr
        id: randomBytes(12).toString('hex'),eate({
        data: {
          savedSearchId: id,
          status: 'SUCCESS',
          resultCount: opportunities.length,
          newResultsCount: 0,
          searchParams: validatedParams.toString(),
          resultsSnapshot: opportunities,
          errorMessage: null,
          emailSent: emailsSentCount > 0,
        },
      })
    } catch (runError) {
      console.log('Note: Could not create SearchRun record:', runError instanceof Error ? runError.message : runError)
    }

    return NextResponse.json({
      success: true,
      resultCount: opportunities.length,
      count: opportunities.length,
      opportunities,
      emailsSent: emailsSentCount,
      message: `Search completed successfully. Found ${opportunities.length} opportunities.${emailsSentCount > 0 ? ` Sent ${emailsSentCount} email(s).` : ''}`,
    })
  } catch (error) {
    console.error('❌ Error running saved search:', error)

    // ✅ UPDATE ALERT RUN if it exists (status: failed)
    if (alertRun) {
      try {
        await prisma.alertRun.update({
          where: { id: alertRun.id },
          data: {
            status: 'failed',
            completedAt: new Date(),
            error: error instanceof Error ? error.message : 'Unknown error',
          },
        })

        await prisma.saved_searches_new.update({
          where: { id: alertRun.searchId },
          data: {
            lastRunAt: new Date(),
            lastRunStatus: 'failed',
            totalRuns: { increment: 1 },
          },
        })
      } catch (updateError) {
        console.error('Failed to update AlertRun on error:', updateError)
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to run search',
        details: error instanceof Error ? error.message : 'Unknown error',
        success: false,
        resultCount: 0,
      },
      { status: 500 }
    )
  }
}