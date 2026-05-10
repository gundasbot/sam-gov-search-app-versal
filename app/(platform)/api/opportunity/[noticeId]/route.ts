import { NextRequest, NextResponse } from "next/server";
import { coalesceInFlight } from '@/lib/in-flight-coalescer'

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPPORTUNITY_CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const OPPORTUNITY_CACHE_LIMIT = 500
const OPPORTUNITY_CACHE = new Map<string, { payload: any; expiresAt: number }>()

function getOpportunityCache(noticeId: string) {
  const hit = OPPORTUNITY_CACHE.get(noticeId)
  if (!hit) return null
  if (Date.now() > hit.expiresAt) {
    OPPORTUNITY_CACHE.delete(noticeId)
    return null
  }
  return hit.payload
}

function setOpportunityCache(noticeId: string, payload: any) {
  if (OPPORTUNITY_CACHE.size >= OPPORTUNITY_CACHE_LIMIT) {
    const oldest = OPPORTUNITY_CACHE.keys().next().value
    if (oldest) OPPORTUNITY_CACHE.delete(oldest)
  }
  OPPORTUNITY_CACHE.set(noticeId, { payload, expiresAt: Date.now() + OPPORTUNITY_CACHE_TTL_MS })
}

/**
 * GET /api/opportunity/[noticeId]
 * Returns a single opportunity record by noticeId.
 *
 * NOTE: Next.js 16.1.1 expects route handler context.params to be a Promise.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ noticeId: string }> }
) {
  try {
    const { noticeId } = await context.params;
    const refresh = ['1', 'true', 'yes'].includes(
      (req.nextUrl.searchParams.get('refresh') || '').toLowerCase()
    );

    if (!noticeId || typeof noticeId !== "string") {
      return NextResponse.json({ error: "Missing noticeId" }, { status: 400 });
    }

    if (!refresh) {
      const cached = getOpportunityCache(noticeId);
      if (cached) {
        return NextResponse.json({ ...cached, cached: true, source: 'cache' }, { status: 200 });
      }
    }

    // Try multiple possible API key environment variables (same pattern as your /api/sam route)
    const apiKey =
      process.env.SAMGOVAPIKEY ||
      process.env.SAM_APIKEY ||
      process.env.SAMAPIKEY ||
      process.env.SAM_API_KEY ||
      process.env.SAM_GOV_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing SAM API key. Please configure SAMGOVAPIKEY in .env.local" },
        { status: 500 }
      );
    }

    /**
     * SAM Opportunities endpoint (v2 search) doesn’t have a clean “get by id” endpoint
     * like some APIs. The reliable way is to search and filter by noticeId.
     *
     * Using q=noticeId:"<id>" works for many records, but for robustness we use a couple
     * fallback attempts.
     */
    const base = "https://api.sam.gov/prod/opportunities/v2/search";

    const lookup = await coalesceInFlight<{ found: any | null; usedFallback: boolean }>(
      `sam:opportunity:${noticeId}`,
      async () => {
        const attempts: Array<{ label: string; url: string }> = []

        attempts.push({
          label: "q_noticeId",
          url:
            `${base}?` +
            new URLSearchParams({
              q: `noticeId:"${noticeId}"`,
              limit: "1",
              offset: "0",
              api_key: apiKey,
            }).toString(),
        })

        attempts.push({
          label: "q_raw",
          url:
            `${base}?` +
            new URLSearchParams({
              q: noticeId,
              limit: "25",
              offset: "0",
              api_key: apiKey,
            }).toString(),
        })

        let found: any | null = null
        let usedFallback = false

        for (let i = 0; i < attempts.length; i++) {
          const a = attempts[i]
          const res = await fetch(a.url, {
            cache: "no-store",
            headers: {
              Accept: "application/json",
              "User-Agent": "Mozilla/5.0 (compatible; NextJS-App/1.0)",
            },
          })

          const text = await res.text()
          const contentType = res.headers.get("content-type") || ""
          if (contentType.includes("text/html") || text.trim().startsWith("<!DOCTYPE") || text.trim().startsWith("<html")) {
            continue
          }

          let data: any
          try {
            data = JSON.parse(text)
          } catch {
            continue
          }

          const records =
            data?.opportunitiesData ||
            data?.opportunities ||
            data?.data ||
            data?.results ||
            []

          if (Array.isArray(records) && records.length) {
            const exact =
              records.find((r: any) => String(r?.noticeId || r?.noticeid || "") === String(noticeId)) || records[0]

            found = exact
            usedFallback = i > 0
            break
          }
        }

        return { found, usedFallback }
      }
    )

    const found = lookup.found
    const usedFallback = lookup.usedFallback

    if (!found) {
      return NextResponse.json(
        {
          error: "Opportunity not found",
          noticeId,
          meta: { attemptedMatch: true, usedFallback: false },
        },
        { status: 404 }
      );
    }

    const payload = {
      noticeId,
      record: found,
      meta: { attemptedMatch: true, usedFallback },
    };
    setOpportunityCache(noticeId, payload);
    return NextResponse.json({ ...payload, cached: false, source: 'live' }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
