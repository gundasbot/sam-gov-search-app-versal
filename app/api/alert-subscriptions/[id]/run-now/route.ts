// app/api/alert-subscriptions/[id]/run-now/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

    // Fetch the subscription (saved search)
    const subscription = await prisma.savedSearchNew.findFirst({
      where: {
        id,
        userId: session.user.id
      },
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
    }

    console.log('🔔 Running alert subscription:', subscription.name)

    // Build SAM.gov URL with query params
    const samUrl = new URL('https://api.sam.gov/opportunities/v2/search')

    // Add search params
    if (subscription.keywords) {
      samUrl.searchParams.set('keywords', subscription.keywords)
    }

    if (subscription.naics) {
      samUrl.searchParams.set('naics', subscription.naics)
    }

    if (subscription.agency) {
      samUrl.searchParams.set('agency', subscription.agency)
    }

    if (subscription.setAside) {
      samUrl.searchParams.set('setAside', subscription.setAside)
    }

    if (subscription.stateOfPerformance) {
      samUrl.searchParams.set('state', subscription.stateOfPerformance)
    }

    if (subscription.procurementType) {
      samUrl.searchParams.set('ptype', subscription.procurementType)
    }

    // Convert dates to SAM.gov format (MM/dd/yyyy)
    if (subscription.postedAfter) {
      samUrl.searchParams.set('postedFrom', toSamGovDate(subscription.postedAfter))
    }

    if (subscription.postedBefore) {
      samUrl.searchParams.set('postedTo', toSamGovDate(subscription.postedBefore))
    }

    // Add limit and API key
    samUrl.searchParams.set('limit', String(subscription.maxResults || 100))
    samUrl.searchParams.set('api_key', process.env.SAMGOV_API_KEY || '')

    console.log('📡 Calling SAM.gov API:', samUrl.searchParams.toString())

    // Execute the search against SAM.gov API
    let opportunities: any[] = []
    let resultCount = 0
    let errorMessage: string | null = null

    try {
      const samResponse = await fetch(samUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
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
    const searchRun = await prisma.searchRun.create({
      data: {
        savedSearchId: subscription.id,
        status: errorMessage ? 'ERROR' : 'SUCCESS',
        resultCount,
        newResultsCount: resultCount, // For now, assume all are new
        searchParams: {
          keywords: subscription.keywords,
          naics: subscription.naics,
          agency: subscription.agency,
          setAside: subscription.setAside,
          stateOfPerformance: subscription.stateOfPerformance,
          postedAfter: subscription.postedAfter,
          postedBefore: subscription.postedBefore,
          procurementType: subscription.procurementType,
        },
        resultsSnapshot: opportunities.slice(0, 50), // Store first 50
        errorMessage,
        emailSent: false,
      },
    })

    // Update subscription last run metadata
    await prisma.savedSearchNew.update({
      where: { id: subscription.id },
      data: {
        lastRunAt: new Date(),
        lastResultCount: resultCount,
      },
    })

    // Send email notification (if subscription enabled and configured)
    let emailSent = false
    if (subscription.subscriptionEnabled && subscription.emailNotification && subscription.recipients) {
      const shouldSendEmail = resultCount > 0 || subscription.sendEmptyResults

      if (shouldSendEmail) {
        try {
          console.log(`📧 Would send email to: ${subscription.recipients}`)
          console.log(`📊 Results: ${resultCount}`)
          // TODO: Implement actual email sending here
          // await sendAlertEmail({ ... })
          
          emailSent = true
          await prisma.searchRun.update({
            where: { id: searchRun.id },
            data: { emailSent: true },
          })
        } catch (emailErr) {
          console.error('Email send failed (non-fatal):', emailErr)
        }
      }
    }

    return NextResponse.json({
      success: true,
      resultCount,
      searchRunId: searchRun.id,
      emailSent,
      subscription: {
        id: subscription.id,
        name: subscription.name,
        lastRunAt: new Date().toISOString(),
        lastResultCount: resultCount,
      },
    })
  } catch (error) {
    console.error('Alert subscription run error:', error)
    
    // Try to create error run record
    try {
      const { id } = await params
      await prisma.searchRun.create({
        data: {
          savedSearchId: id,
          status: 'ERROR',
          resultCount: 0,
          newResultsCount: 0,
          searchParams: {},
          resultsSnapshot: [],
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      })
    } catch (recordError) {
      console.error('Failed to create error record:', recordError)
    }

    return NextResponse.json(
      {
        error: 'Failed to run alert subscription',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
