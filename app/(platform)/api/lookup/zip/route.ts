import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const code = (request.nextUrl.searchParams.get('code') || '').trim()
  const zip5 = code.match(/^\d{5}/)?.[0]

  if (!zip5) {
    return NextResponse.json({ error: 'Invalid ZIP code' }, { status: 400 })
  }

  // Try zippopotam.us first
  try {
    const res = await fetch(`https://api.zippopotam.us/us/${zip5}`, {
      headers: { Accept: 'application/json' },
      next: { revalidate: 86400 }, // cache 24hr
    })
    if (res.ok) {
      const data = await res.json()
      const place = Array.isArray(data?.places) ? data.places[0] : null
      if (place) {
        return NextResponse.json({
          city: place['place name'] || '',
          state: place['state abbreviation'] || '',
          zip: zip5,
        })
      }
    }
  } catch {
    // fall through to backup
  }

  // Fallback: OpenStreetMap Nominatim
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${zip5}&country=us&format=json&limit=1`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'PreciseGovCon/1.0 (contact@preciseanalytics.io)',
        },
      }
    )
    if (res.ok) {
      const data = await res.json()
      const result = Array.isArray(data) ? data[0] : null
      if (result?.display_name) {
        const parts = result.display_name.split(',').map((s: string) => s.trim())
        const city = parts[0] || ''
        const state = parts[1] || ''
        return NextResponse.json({ city, state, zip: zip5 })
      }
    }
  } catch {
    // fall through
  }

  return NextResponse.json({ error: 'Could not find city/state for this ZIP code' }, { status: 404 })
}
