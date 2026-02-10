// app/api/ai/insights/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'

type InsightPriority = 'high' | 'medium' | 'low'
type InsightCategory = 'opportunity' | 'trend' | 'recommendation' | 'alert'

type AIInsight = {
  title: string
  description: string
  priority: InsightPriority
  category: InsightCategory
}

const PRIORITIES: InsightPriority[] = ['high', 'medium', 'low']
const CATEGORIES: InsightCategory[] = ['opportunity', 'trend', 'recommendation', 'alert']

function normalizeInsights(input: any): AIInsight[] {
  if (!Array.isArray(input)) return []
  return input
    .map((x) => {
      const title = typeof x?.title === 'string' ? x.title.trim() : ''
      const description =
        typeof x?.description === 'string'
          ? x.description.trim()
          : typeof x?.summary === 'string'
          ? x.summary.trim()
          : ''

      const priority: InsightPriority = PRIORITIES.includes(x?.priority) ? x.priority : 'medium'
      const category: InsightCategory = CATEGORIES.includes(x?.category) ? x.category : 'recommendation'

      if (!title || !description) return null
      return { title, description, priority, category }
    })
    .filter(Boolean)
    .slice(0, 10) as AIInsight[]
}

function safeJsonParse(text: string): any | null {
  try {
    return JSON.parse(text)
  } catch {
    const cleaned = text.replace(/```json|```/g, '').trim()
    try {
      return JSON.parse(cleaned)
    } catch {
      return null
    }
  }
}

function buildPrompt(payload: { statistics: any; opportunities: any[]; userProfile: any }) {
  return `
You are a GovCon intelligence analyst.

Task:
Generate 6 concise, actionable insights to help a contractor decide what to do next.

Rules:
- Output ONLY valid JSON
- Do NOT use markdown
- Return an ARRAY (not an object)
- Each item MUST have:
  - title (string)
  - description (string, 2â€“3 sentences)
  - priority ("high" | "medium" | "low")
  - category ("opportunity" | "trend" | "recommendation" | "alert")

Be conservative. If data is weak, phrase insights as recommendations.

Input:
${JSON.stringify(
  {
    statistics: payload.statistics ?? null,
    userProfile: payload.userProfile ?? null,
    opportunitiesSample: payload.opportunities.slice(0, 20),
    opportunitiesCount: payload.opportunities.length,
  },
  null,
  2
)}
`.trim()
}

function fallbackInsights(): AIInsight[] {
  return [
    {
      title: 'Focus on highest-fit opportunities',
      description:
        'Prioritize opportunities that align most closely with your NAICS codes and past agency activity. Assign an owner quickly to decide pursue or pass.',
      priority: 'high',
      category: 'recommendation',
    },
    {
      title: 'Watch near-term deadlines',
      description:
        'Review any opportunities closing within the next 72 hours first. Time pressure alone can be a strong filter for what deserves attention.',
      priority: 'high',
      category: 'alert',
    },
    {
      title: 'Create targeted saved searches',
      description:
        'Use narrow filters for agency, NAICS, and contract size to reduce noise. A few focused alerts outperform broad searches.',
      priority: 'medium',
      category: 'recommendation',
    },
    {
      title: 'Track repeat-buying agencies',
      description:
        'Agencies that post similar requirements repeatedly are strong candidates for long-term capture strategy.',
      priority: 'medium',
      category: 'trend',
    },
    {
      title: 'Strengthen your bid readiness',
      description:
        'Ensure your past performance narratives, resumes, and compliance templates are ready so you can respond faster when a high-fit solicitation appears.',
      priority: 'medium',
      category: 'recommendation',
    },
    {
      title: 'Flag set-aside alignment',
      description:
        'If your target set-asides are underrepresented in the current feed, tighten filters and consider adjacent NAICS codes where you can credibly deliver.',
      priority: 'low',
      category: 'trend',
    },
  ]
}

async function createWithFallbackModels(
  anthropic: Anthropic,
  prompt: string
): Promise<{ text: string; usedModel: string }> {
  const preferred = process.env.ANTHROPIC_MODEL?.trim() || 'claude-3-5-sonnet-latest'
  const candidates = Array.from(
    new Set([
      preferred,
      'claude-3-5-sonnet-latest',
      'claude-3-5-haiku-latest',
      'claude-3-sonnet-latest',
      'claude-3-haiku-latest',
    ])
  )

  let lastErr: any = null

  for (const model of candidates) {
    try {
      const result = await anthropic.messages.create({
        model,
        temperature: 0.2,
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      })

      const text = (result.content || [])
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text)
        .join('\n')
        .trim()

      if (text) return { text, usedModel: model }
    } catch (e: any) {
      lastErr = e
      const msg = String(e?.message || '')
      const status = e?.status || e?.response?.status

      // Only â€œfall backâ€ on obvious model-name failures; otherwise rethrow
      if (status === 404 || msg.toLowerCase().includes('not_found')) {
        continue
      }
      throw e
    }
  }

  throw lastErr || new Error('Anthropic request failed')
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY missing in .env.local' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))

    const statistics = body?.statistics ?? null
    const opportunities = Array.isArray(body?.opportunities) ? body.opportunities : []
    const userProfile = body?.userProfile ?? null

    if (!statistics && opportunities.length === 0) {
      return NextResponse.json({ error: 'Provide { statistics } or { opportunities }' }, { status: 400 })
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const prompt = buildPrompt({ statistics, opportunities, userProfile })

    const { text } = await createWithFallbackModels(anthropic, prompt)

    const parsed = safeJsonParse(text)
    const insights = normalizeInsights(parsed)

    return NextResponse.json({ insights: insights.length ? insights : fallbackInsights() })
  } catch (err: any) {
    console.error('Insights route error:', err)
    return NextResponse.json({ insights: fallbackInsights(), error: err?.message || 'Failed to generate insights' })
  }
}
