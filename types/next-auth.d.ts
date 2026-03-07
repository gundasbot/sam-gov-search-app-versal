import { DefaultSession, DefaultUser } from "next-auth"

/**
 * =========================
 * NextAuth core extensions
 * FIXED: Using consistent field names that match plan API
 * =========================
 */
declare module "next-auth" {
  interface User extends DefaultUser {
    id: string
    role: string
    // ✅ FIXED: Consistent with plan API response
    tier: 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
    interval: 'month' | 'year' | null
    status: string
    hasSubscription: boolean
    trial_active: boolean
    currentPeriodEnd: string
  }

  interface Session extends DefaultSession {
    user: {
      id: string
      role: string
      // ✅ FIXED: Consistent with plan API response
      tier: 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
      interval: 'month' | 'year' | null
      status: string
      hasSubscription: boolean
      trial_active: boolean
      currentPeriodEnd: string
    } & DefaultSession["user"]
  }
}

/**
 * =========================
 * JWT extensions
 * =========================
 */
declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    // ✅ FIXED: Consistent with plan API response
    tier: string
    interval: 'month' | 'year' | null
    status: string
    hasSubscription: boolean
    trial_active: boolean
    currentPeriodEnd: string
  }
}
