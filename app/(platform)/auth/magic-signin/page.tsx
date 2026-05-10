// app/auth/magic-signin/page.tsx
// Auto-completes sign-in when user clicks magic link from email
'use client'

import { useEffect, useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

function MagicSignInContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const email = searchParams.get('email')
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Signing you in...')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid sign-in link.')
      return
    }

    async function doSignIn() {
      try {
        const result = await signIn('credentials', {
          autoLoginToken: token,
          redirect: false,
        })

        if (result?.ok) {
          setStatus('success')
          setMessage('Signed in! Redirecting...')
          setTimeout(() => router.push('/dashboard'), 1000)
        } else {
          setStatus('error')
          setMessage('This link has expired or already been used. Please request a new one.')
        }
      } catch {
        setStatus('error')
        setMessage('Something went wrong. Please try signing in again.')
      }
    }

    doSignIn()
  }, [token, router])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
      <div className="rounded-2xl p-10 text-center max-w-md w-full mx-4 shadow-xl"
        style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-border)' }}>

        {/* Logo */}
        <div className="inline-block rounded-xl px-5 py-2.5 mb-6"
          style={{ background: '#0f172a', border: '1px solid rgba(249,115,22,0.35)' }}>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#ffffff' }}>Precise</span>
          <span style={{ fontSize: 20, fontWeight: 900, color: '#f97316' }}>GovCon</span>
        </div>

        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" style={{ color: '#f97316' }} />
            <h1 className="text-xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Signing you in
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {email ? `Signing in as ${email}...` : 'Please wait...'}
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto mb-4" style={{ color: '#16a34a' }} />
            <h1 className="text-xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>
              You're signed in!
            </h1>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Redirecting to your dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 mx-auto mb-4" style={{ color: '#dc2626' }} />
            <h1 className="text-xl font-black mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Link expired
            </h1>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>
              {message}
            </p>
            <a href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-bold text-white"
              style={{ background: '#f97316' }}>
              Back to Sign In
            </a>
          </>
        )}
      </div>
    </div>
  )
}

export default function MagicSignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#f97316' }} />
      </div>
    }>
      <MagicSignInContent />
    </Suspense>
  )
}
