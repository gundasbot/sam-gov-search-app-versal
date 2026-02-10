// hooks/useAbortableSearch.ts
/**
 * Custom hook for handling abortable searches with built-in timeout and state management
 * 
 * @example
 * const { isSearching, searchDuration, executeSearch, stopSearch } = useAbortableSearch({
 *   onSuccess: (data) => setResults(data),
 *   onError: (error) => console.error(error),
 *   timeout: 60000, // 60 seconds
 * })
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface UseAbortableSearchOptions {
  onSuccess?: (data: any) => void
  onError?: (error: Error) => void
  onCancel?: () => void
  timeout?: number // milliseconds, default 60000 (60s)
  autoStopOnTimeout?: boolean
}

export function useAbortableSearch(options: UseAbortableSearchOptions = {}) {
  const {
    onSuccess,
    onError,
    onCancel,
    timeout = 60000,
    autoStopOnTimeout = true,
  } = options

  const [isSearching, setIsSearching] = useState(false)
  const [searchStartTime, setSearchStartTime] = useState<Date | null>(null)
  const [searchDuration, setSearchDuration] = useState(0)
  const abortControllerRef = useRef<AbortController | null>(null)
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null)

  // Update duration every second while searching
  useEffect(() => {
    if (!isSearching || !searchStartTime) return

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - searchStartTime.getTime()) / 1000)
      setSearchDuration(duration)
    }, 1000)

    return () => clearInterval(interval)
  }, [isSearching, searchStartTime])

  // Auto-timeout handler
  useEffect(() => {
    if (!isSearching || !autoStopOnTimeout) return

    timeoutIdRef.current = setTimeout(() => {
      console.warn(`Search auto-stopped after ${timeout}ms`)
      stopSearch()
      onError?.(new Error(`Search timed out after ${timeout / 1000} seconds`))
    }, timeout)

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current)
        timeoutIdRef.current = null
      }
    }
  }, [isSearching, timeout, autoStopOnTimeout])

  // Stop/Cancel search
  const stopSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }

    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current)
      timeoutIdRef.current = null
    }

    setIsSearching(false)
    setSearchStartTime(null)
    setSearchDuration(0)
    onCancel?.()
  }, [onCancel])

  // Execute search
  const executeSearch = useCallback(
    async (url: string, options?: RequestInit) => {
      try {
        // Create new AbortController
        abortControllerRef.current = new AbortController()

        // Start search
        setIsSearching(true)
        setSearchStartTime(new Date())
        setSearchDuration(0)

        // Make request with abort signal
        const response = await fetch(url, {
          ...options,
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const data = await response.json()

        // Success
        setIsSearching(false)
        setSearchStartTime(null)
        setSearchDuration(0)
        onSuccess?.(data)

        return data
      } catch (error: any) {
        // Handle abort
        if (error.name === 'AbortError') {
          console.log('Search cancelled by user')
          return null
        }

        // Handle other errors
        console.error('Search error:', error)
        setIsSearching(false)
        setSearchStartTime(null)
        setSearchDuration(0)
        onError?.(error)

        throw error
      } finally {
        abortControllerRef.current = null

        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current)
          timeoutIdRef.current = null
        }
      }
    },
    [onSuccess, onError]
  )

  // Keyboard shortcut (ESC to cancel)
  useEffect(() => {
    function handleKeyPress(e: KeyboardEvent) {
      if (e.key === 'Escape' && isSearching) {
        stopSearch()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isSearching, stopSearch])

  return {
    isSearching,
    searchStartTime,
    searchDuration,
    executeSearch,
    stopSearch,
  }
}

// Helper function to format duration
export function formatSearchDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}