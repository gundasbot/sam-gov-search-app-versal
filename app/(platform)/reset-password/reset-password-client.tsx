'use client'

export const dynamic = 'force-dynamic';


import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle, XCircle, Lock, Loader2 } from 'lucide-react'
import Link from 'next/link'

type PasswordRule = {
  label: string
  test: (password: string) => boolean
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 10 characters', test: (p) => p.length >= 10 },
  { label: 'Contains uppercase letter', test: (p) => /[A-Z]/.test(p) },
  { label: 'Contains lowercase letter', test: (p) => /[a-z]/.test(p) },
  { label: 'Contains number', test: (p) => /[0-9]/.test(p) },
  { label: 'Contains special character', test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export default function ResetPasswordClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [token, setToken] = useState<string>('')
  const [isTokenValidated, setIsTokenValidated] = useState(false)

  useEffect(() => {
    const extractedToken = searchParams?.get('token') ?? ''
    setToken(extractedToken)
    setIsTokenValidated(true)
  }, [searchParams])

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isTokenValidated && !token) {
      setError('Invalid or missing reset token')
    }
  }, [token, isTokenValidated])

  const allRulesPassed = PASSWORD_RULES.every((rule) => rule.test(password))
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!allRulesPassed) {
      setError('Please meet all password requirements')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      // ✅ FIX: use your existing route (you previously used /api/reset-password)
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error((data as any)?.error || 'Failed to reset password')
      }

      setSuccess(true)

      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (err: any) {
      setError(err?.message || 'An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isTokenValidated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
          <span className="text-white">Validating reset link...</span>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Invalid Link</h1>
          <p className="text-slate-300 mb-6">This password reset link is invalid or has expired.</p>
          <Link
            href="/forgot-password"
            className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all"
          >
            Request New Link
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">Password Reset Successful!</h1>
          <p className="text-slate-300 mb-6">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <p className="text-slate-400 text-sm">Redirecting to sign in...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Password</h1>
          <p className="text-slate-400">Enter a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-colors"
                placeholder="Enter new password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {password && (
            <div className="bg-slate-700 border border-slate-500 rounded-xl p-4">
              <p className="text-sm font-medium text-slate-300 mb-3">Password Requirements:</p>
              <div className="space-y-2">
                {PASSWORD_RULES.map((rule, index) => {
                  const passed = rule.test(password)
                  return (
                    <div key={index} className="flex items-center gap-2">
                      <span className={`text-xs ${passed ? 'text-emerald-400' : 'text-slate-400'}`}>
                        {passed ? '✓' : '•'} {rule.label}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-slate-700 border border-slate-500 rounded-xl text-white placeholder-slate-300 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 transition-colors"
                placeholder="Re-enter new password"
                required
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {confirmPassword.length > 0 && (
              <p className={`mt-2 text-xs ${passwordsMatch ? 'text-emerald-400' : 'text-red-400'}`}>
                {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
              </p>
            )}
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !allRulesPassed || !passwordsMatch}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2 justify-center">
                <Loader2 className="w-5 h-5 animate-spin" />
                Resetting...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
