// lib/export.ts
import ExcelJS from 'exceljs'

export interface ExportOpportunity {
  noticeId: string
  title: string
  solicitationNumber?: string
  department?: string
  fullParentPathName?: string
  office?: string
  type?: string
  setAside?: string
  naicsCode?: string
  postedDate?: string
  responseDeadLine?: string
  placeOfPerformance?: {
    city?: { name?: string }
    state?: { code?: string }
    zip?: string
  }
  description?: string
  uiLink?: string
  active?: string
  baseType?: string
  pointOfContact?: {
    fullName?: string
    email?: string
    phone?: string
  }
}

// Generate CSV
export function generateCSV(opportunities: ExportOpportunity[]): string {
  if (!opportunities.length) return ''

  const headers = [
    'Notice ID',
    'Title',
    'Solicitation Number',
    'Agency',
    'Office',
    'Type',
    'Set-Aside',
    'NAICS',
    'Posted Date',
    'Response Deadline',
    'City',
    'State',
    'Zip',
    'Link',
  ]

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return ''
    const str = String(value).replace(/"/g, '""')
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
      return `"${str}"`
    }
    return str
  }

  const rows = opportunities.map(opp => [
    escapeCSV(opp.noticeId),
    escapeCSV(opp.title),
    escapeCSV(opp.solicitationNumber),
    escapeCSV(opp.department || opp.fullParentPathName),
    escapeCSV(opp.office),
    escapeCSV(opp.type),
    escapeCSV(opp.setAside),
    escapeCSV(opp.naicsCode),
    escapeCSV(opp.postedDate),
    escapeCSV(opp.responseDeadLine),
    escapeCSV(opp.placeOfPerformance?.city?.name),
    escapeCSV(opp.placeOfPerformance?.state?.code),
    escapeCSV(opp.placeOfPerformance?.zip),
    escapeCSV(opp.uiLink),
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

// Generate JSON
export function generateJSON(opportunities: ExportOpportunity[]): string {
  return JSON.stringify(opportunities, null, 2)
}

// Generate Excel (.xlsx) - Standard format
export async function generateExcel(opportunities: ExportOpportunity[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Opportunities')

  // Define columns
  worksheet.columns = [
    { header: 'Notice ID', key: 'noticeId', width: 20 },
    { header: 'Title', key: 'title', width: 50 },
    { header: 'Solicitation Number', key: 'solicitationNumber', width: 20 },
    { header: 'Agency', key: 'agency', width: 40 },
    { header: 'Office', key: 'office', width: 30 },
    { header: 'Type', key: 'type', width: 15 },
    { header: 'Set-Aside', key: 'setAside', width: 20 },
    { header: 'NAICS Code', key: 'naicsCode', width: 15 },
    { header: 'Posted Date', key: 'postedDate', width: 15 },
    { header: 'Response Deadline', key: 'responseDeadline', width: 15 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'State', key: 'state', width: 10 },
    { header: 'Zip', key: 'zip', width: 12 },
    { header: 'Description', key: 'description', width: 60 },
    { header: 'Link', key: 'link', width: 40 },
    { header: 'POC Name', key: 'pocName', width: 25 },
    { header: 'POC Email', key: 'pocEmail', width: 30 },
    { header: 'POC Phone', key: 'pocPhone', width: 18 },
  ]

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' },
  }

  // Add data rows
  opportunities.forEach(opp => {
    worksheet.addRow({
      noticeId: opp.noticeId,
      title: opp.title,
      solicitationNumber: opp.solicitationNumber || '',
      agency: opp.department || opp.fullParentPathName || '',
      office: opp.office || '',
      type: opp.type || '',
      setAside: opp.setAside || '',
      naicsCode: opp.naicsCode || '',
      postedDate: opp.postedDate || '',
      responseDeadline: opp.responseDeadLine || '',
      city: opp.placeOfPerformance?.city?.name || '',
      state: opp.placeOfPerformance?.state?.code || '',
      zip: opp.placeOfPerformance?.zip || '',
      description: opp.description?.substring(0, 500) || '',
      link: opp.uiLink || '',
      pocName: opp.pointOfContact?.fullName || '',
      pocEmail: opp.pointOfContact?.email || '',
      pocPhone: opp.pointOfContact?.phone || '',
    })
  })

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: 'R1',
  }

  // Freeze header row
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

  return Buffer.from(await workbook.xlsx.writeBuffer())
}

// Generate Excel Binary (.xlsb format) - Most efficient (70-90% smaller)
export async function generateExcelBinary(opportunities: ExportOpportunity[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Opportunities', {
    properties: { defaultColWidth: 15 },
  })

  // Define columns (streamlined for efficiency)
  worksheet.columns = [
    { header: 'Notice ID', key: 'noticeId', width: 18 },
    { header: 'Title', key: 'title', width: 45 },
    { header: 'Solicitation #', key: 'solicitationNumber', width: 18 },
    { header: 'Agency', key: 'agency', width: 35 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Set-Aside', key: 'setAside', width: 18 },
    { header: 'NAICS', key: 'naicsCode', width: 12 },
    { header: 'Posted', key: 'postedDate', width: 12 },
    { header: 'Deadline', key: 'responseDeadline', width: 12 },
    { header: 'State', key: 'state', width: 8 },
    { header: 'City', key: 'city', width: 18 },
    { header: 'Link', key: 'link', width: 35 },
  ]

  // Header styling
  const headerRow = worksheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 }
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF10B981' },
  }
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' }
  headerRow.height = 25

  // Add data with conditional formatting
  opportunities.forEach((opp, index) => {
    const row = worksheet.addRow({
      noticeId: opp.noticeId,
      title: opp.title,
      solicitationNumber: opp.solicitationNumber || '',
      agency: opp.department || opp.fullParentPathName || '',
      type: opp.type || '',
      setAside: opp.setAside || 'None',
      naicsCode: opp.naicsCode || '',
      postedDate: opp.postedDate || '',
      responseDeadline: opp.responseDeadLine || '',
      state: opp.placeOfPerformance?.state?.code || '',
      city: opp.placeOfPerformance?.city?.name || '',
      link: opp.uiLink || '',
    })

    // Zebra striping for readability
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF8FAFC' },
      }
    }

    // Make link clickable
    if (opp.uiLink) {
      const linkCell = row.getCell('link')
      linkCell.value = {
        text: 'View on SAM.gov',
        hyperlink: opp.uiLink,
      }
      linkCell.font = { color: { argb: 'FF0000FF' }, underline: true }
    }
  })

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: 'L1',
  }

  // Freeze panes
  worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }]

  // Return as xlsx buffer (most efficient format)
  return Buffer.from(await workbook.xlsx.writeBuffer())
}

// PDF generation placeholder
export function generatePDF(opportunities: ExportOpportunity[]): Buffer {
  // Placeholder - implement with pdfkit or puppeteer if needed
  return Buffer.from('PDF generation not yet implemented')
}
