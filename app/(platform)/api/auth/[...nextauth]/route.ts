// app/api/auth/[...nextauth]/route.ts
// ─────────────────────────────────────────────────────────────────────────────
// ✅ SINGLE SOURCE OF TRUTH for NextAuth configuration
// This replaces authOptions.ts. Delete authOptions.ts after applying this fix.
// lib/auth.ts re-exports authOptions from this file.
// ─────────────────────────────────────────────────────────────────────────────

import type NextAuthDefault from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import type GoogleProviderDefault from 'next-auth/providers/google'
import type CredentialsProviderDefault from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { sendSignupWelcomeEmailOnce } from '@/lib/email/signup-welcome'
import { sendEmail } from '@/lib/email/send'
import crypto from 'crypto'
import { createRequire } from 'module'
import { resolveAuthBaseUrl } from '@/lib/url-safety'

const TRIAL_DAYS = 7
const LOGIN_ERROR_ALERT_EMAIL = process.env.LOGIN_ERROR_ALERT_EMAIL || 'admin@precisegovcon.com'
const PLATFORM_AUTH_URL = process.env.AUTH_CANONICAL_URL || 'https://platform.precisegovcon.com'

if (process.env.NODE_ENV === 'production') {
  process.env.NEXTAUTH_URL = PLATFORM_AUTH_URL
}

const nodeRequire = createRequire(import.meta.url)
const NextAuth = nodeRequire('next-auth').default as typeof NextAuthDefault
const GoogleProvider = nodeRequire('next-auth/providers/google').default as typeof GoogleProviderDefault
const CredentialsProvider = nodeRequire('next-auth/providers/credentials').default as typeof CredentialsProviderDefault

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

function escapeHtml(value: unknown) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

async function alertLoginError(params: {
  stage: string
  email?: string
  userId?: string
  provider?: string
  error?: unknown
}) {
  try {
    const anyErr = params.error as any
    const errorMessage = String(anyErr?.message || params.error || params.stage)
    const stack = String(anyErr?.stack || '').slice(0, 5000)
    const subject = `[Precise GovCon] Login error: ${params.stage}`
    const rows = [
      ['Stage', params.stage],
      ['Email', params.email || 'unknown'],
      ['User ID', params.userId || 'unknown'],
      ['Provider', params.provider || 'credentials'],
      ['Error', errorMessage],
    ]
    const htmlRows = rows.map(([label, value]) => (
      `<tr><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:700;background:#f8fafc;">${escapeHtml(label)}</td><td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td></tr>`
    )).join('')

    await sendEmail({
      to: LOGIN_ERROR_ALERT_EMAIL,
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;">
          <h2 style="margin:0 0 12px;">Login Error Alert</h2>
          <table style="border-collapse:collapse;width:100%;max-width:760px;">${htmlRows}</table>
          ${stack ? `<h3 style="margin:20px 0 8px;">Stack</h3><pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:14px;border-radius:8px;overflow:auto;">${escapeHtml(stack)}</pre>` : ''}
        </div>
      `,
      text: [
        'Login Error Alert',
        ...rows.map(([label, value]) => `${label}: ${value}`),
        stack ? `Stack:\n${stack}` : '',
      ].filter(Boolean).join('\n'),
    })
  } catch (alertErr) {
    console.error('❌ Failed to send login admin alert:', alertErr)
  }
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
    const created = await prisma.users.create({
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

    await sendSignupWelcomeEmailOnce({
      userId: created.id,
      email: created.email,
      name: created.name || params.name || first || email.split('@')[0],
      source: params.provider === 'google' ? 'google_signup' : 'email_signup',
    })

    return created
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

  // Share session cookie across all *.precisegovcon.com subdomains so that
  // logging in on platform.precisegovcon.com also authenticates the user on
  // www.precisegovcon.com / precisegovcon.com and vice versa.
  cookies: process.env.NODE_ENV === 'production' ? {
    sessionToken: {
      name: `__Secure-next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        secure: true,
        domain: '.precisegovcon.com',
      },
    },
  } : undefined,

  providers: [
    // ✅ Google OAuth - ensure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are in .env.local
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
            select: {
              id: true, email: true, name: true, first_name: true, last_name: true,
              role: true, plan: true, plan_tier: true, plan_status: true,
              trial_active: true, trial_ends_at: true, subscription_status: true,
              billing_interval: true, stripe_subscription_id: true, stripe_customer_id: true,
              is_suspended: true,
            },
          })
          if (!tokenUser) throw new Error('Account not found')
          if (tokenUser.is_suspended) throw new Error('Account suspended')
          return buildUserPayload(tokenUser) as any
        }

        // ── PASSWORD PATH ────────────────────────────────────────────────────
        if (!credentials?.email) return null
        const email    = credentials.email.toLowerCase().trim()
        const password = String(credentials.password ?? '')

        const user = await prisma.users.findUnique({
          where: { email },
          select: {
            id: true, email: true, password_hash: true, email_verified: true,
            is_suspended: true, first_name: true, last_name: true, name: true,
            role: true, plan: true, plan_tier: true, plan_status: true,
            subscription_status: true, billing_interval: true, trial_ends_at: true,
            trial_expires_at: true, trial_active: true,
            stripe_subscription_id: true, stripe_customer_id: true,
          },
        })

        if (!user) {
          throw new Error('Account not found')
        }
        if (!user.email_verified) {
          throw new Error('Email not verified. Please check your inbox.')
        }
        if (!user.password_hash) {
          throw new Error('Password login not enabled for this account')
        }
        if (user.is_suspended) {
          await alertLoginError({ stage: 'account_suspended', email, userId: user.id })
          throw new Error('Your account has been suspended. Contact support@precisegovcon.com.')
        }

        // Verify password
        const bcrypt = await import('bcryptjs')
        const ok = await bcrypt.compare(password, user.password_hash)
        if (!ok) {
          throw new Error('Invalid password')
        }

        return buildUserPayload(user) as any
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      if (!user?.email) return false
      const normalizedEmail = user.email.toLowerCase().trim()
      const now = new Date()

      // Block suspended users
      const existing = await prisma.users.findUnique({
        where: { email: normalizedEmail },
        select: { id: true, name: true, is_suspended: true },
      })
      if (existing?.is_suspended) return false

      let resolvedUserId = existing?.id || null
      let resolvedName = user.name || existing?.name || null

      // For Google OAuth, create/update user row
      if (account?.provider === 'google') {
        const ensuredUser = await ensureUserRow({
          email: normalizedEmail,
          name: user.name ?? null,
          image: user.image ?? null,
          provider: 'google',
        })
        resolvedUserId = (ensuredUser as any)?.id ?? resolvedUserId
        resolvedName = (ensuredUser as any)?.name ?? resolvedName
      }

      // Update last login
      await prisma.users.updateMany({
        where: { email: normalizedEmail },
        data: { last_login_at: now, updated_at: now },
      })

      // Send welcome email
      if (resolvedUserId) {
        try {
          await sendSignupWelcomeEmailOnce({
            userId: resolvedUserId,
            email: normalizedEmail,
            name: resolvedName || normalizedEmail.split('@')[0],
            source: account?.provider === 'google' ? 'google_signin' : 'credentials_signin',
          })
        } catch (welcomeErr) {
          console.warn('⚠️ Welcome email failed during sign-in:', welcomeErr)
          await alertLoginError({
            stage: 'signin_welcome_email_failed',
            email: normalizedEmail,
            userId: resolvedUserId,
            provider: account?.provider,
            error: welcomeErr,
          })
        }
      }

      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id
        token.email = user.email
        token.name = user.name
      }

      // Refresh from DB on every request
      if (token?.email) {
        try {
          const dbUser = await prisma.users.findUnique({
            where: { email: String(token.email) },
            select: {
              id: true, email: true, name: true, first_name: true, last_name: true,
              role: true, plan: true, plan_tier: true, plan_status: true,
              subscription_status: true, billing_interval: true,
              trial_active: true, trial_ends_at: true, trial_expires_at: true,
              stripe_subscription_id: true, stripe_customer_id: true,
              is_suspended: true,
            },
          })

          if (dbUser) {
            if (dbUser.is_suspended) return token // Block at middleware instead
            token.id = dbUser.id
            token.name = dbUser.name || `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim()
            copyUserToToken(token, dbUser)
          }
        } catch {
          // DB unavailable — return existing token to keep the session alive
        }
      }

      return token
    },

    async session({ session, token }) {
      if (session.user) {
        const u = session.user as any
        u.id = token.id
        u.role = token.role
        u.plan = token.plan
        u.planTier = token.planTier
        u.planStatus = token.planStatus
        u.subscription_status = token.subscription_status
        u.billingInterval = token.billingInterval
        u.trial_active = token.trial_active
        u.trial_ends_at = token.trial_ends_at
        u.stripe_subscription_id = token.stripe_subscription_id
        u.stripe_customer_id = token.stripe_customer_id
      }
      return session
    },

    async redirect({ url, baseUrl }) {
      const base = baseUrl || resolveAuthBaseUrl()
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
    error: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function buildUserPayload(user: any) {
  const rawTier = (user.plan_tier || user.plan || 'BASIC').toUpperCase()
  const tier = rawTier === 'PROFESSIONAL' || rawTier === 'PRO' ? 'PROFESSIONAL'
    : rawTier === 'ENTERPRISE' ? 'ENTERPRISE'
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
    id: user.id,
    email: user.email,
    name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
    role: user.role || 'user',
    plan: user.plan || null,
    plan_tier: user.plan_tier || null,
    plan_status: user.plan_status || null,
    subscription_status: user.subscription_status || null,
    billing_interval: user.billing_interval || null,
    trial_active: !!user.trial_active,
    trial_ends_at: user.trial_ends_at?.toISOString?.() || null,
    trial_expires_at: user.trial_expires_at?.toISOString?.() || null,
    stripe_subscription_id: user.stripe_subscription_id || null,
    stripe_customer_id: user.stripe_customer_id || null,
    tier,
    interval,
    status,
    hasSubscription: Boolean(
      user.stripe_subscription_id &&
      ['active', 'trialing', 'trial', 'past_due'].includes(status)
    ),
    currentPeriodEnd,
  }
}

function copyUserToToken(token: any, source: any) {
  token.role = source.role ?? 'user'
  token.plan = source.plan ?? null
  token.planTier = source.plan_tier ?? null
  token.planStatus = source.plan_status ?? null
  token.subscription_status = source.subscription_status ?? null
  token.billingInterval = source.billing_interval ?? null
  token.trial_active = source.trial_active ?? false
  token.trial_ends_at = source.trial_ends_at?.toISOString?.() || null
  token.stripe_subscription_id = source.stripe_subscription_id ?? null
  token.stripe_customer_id = source.stripe_customer_id ?? null
}

// ✅ Export handler for Next.js routing
const handler = (req: Request, ctx: any) => {
  // Always use the actual request origin as NEXTAUTH_URL so that:
  //  • login on precisegovcon.com redirects back to precisegovcon.com
  //  • login on platform.precisegovcon.com redirects back there
  // Falls back to PLATFORM_AUTH_URL for non-allowlisted origins (Vercel previews, etc.)
  process.env.NEXTAUTH_URL = resolveAuthBaseUrl(req) || PLATFORM_AUTH_URL
  return NextAuth(authOptions)(req, ctx)
}
export { handler as GET, handler as POST }
