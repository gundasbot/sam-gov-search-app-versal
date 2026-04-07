// lib/export.ts
import ExcelJS from 'exceljs'
import * as XLSX from 'xlsx'

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
    'Solicitation link',
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
    escapeCSV(opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`),
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
    { header: 'Solicitation link', key: 'link', width: 40 },
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
      link: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`,
      pocName: opp.pointOfContact?.fullName || '',
      pocEmail: opp.pointOfContact?.email || '',
      pocPhone: opp.pointOfContact?.phone || '',
    })

    const rowNumber = worksheet.rowCount
    const linkCell = worksheet.getCell(`M${rowNumber}`)
    const linkValue = opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`
    if (linkValue) {
      linkCell.value = {
        text: 'Open Solicitation',
        hyperlink: linkValue,
      }
      linkCell.font = { color: { argb: 'FF0563C1' }, underline: true, bold: true }
    }
  })

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: 'P1',
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
    { header: 'Solicitation link', key: 'link', width: 35 },
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
      link: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`,
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
    if (opp.uiLink || opp.noticeId) {
      const linkCell = row.getCell('link')
      linkCell.value = {
        text: 'Open Solicitation',
        hyperlink: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`,
      }
      linkCell.font = { color: { argb: 'FF0563C1' }, underline: true, bold: true }
    }
  })

  // Auto-filter
  worksheet.autoFilter = {
    from: 'A1',
    to: 'K1',
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

// Generate XLSB (Excel Binary Workbook) — smaller file size, opens in Excel/Sheets
export function generateXLSB(opportunities: ExportOpportunity[]): Buffer {
  const rows = opportunities.map(opp => ({
    'Title': opp.title || '',
    'Solicitation #': opp.solicitationNumber || '',
    'Agency': opp.department || opp.fullParentPathName || '',
    'Office': opp.office || '',
    'Type': opp.type || '',
    'Set-Aside': opp.setAside || '',
    'NAICS': opp.naicsCode || '',
    'Posted Date': opp.postedDate || '',
    'Response Deadline': opp.responseDeadLine || '',
    'City': opp.placeOfPerformance?.city?.name || '',
    'State': opp.placeOfPerformance?.state?.code || '',
    'Zip': opp.placeOfPerformance?.zip || '',
    'Solicitation link': opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`,
    'POC Name': opp.pointOfContact?.fullName || '',
    'POC Email': opp.pointOfContact?.email || '',
    'POC Phone': opp.pointOfContact?.phone || '',
  }))

  const worksheet = XLSX.utils.json_to_sheet(rows)
  const hyperlinkColumnIndex = 12 // "Solicitation link"
  opportunities.forEach((opp, idx) => {
    const link = opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`
    if (!link) return
    const addr = XLSX.utils.encode_cell({ r: idx + 1, c: hyperlinkColumnIndex })
    const cell = worksheet[addr]
    if (!cell) return
    const escapedLink = String(link).replace(/"/g, '""')
    const displayLink = String(link)
    const escapedDisplay = displayLink.replace(/"/g, '""')
    // Use Excel's HYPERLINK formula with URL text so column M clearly looks like a link.
    cell.f = `HYPERLINK("${escapedLink}","${escapedDisplay}")`
    cell.t = 'str'
    cell.v = displayLink
    ;(cell as any).l = { Target: link, Tooltip: 'Open solicitation on SAM.gov' }
    ;(cell as any).s = {
      font: { color: { rgb: '0563C1' }, underline: true, bold: true },
    }
  })
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Opportunities')
  const buf = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsb' })
  return Buffer.from(buf)
}

// Generate TXT (tab-delimited)
export function generateTXT(opportunities: ExportOpportunity[]): string {
  if (!opportunities.length) return ''

  const headers = [
    'Title', 'Solicitation Number', 'Agency', 'Office',
    'Type', 'Set-Aside', 'NAICS', 'Posted Date', 'Response Deadline',
    'City', 'State', 'Zip', 'Solicitation link',
    'POC Name', 'POC Email', 'POC Phone',
  ]

  const escape = (v: any): string =>
    String(v ?? '').replace(/\t/g, ' ').replace(/\n/g, ' ')

  const rows = opportunities.map(opp => [
    escape(opp.title),
    escape(opp.solicitationNumber),
    escape(opp.department || opp.fullParentPathName),
    escape(opp.office),
    escape(opp.type),
    escape(opp.setAside),
    escape(opp.naicsCode),
    escape(opp.postedDate),
    escape(opp.responseDeadLine),
    escape(opp.placeOfPerformance?.city?.name),
    escape(opp.placeOfPerformance?.state?.code),
    escape(opp.placeOfPerformance?.zip),
    escape(opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`),
    escape(opp.pointOfContact?.fullName),
    escape(opp.pointOfContact?.email),
    escape(opp.pointOfContact?.phone),
  ])

  return [headers.join('\t'), ...rows.map(r => r.join('\t'))].join('\n')
}
