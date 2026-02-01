// app/verify-success/VerifySuccessClient.tsx
'use client'

export const dynamic = 'force-dynamic';


import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle, ArrowRight, Loader2, Mail } from 'lucide-react'
import Link from 'next/link'

export default function VerifySuccessClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [countdown, setCountdown] = useState(5)

  const userName = searchParams?.get('name') || 'there'
  const userEmail = searchParams?.get('email')

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/login?verified=true')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/60 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          <h1 className="text-3xl font-black text-white mb-3">
            Welcome to PreciseGovCon!
          </h1>

          <p className="text-lg text-slate-300 mb-2">
            Hi {userName}, your email has been verified successfully!
          </p>

          {userEmail && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 mb-6">
              <Mail className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-300 font-semibold">{userEmail}</span>
            </div>
          )}

          <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border-2 border-blue-500/40 rounded-2xl p-6 mb-6">
            <p className="text-base text-white font-semibold mb-3">
              You're all set! Please sign in to access your account.
            </p>
            <div className="flex items-center justify-center gap-2 text-slate-300">
              <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
              <span className="text-sm">Redirecting in {countdown} seconds...</span>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/login?verified=true"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Sign In Now
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              href="/"
              className="w-full py-3 rounded-xl border-2 border-slate-600 bg-slate-700/50 hover:bg-slate-700 text-white font-semibold transition-all flex items-center justify-center gap-2"
            >
              Go to Homepage
            </Link>
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700">
            <p className="text-xs text-slate-400">
              🔒 Your account is secure and ready to use
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
