//components/AccessControlModal

'use client'

import React, { useEffect, useMemo, useState } from 'react'
import {
  X,
  Shield,
  CheckCircle,
  Mail,
  Eye,
  EyeOff,
  Phone,
  Building,
  Loader2,
  Lock,
  Search,
  Filter,
  Download,
  BarChart3,
  Database,
  Bell,
  Zap,
  ArrowRight,
  ExternalLink,
  AlertCircle,
  Key,
  AlertTriangle,
  User,
  ArrowLeft,
  Sparkles,
  CreditCard,
  Calendar,
  Users,
  Target,
  PieChart,
  Globe
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
  /**
   * Optional plan to visually highlight when the modal opens (useful for CTAs).
   */
  highlightPlan?: 'basic' | 'professional' | 'enterprise'
  /**
   * Optional billing toggle preset when the modal opens.
   */
  highlightBilling?: Billing
}

type Billing = 'monthly' | 'annual'
type PaidPlan = 'basic' | 'professional' | 'enterprise'
type PaidPlanCard = {
  key: PaidPlan
  name: string
  duration: string
  topPrice: string
  topPeriod: string
  showBreakdown: boolean
  features: string[]
  popular: boolean
  buttonText: string
  priceId: string
}

type AuthMode = 'signin' | 'signup' | 'forgot-password' | 'reset-password' | 'method'

const TRIAL_FEATURES = [
  { icon: <Search className="h-5 w-5 text-blue-400" />, title: 'Advanced Search', desc: 'Filter by agency, NAICS, location' },
  { icon: <Filter className="h-5 w-5 text-emerald-400" />, title: 'Smart Filters', desc: 'Dynamic filtering with real-time counts' },
  { icon: <Download className="h-5 w-5 text-purple-400" />, title: 'Export Tools', desc: 'Download results as CSV/Excel' },
  { icon: <BarChart3 className="h-5 w-5 text-amber-400" />, title: 'Analytics', desc: 'Visual insights and trends' },
  { icon: <Database className="h-5 w-5 text-cyan-400" />, title: 'Historical Data', desc: 'Access to archived opportunities' },
  { icon: <Bell className="h-5 w-5 text-rose-400" />, title: 'Real-time Alerts', desc: 'Get notified for new opportunities' },
]

const BENEFITS = [
  { icon: <Target className="h-4 w-4" />, text: 'Find more opportunities' },
  { icon: <PieChart className="h-4 w-4" />, text: 'Advanced analytics' },
  { icon: <Globe className="h-4 w-4" />, text: 'National coverage' },
  { icon: <Users className="h-4 w-4" />, text: 'Team collaboration' },
]

function cx(...c: Array<string | false | null | undefined>) {
  return c.filter(Boolean).join(' ')
}

export default function AccessControlModal({isOpen,
  onClose,
  featureName,
  onAccessGranted,
  redirectTo = '/search',
  initialMode = 'signin',
  highlightPlan,
  highlightBilling,
}: AccessControlModalProps) {
  const router = useRouter()
  const { status, update } = useSession()

  const redirectTarget = redirectTo || '/search'

  const [isLoading, setIsLoading] = useState(false)
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | null>(null)
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [resetToken, setResetToken] = useState<string>('')
  const [resetSent, setResetSent] = useState(false)

  const [billing, setBilling] = useState<Billing>('monthly')

  // Optional CTA presets (useful for pricing cards / marketing CTAs)
  useEffect(() => {
    if (!isOpen) return
    if (highlightBilling) setBilling(highlightBilling)
  }, [isOpen, highlightBilling])

  useEffect(() => {
    if (!isOpen) return
    if (!highlightPlan) return
    const id = `acm-plan-${highlightPlan}`
    const t = setTimeout(() => {
      try {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      } catch {
        // no-op
      }
    }, 150)
    return () => clearTimeout(t)
  }, [isOpen, highlightPlan])
  const [openingPaidPlan, setOpeningPaidPlan] = useState<null | PaidPlan>(null)
  const [stripeError, setStripeError] = useState<string | null>(null)

  // Form fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [company, setCompany] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmNewPassword, setConfirmNewPassword] = useState('')

  // Error states
  const [firstNameError, setFirstNameError] = useState('')
  const [lastNameError, setLastNameError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [newPasswordError, setNewPasswordError] = useState('')
  const [confirmNewPasswordError, setConfirmNewPasswordError] = useState('')
  const [generalError, setGeneralError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const validateEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

  const resetErrors = () => {
    setFirstNameError('')
    setLastNameError('')
    setEmailError('')
    setPasswordError('')
    setConfirmPasswordError('')
    setNewPasswordError('')
    setConfirmNewPasswordError('')
    setGeneralError('')
    setSuccessMessage('')
    setStripeError(null)
  }

  const handleAccessGranted = () => {
    try {
      onClose()
    } catch {}

    try {
      onAccessGranted?.()
    } catch {}

    router.push(redirectTarget)
    router.refresh()
  }

  useEffect(() => {
    if (status === 'authenticated' && isOpen) {
      handleAccessGranted()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isOpen])

  useEffect(() => {
    if (!isOpen) return

    // Always open directly to the requested auth screen (sign in / sign up / reset),
    // so users don't have to go through the "Choose how to continue" step.
    setAuthMode(initialMode)
    resetErrors()

    // If a caller explicitly wants the "method" chooser, they can pass initialMode="method".
    setShowEmailForm(initialMode !== 'method')
  }, [isOpen, initialMode])

  // Add this useEffect to handle reset token from URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const token = urlParams.get('token')
    
    if (token && isOpen) {
      setResetToken(token)
      setAuthMode('reset-password')
      setShowEmailForm(true)
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [isOpen])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setAuthMethod('google')
    setGeneralError('')
    setStripeError(null)

    try {
      await signIn('google', { 
        callbackUrl: redirectTarget, 
        redirect: true 
      })
      onClose()
    } catch (error: any) {
      console.error('Google sign-in error:', error)
      setGeneralError('Failed to sign in with Google. Please try again.')
      setIsLoading(false)
      setAuthMethod(null)
    }
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    resetErrors()

    let hasError = false
    if (!firstName.trim()) { setFirstNameError('First name is required'); hasError = true }
    if (!lastName.trim()) { setLastNameError('Last name is required'); hasError = true }
    if (!email.trim()) { setEmailError('Email is required'); hasError = true }
    else if (!validateEmail(email)) { setEmailError('Invalid email format'); hasError = true }
    if (!password) { setPasswordError('Password is required'); hasError = true }
    else if (password.length < 8) { setPasswordError('Password must be at least 8 characters'); hasError = true }
    if (!confirmPassword) { setConfirmPasswordError('Please confirm your password'); hasError = true }
    else if (password !== confirmPassword) { setConfirmPasswordError('Passwords do not match'); hasError = true }
    if (hasError) return

    setIsLoading(true)
    setAuthMethod('email')

    try {
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim() || undefined,
          company: company.trim() || undefined,
          password,
        }),
      })

      const raw = await signupResponse.text()
      let data: any = null
      try { data = raw ? JSON.parse(raw) : null } catch { data = null }

      if (signupResponse.status === 409) {
        setGeneralError('An account with this email already exists. Please sign in instead.')
        setAuthMode('signin')
        setConfirmPassword('')
        setShowConfirmPassword(false)
        setIsLoading(false)
        setAuthMethod(null)
        return
      }

      if (!signupResponse.ok) {
        let errorMessage = 'Failed to create account. Please try again.'
        
        try {
          const data = raw ? JSON.parse(raw) : {}
          errorMessage = data?.error || data?.message || errorMessage
          
          if (signupResponse.status === 500) {
            if (errorMessage.includes('email_verification_tokens')) {
              errorMessage = 'System is being configured. Please try again in a moment.'
            } else if (errorMessage.includes('Resend')) {
              errorMessage = 'Email service temporarily unavailable. Please try again later.'
            }
          }
        } catch (parseError) {
          if (raw && raw.length < 100) {
            errorMessage = raw
          }
        }
        
        throw new Error(errorMessage)
      }

      setSuccessMessage('Account created successfully! Please check your email to verify your account.')
      setAuthMode('signin')
      setConfirmPassword('')
      setShowConfirmPassword(false)
      
    } catch (error: any) {
      console.error('Signup error:', error)
      setGeneralError(error?.message || 'Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
      setAuthMethod(null)
    }
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setPasswordError('')
    setGeneralError('')
    setStripeError(null)

    if (!email.trim()) { 
      setEmailError('Email is required'); 
      return 
    }
    if (!password) { 
      setPasswordError('Password is required'); 
      return 
    }

    setIsLoading(true)
    setAuthMethod('email')

    try {
      console.log('Attempting sign in with email:', email)
      
      const result = await signIn('credentials', {
        redirect: false,
        email: email.toLowerCase().trim(),
        password,
      })

      console.log('SignIn result:', result)

      if (result?.error) {
        const errorStr = String(result.error)
        console.warn('SignIn error:', errorStr)
        
        if (errorStr.includes('CredentialsSignin') || errorStr.includes('Invalid credentials')) {
          setGeneralError('Invalid email or password. Please check your credentials and try again.')
        } else if (errorStr.includes('Email not verified')) {
          setGeneralError('Please verify your email address before signing in. Check your inbox for the verification link.')
        } else if (errorStr.includes('Callback') || errorStr.includes('OAuth')) {
          setGeneralError('Authentication configuration error. Please try again later.')
        } else if (errorStr.includes('Account not found')) {
          setGeneralError('No account found with this email. Please sign up first.')
        } else {
          setGeneralError(`Sign in failed: ${errorStr}`)
        }
        return
      }

      if (result?.ok && !result?.error) {
        console.log('Sign in successful, updating session...')
        
        await update()
        
        setSuccessMessage('Login successful! Redirecting...')
        
        setTimeout(() => {
          console.log('Redirecting...')
          onClose()
          router.push(redirectTarget)
          router.refresh()
        }, 1000)
      }
      
    } catch (error: any) {
      console.error('Sign-in error:', error)
      setGeneralError('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
      setAuthMethod(null)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setGeneralError('')
    setSuccessMessage('')

    if (!email.trim()) { 
      setEmailError('Email is required'); 
      return 
    }
    if (!validateEmail(email)) { 
      setEmailError('Invalid email format'); 
      return 
    }

    setIsLoading(true)
    setAuthMethod('email')

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('Password reset email sent! Check your inbox for instructions.')
        setResetSent(true)
      } else {
        setGeneralError(data.error || 'Failed to send reset email. Please try again.')
      }
    } catch (error: any) {
      console.error('Forgot password error:', error)
      setGeneralError('Failed to send reset email. Please try again.')
    } finally {
      setIsLoading(false)
      setAuthMethod(null)
    }
  }

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setNewPasswordError('')
    setConfirmNewPasswordError('')
    setGeneralError('')
    setSuccessMessage('')

    let hasError = false
    if (!newPassword) { setNewPasswordError('New password is required'); hasError = true }
    else if (newPassword.length < 8) { setNewPasswordError('Password must be at least 8 characters'); hasError = true }
    if (!confirmNewPassword) { setConfirmNewPasswordError('Please confirm your new password'); hasError = true }
    else if (newPassword !== confirmNewPassword) { setConfirmNewPasswordError('Passwords do not match'); hasError = true }
    if (hasError) return

    setIsLoading(true)
    setAuthMethod('email')

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: resetToken,
          password: newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccessMessage('Password reset successful! You can now sign in with your new password.')
        setTimeout(() => {
          setAuthMode('signin')
          setNewPassword('')
          setConfirmNewPassword('')
          setShowPassword(false)
          setShowConfirmPassword(false)
        }, 2000)
      } else {
        setGeneralError(data.error || 'Failed to reset password. Please try again or request a new reset link.')
      }
    } catch (error: any) {
      console.error('Password reset error:', error)
      setGeneralError('Failed to reset password. Please try again.')
    } finally {
      setIsLoading(false)
      setAuthMethod(null)
    }
  }

  const toggleAuthMode = (mode: AuthMode) => {
    setAuthMode(mode)
    resetErrors()
    if (mode === 'forgot-password') {
      setPassword('')
      setShowPassword(false)
    }
  }

  const openStripeInNewTab = async (plan: { key: PaidPlan; priceId: string }) => {
    if (status !== 'authenticated') {
      setStripeError('Please sign in first.')
      return
    }
    if (!email.trim()) {
      setStripeError('Email is required.')
      return
    }

    setOpeningPaidPlan(plan.key)

    const newTab = window.open('', '_blank')
    if (!newTab) {
      setStripeError('Please allow popups for this site.')
      setOpeningPaidPlan(null)
      return
    }

    try {
      newTab.document.write(`
        <html>
          <head><title>Redirecting to Checkout...</title></head>
          <body style="margin:0;padding:0;background:#111;color:#fff;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;">
            <div style="text-align:center;">
              <div style="font-size:24px;margin-bottom:16px;">Redirecting to Stripe Checkout...</div>
              <div style="color:#999;">Please wait...</div>
            </div>
          </body>
        </html>
      `)
      newTab.document.close()
    } catch {}

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          priceId: plan.priceId,
          email,
          tier: plan.key,
          billing 
        }),
      })

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}))
        newTab.close()
        setStripeError(errJson?.error || 'Failed to create checkout session.')
        setOpeningPaidPlan(null)
        return
      }

      const { url } = await res.json()
      newTab.location.href = url
    } catch (err: any) {
      newTab.close()
      setStripeError(err?.message || 'Failed to create checkout session.')
    } finally {
      setOpeningPaidPlan(null)
    }
  }

  const plans = useMemo(() => {
    const basicPriceTop = billing === 'monthly' ? '$24.99' : '$249.90'
    const basicTopPeriod = billing === 'monthly' ? '/month' : '/year'
    const proPriceTop = billing === 'monthly' ? '$49.99' : '$499.90'
    const proTopPeriod = billing === 'monthly' ? '/month' : '/year'
    const entPriceTop = billing === 'monthly' ? '$199.99' : '$1,999.90'
    const entTopPeriod = billing === 'monthly' ? '/month' : '/year'

    // Stripe Price IDs from pricing page
    const basicMonthlyPriceId = 'price_1SrX4iPBeHrQUcEBcCNR77ti'
    const basicAnnualPriceId = 'price_1SrX5JPBeHrQUcEBp36HLtHq'
    const proMonthlyPriceId = 'price_1SpKkkPBeHrQUcEBikiRqBhP'
    const proAnnualPriceId = 'price_1SpKu0PBeHrQUcEBLqvi496k'
    const entMonthlyPriceId = 'price_1SpKx6PBeHrQUcEB8KezJ9dx'
    const entAnnualPriceId = 'price_1SpKxuPBeHrQUcEB9Ytzoo2N'

    const list = [
      {
        key: 'basic',
        name: 'Basic',
        duration: 'Perfect for solo contractors and consultants',
        topPrice: basicPriceTop,
        topPeriod: basicTopPeriod,
        showBreakdown: true,
        features: [
          'Unlimited opportunity searches',
          'Advanced filtering (all criteria)',
          'Save unlimited opportunities',
          'Basic email alerts (daily digest)',
          'Search history (30 days)',
          'Export to CSV',
          'Email support',
        ],
        popular: false,
        buttonText: 'Start 7-Day Trial',
        priceId: billing === 'monthly' ? basicMonthlyPriceId : basicAnnualPriceId,
      },
      {
        key: 'professional',
        name: 'Professional',
        duration: 'For growing businesses and small teams',
        topPrice: proPriceTop,
        topPeriod: proTopPeriod,
        showBreakdown: true,
        features: [
          'Everything in Basic, plus:',
          'Real-time opportunity alerts',
          'Advanced analytics dashboard',
          'Competitor tracking',
          'Custom alert criteria (25 alerts)',
          'Search history (1 year)',
          'API access (1,000 calls/month)',
          'Export to Excel with formatting',
          'Team collaboration (3 users)',
          'Priority support',
        ],
        popular: true,
        buttonText: 'Start 7-Day Trial',
        priceId: billing === 'monthly' ? proMonthlyPriceId : proAnnualPriceId,
      },
      {
        key: 'enterprise',
        name: 'Enterprise',
        duration: 'For large contractors and prime contractors',
        topPrice: entPriceTop,
        topPeriod: entTopPeriod,
        showBreakdown: true,
        features: [
          'Everything in Professional, plus:',
          'Unlimited team members',
          'Dedicated account manager',
          'Custom integrations',
          'Unlimited API access',
          'White-label reporting',
          'Custom training sessions',
          'SLA guarantees (99.9% uptime)',
          'Phone & priority support',
          'Historical data (5+ years)',
        ],
        popular: false,
        buttonText: 'Start 7-Day Trial',
        priceId: billing === 'monthly' ? entMonthlyPriceId : entAnnualPriceId,
      },
    ] satisfies PaidPlanCard[]

    return list
  }, [billing])

  if (!isOpen) return null

  const formHandler = authMode === 'signup'
    ? handleEmailSignUp
    : authMode === 'forgot-password'
    ? handleForgotPassword
    : authMode === 'reset-password'
    ? handlePasswordReset
    : handleSignIn

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-950/60 to-slate-900/70 backdrop-blur-md"
        onClick={onClose}
      />

      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-[0_30px_120px_-35px_rgba(0,0,0,0.8)]">
        <div className="pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors z-10"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6 lg:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 mb-4">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl lg:text-3xl font-semibold tracking-tight text-white mb-2">
              Unlock {featureName}
            </h2>
            <p className="text-slate-300/80 leading-relaxed max-w-lg mx-auto">
              Sign in or start your free trial to access premium features
            </p>
          </div>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <p className="text-emerald-100 text-sm leading-relaxed">{successMessage}</p>
            </div>
          )}

          {/* General Error */}
          {generalError && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/20 border border-red-500/30 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-100 text-sm leading-relaxed">{generalError}</p>
            </div>
          )}

          {/* Stripe Errors */}
          {stripeError && (
            <div className="mb-6 p-4 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-amber-100 text-sm leading-relaxed">{stripeError}</p>
              </div>
            </div>
          )}

          {/* Main Content: 2-Column Grid on large screens */}
          <div className="grid lg:grid-cols-[1fr_1.2fr] gap-8">
            {/* Left: Auth Forms */}
            <div>
              {!showEmailForm ? (
                <>
                  {/* Method Chooser */}
                  <div className="space-y-3">
                    <button
                      onClick={handleGoogleSignIn}
                      disabled={isLoading}
                      className="group w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isLoading && authMethod === 'google' ? (
                        <Loader2 className="h-5 w-5 animate-spin text-white" />
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24">
                          <path
                            fill="currentColor"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            className="text-blue-500"
                          />
                          <path
                            fill="currentColor"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            className="text-green-500"
                          />
                          <path
                            fill="currentColor"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            className="text-yellow-500"
                          />
                          <path
                            fill="currentColor"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            className="text-red-500"
                          />
                        </svg>
                      )}
                      <span className="font-semibold text-white">Continue with Google</span>
                    </button>

                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="px-3 bg-slate-900/50 text-slate-400 font-medium">or continue with email</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setShowEmailForm(true)
                        setAuthMode('signup')
                      }}
                      className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold transition-opacity hover:opacity-90"
                    >
                      <Mail className="h-5 w-5" />
                      Sign Up with Email
                    </button>

                    <button
                      onClick={() => {
                        setShowEmailForm(true)
                        setAuthMode('signin')
                      }}
                      className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 text-white font-semibold transition-colors"
                    >
                      <Lock className="h-5 w-5" />
                      Sign In with Email
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Email Auth Form */}
                  <form onSubmit={formHandler} className="space-y-4">
                    {authMode === 'reset-password' && (
                      <>
                        <div className="mb-6 p-4 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-start gap-3">
                          <Key className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-blue-100 text-sm leading-relaxed">
                            Enter your new password below to reset your account password.
                          </p>
                        </div>

                        {/* New Password */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">New Password *</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={newPassword}
                              onChange={(e) => setNewPassword(e.target.value)}
                              className={cx(
                                'w-full pl-11 pr-11 py-3 rounded-xl border bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors',
                                newPasswordError ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'
                              )}
                              placeholder="••••••••"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          {newPasswordError && <p className="mt-1.5 text-xs text-red-400">{newPasswordError}</p>}
                        </div>

                        {/* Confirm New Password */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Confirm New Password *</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmNewPassword}
                              onChange={(e) => setConfirmNewPassword(e.target.value)}
                              className={cx(
                                'w-full pl-11 pr-11 py-3 rounded-xl border bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors',
                                confirmNewPasswordError ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'
                              )}
                              placeholder="••••••••"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          {confirmNewPasswordError && <p className="mt-1.5 text-xs text-red-400">{confirmNewPasswordError}</p>}
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Resetting Password...
                            </>
                          ) : (
                            <>Reset Password</>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setAuthMode('signin')
                            setResetToken('')
                            setNewPassword('')
                            setConfirmNewPassword('')
                            setShowPassword(false)
                            setShowConfirmPassword(false)
                          }}
                          className="w-full text-center text-slate-400 hover:text-white font-medium py-2"
                        >
                          ← Back to Sign In
                        </button>
                      </>
                    )}

                    {authMode === 'forgot-password' && (
                      <>
                        <div className="mb-6 p-4 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-start gap-3">
                          <Mail className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <p className="text-blue-100 text-sm leading-relaxed">
                            {resetSent
                              ? 'Check your email for a password reset link. It may take a few minutes to arrive.'
                              : 'Enter your email address and we\'ll send you a link to reset your password.'}
                          </p>
                        </div>

                        {!resetSent && (
                          <>
                            {/* Email */}
                            <div>
                              <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                  type="email"
                                  value={email}
                                  onChange={(e) => setEmail(e.target.value)}
                                  className={cx(
                                    'w-full pl-11 pr-4 py-3 rounded-xl border bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors',
                                    emailError ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'
                                  )}
                                  placeholder="john@company.com"
                                  disabled={isLoading}
                                />
                              </div>
                              {emailError && <p className="mt-1.5 text-xs text-red-400">{emailError}</p>}
                            </div>

                            <button
                              type="submit"
                              disabled={isLoading}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                              {isLoading ? (
                                <>
                                  <Loader2 className="h-5 w-5 animate-spin" />
                                  Sending Reset Link...
                                </>
                              ) : (
                                <>Send Reset Link</>
                              )}
                            </button>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleAuthMode('signin')}
                          className="w-full text-center text-slate-400 hover:text-white font-medium py-2"
                        >
                          ← Back to Sign In
                        </button>
                      </>
                    )}

                    {authMode === 'signup' && (
                      <>
                        {/* First Name */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">First Name *</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type="text"
                              value={firstName}
                              onChange={(e) => setFirstName(e.target.value)}
                              className={cx(
                                'w-full pl-11 pr-4 py-3 rounded-xl border bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors',
                                firstNameError ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'
                              )}
                              placeholder="John"
                              disabled={isLoading}
                            />
                          </div>
                          {firstNameError && <p className="mt-1.5 text-xs text-red-400">{firstNameError}</p>}
                        </div>

                        {/* Last Name */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Last Name *</label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type="text"
                              value={lastName}
                              onChange={(e) => setLastName(e.target.value)}
                              className={cx(
                                'w-full pl-11 pr-4 py-3 rounded-xl border bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors',
                                lastNameError ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'
                              )}
                              placeholder="Doe"
                              disabled={isLoading}
                            />
                          </div>
                          {lastNameError && <p className="mt-1.5 text-xs text-red-400">{lastNameError}</p>}
                        </div>

                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={cx(
                                'w-full pl-11 pr-4 py-3 rounded-xl border bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors',
                                emailError ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'
                              )}
                              placeholder="john@company.com"
                              disabled={isLoading}
                            />
                          </div>
                          {emailError && <p className="mt-1.5 text-xs text-red-400">{emailError}</p>}
                        </div>

                        {/* Phone (optional) */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Phone (optional)</label>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type="tel"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-emerald-500/50 bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors"
                              placeholder="+1 (555) 000-0000"
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        {/* Company (optional) */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Company (optional)</label>
                          <div className="relative">
                            <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type="text"
                              value={company}
                              onChange={(e) => setCompany(e.target.value)}
                              className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 focus:border-emerald-500/50 bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors"
                              placeholder="Acme Corp"
                              disabled={isLoading}
                            />
                          </div>
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className={cx(
                                'w-full pl-11 pr-11 py-3 rounded-xl border bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors',
                                passwordError ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'
                              )}
                              placeholder="••••••••"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          {passwordError && <p className="mt-1.5 text-xs text-red-400">{passwordError}</p>}
                        </div>

                        {/* Confirm Password */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Confirm Password *</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type={showConfirmPassword ? 'text' : 'password'}
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              className={cx(
                                'w-full pl-11 pr-11 py-3 rounded-xl border bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors',
                                confirmPasswordError ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'
                              )}
                              placeholder="••••••••"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          {confirmPasswordError && <p className="mt-1.5 text-xs text-red-400">{confirmPasswordError}</p>}
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Creating Account...
                            </>
                          ) : (
                            <>Create Account</>
                          )}
                        </button>

                        <p className="text-center text-sm text-slate-400">
                          Already have an account?{' '}
                          <button
                            type="button"
                            onClick={() => toggleAuthMode('signin')}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            Sign In
                          </button>
                        </p>
                      </>
                    )}

                    {authMode === 'signin' && (
                      <>
                        {/* Email */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Email Address *</label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className={cx(
                                'w-full pl-11 pr-4 py-3 rounded-xl border bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors',
                                emailError ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'
                              )}
                              placeholder="john@company.com"
                              disabled={isLoading}
                            />
                          </div>
                          {emailError && <p className="mt-1.5 text-xs text-red-400">{emailError}</p>}
                        </div>

                        {/* Password */}
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">Password *</label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              className={cx(
                                'w-full pl-11 pr-11 py-3 rounded-xl border bg-white/5 backdrop-blur-xl text-white placeholder-slate-500 transition-colors',
                                passwordError ? 'border-red-500/50' : 'border-white/10 focus:border-emerald-500/50'
                              )}
                              placeholder="••••••••"
                              disabled={isLoading}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                          {passwordError && <p className="mt-1.5 text-xs text-red-400">{passwordError}</p>}
                        </div>

                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={() => toggleAuthMode('forgot-password')}
                            className="text-sm text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            Forgot password?
                          </button>
                        </div>

                        <button
                          type="submit"
                          disabled={isLoading}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 text-white font-semibold transition-opacity hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              Signing In...
                            </>
                          ) : (
                            <>Sign In</>
                          )}
                        </button>

                        <p className="text-center text-sm text-slate-400">
                          Don't have an account?{' '}
                          <button
                            type="button"
                            onClick={() => toggleAuthMode('signup')}
                            className="text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            Sign Up
                          </button>
                        </p>
                      </>
                    )}

                    {(authMode === 'signin' || authMode === 'signup') && (
                      <button
                        type="button"
                        onClick={() => toggleAuthMode('signin')}
                        className="w-full text-center text-slate-400 hover:text-white font-medium py-2"
                      >
                        ← Back to Sign In
                      </button>
                    )}
                  </form>
                </>
              )}

              {/* Benefits */}
              <div className="mt-8">
                <h4 className="text-sm font-semibold text-slate-300 mb-3">What you'll get:</h4>
                <div className="grid grid-cols-2 gap-2">
                  {BENEFITS.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-400">
                      <div className="text-emerald-400">{benefit.icon}</div>
                      {benefit.text}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Plans */}
            <div className="border-t lg:border-t-0 lg:border-l border-white/10 pt-8 lg:pt-0 lg:pl-8">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-semibold tracking-tight text-white">Choose Your Plan</h3>

                <div className="inline-flex items-center gap-1 rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl p-1">
                  <button
                    type="button"
                    onClick={() => setBilling('monthly')}
                    disabled={!!openingPaidPlan || isLoading}
                    className={cx(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                      billing === 'monthly'
                        ? 'bg-white text-slate-900'
                        : 'text-slate-200 hover:bg-white/10'
                    )}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBilling('annual')}
                    disabled={!!openingPaidPlan || isLoading}
                    className={cx(
                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition',
                      billing === 'annual'
                        ? 'bg-white text-slate-900'
                        : 'text-slate-200 hover:bg-white/10'
                    )}
                  >
                    Annual <span className="ml-1 text-emerald-300">(save)</span>
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                {plans.map((plan) => {
                  const isOpening =
                    (plan.key === 'basic' && openingPaidPlan === 'basic') ||
                    (plan.key === 'professional' && openingPaidPlan === 'professional') ||
                    (plan.key === 'enterprise' && openingPaidPlan === 'enterprise')

                  const isHighlighted = !!highlightPlan && plan.key === highlightPlan

                  return (
                    <div
                      id={`acm-plan-${plan.key}`}
                      key={plan.key}
                      className={cx(
                        'relative p-4 rounded-2xl border transition-colors',
                        plan.popular
                          ? 'border-emerald-500/50 bg-white/5 backdrop-blur-xl ring-2 ring-emerald-500/20 shadow-[0_20px_80px_-40px_rgba(16,185,129,0.45)]'
                          : 'border-white/10 bg-white/5 backdrop-blur-xl hover:border-white/20',
                        isHighlighted && 'ring-2 ring-cyan-400/40 border-cyan-400/50 shadow-[0_0_0_4px_rgba(34,211,238,0.12)]'
                      )}
                    >
                      {plan.popular && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <div className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-semibold whitespace-nowrap">
                            MOST POPULAR
                          </div>
                        </div>
                      )}

                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="text-base font-semibold tracking-tight text-white">{plan.name}</h4>
                          <p className="text-sm text-slate-300/70">{plan.duration}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-semibold tracking-tight text-white">{plan.topPrice}</div>
                          <div className="text-sm text-slate-300/70">{plan.topPeriod}</div>
                        </div>
                      </div>

                      {plan.showBreakdown && (
                        <div className="mb-3 flex flex-col gap-2 text-sm text-slate-300">
                          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-2">
                            Monthly:{' '}
                            <span className="font-semibold">
                              {plan.key === 'basic' ? '$24.99/month' : plan.key === 'professional' ? '$49.99/month' : '$199.99/month'}
                            </span>
                          </div>
                          <div className="rounded-xl border border-white/10 bg-white/5 backdrop-blur-xl px-3 py-2">
                            Annual:{' '}
                            <span className="font-semibold">
                              {plan.key === 'basic' ? '$249.90/year' : plan.key === 'professional' ? '$499.90/year' : '$1,999.90/year'}
                            </span>{' '}
                            <span className="text-emerald-300 text-xs">(save 16%)</span>
                          </div>
                        </div>
                      )}

                      <ul className="space-y-2 mb-4">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2">
                            <CheckCircle
                              className={cx(
                                'h-4 w-4 mt-0.5 flex-shrink-0',
                                plan.popular ? 'text-emerald-400' : 'text-white/25'
                              )}
                            />
                            <span className="text-sm text-slate-300">{f}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="grid grid-cols-1 gap-2">
                        <button
                          type="button"
                          onClick={() => openStripeInNewTab(plan)}
                          disabled={isLoading || !!openingPaidPlan}
                          className="w-full font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm bg-white/10 text-white border border-white/10 hover:bg-white/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isOpening ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Opening Stripe…
                            </>
                          ) : (
                            <>
                              {plan.buttonText} <ExternalLink className="h-4 w-4" />
                            </>
                          )}
                        </button>

                        {plan.key === 'enterprise' && (
                          <a
                            href="/contact?plan=enterprise"
                            className="w-full font-semibold py-2.5 px-4 rounded-xl transition-colors text-sm border border-white/10 bg-white/5 text-white hover:bg-white/10 flex items-center justify-center gap-2"
                          >
                            Contact Sales <Mail className="h-4 w-4" />
                          </a>
                        )}

                        <p className="text-xs text-slate-300/60 text-center">
                          Opens checkout in a new tab (popups must be allowed).
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-slate-500 text-center">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  )
}