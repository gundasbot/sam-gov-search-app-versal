// app/api/saved-searches/[id]/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateCSV, generateJSON, generateExcel, generateExcelBinary, generatePDF } from '@/lib/export'

// POST /api/saved-searches/[id]/export - Export search results
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const format = body.format || 'XLSB' // Changed default to XLSB

    // Validate format - ALL OPTIONS AVAILABLE
    if (!['CSV', 'JSON', 'EXCEL', 'XLSB', 'PDF'].includes(format)) {
      return NextResponse.json(
        { error: 'Invalid format. Must be CSV, JSON, EXCEL, XLSB, or PDF' },
        { status: 400 }
      )
    }

    const search = await prisma.savedSearchNew.findFirst({
      where: { id, userId: session.user.id },
      include: { user: true },
    })

    if (!search) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    // Build query and fetch results
    const qs = new URLSearchParams()
    if (search.keywords) qs.set('title', search.keywords)
    if (search.naics) qs.set('naics', search.naics)
    if (search.agency) qs.set('organizationCode', search.agency)
    if (search.setAside) qs.set('typeOfSetAside', search.setAside)
    if (search.stateOfPerformance) qs.set('state', search.stateOfPerformance)
    if (search.postedAfter) {
      qs.set('postedFrom', search.postedAfter.toISOString().split('T')[0])
    }
    if (search.postedBefore) {
      qs.set('postedTo', search.postedBefore.toISOString().split('T')[0])
    }
    qs.set('ptype', search.procurementType || 'o')
    qs.set('limit', String(search.maxResults || 100))

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    const response = await fetch(`${baseUrl}/api/sam?${qs.toString()}`)
    if (!response.ok) {
      throw new Error(`SAM API returned ${response.status}`)
    }

    const data = await response.json()
    const results = data.opportunitiesData || []

    // Get version number for filename
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    const exportsToday = await prisma.searchExport.count({
      where: {
        savedSearchId: search.id,
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    })

    const version = exportsToday + 1
    const formattedDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
    const versionStr = version > 1 ? ` v${version}` : ''
    const runName = `${search.name} Run ${formattedDate}${versionStr}`

    // Generate export file based on format
    let fileContent: Buffer
    let fileName: string
    let contentType: string

    switch (format) {
      case 'CSV':
        fileContent = Buffer.from(generateCSV(results))
        fileName = `${runName}.csv`
        contentType = 'text/csv'
        break

      case 'JSON':
        fileContent = Buffer.from(generateJSON(results))
        fileName = `${runName}.json`
        contentType = 'application/json'
        break

      case 'EXCEL':
        fileContent = await generateExcel(results)
        fileName = `${runName}.xlsx`
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break

      case 'XLSB':
        fileContent = await generateExcelBinary(results)
        fileName = `${runName}.xlsx`
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        break

      case 'PDF':
        fileContent = generatePDF(results)
        fileName = `${runName}.pdf`
        contentType = 'application/pdf'
        break

      default:
        throw new Error('Unsupported format')
    }

    // Create export record
    const exportRecord = await prisma.searchExport.create({
      data: {
        savedSearchId: search.id,
        userId: session.user.id,
        format: format as any,
        fileName,
        fileSize: fileContent.length,
        recordCount: results.length,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        fileUrl: null,
      },
    })

    // Return as base64 data URL
    const fileUrl = `data:${contentType};base64,${fileContent.toString('base64')}`

    return NextResponse.json({
      success: true,
      fileUrl,
      fileName,
      exportId: exportRecord.id,
      recordCount: results.length,
      format,
      fileSize: fileContent.length,
    })
  } catch (error) {
    console.error('Failed to export search:', error)
    return NextResponse.json(
      { error: 'Failed to export search results' },
      { status: 500 }
    )
  }
}
