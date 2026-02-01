// app/api/auth/[...nextauth]/route.ts - COMPLETE WITH AUTO-LOGIN

import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"

const TRIAL_DAYS = 7

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function addDays(from: Date, days: number) {
  const x = new Date(from)
  x.setDate(x.getDate() + days)
  return x
}

function splitName(full?: string | null) {
  const name = String(full ?? "").trim()
  if (!name) return { first: null, last: null }
  const parts = name.split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: null }
  return { first: parts[0], last: parts.slice(1).join(" ") }
}

async function ensureUserRow(params: {
  email: string
  name?: string | null
  image?: string | null
  provider?: string | null
}) {
  const email = params.email.toLowerCase().trim()
  if (!email) return null

  const { first, last } = splitName(params.name)
  const now = new Date()

  const existing = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      trialEndsAt: true,
      trialActive: true,
      plan: true,
      trialExpiresAt: true,
      planTier: true,
      planStatus: true,
      emailVerified: true,
      subscriptionStatus: true,
      billingInterval: true,
      stripeSubscriptionId: true,
    },
  })

  // If user doesn't exist, create one with BASIC tier and 7-day trial
  if (!existing) {
    const trialExpires = endOfDay(addDays(now, TRIAL_DAYS))
    
    const user = await prisma.user.create({
      data: {
        email,
        firstName: first || email.split('@')[0],
        lastName: last || "",
        role: "user",
        plan: "BASIC",
        planTier: "BASIC",
        planStatus: "trialing",
        trialActive: true,
        trialStartedAt: now,
        trialExpiresAt: trialExpires,
        trialEndsAt: trialExpires,
        emailVerified: params.provider === "google" ? now : null,
        name: params.name || `${first || ""} ${last || ""}`.trim() || email.split('@')[0],
        image: params.image || undefined,
      },
    })

    return user
  }

  // Keep user profile info fresh
  const shouldVerifyNow = params.provider === "google" && !existing.emailVerified
  const updateData: any = {
    ...(first && { firstName: first }),
    ...(last && { lastName: last }),
    ...(params.name && { name: params.name }),
    ...(params.image && { image: params.image }),
    ...(shouldVerifyNow && { emailVerified: now }),
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.user.update({
      where: { id: existing.id },
      data: updateData,
    })
  }

  return existing
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        autoLoginUserId: { label: "Auto Login User ID", type: "text" }, // ✅ ADD THIS
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("Email is required")
        }

        const email = credentials.email.toLowerCase().trim()
        
        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            passwordHash: true,
            emailVerified: true,
            firstName: true,
            lastName: true,
            name: true,
            role: true,
            plan: true,
            planTier: true,
            planStatus: true,
            subscriptionStatus: true,
            billingInterval: true,
            trialEndsAt: true,
            trialExpiresAt: true,
            trialActive: true,
            stripeSubscriptionId: true,
          },
        })

        if (!user) {
          throw new Error("Account not found")
        }

        // ✅ AUTO-LOGIN FLOW CHECK
        if (credentials.autoLoginUserId && credentials.autoLoginUserId === user.id) {
          // Auto-login flow - token already validated by /api/auth/auto-login
          console.log(`✅ Auto-login authorize for ${user.email}`)
          
          // Skip password check - continue to user return below
        } else {
          // REGULAR PASSWORD LOGIN
          if (!credentials.password) {
            throw new Error("Password is required")
          }

          if (!user.passwordHash) {
            throw new Error("Please use a different login method")
          }

          const { compare } = await import("bcryptjs")
          const valid = await compare(credentials.password, user.passwordHash)
          if (!valid) {
            throw new Error("Invalid credentials")
          }
        }

        // Check email verification (for both flows)
        if (!user.emailVerified) {
          throw new Error("Email not verified. Please check your inbox.")
        }

        // ✅ Normalize tier to one of three paid tiers only
        let tier: "BASIC" | "PROFESSIONAL" | "ENTERPRISE" = "BASIC"
        const rawTier = (user.planTier || user.plan || 'BASIC').toUpperCase()

        if (rawTier === 'PROFESSIONAL' || rawTier === 'PRO') {
          tier = 'PROFESSIONAL'
        } else if (rawTier === 'ENTERPRISE') {
          tier = 'ENTERPRISE'
        } else {
          tier = 'BASIC'
        }

        // ✅ Normalize interval
        const rawInterval = user.billingInterval || null
        let interval: 'month' | 'year' | null = null
        if (rawInterval) {
          const lower = String(rawInterval).toLowerCase()
          if (lower === 'monthly' || lower === 'month') interval = 'month'
          if (lower === 'annual' || lower === 'year') interval = 'year'
        }

        // ✅ Use subscriptionStatus as primary, fallback to planStatus
        const status = user.subscriptionStatus || user.planStatus || 'trialing'
        
        // ✅ Check if user has active subscription
        const hasSubscription = Boolean(
          user.stripeSubscriptionId &&
          (status === 'active' || status === 'trialing' || status === 'trial' || status === 'past_due')
        )

        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || email.split('@')[0],
          role: user.role ?? "user",
          tier,
          interval,
          status,
          hasSubscription,
          trial_active: user.trialActive || false,
          currentPeriodEnd:
            user.trialExpiresAt?.toISOString() ||
            user.trialEndsAt?.toISOString() ||
            new Date().toISOString(),
        }
      },
    }),
  ],

  events: {
    async signIn({ user, account }) {
      if (!user?.email) return
      await ensureUserRow({
        email: user.email,
        name: user.name ?? null,
        image: user.image ?? null,
        provider: account?.provider ?? null,
      })
    },
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      // On sign in, add user data to token
      if (user) {
        token.id = (user as any).id
        token.email = user.email
        token.name = user.name
        token.role = (user as any).role ?? "user"
        token.tier = (user as any).tier || "BASIC"
        token.interval = (user as any).interval || null
        token.status = (user as any).status || "trialing"
        token.hasSubscription = (user as any).hasSubscription || false
        token.trial_active = (user as any).trial_active || false
        token.currentPeriodEnd = (user as any).currentPeriodEnd
      }

      // If session update is triggered, fetch fresh data from database
      if (token.email && (trigger === "update" || !user)) {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { email: token.email as string },
            select: {
              id: true,
              name: true,
              firstName: true,
              lastName: true,
              role: true,
              plan: true,
              planTier: true,
              planStatus: true,
              subscriptionStatus: true,
              billingInterval: true,
              trialActive: true,
              trialEndsAt: true,
              trialExpiresAt: true,
              stripeSubscriptionId: true,
            },
          })

          if (dbUser) {
            token.id = dbUser.id
            token.name = dbUser.name || `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || (token.email as string).split('@')[0]
            token.role = dbUser.role ?? "user"

            // Normalize tier
            let tier: "BASIC" | "PROFESSIONAL" | "ENTERPRISE" = "BASIC"
            const rawTier = (dbUser.planTier || dbUser.plan || 'BASIC').toUpperCase()

            if (rawTier === 'PROFESSIONAL' || rawTier === 'PRO') {
              tier = 'PROFESSIONAL'
            } else if (rawTier === 'ENTERPRISE') {
              tier = 'ENTERPRISE'
            } else {
              tier = 'BASIC'
            }

            token.tier = tier

            // Normalize interval
            const rawInterval = dbUser.billingInterval || null
            let interval: 'month' | 'year' | null = null
            if (rawInterval) {
              const lower = String(rawInterval).toLowerCase()
              if (lower === 'monthly' || lower === 'month') interval = 'month'
              if (lower === 'annual' || lower === 'year') interval = 'year'
            }

            token.interval = interval

            // Use subscriptionStatus as primary
            const status = dbUser.subscriptionStatus || dbUser.planStatus || 'trialing'
            token.status = status

            // Check if user has active subscription
            const hasSubscription = Boolean(
              dbUser.stripeSubscriptionId &&
              (status === 'active' || status === 'trialing' || status === 'trial' || status === 'past_due')
            )

            token.hasSubscription = hasSubscription
            token.trial_active = dbUser.trialActive ?? false
            token.currentPeriodEnd =
              dbUser.trialExpiresAt?.toISOString() ||
              dbUser.trialEndsAt?.toISOString() ||
              (typeof token.currentPeriodEnd === "string"
                ? token.currentPeriodEnd
                : new Date().toISOString())
          }
        } catch (err) {
          console.error("JWT refresh error:", err)
        }
      }

      return token
    },

    async session({ session, token }) {
      // Pass token data to session
      if (session.user) {
        ;(session.user as any).id = token.id as string
        session.user.email = token.email as string
        session.user.name = token.name as string
        ;(session.user as any).role = token.role as string
        ;(session.user as any).tier = token.tier as string
        ;(session.user as any).interval = token.interval as string | null
        ;(session.user as any).status = token.status as string
        ;(session.user as any).hasSubscription = token.hasSubscription as boolean
        ;(session.user as any).trial_active = token.trial_active as boolean
        ;(session.user as any).currentPeriodEnd = token.currentPeriodEnd as string
      }

      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === "development",
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }