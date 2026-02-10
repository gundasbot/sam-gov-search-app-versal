// lib/date-defaults.ts
// Utility functions for default date ranges

/**
 * Get default response deadline FROM date (today + 30 days)
 * This is a soft default that reflects the actual date being set
 */
export function getDefaultResponseDeadlineFrom(): Date {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date
}

/**
 * Get default response deadline TO date (today + 6 months)
 * Gives a reasonable upper bound for responses
 */
export function getDefaultResponseDeadlineTo(): Date {
  const date = new Date()
  date.setMonth(date.getMonth() + 6)
  return date
}

/**
 * Get default posted after date (6 months ago)
 */
export function getDefaultPostedAfter(): Date {
  const date = new Date()
  date.setMonth(date.getMonth() - 6)
  return date
}

/**
 * Get all default date ranges for search forms
 */
export function getDefaultDateRanges() {
  return {
    postedAfter: getDefaultPostedAfter(),
    responseDeadlineFrom: getDefaultResponseDeadlineFrom(),
    responseDeadlineTo: getDefaultResponseDeadlineTo(),
  }
}

/**
 * Format date to MM/dd/yyyy for SAM.gov API
 */
export function formatDateForSAMGov(date: Date | string | null): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

/**
 * Format date to ISO string for database storage
 */
export function formatDateForDB(date: Date | string | null): string | null {
  if (!date) return null
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return null
  return d.toISOString()
}

/**
 * Format date for display (e.g., "Feb 5, 2026")
 */
export function formatDateForDisplay(date: Date | string | null): string {
  if (!date) return 'Not set'
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return 'Invalid date'
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Check if a date is within a valid range
 */
export function isDateInFuture(date: Date | string | null): boolean {
  if (!date) return false
  const d = date instanceof Date ? date : new Date(date)
  return d > new Date()
}

/**
 * Get date range description for UI
 */
export function getDateRangeDescription(from: Date | null, to: Date | null): string {
  if (!from && !to) return 'No date range set'
  if (!from) return `Before ${formatDateForDisplay(to)}`
  if (!to) return `After ${formatDateForDisplay(from)}`
  return `${formatDateForDisplay(from)} - ${formatDateForDisplay(to)}`
}