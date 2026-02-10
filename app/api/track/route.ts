import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const payload = {
      ts: new Date().toISOString(),
      event: body?.event || "click",
      source: body?.source || "unknown",
      noticeId: body?.noticeId || null,
      url: body?.url || null,
      userAgent: req.headers.get("user-agent") || null,
      referrer: req.headers.get("referer") || null,
    };

    // For now: log (works everywhere)
    console.log("ðŸ“ˆ TRACK EVENT:", payload);

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
