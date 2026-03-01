// lib/samGovConstants.ts
// SINGLE SOURCE OF TRUTH for SAM.gov field values
// Used by: search page, alerts page, saved searches, filters

/**
 * Official SAM.gov Set-Aside Types
 * These MUST match SAM.gov API exactly
 * Reference: https://open.gsa.gov/api/opportunities-api/
 */

export interface SetAsideOption {
  code: string  // SAM.gov API code (e.g., 'SBA', '8A')
  label: string // Display label
  farReference?: string // FAR regulation reference
}

export const SET_ASIDE_OPTIONS: SetAsideOption[] = [
  { code: '', label: 'Any Set-Aside' },
  { code: 'SBA', label: 'Total Small Business Set-Aside', farReference: 'FAR 19.5' },
  { code: 'SBP', label: 'Partial Small Business Set-Aside', farReference: 'FAR 19.5' },
  { code: '8A', label: '8(a) Set-Aside', farReference: 'FAR 19.8' },
  { code: '8AN', label: '8(a) Sole Source', farReference: 'FAR 19.8' },
  { code: 'HZC', label: 'Historically Underutilized Business (HUBZone) Set-Aside', farReference: 'FAR 19.13' },
  { code: 'HZS', label: 'Historically Underutilized Business (HUBZone) Sole Source', farReference: 'FAR 19.13' },
  { code: 'SDVOSBC', label: 'Service-Disabled Veteran-Owned Small Business (SDVOSB) Set-Aside', farReference: 'FAR 19.14' },
  { code: 'SDVOSBS', label: 'Service-Disabled Veteran-Owned Small Business (SDVOSB) Sole Source', farReference: 'FAR 19.14' },
  { code: 'WOSB', label: 'SBA Certified Women-Owned Small Business (WOSB) Program Set-Aside', farReference: 'FAR 19.15' },
  { code: 'WOSBSS', label: 'SBA Certified Women-Owned Small Business (WOSB) Program Sole Source', farReference: 'FAR 19.15' },
  { code: 'EDWOSB', label: 'SBA Certified Economically Disadvantaged WOSB (EDWOSB) Program Set-Aside', farReference: 'FAR 19.15' },
  { code: 'EDWOSBSS', label: 'SBA Certified Economically Disadvantaged WOSB (EDWOSB) Program Sole Source', farReference: 'FAR 19.15' },
  { code: 'LAS', label: 'Local Area Set-Aside', farReference: 'FAR 26.2' },
  { code: 'IEE', label: 'Indian Economic Enterprise (IEE) Set-Aside (specific to Department of Interior and Indian Health Services)' },
  { code: 'ISBEE', label: 'Indian Small Business Economic Enterprise (ISBEE) Set-Aside (specific to Department of Interior and Indian Health Services)' },
  { code: 'BICiv', label: 'Buy Indian Set-Aside (specific to Department of Health and Human Services, Indian Health Services)' },
  { code: 'VSA', label: 'Veteran-Owned Small Business Set-Aside (specific to Department of Veterans Affairs)' },
  { code: 'VSS', label: 'Veteran-Owned Small Business Sole source (specific to Department of Veterans Affairs)' },
]

// Create lookup maps for fast access
export const SET_ASIDE_BY_CODE: Record<string, SetAsideOption> = 
  SET_ASIDE_OPTIONS.reduce((acc, option) => {
    acc[option.code] = option
    return acc
  }, {} as Record<string, SetAsideOption>)

export const SET_ASIDE_LABEL_BY_CODE: Record<string, string> = 
  SET_ASIDE_OPTIONS.reduce((acc, option) => {
    acc[option.code] = option.label
    return acc
  }, {} as Record<string, string>)

// Reverse mapping for form submissions
export const SET_ASIDE_CODE_BY_LABEL: Record<string, string> = 
  SET_ASIDE_OPTIONS.reduce((acc, option) => {
    acc[option.label] = option.code
    return acc
  }, {} as Record<string, string>)

/**
 * US States and Territories
 * Matches SAM.gov place of performance codes
 */
export interface LocationOption {
  code: string  // 2-letter state/territory code
  label: string // Full name
  type: 'state' | 'territory' | 'other'
}

export const US_STATES_AND_TERRITORIES: LocationOption[] = [
  { code: '', label: 'Any State/Territory', type: 'other' },
  // States
  { code: 'AL', label: 'Alabama', type: 'state' },
  { code: 'AK', label: 'Alaska', type: 'state' },
  { code: 'AZ', label: 'Arizona', type: 'state' },
  { code: 'AR', label: 'Arkansas', type: 'state' },
  { code: 'CA', label: 'California', type: 'state' },
  { code: 'CO', label: 'Colorado', type: 'state' },
  { code: 'CT', label: 'Connecticut', type: 'state' },
  { code: 'DE', label: 'Delaware', type: 'state' },
  { code: 'FL', label: 'Florida', type: 'state' },
  { code: 'GA', label: 'Georgia', type: 'state' },
  { code: 'HI', label: 'Hawaii', type: 'state' },
  { code: 'ID', label: 'Idaho', type: 'state' },
  { code: 'IL', label: 'Illinois', type: 'state' },
  { code: 'IN', label: 'Indiana', type: 'state' },
  { code: 'IA', label: 'Iowa', type: 'state' },
  { code: 'KS', label: 'Kansas', type: 'state' },
  { code: 'KY', label: 'Kentucky', type: 'state' },
  { code: 'LA', label: 'Louisiana', type: 'state' },
  { code: 'ME', label: 'Maine', type: 'state' },
  { code: 'MD', label: 'Maryland', type: 'state' },
  { code: 'MA', label: 'Massachusetts', type: 'state' },
  { code: 'MI', label: 'Michigan', type: 'state' },
  { code: 'MN', label: 'Minnesota', type: 'state' },
  { code: 'MS', label: 'Mississippi', type: 'state' },
  { code: 'MO', label: 'Missouri', type: 'state' },
  { code: 'MT', label: 'Montana', type: 'state' },
  { code: 'NE', label: 'Nebraska', type: 'state' },
  { code: 'NV', label: 'Nevada', type: 'state' },
  { code: 'NH', label: 'New Hampshire', type: 'state' },
  { code: 'NJ', label: 'New Jersey', type: 'state' },
  { code: 'NM', label: 'New Mexico', type: 'state' },
  { code: 'NY', label: 'New York', type: 'state' },
  { code: 'NC', label: 'North Carolina', type: 'state' },
  { code: 'ND', label: 'North Dakota', type: 'state' },
  { code: 'OH', label: 'Ohio', type: 'state' },
  { code: 'OK', label: 'Oklahoma', type: 'state' },
  { code: 'OR', label: 'Oregon', type: 'state' },
  { code: 'PA', label: 'Pennsylvania', type: 'state' },
  { code: 'RI', label: 'Rhode Island', type: 'state' },
  { code: 'SC', label: 'South Carolina', type: 'state' },
  { code: 'SD', label: 'South Dakota', type: 'state' },
  { code: 'TN', label: 'Tennessee', type: 'state' },
  { code: 'TX', label: 'Texas', type: 'state' },
  { code: 'UT', label: 'Utah', type: 'state' },
  { code: 'VT', label: 'Vermont', type: 'state' },
  { code: 'VA', label: 'Virginia', type: 'state' },
  { code: 'WA', label: 'Washington', type: 'state' },
  { code: 'WV', label: 'West Virginia', type: 'state' },
  { code: 'WI', label: 'Wisconsin', type: 'state' },
  { code: 'WY', label: 'Wyoming', type: 'state' },
  { code: 'DC', label: 'District of Columbia', type: 'state' },
  // Territories
  { code: 'AS', label: 'American Samoa', type: 'territory' },
  { code: 'GU', label: 'Guam', type: 'territory' },
  { code: 'MP', label: 'Northern Mariana Islands', type: 'territory' },
  { code: 'PR', label: 'Puerto Rico', type: 'territory' },
  { code: 'VI', label: 'U.S. Virgin Islands', type: 'territory' },
  { code: 'UM', label: 'U.S. Minor Outlying Islands', type: 'territory' },
]

// Lookup maps
export const LOCATION_BY_CODE: Record<string, LocationOption> = 
  US_STATES_AND_TERRITORIES.reduce((acc, loc) => {
    acc[loc.code] = loc
    return acc
  }, {} as Record<string, LocationOption>)

export const LOCATION_LABEL_BY_CODE: Record<string, string> = 
  US_STATES_AND_TERRITORIES.reduce((acc, loc) => {
    acc[loc.code] = loc.label
    return acc
  }, {} as Record<string, string>)

/**
 * Procurement Types (Notice Types)
 */
export interface ProcurementTypeOption {
  code: string
  label: string
}

export const PROCUREMENT_TYPE_OPTIONS: ProcurementTypeOption[] = [
  { code: '', label: 'All Types' },
  { code: 'o', label: 'Solicitation' },
  { code: 'p', label: 'Pre-Solicitation' },
  { code: 'k', label: 'Combined Synopsis/Solicitation' },
  { code: 'r', label: 'Sources Sought' },
  { code: 'g', label: 'Sale of Surplus Property' },
  { code: 's', label: 'Special Notice' },
  { code: 'i', label: 'Intent to Bundle Requirements' },
  { code: 'a', label: 'Award Notice' },
  { code: 'u', label: 'Justification and Authorization' },
]

/**
 * Opportunity Status
 */
export interface StatusOption {
  code: string
  label: string
}

export const STATUS_OPTIONS: StatusOption[] = [
  { code: '', label: 'All Statuses' },
  { code: 'active', label: 'Active' },
  { code: 'inactive', label: 'Inactive' },
  { code: 'archived', label: 'Archived' },
  { code: 'cancelled', label: 'Cancelled' },
]

/**
 * Helper function to get display label from code
 */
export function getSetAsideLabel(code: string): string {
  return SET_ASIDE_LABEL_BY_CODE[code] || code
}

export function getLocationLabel(code: string): string {
  return LOCATION_LABEL_BY_CODE[code] || code
}

/**
 * Helper function for multi-select: convert array of codes to comma-separated string
 */
export function setAsideCodesToString(codes: string[]): string {
  return codes.filter(Boolean).join(',')
}

/**
 * Helper function for multi-select: convert comma-separated string to array of codes
 */
export function stringToSetAsideCodes(str: string): string[] {
  return str.split(',').map(s => s.trim()).filter(Boolean)
}

export function locationCodesToString(codes: string[]): string {
  return codes.filter(Boolean).join(',')
}

export function stringToLocationCodes(str: string): string[] {
  return str.split(',').map(s => s.trim()).filter(Boolean)
}