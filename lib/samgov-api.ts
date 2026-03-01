// lib/samgov-api.ts

interface SAMAPIConfig {
  apiKey: string
  baseUrl?: string
}

export interface SAMOpportunity {
  noticeId: string
  title: string
  solicitationNumber: string
  department: string
  subTier: string
  office: string
  postedDate: string
  type: string
  baseType: string
  archiveType: string
  archiveDate: string
  typeOfSetAsideDescription: string
  typeOfSetAside: string
  responseDeadLine: string
  naicsCode: string
  classificationCode: string
  active: string
  award?: {
    date: string
    number: string
    amount: string
    awardee: {
      name: string
      location: {
        streetAddress: string
        city: { code: string; name: string }
        state: { code: string; name: string }
        zip: string
        country: { code: string; name: string }
      }
    }
  }
  pointOfContact: Array<{
    fax: string
    type: string
    email: string
    phone: string
    title: string
    fullName: string
  }>
  description: string
  organizationType: string
  officeAddress: {
    zipcode: string
    city: string
    countryCode: string
    state: string
  }
  placeOfPerformance: {
    streetAddress: string
    city: { code: string; name: string }
    state: { code: string; name: string }
    zip: string
    country: { code: string; name: string }
  }
  additionalInfoLink: string
  uiLink: string
  links: Array<{
    rel: string
    href: string
  }>
  resourceLinks: string[]
}

export interface SAMSearchParams {
  keyword?: string
  postedFrom?: string
  postedTo?: string
  sortBy?: string
  limit?: number
  offset?: number
  ncode?: string // NAICS code
  ccode?: string // PSC code
  state?: string
  deptname?: string
  subtier?: string
  ptype?: string // procurement type
}

export interface SAMSearchResponse {
  totalRecords: number
  limit: number
  offset: number
  opportunitiesData: SAMOpportunity[]
}

export interface SAMStatistics {
  totalOpportunities: number
  activeOpportunities: number
  opportunitiesByType: Record<string, number>
  opportunitiesByAgency: Record<string, number>
  opportunitiesByNAICS: Record<string, number>
  opportunitiesBySetAside: Record<string, number>
  averageContractValue: number
  upcomingDeadlines: number
  recentlyPosted: number
}

export class SAMGovAPI {
  private config: SAMAPIConfig

  constructor(config: SAMAPIConfig) {
    this.config = {
      ...config,
      baseUrl: config.baseUrl || 'https://api.sam.gov/opportunities/v2'
    }
  }

  /**
   * Search for opportunities in SAM.gov
   */
  async searchOpportunities(params: SAMSearchParams = {}): Promise<SAMSearchResponse> {
    const queryParams = new URLSearchParams()
    
    // Add API key
    queryParams.append('api_key', this.config.apiKey)
    
    // Add search parameters
    if (params.keyword) queryParams.append('q', params.keyword)
    if (params.postedFrom) queryParams.append('postedFrom', params.postedFrom)
    if (params.postedTo) queryParams.append('postedTo', params.postedTo)
    if (params.sortBy) queryParams.append('sortBy', params.sortBy)
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.offset) queryParams.append('offset', params.offset.toString())
    if (params.ncode) queryParams.append('ncode', params.ncode)
    if (params.ccode) queryParams.append('ccode', params.ccode)
    if (params.state) queryParams.append('state', params.state)
    if (params.deptname) queryParams.append('deptname', params.deptname)
    if (params.subtier) queryParams.append('subtier', params.subtier)
    if (params.ptype) queryParams.append('ptype', params.ptype)

    const url = `${this.config.baseUrl}/search?${queryParams.toString()}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`SAM.gov API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching SAM.gov data:', error)
      throw error
    }
  }

  /**
   * Get a specific opportunity by ID
   */
  async getOpportunity(noticeId: string): Promise<SAMOpportunity> {
    const url = `${this.config.baseUrl}/search?api_key=${this.config.apiKey}&noticeId=${noticeId}`

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`SAM.gov API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      return data.opportunitiesData?.[0] || null
    } catch (error) {
      console.error('Error fetching opportunity:', error)
      throw error
    }
  }

  /**
   * Get opportunities posted today
   */
  async getTodaysOpportunities(limit: number = 50): Promise<SAMSearchResponse> {
    const today = new Date().toISOString().split('T')[0]
    return this.searchOpportunities({
      postedFrom: today,
      postedTo: today,
      limit,
      sortBy: '-modifiedDate'
    })
  }

  /**
   * Get opportunities expiring soon (within next 7 days)
   */
  async getExpiringOpportunities(limit: number = 50): Promise<SAMSearchResponse> {
    const today = new Date()
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    const response = await this.searchOpportunities({
      limit: 1000, // Get more to filter locally
      sortBy: 'responseDeadLine'
    })

    // Filter for opportunities expiring within 7 days
    const filtered = response.opportunitiesData.filter(opp => {
      if (!opp.responseDeadLine) return false
      const deadline = new Date(opp.responseDeadLine)
      return deadline >= today && deadline <= nextWeek
    }).slice(0, limit)

    return {
      ...response,
      opportunitiesData: filtered,
      totalRecords: filtered.length
    }
  }

  /**
   * Get opportunities by NAICS code
   */
  async getOpportunitiesByNAICS(naicsCode: string, limit: number = 50): Promise<SAMSearchResponse> {
    return this.searchOpportunities({
      ncode: naicsCode,
      limit,
      sortBy: '-modifiedDate'
    })
  }

  /**
   * Get opportunities by agency
   */
  async getOpportunitiesByAgency(agencyName: string, limit: number = 50): Promise<SAMSearchResponse> {
    return this.searchOpportunities({
      deptname: agencyName,
      limit,
      sortBy: '-modifiedDate'
    })
  }

  /**
   * Get set-aside opportunities (8(a), SDVOSB, etc.)
   */
  async getSetAsideOpportunities(setAsideType: string, limit: number = 50): Promise<SAMSearchResponse> {
    const response = await this.searchOpportunities({
      limit: 1000,
      sortBy: '-modifiedDate'
    })

    const filtered = response.opportunitiesData.filter(opp => 
      opp.typeOfSetAside === setAsideType || 
      opp.typeOfSetAsideDescription?.toLowerCase().includes(setAsideType.toLowerCase())
    ).slice(0, limit)

    return {
      ...response,
      opportunitiesData: filtered,
      totalRecords: filtered.length
    }
  }

  /**
   * Get comprehensive statistics from SAM.gov data
   */
  async getStatistics(): Promise<SAMStatistics> {
    const [recentResponse, allResponse] = await Promise.all([
      this.searchOpportunities({ limit: 1000, sortBy: '-modifiedDate' }),
      this.searchOpportunities({ limit: 100 })
    ])

    const opportunities = recentResponse.opportunitiesData

    // Calculate statistics
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

    const stats: SAMStatistics = {
      totalOpportunities: recentResponse.totalRecords,
      activeOpportunities: opportunities.filter(o => o.active === 'Yes').length,
      opportunitiesByType: {},
      opportunitiesByAgency: {},
      opportunitiesByNAICS: {},
      opportunitiesBySetAside: {},
      averageContractValue: 0,
      upcomingDeadlines: 0,
      recentlyPosted: 0
    }

    opportunities.forEach(opp => {
      // Type distribution
      const type = opp.type || 'Unknown'
      stats.opportunitiesByType[type] = (stats.opportunitiesByType[type] || 0) + 1

      // Agency distribution
      const agency = opp.department || 'Unknown'
      stats.opportunitiesByAgency[agency] = (stats.opportunitiesByAgency[agency] || 0) + 1

      // NAICS distribution
      const naics = opp.naicsCode || 'Unknown'
      stats.opportunitiesByNAICS[naics] = (stats.opportunitiesByNAICS[naics] || 0) + 1

      // Set-aside distribution
      const setAside = opp.typeOfSetAsideDescription || 'None'
      stats.opportunitiesBySetAside[setAside] = (stats.opportunitiesBySetAside[setAside] || 0) + 1

      // Upcoming deadlines
      if (opp.responseDeadLine) {
        const deadline = new Date(opp.responseDeadLine)
        if (deadline <= sevenDaysFromNow && deadline >= now) {
          stats.upcomingDeadlines++
        }
      }

      // Recently posted
      if (opp.postedDate) {
        const posted = new Date(opp.postedDate)
        if (posted >= sevenDaysAgo) {
          stats.recentlyPosted++
        }
      }
    })

    return stats
  }
}

// Singleton instance
let samAPIInstance: SAMGovAPI | null = null

export function getSAMGovAPI(): SAMGovAPI {
  if (!samAPIInstance) {
    const apiKey = process.env.NEXT_PUBLIC_SAM_API_KEY || 
                   process.env.SAM_API_KEY || 
                   process.env.SAM_GOV_API_KEY ||
                   process.env.SAMGOVAPIKEY

    if (!apiKey) {
      throw new Error('SAM.gov API key not configured')
    }

    samAPIInstance = new SAMGovAPI({ apiKey })
  }

  return samAPIInstance
}
