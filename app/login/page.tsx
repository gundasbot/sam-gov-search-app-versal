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
    setLoading(true)
    await signIn(provider, { callbackUrl })
  }

  return (
    <div className="pg-container py-10 md:py-16">
      <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
        <section className="pg-card overflow-hidden p-8 md:p-10">
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

        <section className="pg-surface p-6 md:p-8">
          <h2
            className="text-2xl font-extrabold text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
          >
            Sign in
          </h2>

          <p className="mt-2 text-sm">Use your account credentials or continue with your provider.</p>

          {error && (
            <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--color-text-primary)]">
              {error}
            </div>
          )}

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              onClick={() => handleOAuth('google')}
              disabled={loading}
              className="pg-btn pg-btn-muted h-11 w-full text-sm"
            >
              Continue with Google
            </button>

            <button
              type="button"
              onClick={() => handleOAuth('azure-ad')}
              disabled={loading}
              className="pg-btn pg-btn-muted h-11 w-full text-sm"
            >
              Continue with Microsoft
            </button>
          </div>

          <div className="my-5 h-px bg-[var(--color-border)]" />

          <form onSubmit={handleSubmit} className="space-y-4">
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
                className="pg-input h-11 w-full rounded-xl border bg-[var(--color-surface)] px-3 text-sm"
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-text-secondary)]">
                  Password
                </label>
                <Link href="/forgot-password" className="text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">
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
                  className="pg-input h-11 w-full rounded-xl border bg-[var(--color-surface)] px-3 pr-10 text-sm"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="pg-btn pg-btn-primary h-11 w-full text-sm">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign in'}
            </button>
          </form>
        </section>
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
