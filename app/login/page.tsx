// app/login/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, status } = useSession()

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  const [mode, setMode] = useState<'login' | 'forgot' | 'reset' | 'verify'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [errorMsg, setErrorMsg] = useState(
    error === 'CredentialsSignin' ? 'Invalid email or password.' :
    error === 'OAuthAccountNotLinked' ? 'This email is linked to a different sign-in method.' :
    error ? 'Something went wrong. Please try again.' : ''
  )

  useEffect(() => {
    if (status === 'authenticated') router.replace(callbackUrl)
  }, [status, router, callbackUrl])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    const res = await signIn('credentials', {
      email, password, redirect: false, callbackUrl,
    })
    setLoading(false)
    if (res?.error) {
      setErrorMsg('Invalid email or password.')
    } else if (res?.url) {
      router.replace(res.url)
    }
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMessage('Check your inbox — we sent a reset link.')
      setMode('verify')
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* ── LEFT PANEL — Brand ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-between bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-12 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-600 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-3 mb-16">
            <Image src="/precise-govcon-logo.jpg" alt="PreciseGovCon" width={44} height={44} className="rounded-lg" />
            <div>
              <span className="text-white font-bold text-xl">PRECISE</span>
              <span className="text-orange-500 font-bold text-xl">GOVCON</span>
            </div>
          </Link>

          <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
            Find. Qualify.<br />
            <span className="text-orange-500">Win.</span>
          </h1>
          <p className="text-slate-300 text-lg mb-12 max-w-md">
            Your trusted partner in government contracting success. Access live federal, state &amp; local opportunities built for small businesses.
          </p>

          <div className="space-y-4">
            {[
              { icon: '🔍', text: '987+ live SAM.gov opportunities updated daily' },
              { icon: '🔔', text: 'Instant alerts for your NAICS codes and agencies' },
              { icon: '📊', text: 'Advanced analytics and competitor tracking' },
              { icon: '🏆', text: 'Built for minority-owned and veteran-owned businesses' },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-slate-300">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">$2.4B+</div>
            <div className="text-slate-400 text-sm">Contract Value</div>
          </div>
          <div className="w-px h-10 bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">15+</div>
            <div className="text-slate-400 text-sm">Years Experience</div>
          </div>
          <div className="w-px h-10 bg-slate-700" />
          <div className="text-center">
            <div className="text-2xl font-bold text-white">98%</div>
            <div className="text-slate-400 text-sm">Client Retention</div>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex flex-col justify-center items-center px-6 py-12 bg-slate-900 min-h-screen">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/precise-govcon-logo.jpg" alt="PreciseGovCon" width={40} height={40} className="rounded-lg" />
            <div>
              <span className="text-white font-bold text-lg">PRECISE</span>
              <span className="text-orange-500 font-bold text-lg">GOVCON</span>
            </div>
          </Link>
        </div>

        <div className="w-full max-w-md">

          {/* ── LOGIN FORM ── */}
          {mode === 'login' && (
            <>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back</h2>
              <p className="text-slate-400 mb-8">Sign in to your PreciseGovCon account</p>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                  {errorMsg}
                </div>
              )}

              {/* OAuth buttons */}
              <div className="space-y-3 mb-6">
                <button
                  onClick={() => signIn('google', { callbackUrl })}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>
                <button
                  onClick={() => signIn('azure-ad', { callbackUrl })}
                  className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M11.5 3L3 8.5V15.5L11.5 21L20 15.5V8.5L11.5 3Z" fill="#0078D4"/>
                    <path d="M11.5 3L3 8.5L11.5 14L20 8.5L11.5 3Z" fill="#50E6FF" opacity="0.8"/>
                  </svg>
                  Continue with Microsoft
                </button>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-slate-700" />
                <span className="text-slate-500 text-sm">or sign in with email</span>
                <div className="flex-1 h-px bg-slate-700" />
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-1.5">
                    <label className="text-sm font-medium text-slate-300">Password</label>
                    <button type="button" onClick={() => setMode('forgot')} className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
                >
                  {loading ? 'Signing in…' : 'Sign In'}
                </button>
              </form>

              <p className="mt-6 text-center text-slate-400 text-sm">
                No account?{' '}
                <Link href="/signup" className="text-orange-400 hover:text-orange-300 font-medium transition-colors">
                  Create one free →
                </Link>
              </p>
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === 'forgot' && (
            <>
              <button onClick={() => setMode('login')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors text-sm">
                ← Back to sign in
              </button>
              <h2 className="text-2xl font-bold text-white mb-1">Reset your password</h2>
              <p className="text-slate-400 mb-8">We'll email you a secure reset link.</p>

              {errorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{errorMsg}</div>
              )}

              <form onSubmit={handleForgot} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                    className="w-full px-4 py-3 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-60 text-white font-semibold transition-colors"
                >
                  {loading ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          {/* ── VERIFY (post-forgot) ── */}
          {mode === 'verify' && (
            <>
              <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-6 mx-auto">
                <span className="text-3xl">✉️</span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 text-center">Check your inbox</h2>
              <p className="text-slate-400 text-center mb-8">{message || `We sent a reset link to ${email}`}</p>
              <button onClick={() => setMode('login')} className="w-full py-3 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 font-medium transition-colors">
                ← Back to sign in
              </button>
            </>
          )}

        </div>

        <p className="mt-8 text-slate-600 text-xs text-center">
          © 2026 PreciseGovCon ·{' '}
          <Link href="/privacy" className="hover:text-slate-400">Privacy</Link>
          {' · '}
          <Link href="/support" className="hover:text-slate-400">Support</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
  