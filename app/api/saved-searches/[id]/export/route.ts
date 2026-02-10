// app/api/saved-searches/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Helper to sanitize string values
const sanitize = (val: any): string | null => {
  return typeof val === 'string' ? val.trim() || null : null
}

// Helper to safely parse dates (returns null if invalid)
const toDateOrNull = (val: any): Date | null => {
  if (!val) return null
  const d = new Date(val)
  return Number.isNaN(d.getTime()) ? null : d
}

// Helper to coerce numbers safely
const toIntOrDefault = (val: any, def: number): number => {
  const n = typeof val === 'number' ? val : parseInt(String(val ?? ''), 10)
  return Number.isFinite(n) ? n : def
}

// Helper to validate and convert frequency to AlertFrequency enum value
const validateFrequency = (
  frequency: any
): 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_CHANGES' | 'MANUAL' | null => {
  if (!frequency) return null

  const upperFreq = String(frequency).toUpperCase()
  if (['DAILY', 'WEEKLY', 'MONTHLY', 'AS_CHANGES', 'MANUAL'].includes(upperFreq)) {
    return upperFreq as 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_CHANGES' | 'MANUAL'
  }

  return null
}

// Helper to convert existing frequency to the allowed types
const getValidFrequency = (
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AS_CHANGES' | 'MANUAL' | null
): 'DAILY' | 'WEEKLY' | 'MONTHLY' | null => {
  if (!freq) return null
  
  // Only allow DAILY, WEEKLY, or MONTHLY - map others to null or default
  if (freq === 'DAILY' || freq === 'WEEKLY' || freq === 'MONTHLY') {
    return freq
  }
  
  // For AS_CHANGES or MANUAL, return null or map to a default
  return null
}

// Normalize export format to your schema's conventions (default XLSB)
const normalizeExportFormat = (val: any): string => {
  const s = sanitize(val)
  if (!s) return 'XLSB'
  return s.toUpperCase()
}

// PATCH - Update a saved search/alert subscription
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()

    // Check ownership
    const existing = await prisma.saved_searches_new.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Validate subscription-related fields
    const subscriptionEnabled =
      body.subscriptionEnabled !== undefined
        ? Boolean(body.subscriptionEnabled)
        : existing.subscriptionEnabled

    // Only validate/set frequency if subscription is enabled
    // Convert existing frequency to allowed types
    let frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null = getValidFrequency(existing.frequency)
    
    if (body.frequency !== undefined) {
      if (subscriptionEnabled) {
        const newFrequency = validateFrequency(body.frequency)
        // Only keep it if it's DAILY, WEEKLY, or MONTHLY
        if (newFrequency === 'DAILY' || newFrequency === 'WEEKLY' || newFrequency === 'MONTHLY') {
          frequency = newFrequency
        } else {
          // For AS_CHANGES or MANUAL, use DAILY as default or null
          frequency = 'DAILY'
        }
      } else {
        frequency = null
      }
    }

    // Process recipients - convert to comma-separated string
    let recipientsString: string | null = existing.recipients
    if (body.recipients !== undefined) {
      if (Array.isArray(body.recipients)) {
        const validRecipients = body.recipients
          .map((r: any) => (typeof r === 'string' ? r.trim() : ''))
          .filter((r: string) => r.length > 0)
        recipientsString =
          validRecipients.length > 0 ? validRecipients.join(', ') : null
      } else if (typeof body.recipients === 'string') {
        const validRecipients = body.recipients
          .split(',')
          .map((r: string) => r.trim())
          .filter((r: string) => r.length > 0)
        recipientsString =
          validRecipients.length > 0 ? validRecipients.join(', ') : null
      }
    }

    // Build update data - only include fields that are provided
    const updateData: any = {}

    // Basic fields
    if (body.name !== undefined) updateData.name = sanitize(body.name) || existing.name
    if (body.description !== undefined) updateData.description = sanitize(body.description)
    if (body.isPinned !== undefined) updateData.isPinned = Boolean(body.isPinned)

    // Search criteria - support both old and new field names
    if (body.keywords !== undefined) updateData.keywords = sanitize(body.keywords)
    if (body.solicitationNumber !== undefined || body.solnum !== undefined) {
      updateData.solicitationNumber =
        sanitize(body.solicitationNumber) ?? sanitize(body.solnum)
    }
    if (body.noticeId !== undefined || body.noticeid !== undefined) {
      updateData.noticeId = sanitize(body.noticeId) ?? sanitize(body.noticeid)
    }
    if (body.naics !== undefined) updateData.naics = sanitize(body.naics)
    if (body.classificationCode !== undefined || body.ccode !== undefined) {
      updateData.classificationCode =
        sanitize(body.classificationCode) ?? sanitize(body.ccode)
    }
    if (body.agency !== undefined) updateData.agency = sanitize(body.agency)
    if (body.organizationCode !== undefined)
      updateData.organizationCode = sanitize(body.organizationCode)
    if (body.setAside !== undefined) updateData.setAside = sanitize(body.setAside)
    if (body.stateOfPerformance !== undefined)
      updateData.stateOfPerformance = sanitize(body.stateOfPerformance)
    if (body.placeOfPerformanceZip !== undefined || body.zip !== undefined) {
      updateData.placeOfPerformanceZip =
        sanitize(body.placeOfPerformanceZip) ?? sanitize(body.zip)
    }
    if (body.opportunityStatus !== undefined || body.status !== undefined) {
      updateData.opportunityStatus =
        sanitize(body.opportunityStatus) ?? sanitize(body.status)
    }
    if (body.procurementType !== undefined)
      updateData.procurementType = sanitize(body.procurementType) || 'o'

    // Date fields - support both old and new field names
    if (body.postedAfter !== undefined) updateData.postedAfter = toDateOrNull(body.postedAfter)
    if (body.postedBefore !== undefined) updateData.postedBefore = toDateOrNull(body.postedBefore)
    if (body.rdlfrom !== undefined || body.rdlFrom !== undefined) {
      updateData.rdlfrom = toDateOrNull(body.rdlfrom ?? body.rdlFrom)
    }
    if (body.rdlto !== undefined || body.rdlTo !== undefined) {
      updateData.rdlto = toDateOrNull(body.rdlto ?? body.rdlTo)
    }

    // Subscription settings
    updateData.subscriptionEnabled = subscriptionEnabled
    updateData.frequency = frequency
    updateData.recipients = recipientsString

    if (body.emailNotification !== undefined) {
      updateData.emailNotification = Boolean(body.emailNotification)
    }
    if (body.sendEmptyResults !== undefined) {
      updateData.sendEmptyResults = Boolean(body.sendEmptyResults)
    }
    if (body.maxResults !== undefined) {
      updateData.maxResults = toIntOrDefault(body.maxResults, 100)
    }
    if (body.deliveryTime !== undefined) {
      updateData.deliveryTime = sanitize(body.deliveryTime)
    }
    if (body.exportFormat !== undefined) {
      updateData.exportFormat = normalizeExportFormat(body.exportFormat)
    }
    if (body.includeLinks !== undefined) {
      updateData.includeLinks = Boolean(body.includeLinks)
    }

    // Update the search
    const search = await prisma.saved_searches_new.update({
      where: { id },
      data: updateData,
      include: {
        _count: {
          select: {
            runs: true,
            exports: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, search })
  } catch (error) {
    console.error('Error updating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a saved search
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check ownership
    const existing = await prisma.saved_searches_new.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Delete the search
    await prisma.saved_searches_new.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    )
  }
}

// GET - Get a single saved search
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the search
    const search = await prisma.saved_searches_new.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            runs: true,
            exports: true,
          },
        },
      },
    })

    if (!search) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    if (search.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ success: true, search })
  } catch (error) {
    console.error('Error fetching saved search:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved search' },
      { status: 500 }
    )
  }
}