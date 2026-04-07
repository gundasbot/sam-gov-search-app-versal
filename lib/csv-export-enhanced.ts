// lib/csv-export-enhanced.ts
// Enhanced CSV export with metadata header and filterable columns

interface CSVExportOptions {
  searchName: string
  result_count: number
  search_params: {
    keywords?: string | null
    solicitationNumber?: string | null
    noticeId?: string | null
    naics?: string | null
    classificationCode?: string | null
    agency?: string | null
    organizationCode?: string | null
    setAside?: string | null
    stateOfPerformance?: string | null
    placeOfPerformanceZip?: string | null
    opportunityStatus?: string | null
    postedAfter?: string | Date | null
    rdlfrom?: string | Date | null
    rdlto?: string | Date | null
    procurementType?: string | null
  }
  opportunities: any[]
  runDate: Date
}

export function generateEnhancedCSV({
  searchName, result_count: resultCount, search_params: searchParams,
  opportunities,
  runDate,
}: CSVExportOptions): string {
  const formatDate = (date: string | Date | null) => {
    if (!date) return ''
    const d = new Date(date)
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return ''
    const str = String(value)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`
    }
    return str
  }

  // Build metadata rows (first 5 rows - will be centered/merged in Excel)
  const metadataRows: string[] = [
    `"Search Run Date","${formatDate(runDate)}"`,
    `"Total Results","${resultCount}"`,
  ]

  // Add search parameters to metadata
  if (searchParams.keywords) metadataRows.push(`"Keywords","${escapeCSV(searchParams.keywords)}"`)
  if (searchParams.setAside) metadataRows.push(`"Set-Aside","${escapeCSV(searchParams.setAside)}"`)
  if (searchParams.naics) metadataRows.push(`"NAICS","${escapeCSV(searchParams.naics)}"`)
  if (searchParams.agency) metadataRows.push(`"Agency","${escapeCSV(searchParams.agency)}"`)
  if (searchParams.procurementType) metadataRows.push(`"Procurement Type","${escapeCSV(searchParams.procurementType)}"`)
  if (searchParams.postedAfter) metadataRows.push(`"Posted After","${formatDate(searchParams.postedAfter)}"`)
  if (searchParams.rdlfrom) metadataRows.push(`"Response Deadline From","${formatDate(searchParams.rdlfrom)}"`)
  if (searchParams.rdlto) metadataRows.push(`"Response Deadline To","${formatDate(searchParams.rdlto)}"`)

  // Pad metadata to 5 rows if needed
  while (metadataRows.length < 5) {
    metadataRows.push('""')
  }

  // Column headers (Row 6)
  const headers = [
    'Title',
    'Solicitation Number',
    'Department/Agency',
    'Office',
    'Type',
    'Set-Aside',
    'NAICS Code',
    'Posted Date',
    'Response Deadline',
    'Place of Performance (City)',
    'Place of Performance (State)',
    'Place of Performance (Zip)',
    'Solicitation link',
    'Active Status',
    'Base Type',
    'Point of Contact Name',
    'Point of Contact Email',
    'Point of Contact Phone',
  ]

  // Build data rows
  const dataRows = opportunities.map((opp) => {
    const solicitationLink = opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`
    const hyperlinkFormula = `=HYPERLINK("${String(solicitationLink).replace(/"/g, '""')}","Open Solicitation")`
    return [
      escapeCSV(opp.title),
      escapeCSV(opp.solicitation_number),
      escapeCSV(opp.fullParentPathName || opp.departmentName),
      escapeCSV(opp.subtierName || opp.officeName),
      escapeCSV(opp.type),
      escapeCSV(opp.typeOfSetAsideDescription || opp.typeOfSetAside),
      escapeCSV(opp.naicsCode),
      escapeCSV(formatDate(opp.postedDate)),
      escapeCSV(formatDate(opp.responseDeadLine)),
      escapeCSV(opp.placeOfPerformance?.city?.name),
      escapeCSV(opp.placeOfPerformance?.state?.name || opp.placeOfPerformance?.state?.code),
      escapeCSV(opp.placeOfPerformance?.zip),
      escapeCSV(hyperlinkFormula),
      escapeCSV(opp.active ? 'Yes' : 'No'),
      escapeCSV(opp.baseType),
      escapeCSV(opp.pointOfContact?.[0]?.fullName),
      escapeCSV(opp.pointOfContact?.[0]?.email),
      escapeCSV(opp.pointOfContact?.[0]?.phone),
    ].join(',')
  })

  // Combine all parts
  return [
    ...metadataRows,
    headers.join(','),
    ...dataRows,
  ].join('\n')
}

// Function to download CSV
export function downloadEnhancedCSV(csvContent: string, file_name: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', file_name)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}
