'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'

const stats = [
  { value: '900+', label: 'Live opportunities' },
  { value: '98%', label: 'Client success rate' },
  { value: '24/7', label: 'Search automation' },
]

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const emailParam = searchParams.get('email') || ''

  const [email, setEmail] = useState(emailParam)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const microsoftEntraEnabled = false

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  async function handleOAuth(provider: 'google' | 'azure-ad') {
    if (provider === 'azure-ad' && !microsoftEntraEnabled) {
      setError('Microsoft Entra SSO is being finalized. Please sign in with email or Google Workspace for now.')
      return
    }
    setLoading(true)
    await signIn(provider, { callbackUrl })
  }

  return (
    <div className="relative isolate overflow-hidden bg-[var(--color-surface-muted)]/60 py-12 md:py-20">
      <div className="absolute inset-y-0 right-0 hidden w-1/2 bg-[radial-gradient(circle_at_top,rgba(94,234,212,0.25),transparent_55%)] blur-3xl lg:block" aria-hidden="true" />
      <div className="pg-container relative z-10">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch xl:grid-cols-[1.05fr,0.95fr]">
          <section className="pg-card flex flex-col justify-between overflow-hidden border-[var(--color-border-strong)] bg-[var(--color-surface)]/95 p-8 shadow-xl md:p-10">
            <span className="pg-badge">
              <ShieldCheck className="h-4 w-4" />
              Secure login
            </span>

            <h1
              className="mt-5 text-4xl font-extrabold text-[var(--color-text-primary)] md:text-5xl"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Welcome back.
            </h1>

            <p className="mt-4 max-w-lg text-base md:text-lg">
              Sign in to continue tracking opportunities, alerts, and proposal priorities.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                  <p className="text-2xl font-extrabold text-[var(--color-text-primary)]">{stat.value}</p>
                  <p className="text-xs uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">No account yet?</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Start with a 7-day free trial and keep full access to search and alerts.</p>
              <Link href="/signup" className="pg-btn pg-btn-muted mt-4 px-5 py-2.5 text-sm">
                Create account
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

        <section className="relative">
          <div className="absolute inset-0 rounded-[32px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_60%)] shadow-inner" aria-hidden="true" />
          <div className="relative rounded-[32px] border border-[var(--color-border-strong)] bg-[var(--color-surface)]/90 p-6 shadow-2xl backdrop-blur-md md:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-text-secondary)]">Account Access</p>
                <h2
                  className="text-3xl font-black text-[var(--color-text-primary)]"
                  style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
                >
                  Sign in
                </h2>
              </div>
              <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                AES-256 encrypted
              </div>
            </div>

            <p className="mt-4 text-sm text-[var(--color-text-secondary)]">Use your workspace credentials or a connected identity provider to continue.</p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={loading}
                className="pg-btn pg-btn-muted h-11 w-full gap-2 text-sm"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Workspace
              </button>

              <button
                type="button"
                onClick={() => handleOAuth('azure-ad')}
                disabled={loading || !microsoftEntraEnabled}
                title={microsoftEntraEnabled ? undefined : 'Microsoft Entra SSO coming soon'}
                className="pg-btn pg-btn-muted h-11 w-full gap-2 text-sm disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-4 w-4" viewBox="0 0 21 21" aria-hidden="true">
                  <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                  <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                  <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                  <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
                </svg>
                {microsoftEntraEnabled ? 'Microsoft Entra' : 'Microsoft Entra (soon)'}
              </button>
            </div>

            <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-[var(--color-text-tertiary)]">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              OR EMAIL ACCESS
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  required
                  className="pg-input h-12 w-full rounded-2xl border bg-[var(--color-surface)] px-4 text-sm"
                />
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                    Password
                  </label>
                  <Link
                    href="/forgot-password"
                    className="inline-flex items-center gap-1 rounded-2xl bg-[#40ffb6] px-3 py-1 text-[0.7rem] font-black uppercase tracking-[0.12em] text-[#063626] shadow-[0_6px_16px_rgba(64,255,182,0.45)] transition-transform hover:-translate-y-0.5"
                  >
                    Forgot?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="pg-input h-12 w-full rounded-2xl border bg-[var(--color-surface)] px-4 pr-12 text-sm"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="pg-btn pg-btn-primary h-12 w-full text-base font-semibold">
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Access dashboard'}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)]/70 px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
                <p>Multi-factor authentication is enforced for administrator roles. Contact support to update IdP policies.</p>
              </div>
              {!microsoftEntraEnabled && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-900">
                  Microsoft Entra single sign-on is being configured. Reach out to support if you need to be added to the pilot group.
                </div>
              )}
            </div>
          </div>
        </section>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div className="pg-container flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--color-primary)]" />
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  )
}
