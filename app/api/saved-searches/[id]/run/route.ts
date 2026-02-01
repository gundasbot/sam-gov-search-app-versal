// app/api/saved-searches/[id]/run/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendAlertEmail } from '@/lib/email'

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

// POST /api/saved-searches/[id]/run - Manually run a saved search/alert
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

    // Fetch the saved search
    const search = await prisma.savedSearchNew.findFirst({
      where: {
        id,
        userId: session.user.id
      },
    })
    
    if (!search) {
      return NextResponse.json({ error: 'Search not found' }, { status: 404 })
    }

    console.log('🔍 Running search:', search.name)

    // Build SAM.gov URL with query params
    const samUrl = new URL('https://api.sam.gov/opportunities/v2/search')

    // Add search params
    if (search.keywords) {
      samUrl.searchParams.set('keywords', search.keywords)
    }
    if (search.naics) {
      samUrl.searchParams.set('naics', search.naics)
    }
    if (search.agency) {
      samUrl.searchParams.set('agency', search.agency)
    }
    if (search.setAside) {
      samUrl.searchParams.set('setAside', search.setAside)
    }
    if (search.stateOfPerformance) {
      samUrl.searchParams.set('state', search.stateOfPerformance)
    }
    if (search.procurementType) {
      samUrl.searchParams.set('ptype', search.procurementType)
    }

    // Convert dates to SAM.gov format (MM/dd/yyyy)
    if (search.postedAfter) {
      samUrl.searchParams.set('postedFrom', toSamGovDate(search.postedAfter))
    }
    if (search.postedBefore) {
      samUrl.searchParams.set('postedTo', toSamGovDate(search.postedBefore))
    }

    // Add limit and API key
    samUrl.searchParams.set('limit', String(search.maxResults || 100))
    samUrl.searchParams.set('api_key', process.env.SAMGOVAPIKEY || '')

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
      console.log(`✅ Search completed: ${resultCount} results`)
    } catch (apiError) {
      console.error('SAM.gov API error:', apiError)
      errorMessage = apiError instanceof Error ? apiError.message : 'Unknown error'
    }

    // Create search run record
    const searchRun = await prisma.searchRun.create({
      data: {
        savedSearchId: search.id,
        status: errorMessage ? 'ERROR' : 'SUCCESS',
        resultCount,
        newResultsCount: resultCount, // For now, assume all are new
        searchParams: {
          keywords: search.keywords,
          naics: search.naics,
          agency: search.agency,
          setAside: search.setAside,
          stateOfPerformance: search.stateOfPerformance,
          postedAfter: search.postedAfter,
          postedBefore: search.postedBefore,
          procurementType: search.procurementType,
        },
        resultsSnapshot: opportunities.slice(0, 50), // Store first 50
        errorMessage,
        emailSent: false,
      },
    })

    // Update search last run metadata
    await prisma.savedSearchNew.update({
      where: { id: search.id },
      data: {
        lastRunAt: new Date(),
        lastResultCount: resultCount,
      },
    })

    // Send email notification (if subscription enabled and configured)
    let emailSent = false
    if (search.subscriptionEnabled && search.emailNotification && search.recipients) {
      const shouldSendEmail = resultCount > 0 || search.sendEmptyResults

      if (shouldSendEmail) {
        try {
          console.log(`📧 Sending email to: ${search.recipients}`)
          console.log(`📊 Results: ${resultCount}`)

          // Parse recipients (comma-separated string to array)
          const recipientEmails = search.recipients
            .split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0)

          // Send the alert email with CSV attachment
          await sendAlertEmail({
            to: recipientEmails,
            searchName: search.name,
            resultCount,
            opportunities,
            searchParams: {
              keywords: search.keywords,
              naics: search.naics,
              agency: search.agency,
              setAside: search.setAside,
              stateOfPerformance: search.stateOfPerformance,
              postedAfter: search.postedAfter,
              postedBefore: search.postedBefore,
              procurementType: search.procurementType,
            },
            runDate: new Date(),
          })

          emailSent = true

          await prisma.searchRun.update({
            where: { id: searchRun.id },
            data: { emailSent: true },
          })

          console.log(`✅ Email sent successfully to: ${search.recipients}`)
        } catch (emailErr) {
          console.error('❌ Email send failed (non-fatal):', emailErr)
        }
      }
    }

    return NextResponse.json({
      success: true,
      resultCount,
      searchRunId: searchRun.id,
      emailSent,
      search: {
        id: search.id,
        name: search.name,
        lastRunAt: new Date().toISOString(),
        lastResultCount: resultCount,
      },
    })
  } catch (error) {
    console.error('Search run error:', error)

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
        error: 'Failed to run search',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
