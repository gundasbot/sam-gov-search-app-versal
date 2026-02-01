import { NextResponse } from "next/server"

export async function GET() {
  const url = process.env.DATABASE_URL || ""
  const direct = process.env.DIRECT_URL || ""

  const safeHost = (value: string) => {
    try {
      return new URL(value).host
    } catch {
      return null
    }
  }

  return NextResponse.json({
    hasDatabaseUrl: Boolean(url),
    hasDirectUrl: Boolean(direct),
    databaseUrlHasPgbouncer: url.includes("pgbouncer=true"),
    databaseUrlHasPoolerHost: url.includes("-pooler."),
    databaseUrlHost: safeHost(url),
    directUrlHost: safeHost(direct),
  })
}
