type Brand = {
  appUrl: string
  name: string
  logoUrl: string
  supportEmail: string
}

export function getBrand() {
  const appUrl = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")
  return {
    appUrl,
    name: process.env.BRAND_NAME || "Precise GovCon",
    logoUrl: process.env.BRAND_LOGO_URL || `${appUrl}/logo.png`,
    supportEmail: process.env.SUPPORT_EMAIL || "support@precisegovcon.com",
  }
}
