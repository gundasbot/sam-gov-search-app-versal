import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const noticeId = searchParams.get('noticeid')

    if (!noticeId) {
      return NextResponse.json({ error: 'Notice ID is required' }, { status: 400 })
    }

    const apiKey = process.env.SAM_GOV_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'SAM.gov API key not configured' }, { status: 500 })
    }

    // Fetch opportunity details from SAM.gov
    const url = `https://api.sam.gov/opportunities/v1/noticedesc?noticeid=${noticeId}&api_key=${apiKey}`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('SAM.gov API error:', response.status, errorText)
      return NextResponse.json(
        { error: 'Failed to fetch opportunity details from SAM.gov' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Extract relevant data
    const result = {
      noticeId: data.noticeId || noticeId,
      setAsideCode: data.typeOfSetAsideCode || data.setAsideCode,
      setAside: data.typeOfSetAsideDescription || data.setAside,
      // Include other useful fields
      title: data.title,
      description: data.description,
      solicitationNumber: data.solicitationNumber,
      responseDeadLine: data.responseDeadLine,
      postedDate: data.postedDate,
    }

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('Error fetching opportunity details:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
