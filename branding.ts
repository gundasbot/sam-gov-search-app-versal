// lib/branding.ts - Centralized logo and branding configuration

export function getAppUrl() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";

  return raw.replace(/\/+$/, "");
}

export function getLogoUrl() {
  const appUrl = getAppUrl();
  // This will work both locally and in production
  return `${appUrl}/precise-govcon-logo.jpg`;
}

export const BRANDING = {
  companyName: "Precise GovCon",
  companyFullName: "Precise Analytics LLC",
  tagline: "Government Contracting Simplified",
  location: "Richmond, Virginia",
  certifications: "SDVOSB & Minority-Owned Business",
  supportEmail: "support@precisegovcon.com",
  logo: {
    path: "/precise-govcon-logo.jpg",
    getUrl: getLogoUrl,
  },
  colors: {
    primary: "#667eea",
    secondary: "#764ba2",
    accent: "#10b981",
  },
};