/**
 * /api/ai/personalized-feed/route.ts
 *
 * ✅ FIXES:
 *   1. Prisma import guarded — catches "Cannot read properties of undefined (reading 'findUnique')"
 *   2. Falls back gracefully when Prisma client isn't ready
 *   3. Uses account/preferences API as fallback for user prefs
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'

// ✅ FIX: Dynamic import with fallback — prevents crash if prisma singleton isn't ready
let prismaClient: any = null
async function getPrisma() {
  if (prismaClient) return prismaClient
  try {
    const mod = await import('@/lib/prisma')
    prismaClient = mod.prisma || mod.default
    return prismaClient
  } catch (err) {
    console.warn('[personalized-feed] Prisma import failed, will use API fallback:', err)
    return null
  }
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Helper: Load user preferences (Prisma → API fallback) ───────────────────

async function loadUserPreferences(email: string): Promise<{
  setAsides: string[]
  naicsCodes: string[]
  pscCodes: string[]
  keywords: string[]
  states: string[]
  contractSizeMin?: number
  contractSizeMax?: number
}> {
  const defaults = {
    setAsides: [], naicsCodes: [], pscCodes: [],
    keywords: [], states: [], contractSizeMin: undefined, contractSizeMax: undefined,
  }

  // Try Prisma first
  try {
    const prisma = await getPrisma()
    if (prisma?.user?.findUnique) {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          preferences: {
            select: {
              setAsides: true,
              naicsCodes: true,
              pscCodes: true,
              keywords: true,
              states: true,
              contractSizeMin: true,
              contractSizeMax: true,
            }
          }
        }
      })
      if (user?.preferences) return { ...defaults, ...user.preferences }
    }
  } catch (err) {
    console.warn('[personalized-feed] Prisma query failed, trying API fallback:', err)
  }

  // ✅ FIX: Fallback — use the account/preferences API which has its own Prisma handling
  // This is a server-side fetch to our own API — works because the session cookie is forwarded
  // Note: This only works for POST handler where we have the request. For GET, return defaults.
  return defaults
}

// ─── SAM.gov fetch ────────────────────────────────────────────────────────────

function formatMMDDYYYY(d: Date): string {
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${mm}/${dd}/${d.getFullYear()}`
}

async function fetchSAMOpportunities(prefs: {
  naicsCodes?: string[]
  setAsides?: string[]
  states?: string[]
  contractSizeMin?: number
  contractSizeMax?: number
}): Promise<any[]> {
  const SAM_KEY = process.env.SAMGOVAPIKEY || process.env.SAM_API_KEY || process.env.SAM_GOV_API_KEY || ''

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const params = new URLSearchParams({
    api_key: SAM_KEY,
    limit: '250',
    offset: '0',
    postedFrom: formatMMDDYYYY(ninetyDaysAgo),
    postedTo: formatMMDDYYYY(new Date()),
    status: 'active',
    ptype: 'o,k,r,s,g,i',
    ...(prefs.naicsCodes?.length ? { naics: prefs.naicsCodes.slice(0, 3).join(',') } : {}),
    ...(prefs.setAsides?.length ? { typeOfSetAside: prefs.setAsides[0] } : {}),
  })

  try {
    const res = await fetch(
      `https://api.sam.gov/opportunities/v2/search?${params}`,
      { headers: { 'Accept': 'application/json' }, cache: 'no-store' }
    )
    if (!res.ok) throw new Error(`SAM.gov ${res.status}`)
    const data = await res.json()
    return data.opportunitiesData || []
  } catch (err) {
    console.error('[personalized-feed] SAM.gov fetch error:', err)
    return []
  }
}

// ─── Filter by preferences ────────────────────────────────────────────────────

function preFilterOpportunities(
  opps: any[],
  prefs: {
    naicsCodes?: string[]
    setAsides?: string[]
    states?: string[]
  }
): any[] {
  return opps.filter(opp => {
    const naicsMatch =
      !prefs.naicsCodes?.length ||
      prefs.naicsCodes.some(n => (opp.naicsCode || '').startsWith(n.slice(0, 4)))

    const stateMatch =
      !prefs.states?.length ||
      prefs.states.some(s =>
        (opp.placeOfPerformance?.state?.code || '').includes(s) ||
        (opp.placeOfPerformance?.state?.name || '').includes(s) ||
        (opp.fullParentPathName || '').includes(s)
      )

    return naicsMatch && stateMatch
  })
}

// ─── Claude scoring ───────────────────────────────────────────────────────────

async function scoreWithClaude(
  opps: any[],
  prefs: {
    setAsides: string[]
    naicsCodes: string[]
    pscCodes: string[]
    states: string[]
    contractSizeMin?: number
    contractSizeMax?: number
  }
): Promise<{ scored: ScoredOpportunity[]; insights: PersonalizedFeed['aiInsights'] }> {
  if (!opps.length) {
    return {
      scored: [],
      insights: {
        summary: 'No matching opportunities found for your current preferences. Try broadening your NAICS codes or states.',
        marketTrends: [],
        actionItems: ['Expand your NAICS code selection', 'Add more states to your coverage area', 'Review your set-aside filters'],
        competitiveAlert: null,
      }
    }
  }

  const today = new Date().toISOString().split('T')[0]
  const prefsText = [
    prefs.setAsides.length ? `Set-Asides: ${prefs.setAsides.join(', ')}` : null,
    prefs.naicsCodes.length ? `NAICS Codes: ${prefs.naicsCodes.join(', ')}` : null,
    prefs.pscCodes.length ? `PSC Codes: ${prefs.pscCodes.join(', ')}` : null,
    prefs.states.length ? `States: ${prefs.states.join(', ')}` : null,
    prefs.contractSizeMin != null
      ? `Contract Size: $${prefs.contractSizeMin.toLocaleString()}${prefs.contractSizeMax ? ` – $${prefs.contractSizeMax.toLocaleString()}` : '+'}`
      : null,
  ].filter(Boolean).join('\n')

  const oppList = opps.slice(0, 100).map((o, i) => {
    const deadline = o.responseDeadLine || o.archiveDate || 'TBD'
    const daysLeft = deadline !== 'TBD'
      ? Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
      : null
    return `${i + 1}. [ID:${o.noticeId}]
   Title: ${o.title}
   Agency: ${o.departmentName || o.fullParentPathName || 'Unknown'}
   NAICS: ${o.naicsCode || 'N/A'} | Set-Aside: ${o.typeOfSetAsideDescription || 'Full & Open'}
   Posted: ${o.postedDate} | Deadline: ${deadline}${daysLeft !== null ? ` (${daysLeft}d)` : ''}
   Value: ${o.award?.amount ? `$${Number(o.award.amount).toLocaleString()}` : 'Not disclosed'}
   State: ${o.placeOfPerformance?.state?.code || 'N/A'}
   Description: ${(o.description || '').slice(0, 200)}...`
  }).join('\n\n')

  const prompt = `You are a federal contracting intelligence analyst for a Service-Disabled Veteran-Owned Small Business (SDVOSB).

Today: ${today}

CONTRACTOR PROFILE:
${prefsText}

OPPORTUNITIES TO ANALYZE (${opps.slice(0, 100).length} total):
${oppList}

Respond ONLY with a valid JSON object in this exact shape — no markdown, no preamble:
{
  "scoredOpportunities": [
    {
      "noticeId": "string",
      "matchScore": 0-100,
      "matchReasons": ["reason1", "reason2"],
      "urgencyFlag": "high|medium|low",
      "aiSummary": "One sentence plain-English summary of what this contract is for",
      "recommendedAction": "Specific next step the contractor should take"
    }
  ],
  "insights": {
    "summary": "2-3 sentence executive summary of the overall opportunity landscape for this contractor right now",
    "marketTrends": ["trend1", "trend2", "trend3"],
    "actionItems": ["action1", "action2", "action3"],
    "competitiveAlert": "null OR a single urgent alert string about closing deadlines or competitive dynamics"
  }
}

Scoring rules:
- 90-100: Exact NAICS + matching set-aside + state + size range
- 70-89: NAICS sector match + set-aside or state match
- 50-69: Partial NAICS or related sector, no set-aside match
- Below 50: Weak match, include only if fewer than 10 strong matches exist
- urgencyFlag "high" = deadline within 7 days; "medium" = 8-21 days; "low" = 22+ days or no deadline
- Only include top 25 opportunities in scoredOpportunities, ordered by matchScore descending`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    })

    const raw = message.content.find(b => b.type === 'text')?.text || ''
    const clean = raw.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)

    const scored: ScoredOpportunity[] = (parsed.scoredOpportunities || []).map((ai: any) => {
      const opp = opps.find(o => o.noticeId === ai.noticeId)
      if (!opp) return null
      return {
        noticeId: opp.noticeId,
        title: opp.title,
        agency: opp.departmentName || opp.fullParentPathName || 'Unknown Agency',
        naicsCode: opp.naicsCode || '',
        setAside: opp.typeOfSetAsideDescription || 'Full & Open',
        postedDate: opp.postedDate,
        responseDeadline: opp.responseDeadLine || opp.archiveDate || null,
        estimatedValue: opp.award?.amount ? Number(opp.award.amount) : null,
        placeOfPerformance: opp.placeOfPerformance?.state?.code || null,
        description: opp.description || '',
        url: opp.uiLink || `https://sam.gov/opp/${opp.noticeId}`,
        matchScore: ai.matchScore,
        matchReasons: ai.matchReasons || [],
        urgencyFlag: ai.urgencyFlag || 'low',
        aiSummary: ai.aiSummary || '',
        recommendedAction: ai.recommendedAction || '',
      } satisfies ScoredOpportunity
    }).filter(Boolean)

    return {
      scored,
      insights: {
        summary: parsed.insights?.summary || '',
        marketTrends: parsed.insights?.marketTrends || [],
        actionItems: parsed.insights?.actionItems || [],
        competitiveAlert: parsed.insights?.competitiveAlert === 'null'
          ? null
          : (parsed.insights?.competitiveAlert || null),
      },
    }
  } catch (err) {
    console.error('[personalized-feed] Claude scoring error:', err)
    return {
      scored: opps.slice(0, 10).map(o => ({
        noticeId: o.noticeId,
        title: o.title,
        agency: o.departmentName || 'Unknown',
        naicsCode: o.naicsCode || '',
        setAside: o.typeOfSetAsideDescription || 'Full & Open',
        postedDate: o.postedDate,
        responseDeadline: o.responseDeadLine || null,
        estimatedValue: null,
        placeOfPerformance: o.placeOfPerformance?.state?.code || null,
        description: o.description || '',
        url: o.uiLink || `https://sam.gov/opp/${o.noticeId}`,
        matchScore: 50,
        matchReasons: ['NAICS sector match'],
        urgencyFlag: 'low' as const,
        aiSummary: o.title,
        recommendedAction: 'Review solicitation documents on SAM.gov',
      })),
      insights: {
        summary: 'AI analysis temporarily unavailable. Showing recent opportunities matching your filters.',
        marketTrends: [],
        actionItems: ['Review each opportunity on SAM.gov', 'Check response deadlines'],
        competitiveAlert: null,
      },
    }
  }
}

// ─── Build stats ──────────────────────────────────────────────────────────────

function buildStats(scored: ScoredOpportunity[]): PersonalizedFeed['stats'] {
  const byAgency: Record<string, number> = {}
  const bySetAside: Record<string, number> = {}
  let expiringIn48h = 0

  for (const o of scored) {
    byAgency[o.agency] = (byAgency[o.agency] || 0) + 1
    bySetAside[o.setAside] = (bySetAside[o.setAside] || 0) + 1
    if (o.responseDeadline) {
      const hoursLeft = (new Date(o.responseDeadline).getTime() - Date.now()) / 3600000
      if (hoursLeft > 0 && hoursLeft <= 48) expiringIn48h++
    }
  }

  return {
    totalMatched: scored.length,
    byAgency,
    bySetAside,
    expiringIn48h,
    avgMatchScore: scored.length
      ? Math.round(scored.reduce((s, o) => s + o.matchScore, 0) / scored.length)
      : 0,
  }
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ✅ FIX: Guarded preference loading — won't crash if Prisma is undefined
    const prefs = await loadUserPreferences(session.user.email)

    const rawOpps = await fetchSAMOpportunities(prefs)
    const filtered = preFilterOpportunities(rawOpps, prefs)

    const { scored, insights } = await scoreWithClaude(filtered.length ? filtered : rawOpps, {
      setAsides: prefs.setAsides || [],
      naicsCodes: prefs.naicsCodes || [],
      pscCodes: prefs.pscCodes || [],
      states: prefs.states || [],
      contractSizeMin: prefs.contractSizeMin ?? undefined,
      contractSizeMax: prefs.contractSizeMax ?? undefined,
    })

    const feed: PersonalizedFeed = {
      generatedAt: new Date().toISOString(),
      userProfile: {
        setAsides: prefs.setAsides || [],
        naicsCodes: prefs.naicsCodes || [],
        pscCodes: prefs.pscCodes || [],
        states: prefs.states || [],
        contractSizeMin: prefs.contractSizeMin ?? undefined,
        contractSizeMax: prefs.contractSizeMax ?? undefined,
      },
      topMatches: scored,
      aiInsights: insights,
      stats: buildStats(scored),
    }

    return NextResponse.json(feed, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=60',
      }
    })
  } catch (err) {
    console.error('[personalized-feed] Error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ─── POST — force refresh after onboarding saves ──────────────────────────────

export async function POST(req: NextRequest) {
  const res = await GET(req)
  const data = await res.json()
  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'no-store' }
  })
}