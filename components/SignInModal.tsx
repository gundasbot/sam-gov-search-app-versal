'use client'

import { useState, useCallback } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react'

type SignInModalProps = {
  isOpen: boolean
  onClose: () => void
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Use useCallback to prevent unnecessary re-renders
  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (error) setError('') // Clear error when user types
  }, [error])

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (error) setError('') // Clear error when user types
  }, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return // Prevent double submission
    
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
        setIsLoading(false)
      } else {
        // Success - close modal and redirect
        onClose()
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
      setIsLoading(false)
    }
  }

  // Close on escape key
  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && !isLoading) {
      onClose()
    }
  }, [isLoading, onClose])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        // Close when clicking outside modal
        if (e.target === e.currentTarget && !isLoading) {
          onClose()
        }
      }}
    >
      {/* Modal */}
      <div className="relative w-full max-w-md bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="p-8 pb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400">Sign in to access your dashboard</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-6">
          {/* Email Field */}
          <div>
            <label htmlFor="email-input" className="block text-sm font-medium text-slate-300 mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                id="email-input"
                type="email"
                value={email}
                onChange={handleEmailChange}
                required
                disabled={isLoading}
                autoComplete="email"
                className="w-full pl-12 pr-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all disabled:opacity-50"
                placeholder="you@company.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password-input" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <input
                id="password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                required
                disabled={isLoading}
                autoComplete="current-password"
                className="w-full pl-12 pr-12 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 transition-all disabled:opacity-50"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
                tabIndex={-1}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                disabled={isLoading}
                className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-500 focus:ring-2 focus:ring-teal-500/50 disabled:opacity-50"
              />
              <span className="text-slate-300">Remember me</span>
            </label>
            <a
              href="/reset-request"
              className="text-teal-400 hover:text-teal-300 transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm animate-in fade-in duration-200">
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            className="w-full py-3 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl shadow-lg hover:shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-slate-800 text-slate-400">
                Don't have an account?
              </span>
            </div>
          </div>

          {/* Request Access Button */}
          <button
            type="button"
            onClick={() => {
              onClose()
              router.push('/request-access')
            }}
            disabled={isLoading}
            className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all disabled:opacity-50"
          >
            Request Access
          </button>
        </form>
      </div>
    </div>
  )
}
