// app/api/sam/live-ticker/route.ts
import { NextResponse } from 'next/server';
import { coalesceInFlight } from '@/lib/in-flight-coalescer';
import { withBraintrustTrace } from '@/lib/braintrust'
import { resolveSamUrl } from '@/lib/samgov-api'

const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search';

// ─── In-process cache (shared across all requests in the same Node process) ───
// This is more reliable than next: { revalidate } which can be bypassed
const CACHE_TTL_MS   = 5 * 60 * 1000   // 5 minutes — protects daily quota while still feeling live
const FETCH_COOLDOWN = 60 * 1000       // 60s minimum between live fetches regardless of cache state

let tickerCache: { data: any; expiresAt: number } | null = null
let lastFetchAt = 0

function formatMMDDYYYY(d: Date): string {
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return formatMMDDYYYY(d)
}

function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str || '';
  return str.substring(0, maxLength - 3) + '...';
}

const NO_STORE = { 'Cache-Control': 'no-store' } as const

type SamApiKeyCandidate = { source: string; value: string }

function resolveSamApiKeys(): SamApiKeyCandidate[] {
  const candidates: SamApiKeyCandidate[] = []
  const seen = new Set<string>()
  const entries: Array<[string, string | undefined]> = [
    ['SAM_GOV_API_KEY', process.env.SAM_GOV_API_KEY],
    ['SAMGOVAPIKEY', process.env.SAMGOVAPIKEY],
    ['SAM_API_KEY', process.env.SAM_API_KEY],
    ['NEXT_PUBLIC_SAM_API_KEY', process.env.NEXT_PUBLIC_SAM_API_KEY],
  ]

  for (const [source, raw] of entries) {
    const value = String(raw || '').trim()
    if (!value) continue
    if (seen.has(value)) continue
    seen.add(value)
    candidates.push({ source, value })
  }

  return candidates
}

export async function GET() {
  const samKeyCandidates = resolveSamApiKeys()

  return withBraintrustTrace(
    'api.sam.live-ticker.get',
    async (span) => {
      if (!samKeyCandidates.length) {
        span?.log({ output: { status: 'missing_api_key' } })
        return NextResponse.json({ count: 0, opportunities: [], error: 'SAM API key not configured' }, { status: 200 });
      }

      // ── Serve from cache if still fresh ──────────────────────────────────────
      if (tickerCache && Date.now() < tickerCache.expiresAt) {
        console.log('⚡ Ticker cache HIT');
        span?.log({
          metadata: {
            source: 'cache',
            count: Number(tickerCache.data?.count || 0),
          },
        })
        return NextResponse.json({ ...tickerCache.data, cached: true }, { headers: NO_STORE });
      }

      // ── Cooldown: don't re-fetch if last fetch was within 60s ─────────────────
      const sinceLastFetch = Date.now() - lastFetchAt
      if (lastFetchAt > 0 && sinceLastFetch < FETCH_COOLDOWN) {
        const waitSec = Math.ceil((FETCH_COOLDOWN - sinceLastFetch) / 1000)
        console.warn(`⏱️ Ticker cooldown: ${waitSec}s remaining`)
        // Return stale data if available, otherwise empty
        const stale = tickerCache?.data ?? { count: 0, opportunities: [], rateLimitExceeded: false }
        span?.log({
          metadata: { source: 'cooldown', waitSec, hasStaleData: Boolean(tickerCache?.data) },
        })
        return NextResponse.json({ ...stale, cached: true, cooldown: waitSec }, { headers: NO_STORE });
      }

      try {
        const today = new Date()
        const liveOutcome = await coalesceInFlight<
          | { kind: 'success'; payload: any }
          | { kind: 'rate_limited'; nextAccessTime?: string }
          | { kind: 'upstream_error'; status: number }
        >(`sam:live-ticker`, async () => {
          lastFetchAt = Date.now()
          let lastUnauthorizedStatus: number | null = null

          for (const candidate of samKeyCandidates) {
            const params = new URLSearchParams({
              api_key: candidate.value,
              limit: '20',
              ptype: 'o',
              postedFrom: daysAgo(7),
              postedTo: formatMMDDYYYY(today),
            });
            const { url: apiUrl, extraHeaders: samHeaders } = resolveSamUrl(`${SAM_BASE_URL}?${params.toString()}`)
            console.log(`📡 Fetching ticker from SAM.gov using ${candidate.source}...`);

            const response = await fetch(apiUrl, {
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', ...samHeaders },
              cache: 'no-store',
            });

            if (response.status === 401 || response.status === 403) {
              console.warn(`⚠️ Ticker key unauthorized via ${candidate.source} (${response.status})`)
              lastUnauthorizedStatus = response.status
              continue
            }

            if (response.status === 429) {
              const errorData = await response.json().catch(() => ({}));
              console.warn('🚫 Ticker: SAM.gov rate limit hit. Next access:', errorData.nextAccessTime);
              lastFetchAt = Date.now() + (10 * 60 * 1000) - FETCH_COOLDOWN
              return { kind: 'rate_limited' as const, nextAccessTime: errorData?.nextAccessTime }
            }

            if (!response.ok) {
              console.error('❌ Ticker SAM error:', response.status);
              return { kind: 'upstream_error' as const, status: response.status }
            }

            const data = await response.json();
            console.log('✅ Ticker received:', data.totalRecords || 0, 'total records');

            const opportunities = (data.opportunitiesData || []).map((opp: any) => ({
              id: opp.noticeId || '',
              title: truncate(opp.title || 'Untitled Opportunity', 60),
              solicitationNumber: opp.solicitation_number || opp.noticeId || 'N/A',
              agency: truncate(opp.departmentName || opp.department || opp.fullParentPathName?.split('.')[0] || 'Unknown', 40),
              postedDate: opp.postedDate || opp.publishDate || new Date().toISOString(),
              type: opp.type || opp.noticeType || 'Solicitation',
              samUrl: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`,
              naics: opp.naicsCode || (Array.isArray(opp.naics) ? opp.naics[0] : '') || '',
              setAside: opp.typeOfSetAsideDescription || opp.typeOfSetAside || '',
              responseDeadLine: opp.responseDeadLine || opp.responseDate || '',
              state: opp.placeOfPerformance?.state?.code || opp.officeAddress?.state || '',
            }));

            console.log('✅ Transformed', opportunities.length, 'ticker items');
            const payload = {
              count: data.totalRecords || opportunities.length,
              opportunities,
              rateLimitExceeded: false,
              error: null,
            };

            tickerCache = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS }
            span?.log({
              metadata: {
                samKeySource: candidate.source,
                keyCandidatesTried: samKeyCandidates.length,
              },
            })
            return { kind: 'success' as const, payload }
          }

          return { kind: 'upstream_error' as const, status: lastUnauthorizedStatus || 401 }
        })

        if (liveOutcome.kind === 'success') {
          span?.log({
            output: { status: 'ok', count: Number(liveOutcome.payload?.count || 0) },
          })
          return NextResponse.json({ ...liveOutcome.payload, cached: false }, { headers: NO_STORE });
        }
        if (liveOutcome.kind === 'rate_limited') {
          span?.log({
            output: { status: 'rate_limited' },
            metadata: { nextAccessTime: liveOutcome.nextAccessTime || null },
          })
          return NextResponse.json({
            count: 0, opportunities: [], rateLimitExceeded: true,
            nextAccessTime: liveOutcome.nextAccessTime,
            message: 'SAM.gov quota exceeded — will retry later.',
          }, { status: 200, headers: NO_STORE });
        }
        span?.log({ output: { status: 'upstream_error', code: liveOutcome.status } })
        return NextResponse.json({
          count: 0, opportunities: [], rateLimitExceeded: false,
          error: `SAM.gov API error (${liveOutcome.status})`,
        }, { status: 200, headers: NO_STORE });

      } catch (error) {
        console.error('❌ Ticker fetch error:', error);
        span?.log({
          output: { status: 'exception' },
          metadata: { error: error instanceof Error ? error.message : String(error) },
        })
        return NextResponse.json({
          count: 0, opportunities: [], rateLimitExceeded: false,
          error: error instanceof Error ? error.message : 'Failed to fetch ticker data',
        }, { status: 200, headers: NO_STORE });
      }
    },
    {
      event: {
        metadata: { route: '/api/sam/live-ticker', component: 'ticker' },
        tags: ['sam', 'ticker'],
      },
    }
  )
}
