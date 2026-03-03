/**
 * Smart Analytics Loader Hook
 * Handles on-demand analytics loading with intelligent caching
 * Reduces API costs by only fetching when needed
 */

import { useCallback, useState, useEffect } from 'react'
import { getCacheKey, getCachedAnalytics, cacheAnalytics } from '@/lib/cache-utils'

interface AnalyticsLoadingState {
  loading: boolean
  error: string | null
  data: any
  lastUpdated: Date | null
}

export function useSmartAnalytics(
  type: 'insights' | 'trends' | 'analytics',
  userId?: string,
  params?: Record<string, any>
) {
  const [state, setState] = useState<AnalyticsLoadingState>({
    loading: false,
    error: null,
    data: null,
    lastUpdated: null,
  })

  const cacheKey = getCacheKey(type, userId, params)

  /**
   * Check for cached data on mount
   */
  useEffect(() => {
    const cached = getCachedAnalytics(cacheKey)
    if (cached) {
      setState(prev => ({
        ...prev,
        data: cached,
        lastUpdated: new Date(),
      }))
    }
  }, [cacheKey])

  /**
   * Load analytics on-demand with caching
   */
  const loadAnalytics = useCallback(async () => {
    // Check if already cached
    const cached = getCachedAnalytics(cacheKey)
    if (cached) {
      setState(prev => ({
        ...prev,
        data: cached,
      }))
      return
    }

    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }))

    try {
      const endpoint = {
        insights: '/api/ai/insights',
        trends: '/api/ai/trends',
        analytics: '/api/ai/analytics',
      }[type]

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Cache for 10 minutes
      cacheAnalytics(cacheKey, data, 10)

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        lastUpdated: new Date(),
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }, [cacheKey, type, params])

  /**
   * Refresh analytics (bypass cache)
   */
  const refresh = useCallback(async () => {
    setState(prev => ({
      ...prev,
      loading: true,
      error: null,
    }))

    try {
      const endpoint = {
        insights: '/api/ai/insights',
        trends: '/api/ai/trends',
        analytics: '/api/ai/analytics',
      }[type]

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params || {}),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()

      // Cache for 10 minutes
      cacheAnalytics(cacheKey, data, 10)

      setState(prev => ({
        ...prev,
        data,
        loading: false,
        lastUpdated: new Date(),
      }))
    } catch (err) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }))
    }
  }, [cacheKey, type, params])

  return {
    ...state,
    loadAnalytics,
    refresh,
    isCached: getCachedAnalytics(cacheKey) !== null,
  }
}

/**
 * Mock insights for logged-out or non-subscribed users
 */
export const MOCK_AI_INSIGHTS = [
  {
    title: 'DoD Cybersecurity Contracts',
    description: '3 high-value matches aligned with your expertise',
    matchScore: 92,
    trend: 'up',
    icon: 'shield',
    action: 'View opportunities',
  },
  {
    title: 'SDVOSB Trend Alert',
    description: 'Set-aside opportunities up 45% this month',
    matchScore: 78,
    trend: 'up',
    icon: 'trending-up',
    action: 'Explore set-asides',
  },
  {
    title: 'Cloud Services Peak Season',
    description: 'Q3 is the best time for cloud modernization RFPs',
    matchScore: 85,
    trend: 'neutral',
    icon: 'clock',
    action: 'See cloud contracts',
  },
]

/**
 * Check if user should have access to live analytics
 */
export function shouldLoadLiveAnalytics(
  isAuthenticated: boolean,
  hasActiveSubscription: boolean
): boolean {
  return isAuthenticated && hasActiveSubscription
}
