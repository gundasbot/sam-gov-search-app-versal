// CustomSignupModal.tsx
'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Eye, EyeOff, Loader2, CheckCircle2, Shield, Zap, Crown, Mail, ArrowRight, CheckCircle } from 'lucide-react'

interface CustomSignupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

type PlanTier = 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'

const font = 'Aptos, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

// ── Resend verification button (used on success screen) ───────────────────────
function ResendVerificationButton({ email, font }: { email: string; font: string }) {
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)

  const handleResend = async () => {
    setBusy(true)
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {}
    setBusy(false)
  }

  if (sent) {
    return (
      <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#065f46', textAlign: 'center', margin: '0 0 0.75rem', fontFamily: font }}>
        ✓ Verification email resent! Check your inbox.
      </p>
    )
  }

  return (
    <button
      onClick={handleResend}
      disabled={busy}
      style={{
        width: '100%', padding: '0.875rem',
        background: busy ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)',
        color: '#ffffff', border: 'none', borderRadius: '0.75rem',
        fontSize: '1rem', fontWeight: 700, cursor: busy ? 'not-allowed' : 'pointer',
        fontFamily: font, marginBottom: '0.75rem',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
        boxShadow: busy ? 'none' : '0 4px 12px rgba(16,185,129,0.3)',
      }}
    >
      {busy ? <><Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> Sending…</> : '↺ Resend Verification Email'}
    </button>
  )
}

export default function CustomSignupModal({ isOpen, onClose, onSuccess }: CustomSignupModalProps) {
  const router = useRouter()
  const { status } = useSession()
  const [googleLoading, setGoogleLoading] = useState(false)
  const [googleError, setGoogleError] = useState('')
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    password: '',
    confirmPassword: '',
  })
  const [selectedTier, setSelectedTier] = useState<PlanTier>('PROFESSIONAL')
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [signupComplete, setSignupComplete] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [passwordStrength, setPasswordStrength] = useState(0)

  if (!isOpen) return null

  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (digits.length === 0) return ''
    if (digits.length <= 3) return `(${digits}`
    if (digits.length <= 6) return `(${digits.slice(0,3)}) ${digits.slice(3)}`
    if (digits.length <= 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`
    if (digits.length === 11 && digits[0] === '1')
      return `+1 (${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`
    return raw
  }

  function validatePhone(val: string): string {
    if (!val) return ''
    const digits = val.replace(/\D/g, '')
    if (digits.length > 0 && digits.length < 10) return 'Enter a valid 10-digit phone number'
    return ''
  }

  function calcPasswordStrength(pw: string): number {
    if (!pw) return 0
    let score = 0
    if (pw.length >= 8) score++
    if (pw.length >= 12) score++
    if (/[A-Z]/.test(pw)) score++
    if (/[0-9]/.test(pw)) score++
    if (/[^A-Za-z0-9]/.test(pw)) score++
    return Math.min(score, 4)
  }

  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981']

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true)
    setGoogleError('')
    try {
      await signIn('google', { callbackUrl: '/search', redirect: true })
      onSuccess?.()
    } catch (err: any) {
      setGoogleError('Failed to sign in with Google. Please try again.')
      setGoogleLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const phoneErr = validatePhone(formData.phone)
    if (phoneErr) { setError(phoneErr); setLoading(false); return }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return }
    if (!/[A-Z]/.test(formData.password)) { setError('Password must contain at least one uppercase letter'); setLoading(false); return }
    if (!/[0-9]/.test(formData.password)) { setError('Password must contain at least one number'); setLoading(false); return }
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match'); setLoading(false); return }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email.toLowerCase().trim(),
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          password: formData.password,
          selectedPlanTier: selectedTier,
          selectedBillingInterval: billingInterval,
        }),
      })

      const data = await response.json()

      if (response.status === 409) {
        setError('An account with this email already exists. Please sign in.')
        setLoading(false)
        return
      }

      // Test-domain restriction in dev/staging
      if (data?.errorCode === 'TEST_DOMAIN_RESTRICTION') {
        setError(data.error || 'Verification email could not be sent in test mode. Please contact support.')
        setLoading(false)
        return
      }

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Signup failed. Please try again.')
      }

      // Success — show the check-your-email screen
      setSignupEmail(formData.email.toLowerCase().trim())
      setSignupComplete(true)
      onSuccess?.()

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const plans = {
    BASIC: {
      name: 'Basic', icon: Shield,
      description: 'Essential features to search and track opportunities.',
      monthly: 24.99, annual: 240.00,
      bgColor: '#06b6d4', popular: false,
      features: ['Search opportunities', 'Basic filters (NAICS, keywords)', 'Save up to 10 opportunities', 'Email support'],
    },
    PROFESSIONAL: {
      name: 'Professional', icon: Zap,
      description: 'Advanced tracking, alerts, and deeper analytics.',
      monthly: 49.00, annual: 490.00,
      bgColor: '#3b82f6', popular: true,
      features: ['Everything in Basic', 'Unlimited saved opportunities', 'Saved searches & alerts', 'Export results (CSV)', 'Priority support'],
    },
    ENTERPRISE: {
      name: 'Enterprise', icon: Crown,
      description: 'Team features, admin controls, and maximum automation.',
      monthly: 199.00, annual: 1990.00,
      bgColor: '#f59e0b', popular: false,
      features: ['Everything in Professional', 'Team accounts & roles', 'Admin portal controls', 'Advanced reporting', 'Dedicated onboarding'],
    },
  }

  const selectedPlan = plans[selectedTier]
  const savings = billingInterval === 'annual'
    ? Math.round((1 - selectedPlan.annual / (selectedPlan.monthly * 12)) * 100) : 0
  const annualSavings = billingInterval === 'annual'
    ? ((selectedPlan.monthly * 12) - selectedPlan.annual).toFixed(2) : 0

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.75rem',
    border: '2px solid #e2e8f0', borderRadius: '0.5rem',
    fontSize: '0.9375rem', outline: 'none',
    color: '#1e293b', fontWeight: 500, fontFamily: font,
    transition: 'border-color 0.2s', background: '#ffffff',
    boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: '0.875rem', fontWeight: 700,
    color: '#1e293b', marginBottom: '0.375rem', fontFamily: font,
  }

  // ── SUCCESS SCREEN ────────────────────────────────────────────────────────
  if (signupComplete) {
    return (
      <>
        <div onClick={onClose} style={{ position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.65)', zIndex: 9998, backdropFilter: 'blur(4px)' }} />
        <div style={{ position: 'fixed', inset: '0', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: '520px',
            background: '#ffffff', borderRadius: '1.5rem',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            animation: 'slideUp 0.3s ease-out', fontFamily: font, overflow: 'hidden',
          }}>
            {/* Green header */}
            <div style={{ background: 'linear-gradient(135deg, #059669, #047857)', padding: '2.25rem 2rem 1.75rem', textAlign: 'center' }}>
              <div style={{ width: '68px', height: '68px', background: 'rgba(255,255,255,0.2)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Mail style={{ width: '32px', height: '32px', color: '#ffffff' }} />
              </div>
              <h2 style={{ fontSize: '1.625rem', fontWeight: 800, color: '#ffffff', margin: '0 0 0.5rem', fontFamily: font }}>Check Your Email!</h2>
              <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 0.625rem', fontFamily: font }}>We sent a verification link to:</p>
              <p style={{ fontSize: '1.0625rem', fontWeight: 700, color: '#ffffff', margin: 0, background: 'rgba(255,255,255,0.15)', padding: '0.5rem 1rem', borderRadius: '0.5rem', display: 'inline-block', fontFamily: font, wordBreak: 'break-all' }}>
                {signupEmail}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '1.75rem 2rem' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: '0 0 0.875rem', fontFamily: font }}>What happens next:</p>
              {[
                'Open the email from Precise GovCon',
                'Click "Verify Email & Start Trial"',
                'Your 7-day free trial activates instantly',
                'You\'re automatically signed in & taken to search',
              ].map((text, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.625rem 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ width: '28px', height: '28px', flexShrink: 0, background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8125rem', fontWeight: 800, color: '#ffffff', fontFamily: font }}>
                    {i + 1}
                  </div>
                  <span style={{ fontSize: '0.9375rem', color: '#374151', fontFamily: font, fontWeight: 500 }}>{text}</span>
                </div>
              ))}

              {/* Plan badge */}
              <div style={{ marginTop: '1.25rem', marginBottom: '1.25rem', padding: '0.875rem 1rem', background: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <CheckCircle style={{ width: '20px', height: '20px', color: '#059669', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#065f46', margin: 0, fontFamily: font }}>{selectedPlan.name} Plan · 7-Day Free Trial</p>
                  <p style={{ fontSize: '0.8125rem', color: '#047857', margin: 0, fontFamily: font }}>No credit card required · Cancel anytime</p>
                </div>
              </div>

              <p style={{ fontSize: '0.8125rem', color: '#94a3b8', textAlign: 'center', margin: '0 0 0.75rem', fontFamily: font }}>
                Didn't receive it? Check your spam folder or{' '}
                <button onClick={() => { setSignupComplete(false); setError('') }} style={{ background: 'none', border: 'none', color: '#059669', cursor: 'pointer', fontWeight: 700, fontSize: '0.8125rem', fontFamily: font, padding: 0, textDecoration: 'underline' }}>
                  try a different email
                </button>
              </p>

              {/* Resend button */}
              <ResendVerificationButton email={signupEmail} font={font} />

              {/* Close */}
              <button onClick={onClose} style={{ width: '100%', padding: '0.875rem', background: 'transparent', color: '#64748b', border: '2px solid #e2e8f0', borderRadius: '0.75rem', fontSize: '1rem', fontWeight: 700, cursor: 'pointer', fontFamily: font }}>
                Close Window
              </button>
            </div>
          </div>
        </div>
        <style>{`
          @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
          @keyframes spin    { to { transform: rotate(360deg); } }
        `}</style>
      </>
    )
  }

  // ── SIGNUP FORM ───────────────────────────────────────────────────────────
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: '0', background: 'rgba(0,0,0,0.6)', zIndex: 9998, backdropFilter: 'blur(4px)', animation: 'fadeIn 0.2s ease-out' }} />

      <div style={{ position: 'fixed', inset: '0', zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '1rem', overflowY: 'auto' }}>
        <div onClick={(e) => e.stopPropagation()} style={{
          width: '100%', maxWidth: '900px',
          background: 'linear-gradient(to bottom, #ffffff, #f8fafc)',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.3s ease-out',
          position: 'relative', fontFamily: font,
          margin: '1rem auto',
        }}>

          {/* Close */}
          <button onClick={onClose} style={{ position: 'absolute', top: '1rem', right: '1rem', padding: '0.5rem 1rem', borderRadius: '0.5rem', background: '#ef4444', border: 'none', color: 'white', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 700, zIndex: 10, fontFamily: font }}>
            Close
          </button>

          <div style={{ padding: '1.75rem 2rem' }}>

            {/* Header */}
            <div style={{ marginBottom: '1.25rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.625rem' }}>
                <Image src="/logo.png" alt="Precise GovCon" width={52} height={52} style={{ height: '52px', width: 'auto' }} />
              </div>
              <h2 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#1e293b', margin: '0 0 0.25rem', fontFamily: font }}>Welcome to Precise GovCon</h2>
              <p style={{ fontSize: '1rem', color: '#475569', margin: '0 0 0.75rem', fontFamily: font }}>Create your account to get started today</p>
              <div style={{ display: 'inline-block', padding: '0.625rem 1.25rem', background: 'linear-gradient(135deg, #10b981, #059669)', borderRadius: '0.75rem', boxShadow: '0 4px 12px rgba(16,185,129,0.3)' }}>
                <p style={{ fontSize: '0.9375rem', color: '#ffffff', margin: 0, fontFamily: font, fontWeight: 700 }}>🎉 Start your 7-day free trial · No credit card required</p>
              </div>
            </div>

            {/* Billing toggle */}
            <div style={{ marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '0.5rem', gap: '0.25rem' }}>
                {(['monthly', 'annual'] as const).map((interval) => (
                  <button key={interval} type="button" onClick={() => setBillingInterval(interval)} style={{ padding: '0.375rem 1.25rem', borderRadius: '0.375rem', border: 'none', background: billingInterval === interval ? 'white' : 'transparent', color: billingInterval === interval ? '#0f172a' : '#64748b', fontSize: '0.875rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: billingInterval === interval ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', fontFamily: font }}>
                    {interval === 'monthly' ? 'Monthly' : 'Annual'}
                    {interval === 'annual' && savings > 0 && <span style={{ marginLeft: '0.375rem', padding: '0.125rem 0.375rem', background: '#10b981', color: 'white', borderRadius: '0.25rem', fontSize: '0.6875rem', fontWeight: 700 }}>Save {savings}%</span>}
                  </button>
                ))}
              </div>
              {billingInterval === 'annual' && <p style={{ fontSize: '0.8125rem', color: '#059669', fontWeight: 600, margin: '0.375rem 0 0', fontFamily: font }}>🎉 Save ${annualSavings}/year with annual billing!</p>}
            </div>

            {/* Plan cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {(Object.keys(plans) as PlanTier[]).map((tier) => {
                const plan = plans[tier]
                const PlanIcon = plan.icon
                const isSelected = selectedTier === tier
                const planPrice = billingInterval === 'monthly' ? plan.monthly : plan.annual
                const planMonthlyEquiv = billingInterval === 'annual' ? (plan.annual / 12).toFixed(2) : null
                return (
                  <div key={tier} onClick={() => setSelectedTier(tier)} style={{ position: 'relative', padding: '1rem', background: plan.bgColor, borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s', transform: isSelected ? 'scale(1.03)' : 'scale(1)', boxShadow: isSelected ? `0 12px 24px -4px ${plan.bgColor}55` : '0 2px 6px rgba(0,0,0,0.1)', border: isSelected ? '3px solid rgba(255,255,255,0.7)' : '3px solid transparent', fontFamily: font }}>
                    {plan.popular && <div style={{ position: 'absolute', top: '-0.75rem', left: '50%', transform: 'translateX(-50%)', padding: '0.2rem 0.875rem', background: 'linear-gradient(to right, #10b981, #059669)', color: 'white', borderRadius: '9999px', fontSize: '0.6875rem', fontWeight: 800, boxShadow: '0 2px 8px rgba(0,0,0,0.2)', whiteSpace: 'nowrap', fontFamily: font }}>⚡ MOST POPULAR</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.2)', borderRadius: '0.4rem' }}><PlanIcon style={{ width: '1rem', height: '1rem', color: '#ffffff' }} /></div>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#ffffff', margin: 0, fontFamily: font }}>{plan.name}</h3>
                    </div>
                    <div style={{ marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1.75rem', fontWeight: 800, color: '#ffffff', fontFamily: font }}>${planPrice.toFixed(2)}</span>
                      <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.85)', marginLeft: '0.25rem', fontFamily: font }}>/{billingInterval === 'monthly' ? 'mo' : 'yr'}</span>
                      {billingInterval === 'annual' && <p style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.85)', margin: '0.125rem 0 0', fontFamily: font }}>${planMonthlyEquiv}/mo billed annually</p>}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.9)', margin: '0 0 0.5rem', fontFamily: font }}>{plan.description}</p>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                      {plan.features.map((f) => (
                        <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.375rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', fontFamily: font }}>
                          <CheckCircle2 style={{ width: '0.875rem', height: '0.875rem', color: 'rgba(255,255,255,0.9)', flexShrink: 0, marginTop: '0.1rem' }} />{f}
                        </li>
                      ))}
                    </ul>
                    {isSelected && <div style={{ marginTop: '0.625rem', padding: '0.375rem', background: 'rgba(255,255,255,0.25)', borderRadius: '0.375rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#ffffff', fontFamily: font }}>✓ SELECTED</div>}
                  </div>
                )
              })}
            </div>

            {/* Form area */}
            <div style={{ maxWidth: '680px', margin: '0 auto' }}>

              {/* Google OAuth */}
              <div style={{ marginBottom: '1.25rem' }}>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={googleLoading}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.625rem',
                    padding: '0.875rem 1rem',
                    border: '2px solid #e2e8f0', borderRadius: '0.75rem',
                    background: googleLoading ? '#f8fafc' : '#ffffff',
                    color: '#1e293b', cursor: googleLoading ? 'not-allowed' : 'pointer',
                    fontSize: '1rem', fontWeight: 700, fontFamily: font,
                    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                    transition: 'all 0.2s',
                    opacity: googleLoading ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => { if (!googleLoading) e.currentTarget.style.borderColor = '#94a3b8' }}
                  onMouseLeave={(e) => { if (!googleLoading) e.currentTarget.style.borderColor = '#e2e8f0' }}
                >
                  {googleLoading ? (
                    <Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite', color: '#64748b' }} />
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  {googleLoading ? 'Redirecting to Google…' : 'Continue with Google'}
                </button>

                {googleError && (
                  <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#ef4444', fontWeight: 600, fontFamily: font, textAlign: 'center' }}>
                    ⚠️ {googleError}
                  </p>
                )}

                {/* OR divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1.125rem' }}>
                  <div style={{ flex: 1, height: '2px', background: '#e2e8f0', borderRadius: '1px' }} />
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#94a3b8', fontFamily: font, whiteSpace: 'nowrap' }}>
                    OR SIGN UP WITH EMAIL
                  </span>
                  <div style={{ flex: 1, height: '2px', background: '#e2e8f0', borderRadius: '1px' }} />
                </div>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>First Name *</label>
                    <input type="text" value={formData.firstName} required placeholder="John" onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'} />
                  </div>
                  <div>
                    <label style={labelStyle}>Last Name *</label>
                    <input type="text" value={formData.lastName} required placeholder="Doe" onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'} />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Email *</label>
                  <input type="email" value={formData.email} required placeholder="john@company.com" onChange={(e) => setFormData({ ...formData, email: e.target.value })} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Phone</label>
                    <input type="tel" value={formData.phone} placeholder="(555) 123-4567"
                      onChange={(e) => {
                        const formatted = formatPhone(e.target.value)
                        setFormData({ ...formData, phone: formatted })
                        setPhoneError(validatePhone(formatted))
                      }}
                      style={{ ...inputStyle, borderColor: phoneError ? '#ef4444' : '#e2e8f0' }}
                      onFocus={(e) => e.currentTarget.style.borderColor = phoneError ? '#ef4444' : '#3b82f6'}
                      onBlur={(e) => e.currentTarget.style.borderColor = phoneError ? '#ef4444' : '#e2e8f0'}
                    />
                    {phoneError && <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#ef4444', fontFamily: font, fontWeight: 600 }}>⚠ {phoneError}</p>}
                  </div>
                  <div>
                    <label style={labelStyle}>Company</label>
                    <input type="text" value={formData.company} placeholder="Your Company Inc." onChange={(e) => setFormData({ ...formData, company: e.target.value })} style={inputStyle} onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label style={labelStyle}>Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} value={formData.password} required placeholder="Min 8 chars, 1 uppercase, 1 number"
                        onChange={(e) => { setFormData({ ...formData, password: e.target.value }); setPasswordStrength(calcPasswordStrength(e.target.value)) }}
                        style={{ ...inputStyle, paddingRight: '2.75rem' }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}>
                        {showPassword ? <EyeOff style={{ width: '1.125rem', height: '1.125rem' }} /> : <Eye style={{ width: '1.125rem', height: '1.125rem' }} />}
                      </button>
                    </div>
                    {formData.password && (
                      <div style={{ marginTop: '0.375rem' }}>
                        <div style={{ display: 'flex', gap: '3px', marginBottom: '0.25rem' }}>
                          {[1,2,3,4].map(i => (
                            <div key={i} style={{ flex: 1, height: '4px', borderRadius: '2px', background: i <= passwordStrength ? strengthColor[passwordStrength] : '#e2e8f0', transition: 'background 0.2s' }} />
                          ))}
                        </div>
                        <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: strengthColor[passwordStrength], fontFamily: font }}>
                          {strengthLabel[passwordStrength]}
                          {passwordStrength < 3 && ' — add uppercase, numbers & symbols'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={labelStyle}>Confirm Password *</label>
                    <div style={{ position: 'relative' }}>
                      <input type={showConfirmPassword ? 'text' : 'password'} value={formData.confirmPassword} required placeholder="Re-enter password" onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} style={{ ...inputStyle, paddingRight: '2.75rem' }} onFocus={(e) => e.currentTarget.style.borderColor = '#3b82f6'} onBlur={(e) => e.currentTarget.style.borderColor = '#e2e8f0'} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: '0.25rem' }}>
                        {showConfirmPassword ? <EyeOff style={{ width: '1.125rem', height: '1.125rem' }} /> : <Eye style={{ width: '1.125rem', height: '1.125rem' }} />}
                      </button>
                    </div>
                  </div>
                </div>

                {error && (
                  <div style={{ padding: '0.875rem 1rem', background: '#fee2e2', border: '2px solid #fca5a5', borderRadius: '0.5rem', color: '#991b1b', fontSize: '0.9375rem', fontFamily: font, fontWeight: 600 }}>
                    ⚠️ {error}
                  </div>
                )}

                <button type="submit" disabled={loading} style={{ width: '100%', padding: '1rem', background: loading ? '#94a3b8' : 'linear-gradient(135deg, #10b981, #059669)', color: 'white', border: 'none', borderRadius: '0.75rem', fontSize: '1.0625rem', fontWeight: 800, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontFamily: font, boxShadow: loading ? 'none' : '0 4px 14px rgba(16,185,129,0.35)', transition: 'all 0.2s' }}>
                  {loading ? <><Loader2 style={{ width: '1.25rem', height: '1.25rem', animation: 'spin 1s linear infinite' }} />Creating your account…</> : <>🚀 Start Free Trial</>}
                </button>

                <p style={{ fontSize: '0.9375rem', color: '#f97316', textAlign: 'center', margin: 0, fontFamily: font, fontWeight: 600 }}>
                  By signing up, you agree to our{' '}
                  <a href="/terms" style={{ color: '#ea580c', textDecoration: 'underline', fontWeight: 700 }}>Terms of Service</a>
                  {' '}and{' '}
                  <a href="/privacy" style={{ color: '#ea580c', textDecoration: 'underline', fontWeight: 700 }}>Privacy Policy</a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity:0; transform:translateY(20px) scale(0.97); } to { opacity:1; transform:translateY(0) scale(1); } }
        @keyframes spin    { to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}