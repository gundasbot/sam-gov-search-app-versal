// lib/ai-analytics.ts

import Anthropic from '@anthropic-ai/sdk'
import { SAMOpportunity, SAMStatistics } from './samgov-api'

interface AIInsight {
  title: string
  description: string
  priority: 'high' | 'medium' | 'low'
  category: 'opportunity' | 'trend' | 'recommendation' | 'alert'
  data?: any
}

interface MarketTrend {
  trend: string
  direction: 'up' | 'down' | 'stable'
  percentage: number
  description: string
  timeframe: string
}

interface OpportunityRecommendation {
  opportunity: SAMOpportunity
  score: number
  reasoning: string
  action: string
}

export class AIAnalyticsService {
  private anthropic: Anthropic

  constructor(apiKey?: string) {
    const key = apiKey || 
                process.env.ANTHROPIC_API_KEY || 
                process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY

    if (!key) {
      throw new Error('Anthropic API key not configured')
    }

    this.anthropic = new Anthropic({
      apiKey: key,
    })
  }

  /**
   * Analyze SAM.gov statistics and generate actionable insights
   */
  async analyzeStatistics(stats: SAMStatistics): Promise<AIInsight[]> {
    const prompt = `You are an expert federal contracting analyst. Analyze the following SAM.gov statistics and provide 5-7 actionable insights for government contractors.

Statistics:
- Total Opportunities: ${stats.totalOpportunities}
- Active Opportunities: ${stats.activeOpportunities}
- Upcoming Deadlines (7 days): ${stats.upcomingDeadlines}
- Recently Posted (7 days): ${stats.recentlyPosted}

Top Agencies:
${Object.entries(stats.opportunitiesByAgency).slice(0, 5).map(([agency, count]) => `- ${agency}: ${count}`).join('\n')}

Top NAICS Codes:
${Object.entries(stats.opportunitiesByNAICS).slice(0, 5).map(([naics, count]) => `- ${naics}: ${count}`).join('\n')}

Set-Aside Distribution:
${Object.entries(stats.opportunitiesBySetAside).slice(0, 5).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Provide insights in JSON format as an array of objects with:
- title (string): Short, punchy title
- description (string): Detailed explanation
- priority (string): "high", "medium", or "low"
- category (string): "opportunity", "trend", "recommendation", or "alert"

Focus on actionable intelligence that helps contractors win more business.`

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = message.content[0]
      if (content.type === 'text') {
        // Extract JSON from the response
        const jsonMatch = content.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }

      return []
    } catch (error) {
      console.error('Error analyzing statistics:', error)
      throw error
    }
  }

  /**
   * Identify market trends from opportunities data
   */
  async identifyTrends(opportunities: SAMOpportunity[]): Promise<MarketTrend[]> {
    const prompt = `Analyze these ${opportunities.length} federal contracting opportunities and identify 3-5 key market trends.

Sample opportunities:
${opportunities.slice(0, 10).map(opp => `
- ${opp.title}
  Agency: ${opp.department}
  NAICS: ${opp.naicsCode}
  Set-Aside: ${opp.typeOfSetAsideDescription || 'None'}
  Posted: ${opp.postedDate}
`).join('\n')}

Provide trends in JSON format as an array of objects with:
- trend (string): Name of the trend
- direction (string): "up", "down", or "stable"
- percentage (number): Estimated percentage change
- description (string): Detailed explanation
- timeframe (string): When this trend is occurring

Focus on spending patterns, emerging technologies, agency priorities, and set-aside opportunities.`

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = message.content[0]
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }

      return []
    } catch (error) {
      console.error('Error identifying trends:', error)
      throw error
    }
  }

  /**
   * Generate personalized opportunity recommendations
   */
  async recommendOpportunities(
    opportunities: SAMOpportunity[],
    userProfile: {
      naicsCodes?: string[]
      preferredAgencies?: string[]
      capabilities?: string[]
      certifications?: string[]
    }
  ): Promise<OpportunityRecommendation[]> {
    const prompt = `You are a federal contracting matchmaker. Analyze these opportunities and recommend the best matches for a contractor with this profile:

NAICS Codes: ${userProfile.naicsCodes?.join(', ') || 'Not specified'}
Preferred Agencies: ${userProfile.preferredAgencies?.join(', ') || 'Not specified'}
Capabilities: ${userProfile.capabilities?.join(', ') || 'Not specified'}
Certifications: ${userProfile.certifications?.join(', ') || 'Not specified'}

Opportunities to analyze:
${opportunities.slice(0, 20).map((opp, i) => `
${i + 1}. ${opp.title}
   Notice ID: ${opp.noticeId}
   Agency: ${opp.department}
   NAICS: ${opp.naicsCode}
   Set-Aside: ${opp.typeOfSetAsideDescription || 'None'}
   Deadline: ${opp.responseDeadLine}
`).join('\n')}

Provide top 5 recommendations in JSON format as an array of objects with:
- noticeId (string): The opportunity notice ID
- score (number): Match score from 0-100
- reasoning (string): Why this is a good match
- action (string): Specific next step to take

Prioritize opportunities that align with their capabilities and have reasonable deadlines.`

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = message.content[0]
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          const recommendations = JSON.parse(jsonMatch[0])
          
          // Match recommendations with actual opportunities
          return recommendations.map((rec: any) => ({
            opportunity: opportunities.find(o => o.noticeId === rec.noticeId)!,
            score: rec.score,
            reasoning: rec.reasoning,
            action: rec.action
          })).filter((r: any) => r.opportunity)
        }
      }

      return []
    } catch (error) {
      console.error('Error generating recommendations:', error)
      throw error
    }
  }

  /**
   * Analyze a specific opportunity and provide bidding strategy
   */
  async analyzeOpportunity(opportunity: SAMOpportunity): Promise<{
    summary: string
    keyRequirements: string[]
    competitiveAnalysis: string
    biddingStrategy: string
    riskAssessment: string
    timeline: Array<{ task: string; deadline: string }>
  }> {
    const prompt = `Analyze this federal contracting opportunity and provide a comprehensive bidding strategy:

Title: ${opportunity.title}
Solicitation: ${opportunity.solicitationNumber}
Agency: ${opportunity.department} - ${opportunity.subTier}
NAICS Code: ${opportunity.naicsCode}
Set-Aside: ${opportunity.typeOfSetAsideDescription || 'None'}
Posted: ${opportunity.postedDate}
Deadline: ${opportunity.responseDeadLine}

Description:
${opportunity.description}

Provide analysis in JSON format with these fields:
- summary (string): Executive summary of the opportunity
- keyRequirements (array of strings): Main technical/business requirements
- competitiveAnalysis (string): Assessment of competition level
- biddingStrategy (string): Recommended approach to win
- riskAssessment (string): Potential risks and mitigation
- timeline (array of objects): Key milestones with { task, deadline }

Be specific and actionable for a contractor preparing to bid.`

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = message.content[0]
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }

      throw new Error('Failed to parse opportunity analysis')
    } catch (error) {
      console.error('Error analyzing opportunity:', error)
      throw error
    }
  }

  /**
   * Generate market intelligence report
   */
  async generateMarketReport(
    opportunities: SAMOpportunity[],
    stats: SAMStatistics,
    focusArea?: string
  ): Promise<{
    executiveSummary: string
    keyFindings: string[]
    opportunities: Array<{ title: string; description: string }>
    threats: Array<{ title: string; description: string }>
    recommendations: string[]
  }> {
    const focusContext = focusArea ? `Focus specifically on: ${focusArea}` : ''

    const prompt = `Generate a market intelligence report for federal contracting based on this data:

${focusContext}

Current Statistics:
- Total Active Opportunities: ${stats.activeOpportunities}
- Upcoming Deadlines: ${stats.upcomingDeadlines}
- Recently Posted: ${stats.recentlyPosted}

Top 3 Agencies:
${Object.entries(stats.opportunitiesByAgency).slice(0, 3).map(([agency, count]) => `- ${agency}: ${count} opportunities`).join('\n')}

Recent Opportunity Samples:
${opportunities.slice(0, 5).map(opp => `- ${opp.title} (${opp.department})`).join('\n')}

Provide a comprehensive market report in JSON format with:
- executiveSummary (string): High-level overview
- keyFindings (array of strings): 5-7 important discoveries
- opportunities (array): 3-5 market opportunities with title and description
- threats (array): 3-5 market threats/challenges with title and description  
- recommendations (array of strings): 5-7 actionable recommendations

Write for C-level executives making strategic decisions.`

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      })

      const content = message.content[0]
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0])
        }
      }

      throw new Error('Failed to parse market report')
    } catch (error) {
      console.error('Error generating market report:', error)
      throw error
    }
  }
}

// Singleton instance
let aiAnalyticsInstance: AIAnalyticsService | null = null

export function getAIAnalytics(): AIAnalyticsService {
  if (!aiAnalyticsInstance) {
    aiAnalyticsInstance = new AIAnalyticsService()
  }
  return aiAnalyticsInstance
}
