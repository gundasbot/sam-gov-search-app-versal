// app/api/codes/taxonomy/route.ts
//
// Mines SAM.gov opportunity data for NAICS + PSC (classificationCode) codes.
// Single SAM.gov fetch → two code libraries → one 24-hour in-memory cache.
// Query params:
//   ?type=naics&q=541    → NAICS search
//   ?type=psc&q=D3       → PSC search
//   ?type=both           → returns top N of each (used to pre-warm)
//   ?refresh=1           → bust cache
//
import { NextRequest, NextResponse } from 'next/server'
import { coalesceInFlight } from '@/lib/in-flight-coalescer'
import { resolveSamUrl } from '@/lib/samgov-api'

export const dynamic = 'force-dynamic'

// ─── API key — same resolution as the rest of the app ────────────────────────
const SAM_API_KEY =
  process.env.SAMGOVAPIKEY ||
  process.env.SAM_API_KEY ||
  process.env.SAM_GOV_API_KEY ||
  ''

const SAM_BASE_URL = 'https://api.sam.gov/opportunities/v2/search'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// ─── Types ───────────────────────────────────────────────────────────────────
export interface CodeItem {
  code: string
  description: string
  count: number // how many SAM.gov opportunities used this code
}

interface TaxonomyCache {
  naics: CodeItem[]
  psc: CodeItem[]
  generatedAt: string
  expiresAt: number
  opportunitiesSampled: number
}

// ─── In-process cache (survives across requests within same Node process) ─────
let taxonomyCache: TaxonomyCache | null = null

// ─── NAICS description lookup (2-digit sector labels for display enrichment) ──
const NAICS_SECTOR_LABELS: Record<string, string> = {
  '11': 'Agriculture, Forestry, Fishing and Hunting',
  '21': 'Mining, Quarrying, and Oil and Gas Extraction',
  '22': 'Utilities',
  '23': 'Construction',
  '31': 'Manufacturing',
  '32': 'Manufacturing',
  '33': 'Manufacturing',
  '42': 'Wholesale Trade',
  '44': 'Retail Trade',
  '45': 'Retail Trade',
  '48': 'Transportation and Warehousing',
  '49': 'Transportation and Warehousing',
  '51': 'Information',
  '52': 'Finance and Insurance',
  '53': 'Real Estate and Rental and Leasing',
  '54': 'Professional, Scientific, and Technical Services',
  '55': 'Management of Companies and Enterprises',
  '56': 'Administrative and Support Services',
  '61': 'Educational Services',
  '62': 'Health Care and Social Assistance',
  '71': 'Arts, Entertainment, and Recreation',
  '72': 'Accommodation and Food Services',
  '81': 'Other Services',
  '92': 'Public Administration',
}

// ─── PSC category labels (first letter → category name) ─────────────────────
const PSC_CATEGORY_LABELS: Record<string, string> = {
  'A': 'Research and Development',
  'B': 'Special Studies and Analyses',
  'C': 'Architect and Engineering Services',
  'D': 'IT and Telecommunications',
  'E': 'Purchase of Structures and Facilities',
  'F': 'Natural Resources Management Services',
  'G': 'Social Services',
  'H': 'Quality Control, Testing and Inspection Services',
  'J': 'Maintenance, Repair and Rebuilding of Equipment',
  'K': 'Modification of Equipment',
  'L': 'Technical Representative Services',
  'M': 'Operation of Government-Owned Facilities',
  'N': 'Installation of Equipment',
  'P': 'Salvage Services',
  'Q': 'Medical Services',
  'R': 'Professional, Administrative and Management Support',
  'S': 'Utilities and Housekeeping Services',
  'T': 'Photographic, Mapping, Printing and Publication Services',
  'U': 'Education and Training Services',
  'V': 'Transportation, Travel and Relocation Services',
  'W': 'Lease or Rental of Equipment',
  'X': 'Lease or Rental of Facilities',
  'Y': 'Construction of Structures and Facilities',
  'Z': 'Maintenance, Repair or Alteration of Real Property',
}

function formatMMDDYYYY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return formatMMDDYYYY(d)
}

// ─── Enrich NAICS with a sector-level description when no title is available ──
function enrichNaicsDescription(code: string): string {
  const sector = code.substring(0, 2)
  const sectorLabel = NAICS_SECTOR_LABELS[sector]
  if (sectorLabel) return `${sectorLabel} — Code ${code}`
  return `NAICS ${code}`
}

// ─── Enrich PSC with a category description ──────────────────────────────────
function enrichPscDescription(code: string): string {
  const cat = code.substring(0, 1).toUpperCase()
  const catLabel = PSC_CATEGORY_LABELS[cat]
  if (catLabel) return `${catLabel} — Code ${code}`
  return `PSC ${code}`
}

// ─── Core: fetch opportunities from SAM.gov and mine codes ───────────────────
async function buildTaxonomy(): Promise<TaxonomyCache> {
  if (!SAM_API_KEY) throw new Error('SAM API key not configured')

  // Fetch 500 recent active opportunities — enough for good coverage
  // Mirror the proven pattern from /api/sam/taxonomy/route.ts
  const params = new URLSearchParams({
    api_key: SAM_API_KEY,
    limit: '500',
    offset: '0',
    postedFrom: daysAgo(180),
    postedTo: formatMMDDYYYY(new Date()),
    ptype: 'o,k,r,s,g,i',
    status: 'active',
  })

  const { url: proxiedUrl, extraHeaders: samHeaders } = resolveSamUrl(`${SAM_BASE_URL}?${params.toString()}`)
  const res = await fetch(proxiedUrl, {
    method: 'GET',
    headers: { Accept: 'application/json', ...samHeaders },
    cache: 'no-store',
    signal: AbortSignal.timeout(20000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`SAM.gov ${res.status}: ${text.slice(0, 300)}`)
  }

  const data = await res.json()
  const opportunities: any[] = Array.isArray(data?.opportunitiesData)
    ? data.opportunitiesData
    : []

  // ── Mine NAICS codes ──────────────────────────────────────────────────────
  const naicsCounts = new Map<string, number>()
  // SAM.gov uses naicsCode field on opportunities (see SAMOpportunity interface)
  for (const opp of opportunities) {
    const raw = String(opp?.naicsCode ?? opp?.naics ?? '').trim()
    if (!raw || raw.length < 2 || !/^\d+$/.test(raw)) continue
    const code = raw.slice(0, 6) // normalize to max 6 digits
    naicsCounts.set(code, (naicsCounts.get(code) || 0) + 1)
  }

  const naics: CodeItem[] = Array.from(naicsCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
    .map(([code, count]) => ({
      code,
      description: enrichNaicsDescription(code),
      count,
    }))

  // ── Mine PSC codes ────────────────────────────────────────────────────────
  // SAMOpportunity.classificationCode = PSC code
  const pscCounts = new Map<string, number>()
  for (const opp of opportunities) {
    const raw = String(
      opp?.classificationCode ?? opp?.pscCode ?? opp?.ccode ?? ''
    ).trim().toUpperCase()
    if (!raw || raw.length < 1) continue
    pscCounts.set(raw, (pscCounts.get(raw) || 0) + 1)
  }

  const psc: CodeItem[] = Array.from(pscCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 200)
    .map(([code, count]) => ({
      code,
      description: enrichPscDescription(code),
      count,
    }))

  console.log(
    `✅ Taxonomy built: ${naics.length} NAICS codes, ${psc.length} PSC codes from ${opportunities.length} opportunities`
  )

  return {
    naics,
    psc,
    generatedAt: new Date().toISOString(),
    expiresAt: Date.now() + CACHE_TTL_MS,
    opportunitiesSampled: opportunities.length,
  }
}

// ─── Fallback seeds (shown when SAM.gov is unreachable) ──────────────────────
const NAICS_FALLBACK: CodeItem[] = [
  { code: '541511', description: 'Custom Computer Programming Services', count: 0 },
  { code: '541512', description: 'Computer Systems Design Services', count: 0 },
  { code: '541519', description: 'Other Computer Related Services', count: 0 },
  { code: '541611', description: 'Administrative Management Consulting Services', count: 0 },
  { code: '518210', description: 'Data Processing, Hosting, and Related Services', count: 0 },
  { code: '541330', description: 'Engineering Services', count: 0 },
  { code: '541715', description: 'R&D in Physical, Engineering, and Life Sciences', count: 0 },
  { code: '561210', description: 'Facilities Support Services', count: 0 },
  { code: '611430', description: 'Professional and Management Development Training', count: 0 },
  { code: '621111', description: 'Offices of Physicians', count: 0 },
]

const PSC_FALLBACK: CodeItem[] = [
  { code: 'D302', description: 'IT and Telecom — Systems Development', count: 0 },
  { code: 'D307', description: 'IT and Telecom — Cyber Security and Data Backup', count: 0 },
  { code: 'D310', description: 'IT and Telecom — Data Management', count: 0 },
  { code: 'D399', description: 'IT and Telecom — Other ADP Services', count: 0 },
  { code: 'R425', description: 'Professional Support — Engineering/Technical', count: 0 },
  { code: 'R499', description: 'Professional Support — Other', count: 0 },
  { code: 'R706', description: 'Management Support — Logistics', count: 0 },
  { code: 'S201', description: 'Housekeeping — Custodial/Janitorial', count: 0 },
  { code: 'Q201', description: 'Medical — General Health Care', count: 0 },
]

// ─── GET handler ──────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get('type') || 'naics') as 'naics' | 'psc' | 'both'
  const q = searchParams.get('q')?.toLowerCase().trim() || ''
  const forceRefresh = searchParams.get('refresh') === '1'
  const limit = Math.min(50, Math.max(5, Number(searchParams.get('limit') || 20)))

  // ── Serve from cache if fresh ─────────────────────────────────────────────
  if (!forceRefresh && taxonomyCache && Date.now() < taxonomyCache.expiresAt) {
    return NextResponse.json(buildResponse(taxonomyCache, type, q, limit, 'cache'))
  }

  // ── Fetch fresh taxonomy from SAM.gov ─────────────────────────────────────
  try {
    const fresh = await coalesceInFlight<TaxonomyCache>('sam:codes:taxonomy', async () => buildTaxonomy())
    taxonomyCache = fresh
    return NextResponse.json(buildResponse(fresh, type, q, limit, 'live'))
  } catch (err: any) {
    console.error('❌ Taxonomy fetch failed:', err?.message)

    // Return stale cache if available, even if expired
    if (taxonomyCache) {
      return NextResponse.json(buildResponse(taxonomyCache, type, q, limit, 'stale-cache'))
    }

    // Last resort: fallback seeds
    const fallback: TaxonomyCache = {
      naics: NAICS_FALLBACK,
      psc: PSC_FALLBACK,
      generatedAt: new Date().toISOString(),
      expiresAt: Date.now() + 5 * 60 * 1000, // retry in 5 min
      opportunitiesSampled: 0,
    }
    return NextResponse.json(buildResponse(fallback, type, q, limit, 'fallback'))
  }
}

// ─── Shape the response ───────────────────────────────────────────────────────
function buildResponse(
  cache: TaxonomyCache,
  type: 'naics' | 'psc' | 'both',
  q: string,
  limit: number,
  source: string
) {
  function filterCodes(codes: CodeItem[]): CodeItem[] {
    if (!q) return codes.slice(0, limit)
    return codes
      .filter(
        c =>
          c.code.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      )
      .slice(0, limit)
  }

  const base = {
    source,
    generatedAt: cache.generatedAt,
    cachedUntil: new Date(cache.expiresAt).toISOString(),
    opportunitiesSampled: cache.opportunitiesSampled,
  }

  if (type === 'naics') {
    return { ...base, type: 'naics', total: cache.naics.length, results: filterCodes(cache.naics) }
  }
  if (type === 'psc') {
    return { ...base, type: 'psc', total: cache.psc.length, results: filterCodes(cache.psc) }
  }
  // both
  return {
    ...base,
    type: 'both',
    naics: { total: cache.naics.length, results: filterCodes(cache.naics) },
    psc: { total: cache.psc.length, results: filterCodes(cache.psc) },
  }
}
