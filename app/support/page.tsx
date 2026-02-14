//app/support/page.tsx

'use client'

import Script from 'next/script'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  Mail,
  Clock,
  Phone,
  ShieldCheck,
  HelpCircle,
  Send,
  CalendarClock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  ArrowRight,
  ArrowLeft,
  Bug,
  CreditCard,
  UserCog,
  Bell,
  Briefcase,
  MessageSquare,
  FileQuestion,
} from 'lucide-react'

export const dynamic = 'force-dynamic'

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  inquiryType: string
  message: string
}

const CALENDLY_URL = 'https://calendly.com/precisegovcon/30min'
const SUPPORT_EMAIL = 'support@precisegovcon.com'
const SUPPORT_TEL = '804-404-4005'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

function initialForm(): FormState {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    inquiryType: '',
    message: '',
  }
}

// Precise GovCon brand colors
const BRAND = {
  navy: '#1e3a4c',
  navyLight: '#2d5266',
  navyDark: '#0f2a36',
  green: '#7cb342',
  greenLight: '#a5d6a5',
  greenDark: '#558b2f',
  orange: '#ff9800',
  orangeLight: '#ffb74d',
  orangeDark: '#f57c00',
  cyan: '#06b6d4',
  teal: '#10b981',
}

// Dynamic category colors with Precise GovCon palette
const CATEGORY_COLORS = {
  'Technical Support': {
    primary: '#ef4444',
    light: '#f87171',
    dark: '#dc2626',
    bg: 'rgba(239, 68, 68, 0.15)',
    border: 'rgba(239, 68, 68, 0.3)',
    gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
    input: 'bg-red-500/5 border-red-400/30 focus:border-red-400/60 focus:ring-red-500/20',
    icon: 'text-red-300',
  },
  'Billing & Subscription': {
    primary: '#3b82f6',
    light: '#60a5fa',
    dark: '#2563eb',
    bg: 'rgba(59, 130, 246, 0.15)',
    border: 'rgba(59, 130, 246, 0.3)',
    gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    input: 'bg-blue-500/5 border-blue-400/30 focus:border-blue-400/60 focus:ring-blue-500/20',
    icon: 'text-blue-300',
  },
  'Account & Access': {
    primary: '#a855f7',
    light: '#c084fc',
    dark: '#9333ea',
    bg: 'rgba(168, 85, 247, 0.15)',
    border: 'rgba(168, 85, 247, 0.3)',
    gradient: 'linear-gradient(135deg, #a855f7, #9333ea)',
    input: 'bg-purple-500/5 border-purple-400/30 focus:border-purple-400/60 focus:ring-purple-500/20',
    icon: 'text-purple-300',
  },
  'Alerts & Notifications': {
    primary: BRAND.orange,
    light: BRAND.orangeLight,
    dark: BRAND.orangeDark,
    bg: 'rgba(255, 152, 0, 0.15)',
    border: 'rgba(255, 152, 0, 0.3)',
    gradient: `linear-gradient(135deg, ${BRAND.orange}, ${BRAND.orangeDark})`,
    input: 'bg-orange-500/5 border-orange-400/30 focus:border-orange-400/60 focus:ring-orange-500/20',
    icon: 'text-orange-300',
  },
  'Sales & Services': {
    primary: BRAND.green,
    light: BRAND.greenLight,
    dark: BRAND.greenDark,
    bg: 'rgba(124, 179, 66, 0.15)',
    border: 'rgba(124, 179, 66, 0.3)',
    gradient: `linear-gradient(135deg, ${BRAND.green}, ${BRAND.greenDark})`,
    input: 'bg-emerald-500/5 border-emerald-400/30 focus:border-emerald-400/60 focus:ring-emerald-500/20',
    icon: 'text-emerald-300',
  },
  'Compliance & Security': {
    primary: '#6366f1',
    light: '#818cf8',
    dark: '#4f46e5',
    bg: 'rgba(99, 102, 241, 0.15)',
    border: 'rgba(99, 102, 241, 0.3)',
    gradient: 'linear-gradient(135deg, #6366f1, #4f46e5)',
    input: 'bg-indigo-500/5 border-indigo-400/30 focus:border-indigo-400/60 focus:ring-indigo-500/20',
    icon: 'text-indigo-300',
  },
  'General Inquiry': {
    primary: BRAND.cyan,
    light: '#22d3ee',
    dark: '#0891b2',
    bg: 'rgba(6, 182, 212, 0.15)',
    border: 'rgba(6, 182, 212, 0.3)',
    gradient: `linear-gradient(135deg, ${BRAND.cyan}, #0891b2)`,
    input: 'bg-cyan-500/5 border-cyan-400/30 focus:border-cyan-400/60 focus:ring-cyan-500/20',
    icon: 'text-cyan-300',
  },
  'Other': {
    primary: '#6b7280',
    light: '#9ca3af',
    dark: '#4b5563',
    bg: 'rgba(107, 114, 128, 0.15)',
    border: 'rgba(107, 114, 128, 0.3)',
    gradient: 'linear-gradient(135deg, #6b7280, #4b5563)',
    input: 'bg-gray-500/5 border-gray-400/30 focus:border-gray-400/60 focus:ring-gray-500/20',
    icon: 'text-gray-300',
  },
}

function SupportContactModal({
  isOpen,
  onClose,
  onOpenForm,
}: {
  isOpen: boolean
  onClose: () => void
  onOpenForm: () => void
}) {
  const [view, setView] = useState<'options' | 'form'>('options')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    inquiryType: '',
    message: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitOk, setSubmitOk] = useState('')
  const [submitErr, setSubmitErr] = useState('')
  const [submittedData, setSubmittedData] = useState<{
    name: string
    email: string
    category: string
    timestamp: string
  } | null>(null)

  if (!isOpen) return null

  const resetForm = () => {
    setForm({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      inquiryType: '',
      message: '',
    })
    setSubmitOk('')
    setSubmitErr('')
    setSubmittedData(null)
  }

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
    setForm((prev) => ({ ...prev, inquiryType: category }))
    setView('form')
  }

  const handleBackToOptions = () => {
    setView('options')
    setSelectedCategory('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitErr('')
    setSubmitOk('')

    // ✅ Message is now OPTIONAL - removed from validation
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.inquiryType) {
      setSubmitErr('Please fill in all required fields (First Name, Last Name, Email, and Inquiry Type).')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to send message')
      }

      const fullName = `${form.firstName} ${form.lastName}`.trim()
      const submissionDetails = {
        name: fullName,
        email: form.email,
        category: form.inquiryType,
        timestamp: new Date().toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        })
      }
      setSubmittedData(submissionDetails)
      setSubmitOk(`Thanks ${fullName}! We received your ${form.inquiryType} request and will respond within 1 business day.`)
      
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        inquiryType: '',
        message: '',
      })
      
      setTimeout(() => {
        onClose()
        setView('options')
        setSubmittedData(null)
        setSubmitOk('')
      }, 4000)
    } catch (err) {
      setSubmitErr(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const supportCategories = [
    {
      id: 'Technical Support',
      icon: Bug,
      label: 'Technical Support',
      description: 'Bugs, errors, or features not working',
    },
    {
      id: 'Billing & Subscription',
      icon: CreditCard,
      label: 'Billing & Subscription',
      description: 'Plans, invoices, payments, upgrades',
    },
    {
      id: 'Account & Access',
      icon: UserCog,
      label: 'Account & Access',
      description: 'Login issues, password resets, permissions',
    },
    {
      id: 'Alerts & Notifications',
      icon: Bell,
      label: 'Alerts & Notifications',
      description: 'Saved searches, email alerts, settings',
    },
    {
      id: 'Sales & Services',
      icon: Briefcase,
      label: 'Sales & Services',
      description: 'Consulting, custom solutions, partnerships',
    },
    {
      id: 'Compliance & Security',
      icon: ShieldCheck,
      label: 'Compliance & Security',
      description: 'SAM registration, certifications, security',
    },
    {
      id: 'General Inquiry',
      icon: MessageSquare,
      label: 'General Inquiry',
      description: 'Questions, feedback, or other topics',
    },
    {
      id: 'Other',
      icon: FileQuestion,
      label: 'Other',
      description: 'Something else not listed above',
    },
  ]

  const selectedCategoryData = supportCategories.find(c => c.id === selectedCategory)
  const categoryColor = selectedCategory ? CATEGORY_COLORS[selectedCategory as keyof typeof CATEGORY_COLORS] : null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <button
        aria-label="Close support modal"
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={onClose}
        type="button"
      />

      {/* Modal - WIDER: max-w-6xl */}
      <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0B1633]/98 backdrop-blur-2xl shadow-2xl">
        {/* Dynamic gradient background based on selected category */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-3xl">
          {selectedCategoryData && categoryColor ? (
            <>
              <div 
                className="absolute -top-24 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full blur-3xl"
                style={{ background: `${categoryColor.primary}20` }}
              />
              <div 
                className="absolute top-[220px] right-[-160px] h-[520px] w-[520px] rounded-full blur-3xl"
                style={{ background: `${categoryColor.primary}15` }}
              />
              <div 
                className="absolute top-[420px] left-[-220px] h-[560px] w-[560px] rounded-full blur-3xl"
                style={{ background: `${categoryColor.primary}10` }}
              />
            </>
          ) : (
            <>
              <div className="absolute -top-24 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
              <div className="absolute top-[220px] right-[-160px] h-[520px] w-[520px] rounded-full bg-orange-400/12 blur-3xl" />
              <div className="absolute top-[420px] left-[-220px] h-[560px] w-[560px] rounded-full bg-cyan-400/10 blur-3xl" />
            </>
          )}
        </div>

        <div className="relative p-8 sm:p-10 text-white">
          <button
            onClick={onClose}
            type="button"
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/80 backdrop-blur-sm hover:bg-white/20 hover:text-white transition-all z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {view === 'options' ? (
            <>
              {/* Header with Logo */}
              <div className="flex items-start gap-6 mb-10">
                <div className="rounded-2xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-4 flex-shrink-0 shadow-xl">
                  <Image 
                    src="/precise-govcon-logo.jpg" 
                    alt="Precise GovCon" 
                    width={56} 
                    height={56}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <h3 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    Contact Support
                  </h3>
                  <p className="mt-3 text-xl text-white/70 max-w-2xl">
                    Choose a category below or contact us directly via phone, email, or schedule a meeting.
                  </p>
                </div>
              </div>

              {/* Support Categories Grid - 2 columns */}
              <div className="mb-10">
                <h4 className="text-base font-bold text-white/90 mb-5 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-full" />
                  Select Support Type:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {supportCategories.map((category) => {
                    const colors = CATEGORY_COLORS[category.id as keyof typeof CATEGORY_COLORS]
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className="group relative overflow-hidden rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
                        style={{
                          background: `linear-gradient(135deg, ${colors.bg}, rgba(255,255,255,0.05))`,
                          border: `1px solid ${colors.border}`,
                          boxShadow: `0 8px 32px ${colors.primary}10`,
                        }}
                      >
                        <div 
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                          style={{
                            background: `radial-gradient(circle at top right, ${colors.primary}20, transparent 70%)`,
                          }}
                        />
                        <div className="relative flex items-start gap-4">
                          <div 
                            className="rounded-xl p-3.5 flex-shrink-0 transition-all group-hover:scale-110 group-hover:shadow-lg"
                            style={{
                              background: `linear-gradient(135deg, ${colors.primary}30, ${colors.primary}10)`,
                              border: `1px solid ${colors.border}`,
                            }}
                          >
                            <Icon className="h-7 w-7" style={{ color: colors.light }} />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="font-bold text-xl text-white mb-1.5">{category.label}</div>
                              <ArrowRight 
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1" 
                                style={{ color: colors.light }} 
                              />
                            </div>
                            <p className="text-white/70 text-base leading-snug">{category.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Direct Contact Options */}
              <div className="border-t border-white/10 pt-8">
                <h4 className="text-base font-bold text-white/90 mb-5 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                  Or Contact Directly:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="group relative overflow-hidden rounded-xl border border-cyan-400/30 bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 p-5 text-left hover:shadow-lg transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <span className="rounded-xl border border-cyan-400/30 bg-cyan-500/20 p-3.5 group-hover:scale-110 transition-transform">
                        <Mail className="h-5 w-5 text-cyan-200" />
                      </span>
                      <div>
                        <div className="font-bold text-lg text-white">Email us</div>
                        <div className="text-sm text-white/65 break-all">{SUPPORT_EMAIL}</div>
                      </div>
                    </div>
                  </a>

                  <a
                    href={`tel:${SUPPORT_TEL.replace(/[^0-9+]/g, '')}`}
                    className="group relative overflow-hidden rounded-xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-5 text-left hover:shadow-lg transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <span className="rounded-xl border border-emerald-400/30 bg-emerald-500/20 p-3.5 group-hover:scale-110 transition-transform">
                        <Phone className="h-5 w-5 text-emerald-200" />
                      </span>
                      <div>
                        <div className="font-bold text-lg text-white">Call support</div>
                        <div className="text-sm text-white/65">{SUPPORT_TEL}</div>
                      </div>
                    </div>
                  </a>

                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-white/10 to-white/5 p-5 text-left hover:bg-white/15 transition-all hover:shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <span className="rounded-xl border border-white/25 bg-white/15 p-3.5 group-hover:scale-110 transition-transform">
                        <CalendarClock className="h-5 w-5 text-white/90" />
                      </span>
                      <div>
                        <div className="font-bold text-lg text-white">Book a meeting</div>
                        <div className="text-sm text-white/65">30-min consultation</div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-white/15 bg-black/30 p-5 text-base text-white/80 backdrop-blur-sm">
                <span className="font-black text-white mr-2">💡 Tip:</span> 
                For bugs, include the page URL + steps to reproduce. For billing, include your account email.
              </div>
            </>
          ) : (
            <>
              {/* Form View - Dynamic Colors */}
              <button
                onClick={handleBackToOptions}
                className="mb-8 inline-flex items-center gap-2 text-white/80 hover:text-white transition text-base font-semibold group"
              >
                <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
                Back to options
              </button>

              {selectedCategoryData && categoryColor && (
                <div className="flex items-start gap-6 mb-8">
                  <div 
                    className="rounded-2xl p-4 flex-shrink-0 shadow-xl"
                    style={{
                      background: `linear-gradient(135deg, ${categoryColor.primary}30, ${categoryColor.primary}10)`,
                      border: `1px solid ${categoryColor.border}`,
                    }}
                  >
                    <Image 
                      src="/precise-govcon-logo.jpg" 
                      alt="Precise GovCon" 
                      width={56} 
                      height={56}
                      className="rounded-xl"
                    />
                  </div>
                  <div>
                    <h3 
                      className="text-4xl sm:text-5xl font-black tracking-tight"
                      style={{ color: categoryColor.light }}
                    >
                      {selectedCategoryData.label}
                    </h3>
                    <p className="mt-3 text-xl text-white/70">{selectedCategoryData.description}</p>
                  </div>
                </div>
              )}

              {submitOk && submittedData ? (
                <div 
                  className="rounded-2xl border p-8 mb-6 text-center"
                  style={{
                    background: categoryColor ? `${categoryColor.primary}10` : 'rgba(124,179,66,0.1)',
                    borderColor: categoryColor ? categoryColor.border : 'rgba(124,179,66,0.3)',
                  }}
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: categoryColor ? `${categoryColor.primary}20` : 'rgba(124,179,66,0.2)' }}>
                    <CheckCircle2 className="h-10 w-10" style={{ color: categoryColor?.light || BRAND.greenLight }} />
                  </div>
                  <div className="font-bold text-2xl text-white mb-3">Message Sent Successfully!</div>
                  <p className="text-white/80 text-lg mb-6 max-w-xl mx-auto">{submitOk}</p>
                  <div className="inline-block text-left p-5 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10">
                    <div className="text-sm text-white/80 space-y-1.5">
                      <div><span className="font-semibold text-white">Name:</span> {submittedData.name}</div>
                      <div><span className="font-semibold text-white">Email:</span> {submittedData.email}</div>
                      <div><span className="font-semibold text-white">Category:</span> <span style={{ color: categoryColor?.light || BRAND.greenLight }}>{submittedData.category}</span></div>
                      <div><span className="font-semibold text-white">Submitted:</span> {submittedData.timestamp}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {submitErr && (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-5 flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-lg text-white mb-1">Error</div>
                        <p className="text-white/80 text-base">{submitErr}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-bold text-white mb-2">
                        First Name <span style={{ color: categoryColor?.light || BRAND.orange }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="w-full rounded-xl px-5 py-4 text-base text-white placeholder:text-white/40 outline-none transition-all bg-black/40 backdrop-blur-sm border-2 hover:bg-black/50 focus:bg-black/60 focus:shadow-xl"
                        style={{
                          borderColor: categoryColor?.border || 'rgba(124,179,66,0.3)',
                          borderLeftWidth: '4px',
                          borderLeftColor: categoryColor?.primary || BRAND.green,
                          boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.green}15`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = categoryColor?.primary || BRAND.green
                          e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.green}20, 0 8px 20px ${categoryColor?.primary || BRAND.green}25`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = categoryColor?.border || 'rgba(124,179,66,0.3)'
                          e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.green}15`
                        }}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-base font-bold text-white mb-2">
                        Last Name <span style={{ color: categoryColor?.light || BRAND.orange }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="w-full rounded-xl px-5 py-4 text-base text-white placeholder:text-white/40 outline-none transition-all bg-black/40 backdrop-blur-sm border-2 hover:bg-black/50 focus:bg-black/60 focus:shadow-xl"
                        style={{
                          borderColor: categoryColor?.border || 'rgba(124,179,66,0.3)',
                          borderLeftWidth: '4px',
                          borderLeftColor: categoryColor?.primary || BRAND.green,
                          boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.green}15`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = categoryColor?.primary || BRAND.green
                          e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.green}20, 0 8px 20px ${categoryColor?.primary || BRAND.green}25`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = categoryColor?.border || 'rgba(124,179,66,0.3)'
                          e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.green}15`
                        }}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-white mb-2">
                      Email <span style={{ color: categoryColor?.light || BRAND.orange }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl px-5 py-4 text-base text-white placeholder:text-white/40 outline-none transition-all bg-black/40 backdrop-blur-sm border-2 hover:bg-black/50 focus:bg-black/60 focus:shadow-xl"
                      style={{
                        borderColor: categoryColor?.border || 'rgba(124,179,66,0.3)',
                        borderLeftWidth: '4px',
                        borderLeftColor: categoryColor?.primary || BRAND.green,
                        boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.green}15`,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = categoryColor?.primary || BRAND.green
                        e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.green}20, 0 8px 20px ${categoryColor?.primary || BRAND.green}25`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = categoryColor?.border || 'rgba(124,179,66,0.3)'
                        e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.green}15`
                      }}
                      placeholder="john.doe@company.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-base font-bold text-white mb-2">
                        Phone <span className="text-white/40 text-sm font-normal ml-1">(optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full rounded-xl px-5 py-4 text-base text-white placeholder:text-white/40 outline-none transition-all bg-black/40 backdrop-blur-sm border-2 hover:bg-black/50 focus:bg-black/60 focus:shadow-xl"
                        style={{
                          borderColor: categoryColor?.border || 'rgba(124,179,66,0.3)',
                          borderLeftWidth: '4px',
                          borderLeftColor: categoryColor?.primary || BRAND.green,
                          boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.green}15`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = categoryColor?.primary || BRAND.green
                          e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.green}20, 0 8px 20px ${categoryColor?.primary || BRAND.green}25`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = categoryColor?.border || 'rgba(124,179,66,0.3)'
                          e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.green}15`
                        }}
                        placeholder="(555) 123-4567"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-bold text-white mb-2">
                        Company <span className="text-white/40 text-sm font-normal ml-1">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={form.company}
                        onChange={(e) => setForm({ ...form, company: e.target.value })}
                        className="w-full rounded-xl px-5 py-4 text-base text-white placeholder:text-white/40 outline-none transition-all bg-black/40 backdrop-blur-sm border-2 hover:bg-black/50 focus:bg-black/60 focus:shadow-xl"
                        style={{
                          borderColor: categoryColor?.border || 'rgba(124,179,66,0.3)',
                          borderLeftWidth: '4px',
                          borderLeftColor: categoryColor?.primary || BRAND.green,
                          boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.green}15`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = categoryColor?.primary || BRAND.green
                          e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.green}20, 0 8px 20px ${categoryColor?.primary || BRAND.green}25`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = categoryColor?.border || 'rgba(124,179,66,0.3)'
                          e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.green}15`
                        }}
                        placeholder="Your company name"
                      />
                    </div>
                  </div>

                  {/* ✅ FIXED: Message field is now OPTIONAL */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <label className="block text-base font-bold text-white">Message</label>
                      <span className="text-xs font-normal px-2 py-1 rounded-full border border-white/20 bg-white/10 text-white/70">optional</span>
                    </div>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={5}
                      className="w-full rounded-xl px-5 py-4 text-base text-white placeholder:text-white/40 outline-none transition-all bg-black/40 backdrop-blur-sm border-2 resize-none hover:bg-black/50 focus:bg-black/60 focus:shadow-xl"
                      style={{
                        borderColor: categoryColor?.border || 'rgba(124,179,66,0.3)',
                        borderLeftWidth: '4px',
                        borderLeftColor: categoryColor?.primary || BRAND.green,
                        boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.green}15`,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = categoryColor?.primary || BRAND.green
                        e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.green}20, 0 8px 20px ${categoryColor?.primary || BRAND.green}25`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = categoryColor?.border || 'rgba(124,179,66,0.3)'
                        e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.green}15`
                      }}
                      placeholder="Describe your issue or question in detail... (optional)"
                    />
                    <p className="mt-2 text-sm text-white/50 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/30" />
                      You can submit without a message - we'll follow up by email
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl px-6 py-5 text-lg font-black text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl"
                    style={{
                      background: categoryColor?.gradient || `linear-gradient(135deg, ${BRAND.green}, ${BRAND.cyan})`,
                      boxShadow: `0 8px 20px ${categoryColor?.primary || BRAND.green}40`,
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5" />
                        Send Message
                      </>
                    )}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

export default function SupportPage() {
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [form, setForm] = useState(initialForm())
  const [submitting, setSubmitting] = useState(false)
  const [submitOk, setSubmitOk] = useState('')
  const [submitErr, setSubmitErr] = useState('')

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitOk('')
    setSubmitErr('')

    const fullName = `${form.firstName} ${form.lastName}`.trim()
    if (!fullName || fullName.split(/\s+/).length < 2) {
      setSubmitErr('Please enter both first and last name.')
      scrollToId('support-form-feedback')
      return
    }
    if (!form.email.trim()) {
      setSubmitErr('Please enter your email address.')
      scrollToId('support-form-feedback')
      return
    }
    if (!form.inquiryType.trim()) {
      setSubmitErr('Please select an inquiry type.')
      scrollToId('support-form-feedback')
      return
    }
    // ✅ Message validation removed - it's now optional

    setSubmitting(true)
    try {
      const res = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setSubmitErr(data?.error || `Could not send your message. Please email ${SUPPORT_EMAIL}.`)
        scrollToId('support-form-feedback')
        return
      }

      setSubmitOk(`Thanks ${fullName}! We received your message and will respond soon.`)
      setForm(initialForm())
      scrollToId('support-form-feedback')
    } catch {
      setSubmitErr(`Network error. Please try again, or email ${SUPPORT_EMAIL}.`)
      scrollToId('support-form-feedback')
    } finally {
      setSubmitting(false)
    }
  }

  const topicCards = [
    {
      title: 'Billing & Subscription',
      desc: 'Invoices, renewals, upgrades/downgrades, and payment methods.',
      bullets: ['View invoices', 'Update payment method', 'Switch monthly/annual'],
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-200" />,
      href: '/account?tab=billing',
      accent: 'from-emerald-500/18 to-cyan-500/10',
      ring: 'hover:border-emerald-400/40',
      cta: 'Go to Billing →',
    },
    {
      title: 'Account & Access',
      desc: 'Profile settings, login issues, email verification, and permissions.',
      bullets: ['Update profile', 'Fix login issues', 'Verify your email'],
      icon: <ShieldCheck className="h-5 w-5 text-cyan-200" />,
      href: '/account?tab=profile',
      accent: 'from-cyan-500/18 to-emerald-500/10',
      ring: 'hover:border-cyan-400/40',
      cta: 'Go to Account →',
    },
    {
      title: 'Alerts & Saved Searches',
      desc: 'Tune your alerts, saved searches, and delivery frequency.',
      bullets: ['Edit frequency', 'Confirm alert is enabled', 'Troubleshoot delivery'],
      icon: <HelpCircle className="h-5 w-5 text-orange-200" />,
      href: '/alerts',
      accent: 'from-orange-500/18 to-cyan-500/10',
      ring: 'hover:border-orange-400/40',
      cta: 'Go to Alerts →',
    },
    {
      title: 'Report a Bug',
      desc: 'Something not loading or acting weird? Send details and screenshots.',
      bullets: ['Include page URL', 'Steps to reproduce', 'Expected vs actual'],
      icon: <AlertTriangle className="h-5 w-5 text-orange-200" />,
      href: '#contact',
      accent: 'from-orange-500/18 to-emerald-500/10',
      ring: 'hover:border-orange-400/40',
      cta: 'Open the Form ↓',
    },
  ] as const

  return (
    <main className="min-h-screen text-white">
      {/* Modal */}
      <SupportContactModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        onOpenForm={() => scrollToId('contact')}
      />

      {/* LIGHTER BACKGROUND + NEON GLOWS */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#0B1633] via-[#071028] to-[#050B1A]" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute top-[220px] right-[-160px] h-[520px] w-[520px] rounded-full bg-orange-400/18 blur-3xl" />
        <div className="absolute top-[420px] left-[-220px] h-[560px] w-[560px] rounded-full bg-cyan-400/12 blur-3xl" />
      </div>

      {/* HERO SECTION */}
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1760px] px-4 sm:px-6 lg:px-10 2xl:px-12 pt-12 pb-8">
        {/* HERO */}
        <div className="mb-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.05]">
              Get help fast — book a meeting or send a message.
            </h1>

            <p className="mt-5 text-xl sm:text-2xl text-white/75 max-w-2xl leading-relaxed">
              Billing questions, saved searches, alerts, or account access — we'll get you sorted. If you prefer not to
              book time, use the form and we'll respond within 1 business day.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#book"
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-7 py-4 text-lg font-extrabold text-slate-950 shadow-lg hover:from-emerald-400 hover:to-cyan-400 transition-all"
              >
                <CalendarClock className="h-6 w-6" />
                Book a 30-min meeting
              </a>

              <button
                type="button"
                onClick={() => setSupportModalOpen(true)}
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-7 py-4 text-lg font-extrabold text-white shadow-lg hover:from-orange-400 hover:to-orange-500 transition-all"
              >
                <Send className="h-6 w-6" />
                Send Us a message
              </button>
            </div>

            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap gap-4 text-base">
                <span className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5 backdrop-blur-sm">
                  Typical response: <span className="font-bold text-emerald-300">1 business day</span>
                </span>
                <span className="rounded-full border border-orange-400/20 bg-orange-500/10 px-5 py-2.5 backdrop-blur-sm">
                  Best for complex issues: <span className="font-bold text-orange-300">meeting</span>
                </span>
              </div>
              
              <div className="rounded-xl border border-orange-400/30 bg-gradient-to-r from-orange-500/10 to-orange-600/5 backdrop-blur-sm p-6 sm:p-8 mx-auto text-center">
                <p className="text-base sm:text-lg lg:text-xl font-black text-orange-400 leading-relaxed">
                  <span className="text-orange-300">⚡ Quick Tip:</span> Whether you're troubleshooting a technical issue, 
                  need help with billing, or have questions about our services, we're here to help. Choose the contact method 
                  that works best for you, and our team will get back to you promptly.
                </p>
              </div>
            </div>
          </div>

          {/* CONTACT CARD */}
          <div className="lg:col-span-4">
            <div
              id="contact"
              className="rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-7 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black">Contact Support</h2>
                  <p className="mt-2 text-lg text-white/70">Fastest ways to reach us.</p>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 p-3">
                  <ShieldCheck className="h-6 w-6 text-emerald-200" />
                </div>
              </div>

              <div className="mt-7 space-y-6 text-base">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 p-3.5 border border-cyan-400/30">
                    <Mail className="h-6 w-6 text-cyan-200" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold mb-1">Email</div>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-lg font-black text-cyan-200 hover:underline hover:text-cyan-100 transition"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 p-3.5 border border-emerald-400/30">
                    <Clock className="h-6 w-6 text-emerald-200" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold mb-1">Hours</div>
                    <div className="text-lg font-black">Mon–Fri • 9am–5pm ET</div>
                    <div className="text-white/65 text-sm mt-1">Response: usually within 1 business day</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 p-3.5 border border-orange-400/30">
                    <Phone className="h-6 w-6 text-orange-200" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold mb-1">Phone</div>
                    <a className="text-lg font-black text-orange-200 hover:underline hover:text-orange-100 transition" href={`tel:${SUPPORT_TEL.replace(/[^0-9+]/g, '')}`}>
                      {SUPPORT_TEL}
                    </a>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm p-5">
                  <div className="text-base text-white/80">
                    <span className="font-black text-white mr-1.5">💡 Tip:</span> 
                    Include your account email, the page URL, and what you expected to happen.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSupportModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-sm px-5 py-4 text-base font-black hover:bg-white/15 transition-all hover:shadow-lg"
                >
                  <Send className="h-5 w-5 text-orange-200" />
                  Open contact options
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TOPICS */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {topicCards.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className={cx(
                'group rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-7 transition-all',
                'hover:bg-white/10 hover:shadow-xl hover:-translate-y-1',
                t.ring
              )}
            >
              <div className={cx('rounded-xl border border-white/10 bg-gradient-to-br p-4 w-fit', t.accent)}>
                {t.icon}
              </div>

              <div className="mt-5 text-xl font-black">{t.title}</div>
              <div className="mt-3 text-base text-white/70 leading-relaxed">{t.desc}</div>

              <ul className="mt-5 space-y-2 text-sm text-white/65">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-300/70 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 text-base font-black text-emerald-200 group-hover:text-emerald-100 group-hover:translate-x-1 transition-all">
                {t.cta}
              </div>
            </Link>
          ))}
        </div>

        {/* CALENDLY EMBED */}
        <section id="book" className="rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-8">
          <div className="mb-6">
            <h2 className="text-3xl sm:text-4xl font-black">Book a Meeting</h2>
            <p className="mt-3 text-lg sm:text-xl text-white/70">
              Schedule a 30-minute call with our team. We'll walk through your questions and get you the help you need.
            </p>
          </div>

          <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 backdrop-blur-sm">
            <div className="relative w-full" style={{ paddingBottom: '100%', minHeight: '660px' }}>
              <iframe
                src={CALENDLY_URL}
                width="100%"
                height="100%"
                frameBorder="0"
                className="absolute inset-0"
                title="Schedule a meeting"
              />
            </div>
          </div>
        </section>
      </div>

      <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />
    </main>
  )
}