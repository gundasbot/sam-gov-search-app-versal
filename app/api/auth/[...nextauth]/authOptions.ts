// app/api/auth/[...nextauth]/authOptions.ts

import NextAuth, { type NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"

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
  if (!name) return { first: null as string | null, last: null as string | null }
  const parts = name.split(/\s+/)
  if (parts.length === 1) return { first: parts[0], last: null }
  return { first: parts[0], last: parts.slice(1).join(" ") }
}

function sha256Hex(input: string) {
  return crypto.createHash("sha256").update(input).digest("hex")
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
    },
  })

  if (!existing) {
    const trialExpires = endOfDay(addDays(now, TRIAL_DAYS))
    const displayName = params.name || `${first || ""} ${last || ""}`.trim() || email.split("@")[0]

    const user = await prisma.users.create({
      data: {
        // ✅ FIX: schema requires these on create
        id: crypto.randomUUID(),
        updated_at: now,

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
        email_verified: params.provider === "google" ? now : null,
        name: displayName,
        image: params.image || undefined,
      },
    })

    return user
  }

  const shouldVerifyNow = params.provider === "google" && !existing.email_verified
  const updateData: any = {
    ...(first && { first_name: first }),
    ...(last && { last_name: last }),
    ...(params.name && { name: params.name.trim() }),
    ...(params.image && { image: params.image }),
    ...(shouldVerifyNow && { email_verified: now }),
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.users.update({
      where: { id: existing.id },
      data: updateData,
    })
  }

  return existing
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours - refresh session from DB
  },

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
        autoLoginToken: { label: "Auto Login Token", type: "text" },
      },
      async authorize(credentials) {
        const rawEmail = credentials?.email
        if (!rawEmail) return null

        const email = rawEmail.toLowerCase().trim()
        const password = String(credentials?.password ?? "")
        const autoLoginToken = String((credentials as any)?.autoLoginToken ?? "").trim()

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
            stripe_customer_id: true,
            is_suspended: true,
          },
        })

        if (!user) {
          throw new Error("Account not found")
        }

        if (!user.email_verified) {
          throw new Error("Email not verified. Please check your inbox.")
        }

        if (autoLoginToken) {
          const tokenHash = sha256Hex(autoLoginToken)
          const now = new Date()

          const tokenRow = await prisma.auto_login_tokens.findFirst({
            where: {
              token_hash: tokenHash,
              used_at: null,
              expires_at: { gt: now },
            },
            select: {
              id: true,
              user_id: true,
              expires_at: true,
              used_at: true,
            },
          })

          if (!tokenRow) {
            throw new Error("Invalid or expired auto-login token")
          }

          // Mark token used
          await prisma.auto_login_tokens.update({
            where: { id: tokenRow.id },
            data: { used_at: now },
          })

          if (user.is_suspended) {
            throw new Error("Your account has been suspended. Contact support@precisegovcon.com.")
          }

          // Successful login via token
          return {
            id: user.id,
            email: user.email,
            name: user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
            role: user.role || "user",
            plan: user.plan || null,
            plan_tier: user.plan_tier || null,
            plan_status: user.plan_status || null,
            trial_active: !!user.trial_active,
            trial_ends_at: user.trial_ends_at || null,
            subscription_status: user.subscription_status || null,
            billing_interval: user.billing_interval || null,
          } as any
        }

        if (!user.password_hash) {
          throw new Error("Password login not enabled for this account")
        }

        // Verify password
        const bcrypt = await import("bcryptjs")
        const ok = await bcrypt.compare(password, user.password_hash)
        if (!ok) {
          throw new Error("Invalid password")
        }

        // Check suspension
        if ((user as any).is_suspended) {
          throw new Error("Your account has been suspended. Contact support@precisegovcon.com.")
        }

        // Successful login
        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email,
          role: user.role || "user",
          plan: user.plan || null,
          plan_tier: user.plan_tier || null,
          plan_status: user.plan_status || null,
          trial_active: !!user.trial_active,
          trial_ends_at: user.trial_ends_at || null,
          subscription_status: user.subscription_status || null,
          billing_interval: user.billing_interval || null,
        } as any
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false

      // Block suspended users from Google sign-in too
      const existing = await prisma.users.findUnique({
        where: { email: user.email.toLowerCase().trim() },
        select: { is_suspended: true },
      })
      if (existing?.is_suspended) return false

      await ensureUserRow({
        email: user.email,
        name: user.name ?? null,
        image: (user as any).image ?? null,
        provider: account?.provider ?? null,
      })
      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.email = user.email
      }

      if (token?.email) {
        const dbUser = await prisma.users.findUnique({
          where: { email: String(token.email) },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            plan: true,
            plan_tier: true,
            plan_status: true,
            trial_active: true,
            trial_ends_at: true,
            subscription_status: true,
            billing_interval: true,
            stripe_subscription_id: true,
            stripe_customer_id: true,
            is_suspended: true,
          },
        })

        if (dbUser) {
          token.id = dbUser.id
          token.name = dbUser.name
          token.role = dbUser.role ?? "user"
          token.plan = dbUser.plan
          token.planTier = dbUser.plan_tier
          token.planStatus = dbUser.plan_status
          token.trial_active = dbUser.trial_active ?? false  // ✅ FIX: Convert null to false
          token.trial_ends_at = dbUser.trial_ends_at
          token.subscription_status = dbUser.subscription_status
          token.billingInterval = dbUser.billing_interval
          token.stripe_subscription_id = dbUser.stripe_subscription_id
          token.stripe_customer_id = dbUser.stripe_customer_id
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id
        ;(session.user as any).role = (token as any).role
        ;(session.user as any).plan = (token as any).plan
        ;(session.user as any).planTier = (token as any).planTier
        ;(session.user as any).planStatus = (token as any).planStatus
        ;(session.user as any).trial_active = (token as any).trial_active
        ;(session.user as any).trial_ends_at = (token as any).trial_ends_at
        ;(session.user as any).subscription_status = (token as any).subscription_status
        ;(session.user as any).billingInterval = (token as any).billingInterval
        ;(session.user as any).stripe_subscription_id = (token as any).stripe_subscription_id
        ;(session.user as any).stripe_customer_id = (token as any).stripe_customer_id
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      // Only allow relative redirects or same-origin
      if (url.startsWith("/")) return `${baseUrl}${url}`
      try {
        const u = new URL(url)
        if (u.origin === baseUrl) return url
      } catch {}
      return baseUrl
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)