'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type VerifyResult = {
  ok?: boolean
  email?: string
  needsPasswordSetup?: boolean
  activationEmailSent?: boolean
  activationEmailPending?: boolean
}

export default function SuccessClient() {
  const router = useRouter()
  const sp = useSearchParams()
  const sessionId = sp?.get('session_id') ?? null

  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function verify() {
      if (!sessionId) return
      setVerifyLoading(true)
      setVerifyError(null)

      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${encodeURIComponent(sessionId)}`, {
          cache: 'no-store',
        })
        const data = await res.json().catch(() => ({}))
        if (!cancelled) {
          if (!res.ok) {
            setVerifyError(typeof data?.error === 'string' ? data.error : 'Unable to verify checkout session.')
          } else {
            setVerifyResult(data as VerifyResult)
          }
        }
      } catch (err: any) {
        if (!cancelled) setVerifyError(err?.message || 'Unable to verify checkout session.')
      } finally {
        if (!cancelled) setVerifyLoading(false)
      }
    }

    verify()
    return () => { cancelled = true }
  }, [sessionId])

  const onboardingMessage = useMemo(() => {
    if (verifyLoading) return 'Finalizing your account setup...'
    if (verifyError) return verifyError
    if (!verifyResult) return null

    if (verifyResult.needsPasswordSetup) {
      if (verifyResult.activationEmailSent) {
        return `We emailed ${verifyResult.email || 'your inbox'} with a secure link to set your password and complete your profile.`
      }
      if (verifyResult.activationEmailPending) {
        return `A setup email is already pending for ${verifyResult.email || 'your inbox'}. Please check inbox/spam for your activation link.`
      }
      return 'Your account needs one final step: set a password from the email we send after checkout.'
    }

    return 'Your account is active. You can continue in your account dashboard.'
  }, [verifyLoading, verifyError, verifyResult])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 px-6 py-10">
      <div className="max-w-3xl mx-auto">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-8">
          <h1 className="text-3xl font-black mb-3 text-slate-900">Payment successful</h1>

          <p className="text-slate-700 text-base leading-relaxed">
            Thanks — your checkout is complete.
          </p>

          {onboardingMessage && (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {onboardingMessage}
            </div>
          )}

          {!!sessionId && (
            <p className="mt-3 text-xs text-slate-500 break-all">
              Session: {sessionId}
            </p>
          )}

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              onClick={() => router.push('/account?tab=profile')}
            >
              Go to Account
            </button>
            <button
              className="px-5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-700 text-white font-semibold"
              onClick={() => router.push('/search')}
            >
              Back to Search
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

