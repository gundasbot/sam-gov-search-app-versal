// app/api/ai/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { coalesceInFlight } from '@/lib/in-flight-coalescer'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const ANALYTICS_CACHE_TTL_MS = 15 * 60 * 1000 // 15 minutes
const ANALYTICS_CACHE = new Map<string, { payload: any; expiresAt: number }>()
const ANALYTICS_CACHE_LIMIT = 20

function getAnalyticsCache(key: string) {
  const hit = ANALYTICS_CACHE.get(key)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    ANALYTICS_CACHE.delete(key)
    return null
  }
  return hit.payload
}

function setAnalyticsCache(key: string, payload: any) {
  if (ANALYTICS_CACHE.size >= ANALYTICS_CACHE_LIMIT) {
    const oldest = ANALYTICS_CACHE.keys().next().value
    if (oldest) ANALYTICS_CACHE.delete(oldest)
  }
  ANALYTICS_CACHE.set(key, { payload, expiresAt: Date.now() + ANALYTICS_CACHE_TTL_MS })
}

const AnalyticsSchema = {
  name: 'GovConAnalytics',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: {
        type: 'object',
        properties: {
          totalContracts: { type: 'number' },
          totalValue: { type: 'string' },
          avgContractValue: { type: 'string' },
          topSector: { type: 'string' },
          growthRate: { type: 'number' }
        },
        required: ['totalContracts', 'totalValue', 'avgContractValue', 'topSector', 'growthRate']
      },
      trends: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            category: { type: 'string' },
            direction: { type: 'string', enum: ['up', 'down', 'stable'] },
            percentage: { type: 'number' },
            insight: { type: 'string' }
          },
          required: ['category', 'direction', 'percentage', 'insight']
        }
      },
      insights: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            description: { type: 'string' },
            priority: { type: 'string', enum: ['high', 'medium', 'low'] },
            category: { type: 'string' },
            actionable: { type: 'boolean' }
          },
          required: ['title', 'description', 'priority', 'category', 'actionable']
        }
      },
      predictions: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            sector: { type: 'string' },
            forecast: { type: 'string' },
            confidence: { type: 'number', minimum: 0, maximum: 100 },
            timeframe: { type: 'string' }
          },
          required: ['sector', 'forecast', 'confidence', 'timeframe']
        }
      },
      agencyAnalysis: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            agency: { type: 'string' },
            contractCount: { type: 'number' },
            trendDirection: { type: 'string', enum: ['up', 'down', 'stable'] },
            keyFocus: { type: 'string' }
          },
          required: ['agency', 'contractCount', 'trendDirection', 'keyFocus']
        }
      }
    },
    required: ['summary', 'trends', 'insights', 'predictions', 'agencyAnalysis']
  }
} as const

export async function POST(req: NextRequest) {
  try {
    const cacheKey = 'ai-analytics:default'
    const refresh = ['1', 'true', 'yes'].includes(
      (req.nextUrl.searchParams.get('refresh') || '').toLowerCase()
    )
    if (!refresh) {
      const cached = getAnalyticsCache(cacheKey)
      if (cached) {
        return NextResponse.json({ ...cached, cached: true, source: 'cache' })
      }
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'Missing ANTHROPIC_API_KEY' },
        { status: 500 }
      )
    }

    // Fetch real data from SAM.gov (non-fatal fallback if unavailable)
    let opportunities: any[] = []
    try {
      const postedFrom = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      const postedTo = new Date().toISOString().split('T')[0]
      const samUrl = `https://api.sam.gov/opportunities/v2/search?api_key=${process.env.SAM_GOV_API_KEY}&limit=100&postedFrom=${postedFrom}&postedTo=${postedTo}`
      const samPayload = await coalesceInFlight<any>(
        `sam:ai-analytics:window:${postedFrom}:${postedTo}`,
        async () => {
          const response = await fetch(samUrl, { headers: { 'Accept': 'application/json' } })
          if (!response.ok) {
            return { ok: false, status: response.status, opportunitiesData: [] }
          }
          const data = await response.json()
          return { ok: true, status: 200, opportunitiesData: data?.opportunitiesData || [] }
        }
      )
      if (samPayload?.ok) {
        opportunities = samPayload.opportunitiesData || []
      } else {
        console.warn(`SAM.gov API returned ${samPayload?.status || 'unknown'} — proceeding with empty dataset`)
      }
    } catch (samErr) {
      console.warn('SAM.gov fetch failed — proceeding with empty dataset:', samErr)
    }

    // Calculate basic statistics
    const totalContracts = opportunities.length
    const agencyCounts: { [key: string]: number } = {}
    const naicsCounts: { [key: string]: number } = {}
    const setAsideCounts: { [key: string]: number } = {}

    opportunities.forEach((opp: any) => {
      const agency = opp.department || 'Unknown'
      agencyCounts[agency] = (agencyCounts[agency] || 0) + 1

      const naics = opp.naicsCode || 'Unknown'
      naicsCounts[naics] = (naicsCounts[naics] || 0) + 1

      if (opp.typeOfSetAsideDescription) {
        setAsideCounts[opp.typeOfSetAsideDescription] = 
          (setAsideCounts[opp.typeOfSetAsideDescription] || 0) + 1
      }
    })

    const system = [
      'You are an expert federal contracting market analyst.',
      'Generate comprehensive analytics based on recent SAM.gov contract data.',
      'Provide actionable insights, identify trends, and make data-driven predictions.',
      'Focus on patterns in agency behavior, sector growth, and market opportunities.',
      'IMPORTANT: Return your response as a valid JSON object that matches this exact structure:',
      JSON.stringify(AnalyticsSchema.schema, null, 2),
      'Do not include any additional text, explanations, or markdown formatting. Only return the JSON object.'
    ].join(' ')

    const userPrompt = `Analyze ${totalContracts} federal contracts from the past 30 days.

TOP AGENCIES:
${Object.entries(agencyCounts)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([agency, count]) => `- ${agency}: ${count} contracts`)
  .join('\n')}

TOP NAICS CODES:
${Object.entries(naicsCounts)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 10)
  .map(([naics, count]) => `- ${naics}: ${count} contracts`)
  .join('\n')}

SET-ASIDE PROGRAMS:
${Object.entries(setAsideCounts)
  .sort(([, a], [, b]) => b - a)
  .map(([type, count]) => `- ${type}: ${count} contracts`)
  .join('\n')}

Generate:
1. Executive summary with key metrics
2. 6 market trends with directional indicators
3. 4-5 actionable insights (mix of high/medium priority)
4. 4 sector predictions for next quarter
5. Analysis of top 6 agencies with their current focus areas

Be specific and data-driven. Focus on competitive intelligence and strategic opportunities.
Return ONLY a valid JSON object matching the schema provided in the system prompt.`

    const resp = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      temperature: 0.4,
      system,
      messages: [
        {
          role: 'user',
          content: userPrompt
        }
      ]
      // Removed: response_format parameter
    })

    const firstBlock: any = resp?.content?.[0]
    
    let json
    if (firstBlock?.type === 'text') {
      try {
        const text = firstBlock.text
        // Try to extract JSON from the response
        const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                         text.match(/```\n([\s\S]*?)\n```/) ||
                         text.match(/(\{[\s\S]*\})/)
        
        if (jsonMatch) {
          json = JSON.parse(jsonMatch[1] || jsonMatch[0])
        } else {
          // Try parsing the whole text as JSON
          json = JSON.parse(text)
        }
      } catch (e) {
        console.error('Failed to parse text response:', e, 'Text:', firstBlock.text)
        return NextResponse.json(
          { error: 'Invalid JSON response from AI' },
          { status: 500 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'No valid response from Claude' },
        { status: 500 }
      )
    }

    // Validate response structure
    if (!json.summary || !json.trends || !json.insights) {
      console.error('Invalid response structure:', json)
      return NextResponse.json(
        { error: 'Invalid analytics structure' },
        { status: 500 }
      )
    }

    setAnalyticsCache(cacheKey, json)
    return NextResponse.json({ ...json, cached: false, source: 'live' })
  } catch (err: any) {
    console.error('Analytics generation error:', err)
    const fallback = getAnalyticsCache('ai-analytics:default')
    if (fallback) {
      return NextResponse.json({ ...fallback, cached: true, stale: true, source: 'cache-fallback' })
    }
    return NextResponse.json(
      {
        error: 'Failed to generate analytics',
        detail: err?.message ?? String(err)
      },
      { status: 500 }
    )
  }
}
