/**
 * hooks/usePersonalizedFeed.ts
 *
 * Drop this hook into any page that needs personalized, AI-powered opportunity data.
 *
 * Usage (dashboard/page.tsx or opportunities/page.tsx):
 *   const { feed, loading, error, refresh } = usePersonalizedFeed()
 *
 * The hook:
 *  - Fetches /api/ai/personalized-feed on mount
 *  - Re-fetches automatically when the window regains focus (user returns from onboarding)
 *  - Exposes a `refresh()` function for manual re-fetch (e.g. after filter changes)
 *  - Caches results in sessionStorage to avoid hammering the API on tab switches
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export interface ScoredOpportunity {
  noticeId: string
  title: string
  agency: string
  naicsCode: string
  setAside: string
  postedDate: string
  responseDeadline: string | null
  estimatedValue: number | null
  placeOfPerformance: string | null
  description: string
  url: string
  matchScore: number
  matchReasons: string[]
  urgencyFlag: 'high' | 'medium' | 'low'
  aiSummary: string
  recommendedAction: string
}

export interface PersonalizedFeed {
  generatedAt: string
  userProfile: {
    setAsides: string[]
    naicsCodes: string[]
    pscCodes: string[]
    states: string[]
    contractSizeMin?: number
    contractSizeMax?: number
  }
  topMatches: ScoredOpportunity[]
  aiInsights: {
    summary: string
    marketTrends: string[]
    actionItems: string[]
    competitiveAlert: string | null
  }
  stats: {
    totalMatched: number
    byAgency: Record<string, number>
    bySetAside: Record<string, number>
    expiringIn48h: number
    avgMatchScore: number
  }
}

const CACHE_KEY = 'pgc_personalized_feed'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function readCache(): PersonalizedFeed | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { data, ts } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL_MS) return null
    return data as PersonalizedFeed
  } catch {
    return null
  }
}

function writeCache(data: PersonalizedFeed) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }))
  } catch {}
}

function clearCache() {
  try { sessionStorage.removeItem(CACHE_KEY) } catch {}
}

export function usePersonalizedFeed(options?: { autoRefreshOnFocus?: boolean }) {
  const [feed, setFeed] = useState<PersonalizedFeed | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const fetchingRef = useRef(false)

  const fetchFeed = useCallback(async (force = false) => {
    if (fetchingRef.current) return
    fetchingRef.current = true

    // Try cache first (unless forced)
    if (!force) {
      const cached = readCache()
      if (cached) {
        setFeed(cached)
        setLoading(false)
        fetchingRef.current = false
        return
      }
    } else {
      clearCache()
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/personalized-feed', {
        cache: 'no-store',
        credentials: 'include',
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }

      const data: PersonalizedFeed = await res.json()
      writeCache(data)
      setFeed(data)
      setError(null)
    } catch (err: any) {
      console.error('[usePersonalizedFeed]', err)
      setError(err.message || 'Failed to load personalized feed')
    } finally {
      setLoading(false)
      fetchingRef.current = false
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchFeed()
  }, [fetchFeed])

  // Re-fetch when window regains focus — catches user returning from onboarding
  useEffect(() => {
    if (options?.autoRefreshOnFocus === false) return
    const handler = () => {
      const cached = readCache()
      if (!cached) fetchFeed(true)
    }
    window.addEventListener('focus', handler)
    return () => window.removeEventListener('focus', handler)
  }, [fetchFeed, options?.autoRefreshOnFocus])

  const refresh = useCallback(() => fetchFeed(true), [fetchFeed])

  // Convenience: filter topMatches by urgency
  const urgentOpps = feed?.topMatches.filter(o => o.urgencyFlag === 'high') ?? []
  const hasPreferences = !!(
    feed?.userProfile.naicsCodes.length ||
    feed?.userProfile.setAsides.length ||
    feed?.userProfile.states.length
  )

  return {
    feed,
    loading,
    error,
    refresh,
    urgentOpps,
    hasPreferences,
    isPersonalized: hasPreferences,
  }
}