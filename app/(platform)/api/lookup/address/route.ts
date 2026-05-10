import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') || '').trim()
  if (q.length < 3) {
    return NextResponse.json({ results: [] })
  }

  try {
    const url =
      `https://nominatim.openstreetmap.org/search` +
      `?q=${encodeURIComponent(q)}` +
      `&countrycodes=us` +
      `&format=json` +
      `&addressdetails=1` +
      `&limit=6`

    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'PreciseGovCon/1.0 (contact@preciseanalytics.io)',
      },
    })

    if (!res.ok) return NextResponse.json({ results: [] })

    const data = await res.json()

    const results = (Array.isArray(data) ? data : [])
      .filter((item: any) => item?.address)
      .map((item: any) => {
        const a = item.address
        const house = a.house_number || ''
        const road = a.road || a.pedestrian || ''
        const street = [house, road].filter(Boolean).join(' ')
        const city =
          a.city || a.town || a.village || a.hamlet || a.county || ''
        const state = a.state || ''
        const postalCode = a.postcode ? a.postcode.slice(0, 5) : ''
        const label = item.display_name || ''
        return { street, city, state, postalCode, label }
      })
      .filter((r: any) => r.street || r.city)

    return NextResponse.json({ results })
  } catch {
    return NextResponse.json({ results: [] })
  }
}
