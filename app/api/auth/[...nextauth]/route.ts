// app/api/auth/[...nextauth]/route.ts 

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
        autoLoginUserId: { label: "Auto Login User ID", type: "text" }, // ✅ ADD THIS
      },
      async authorize(credentials) {
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

        // ✅ AUTO-LOGIN FLOW CHECK
        if (
          credentials.autoLoginUserId &&
          credentials.autoLoginUserId === user.id
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

        // ✅ Normalize tier to one of three tiers
        let tier: "BASIC" | "PROFESSIONAL" | "ENTERPRISE" = "BASIC"
        const rawTier = (user.plan_tier || user.plan || "BASIC").toUpperCase()

        if (rawTier === "PROFESSIONAL" || rawTier === "PRO") {
          tier = "PROFESSIONAL"
        } else if (rawTier === "ENTERPRISE") {
          tier = "ENTERPRISE"
        } else {
          tier = "BASIC"
        }

        // ✅ Normalize interval
        const rawInterval = user.billing_interval || null
        let interval: "month" | "year" | null = null
        if (rawInterval) {
          const lower = String(rawInterval).toLowerCase()
          if (lower === "monthly" || lower === "month") interval = "month"
          if (lower === "annual" || lower === "year") interval = "year"
        }

        // ✅ Use subscription_status as primary, fallback to plan_status
        const status = user.subscription_status || user.plan_status || "trialing"

        // ✅ Check if user has active subscription
        const hasSubscription = Boolean(
          user.stripe_subscription_id &&
            (status === "active" ||
              status === "trialing" ||
              status === "trial" ||
              status === "past_due")
        )

        return {
          id: user.id,
          email: user.email,
          name:
            user.name ||
            `${user.first_name ?? ""} ${user.last_name ?? ""}`.trim() ||
            email.split("@")[0],
          role: user.role ?? "user",
          tier,
          interval,
          status,
          hasSubscription,
          trial_active: user.trial_active || false,
          currentPeriodEnd:
            user.trial_expires_at?.toISOString() ||
            user.trial_ends_at?.toISOString() ||
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
    // ✅ Force sane post-login landing
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

            // Normalize tier
            let tier: "BASIC" | "PROFESSIONAL" | "ENTERPRISE" = "BASIC"
            const rawTier = (dbUser.plan_tier || dbUser.plan || "BASIC").toUpperCase()

            if (rawTier === "PROFESSIONAL" || rawTier === "PRO") {
              tier = "PROFESSIONAL"
            } else if (rawTier === "ENTERPRISE") {
              tier = "ENTERPRISE"
            } else {
              tier = "BASIC"
            }

            token.tier = tier

            // Normalize interval
            const rawInterval = dbUser.billing_interval || null
            let interval: "month" | "year" | null = null
            if (rawInterval) {
              const lower = String(rawInterval).toLowerCase()
              if (lower === "monthly" || lower === "month") interval = "month"
              if (lower === "annual" || lower === "year") interval = "year"
            }

            token.interval = interval

            // Use subscription_status as primary
            const status = dbUser.subscription_status || dbUser.plan_status || "trialing"
            token.status = status

            // Check if user has active subscription
            const hasSubscription = Boolean(
              dbUser.stripe_subscription_id &&
                (status === "active" ||
                  status === "trialing" ||
                  status === "trial" ||
                  status === "past_due")
            )

            token.hasSubscription = hasSubscription
            token.trial_active = dbUser.trial_active ?? false
            token.currentPeriodEnd =
              dbUser.trial_expires_at?.toISOString() ||
              dbUser.trial_ends_at?.toISOString() ||
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