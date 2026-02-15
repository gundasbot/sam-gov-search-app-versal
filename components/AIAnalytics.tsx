// components/AIAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { Sparkles, TrendingUp, AlertCircle, Target, DollarSign, Calendar, Loader2, ChevronDown, ChevronUp, Zap } from 'lucide-react'

interface AIAnalyticsProps {
  opportunities: any[]
  filters: {
    setAside?: string
    procurementType?: string
    naics?: string
    agency?: string
  }
}

export default function AIAnalytics({ opportunities, filters }: AIAnalyticsProps) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)

  const analyzeResults = async () => {
    if (opportunities.length === 0) return
    
    setLoading(true)
    setError(null)

    try {
      // Prepare data for Claude
      const sampleOpps = opportunities.slice(0, 20) // Sample first 20
      const summary = {
        totalCount: opportunities.length,
        filters: filters,
        agencies: [...new Set(opportunities.map(o => o.fullParentPathName || o.department).filter(Boolean))].slice(0, 10),
        naicsCodes: [...new Set(opportunities.map(o => o.naicsCode).filter(Boolean))].slice(0, 15),
        setAsides: [...new Set(opportunities.map(o => o.setAside).filter(Boolean))],
        types: [...new Set(opportunities.map(o => o.type).filter(Boolean))],
        sampleTitles: sampleOpps.map(o => o.title).filter(Boolean).slice(0, 10),
        urgentCount: opportunities.filter(o => {
          if (!o.responseDeadLine) return false
          const daysUntil = Math.ceil((new Date(o.responseDeadLine).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
          return daysUntil <= 7
        }).length
      }

      const prompt = `You are analyzing federal contracting opportunities. Based on this data:

Total Opportunities: ${summary.totalCount}
Active Filters: ${JSON.stringify(filters, null, 2)}

Key Statistics:
- Agencies: ${summary.agencies.join(', ')}
- NAICS Codes: ${summary.naicsCodes.join(', ')}
- Set-Asides: ${summary.setAsides.join(', ')}
- Opportunity Types: ${summary.types.join(', ')}
- Urgent (≤7 days): ${summary.urgentCount}

Sample Opportunity Titles:
${summary.sampleTitles.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Provide a concise analysis in JSON format:
{
  "keyInsights": ["insight 1", "insight 2", "insight 3"],
  "trends": ["trend 1", "trend 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "competitionLevel": "low|medium|high",
  "estimatedContractValue": "description",
  "urgencyNote": "description if urgent opportunities exist"
}

Be specific, actionable, and focus on helping a contractor win these bids.`

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        // Surface the actual API error instead of a generic message
        let errorDetail = `API error ${response.status}`
        try {
          const errBody = await response.json()
          errorDetail = errBody?.error || errBody?.message || JSON.stringify(errBody) || errorDetail
        } catch {
          try {
            errorDetail = await response.text() || errorDetail
          } catch { /* ignore */ }
        }
        throw new Error(errorDetail)
      }

      const data = await response.json()
      
      // Handle both { content: [{type:'text', text:'...'}] } and { result: '...' } shapes
      let analysisText = ''
      if (Array.isArray(data.content)) {
        analysisText = data.content.find((c: any) => c.type === 'text')?.text || ''
      } else if (typeof data.result === 'string') {
        analysisText = data.result
      } else if (typeof data.text === 'string') {
        analysisText = data.text
      } else if (typeof data === 'string') {
        analysisText = data
      }

      if (!analysisText) {
        console.error('Unexpected /api/analyze response shape:', data)
        throw new Error('No analysis text in response')
      }
      // Strip ```json fences if present, then extract JSON object
      const cleaned = analysisText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0])
          setAnalysis(parsed)
        } catch (parseErr) {
          console.error('JSON parse failed:', jsonMatch[0])
          throw new Error('Failed to parse analysis JSON')
        }
      } else {
        console.error('No JSON object found in response:', analysisText)
        throw new Error('Failed to parse analysis')
      }
    } catch (err: any) {
      console.error('AI Analysis error:', err)
      setError(err.message || 'Failed to generate analysis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Auto-analyze when opportunities change
    if (opportunities.length > 0 && !analysis) {
      analyzeResults()
    }
  }, [opportunities])

  if (opportunities.length === 0) return null

  return (
    <div className="mt-6 rounded-2xl overflow-hidden border border-[#0d1f3c]/20 shadow-lg">
      {/* Full-width logo banner */}
      <div className="relative w-full bg-[#0d1f3c] flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-5">
          <Image
            src="/precise-govcon-logo-light.png"
            alt="Precise GovCon"
            width={320}
            height={70}
            className="h-14 w-auto object-contain"
            priority
          />
          <div className="h-8 w-px bg-white/20" />
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-[#f97316]" />
            <span className="text-white font-semibold text-sm tracking-wide">Contract Intelligence</span>
            <span className="px-2 py-0.5 rounded-full bg-[#f97316]/20 border border-[#f97316]/40 text-[#f97316] text-xs font-bold uppercase tracking-wider">Live</span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold transition-all"
        >
          {expanded ? (
            <><ChevronUp className="h-4 w-4" /> Collapse</>
          ) : (
            <><ChevronDown className="h-4 w-4" /> View Insights</>
          )}
        </button>
      </div>

      {/* Content area */}
      <div className="bg-gradient-to-br from-slate-50 to-blue-50/40 p-6">

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-[#0d1f3c] animate-spin" />
          <span className="ml-3 text-gray-600">Analyzing opportunities...</span>
        </div>
      )}

      {error && (
        <div className="flex flex-col gap-3 p-4 rounded-lg bg-red-50 border border-red-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-700 mb-0.5">Analysis failed</p>
              <p className="text-xs text-red-600 break-all">{error}</p>
            </div>
          </div>
          <button
            onClick={analyzeResults}
            className="self-start px-3 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Retry Analysis
          </button>
        </div>
      )}

      {analysis && expanded && (
        <div className="space-y-4">
          {/* Key Insights */}
          {analysis.keyInsights && analysis.keyInsights.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" />
                Key Insights
              </h4>
              <ul className="space-y-2">
                {analysis.keyInsights.map((insight: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-emerald-600 font-bold">•</span>
                    {insight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trends */}
          {analysis.trends && analysis.trends.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                Market Trends
              </h4>
              <ul className="space-y-2">
                {analysis.trends.map((trend: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-blue-500 font-bold">→</span>
                    {trend}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && analysis.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-green-600" />
                Recommendations
              </h4>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 font-bold">✓</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {analysis.competitionLevel && (
              <div className="p-3 rounded-lg bg-white border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Competition Level</div>
                <div className={`font-semibold ${
                  analysis.competitionLevel === 'high' ? 'text-red-600' :
                  analysis.competitionLevel === 'medium' ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {analysis.competitionLevel.toUpperCase()}
                </div>
              </div>
            )}

            {analysis.estimatedContractValue && (
              <div className="p-3 rounded-lg bg-white border border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Est. Value Range</div>
                <div className="font-semibold text-gray-900 text-sm">
                  {analysis.estimatedContractValue}
                </div>
              </div>
            )}
          </div>

          {/* Urgency Note */}
          {analysis.urgencyNote && (
            <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
              <div className="flex items-start gap-2">
                <Calendar className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-orange-900 text-sm mb-1">Urgent Action Needed</div>
                  <div className="text-sm text-orange-700">{analysis.urgencyNote}</div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={analyzeResults}
            className="mt-4 w-full py-2 px-4 rounded-lg bg-[#0d1f3c] hover:bg-[#162d50] text-white font-semibold transition-all flex items-center justify-center gap-2 border border-[#0d1f3c]/20"
          >
            <Sparkles className="h-4 w-4" />
            Refresh Analysis
          </button>
        </div>
      )}

      {analysis && !expanded && (
        <div className="text-sm text-gray-600">
          Click to expand AI insights including key findings, trends, and recommendations
        </div>
      )}
      </div>
    </div>
  )
}