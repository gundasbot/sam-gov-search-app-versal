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
    subject: '',
    priority: 'normal',
    message: defaultMessage || '',
  })
  const [ticketRef] = useState(() => 'PGC-' + Math.random().toString(36).substring(2, 8).toUpperCase())
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
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.inquiryType || !form.subject.trim()) {
      setSubmitErr('Please fill in all required fields (First Name, Last Name, Email, Subject, and Inquiry Type).')
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
        subject: '',
        priority: 'normal',
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
    <div className="pg-support-ticket-modal fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
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
          {view === 'options' && (
            <button
              onClick={onClose}
              type="button"
              className="absolute right-5 top-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] transition-all z-10"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          )}

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
              {/* Ticket Header Bar */}
              <div className="-mx-6 sm:-mx-8 -mt-6 sm:-mt-8 mb-0 px-5 sm:px-7 py-3.5 bg-[#0f1f3d] rounded-t-3xl flex items-center justify-between gap-3 border-b border-white/10">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={handleBackToOptions}
                    type="button"
                    className="inline-flex items-center gap-1.5 text-white/70 hover:text-white transition text-sm font-semibold flex-shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </button>
                  <span className="text-white/20">|</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Image
                      src="/precise-govcon-logo.jpg"
                      alt="Precise GovCon"
                      width={24}
                      height={24}
                      className="rounded-md flex-shrink-0"
                    />
                    <span className="text-white font-bold text-sm truncate hidden sm:block">PreciseGovCon Support</span>
                  </div>
                  {selectedCategoryData && (
                    <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30">
                      {selectedCategoryData.label}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="hidden sm:inline text-white/40 text-xs font-mono">{ticketRef}</span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    New Ticket
                  </span>
                  <button
                    onClick={onClose}
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/20 bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-all"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Status Bar */}
              <div className="-mx-6 sm:-mx-8 px-5 sm:px-7 py-2.5 bg-[#162040] border-b border-white/10 flex items-center gap-5 flex-wrap text-xs text-white/60 mb-6">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                  <span>SLA: <span className="font-bold text-white/80">1 business day</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>Hours: <span className="font-bold text-white/80">Mon–Fri 9am–5pm ET</span></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-orange-400" />
                  <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-white/80 hover:text-white transition">{SUPPORT_EMAIL}</a>
                </div>
              </div>

              {submitOk && submittedData ? (
                <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 mb-4">
                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div className="font-bold text-2xl text-white mb-2">Ticket Submitted!</div>
                  <p className="text-white/70 text-base mb-6 max-w-md mx-auto">{submitOk}</p>
                  <div className="inline-block text-left p-5 rounded-xl bg-black/30 border border-white/10 text-sm text-white/80 space-y-2">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="font-mono text-emerald-400 font-bold text-base">{ticketRef}</span>
                      <span className="text-white/40 text-xs">— save this reference</span>
                    </div>
                    <div><span className="font-semibold text-white">Name:</span> {submittedData.name}</div>
                    <div><span className="font-semibold text-white">Email:</span> {submittedData.email}</div>
                    <div><span className="font-semibold text-white">Category:</span> {submittedData.category}</div>
                    <div><span className="font-semibold text-white">Submitted:</span> {submittedData.timestamp}</div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Main Form */}
                    <div className="flex-1 min-w-0 space-y-5">
                      {submitErr && (
                        <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-4 flex items-start gap-3">
                          <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-bold text-white text-sm mb-0.5">Submission Error</div>
                            <p className="text-white/80 text-sm">{submitErr}</p>
                          </div>
                        </div>
                      )}

                      {/* Contact Information */}
                      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                          <UserCog className="h-4 w-4 text-[var(--color-primary)]" />
                          <h4 className="font-bold text-xs text-white/70 uppercase tracking-wider">Contact Information</h4>
                        </div>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                                First Name <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={form.firstName}
                                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-all bg-black/30 border border-white/15 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                                placeholder="First name"
                                required
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                                Last Name <span className="text-red-400">*</span>
                              </label>
                              <input
                                type="text"
                                value={form.lastName}
                                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-all bg-black/30 border border-white/15 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                                placeholder="Last name"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-semibold text-white/80 mb-1.5">
                              Email Address <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="email"
                              value={form.email}
                              onChange={(e) => setForm({ ...form, email: e.target.value })}
                              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-all bg-black/30 border border-white/15 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                              placeholder="your@email.com"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                                Phone <span className="text-white/40 font-normal text-xs">(optional)</span>
                              </label>
                              <input
                                type="tel"
                                value={form.phone}
                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-all bg-black/30 border border-white/15 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                                placeholder="(555) 123-4567"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-semibold text-white/80 mb-1.5">
                                Company <span className="text-white/40 font-normal text-xs">(optional)</span>
                              </label>
                              <input
                                type="text"
                                value={form.company}
                                onChange={(e) => setForm({ ...form, company: e.target.value })}
                                className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-all bg-black/30 border border-white/15 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                                placeholder="Your company"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ticket Details */}
                      <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-white/10">
                          <FileQuestion className="h-4 w-4 text-[var(--color-primary)]" />
                          <h4 className="font-bold text-xs text-white/70 uppercase tracking-wider">Ticket Details</h4>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-white/80 mb-1.5">
                              Subject <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={form.subject}
                              onChange={(e) => setForm({ ...form, subject: e.target.value })}
                              className="w-full rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none transition-all bg-black/30 border border-white/15 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20"
                              placeholder="Brief summary of your issue"
                              required
                            />
                          </div>

                          <div>
                            <label className="block text-sm font-semibold text-white/80 mb-2">Priority</label>
                            <div className="grid grid-cols-4 gap-2">
                              {([
                                { val: 'low',    label: 'Low',    activeClass: 'bg-slate-500 text-white border-slate-400 opacity-100',   inactiveClass: 'text-slate-400 border-slate-600 bg-transparent opacity-60 hover:opacity-90' },
                                { val: 'normal', label: 'Normal', activeClass: 'bg-blue-500 text-white border-blue-400 opacity-100',     inactiveClass: 'text-blue-400 border-blue-700 bg-transparent opacity-60 hover:opacity-90' },
                                { val: 'high',   label: 'High',   activeClass: 'bg-orange-500 text-white border-orange-400 opacity-100', inactiveClass: 'text-orange-400 border-orange-700 bg-transparent opacity-60 hover:opacity-90' },
                                { val: 'urgent', label: 'Urgent', activeClass: 'bg-red-500 text-white border-red-400 opacity-100',       inactiveClass: 'text-red-400 border-red-700 bg-transparent opacity-60 hover:opacity-90' },
                              ] as const).map(({ val, label, activeClass, inactiveClass }) => (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => setForm({ ...form, priority: val })}
                                  className={`rounded-lg py-2 text-xs font-bold border transition-all ${form.priority === val ? activeClass : inactiveClass}`}
                                >
                                  {label}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="block text-sm font-semibold text-white/80">Description</label>
                              <span className="text-xs text-white/40">optional</span>
                            </div>
                            <textarea
                              value={form.message}
                              onChange={(e) => setForm({ ...form, message: e.target.value })}
                              rows={5}
                              className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-all bg-black/30 border border-white/15 focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 resize-none"
                              placeholder="Describe your issue in detail. Include steps to reproduce, error messages, or any relevant context..."
                            />
                            <p className="mt-1.5 text-xs text-white/40">You can submit without a description — we&apos;ll follow up by email.</p>
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl px-6 py-4 text-base font-black text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 shadow-lg"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Submitting ticket...
                          </>
                        ) : (
                          <>
                            <Send className="h-5 w-5" />
                            Submit Support Ticket
                          </>
                        )}
                      </button>
                    </div>

                    {/* Right Sidebar */}
                    <div className="w-full lg:w-60 xl:w-64 flex-shrink-0 space-y-4">
                      {/* SLA Card */}
                      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                          <span className="font-bold text-sm text-emerald-300">SLA Commitment</span>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-white/60">Standard</span>
                            <span className="font-bold text-white">1 business day</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-white/60">Urgent</span>
                            <span className="font-bold text-orange-300">Same day</span>
                          </div>
                          <div className="border-t border-white/10 pt-2 text-xs text-white/40">
                            Mon–Fri, 9am–5pm ET
                          </div>
                        </div>
                      </div>

                      {/* Direct Contact */}
                      <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="font-bold text-xs text-white/50 uppercase tracking-wider mb-3">Direct Contact</div>
                        <div className="space-y-3">
                          <a href={`mailto:${SUPPORT_EMAIL}`} className="flex items-center gap-3 group">
                            <div className="rounded-lg bg-cyan-500/15 border border-cyan-500/30 p-2 flex-shrink-0">
                              <Mail className="h-4 w-4 text-cyan-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs text-white/40">Email</div>
                              <div className="text-xs font-semibold text-cyan-300 group-hover:text-cyan-200 transition truncate">{SUPPORT_EMAIL}</div>
                            </div>
                          </a>
                          <a href={`tel:${SUPPORT_TEL.replace(/[^0-9+]/g, '')}`} className="flex items-center gap-3 group">
                            <div className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 p-2 flex-shrink-0">
                              <Phone className="h-4 w-4 text-emerald-400" />
                            </div>
                            <div>
                              <div className="text-xs text-white/40">Phone</div>
                              <div className="text-xs font-semibold text-emerald-300 group-hover:text-emerald-200 transition">{SUPPORT_TEL}</div>
                            </div>
                          </a>
                          <a href={CALENDLY_URL} target="_blank" rel="noreferrer" className="flex items-center gap-3 group">
                            <div className="rounded-lg bg-purple-500/15 border border-purple-500/30 p-2 flex-shrink-0">
                              <CalendarClock className="h-4 w-4 text-purple-400" />
                            </div>
                            <div>
                              <div className="text-xs text-white/40">Schedule</div>
                              <div className="text-xs font-semibold text-purple-300 group-hover:text-purple-200 transition">30-min meeting</div>
                            </div>
                          </a>
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <HelpCircle className="h-4 w-4 text-amber-400" />
                          <span className="font-bold text-sm text-amber-300">Tips</span>
                        </div>
                        <ul className="space-y-2 text-xs text-white/70">
                          <li className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            For bugs, include the page URL and steps to reproduce
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            For billing issues, include your account email
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            Screenshots speed up resolution
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                            Mark Urgent only for business-critical issues
                          </li>
                        </ul>
                      </div>

                      {/* Ticket Reference */}
                      <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-center">
                        <div className="text-xs text-white/30 mb-1">Ticket reference</div>
                        <div className="font-mono font-bold text-white/70 text-sm">{ticketRef}</div>
                      </div>
                    </div>
                  </div>
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
