export type OpportunityForScoring = {
  title?: string | null
  description?: string | null
  agency?: string | null
  department?: string | null
  naicsCode?: string | null
  naics?: string | null
  setAside?: string | null
  typeOfSetAside?: string | null
  value?: number | null
  postedDate?: string | Date | null
  updatedPostedDate?: string | Date | null
  responseDeadline?: string | Date | null
  responseDeadLine?: string | Date | null
  response_deadline?: string | Date | null
}

export type SearchFiltersForScoring = {
  naics?: string
  setaside?: string
  agency?: string
}

export type SearchProfileForScoring = {
  query?: string
  filters?: SearchFiltersForScoring
}

export type UserPreferencesForScoring = {
  setAsides?: string[]
  naicsCodes?: string[]
  agencies?: string[]
  contractSizeMin?: number
  contractSizeMax?: number
  keywords?: string[]
}

export type MatchScoreBreakdown = {
  keywordPoints: number
  naicsPoints: number
  setAsidePoints: number
  agencyPoints: number
  contractSizePoints: number
  freshnessPoints: number
  deadlineBoostPoints: number
  penalties: string[]
  total: number
}

function normalizeDate(value: unknown): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date
}

function normalizeText(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function tokenize(text: string): string[] {
  return text
    .split(/[^a-z0-9]+/i)
    .map((token) => token.trim().toLowerCase())
    .filter((token) => token.length >= 3)
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function pickDeadline(opportunity: OpportunityForScoring): Date | null {
  return (
    normalizeDate(opportunity.responseDeadline) ||
    normalizeDate(opportunity.responseDeadLine) ||
    normalizeDate(opportunity.response_deadline)
  )
}

function pickPostedDate(opportunity: OpportunityForScoring): Date | null {
  return normalizeDate(opportunity.updatedPostedDate) || normalizeDate(opportunity.postedDate)
}

export function calculateMatchScoreDetailed(
  opportunity: OpportunityForScoring,
  searches: SearchProfileForScoring[],
  preferences?: UserPreferencesForScoring
): MatchScoreBreakdown {
  const penalties: string[] = []
  const now = Date.now()

  const deadline = pickDeadline(opportunity)
  if (deadline) {
    const msUntilDeadline = deadline.getTime() - now
    if (msUntilDeadline <= 0) {
      penalties.push('expired')
      return {
        keywordPoints: 0,
        naicsPoints: 0,
        setAsidePoints: 0,
        agencyPoints: 0,
        contractSizePoints: 0,
        freshnessPoints: 0,
        deadlineBoostPoints: 0,
        penalties,
        total: 0,
      }
    }
    if (msUntilDeadline < 24 * 60 * 60 * 1000) {
      penalties.push('deadline_under_24h')
      return {
        keywordPoints: 0,
        naicsPoints: 0,
        setAsidePoints: 0,
        agencyPoints: 0,
        contractSizePoints: 0,
        freshnessPoints: 0,
        deadlineBoostPoints: 0,
        penalties,
        total: 0,
      }
    }
  }

  const title = normalizeText(opportunity.title)
  const description = normalizeText(opportunity.description)
  const haystack = `${title} ${description}`.trim()

  const searchKeywords = searches.flatMap((search) => tokenize(normalizeText(search.query)))
  const preferenceKeywords = (preferences?.keywords || []).flatMap((keyword) => tokenize(normalizeText(keyword)))
  const allKeywords = Array.from(new Set([...searchKeywords, ...preferenceKeywords]))
  const matchedKeywords = allKeywords.filter((keyword) => haystack.includes(keyword))
  const keywordRatio = allKeywords.length ? matchedKeywords.length / allKeywords.length : 0
  const keywordPoints = clamp(Math.round(keywordRatio * 30), 0, 30)

  const opportunityNaics = normalizeText(opportunity.naicsCode || opportunity.naics)
  const desiredNaics = Array.from(
    new Set([
      ...(preferences?.naicsCodes || []).map((code) => normalizeText(code)),
      ...searches.map((search) => normalizeText(search.filters?.naics)),
    ].filter(Boolean))
  )
  const naicsMatch = desiredNaics.some((code) => opportunityNaics.startsWith(code) || code.startsWith(opportunityNaics))
  const naicsPoints = naicsMatch ? 25 : 0

  const opportunitySetAside = normalizeText(opportunity.setAside || opportunity.typeOfSetAside)
  const desiredSetAsides = Array.from(
    new Set([
      ...(preferences?.setAsides || []).map((value) => normalizeText(value)),
      ...searches.map((search) => normalizeText(search.filters?.setaside)),
    ].filter(Boolean))
  )
  const setAsideMatch = desiredSetAsides.some((value) => opportunitySetAside.includes(value) || value.includes(opportunitySetAside))
  const setAsidePoints = setAsideMatch ? 20 : 0

  const opportunityAgency = normalizeText(opportunity.agency || opportunity.department)
  const desiredAgencies = Array.from(
    new Set([
      ...(preferences?.agencies || []).map((value) => normalizeText(value)),
      ...searches.map((search) => normalizeText(search.filters?.agency)),
    ].filter(Boolean))
  )
  const agencyMatch = desiredAgencies.some((value) => opportunityAgency.includes(value) || value.includes(opportunityAgency))
  const agencyPoints = agencyMatch ? 15 : 0

  const value = Number(opportunity.value || 0)
  let contractSizePoints = 0
  if (value > 0) {
    const min = typeof preferences?.contractSizeMin === 'number' ? preferences.contractSizeMin : undefined
    const max = typeof preferences?.contractSizeMax === 'number' ? preferences.contractSizeMax : undefined
    const minOk = min == null || value >= min
    const maxOk = max == null || value <= max
    contractSizePoints = minOk && maxOk ? 10 : 0
  }

  const postedDate = pickPostedDate(opportunity)
  const freshnessPoints = (() => {
    if (!postedDate) return 0
    const ageDays = Math.max(0, Math.floor((now - postedDate.getTime()) / (24 * 60 * 60 * 1000)))
    // Full 10 points when posted today, linearly decays to 0 at 90 days.
    return clamp(Math.round(10 * (1 - ageDays / 90)), 0, 10)
  })()

  const deadlineBoostPoints = (() => {
    if (!deadline) return 0
    const daysLeft = Math.ceil((deadline.getTime() - now) / (24 * 60 * 60 * 1000))
    if (daysLeft <= 3) return 10
    if (daysLeft <= 7) return 8
    if (daysLeft <= 14) return 6
    if (daysLeft <= 30) return 3
    return 0
  })()

  const total = clamp(
    keywordPoints +
      naicsPoints +
      setAsidePoints +
      agencyPoints +
      contractSizePoints +
      freshnessPoints +
      deadlineBoostPoints,
    0,
    100
  )

  return {
    keywordPoints,
    naicsPoints,
    setAsidePoints,
    agencyPoints,
    contractSizePoints,
    freshnessPoints,
    deadlineBoostPoints,
    penalties,
    total,
  }
}

export function calculateMatchScore(
  opportunity: OpportunityForScoring,
  searches: SearchProfileForScoring[],
  preferences?: UserPreferencesForScoring
): number {
  return calculateMatchScoreDetailed(opportunity, searches, preferences).total
}

