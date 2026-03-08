// Development-only endpoint to diagnose Google OAuth configuration
// Shows what the app thinks NEXTAUTH_URL and callback URL should be

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Development only
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
  }

  const nextAuthUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const baseUrl = new URL(req.url).origin
  const requestUrl = req.url

  return NextResponse.json({
    configuration: {
      nextauth_url: nextAuthUrl,
      google_client_id_set: !!process.env.GOOGLE_CLIENT_ID,
      google_client_secret_set: !!process.env.GOOGLE_CLIENT_SECRET,
      nextauth_secret_set: !!process.env.NEXTAUTH_SECRET,
    },
    calculated_urls: {
      base_url: baseUrl,
      request_origin: new URL(req.url).origin,
      nextauth_url: nextAuthUrl,
      callback_url: `${nextAuthUrl}/api/auth/callback/google`,
    },
    environment: {
      node_env: process.env.NODE_ENV,
      deployment: process.env.VERCEL_URL ? 'vercel' : 'local',
    },
    instructions: {
      local_setup: 'http://localhost:3000',
      production_setup: 'https://www.precisegovcon.com',
      redirect_uri_needed: `${nextAuthUrl}/api/auth/callback/google`,
      warning: 'Make sure this redirect URI is configured in Google Cloud Console OAuth credentials',
    },
  })
}
