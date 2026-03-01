/**
 * Cache utility for analytics data
 * Reduces billing costs by caching API responses
 * Uses in-memory cache with TTL
 */

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class AnalyticsCache {
  private cache = new Map<string, CacheEntry<any>>()
  private readonly DEFAULT_TTL = 10 * 60 * 1000 // 10 minutes

  /**
   * Get cached data if valid
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * Set cache with TTL
   */
  set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Check if data is cached and valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    const isExpired = Date.now() - entry.timestamp > entry.ttl
    if (isExpired) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * Clear specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key)
  }

  /**
   * Clear all cache (e.g., on user logout)
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * Get cache keys matching pattern (for bulk invalidation)
   */
  getKeys(pattern: string): string[] {
    return Array.from(this.cache.keys()).filter(key =>
      key.includes(pattern)
    )
  }

  /**
   * Invalidate cache matching pattern
   */
  invalidatePattern(pattern: string): void {
    this.getKeys(pattern).forEach(key => this.invalidate(key))
  }
}

// Singleton instance
const analyticsCache = new AnalyticsCache()

/**
 * Generate cache key for analytics requests
 */
export function getCacheKey(
  type: 'insights' | 'trends' | 'analytics',
  userId?: string,
  params?: Record<string, any>
): string {
  const paramStr = params ? JSON.stringify(params) : ''
  const userPart = userId ? `:${userId}` : ':anonymous'
  return `analytics:${type}${userPart}:${paramStr}`
}

/**
 * Cache analytics response with TTL
 */
export function cacheAnalytics<T>(
  key: string,
  data: T,
  ttlMinutes: number = 10
): void {
  analyticsCache.set(key, data, ttlMinutes * 60 * 1000)
}

/**
 * Get cached analytics response
 */
export function getCachedAnalytics<T>(key: string): T | null {
  return analyticsCache.get<T>(key)
}

/**
 * Check if analytics data is cached
 */
export function hasAnalyticsCache(key: string): boolean {
  return analyticsCache.has(key)
}

/**
 * Invalidate analytics cache
 */
export function invalidateAnalyticsCache(key: string): void {
  analyticsCache.invalidate(key)
}

/**
 * Invalidate all analytics cache for a user
 */
export function invalidateUserAnalyticsCache(userId: string): void {
  analyticsCache.invalidatePattern(`:${userId}`)
}

/**
 * Clear all cache (use sparingly - e.g., on logout)
 */
export function clearAllAnalyticsCache(): void {
  analyticsCache.clear()
}

export default analyticsCache
