// app/api/auth/[...nextauth]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for NextAuth.
// authOptions.ts is DELETED — everything lives here.
// lib/auth.ts re-exports authOptions from this file.
// ─────────────────────────────────────────────────────────────────────────────

import NextAuth, { type NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

const TRIAL_DAYS = 7

// ─── helpers ────────────────────────────────────────────────────────────────

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
  const name = String(full ?? '').trim()
  if (!name) return { first: null as string | null, last: null as string | null }
  const parts = name.split(/\s+/)
  return parts.length === 1
    ? { first: parts[0], last: null }
    : { first: parts[0], last: parts.slice(1).join(' ') }
}

function sha256Hex(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex')
}

// Called during Google sign-in to upsert the user row.
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
      email_verified: true,
      trial_active: true,
      trial_expires_at: true,
      trial_ends_at: true,
    },
  })

  if (!existing) {
    const trialExpires = endOfDay(addDays(now, TRIAL_DAYS))
    return prisma.users.create({
      data: {
        id: crypto.randomUUID(),
        updated_at: now,
        email,
        first_name: first || email.split('@')[0],
        last_name: last || '',
        name: params.name?.trim() || first || email.split('@')[0],
        image: params.image || undefined,
        role: 'user',
        plan: 'BASIC',
        plan_tier: 'BASIC',
        plan_status: 'trialing',
        subscription_status: 'trialing',
        trial_active: true,
        trial_started_at: now,
        trial_expires_at: trialExpires,
        trial_ends_at: trialExpires,
        is_active: true,
        // Google users are instantly verified
        email_verified: params.provider === 'google' ? now : null,
      },
    })
  }

  // Update profile fields if changed
  const shouldVerify = params.provider === 'google' && !existing.email_verified
  const updates: Record<string, any> = { updated_at: now }
  if (first) updates.first_name = first
  if (last) updates.last_name = last
  if (params.name) updates.name = params.name.trim()
  if (params.image) updates.image = params.image
  if (shouldVerify) updates.email_verified = now

  if (Object.keys(updates).length > 1) {
    await prisma.users.update({ where: { id: existing.id }, data: updates })
  }

  return existing
}

// ─── authOptions ─────────────────────────────────────────────────────────────

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,    // 30 days
    updateAge: 24 * 60 * 60,       // re-read DB every 24h
  },

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email:         { label: 'Email',           type: 'email' },
        password:      { label: 'Password',         type: 'password' },
        autoLoginToken:{ label: 'Auto Login Token', type: 'text' },
      },

      async authorize(credentials) {
        const autoLoginToken = String((credentials as any)?.autoLoginToken ?? '').trim()

        // ── OTP TOKEN PATH — no email required ───────────────────────────────
        if (autoLoginToken) {
          const tokenHash = sha256Hex(autoLoginToken)
          const now = new Date()
          const tokenRow = await prisma.auto_login_tokens.findFirst({
            where: { token_hash: tokenHash, used_at: null, expires_at: { gt: now } },
            select: { id: true, user_id: true },
          })
          if (!tokenRow) throw new Error('Invalid or expired sign-in code')
          await prisma.auto_login_tokens.update({ where: { id: tokenRow.id }, data: { used_at: now } })
          const tokenUser = await prisma.users.findUnique({
            where: { id: tokenRow.user_id },
            select: { id: true, email: true, name: true, first_name: true, last_name: true, role: true, plan: true, plan_tier: true, plan_status: true, trial_active: true, trial_ends_at: true, trial_expires_at: true, subscription_status: true, billing_interval: true, stripe_subscription_id: true, stripe_customer_id: true, is_suspended: true },
          })
          if (!tokenUser) throw new Error('Account not found')
          if (tokenUser.is_suspended) throw new Error('Account suspended')
          return buildUserPayload(tokenUser)
        }

        // ── PASSWORD PATH ────────────────────────────────────────────────────
        if (!credentials?.email) return null
        const email    = credentials.email.toLowerCase().trim()
        const password = String(credentials.password ?? '')

        // ── 1. Load user ──────────────────────────────────────────────────────
        const user = await prisma.users.findUnique({
          where: { email },
          select: {
            id: true,
            email: true,
            password_hash: true,
            email_verified: true,
            is_suspended: true,
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
          },
        })

        if (!user) throw new Error('Account not found')

        // ── 2. Auto-login token path (from verification email) ────────────────
        if (autoLoginToken) {
          const tokenHash = sha256Hex(autoLoginToken)
          const now = new Date()

          const tokenRow = await prisma.auto_login_tokens.findFirst({
            where: {
              token_hash: tokenHash,
              used_at: null,
              expires_at: { gt: now },
            },
            select: { id: true, user_id: true },
          })

          if (!tokenRow) throw new Error('Invalid or expired auto-login token')
          if (tokenRow.user_id !== user.id) throw new Error('Token does not match account')

          await prisma.auto_login_tokens.update({
            where: { id: tokenRow.id },
            data: { used_at: now },
          })

          if (user.is_suspended)
            throw new Error('Your account has been suspended. Contact support@precisegovcon.com.')

          return buildUserPayload(user)
        }

        // ── 3. Password path ──────────────────────────────────────────────────
        if (!user.password_hash)
          throw new Error('This account uses a different sign-in method. Try Google.')

        // bcrypt compare first — gives the most accurate error
        const valid = await (await import('bcryptjs')).compare(password, user.password_hash)
        if (!valid) throw new Error('Invalid email or password')

        // Suspension check
        if (user.is_suspended)
          throw new Error('Your account has been suspended. Contact support@precisegovcon.com.')

        // Email verification check (AFTER password — so the error is correct)
        if (!user.email_verified)
          throw new Error('EMAIL_NOT_VERIFIED')   // special code the login page can act on

        return buildUserPayload(user)
      },
    }),
  ],

  // ─── callbacks ─────────────────────────────────────────────────────────────

  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false

      const existing = await prisma.users.findUnique({
        where: { email: user.email.toLowerCase().trim() },
        select: { is_suspended: true },
      })
      if (existing?.is_suspended) return false

      if (account?.provider === 'google') {
        await ensureUserRow({
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
          provider: 'google',
        })
      }

      return true
    },

    async jwt({ token, user, trigger }) {
      // On initial sign-in, seed the token from the authorize() return value
      if (user) {
        token.id    = (user as any).id
        token.email = user.email
        token.name  = user.name
        copyUserToToken(token, user as any)
      }

      // On every request OR on explicit session update, refresh from DB
      const shouldRefresh = !!user || trigger === 'update'
      if (shouldRefresh && token.email) {
        const fresh = await prisma.users.findUnique({
          where: { email: String(token.email) },
          select: {
            id: true, name: true, first_name: true, last_name: true,
            role: true, plan: true, plan_tier: true, plan_status: true,
            subscription_status: true, billing_interval: true,
            trial_active: true, trial_ends_at: true, trial_expires_at: true,
            stripe_subscription_id: true, stripe_customer_id: true,
            is_suspended: true,
          },
        })
        if (fresh) {
          if (fresh.is_suspended) return token  // keep stale token, block at middleware
          token.id   = fresh.id
          token.name = fresh.name ||
            `${fresh.first_name || ''} ${fresh.last_name || ''}`.trim() ||
            String(token.email).split('@')[0]
          copyUserToToken(token, fresh)
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any
        u.id                   = token.id
        u.role                 = token.role
        u.plan                 = token.plan
        u.planTier             = token.planTier
        u.planStatus           = token.planStatus
        u.subscription_status  = token.subscription_status
        u.billingInterval      = token.billingInterval
        u.trial_active         = token.trial_active
        u.trial_ends_at        = token.trial_ends_at
        u.stripe_subscription_id = token.stripe_subscription_id
        u.stripe_customer_id   = token.stripe_customer_id
        u.tier                 = token.tier
        u.interval             = token.interval
        u.status               = token.status
        u.hasSubscription      = token.hasSubscription
        u.current_period_end   = token.current_period_end
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      const base = baseUrl || process.env.NEXTAUTH_URL || 'http://localhost:3000'
      if (url.startsWith('/')) {
        const full = `${base}${url}`
        const pathname = new URL(full).pathname
        if (pathname === '/login' || pathname === '/signin' || pathname === '/') {
          return `${base}/search`
        }
        return full
      }
      try {
        const u = new URL(url)
        if (u.origin === new URL(base).origin) {
          if (u.pathname === '/login' || u.pathname === '/signin' || u.pathname === '/') {
            return `${base}/search`
          }
          return url
        }
      } catch {}
      return `${base}/search`
    },
  },

  pages: {
    signIn: '/login',
    error:  '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildUserPayload(user: any) {
  type AuthTier = 'NONE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
  const rawTier = (user.plan_tier || user.plan || 'BASIC').toUpperCase()
  const tier: AuthTier = rawTier === 'PROFESSIONAL' || rawTier === 'PRO'
    ? 'PROFESSIONAL'
    : rawTier === 'ENTERPRISE'
    ? 'ENTERPRISE'
    : 'BASIC'

  const rawInterval = user.billing_interval || null
  const interval: 'month' | 'year' | null = rawInterval
    ? (/annual|year/i.test(rawInterval) ? 'year' : 'month')
    : null

  const status = user.subscription_status || user.plan_status || 'trialing'
  const currentPeriodEnd = (
    user.trial_expires_at?.toISOString?.() ||
    user.trial_ends_at?.toISOString?.() ||
    new Date().toISOString()
  )

  return {
    id:                   user.id,
    email:                user.email,
    name:                 user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
    role:                 user.role || 'user',
    plan:                 user.plan || null,
    plan_tier:            user.plan_tier || null,
    plan_status:          user.plan_status || null,
    subscription_status:  user.subscription_status || null,
    billing_interval:     user.billing_interval || null,
    trial_active:         !!user.trial_active,
    trial_ends_at:        user.trial_ends_at?.toISOString?.() || null,
    trial_expires_at:     user.trial_expires_at?.toISOString?.() || null,
    stripe_subscription_id: user.stripe_subscription_id || null,
    stripe_customer_id:   user.stripe_customer_id || null,
    tier,
    interval,
    status,
    hasSubscription:      Boolean(
      user.stripe_subscription_id &&
      ['active', 'trialing', 'trial', 'past_due'].includes(status)
    ),
    currentPeriodEnd,
  }
}

function copyUserToToken(token: any, source: any) {
  token.role                 = source.role ?? 'user'
  token.plan                 = source.plan ?? null
  token.planTier             = source.plan_tier ?? null
  token.planStatus           = source.plan_status ?? null
  token.subscription_status  = source.subscription_status ?? null
  token.billingInterval      = source.billing_interval ?? null
  token.trial_active         = source.trial_active ?? false
  token.trial_ends_at        = source.trial_ends_at?.toISOString?.() || null
  token.stripe_subscription_id = source.stripe_subscription_id ?? null
  token.stripe_customer_id   = source.stripe_customer_id ?? null

  // Normalized fields for UI consumption
  const rawTier = (source.plan_tier || source.plan || 'BASIC').toUpperCase()
  token.tier = rawTier === 'PROFESSIONAL' || rawTier === 'PRO'
    ? 'PROFESSIONAL'
    : rawTier === 'ENTERPRISE'
    ? 'ENTERPRISE'
    : 'BASIC'

  const rawInterval = source.billing_interval || null
  token.interval = rawInterval
    ? (/annual|year/i.test(rawInterval) ? 'year' : 'month')
    : null

  token.status = source.subscription_status || source.plan_status || 'trialing'
  token.hasSubscription = Boolean(
    source.stripe_subscription_id &&
    ['active', 'trialing', 'trial', 'past_due'].includes(token.status)
  )
  token.current_period_end = (
    source.trial_expires_at?.toISOString?.() ||
    source.trial_ends_at?.toISOString?.() ||
    new Date().toISOString()
  )
  token.currentPeriodEnd = token.current_period_end
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
