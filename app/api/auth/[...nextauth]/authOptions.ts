// app/api/auth/[...nextauth]/authOptions.ts - FIXED REDIRECT LOOP

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
    },
  })

  if (!existing) {
    const trialExpires = endOfDay(addDays(now, TRIAL_DAYS))
    const displayName = params.name || `${first || ""} ${last || ""}`.trim() || email.split('@')[0]

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
        name: displayName,
        image: params.image || undefined,
      },
    })

    return user
  }

  const shouldVerifyNow = params.provider === "google" && !existing.emailVerified
  const updateData: any = {
    ...(first && { firstName: first }),
    ...(last && { lastName: last }),
    ...(params.name && { name: params.name.trim() }),
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
            stripeCustomerId: true,
          },
        })

        if (!user) {
          throw new Error("Account not found")
        }

        if (!user.emailVerified) {
          throw new Error("Email not verified. Please check your inbox.")
        }

        if (autoLoginToken) {
          const tokenHash = sha256Hex(autoLoginToken)
          const now = new Date()

          const tokenRow = await prisma.auto_login_tokens.findFirst({
            where: {
              user_id: user.id,
              token_hash: tokenHash,
              used_at: null,
              expires_at: { gt: now },
            },
            select: { id: true },
          })

          if (!tokenRow) {
            throw new Error("Invalid credentials")
          }

          await prisma.auto_login_tokens.update({
            where: { id: tokenRow.id },
            data: { used_at: now },
          })
        } else {
          if (!password || !user.passwordHash) {
            throw new Error("Invalid credentials")
          }

          const { compare } = await import("bcryptjs")
          const valid = await compare(password, user.passwordHash)
          if (!valid) {
            throw new Error("Invalid credentials")
          }
        }

        let tier: "BASIC" | "PROFESSIONAL" | "ENTERPRISE" = "BASIC"
        const rawTier = (user.planTier || user.plan || 'BASIC').toUpperCase()
        if (rawTier === 'PROFESSIONAL' || rawTier === 'PRO') {
          tier = 'PROFESSIONAL'
        } else if (rawTier === 'ENTERPRISE') {
          tier = 'ENTERPRISE'
        } else {
          tier = 'BASIC'
        }

        const rawInterval = user.billingInterval || null
        let interval: 'month' | 'year' | null = null
        if (rawInterval) {
          const lower = String(rawInterval).toLowerCase()
          if (lower === 'monthly' || lower === 'month') interval = 'month'
          if (lower === 'annual' || lower === 'year') interval = 'year'
        }

        const status = user.subscriptionStatus || user.planStatus || 'trialing'

        const hasSubscription = Boolean(
          user.stripeSubscriptionId &&
          (status === 'active' || status === 'trialing' || status === 'trial' || status === 'past_due')
        )

        console.log(`✅ User logged in: ${user.email}, hasSubscription: ${hasSubscription}, tier: ${tier}, status: ${status}`)

        return {
          id: user.id,
          email: user.email,
          name: user.name || `${user.firstName || ""} ${user.lastName || ""}`.trim() || email.split('@')[0],
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
        image: (user as any).image ?? null,
        provider: account?.provider ?? null,
      })
    },
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as any).id
        token.email = user.email
        token.name = user.name || (user as any).name || ""
        token.role = (user as any).role ?? "user"
        token.tier = (user as any).tier || "BASIC"
        token.interval = (user as any).interval || null
        token.status = (user as any).status || "trialing"
        token.hasSubscription = (user as any).hasSubscription || false
        token.trial_active = (user as any).trial_active || false
        token.currentPeriodEnd = (user as any).currentPeriodEnd
      }

      // ✅ ALWAYS REFRESH FROM DATABASE
      // This ensures subscription updates are reflected immediately
      if (token.email) {
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
              stripeCustomerId: true,
            },
          })

          if (dbUser) {
            token.id = dbUser.id
            token.name = dbUser.name || `${dbUser.firstName || ""} ${dbUser.lastName || ""}`.trim() || (token.email as string).split('@')[0]
            token.role = dbUser.role ?? "user"

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

            const rawInterval = dbUser.billingInterval || null
            let interval: 'month' | 'year' | null = null
            if (rawInterval) {
              const lower = String(rawInterval).toLowerCase()
              if (lower === 'monthly' || lower === 'month') interval = 'month'
              if (lower === 'annual' || lower === 'year') interval = 'year'
            }
            token.interval = interval

            const status = dbUser.subscriptionStatus || dbUser.planStatus || 'trialing'
            token.status = status

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

            console.log(`🔄 JWT refreshed for ${token.email}: hasSubscription=${hasSubscription}, tier=${tier}`)
          }
        } catch (err) {
          console.error("JWT refresh error:", err)
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id as string
        session.user.email = token.email as string
        session.user.name = (token.name as string) || (token.email as string).split('@')[0]
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

    async redirect({ url, baseUrl }) {
      // Parse URL to check for welcome flag
      const urlObj = new URL(url.startsWith('/') ? `${baseUrl}${url}` : url)
      const welcomeFlag = urlObj.searchParams.get('welcome')
      
      // ✅ NEVER REDIRECT /dashboard TO ANYWHERE ELSE
      // This fixes the redirect loop
      if (url.startsWith('/dashboard') || url.includes('/dashboard')) {
        console.log('✅ Allowing access to /dashboard page')
        return url.startsWith('/') ? `${baseUrl}${url}` : url
      }
      
      // Handle relative URLs
      if (url.startsWith('/')) {
        // Block redirects to /dashboard from other pages
        if (url === '/login' || url.startsWith('/login?')) {
          console.log('🔀 Redirecting to dashboard instead of login')
          const dashboardUrl = new URL('/dashboard', baseUrl)
          if (welcomeFlag === 'true') {
            dashboardUrl.searchParams.set('welcome', 'true')
          }
          return dashboardUrl.toString()
        }
        
        if (welcomeFlag === 'true') {
          const targetUrl = new URL(url, baseUrl)
          targetUrl.searchParams.set('welcome', 'true')
          return targetUrl.toString()
        }
        
        return `${baseUrl}${url}`
      }
      
      // Handle absolute URLs
      if (url.startsWith(baseUrl)) {
        const path = url.replace(baseUrl, '')
        
        if (path === '/login' || path.startsWith('/login?')) {
          console.log('🔀 Redirecting to dashboard instead of login')
          const dashboardUrl = new URL('/dashboard', baseUrl)
          if (welcomeFlag === 'true') {
            dashboardUrl.searchParams.set('welcome', 'true')
          }
          return dashboardUrl.toString()
        }
        
        if (welcomeFlag === 'true' && !url.includes('welcome=')) {
          const targetUrl = new URL(url)
          targetUrl.searchParams.set('welcome', 'true')
          return targetUrl.toString()
        }
        
        return url
      }
      
      // Default: redirect to dashboard
      console.log('✅ Default redirect to /dashboard')
      const dashboardUrl = new URL('/dashboard', baseUrl)
      if (welcomeFlag === 'true') {
        dashboardUrl.searchParams.set('welcome', 'true')
      }
      return dashboardUrl.toString()
    },
  },
}