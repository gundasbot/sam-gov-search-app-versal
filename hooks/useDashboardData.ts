import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type DashboardActiveSearch = {
  id: string
  name: string
  query: string
  filters: {
    naics?: string
    agency?: string
    setAside?: string
    state?: string
    opportunityType?: string
    postedAfter?: string | null
    postedBefore?: string | null
    responseDeadline?: string | null
    solicitationNumber?: string
    pscCode?: string
    zip?: string
    status?: string
    [key: string]: unknown
  }
  createdAt: string
  updatedAt: string
  subscriptionEnabled?: boolean
  frequency?: string | null
  lastResultCount?: number
}

export type DashboardSavedOpportunity = {
  noticeId: string
  title: string
  agency: string
  value: number | null
  posted: string | null
  deadline: string | null
  naics: string | null
  setAside: string | null
  description: string | null
  solicitationLink: string | null
}

export type DashboardDeadline = {
  noticeId: string
  title: string
  agency: string
  deadline: string
  value: number | null
  daysUntil: number
}

export type DashboardNotification = {
  type: 'deadline' | 'search' | 'alert' | 'save' | 'ai'
  title: string
  noticeId: string | null
  createdAt: string
  iconType: 'deadline' | 'search' | 'alert' | 'save' | 'ai'
}

export type DashboardPreferences = {
  setAsides: string[]
  naicsCodes: string[]
  agencies: string[]
  contractSizeMin?: number
  contractSizeMax?: number
  keywords: string[]
  states: string[]
  businessType: string
  completedOnboarding: boolean
}

type DashboardDataState = {
  activeSearches: DashboardActiveSearch[]
  savedOpportunities: DashboardSavedOpportunity[]
  deadlines: DashboardDeadline[]
  notifications: DashboardNotification[]
  preferences: DashboardPreferences | null
  loading: boolean
  error: string | null
  lastRefreshed: Date | null
  isRefreshing: boolean
  refresh: () => Promise<void>
}

type UseDashboardDataOptions = {
  enabled?: boolean
}

const POLL_MS = 5 * 60 * 1000
const MIN_AUTO_REFRESH_GAP_MS = 60 * 1000

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchJsonWithRetry<T>(url: string, signal: AbortSignal, attempts = 2): Promise<T> {
  let lastError: Error | null = null
  for (let i = 0; i <= attempts; i += 1) {
    try {
      const response = await fetch(url, { cache: 'no-store', signal })
      if (!response.ok) {
        throw new Error(`${url} failed with ${response.status}`)
      }
      return (await response.json()) as T
    } catch (error) {
      if (signal.aborted) throw error
      lastError = error as Error
      if (i < attempts) {
        await sleep(250 * (i + 1))
      }
    }
  }
  throw lastError || new Error(`Failed to fetch ${url}`)
}

export function useDashboardData(options: UseDashboardDataOptions = {}): DashboardDataState {
  const { enabled = true } = options
  const [activeSearches, setActiveSearches] = useState<DashboardActiveSearch[]>([])
  const [savedOpportunities, setSavedOpportunities] = useState<DashboardSavedOpportunity[]>([])
  const [deadlines, setDeadlines] = useState<DashboardDeadline[]>([])
  const [notifications, setNotifications] = useState<DashboardNotification[]>([])
  const [preferences, setPreferences] = useState<DashboardPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null)
  const inFlightRef = useRef(false)
  const lastAutoLoadAtRef = useRef(0)

  const load = useCallback(async (isManual = false) => {
    if (!enabled) {
      setLoading(false)
      setIsRefreshing(false)
      return
    }
    if (inFlightRef.current) return
    if (!isManual) {
      const now = Date.now()
      if (lastAutoLoadAtRef.current && (now - lastAutoLoadAtRef.current) < MIN_AUTO_REFRESH_GAP_MS) {
        return
      }
      lastAutoLoadAtRef.current = now
    }
    inFlightRef.current = true
    if (isManual) setIsRefreshing(true)
    if (!isManual) setLoading(true)

    const controller = new AbortController()
    try {
      const [searches, opps, deadlineRows, notificationRows, prefs] = await Promise.all([
        fetchJsonWithRetry<DashboardActiveSearch[]>('/api/dashboard/active-searches', controller.signal),
        fetchJsonWithRetry<DashboardSavedOpportunity[]>('/api/dashboard/saved-opps', controller.signal),
        fetchJsonWithRetry<DashboardDeadline[]>('/api/dashboard/deadlines', controller.signal),
        fetchJsonWithRetry<DashboardNotification[]>('/api/dashboard/notifications', controller.signal),
        fetchJsonWithRetry<DashboardPreferences>('/api/account/preferences', controller.signal),
      ])

      setActiveSearches(Array.isArray(searches) ? searches : [])
      setSavedOpportunities(Array.isArray(opps) ? opps : [])
      setDeadlines(Array.isArray(deadlineRows) ? deadlineRows : [])
      setNotifications(Array.isArray(notificationRows) ? notificationRows : [])
      setPreferences(prefs || null)
      setError(null)
      setLastRefreshed(new Date())
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : 'Failed to load dashboard data'
      setError(message)
    } finally {
      inFlightRef.current = false
      setLoading(false)
      setIsRefreshing(false)
      controller.abort()
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    void load(false)

    const interval = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      void load(false)
    }, POLL_MS)

    const handleVisible = () => {
      if (document.visibilityState !== 'visible') return
      void load(false)
    }
    document.addEventListener('visibilitychange', handleVisible)

    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisible)
    }
  }, [enabled, load])

  const refresh = useCallback(async () => {
    if (!enabled) return
    await load(true)
  }, [enabled, load])

  return useMemo(
    () => ({
      activeSearches,
      savedOpportunities,
      deadlines,
      notifications,
      preferences,
      loading,
      error,
      lastRefreshed,
      isRefreshing,
      refresh,
    }),
    [
      activeSearches,
      savedOpportunities,
      deadlines,
      notifications,
      preferences,
      loading,
      error,
      lastRefreshed,
      isRefreshing,
      refresh,
    ]
  )
}
