// app/verify-success/VerifySuccessClient.tsx
'use client'

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
          // Redirect to root login page (not /login)
          router.push('/?mode=login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50 px-4">
      <div className="max-w-md w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-6">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
              <div className="relative bg-green-500 rounded-full p-4">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Email Verified! ✓
            </h1>
            <p className="text-lg text-gray-600">
              Hi {userName}, your email has been verified successfully!
            </p>
            {userEmail && (
              <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                <Mail className="w-4 h-4" />
                <span>{userEmail}</span>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-800 text-sm font-medium">
              You're all set! Please sign in to access your account.
            </p>
          </div>

          {/* Security Notice */}
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>🔒</span>
            <span>Your account is secure and ready to use</span>
          </div>

          {/* Redirect Info */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-center gap-2 text-gray-600 mb-4">
              <Loader2 className="w-4 h-4 animate-spin" />
              <p className="text-sm">
                Redirecting to login in <span className="font-bold text-green-600">{countdown}</span> seconds...
              </p>
            </div>

            {/* Manual Login Button */}
            <Link
              href="/?mode=login"
              className="inline-flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Go to Login Now
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Having trouble signing in?{' '}
          <Link href="/support" className="text-green-600 hover:text-green-700 font-medium">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}
