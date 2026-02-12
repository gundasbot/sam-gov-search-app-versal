// lib/email/brand.ts
type Brand = {
  appUrl: string
  name: string
  logoUrl: string
  supportEmail: string
  tagline: string
  colors: {
    navy: string
    green: string
    orange: string
    lightGray: string
    white: string
    textDark: string
    textLight: string
  }
}

export function getBrand() {
  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")
  
  return {
    appUrl,
    name: process.env.BRAND_NAME || "Precise GovCon",
    logoUrl: process.env.BRAND_LOGO_URL || `${appUrl}/precise-govcon-logo.jpg`,
    supportEmail: process.env.SUPPORT_EMAIL || "support@precisegovcon.com",
    tagline: "contracting intelligence and procurement experts",
    colors: {
      navy: '#1e3a4c',
      green: '#7cb342',
      orange: '#ff9800',
      lightGray: '#f5f5f5',
      white: '#ffffff',
      textDark: '#2c3e50',
      textLight: '#6b7280',
    }
  }
}