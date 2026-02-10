// lib/sam-cache.ts
import { prisma } from './prisma'

interface CachedSearchResult {
  id: string
  search_key: string
  opportunities_data: any
  total_records: number
  cached_at: Date
  expires_at: Date
}

interface SAMApiResponse {
  opportunitiesData: any[]
  totalRecords: number
}

/**
 * Generate a unique cache key from search parameters
 */
export function generateCacheKey(params: URLSearchParams): string {
  const sortedParams = new URLSearchParams(
    Array.from(params.entries())
      .filter(([key]) => key !== 'api_key')
      .sort(([a], [b]) => a.localeCompare(b))
  )
  return sortedParams.toString()
}

/**
 * Get cached SAM.gov search result
 * Returns null if not found or expired
 */
export async function getCachedSearch(cacheKey: string): Promise<SAMApiResponse | null> {
  try {
    const cached = await prisma.samCachedSearch.findFirst({
      where: {
        search_key: cacheKey,
        expires_at: {
          gt: new Date()
        }
      },
      orderBy: {
        cached_at: 'desc'
      }
    })

    if (!cached) {
      console.log('💾 Cache miss:', cacheKey.substring(0, 50) + '...')
      return null
    }

    console.log('✅ Cache hit:', cacheKey.substring(0, 50) + '...')
    console.log('   Cached at:', cached.cached_at.toISOString())
    console.log('   Expires at:', cached.expires_at.toISOString())

    return {
      opportunitiesData: cached.opportunities_data as any[],
      totalRecords: cached.total_records
    }
  } catch (error) {
    console.error('❌ Error reading cache:', error)
    return null
  }
}

/**
 * Cache SAM.gov search result
 * Default TTL: 4 hours (14400 seconds)
 */
export async function setCachedSearch(
  cacheKey: string,
  data: SAMApiResponse,
  ttlSeconds: number = 14400
): Promise<void> {
  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000)

    await prisma.samCachedSearch.upsert({
      where: {
        search_key: cacheKey
      },
      create: {
        search_key: cacheKey,
        opportunities_data: data.opportunitiesData,
        total_records: data.totalRecords,
        cached_at: now,
        expires_at: expiresAt
      },
      update: {
        opportunities_data: data.opportunitiesData,
        total_records: data.totalRecords,
        cached_at: now,
        expires_at: expiresAt
      }
    })

    console.log('💾 Cached search result')
    console.log('   Key:', cacheKey.substring(0, 50) + '...')
    console.log('   Results:', data.totalRecords)
    console.log('   TTL:', ttlSeconds, 'seconds')
    console.log('   Expires at:', expiresAt.toISOString())
  } catch (error) {
    console.error('❌ Error writing cache:', error)
    // Don't throw - caching is best effort
  }
}

/**
 * Clean up expired cache entries
 * Call this periodically from a cron job
 */
export async function cleanExpiredCache(): Promise<number> {
  try {
    const result = await prisma.samCachedSearch.deleteMany({
      where: {
        expires_at: {
          lt: new Date()
        }
      }
    })

    console.log(`🧹 Cleaned ${result.count} expired cache entries`)
    return result.count
  } catch (error) {
    console.error('❌ Error cleaning cache:', error)
    return 0
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats() {
  try {
    const [total, expired, valid] = await Promise.all([
      prisma.samCachedSearch.count(),
      prisma.samCachedSearch.count({
        where: {
          expires_at: {
            lt: new Date()
          }
        }
      }),
      prisma.samCachedSearch.count({
        where: {
          expires_at: {
            gt: new Date()
          }
        }
      })
    ])

    return {
      total,
      expired,
      valid,
      hitRate: 0 // Implement hit rate tracking if needed
    }
  } catch (error) {
    console.error('❌ Error getting cache stats:', error)
    return null
  }
}