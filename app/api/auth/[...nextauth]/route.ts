// app/api/auth/[...nextauth]/route.ts - FIXED

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

  const existing = await prisma.users.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      trial_ends_at: true,
      trial_active: true,
      plan: true,
      trial_expires_at: true,
      plan_tier: true,
      plan_status: true,
      email_verified: true,
      subscription_status: true,
      billing_interval: true,
      stripe_subscription_id: true,
    },
  })

  // If user doesn't exist, create one with BASIC tier and 7-day trial
  if (!existing) {
    const trialExpires = endOfDay(addDays(now, TRIAL_DAYS))
    
    // Generate a unique ID using crypto
    const { randomUUID } = await import("crypto")
    const userId = randomUUID()

    const user = await prisma.users.create({
      data: {
        id: userId,
        email,
        first_name: first || email.split("@")[0],
        last_name: last || "",
        role: "user",
        plan: "BASIC",
        plan_tier: "BASIC",
        plan_status: "trialing",
        trial_active: true,
        trial_started_at: now,
        trial_expires_at: trialExpires,
        trial_ends_at: trialExpires,
        updated_at: now,
        email_verified: params.provider === "google" ? now : null,
        name:
          params.name ||
          `${first || ""} ${last || ""}`.trim() ||
          email.split("@")[0],
        image: params.image || undefined,
      },
    })

    return user
  }

  // Keep user profile info fresh
  const shouldVerifyNow = params.provider === "google" && !existing.email_verified
  const updateData: any = {
    updated_at: now,
    ...(first && { first_name: first }),
    ...(last && { last_name: last }),
    ...(params.name && { name: params.name }),
    ...(params.image && { image: params.image }),
    ...(shouldVerifyNow && { email_verified: now }),
  }

  if (Object.keys(updateData).length > 1) { // Changed from > 0 to > 1 since updated_at is always present
    await prisma.users.update({
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
        auto_login_user_id: { label: "Auto Login User ID", type: "text" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email) {
          throw new Error("Email is required")
        }

        const email = credentials.email.toLowerCase().trim()

        const user = await prisma.users.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            password_hash: true,
            email_verified: true,
            first_name: true,
            last_name: true,
            name: true,
            role: true,
            plan: true,
            plan_tier: true,
            plan_status: true,
            subscription_status: true,
            billing_interval: true,
            trial_ends_at: true,
            trial_expires_at: true,
            trial_active: true,
            stripe_subscription_id: true,
          },
        })

        if (!user) {
          throw new Error("Account not found")
        }

        // AUTO-LOGIN FLOW CHECK
        if (
          credentials.auto_login_user_id &&
          credentials.auto_login_user_id === user.id
        ) {
          // Auto-login flow - token already validated by /api/auth/auto-login
          console.log(`✅ Auto-login authorize for ${user.email}`)
          // Skip password check - continue
        } else {
          // REGULAR PASSWORD LOGIN
          if (!credentials.password) {
            throw new Error("Password is required")
          }

          if (!user.password_hash) {
            throw new Error("Please use a different login method")
          }

          const { compare } = await import("bcryptjs")
          const valid = await compare(credentials.password, user.password_hash)
          if (!valid) {
            throw new Error("Invalid credentials")
          }
        }

        // Check email verification (for both flows)
        if (!user.email_verified) {
          throw new Error("Email not verified. Please check your inbox.")
        }

        // Return a User object with type assertion
        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || email.split("@")[0],
          // Add custom properties with type assertion
          role: user.role ?? "user",
          plan: user.plan,
          plan_tier: user.plan_tier,
          plan_status: user.plan_status,
          subscription_status: user.subscription_status,
          billing_interval: user.billing_interval,
          trial_active: user.trial_active,
          trial_ends_at: user.trial_ends_at,
          stripe_subscription_id: user.stripe_subscription_id,
        } as any
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
    // Force sane post-login landing
    async redirect({ url, baseUrl }) {
      try {
        const u = new URL(url, baseUrl)

        // If NextAuth is trying to send you to /account (or back to /login), override to /dashboard
        if (u.pathname === "/account" || u.pathname === "/login") {
          return `${baseUrl}/dashboard`
        }

        // If callbackUrl is present and points to /account, override it
        const cb = u.searchParams.get("callbackUrl")
        if (cb) {
          const cbUrl = new URL(cb, baseUrl)
          if (cbUrl.pathname === "/account") {
            return `${baseUrl}/dashboard`
          }
        }

        // Allow same-origin safe redirects, otherwise default to /dashboard
        if (u.origin === new URL(baseUrl).origin) {
          return u.toString()
        }

        return `${baseUrl}/dashboard`
      } catch {
        return `${baseUrl}/dashboard`
      }
    },

    async jwt({ token, user, trigger }) {
      // On sign in, add user data to token
      if (user) {
        token.id = (user as any).id
        token.email = user.email
        token.name = user.name
        
        // Pass custom properties from user object
        token.role = (user as any).role ?? "user"
        token.plan = (user as any).plan
        token.plan_tier = (user as any).plan_tier
        token.plan_status = (user as any).plan_status
        token.subscription_status = (user as any).subscription_status
        token.billing_interval = (user as any).billing_interval
        token.trial_active = (user as any).trial_active
        token.trial_ends_at = (user as any).trial_ends_at
        token.stripe_subscription_id = (user as any).stripe_subscription_id

        // Also set normalized tier, interval, etc. for backward compatibility
        const rawTier = ((user as any).plan_tier || (user as any).plan || "BASIC").toUpperCase()
        token.tier = (() => {
          if (rawTier === "PROFESSIONAL" || rawTier === "PRO") return "PROFESSIONAL"
          if (rawTier === "ENTERPRISE") return "ENTERPRISE"
          return "BASIC"
        })()

        const rawInterval = (user as any).billing_interval || null
        token.interval = (() => {
          if (rawInterval) {
            const lower = String(rawInterval).toLowerCase()
            if (lower === "monthly" || lower === "month") return "month"
            if (lower === "annual" || lower === "year") return "year"
          }
          return null
        })()

        token.status = (user as any).subscription_status || (user as any).plan_status || "trialing"
        token.hasSubscription = Boolean(
          (user as any).stripe_subscription_id &&
          (token.status === "active" ||
            token.status === "trialing" ||
            token.status === "trial" ||
            token.status === "past_due")
        )
        token.current_period_end = (user as any).trial_expires_at?.toISOString() ||
          (user as any).trial_ends_at?.toISOString() ||
          new Date().toISOString()
      }

      // If session update is triggered, fetch fresh data from database
      if (token.email && trigger === "update") {
        try {
          const dbUser = await prisma.users.findUnique({
            where: { email: token.email as string },
            select: {
              id: true,
              name: true,
              first_name: true,
              last_name: true,
              role: true,
              plan: true,
              plan_tier: true,
              plan_status: true,
              subscription_status: true,
              billing_interval: true,
              trial_active: true,
              trial_ends_at: true,
              trial_expires_at: true,
              stripe_subscription_id: true,
            },
          })

          if (dbUser) {
            token.id = dbUser.id
            token.name =
              dbUser.name ||
              `${dbUser.first_name || ""} ${dbUser.last_name || ""}`.trim() ||
              (token.email as string).split("@")[0]
            token.role = dbUser.role ?? "user"
            token.plan = dbUser.plan
            token.plan_tier = dbUser.plan_tier
            token.plan_status = dbUser.plan_status
            token.subscription_status = dbUser.subscription_status
            token.billing_interval = dbUser.billing_interval
            token.trial_active = dbUser.trial_active ?? false  // Convert null to false
            token.trial_ends_at = dbUser.trial_ends_at
            token.stripe_subscription_id = dbUser.stripe_subscription_id

            // Normalize tier
            const rawTier = (dbUser.plan_tier || dbUser.plan || "BASIC").toUpperCase()
            token.tier = (() => {
              if (rawTier === "PROFESSIONAL" || rawTier === "PRO") return "PROFESSIONAL"
              if (rawTier === "ENTERPRISE") return "ENTERPRISE"
              return "BASIC"
            })()

            // Normalize interval
            const rawInterval = dbUser.billing_interval || null
            token.interval = (() => {
              if (rawInterval) {
                const lower = String(rawInterval).toLowerCase()
                if (lower === "monthly" || lower === "month") return "month"
                if (lower === "annual" || lower === "year") return "year"
              }
              return null
            })()

            // Use subscription_status as primary
            token.status = dbUser.subscription_status || dbUser.plan_status || "trialing"

            // Check if user has active subscription
            token.hasSubscription = Boolean(
              dbUser.stripe_subscription_id &&
                (token.status === "active" ||
                  token.status === "trialing" ||
                  token.status === "trial" ||
                  token.status === "past_due")
            )

            token.current_period_end = dbUser.trial_expires_at?.toISOString() ||
              dbUser.trial_ends_at?.toISOString() ||
              token.current_period_end
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
        
        // Pass all custom properties
        ;(session.user as any).role = token.role as string
        ;(session.user as any).plan = token.plan as string
        ;(session.user as any).plan_tier = token.plan_tier as string
        ;(session.user as any).plan_status = token.plan_status as string
        ;(session.user as any).subscription_status = token.subscription_status as string
        ;(session.user as any).billing_interval = token.billing_interval as string
        ;(session.user as any).trial_active = token.trial_active as boolean
        ;(session.user as any).trial_ends_at = token.trial_ends_at as Date
        ;(session.user as any).stripe_subscription_id = token.stripe_subscription_id as string
        
        // Normalized properties for backward compatibility
        ;(session.user as any).tier = token.tier as string
        ;(session.user as any).interval = token.interval as string | null
        ;(session.user as any).status = token.status as string
        ;(session.user as any).hasSubscription = token.hasSubscription as boolean
        ;(session.user as any).current_period_end = token.current_period_end as string
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