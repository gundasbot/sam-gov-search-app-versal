import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')?.toUpperCase().trim()

  if (!code) {
    return NextResponse.json({ valid: false, reason: 'No code provided' }, { status: 400 })
  }

  const offer = await prisma.offer_codes.findFirst({
    where: { code, active: true },
    select: {
      id: true,
      code: true,
      type: true,
      trial_days: true,
      discount: true,
      description: true,
      expires_at: true,
      max_usage: true,
      usage_count: true,
    },
  })

  if (!offer) {
    return NextResponse.json({ valid: false, reason: 'Code not found or inactive' })
  }

  if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: 'Code has expired' })
  }

  if (offer.max_usage != null && offer.usage_count >= offer.max_usage) {
    return NextResponse.json({ valid: false, reason: 'Code usage limit reached' })
  }

  // Resolve trial days for display
  let trialDays = 7
  if (String(offer.type || '').toLowerCase() === 'trial') {
    if (offer.trial_days != null) {
      trialDays = Math.min(365, Math.max(1, Math.round(offer.trial_days)))
    } else {
      const match = String(offer.discount || offer.description || '').match(/(\d{1,3})/)
      if (match) trialDays = Math.min(365, Math.max(1, parseInt(match[1], 10)))
    }
  }

  return NextResponse.json({
    valid: true,
    code: offer.code,
    type: offer.type,
    trialDays: String(offer.type || '').toLowerCase() === 'trial' ? trialDays : undefined,
    discount: offer.discount,
    description: offer.description,
  })
}
