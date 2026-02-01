'use client'

import React, { useEffect, useState } from 'react'
import { ExternalLink, TrendingUp } from 'lucide-react'

interface Opportunity {
  id: string
  title: string
  solicitationNumber: string
  agency: string
  postedDate: string
  type: string
  samUrl: string
}

interface TickerData {
  count: number
  opportunities: Opportunity[]
  lastUpdated: string
}

export default function LiveTicker() {
  const [tickerData, setTickerData] = useState<TickerData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchTickerData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/ticker', {
          cache: 'no-store',
        })

        if (!response.ok) {
          throw new Error('Failed to fetch ticker data')
        }

        const data = await response.json()
        setTickerData(data)
        setError(null)
      } catch (err) {
        console.error('Ticker fetch error:', err)
        setError('Unable to load live updates')
      } finally {
        setIsLoading(false)
      }
    }

    // Initial fetch
    fetchTickerData()

    // Refresh every 5 minutes
    const interval = setInterval(fetchTickerData, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-y border-emerald-500/20 overflow-hidden">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Loading live updates...</span>
          </div>
        </div>
      </div>
    )
  }

  if (error || !tickerData || tickerData.opportunities.length === 0) {
    return (
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border-y border-slate-700 overflow-hidden">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <div className="h-2 w-2 rounded-full bg-slate-500" />
            <span>No new opportunities in the last 24 hours</span>
          </div>
        </div>
      </div>
    )
  }

  // Create continuous ticker by duplicating opportunities
  const duplicatedOpportunities = [
    ...tickerData.opportunities,
    ...tickerData.opportunities,
    ...tickerData.opportunities,
  ]

  return (
    <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border-y border-emerald-500/20 overflow-hidden relative">
      <div className="container mx-auto px-4 py-2 flex items-center gap-4">
        {/* Live Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0 z-10 bg-slate-950/80 pr-4">
          <div className="flex items-center gap-2">
            <div className="relative">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <div className="absolute inset-0 h-2 w-2 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </div>
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Live
            </span>
          </div>
          <span className="text-xs text-slate-400">
            {tickerData.count.toLocaleString()} new today
          </span>
        </div>

        {/* Scrolling Ticker */}
        <div className="flex-1 overflow-hidden relative">
          <div className="ticker-wrapper">
            <div className="ticker-content flex items-center gap-8">
              {duplicatedOpportunities.map((opp, idx) => (
                <a
                  key={`${opp.id}-${idx}`}
                  href={opp.samUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-sm hover:text-cyan-400 transition-colors flex-shrink-0 group"
                >
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-3 w-3 text-emerald-400" />
                    <span className="font-medium text-white group-hover:text-cyan-400 transition-colors">
                      {opp.title.length > 60
                        ? `${opp.title.substring(0, 60)}...`
                        : opp.title}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 bg-slate-800/50 px-2 py-0.5 rounded">
                    {opp.solicitationNumber}
                  </span>
                  <span className="text-xs text-slate-500">
                    {opp.agency}
                  </span>
                  <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .ticker-wrapper {
          overflow: hidden;
          position: relative;
        }

        .ticker-content {
          display: flex;
          animation: scroll-left 120s linear infinite;
        }

        @keyframes scroll-left {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-33.33%);
          }
        }

        .ticker-content:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}