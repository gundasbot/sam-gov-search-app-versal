import { NextResponse } from 'next/server'
import { dbQuery } from '@/lib/db'

export async function GET() {
  try {
    // Use a lightweight, universal query for Postgres
    const { rows } = await dbQuery<{ now: string }>('select now() as now')

    return NextResponse.json({
      ok: true,
      now: rows?.[0]?.now ?? null,
    })
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? 'Unknown error',
      },
      { status: 500 }
    )
  }
}
