// lib/sam-gov-constants.ts
// SAM.gov API static parameters and validation utilities
// Updated to include ALL set-aside codes from official API documentation

export const PROCUREMENT_TYPES = [
  { value: '', label: 'All Types' },
  { value: 'u', label: 'Justification (J&A)' },
  { value: 'p', label: 'Pre-solicitation' },
  { value: 'a', label: 'Award Notice' },
  { value: 'r', label: 'Sources Sought' },
  { value: 's', label: 'Special Notice' },
  { value: 'o', label: 'Solicitation' },
  { value: 'g', label: 'Sale of Surplus Property' },
  { value: 'k', label: 'Combined Synopsis/Solicitation' },
  { value: 'i', label: 'Intent to Bundle Requirements (DoD-Funded)' },
] as const

// Alias for backward compatibility
export const PROCUREMENT_TYPE_OPTIONS = PROCUREMENT_TYPES

// Complete Set-Aside Values from SAM.gov API Documentation
export const SET_ASIDE_CODES = [
  { value: '', label: 'All Set-Asides' },
  { value: 'SBA', label: 'Total Small Business Set-Aside (FAR 19.5)' },
  { value: 'SBP', label: 'Partial Small Business Set-Aside (FAR 19.5)' },
  { value: '8A', label: '8(a) Set-Aside (FAR 19.8)' },
  { value: '8AN', label: '8(a) Sole Source (FAR 19.8)' },
  { value: 'HZC', label: 'Historically Underutilized Business (HUBZone) Set-Aside (FAR 19.13)' },
  { value: 'HZS', label: 'Historically Underutilized Business (HUBZone) Sole Source (FAR 19.13)' },
  { value: 'SDVOSBC', label: 'VETERAN-OWNED Small Business (SDVOSB) Set-Aside (FAR 19.14)' },
  { value: 'SDVOSBS', label: 'VETERAN-OWNED Small Business (SDVOSB) Sole Source (FAR 19.14)' },
  { value: 'WOSB', label: 'Women-Owned Small Business (WOSB) Program Set-Aside (FAR 19.15)' },
  { value: 'WOSBSS', label: 'Women-Owned Small Business (WOSB) Program Sole Source (FAR 19.15)' },
  { value: 'EDWOSB', label: 'Economically Disadvantaged WOSB (EDWOSB) Program Set-Aside (FAR 19.15)' },
  { value: 'EDWOSBSS', label: 'Economically Disadvantaged WOSB (EDWOSB) Program Sole Source (FAR 19.15)' },
  { value: 'LAS', label: 'Local Area Set-Aside (FAR 26.2)' },
  { value: 'IEE', label: 'Indian Economic Enterprise (IEE) Set-Aside (Department of Interior)' },
  { value: 'ISBEE', label: 'Indian Small Business Economic Enterprise (ISBEE) Set-Aside (Department of Interior)' },
  { value: 'BICiv', label: 'Buy Indian Set-Aside (Department of Health and Human Services, Indian Health Services)' },
  { value: 'VSA', label: 'Veteran-Owned Small Business Set-Aside (Department of Veterans Affairs)' },
  { value: 'VSS', label: 'Veteran-Owned Small Business Sole Source (Department of Veterans Affairs)' },
] as const

export const US_STATES = [
  { value: '', label: 'All States' },
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
  { value: 'AS', label: 'American Samoa' },
  { value: 'GU', label: 'Guam' },
  { value: 'MP', label: 'Northern Mariana Islands' },
  { value: 'PR', label: 'Puerto Rico' },
  { value: 'VI', label: 'U.S. Virgin Islands' },
] as const

export const EXPORT_FORMATS = [
  { value: 'CSV', label: 'CSV (Spreadsheet)' },
  { value: 'JSON', label: 'JSON (Data)' },
  { value: 'EXCEL', label: 'Excel (.xlsx)' },
  { value: 'XLSB', label: 'Excel Binary (.xlsb)' },
  { value: 'PDF', label: 'PDF Document' },
  { value: 'TXT', label: 'Plain Text' },
  { value: 'XML', label: 'XML Document' },
] as const

export const ALERT_FREQUENCIES = [
  { value: 'DAILY', label: 'Daily', description: 'Every morning at scheduled time' },
  { value: 'WEEKLY', label: 'Weekly', description: 'Every Monday morning' },
  { value: 'MONTHLY', label: 'Monthly', description: 'First day of each month' },
  { value: 'AS_CHANGES', label: 'Real-time', description: 'As new opportunities appear' },
  { value: 'MANUAL', label: 'Manual', description: 'Run manually only' },
] as const

// Opportunity Status from API documentation
export const OPPORTUNITY_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'archived', label: 'Archived' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'deleted', label: 'Deleted' },
] as const

// Common NAICS codes for government contracting
export const COMMON_NAICS_CODES = [
  { value: '541511', label: '541511 - Custom Computer Programming Services' },
  { value: '541512', label: '541512 - Computer Systems Design Services' },
  { value: '541513', label: '541513 - Computer Facilities Management Services' },
  { value: '541519', label: '541519 - Other Computer Related Services' },
  { value: '541330', label: '541330 - Engineering Services' },
  { value: '541611', label: '541611 - Administrative Management Consulting' },
  { value: '541618', label: '541618 - Other Management Consulting Services' },
  { value: '541690', label: '541690 - Other Scientific and Technical Consulting' },
  { value: '561210', label: '561210 - Facilities Support Services' },
  { value: '561320', label: '561320 - Temporary Help Services' },
  { value: '561499', label: '561499 - All Other Business Support Services' },
  { value: '611430', label: '611430 - Professional and Management Development Training' },
] as const

// PSC (Product Service Code) Major Categories
export const PSC_CATEGORIES = [
  { value: 'R', label: 'R - Professional, Administrative and Management Support Services' },
  { value: 'D', label: 'D - Automatic Data Processing and Telecommunication Services' },
  { value: 'J', label: 'J - Maintenance, Repair or Alteration of Real Property' },
  { value: 'S', label: 'S - Utilities and Housekeeping Services' },
  { value: 'U', label: 'U - Education and Training Services' },
  { value: 'C', label: 'C - Architect and Engineering Services' },
  { value: 'F', label: 'F - Natural Resources Management' },
  { value: 'T', label: 'T - Photographic, Mapping, Printing and Publication Services' },
] as const

// Validation utilities
export function validateEmailList(emails: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!emails.trim()) {
    return { valid: false, errors: ['Email list cannot be empty'] }
  }

  const emailArray = emails.split(',').map(e => e.trim()).filter(Boolean)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  emailArray.forEach((email, index) => {
    if (!emailRegex.test(email)) {
      errors.push(`Invalid email at position ${index + 1}: "${email}"`)
    }
  })

  return { valid: errors.length === 0, errors }
}

export function validateNAICSList(naics: string): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (!naics.trim()) {
    return { valid: true, errors: [] } // NAICS is optional
  }

  const naicsArray = naics.split(',').map(n => n.trim()).filter(Boolean)
  const naicsRegex = /^\d{2,6}$/

  naicsArray.forEach((code, index) => {
    if (!naicsRegex.test(code)) {
      errors.push(`Invalid NAICS code at position ${index + 1}: "${code}" (must be 2-6 digits)`)
    }
  })

  return { valid: errors.length === 0, errors }
}

export function validateDateRange(
  startDate: Date | null,
  endDate: Date | null
): { valid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { valid: true } // Dates are optional
  }

  if (startDate > endDate) {
    return { valid: false, error: 'Start date must be before end date' }
  }

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // SAM.gov API limits date range to 1 year (365 days)
  if (daysDiff > 365) {
    return { valid: false, error: 'Date range cannot exceed 365 days (SAM.gov API limit)' }
  }

  return { valid: true }
}

// Helper to get default 6-month date range
export function getDefault6MonthRange(): { from: string; to: string } {
  const now = new Date()
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(now.getMonth() - 6)
  
  return {
    from: sixMonthsAgo.toISOString().split('T')[0],
    to: now.toISOString().split('T')[0]
  }
}

// Helper to format date for SAM.gov API (MM/dd/yyyy format)
export function formatDateForAPI(date: string | Date): string {
  const d = date instanceof Date ? date : new Date(date)
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const year = d.getFullYear()
  return `${month}/${day}/${year}`
}

// Helper to parse SAM.gov API date (MM/dd/yyyy) to YYYY-MM-DD
export function parseDateFromAPI(date: string): string {
  const [month, day, year] = date.split('/')
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

// Type exports for TypeScript
export type ProcurementType = typeof PROCUREMENT_TYPES[number]['value']
export type SetAsideCode = typeof SET_ASIDE_CODES[number]['value']
export type USState = typeof US_STATES[number]['value']
export type ExportFormat = typeof EXPORT_FORMATS[number]['value']
export type AlertFrequency = typeof ALERT_FREQUENCIES[number]['value']
export type OpportunityStatus = typeof OPPORTUNITY_STATUSES[number]['value']