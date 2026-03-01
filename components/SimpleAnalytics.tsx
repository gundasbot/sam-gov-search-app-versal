// components/SimpleAnalytics.tsx
'use client'

import { useMemo } from 'react'
import { TrendingUp, AlertCircle, Target, DollarSign, Calendar, Award, Users, CheckCircle } from 'lucide-react'

interface SimpleAnalyticsProps {
  opportunities: any[]
  filters: {
    setAside?: string
    procurementType?: string
    naics?: string
    agency?: string
  }
}

export default function SimpleAnalytics({ opportunities, filters }: SimpleAnalyticsProps) {
  const insights = useMemo(() => {
    if (opportunities.length === 0) return null

    // Calculate key metrics
    const urgentOpps = opportunities.filter(o => {
      if (!o.responseDeadLine) return false
      const daysUntil = Math.ceil((new Date(o.responseDeadLine).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 7 && daysUntil > 0
    })

    const recentOpps = opportunities.filter(o => {
      if (!o.postedDate) return false
      const daysSince = Math.ceil((Date.now() - new Date(o.postedDate).getTime()) / (1000 * 60 * 60 * 24))
      return daysSince <= 7
    })

    // Estimate contract values from descriptions
    const estimatedValues = opportunities
      .map(o => {
        const desc = (o.description || '').toLowerCase()
        const title = (o.title || '').toLowerCase()
        const text = desc + ' ' + title
        
        // Look for dollar amounts
        const matches = text.match(/\$[\d,]+(?:\.\d{2})?(?:\s*(?:million|m|billion|b|thousand|k))?/gi)
        if (matches && matches.length > 0) {
          // Parse the highest value found
          const values = matches.map(m => {
            let num = parseFloat(m.replace(/[$,]/g, ''))
            if (m.toLowerCase().includes('billion') || m.toLowerCase().includes('b')) num *= 1000000000
            else if (m.toLowerCase().includes('million') || m.toLowerCase().includes('m')) num *= 1000000
            else if (m.toLowerCase().includes('thousand') || m.toLowerCase().includes('k')) num *= 1000
            return num
          })
          return Math.max(...values)
        }
        return 0
      })
      .filter(v => v > 0)

    const avgValue = estimatedValues.length > 0 
      ? estimatedValues.reduce((a, b) => a + b, 0) / estimatedValues.length 
      : 0
    const totalValue = estimatedValues.reduce((a, b) => a + b, 0)

    // Analyze competition
    const setAsides = opportunities.map(o => o.setAside || o.typeOfSetAside).filter(Boolean)
    const uniqueSetAsides = new Set(setAsides)
    const competitionLevel = uniqueSetAsides.size === 1 && setAsides.length > 50 ? 'high' :
                             uniqueSetAsides.size <= 3 && setAsides.length > 20 ? 'medium' : 'low'

    // Analyze agencies
    const agencies = opportunities.map(o => o.fullParentPathName || o.department).filter(Boolean)
    const agencyCount = new Map()
    agencies.forEach(a => agencyCount.set(a, (agencyCount.get(a) || 0) + 1))
    const topAgency = [...agencyCount.entries()].sort((a, b) => b[1] - a[1])[0]

    // Analyze NAICS
    const naicsCodes = opportunities.map(o => o.naicsCode).filter(Boolean)
    const uniqueNaics = new Set(naicsCodes)
    
    // Generate insights
    const keyInsights = []
    
    if (urgentOpps.length > 0) {
      keyInsights.push({
        icon: AlertCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: `${urgentOpps.length} opportunities closing within 7 days - immediate action required`
      })
    }

    if (recentOpps.length > 0) {
      keyInsights.push({
        icon: Calendar,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: `${recentOpps.length} new opportunities posted in the last 7 days`
      })
    }

    if (competitionLevel === 'low') {
      keyInsights.push({
        icon: Target,
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        text: `Lower competition detected - good opportunity for smaller contractors`
      })
    } else if (competitionLevel === 'high') {
      keyInsights.push({
        icon: Users,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: `High competition in ${filters.setAside || 'this category'} - strong proposal needed`
      })
    }

    if (topAgency && topAgency[1] > 5) {
      keyInsights.push({
        icon: Award,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: `${topAgency[0]} has ${topAgency[1]} opportunities - consider targeting this agency`
      })
    }

    if (avgValue > 100000) {
      keyInsights.push({
        icon: DollarSign,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        text: `Average estimated contract value: $${(avgValue / 1000000).toFixed(1)}M`
      })
    }

    // Generate recommendations
    const recommendations = []

    if (urgentOpps.length > 0) {
      recommendations.push({
        icon: AlertCircle,
        text: 'Prioritize opportunities with deadlines in the next 7 days',
        priority: 'high'
      })
    }

    if (uniqueNaics.size > 1 && uniqueNaics.size <= 5) {
      recommendations.push({
        icon: Target,
        text: `Focus on your strongest capabilities - ${uniqueNaics.size} NAICS codes represent good diversification`,
        priority: 'medium'
      })
    }

    if (topAgency && topAgency[1] > 10) {
      recommendations.push({
        icon: Award,
        text: `Build relationships with ${topAgency[0]} - they have the most opportunities`,
        priority: 'high'
      })
    }

    if (competitionLevel === 'high') {
      recommendations.push({
        icon: TrendingUp,
        text: 'Consider teaming arrangements or subcontracting to increase win probability',
        priority: 'medium'
      })
    } else {
      recommendations.push({
        icon: CheckCircle,
        text: 'Lower competition allows for more opportunities - expand your pursuit pipeline',
        priority: 'medium'
      })
    }

    if (recentOpps.length > opportunities.length * 0.3) {
      recommendations.push({
        icon: TrendingUp,
        text: 'High volume of recent postings - market is active in this area',
        priority: 'medium'
      })
    }

    return {
      keyInsights,
      recommendations,
      stats: {
        total: opportunities.length,
        urgent: urgentOpps.length,
        recent: recentOpps.length,
        avgValue: avgValue,
        totalValue: totalValue,
        competition: competitionLevel,
        topAgency: topAgency?.[0],
        agencyCount: topAgency?.[1] || 0,
        uniqueNaics: uniqueNaics.size
      }
    }
  }, [opportunities, filters])

  if (!insights || opportunities.length === 0) return null

  return (
    <div className="mt-6 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Market Intelligence</h3>
          <p className="text-sm text-gray-600">Analyzing {insights.stats.total} opportunities</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-white border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Competition</div>
          <div className={`font-semibold text-lg ${
            insights.stats.competition === 'high' ? 'text-red-600' :
            insights.stats.competition === 'medium' ? 'text-orange-600' :
            'text-green-600'
          }`}>
            {insights.stats.competition.toUpperCase()}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">Urgent (≤7 days)</div>
          <div className="font-semibold text-lg text-red-600">
            {insights.stats.urgent}
          </div>
        </div>

        <div className="p-3 rounded-lg bg-white border border-gray-200">
          <div className="text-xs text-gray-600 mb-1">New (7 days)</div>
          <div className="font-semibold text-lg text-blue-600">
            {insights.stats.recent}
          </div>
        </div>

        {insights.stats.avgValue > 0 && (
          <div className="p-3 rounded-lg bg-white border border-gray-200">
            <div className="text-xs text-gray-600 mb-1">Avg. Value</div>
            <div className="font-semibold text-lg text-emerald-600">
              ${(insights.stats.avgValue / 1000000).toFixed(1)}M
            </div>
          </div>
        )}
      </div>

      {/* Key Insights */}
      {insights.keyInsights.length > 0 && (
        <div className="space-y-3 mb-6">
          <h4 className="font-semibold text-gray-900 text-sm">Key Insights</h4>
          {insights.keyInsights.map((insight, i) => (
            <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${insight.border} ${insight.bg}`}>
              <insight.icon className={`h-5 w-5 ${insight.color} flex-shrink-0 mt-0.5`} />
              <p className="text-sm text-gray-700">{insight.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations */}
      {insights.recommendations.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 text-sm mb-3">Recommendations</h4>
          {insights.recommendations.map((rec, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white border border-gray-200">
              <rec.icon className={`h-4 w-4 flex-shrink-0 mt-0.5 ${
                rec.priority === 'high' ? 'text-red-600' : 'text-blue-600'
              }`} />
              <p className="text-sm text-gray-700">{rec.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
