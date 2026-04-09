// lib/email/brand.ts

import { resolvePublicAppUrl } from '@/lib/url-safety'

export function getBrand() {
  // Outbound emails should always point to a public URL, never localhost.
  const appUrl = resolvePublicAppUrl(
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL
  )

  // Logo must be absolute for email clients.
  // BRAND_LOGO_URL env var overrides. Fallback uses the confirmed live filename.
  const rawLogoUrl = process.env.BRAND_LOGO_URL || ''
  const logoUrl = rawLogoUrl.startsWith('http')
    ? rawLogoUrl
    : 'https://www.precisegovcon.com/precise-govcon-logo.jpg'

  return {
    appUrl,
    name: process.env.BRAND_NAME || 'Precise GovCon',
    logoUrl,
    supportEmail: process.env.SUPPORT_EMAIL || 'support@precisegovcon.com',
    tagline: 'Contracting Intelligence & Procurement Experts',
    colors: {
      primary:     '#f97316',
      primaryDark: '#ea580c',
      accent:      '#f59e0b',
      orange:      '#f97316',  // alias — used by email-templates.ts
      green:       '#7cb342',  // alias — used by email-templates.ts
      navy:        '#1e3a4c',
      lightGray:   '#f5f5f5',
      white:       '#ffffff',
      textDark:    '#111827',
      textLight:   '#6b7280',
    },
  }
}
