// components/AIAnalytics.tsx
'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, AlertCircle, Target, DollarSign, Calendar, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

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
        throw new Error('Failed to generate analysis')
      }

      const data = await response.json()
      const analysisText = data.content.find((c: any) => c.type === 'text')?.text || ''
      
      // Extract JSON from response (Claude might wrap it in markdown)
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        setAnalysis(parsed)
      } else {
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
    <div className="mt-6 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">AI-Powered Insights</h3>
            <p className="text-sm text-gray-600">Powered by Claude Sonnet 4</p>
          </div>
        </div>
        
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-2 rounded-lg hover:bg-white/50 transition-colors"
        >
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 text-purple-500 animate-spin" />
          <span className="ml-3 text-gray-600">Analyzing opportunities...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-50 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
        </div>
      )}

      {analysis && expanded && (
        <div className="space-y-4">
          {/* Key Insights */}
          {analysis.keyInsights && analysis.keyInsights.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-purple-600" />
                Key Insights
              </h4>
              <ul className="space-y-2">
                {analysis.keyInsights.map((insight: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-purple-500 font-bold">•</span>
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
            className="mt-4 w-full py-2 px-4 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:from-purple-700 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
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
  )
}