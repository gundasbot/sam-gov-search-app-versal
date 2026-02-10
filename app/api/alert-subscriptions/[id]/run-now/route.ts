// app/api/alert-subscriptions/[id]/run-now/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendAlertEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

// Date converter for SAM.gov format
function toSamGovDate(v: Date | string | null) {
  if (!v) return ''
  const s = String(v).trim()
  if (!s) return ''

  // already in MM/dd/yyyy
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s

  // ISO YYYY-MM-DD or Date object
  const date = v instanceof Date ? v : new Date(s)
  if (isNaN(date.getTime())) return s

  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const yyyy = date.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

// POST /api/alert-subscriptions/[id]/run-now - Manually run an alert subscription
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the subscription (saved search) with user data
    const subscription = await prisma.saved_searches_new.findFirst({
      where: {
        id,
        user_id: session.user.id,
      },
      include: {
        users: {
          select: {
            id: true,
            email: true,
            name: true,
            first_name: true, // ✅ FIX: was firstName
          },
        },
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    console.log('🔔 Running alert subscription:', subscription.name)

    // Build SAM.gov URL with query params
    const samUrl = new URL('https://api.sam.gov/opportunities/v2/search')

    // Add search params
    if (subscription.keywords) samUrl.searchParams.set('keywords', subscription.keywords)
    if (subscription.naics) samUrl.searchParams.set('naics', subscription.naics)
    if (subscription.agency) samUrl.searchParams.set('agency', subscription.agency)
    if (subscription.set_aside) samUrl.searchParams.set('setAside', subscription.set_aside)
    if (subscription.state_of_performance) samUrl.searchParams.set('state', subscription.state_of_performance)
    if (subscription.procurement_type) samUrl.searchParams.set('ptype', subscription.procurement_type)

    // Convert dates to SAM.gov format (MM/dd/yyyy)
    if (subscription.posted_after) samUrl.searchParams.set('postedFrom', toSamGovDate(subscription.posted_after))
    if (subscription.posted_before) samUrl.searchParams.set('postedTo', toSamGovDate(subscription.posted_before))

    // Add limit and API key
    samUrl.searchParams.set('limit', String(subscription.max_results || 100))
    samUrl.searchParams.set('api_key', process.env.SAMGOV_API_KEY || '')

    console.log('📡 Calling SAM.gov API:', samUrl.searchParams.toString())

    // Execute the search against SAM.gov API
    let opportunities: any[] = []
    let resultCount = 0
    let errorMessage: string | null = null

    try {
      const samResponse = await fetch(samUrl.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
      })

      if (!samResponse.ok) {
        const errorText = await samResponse.text()
        console.error('SAM.gov API error response:', errorText)
        throw new Error(`SAM.gov API error: ${samResponse.status} ${samResponse.statusText}`)
      }

      const samData = await samResponse.json()
      opportunities = samData.opportunitiesData || []
      resultCount = opportunities.length

      console.log(`✅ Alert subscription executed: ${resultCount} results`)
    } catch (apiError) {
      console.error('SAM.gov API error:', apiError)
      errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error'
    }

    // Create search run record
    const searchRun = await prisma.search_runs.create({
      data: {
        id: randomBytes(12).toString('hex'),
        saved_search_id: subscription.id,
        status: errorMessage ? 'ERROR' : 'SUCCESS',
        result_count: resultCount,
        new_results_count: resultCount, // For now, assume all are new
        search_params: {
          keywords: subscription.keywords,
          naics: subscription.naics,
          agency: subscription.agency,
          setAside: subscription.set_aside,
          stateOfPerformance: subscription.state_of_performance,
          postedAfter: subscription.posted_after,
          postedBefore: subscription.posted_before,
          procurementType: subscription.procurement_type,
        },
        results_snapshot: opportunities.slice(0, 50), // Store first 50
        error_message: errorMessage,
        email_sent: false,
      },
    })

    // Update subscription last run metadata
    await prisma.saved_searches_new.update({
      where: { id: subscription.id },
      data: {
        last_run_at: new Date(),
        last_result_count: resultCount,
      },
    })

    // ✅ SEND EMAIL NOTIFICATION
    let emailSent = false
    if (subscription.subscription_enabled && subscription.email_notification && subscription.recipients) {
      const shouldSendEmail = resultCount > 0 || !!subscription.send_empty_results

      if (shouldSendEmail) {
        try {
          console.log(`📧 Sending email to: ${subscription.recipients}`)
          console.log(`📊 Results: ${resultCount}`)

          // Parse recipients
          const recipientEmails = subscription.recipients
            .split(',')
            .map((e) => e.trim())
            .filter(Boolean)

          // Build search criteria array for email
          const searchCriteria: Array<{ label: string; value: string }> = []
          if (subscription.keywords) searchCriteria.push({ label: 'Keywords', value: subscription.keywords })
          if (subscription.naics) searchCriteria.push({ label: 'NAICS', value: subscription.naics })
          if (subscription.agency) searchCriteria.push({ label: 'Agency', value: subscription.agency })
          if (subscription.set_aside) searchCriteria.push({ label: 'Set-Aside', value: subscription.set_aside })
          if (subscription.state_of_performance) searchCriteria.push({ label: 'State', value: subscription.state_of_performance })
          if (subscription.procurement_type) searchCriteria.push({ label: 'Type', value: subscription.procurement_type })

          // Transform opportunities to match email template format
          const topResults = opportunities.slice(0, 10).map((opp) => ({
            title: opp.title || opp.description || 'Untitled Opportunity',
            agency: opp.department || opp.agency || 'Unknown Agency',
            solicitationNumber: opp.solicitationNumber || opp.noticeId,
            naics: opp.naics?.[0] || opp.naicsCode,
            responseDeadline: opp.responseDeadLine || opp.archiveDate,
            url: opp.uiLink || `https://sam.gov/opp/${opp.noticeId || opp.solicitationNumber}`,
          }))

          await sendAlertEmail({
            to: recipientEmails,
            searchName: subscription.name,
            totalResults: resultCount,
            searchCriteria,
            topResults,
          })

          emailSent = true

          await prisma.search_runs.update({
            where: { id: searchRun.id },
            data: { email_sent: true },
          })

          console.log('✅ Email sent successfully')
        } catch (emailErr) {
          console.error('❌ Email send failed (non-fatal):', emailErr)
          // Don't throw - email failure shouldn't fail the whole alert run
        }
      } else {
        console.log('📭 Skipping email: empty results and send_empty_results is false')
      }
    } else {
      console.log('📭 Skipping email: subscription disabled or email_notification off or recipients missing')
    }

    return NextResponse.json({
      ok: true,
      subscriptionId: subscription.id,
      runId: searchRun.id,
      status: searchRun.status,
      resultCount,
      emailSent,
      error: errorMessage,
    })
  } catch (error) {
    console.error('Error running subscription now:', error)
    return NextResponse.json({ error: 'Failed to run subscription' }, { status: 500 })
  }
}
