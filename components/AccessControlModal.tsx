// components/AccessControlModal.tsx
'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  X, Shield, CheckCircle, Mail, Eye, EyeOff, Phone, Building, Loader2,
  Lock, Search, Filter, Download, BarChart3, Database, Bell, Zap,
  ArrowRight, ExternalLink, AlertCircle, Key, AlertTriangle, User,
  ArrowLeft, Sparkles, CreditCard, Calendar, Users, Target, PieChart, Globe
} from 'lucide-react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface AccessControlModalProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
  onAccessGranted?: () => void
  initialMode?: AuthMode
  redirectTo?: string
  highlightPlan?: 'basic' | 'professional' | 'enterprise'
  highlightBilling?: Billing
}

type Billing = 'monthly' | 'annual'
type PaidPlan = 'basic' | 'professional' | 'enterprise'
type PaidPlanCard = {
  key: PaidPlan
  name: string
  tagline: string
  topPrice: string
  topPeriod: string
  monthlyPrice: string
  annualPrice: string
  features: string[]
  popular: boolean
  buttonText: string
  priceId: string
  gradient: string
  accentColor: string
  textColor: string
  badgeGradient: string
}

type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'reset-password' | 'method'

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ')
}

// Proper component so hooks work correctly
function UnverifiedEmailBanner({ email }: { email: string }) {
  const [resendSent, setResendSent] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)

  const handleResend = async () => {
    setResendBusy(true)
    try {
      await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setResendSent(true)
    } catch {}
    setResendBusy(false)
  }

  return (
    <div className="mb-5 p-4 rounded-2xl border-2" style={{ background: '#fffbeb', borderColor: '#f59e0b' }}>
      <div className="flex items-start gap-3">
        <AlertCircle className="h-6 w-6 flex-shrink-0 mt-0.5" style={{ color: '#b45309' }} />
        <div>
          <p className="text-base font-black" style={{ color: '#78350f' }}>Email Not Yet Verified</p>
          <p className="text-sm font-bold mt-1 leading-relaxed" style={{ color: '#92400e' }}>
            Check your inbox for the verification link before signing in.
          </p>
          {!resendSent ? (
            <button onClick={handleResend} disabled={resendBusy}
              className="mt-2 text-sm font-black underline underline-offset-2 disabled:opacity-60"
              style={{ color: '#b45309' }}>
              {resendBusy ? 'Sending…' : 'Resend verification email →'}
            </button>
          ) : (
            <p className="mt-2 text-sm font-black" style={{ color: '#065f46' }}>✓ Sent! Check your inbox.</p>
          )}
        </div>
      </div>
    </div>
  )
}

function InputField({
  label, icon: Icon, error, ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: any; error?: string }) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />}
        <input
          {...props}
          className={cx(
            'w-full py-3 rounded-xl border text-sm font-semibold text-slate-900 placeholder-slate-400 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400',
            Icon ? 'pl-10 pr-4' : 'px-4',
            error ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300'
          )}
        />
      </div>
      {error && <p className="mt-1.5 text-sm font-black" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  )
}

function PasswordField({
  label, value, onChange, error, placeholder, disabled
}: { label: string; value: string; onChange: (v: string) => void; error?: string; placeholder?: string; disabled?: boolean }) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">{label}</label>
      <div className="relative">
        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder || '••••••••'}
          disabled={disabled}
          className={cx(
            'w-full pl-10 pr-11 py-3 rounded-xl border text-sm font-semibold text-slate-900 placeholder-slate-400 bg-white transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400',
            error ? 'border-red-300 bg-red-50' : 'border-slate-200 hover:border-slate-300'
          )}
        />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error && <p className="mt-1.5 text-sm font-black" style={{ color: '#dc2626' }}>{error}</p>}
    </div>
  )
}

export default function AccessControlModal({
  isOpen, onClose, featureName, onAccessGranted,
  redirectTo = '/search', initialMode = 'signin',
  highlightPlan, highlightBilling,
}: AccessControlModalProps) {
  const router = useRouter()
  const { status, update } = useSession()
  const redirectTarget = redirectTo || '/search'

  const [isLoading, setIsLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode)
  const [billing, setBilling] = useState<Billing>('monthly')
  const [openingPaidPlan, setOpeningPaidPlan] = useState<null | PaidPlan>(null)
  const [stripeError, setStripeError] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string>('')
  const [resetSent, setResetSent] = useState(false)
  const [signupComplete, setSignupComplete] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  const [firstNameError, setFirstNameError] = useState('')
  const [lastNameError, setLastNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // useMemo MUST be above early return (Rules of Hooks)
  const plans = useMemo((): PaidPlanCard[] => {
    const isAnnual = billing === 'annual'
    const basicMonthlyId = 'price_1SrWKwL0qhATKGOJo4ginD8u'
    const basicAnnualId = 'price_1SrWE8L0qhATKGOJovDYe1T4'
    const proMonthlyId = 'price_1SpfzWL0qhATKGOJGIiLnkhU'
    const proAnnualId = 'price_1Spg08L0qhATKGOJlgQeSrUW'
    const entMonthlyId = 'price_1Spg0aL0qhATKGOJZcXETI7D'
    const entAnnualId = 'price_1Spg1CL0qhATKGOJG9iRaIhq'
    return [
      {
        key: 'basic', name: 'Basic', tagline: 'Perfect for solo contractors',
        topPrice: isAnnual ? '$249.90' : '$24.99', topPeriod: isAnnual ? '/year' : '/month',
        monthlyPrice: '$24.99/mo', annualPrice: '$249.90/yr · save 16%',
        features: ['Unlimited opportunity searches', 'Advanced filtering (all criteria)', 'Save unlimited opportunities', 'Daily email digest alerts', 'Search history (30 days)', 'Export to CSV', 'Email support'],
        popular: false, buttonText: 'Start 7-Day Trial',
        priceId: isAnnual ? basicAnnualId : basicMonthlyId,
        gradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 60%, #bbf7d0 100%)',
        accentColor: '#059669', textColor: '#065f46',
        badgeGradient: 'linear-gradient(135deg, #10b981, #059669)',
      },
      {
        key: 'professional', name: 'Professional', tagline: 'For growing businesses',
        topPrice: isAnnual ? '$499.90' : '$49.99', topPeriod: isAnnual ? '/year' : '/month',
        monthlyPrice: '$49.99/mo', annualPrice: '$499.90/yr · save 16%',
        features: ['Everything in Basic', 'Real-time opportunity alerts', 'Advanced analytics dashboard', 'Competitor tracking', '25 custom alert criteria', 'Search history (1 year)', 'API access (1,000 calls/mo)', 'Excel export with formatting', 'Team collaboration (3 users)', 'Priority support'],
        popular: true, buttonText: 'Start 7-Day Trial',
        priceId: isAnnual ? proAnnualId : proMonthlyId,
        gradient: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
        accentColor: '#10b981', textColor: '#f1f5f9',
        badgeGradient: 'linear-gradient(135deg, #10b981, #06b6d4)',
      },
      {
        key: 'enterprise', name: 'Enterprise', tagline: 'For large prime contractors',
        topPrice: isAnnual ? '$1,999.90' : '$199.99', topPeriod: isAnnual ? '/year' : '/month',
        monthlyPrice: '$199.99/mo', annualPrice: '$1,999.90/yr · save 16%',
        features: ['Everything in Professional', 'Unlimited team members', 'Dedicated account manager', 'Custom integrations', 'Unlimited API access', 'White-label reporting', 'Custom training sessions', 'SLA guarantees (99.9%)', 'Phone & priority support', 'Historical data (5+ years)'],
        popular: false, buttonText: 'Start 7-Day Trial',
        priceId: isAnnual ? entAnnualId : entMonthlyId,
        gradient: 'linear-gradient(135deg, #fefce8 0%, #fef9c3 60%, #fef08a 100%)',
        accentColor: '#d97706', textColor: '#78350f',
        badgeGradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      },
    ]
  }, [billing])

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const resetErrors = () => {
    setFirstNameError(''); setLastNameError(''); setEmailError('')
    setPasswordError(''); setConfirmPasswordError('')
    setNewPasswordError(''); setConfirmNewPasswordError('')
    setGeneralError(''); setSuccessMessage(''); setStripeError(null)
  }

  const clearAllFields = () => {
    setFirstName(''); setLastName(''); setEmail(''); setPhone(''); setCompany('')
    setPassword(''); setConfirmPassword(''); setNewPassword(''); setConfirmNewPassword('')
    setSuccessMessage('')
  }

  const toggleAuthMode = (mode: AuthMode, preserveEmail = false) => {
    const saved = preserveEmail ? email : ''
    setAuthMode(mode); resetErrors(); clearAllFields()
    if (preserveEmail && saved) setEmail(saved)
  }

  const handleAccessGranted = () => {
    try { onClose() } catch {}
    try { onAccessGranted?.() } catch {}
    router.push(redirectTarget); router.refresh()
  }

  useEffect(() => { if (status === 'authenticated' && isOpen) handleAccessGranted() }, [status, isOpen])
  useEffect(() => { if (isOpen) { document.body.style.overflow = 'hidden'; return () => { document.body.style.overflow = '' } } }, [isOpen])
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    if (isOpen) { window.addEventListener('keydown', handleEsc); return () => window.removeEventListener('keydown', handleEsc) }
  }, [isOpen, onClose])
  useEffect(() => { if (isOpen && highlightBilling) setBilling(highlightBilling) }, [isOpen, highlightBilling])
  useEffect(() => {
    if (!isOpen) return
    setAuthMode(initialMode); resetErrors(); clearAllFields()
    setShowEmailForm(initialMode !== 'method')
    setSignupComplete(false); setSignupEmail('')
  }, [isOpen, initialMode])
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    if (token && isOpen) {
      setResetToken(token); setAuthMode('reset-password'); setShowEmailForm(true)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [isOpen])

  // EARLY RETURN - after all hooks
  if (!isOpen) return null

  const handleGoogleSignIn = async () => {
    setIsLoading(true); setAuthMethod('google'); setGeneralError(''); setStripeError(null)
    try {
      await signIn('google', { callbackUrl: redirectTarget, redirect: true })
      onClose()
    } catch (error: any) {
      setGeneralError('Failed to sign in with Google. Please try again.')
      setIsLoading(false); setAuthMethod(null)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault(); resetErrors()
    let hasError = false
    if (!firstName.trim()) { setFirstNameError('Required'); hasError = true }
    if (!lastName.trim()) { setLastNameError('Required'); hasError = true }
    if (!email.trim()) { setEmailError('Required'); hasError = true }
    else if (!validateEmail(email)) { setEmailError('Invalid email'); hasError = true }
    if (!password) { setPasswordError('Required'); hasError = true }
    else if (password.length < 8) { setPasswordError('Min 8 characters'); hasError = true }
    if (!confirmPassword) { setConfirmPasswordError('Required'); hasError = true }
    else if (password !== confirmPassword) { setConfirmPasswordError('Passwords do not match'); hasError = true }
    if (hasError) return
    setIsLoading(true); setAuthMethod('email')
    try {
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(), firstName: firstName.trim(),
          lastName: lastName.trim(), phone: phone.trim() || undefined,
          company: company.trim() || undefined, password,
          selectedPlanTier: highlightPlan?.toUpperCase() || undefined,
          selectedBillingInterval: highlightBilling || undefined,
        }),
      })
      const raw = await signupResponse.text()
      let data: any = null
      try { data = raw ? JSON.parse(raw) : null } catch { data = null }
      if (signupResponse.status === 409) {
        setGeneralError('An account with this email already exists. Please sign in.')
        setAuthMode('signin'); setConfirmPassword(''); setIsLoading(false); setAuthMethod(null); return
      }
      if (!signupResponse.ok) {
        let msg = 'Failed to create account. Please try again.'
        try { const d = raw ? JSON.parse(raw) : {}; msg = d?.error || d?.message || msg } catch {}
        throw new Error(msg)
      }
      const confirmedEmail = email.toLowerCase().trim()
      clearAllFields()
      setPassword(''); setConfirmPassword('')
      setSignupEmail(confirmedEmail)
      setSignupComplete(true)
    } catch (error: any) {
      setGeneralError(error?.message || 'Failed to create account.')
    } finally { setIsLoading(false); setAuthMethod(null) }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault(); setEmailError(''); setPasswordError(''); setGeneralError(''); setStripeError(null)
    if (!email.trim()) { setEmailError('Required'); return }
    if (!password) { setPasswordError('Required'); return }
    setIsLoading(true); setAuthMethod('email')
    try {
      const result = await signIn('credentials', { redirect: false, email: email.toLowerCase().trim(), password, callbackUrl: redirectTarget })
      if (result?.error) {
        const err = String(result.error)
        if (err.includes('CredentialsSignin') || err.includes('Invalid credentials')) setGeneralError('Incorrect email or password.')
        else if (err.includes('not verified') || err.includes('verify')) setGeneralError('__UNVERIFIED__:' + email)
        else if (err.includes('Account not found') || err.includes('No user')) setGeneralError('No account found with this email.')
        else setGeneralError(`Sign in failed. Please try again.`)
        return
      }
      if (result?.ok) {
        await update()
        setSuccessMessage('✓ Signed in! Redirecting…')
        setTimeout(() => { onClose(); router.push(redirectTarget); router.refresh() }, 900)
      }
    } catch (error: any) {
      setGeneralError('An unexpected error occurred. Please try again.')
    } finally { setIsLoading(false); setAuthMethod(null) }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault(); setEmailError(''); setGeneralError(''); setSuccessMessage('')
    if (!email.trim()) { setEmailError('Required'); return }
    if (!validateEmail(email)) { setEmailError('Invalid email'); return }
    setIsLoading(true); setAuthMethod('email')
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })
      const data = await response.json()
      if (response.ok) { setSuccessMessage('Reset link sent! Check your inbox.'); setResetSent(true) }
      else setGeneralError(data.error || 'Failed to send reset email.')
    } catch { setGeneralError('Failed to send reset email. Try again.') }
    finally { setIsLoading(false); setAuthMethod(null) }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault(); setNewPasswordError(''); setConfirmNewPasswordError(''); setGeneralError(''); setSuccessMessage('')
    let hasError = false
    if (!newPassword) { setNewPasswordError('Required'); hasError = true }
    else if (newPassword.length < 8) { setNewPasswordError('Min 8 characters'); hasError = true }
    if (!confirmNewPassword) { setConfirmNewPasswordError('Required'); hasError = true }
    else if (newPassword !== confirmNewPassword) { setConfirmNewPasswordError('Passwords do not match'); hasError = true }
    if (hasError) return
    setIsLoading(true); setAuthMethod('email')
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetToken, password: newPassword }),
      })
      const data = await response.json()
      if (response.ok) {
        setSuccessMessage('Password reset! You can now sign in.')
        setTimeout(() => { setAuthMode('signin'); setNewPassword(''); setConfirmNewPassword('') }, 2000)
      } else setGeneralError(data.error || 'Failed to reset. Try requesting a new link.')
    } catch { setGeneralError('Failed to reset password. Try again.') }
    finally { setIsLoading(false); setAuthMethod(null) }
  }

  const openStripeInNewTab = async (plan: { key: PaidPlan; priceId: string }) => {
    if (status !== 'authenticated') { setStripeError('Please sign in first to subscribe.'); return }
    setOpeningPaidPlan(plan.key)
    const newTab = window.open('', '_blank')
    if (!newTab) { setStripeError('Please allow popups for this site.'); setOpeningPaidPlan(null); return }
    try {
      newTab.document.write(`<html><head><title>Redirecting…</title></head><body style="margin:0;background:#0f172a;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center;"><div style="width:40px;height:40px;border:3px solid #10b981;border-top-color:transparent;border-radius:50%;animation:spin 0.8s linear infinite;margin:0 auto 16px"></div><p>Opening Stripe Checkout…</p><style>@keyframes spin{to{transform:rotate(360deg)}}</style></div></body></html>`)
      newTab.document.close()
    } catch {}
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId, email, tier: plan.key, billing }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); newTab.close(); setStripeError(e?.error || 'Checkout failed.'); return }
      const { url } = await res.json()
      newTab.location.href = url
    } catch (err: any) { newTab.close(); setStripeError(err?.message || 'Checkout failed.') }
    finally { setOpeningPaidPlan(null) }
  }

  const formHandler = authMode === 'signup' ? handleEmailSignUp
    : authMode === 'forgot-password' ? handleForgotPassword
    : authMode === 'reset-password' ? handlePasswordReset
    : handleSignIn

  const authTitle = authMode === 'signup' ? 'Create your account'
    : authMode === 'forgot-password' ? 'Reset your password'
    : authMode === 'reset-password' ? 'Set new password'
    : 'Welcome back'

  const authSubtitle = authMode === 'signup' ? 'Start your 7-day free trial today'
    : authMode === 'forgot-password' ? "We'll send you a secure reset link"
    : authMode === 'reset-password' ? 'Enter your new password below'
    : 'Sign in to access your dashboard'

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4" style={{ fontFamily: "'Aptos', 'Segoe UI', system-ui, sans-serif" }}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-[80vw] max-h-[92vh] overflow-y-auto rounded-3xl bg-white shadow-2xl border border-slate-100"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#e2e8f0 transparent' }}>

        {/* Top accent bar */}
        <div className="h-1.5 w-full rounded-t-3xl" style={{ background: 'linear-gradient(90deg, #10b981, #06b6d4, #10b981)' }} />

        {/* Close button */}
        <button onClick={onClose}
          className="absolute right-5 top-5 z-10 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all">
          <X className="h-4 w-4" /> Close
        </button>

        <div className="p-6 lg:p-10">
          {/* Header */}
          <div className="text-center mb-10">
            <img src="/logo.png" alt="Precise GovCon" className="h-12 w-auto mx-auto mb-5" />
            <div className="mb-3">
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#059669' }}>
                7-Day Free Trial · No Credit Card Required
              </span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-slate-900 mb-3">
              Welcome to <span className="font-black text-slate-900">PRECISE</span><span className="font-black" style={{ color: '#F97316' }}>GOVCON</span>
            </h2>
            <p className="text-xl font-black tracking-tight" style={{ color: '#ea580c' }}>
              Find, track and win more government contracts. Sign in or start your free trial below.
            </p>
          </div>

          {/* Two-column layout: Auth + Plans */}
          <div className="grid grid-cols-1 lg:grid-cols-7 gap-8 lg:gap-10">

            {/* LEFT: Auth panel */}
            <div className="lg:col-span-2">
              <div className="rounded-2xl border-2 border-slate-200 bg-white overflow-hidden shadow-sm">

                {/* SIGNUP COMPLETE — confirmation screen, no form visible */}
                {signupComplete ? (
                  <div className="p-8 text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
                      style={{ background: '#ecfdf5', border: '3px solid #10b981' }}>
                      <CheckCircle className="h-9 w-9" style={{ color: '#059669' }} />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Check Your Email</h3>
                    <p className="text-sm font-bold text-slate-600 mb-1">We sent a verification link to:</p>
                    <p className="text-base font-black mb-5" style={{ color: '#059669' }}>{signupEmail}</p>
                    <div className="rounded-xl p-4 mb-6 text-left" style={{ background: '#f0fdf4', border: '2px solid #bbf7d0' }}>
                      <p className="text-sm font-black text-slate-800 mb-2">What to do next:</p>
                      <ol className="space-y-1.5">
                        <li className="text-sm font-bold text-slate-700 flex items-start gap-2"><span className="font-black text-emerald-600">1.</span> Open the email from Precise GovCon</li>
                        <li className="text-sm font-bold text-slate-700 flex items-start gap-2"><span className="font-black text-emerald-600">2.</span> Click "Verify Email & Start Trial"</li>
                        <li className="text-sm font-bold text-slate-700 flex items-start gap-2"><span className="font-black text-emerald-600">3.</span> Come back and sign in below</li>
                      </ol>
                    </div>
                    <p className="text-xs font-bold text-slate-500 mb-4">Check your spam folder if you don't see it within 2 minutes.</p>
                    <button type="button"
                      onClick={() => { setSignupComplete(false); setAuthMode('signin'); setShowEmailForm(true) }}
                      className="w-full py-3.5 rounded-xl text-white font-black text-base transition-all shadow-md"
                      style={{ background: '#059669' }}>
                      Go to Sign In
                    </button>
                    <button type="button" onClick={onClose}
                      className="mt-3 w-full py-2.5 rounded-xl font-black text-base border-2 border-slate-300 text-slate-700 hover:bg-slate-50 transition-all">
                      Close Window
                    </button>
                  </div>
                ) : (<>

                {/* TAB BAR — Sign In / Sign Up / Google */}
                {authMode !== 'forgot-password' && authMode !== 'reset-password' && (
                  <div className="grid grid-cols-2 border-b-2 border-slate-200">
                    <button type="button"
                      onClick={() => { setShowEmailForm(true); toggleAuthMode('signin') }}
                      className={cx(
                        'py-4 text-base font-black text-center transition-all border-r-2 border-slate-200',
                        authMode === 'signin'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      )}>
                      Sign In
                    </button>
                    <button type="button"
                      onClick={() => { setShowEmailForm(true); toggleAuthMode('signup') }}
                      className={cx(
                        'py-4 text-base font-black text-center transition-all',
                        authMode === 'signup'
                          ? 'text-white'
                          : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      )}
                      style={authMode === 'signup' ? { background: '#F97316' } : {}}>
                      Sign Up
                    </button>
                  </div>
                )}

                {/* Google SSO — always visible strip */}
                {authMode !== 'forgot-password' && authMode !== 'reset-password' && (
                  <div className="px-5 pt-4 pb-2">
                    <button onClick={handleGoogleSignIn} disabled={isLoading}
                      className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-50 font-black text-base text-slate-800 transition-all shadow-sm disabled:opacity-60">
                      {isLoading && authMethod === 'google' ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      Continue with Google
                    </button>
                    <div className="relative my-3">
                      <div className="absolute inset-0 flex items-center"><div className="w-full border-t-2 border-slate-200" /></div>
                      <div className="relative flex justify-center"><span className="px-3 bg-white text-sm font-black text-slate-400">OR</span></div>
                    </div>
                  </div>
                )}

                <div className="px-5 pb-5">
                  {/* Alerts */}
                  {successMessage && (
                    <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border-2 border-emerald-300 flex items-start gap-2.5">
                      <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-emerald-900 leading-relaxed">{successMessage}</p>
                    </div>
                  )}
                  {generalError && (() => {
                    const isUnverified = generalError.startsWith('__UNVERIFIED__:')
                    if (isUnverified) return <UnverifiedEmailBanner email={generalError.replace('__UNVERIFIED__:', '')} />
                    return (
                      <div className="mb-4 p-3.5 rounded-xl bg-red-50 border-2 border-red-300 flex items-start gap-2.5">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm font-bold text-red-900">{generalError}</p>
                      </div>
                    )
                  })()}
                  {stripeError && (
                    <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border-2 border-amber-300 flex items-start gap-2.5">
                      <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm font-bold text-amber-900">{stripeError}</p>
                    </div>
                  )}

                  <form onSubmit={formHandler} className="space-y-4">
                    {/* Reset password */}
                    {authMode === 'reset-password' && (
                      <>
                        <h3 className="text-lg font-black text-slate-900">Set New Password</h3>
                        <div className="p-3 rounded-xl bg-blue-50 border-2 border-blue-200 flex gap-2">
                          <Key className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <p className="text-sm font-bold text-blue-900">Enter your new password below.</p>
                        </div>
                        <PasswordField label="New Password" value={newPassword} onChange={setNewPassword} error={newPasswordError} disabled={isLoading} />
                        <PasswordField label="Confirm New Password" value={confirmNewPassword} onChange={setConfirmNewPassword} error={confirmNewPasswordError} disabled={isLoading} />
                        <button type="submit" disabled={isLoading}
                          className="w-full py-3.5 rounded-xl text-white font-black text-base transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                          style={{ background: '#059669' }}>
                          {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Resetting…</> : 'Reset Password'}
                        </button>
                        <button type="button" onClick={() => { setAuthMode('signin'); setResetToken(''); setNewPassword(''); setConfirmNewPassword('') }}
                          className="w-full text-center text-base font-black text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1">
                          <ArrowLeft className="h-4 w-4" /> Back to Sign In
                        </button>
                      </>
                    )}

                    {/* Forgot password */}
                    {authMode === 'forgot-password' && (
                      <>
                        <div className="mb-2">
                          <h3 className="text-lg font-black text-slate-900">Reset Your Password</h3>
                          <p className="text-sm font-bold text-slate-500 mt-1">We'll send a secure reset link to your email.</p>
                        </div>
                        <InputField label="Email Address" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} error={emailError} placeholder="you@company.com" disabled={isLoading} />
                        <button type="submit" disabled={isLoading}
                          className="w-full py-3.5 rounded-xl text-white font-black text-base transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                          style={{ background: '#059669' }}>
                          {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Sending…</> : 'Send Reset Link'}
                        </button>
                        <button type="button" onClick={() => toggleAuthMode('signin', true)}
                          className="w-full text-center text-base font-black text-slate-700 hover:text-slate-900 flex items-center justify-center gap-1">
                          <ArrowLeft className="h-4 w-4" /> Back to Sign In
                        </button>
                      </>
                    )}

                    {/* Sign up */}
                    {authMode === 'signup' && (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <InputField label="First Name" type="text" value={firstName} onChange={e => setFirstName(e.target.value)} error={firstNameError} placeholder="John" disabled={isLoading} />
                          <InputField label="Last Name" type="text" value={lastName} onChange={e => setLastName(e.target.value)} error={lastNameError} placeholder="Doe" disabled={isLoading} />
                        </div>
                        <InputField label="Email Address" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} error={emailError} placeholder="you@company.com" disabled={isLoading} />
                        <InputField label="Phone (optional)" icon={Phone} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" disabled={isLoading} />
                        <InputField label="Company (optional)" icon={Building} type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Corp" disabled={isLoading} />
                        <PasswordField label="Password" value={password} onChange={setPassword} error={passwordError} disabled={isLoading} />
                        <PasswordField label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} error={confirmPasswordError} disabled={isLoading} />
                        <button type="submit" disabled={isLoading}
                          className="w-full py-3.5 rounded-xl text-white font-black text-base transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
                          style={{ background: '#F97316' }}>
                          {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Creating Account…</> : <>Start Free Trial <ArrowRight className="h-5 w-5" /></>}
                        </button>
                        <p className="text-center text-sm font-bold text-slate-600">
                          By signing up you agree to our{' '}
                          <span className="text-emerald-700 underline cursor-pointer">Terms of Service</span> and{' '}
                          <span className="text-emerald-700 underline cursor-pointer">Privacy Policy</span>
                        </p>
                      </>
                    )}

                    {/* Sign in */}
                    {authMode === 'signin' && (
                      <>
                        <InputField label="Email Address" icon={Mail} type="email" value={email} onChange={e => setEmail(e.target.value)} error={emailError} placeholder="you@company.com" disabled={isLoading} />
                        <PasswordField label="Password" value={password} onChange={setPassword} error={passwordError} disabled={isLoading} />
                        <div className="flex justify-end">
                          <button type="button" onClick={() => toggleAuthMode('forgot-password', true)}
                            className="text-sm font-black text-emerald-700 hover:text-emerald-900 underline underline-offset-2">
                            Forgot password?
                          </button>
                        </div>
                        <button type="submit" disabled={isLoading}
                          className="w-full py-3.5 rounded-xl text-white font-black text-base transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
                          style={{ background: '#059669' }}>
                          {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Signing In…</> : 'Sign In'}
                        </button>
                        <p className="text-center text-sm font-black text-slate-700">
                          No account yet?{' '}
                          <button type="button" onClick={() => toggleAuthMode('signup')}
                            className="font-black underline underline-offset-2" style={{ color: '#F97316' }}>
                            Create one free →
                          </button>
                        </p>
                      </>
                    )}
                  </form>
                </div>
                </> )}
              </div>

              {/* Trust bar */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-600"><Shield className="h-4 w-4 text-emerald-600" /> SSL Secured</span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-600"><Lock className="h-4 w-4 text-emerald-600" /> No card needed</span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-slate-600"><Zap className="h-4 w-4 text-emerald-600" /> Instant access</span>
              </div>
            </div>

            {/* RIGHT: Pricing plans */}
            <div className="lg:col-span-5">
              {/* Billing toggle */}
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-black text-slate-900">Choose Your Plan</h3>
                <div className="flex items-center gap-1.5 p-1.5 rounded-2xl border-2 border-slate-200 bg-slate-100">
                  <button type="button" onClick={() => setBilling('monthly')} disabled={!!openingPaidPlan}
                    className={cx('px-5 py-2.5 rounded-xl text-sm font-black transition-all',
                      billing === 'monthly'
                        ? 'text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-800')}
                    style={billing === 'monthly' ? { background: 'linear-gradient(135deg, #10b981, #059669)' } : {}}>
                    Monthly
                  </button>
                  <button type="button" onClick={() => setBilling('annual')} disabled={!!openingPaidPlan}
                    className={cx('px-5 py-2.5 rounded-xl text-sm font-black transition-all flex items-center gap-2',
                      billing === 'annual'
                        ? 'text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-800')}
                    style={billing === 'annual' ? { background: 'linear-gradient(135deg, #06b6d4, #0891b2)' } : {}}>
                    Annual
                    <span className={cx('text-xs font-black px-1.5 py-0.5 rounded-lg',
                      billing === 'annual' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700')}>
                      -16%
                    </span>
                  </button>
                </div>
              </div>

              {/* Plan cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans.map(plan => {
                  const isOpening = openingPaidPlan === plan.key
                  const isDark = plan.key === 'professional'
                  return (
                    <div key={plan.key} id={`acm-plan-${plan.key}`}
                      className={cx('relative rounded-2xl border-2 p-5 transition-all flex flex-col',
                        plan.popular ? 'shadow-xl scale-[1.02]' : 'hover:shadow-lg hover:-translate-y-0.5')}
                      style={{ background: plan.gradient, borderColor: plan.accentColor + '60' }}>

                      {plan.popular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                          <div className="px-4 py-1 rounded-full text-white text-[10px] font-bold tracking-wider shadow-lg whitespace-nowrap"
                            style={{ background: plan.badgeGradient }}>
                            ⚡ MOST POPULAR
                          </div>
                        </div>
                      )}

                      {/* Plan header */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-1">
                          <span className={cx('text-sm font-black uppercase tracking-wider', isDark ? 'text-emerald-400' : 'text-slate-500')}>
                            {plan.name}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-1 mb-1">
                          <span className={cx('text-4xl font-black', isDark ? 'text-white' : 'text-slate-900')}>{plan.topPrice}</span>
                          <span className={cx('text-sm font-bold', isDark ? 'text-slate-300' : 'text-slate-500')}>{plan.topPeriod}</span>
                        </div>
                        <p className={cx('text-sm font-semibold', isDark ? 'text-slate-300' : 'text-slate-600')}>{plan.tagline}</p>
                      </div>

                      {/* Price breakdown */}
                      <div className={cx('rounded-xl p-2.5 mb-4 text-sm space-y-1', isDark ? 'bg-white/10' : 'bg-white/70 border border-white')}>
                        <div className={cx('flex justify-between', isDark ? 'text-slate-100' : 'text-slate-700')}>
                          <span className="font-bold">Monthly</span><span className="font-bold">{plan.monthlyPrice}</span>
                        </div>
                        <div className={cx('flex justify-between', isDark ? 'text-slate-100' : 'text-slate-700')}>
                          <span className="font-bold">Annual</span><span className="font-bold text-emerald-500">{plan.annualPrice}</span>
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-2 mb-5 flex-1">
                        {plan.features.map(f => (
                          <li key={f} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: plan.accentColor }} />
                            <span className={cx('text-sm font-semibold leading-relaxed', isDark ? 'text-slate-200' : 'text-slate-800')}>{f}</span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA button */}
                      <button type="button" onClick={() => openStripeInNewTab(plan)}
                        disabled={isLoading || !!openingPaidPlan}
                        className="w-full py-2.5 px-4 rounded-xl text-sm font-black text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:brightness-110"
                        style={{ background: plan.badgeGradient }}>
                        {isOpening ? <><Loader2 className="h-4 w-4 animate-spin" /> Opening…</> : <>{plan.buttonText} <ExternalLink className="h-3.5 w-3.5" /></>}
                      </button>

                      {plan.key === 'enterprise' && (
                        <a href="/contact?plan=enterprise"
                          className={cx('mt-2 w-full py-2 px-4 rounded-xl text-xs font-semibold text-center transition-all flex items-center justify-center gap-1.5 border',
                            isDark ? 'border-white/20 text-slate-300 hover:bg-white/10' : 'border-slate-200 bg-white/80 text-slate-600 hover:bg-white')}>
                          Contact Sales <Mail className="h-3 w-3" />
                        </a>
                      )}
                      <p className={cx('text-center text-xs font-medium mt-2', isDark ? 'text-slate-400' : 'text-slate-500')}>
                        Opens in new tab · popups must be allowed
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
            <button type="button" onClick={onClose}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors underline underline-offset-4">
              Maybe later — continue browsing
            </button>
            <p className="text-[10px] text-slate-300">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}