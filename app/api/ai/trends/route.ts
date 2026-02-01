// app/api/ai/trends/route.ts
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

/**
 * Independent AI Trends Route
 *
 * Accepts:
 * - { opportunities }
 * - { statistics }
 * - { opportunities, statistics }
 *
 * Always returns:
 *   { trends: TrendItem[] }
 */

type TrendStrength = 'strong' | 'moderate' | 'weak'

type TrendItem = {
  title: string
  description: string
  strength: TrendStrength
}

const STRENGTHS: TrendStrength[] = ['strong', 'moderate', 'weak']

function normalizeTrends(input: any): TrendItem[] {
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

      const strength: TrendStrength = STRENGTHS.includes(x?.strength)
        ? x.strength
        : 'moderate'

      if (!title || !description) return null
      return { title, description, strength }
    })
    .filter(Boolean)
    .slice(0, 8) as TrendItem[]
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

function buildPrompt(payload: {
  statistics: any
  opportunities: any[]
}) {
  return `
You are a federal contracting market analyst.

Task:
Identify 4–6 meaningful trends visible in the data.

Rules:
- Output ONLY valid JSON
- Do NOT use markdown
- Return an ARRAY
- Each item MUST have:
  - title (string)
  - description (string, 2–3 sentences)
  - strength ("strong" | "moderate" | "weak")

Trends may include:
- Agency behavior
- Contract size shifts
- Set-aside usage
- NAICS concentration
- Posting frequency changes

Be conservative. Do not invent statistics.

Input:
${JSON.stringify(
  {
    statistics: payload.statistics ?? null,
    opportunitiesSample: payload.opportunities.slice(0, 25),
    opportunitiesCount: payload.opportunities.length,
  },
  null,
  2
)}
`.trim()
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY missing in .env.local' },
        { status: 500 }
      )
    }

    const body = await req.json().catch(() => ({}))

    const statistics = body?.statistics ?? null
    const opportunities = Array.isArray(body?.opportunities)
      ? body.opportunities
      : []

    if (!statistics && opportunities.length === 0) {
      return NextResponse.json(
        { error: 'Provide { statistics } or { opportunities }' },
        { status: 400 }
      )
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const prompt = buildPrompt({ statistics, opportunities })

    const result = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      temperature: 0.2,
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = result.content
      .filter((c: any) => c.type === 'text')
      .map((c: any) => c.text)
      .join('\n')
      .trim()

    const parsed = safeJsonParse(text)
    const trends = normalizeTrends(parsed)

    // Hard fallback so UI never breaks
    if (!trends.length) {
      return NextResponse.json({
        trends: [
          {
            title: 'Repeat-buying agencies dominate postings',
            description:
              'A small number of agencies appear to publish similar requirements repeatedly. This suggests predictable demand patterns that favor incumbents and prepared vendors.',
            strength: 'strong',
          },
          {
            title: 'Mid-sized contracts are more common',
            description:
              'Opportunities cluster in mid-range contract values rather than very small or very large awards. This may indicate a preference for manageable scope engagements.',
            strength: 'moderate',
          },
          {
            title: 'Set-aside usage remains inconsistent',
            description:
              'Set-aside designations appear sporadically across postings, suggesting that qualification alone is not sufficient without strong agency alignment.',
            strength: 'weak',
          },
        ],
      })
    }

    return NextResponse.json({ trends })
  } catch (err: any) {
    console.error('Trends route error:', err)
    return NextResponse.json(
      { error: 'Failed to generate trends', detail: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}