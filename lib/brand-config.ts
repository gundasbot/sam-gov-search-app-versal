// lib/brand-config.ts
/**
 * Brand configuration for Precise GovCon
 * This centralizes all brand assets and can be used in both client and server components
 */

export const BRAND_CONFIG = {
  name: 'Precise GovCon',
  tagline: 'contracting intelligence and procurement experts',
  logo: {
    // Local development and production (relative path from public folder)
    path: '/precise-govcon-logo-light.png',
    // Full URL for emails (will be set based on environment)
    url: process.env.NEXT_PUBLIC_APP_URL 
      ? `${process.env.NEXT_PUBLIC_APP_URL}/precise-govcon-logo-light.png`
      : 'https://precisegovcon.com/precise-govcon-logo-light.png', // fallback to production URL
    alt: 'PRECISE GOVCON - contracting intelligence and procurement experts',
    width: 600,
    height: 120,
  },
  contact: {
    email: process.env.SUPPORT_EMAIL || 'support@precisegovcon.com',
    phone: '(804) 404-4005',
  },
  social: {
    // Add your social media links here if needed
  },
} as const

export default BRAND_CONFIG