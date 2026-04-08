// app/api/sam/live-ticker/route.ts
import { NextResponse } from 'next/server';

const SAM_API_KEY = process.env.SAMGOVAPIKEY || process.env.SAM_API_KEY || '';
const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search';

// ─── In-process cache (shared across all requests in the same Node process) ───
// This is more reliable than next: { revalidate } which can be bypassed
const CACHE_TTL_MS   = 2 * 60 * 1000   // 2 minutes — keeps ticker feeling live without hammering quota
const FETCH_COOLDOWN = 30 * 1000        // 30s minimum between live fetches regardless of cache state

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

export async function GET() {
  if (!SAM_API_KEY) {
    return NextResponse.json({ count: 0, opportunities: [], error: 'SAM API key not configured' }, { status: 200 });
  }

  // ── Serve from cache if still fresh ──────────────────────────────────────
  if (tickerCache && Date.now() < tickerCache.expiresAt) {
    console.log('⚡ Ticker cache HIT');
    return NextResponse.json({ ...tickerCache.data, cached: true }, { headers: NO_STORE });
  }

  // ── Cooldown: don't re-fetch if last fetch was within 60s ─────────────────
  const sinceLastFetch = Date.now() - lastFetchAt
  if (lastFetchAt > 0 && sinceLastFetch < FETCH_COOLDOWN) {
    const waitSec = Math.ceil((FETCH_COOLDOWN - sinceLastFetch) / 1000)
    console.warn(`⏱️ Ticker cooldown: ${waitSec}s remaining`)
    // Return stale data if available, otherwise empty
    const stale = tickerCache?.data ?? { count: 0, opportunities: [], rateLimitExceeded: false }
    return NextResponse.json({ ...stale, cached: true, cooldown: waitSec }, { headers: NO_STORE });
  }

  try {
    const today = new Date()
    const params = new URLSearchParams({
      api_key: SAM_API_KEY,
      limit: '20',
      ptype: 'o',
      postedFrom: daysAgo(7),
      postedTo: formatMMDDYYYY(today),
    });

    const apiUrl = `${SAM_BASE_URL}?${params.toString()}`;
    console.log('📡 Fetching ticker from SAM.gov...');
    lastFetchAt = Date.now()

    const response = await fetch(apiUrl, {
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      cache: 'no-store', // skip Next.js fetch cache — we handle caching ourselves
    });

    // ── 429 Rate limit ────────────────────────────────────────────────────
    if (response.status === 429) {
      const errorData = await response.json().catch(() => ({}));
      console.warn('🚫 Ticker: SAM.gov rate limit hit. Next access:', errorData.nextAccessTime);
      // Extend cooldown to 10 min on rate limit to stop hammering
      lastFetchAt = Date.now() + (10 * 60 * 1000) - FETCH_COOLDOWN
      return NextResponse.json({
        count: 0, opportunities: [], rateLimitExceeded: true,
        nextAccessTime: errorData.nextAccessTime,
        message: 'SAM.gov quota exceeded — will retry later.',
      }, { status: 200, headers: NO_STORE });
    }

    if (!response.ok) {
      console.error('❌ Ticker SAM error:', response.status);
      return NextResponse.json({
        count: 0, opportunities: [], rateLimitExceeded: false,
        error: `SAM.gov API error (${response.status})`,
      }, { status: 200, headers: NO_STORE });
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

    // Cache it
    tickerCache = { data: payload, expiresAt: Date.now() + CACHE_TTL_MS }

    return NextResponse.json({ ...payload, cached: false }, { headers: NO_STORE });

  } catch (error) {
    console.error('❌ Ticker fetch error:', error);
    return NextResponse.json({
      count: 0, opportunities: [], rateLimitExceeded: false,
      error: error instanceof Error ? error.message : 'Failed to fetch ticker data',
    }, { status: 200, headers: NO_STORE });
  }
}
