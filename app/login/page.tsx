// app/login/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Zap, Bell, TrendingUp, Shield } from 'lucide-react'

const STATS = [
  { value: '979+',   label: 'Live Opportunities' },
  { value: '$2.4B+', label: 'Contract Value' },
  { value: '98%',    label: 'SAM Success Rate' },
  { value: '500+',   label: 'Businesses Served' },
]

const FEATURES = [
  { icon: Zap,        color: 'text-orange-400 bg-orange-500/20',   text: 'Real-time SAM.gov opportunities updated daily' },
  { icon: Bell,       color: 'text-cyan-400 bg-cyan-500/20',       text: 'Instant alerts for your NAICS codes & agencies' },
  { icon: TrendingUp, color: 'text-emerald-400 bg-emerald-500/20', text: 'AI-powered bid scoring & competitor analysis' },
  { icon: Shield,     color: 'text-violet-400 bg-violet-500/20',   text: 'Built for minority-owned & veteran-owned businesses' },
]

function SignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(emailParam)
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn('credentials', { email, password, redirect: false })
    if (result?.error) {
      setError('Invalid email or password. Please try again.')
      setLoading(false)
    } else {
      router.push(callbackUrl)
      router.refresh()
    }
  }

  async function handleOAuth(provider: 'google' | 'azure-ad') {
    setLoading(true)
    await signIn(provider, { callbackUrl })
  }

  return (
    // CRITICAL: Use w-full to match header/footer width exactly
    // The parent layout should NOT constrain this with max-width
    <div className="w-full flex-1 flex min-h-0">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex w-1/2 flex-col bg-gradient-to-br from-[#0a1628] via-[#0d1d33] to-[#0a1628] relative overflow-hidden">

        <div className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-3xl pointer-events-none translate-x-1/2" />
        <div className="absolute -bottom-40 left-1/4 w-[400px] h-[400px] bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Center content vertically and horizontally */}
        <div className="relative z-10 flex flex-col items-center justify-center h-full w-full px-12 xl:px-20">
          <div className="w-full max-w-xl">

            {/* Live badge */}
            <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-400/40 rounded-full px-4 py-1.5 mb-6">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse block shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
              <span className="text-orange-300 text-sm font-semibold tracking-wide">979 Live Federal Opportunities</span>
            </div>

            {/* Main headline */}
            <h2 className="text-5xl xl:text-6xl font-black text-white leading-[1.05] mb-5">
              Find. Qualify.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">Win Federal</span><br />
              Contracts.
            </h2>

            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-lg">
              Your complete platform for government contracting success — real-time data, AI-powered search, and expert support in one place.
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
              {FEATURES.map(({ icon: Icon, color, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color} border border-white/10`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-base text-white/80 font-medium">{text}</span>
                </div>
              ))}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-3 w-full">
              {STATS.map(({ value, label }) => (
                <div key={label} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-4 text-center hover:bg-white/15 transition-colors">
                  <div className="text-2xl xl:text-3xl font-black text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.4)]">{value}</div>
                  <div className="text-[11px] text-white/50 uppercase tracking-wider mt-1 leading-tight font-semibold">{label}</div>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-gradient-to-br from-slate-50 to-white relative">

        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #0C1B2A 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />

        {/* Mobile logo */}
        <div className="lg:hidden px-6 pt-6 pb-2 relative z-10">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="PreciseGovCon" width={40} height={40} className="rounded-xl" />
            <span className="text-lg font-black text-[#0C1B2A]">
              PRECISE <span className="text-orange-500">GOVCON</span>
            </span>
          </Link>
        </div>

        {/* Center form */}
        <div className="flex-1 flex items-center justify-center w-full px-12 xl:px-20 relative z-10">
          <div className="w-full max-w-md">

            <div className="mb-6 text-center lg:text-left">
              <h1 className="text-3xl xl:text-4xl font-black text-[#0C1B2A] tracking-tight mb-2">Welcome back</h1>
              <p className="text-base text-slate-500">Sign in to your contractor dashboard</p>
            </div>

            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-4">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </div>
            )}

            {/* OAuth buttons */}
            <div className="space-y-3 mb-6">
              <button type="button" onClick={() => handleOAuth('google')} disabled={loading}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-slate-200 bg-white text-[15px] font-semibold text-slate-700 hover:border-orange-300 hover:bg-orange-50/50 transition-all disabled:opacity-50 shadow-md hover:shadow-lg">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button type="button" onClick={() => handleOAuth('azure-ad')} disabled={loading}
                className="w-full flex items-center justify-center gap-3 h-12 rounded-xl border-2 border-slate-200 bg-white text-[15px] font-semibold text-slate-700 hover:border-cyan-300 hover:bg-cyan-50/50 transition-all disabled:opacity-50 shadow-md hover:shadow-lg">
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 21 21">
                  <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                  <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                  <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                  <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                </svg>
                Continue with Microsoft
              </button>
            </div>

            {/* Divider */}
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-300" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-xs font-bold text-slate-400 uppercase tracking-wider">or sign in with email</span>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5 uppercase tracking-wider">Email Address</label>
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com" required
                  className="w-full h-12 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Password</label>
                  <Link href="/forgot-password" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="w-full h-12 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 pr-12 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white text-[15px] font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 mt-1">
                {loading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><span>Sign In</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>

            {/* Sign-up CTA */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-center">
              <p className="text-[15px] text-slate-600">
                No account?{' '}
                <Link href="/signup" className="font-bold text-orange-500 hover:text-orange-600 transition-colors">
                  Start your 7-day free trial →
                </Link>
              </p>
              <p className="text-xs text-slate-400 mt-1">No credit card required · Cancel anytime</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="w-full flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}