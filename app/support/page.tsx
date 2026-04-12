//app/support/page.tsx

'use client'

import { useEffect, useState } from 'react'
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

const CALENDLY_URL = 'https://calendly.com/precisegovcon/30min'
const CALENDLY_EMBED_URL =
  `${CALENDLY_URL}?embed_type=Inline&hide_gdpr_banner=1&hide_landing_page_details=1` +
  `&hide_event_type_details=0&primary_color=3f7f61&background_color=ffffff&text_color=0f172a`
const SUPPORT_EMAIL = 'support@precisegovcon.com'
const SUPPORT_TEL = '804-404-6005'

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ')
}

const BRAND = {
  primary: 'var(--color-primary)',
  primaryHover: 'var(--color-primary-hover)',
  light: 'var(--color-primary)',
}

const unifiedCategoryColor = {
  primary: BRAND.primary,
  light: BRAND.light,
  dark: BRAND.primaryHover,
  bg: 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
  border: 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))',
  gradient: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-hover))',
  input: 'bg-[var(--color-surface)] border-[var(--color-border)] focus:border-[var(--color-primary)] focus:ring-[var(--color-accent-soft)]',
  icon: 'text-[var(--color-primary)]',
}

const CATEGORY_COLORS = {
  'Technical Support': unifiedCategoryColor,
  'Billing & Subscription': unifiedCategoryColor,
  'Account & Access': unifiedCategoryColor,
  'Alerts & Notifications': unifiedCategoryColor,
  'Sales & Services': unifiedCategoryColor,
  'Compliance & Security': unifiedCategoryColor,
  'General Inquiry': unifiedCategoryColor,
  'Other': unifiedCategoryColor,
}

function SupportContactModal({
  isOpen,
  onClose,
  defaultCategory,
  defaultEmail,
  defaultMessage,
}: {
  isOpen: boolean
  onClose: () => void
  defaultCategory?: string
  defaultEmail?: string
  defaultMessage?: string
}) {
  const initialCategory = defaultCategory || ''
  const [view, setView] = useState<'options' | 'form'>(initialCategory ? 'form' : 'options')
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory)
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: defaultEmail || '',
    phone: '',
    company: '',
    inquiryType: initialCategory,
    message: defaultMessage || '',
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

  useEffect(() => {
    if (!isOpen) return
    const category = defaultCategory || ''
    setSelectedCategory(category)
    setView(category ? 'form' : 'options')
    setForm((prev) => ({
      ...prev,
      email: defaultEmail || prev.email,
      inquiryType: category || prev.inquiryType,
      message: defaultMessage || prev.message,
    }))
  }, [isOpen, defaultCategory, defaultEmail, defaultMessage])

  if (!isOpen) return null

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
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      {/* Modal - WIDER: max-w-6xl */}
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)]">
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
              <div className="absolute -top-24 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-[var(--color-accent-soft)] blur-3xl" />
              <div className="absolute top-[220px] right-[-160px] h-[520px] w-[520px] rounded-full bg-[var(--color-accent-soft)] blur-3xl" />
              <div className="absolute top-[420px] left-[-220px] h-[560px] w-[560px] rounded-full bg-[var(--color-accent-soft)] blur-3xl" />
            </>
          )}
        </div>

        <div className="relative p-6 sm:p-8 text-[var(--color-text-primary)]">
          <button
            onClick={onClose}
            type="button"
            className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-all z-10"
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
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--color-text-primary)]">
                    Contact Support
                  </h3>
                  <p className="mt-3 text-base sm:text-lg text-[var(--color-text-secondary)] max-w-2xl">
                    Choose a category below or contact us directly via phone, email, or schedule a meeting.
                  </p>
                </div>
              </div>

              {/* Support Categories Grid - 2 columns */}
              <div className="mb-10">
                <h4 className="text-base font-bold text-[var(--color-text-primary)] mb-5 uppercase tracking-wider flex items-center gap-2">
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
                          background: `linear-gradient(135deg, ${colors.bg}, color-mix(in srgb, var(--color-surface) 35%, transparent))`,
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
                              <div className="font-bold text-xl text-[var(--color-text-primary)] mb-1.5">{category.label}</div>
                              <ArrowRight 
                                className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-all transform translate-x-0 group-hover:translate-x-1" 
                                style={{ color: colors.light }} 
                              />
                            </div>
                            <p className="text-[var(--color-text-secondary)] text-base leading-snug">{category.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Direct Contact Options */}
              <div className="border-t border-white/10 pt-8">
                <h4 className="text-base font-bold text-[var(--color-text-primary)] mb-5 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-gradient-to-b from-orange-400 to-orange-500 rounded-full" />
                  Or Contact Directly:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="group relative overflow-hidden rounded-xl border border-cyan-300 bg-gradient-to-br from-cyan-100 to-cyan-50 p-5 text-left hover:shadow-lg transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <span className="rounded-xl border border-cyan-300 bg-cyan-200 p-3.5 group-hover:scale-110 transition-transform">
                        <Mail className="h-5 w-5 text-cyan-800" />
                      </span>
                      <div>
                        <div className="font-bold text-lg text-[var(--color-text-primary)]">Email us</div>
                        <div className="text-sm text-[var(--color-text-secondary)] break-all">{SUPPORT_EMAIL}</div>
                      </div>
                    </div>
                  </a>

                  <a
                    href={`tel:${SUPPORT_TEL.replace(/[^0-9+]/g, '')}`}
                    className="group relative overflow-hidden rounded-xl border border-emerald-300 bg-gradient-to-br from-emerald-100 to-emerald-50 p-5 text-left hover:shadow-lg transition-all"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <span className="rounded-xl border border-emerald-300 bg-emerald-200 p-3.5 group-hover:scale-110 transition-transform">
                        <Phone className="h-5 w-5 text-emerald-800" />
                      </span>
                      <div>
                        <div className="font-bold text-lg text-[var(--color-text-primary)]">Call support</div>
                        <div className="text-sm text-[var(--color-text-secondary)]">{SUPPORT_TEL}</div>
                      </div>
                    </div>
                  </a>

                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 text-left hover:bg-[var(--color-surface)] transition-all hover:shadow-lg"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-4">
                      <span className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 group-hover:scale-110 transition-transform">
                        <CalendarClock className="h-5 w-5 text-[var(--color-text-primary)]" />
                      </span>
                      <div>
                        <div className="font-bold text-lg text-[var(--color-text-primary)]">Book a meeting</div>
                        <div className="text-sm text-[var(--color-text-secondary)]">30-min consultation</div>
                      </div>
                    </div>
                  </a>
                </div>
              </div>

              <div className="mt-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5 text-base text-[var(--color-text-secondary)]">
                <span className="font-black text-[var(--color-text-primary)] mr-2">💡 Tip:</span> 
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
                      className="text-3xl sm:text-4xl font-black tracking-tight"
                      style={{ color: categoryColor.light }}
                    >
                      {selectedCategoryData.label}
                    </h3>
                    <p className="mt-3 text-base sm:text-lg text-white/70">{selectedCategoryData.description}</p>
                  </div>
                </div>
              )}

              {submitOk && submittedData ? (
                <div 
                  className="rounded-2xl border p-8 mb-6 text-center"
                  style={{
                    background: categoryColor ? `${categoryColor.primary}10` : 'color-mix(in srgb, var(--color-primary) 10%, transparent)',
                    borderColor: categoryColor ? categoryColor.border : 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))',
                  }}
                >
                  <div className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-4" style={{ background: categoryColor ? `${categoryColor.primary}20` : 'color-mix(in srgb, var(--color-primary) 20%, transparent)' }}>
                    <CheckCircle2 className="h-10 w-10" style={{ color: categoryColor?.light || BRAND.light }} />
                  </div>
                  <div className="font-bold text-2xl text-white mb-3">Message Sent Successfully!</div>
                  <p className="text-white/80 text-lg mb-6 max-w-xl mx-auto">{submitOk}</p>
                  <div className="inline-block text-left p-5 rounded-xl bg-black/30 backdrop-blur-sm border border-white/10">
                    <div className="text-sm text-white/80 space-y-1.5">
                      <div><span className="font-semibold text-white">Name:</span> {submittedData.name}</div>
                      <div><span className="font-semibold text-white">Email:</span> {submittedData.email}</div>
                      <div><span className="font-semibold text-white">Category:</span> <span style={{ color: categoryColor?.light || BRAND.light }}>{submittedData.category}</span></div>
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
                        First Name <span style={{ color: categoryColor?.light || BRAND.primary }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className="w-full rounded-xl px-5 py-4 text-base text-white placeholder:text-white/40 outline-none transition-all bg-black/40 backdrop-blur-sm border-2 hover:bg-black/50 focus:bg-black/60 focus:shadow-xl"
                        style={{
                          borderColor: categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))',
                          borderLeftWidth: '4px',
                          borderLeftColor: categoryColor?.primary || BRAND.primary,
                          boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = categoryColor?.primary || BRAND.primary
                          e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.primary}20, 0 8px 20px ${categoryColor?.primary || BRAND.primary}25`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))'
                          e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`
                        }}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-base font-bold text-white mb-2">
                        Last Name <span style={{ color: categoryColor?.light || BRAND.primary }}>*</span>
                      </label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className="w-full rounded-xl px-5 py-4 text-base text-white placeholder:text-white/40 outline-none transition-all bg-black/40 backdrop-blur-sm border-2 hover:bg-black/50 focus:bg-black/60 focus:shadow-xl"
                        style={{
                          borderColor: categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))',
                          borderLeftWidth: '4px',
                          borderLeftColor: categoryColor?.primary || BRAND.primary,
                          boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = categoryColor?.primary || BRAND.primary
                          e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.primary}20, 0 8px 20px ${categoryColor?.primary || BRAND.primary}25`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))'
                          e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`
                        }}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-white mb-2">
                      Email <span style={{ color: categoryColor?.light || BRAND.primary }}>*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full rounded-xl px-5 py-4 text-base text-white placeholder:text-white/40 outline-none transition-all bg-black/40 backdrop-blur-sm border-2 hover:bg-black/50 focus:bg-black/60 focus:shadow-xl"
                      style={{
                        borderColor: categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))',
                        borderLeftWidth: '4px',
                        borderLeftColor: categoryColor?.primary || BRAND.primary,
                        boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = categoryColor?.primary || BRAND.primary
                        e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.primary}20, 0 8px 20px ${categoryColor?.primary || BRAND.primary}25`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))'
                        e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`
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
                          borderColor: categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))',
                          borderLeftWidth: '4px',
                          borderLeftColor: categoryColor?.primary || BRAND.primary,
                          boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = categoryColor?.primary || BRAND.primary
                          e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.primary}20, 0 8px 20px ${categoryColor?.primary || BRAND.primary}25`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))'
                          e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`
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
                          borderColor: categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))',
                          borderLeftWidth: '4px',
                          borderLeftColor: categoryColor?.primary || BRAND.primary,
                          boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`,
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = categoryColor?.primary || BRAND.primary
                          e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.primary}20, 0 8px 20px ${categoryColor?.primary || BRAND.primary}25`
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))'
                          e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`
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
                        borderColor: categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))',
                        borderLeftWidth: '4px',
                        borderLeftColor: categoryColor?.primary || BRAND.primary,
                        boxShadow: `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`,
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = categoryColor?.primary || BRAND.primary
                        e.target.style.boxShadow = `0 0 0 3px ${categoryColor?.primary || BRAND.primary}20, 0 8px 20px ${categoryColor?.primary || BRAND.primary}25`
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = categoryColor?.border || 'color-mix(in srgb, var(--color-primary) 24%, var(--color-border))'
                        e.target.style.boxShadow = `0 4px 12px ${categoryColor?.primary || BRAND.primary}15`
                      }}
                      placeholder="Describe your issue or question in detail... (optional)"
                    />
                    <p className="mt-2 text-sm text-white/50 flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-white/30" />
                      You can submit without a message - we&apos;ll follow up by email
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl px-6 py-5 text-lg font-black text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl"
                    style={{
                      background: categoryColor?.gradient || `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`,
                      boxShadow: `0 8px 20px ${categoryColor?.primary || BRAND.primary}40`,
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

export default function SupportPage() {
  const [supportModalOpen, setSupportModalOpen] = useState(false)
  const [prefillCategory, setPrefillCategory] = useState('')
  const [prefillEmail, setPrefillEmail] = useState('')
  const [prefillMessage, setPrefillMessage] = useState('')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const shouldOpen = params.get('openContact') === '1'
    setPrefillCategory(params.get('category') || '')
    setPrefillEmail(params.get('email') || '')
    setPrefillMessage(params.get('message') || '')
    if (shouldOpen) setSupportModalOpen(true)
  }, [])


  const topicCards = [
    {
      title: 'Support Center | PreciseGovCon',
      desc: 'Invoices, renewals, upgrades/downgrades, and payment methods.',
      bullets: ['View invoices', 'Update payment method', 'Switch monthly/annual'],
      icon: <CheckCircle2 className="h-5 w-5 text-[var(--color-text-primary)]" />,
      href: '/account?tab=billing',
      accent: 'from-emerald-500/18 to-cyan-500/10',
      ring: 'hover:border-emerald-400/40',
      cta: 'Go to Billing →',
    },
    {
      title: 'Support Center | PreciseGovCon',
      desc: 'Profile settings, login issues, email verification, and permissions.',
      bullets: ['Update profile', 'Fix login issues', 'Verify your email'],
      icon: <ShieldCheck className="h-5 w-5 text-[var(--color-text-primary)]" />,
      href: '/account?tab=profile',
      accent: 'from-cyan-500/18 to-emerald-500/10',
      ring: 'hover:border-cyan-400/40',
      cta: 'Go to Account →',
    },
    {
      title: 'Support Center | PreciseGovCon',
      desc: 'Tune your alerts, saved searches, and delivery frequency.',
      bullets: ['Edit frequency', 'Confirm alert is enabled', 'Troubleshoot delivery'],
      icon: <HelpCircle className="h-5 w-5 text-[var(--color-text-primary)]" />,
      href: '/alerts',
      accent: 'from-orange-500/18 to-cyan-500/10',
      ring: 'hover:border-orange-400/40',
      cta: 'Go to Alerts →',
    },
    {
      title: 'Support Center | PreciseGovCon',
      desc: 'Something not loading or acting weird? Send details and screenshots.',
      bullets: ['Include page URL', 'Steps to reproduce', 'Expected vs actual'],
      icon: <AlertTriangle className="h-5 w-5 text-[var(--color-text-primary)]" />,
      href: '#contact',
      accent: 'from-orange-500/18 to-emerald-500/10',
      ring: 'hover:border-orange-400/40',
      cta: 'Open the Form ↓',
    },
  ] as const

  return (
    <main className="pg-theme-cleanup pg-support-modern min-h-screen text-[15px] sm:text-base text-[var(--color-text-primary)]">
      {/* Modal */}
      <SupportContactModal
        isOpen={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        defaultCategory={prefillCategory}
        defaultEmail={prefillEmail}
        defaultMessage={prefillMessage}
      />

      {/* LIGHTER BACKGROUND + NEON GLOWS */}
      <div className="fixed inset-0 -z-20 bg-transparent" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-[var(--color-accent-soft)]/80 blur-3xl" />
        <div className="absolute top-[220px] right-[-160px] h-[520px] w-[520px] rounded-full bg-[var(--color-accent-soft)]/60 blur-3xl" />
        <div className="absolute top-[420px] left-[-220px] h-[560px] w-[560px] rounded-full bg-[var(--color-accent-soft)]/45 blur-3xl" />
      </div>

      {/* HERO SECTION */}
      <div className="mx-auto max-w-480 px-3 sm:px-5 lg:px-6 pt-4 pb-4">
        {/* HERO */}
        <div className="mb-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          <div className="lg:col-span-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-[1.08] mt-0">
              Get help fast — book a meeting or send a message.
            </h1>

            <p className="mt-3 text-lg sm:text-xl text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
              Billing questions, saved searches, alerts, or account access — we&apos;ll get you sorted. If you prefer not to
              book time, use the form and we&apos;ll respond within 1 business day.
            </p>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <a
                href="#book"
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-700 px-5 py-3.5 text-base font-extrabold text-white shadow-lg transition-all hover:bg-emerald-800"
              >
                <CalendarClock className="h-5 w-5 text-white" />
                Book a 30-min meeting
              </a>

              <button
                type="button"
                onClick={() => setSupportModalOpen(true)}
                className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-orange-600 px-5 py-3.5 text-base font-extrabold text-white shadow-lg transition-all hover:bg-orange-700"
              >
                <Send className="h-5 w-5 text-white" />
                Send Us a message
              </button>

              <div className="inline-flex items-center justify-center rounded-xl border border-emerald-700 bg-emerald-700 px-4 py-3.5 text-sm sm:text-base font-bold text-white shadow-sm">
                Typical response: <span className="ml-1.5 font-black text-white">1 business day</span>
              </div>

              <div className="inline-flex items-center justify-center rounded-xl border border-orange-700 bg-orange-600 px-4 py-3.5 text-sm sm:text-base font-bold text-white shadow-sm">
                Best for complex issues: <span className="ml-1.5 font-black text-white">meeting</span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] backdrop-blur-sm p-4 sm:p-5 mx-auto text-center">
                <p className="text-sm sm:text-base lg:text-lg font-bold text-[var(--color-text-primary)] leading-relaxed">
                  <span className="text-[var(--color-primary)]">Quick Tip:</span> Whether you&apos;re troubleshooting a technical issue, 
                  need help with billing, or have questions about our services, we&apos;re here to help. Choose the contact method 
                  that works best for you, and our team will get back to you promptly.
                </p>
              </div>

              {/* CALENDLY — right below Quick Tip */}
              <div id="book" className="mt-4 rounded-xl overflow-hidden border border-[var(--color-border)]">
                <div className="px-4 pt-4 pb-2 bg-[var(--color-surface-muted)]">
                  <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary)]">Book a Meeting</h2>
                  <p className="mt-1 text-sm sm:text-base text-[var(--color-text-secondary)]">
                    Schedule a 30-minute call. We&apos;ll walk through your questions and get you the help you need.
                  </p>
                </div>
                <div className="h-[700px] w-full bg-white sm:h-[760px]">
                  <iframe
                    src={CALENDLY_EMBED_URL}
                    title="Book a meeting with PreciseGovCon"
                    className="h-full w-full border-0"
                    loading="lazy"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CONTACT CARD */}
          <div className="lg:col-span-4">
            <div
              id="contact"
              className="rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-5 sm:p-6 shadow-[var(--shadow-lg)] h-full flex flex-col"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-black">Contact Support</h2>
                  <p className="mt-1.5 text-base text-white/70">Fastest ways to reach us.</p>
                </div>
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-soft)] p-3">
                  <ShieldCheck className="h-6 w-6 text-[var(--color-text-primary)]" />
                </div>
              </div>

              <div className="mt-6 flex flex-1 flex-col gap-5 text-sm sm:text-base">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-xl bg-[var(--color-accent-soft)] p-3.5 border border-[var(--color-border)]">
                    <Mail className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold mb-1">Email</div>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-base sm:text-lg font-black text-cyan-200 hover:underline hover:text-cyan-100 transition"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-xl bg-[var(--color-accent-soft)] p-3.5 border border-[var(--color-border)]">
                    <Clock className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold mb-1">Hours</div>
                    <div className="text-base sm:text-lg font-black">Mon–Fri • 9am–5pm ET</div>
                    <div className="text-white/65 text-sm mt-1">Response: usually within 1 business day</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-xl bg-[var(--color-accent-soft)] p-3.5 border border-[var(--color-border)]">
                    <Phone className="h-6 w-6 text-[var(--color-primary)]" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold mb-1">Phone</div>
                    <a className="text-base sm:text-lg font-black text-orange-200 hover:underline hover:text-orange-100 transition" href={`tel:${SUPPORT_TEL.replace(/[^0-9+]/g, '')}`}>
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
                  className="w-full inline-flex items-center justify-center gap-2.5 rounded-xl border border-emerald-700 bg-emerald-700 px-4 py-3 text-sm sm:text-base font-black text-white shadow-lg hover:bg-emerald-800 transition-all hover:shadow-xl"
                >
                  <Send className="h-5 w-5 text-white" />
                  Open contact options
                </button>

                {/* Reassurance message below button */}
                <div
                  className="flex-1 rounded-xl border border-orange-800 bg-orange-700 p-5 flex flex-col justify-between gap-4 text-white shadow-lg"
                  style={{ color: '#ffffff' }}
                >
                  <p className="text-xl font-black text-white leading-snug" style={{ color: '#ffffff' }}>
                    🤝 We&apos;re happy to help — no issue is too big or too small.
                  </p>
                  <p className="text-base font-bold text-white/90 leading-relaxed" style={{ color: '#ffffff' }}>
                    Whether you prefer a quick email, a phone call, or a dedicated 30-minute meeting, 
                    our team will make sure you get the support you need to keep winning contracts.
                  </p>
                  <p className="text-base font-bold text-white/90 leading-relaxed" style={{ color: '#ffffff' }}>
                    Our specialists understand federal contracting inside and out. 
                    Bring your questions on SAM.gov registration, set-aside certifications, 
                    proposal strategy, or platform features — we&apos;ve got you covered.
                  </p>
                  <p className="text-base font-black text-white leading-relaxed" style={{ color: '#ffffff' }}>
                    📅 Schedule a meeting and let us walk you through your questions one-on-one — 
                    we&apos;re here every step of the way.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TOPICS */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {topicCards.map((t) => (
            <Link
              key={`${t.title}-${t.href}`}
              href={t.href}
              className={cx(
                'group rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-5 transition-all',
                'hover:bg-white/10 hover:shadow-xl hover:-translate-y-1',
                t.ring
              )}
            >
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-accent-soft)] p-3.5 w-fit">
                {t.icon}
              </div>

              <div className="mt-4 text-lg font-black">{t.title}</div>
              <div className="mt-2 text-sm sm:text-base text-white/70 leading-relaxed">{t.desc}</div>

              <ul className="mt-5 space-y-2 text-sm text-white/65">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 text-sm sm:text-base font-black text-emerald-700 group-hover:text-emerald-800 group-hover:translate-x-1 transition-all">
                {t.cta}
              </div>
            </Link>
          ))}
        </div>


      </div>
    </main>
  )
}
