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

    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !form.inquiryType || !form.message.trim()) {
      setSubmitErr('Please fill in all required fields.')
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
      
      // Clear form fields but keep the success message visible
      setForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        company: '',
        inquiryType: '',
        message: '',
      })
      
      // Auto-close after success (increased time to read confirmation)
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
      color: 'red',
      label: 'Technical Support',
      description: 'Bugs, errors, or features not working',
    },
    {
      id: 'Billing & Subscription',
      icon: CreditCard,
      color: 'blue',
      label: 'Billing & Subscription',
      description: 'Plans, invoices, payments, upgrades',
    },
    {
      id: 'Account & Access',
      icon: UserCog,
      color: 'purple',
      label: 'Account & Access',
      description: 'Login issues, password resets, permissions',
    },
    {
      id: 'Alerts & Notifications',
      icon: Bell,
      color: 'yellow',
      label: 'Alerts & Notifications',
      description: 'Saved searches, email alerts, settings',
    },
    {
      id: 'Sales & Services',
      icon: Briefcase,
      color: 'green',
      label: 'Sales & Services',
      description: 'Consulting, custom solutions, partnerships',
    },
    {
      id: 'Compliance & Security',
      icon: ShieldCheck,
      color: 'indigo',
      label: 'Compliance & Security',
      description: 'SAM registration, certifications, security',
    },
    {
      id: 'General Inquiry',
      icon: MessageSquare,
      color: 'cyan',
      label: 'General Inquiry',
      description: 'Questions, feedback, or other topics',
    },
    {
      id: 'Other',
      icon: FileQuestion,
      color: 'gray',
      label: 'Other',
      description: 'Something else not listed above',
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; bg: string; icon: string; hover: string; input: string; inputFocus: string }> = {
      red: { 
        border: 'border-red-400/30', 
        bg: 'bg-red-500/10', 
        icon: 'text-red-300', 
        hover: 'hover:bg-red-500/20',
        input: 'border-red-400/30 bg-red-500/5',
        inputFocus: 'focus:border-red-400/60 focus:ring-red-500/20'
      },
      blue: { 
        border: 'border-blue-400/30', 
        bg: 'bg-blue-500/10', 
        icon: 'text-blue-300', 
        hover: 'hover:bg-blue-500/20',
        input: 'border-blue-400/30 bg-blue-500/5',
        inputFocus: 'focus:border-blue-400/60 focus:ring-blue-500/20'
      },
      purple: { 
        border: 'border-purple-400/30', 
        bg: 'bg-purple-500/10', 
        icon: 'text-purple-300', 
        hover: 'hover:bg-purple-500/20',
        input: 'border-purple-400/30 bg-purple-500/5',
        inputFocus: 'focus:border-purple-400/60 focus:ring-purple-500/20'
      },
      yellow: { 
        border: 'border-yellow-400/30', 
        bg: 'bg-yellow-500/10', 
        icon: 'text-yellow-300', 
        hover: 'hover:bg-yellow-500/20',
        input: 'border-yellow-400/30 bg-yellow-500/5',
        inputFocus: 'focus:border-yellow-400/60 focus:ring-yellow-500/20'
      },
      green: { 
        border: 'border-emerald-400/30', 
        bg: 'bg-emerald-500/10', 
        icon: 'text-emerald-300', 
        hover: 'hover:bg-emerald-500/20',
        input: 'border-emerald-400/30 bg-emerald-500/5',
        inputFocus: 'focus:border-emerald-400/60 focus:ring-emerald-500/20'
      },
      indigo: { 
        border: 'border-indigo-400/30', 
        bg: 'bg-indigo-500/10', 
        icon: 'text-indigo-300', 
        hover: 'hover:bg-indigo-500/20',
        input: 'border-indigo-400/30 bg-indigo-500/5',
        inputFocus: 'focus:border-indigo-400/60 focus:ring-indigo-500/20'
      },
      cyan: { 
        border: 'border-cyan-400/30', 
        bg: 'bg-cyan-500/10', 
        icon: 'text-cyan-300', 
        hover: 'hover:bg-cyan-500/20',
        input: 'border-cyan-400/30 bg-cyan-500/5',
        inputFocus: 'focus:border-cyan-400/60 focus:ring-cyan-500/20'
      },
      gray: { 
        border: 'border-white/20', 
        bg: 'bg-white/5', 
        icon: 'text-white/70', 
        hover: 'hover:bg-white/10',
        input: 'border-white/20 bg-white/5',
        inputFocus: 'focus:border-white/40 focus:ring-white/10'
      },
    }
    return colors[color] || colors.gray
  }

  const selectedCategoryData = supportCategories.find(c => c.id === selectedCategory)
  const categoryColors = selectedCategoryData ? getColorClasses(selectedCategoryData.color) : null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <button
        aria-label="Close support modal"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        type="button"
      />

      {/* Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-white/12 bg-[#0B1633]/95 backdrop-blur-xl shadow-[0_20px_80px_-40px_rgba(0,0,0,0.9)]">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-24 left-1/2 h-[360px] w-[720px] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />
          <div className="absolute top-[120px] right-[-140px] h-[360px] w-[360px] rounded-full bg-orange-400/15 blur-3xl" />
          <div className="absolute top-[260px] left-[-160px] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-3xl" />
        </div>

        <div className="relative p-6 sm:p-8 text-white">
          <button
            onClick={onClose}
            type="button"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 hover:bg-white/10 hover:text-white transition z-10"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {view === 'options' ? (
            <>
              {/* Header with Logo */}
              <div className="flex items-start gap-5 mb-8">
                <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-3 flex-shrink-0">
                  <Image 
                    src="/icon-192x192.png" 
                    alt="PreciseGovCon" 
                    width={48} 
                    height={48}
                    className="rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight">Contact Support</h3>
                  <p className="mt-2 text-lg text-white/70">
                    Choose a category below or contact us directly via phone, email, or schedule a meeting.
                  </p>
                </div>
              </div>

              {/* Support Categories Grid */}
              <div className="mb-8">
                <h4 className="text-base font-bold text-white/90 mb-4 uppercase tracking-wide">Select Support Type:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {supportCategories.map((category) => {
                    const colorClasses = getColorClasses(category.color)
                    const Icon = category.icon
                    return (
                      <button
                        key={category.id}
                        onClick={() => handleCategoryClick(category.id)}
                        className={`group rounded-xl border ${colorClasses.border} ${colorClasses.bg} p-5 text-left ${colorClasses.hover} transition-all`}
                      >
                        <div className="flex items-start gap-3">
                          <Icon className={`h-6 w-6 ${colorClasses.icon} mt-0.5 flex-shrink-0`} />
                          <div>
                            <div className="font-bold text-white text-base mb-1">{category.label}</div>
                            <p className="text-white/60 text-sm leading-snug">{category.description}</p>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Direct Contact Options */}
              <div className="border-t border-white/10 pt-6 mt-2">
                <h4 className="text-base font-bold text-white/90 mb-4 uppercase tracking-wide">Or Contact Directly:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <a
                    href={`mailto:${SUPPORT_EMAIL}`}
                    className="group inline-flex items-center justify-between gap-3 rounded-xl border border-cyan-400/25 bg-cyan-500/10 px-4 py-4 text-left hover:bg-cyan-500/15 transition"
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className="rounded-lg border border-cyan-400/25 bg-cyan-500/10 p-2.5">
                        <Mail className="h-5 w-5 text-cyan-200" />
                      </span>
                      <span>
                        <div className="font-bold text-base">Email us</div>
                        <div className="text-xs text-white/65 break-all">{SUPPORT_EMAIL}</div>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/60 group-hover:text-white transition flex-shrink-0" />
                  </a>

                  <a
                    href={`tel:${SUPPORT_TEL.replace(/[^0-9+]/g, '')}`}
                    className="group inline-flex items-center justify-between gap-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-4 text-left hover:bg-emerald-500/15 transition"
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 p-2.5">
                        <Phone className="h-5 w-5 text-emerald-200" />
                      </span>
                      <span>
                        <div className="font-bold text-base">Call support</div>
                        <div className="text-xs text-white/65">{SUPPORT_TEL}</div>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/60 group-hover:text-white transition flex-shrink-0" />
                  </a>

                  <a
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center justify-between gap-3 rounded-xl border border-white/12 bg-white/5 px-4 py-4 text-left hover:bg-white/10 transition"
                  >
                    <span className="inline-flex items-center gap-3">
                      <span className="rounded-lg border border-white/12 bg-white/5 p-2.5">
                        <CalendarClock className="h-5 w-5 text-white/85" />
                      </span>
                      <span>
                        <div className="font-bold text-base">Book a meeting</div>
                        <div className="text-xs text-white/65">Open Calendly</div>
                      </span>
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/60 group-hover:text-white transition flex-shrink-0" />
                  </a>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-black/20 p-5 text-base text-white/75">
                <span className="font-black text-white">💡 Tip:</span> For bugs, include the page URL + steps to reproduce.
              </div>
            </>
          ) : (
            <>
              {/* Form View */}
              <button
                onClick={handleBackToOptions}
                className="mb-6 inline-flex items-center gap-2 text-white/70 hover:text-white transition text-base font-semibold"
              >
                <ArrowLeft className="h-5 w-5" />
                Back to options
              </button>

              <div className="flex items-start gap-5 mb-8">
                {selectedCategoryData && (
                  <div className={`rounded-2xl border ${categoryColors?.border} ${categoryColors?.bg} p-3 flex-shrink-0`}>
                    {selectedCategoryData.icon && <selectedCategoryData.icon className={`h-8 w-8 ${categoryColors?.icon}`} />}
                  </div>
                )}
                <div>
                  <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{selectedCategoryData?.label}</h3>
                  <p className="mt-2 text-lg text-white/70">{selectedCategoryData?.description}</p>
                </div>
              </div>

              {submitOk && submittedData ? (
                <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-300 mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-lg text-white mb-2">Message Sent Successfully!</div>
                      <p className="text-white/80 mb-4">{submitOk}</p>
                      <div className="text-sm text-white/70 space-y-1">
                        <div><span className="font-semibold">Name:</span> {submittedData.name}</div>
                        <div><span className="font-semibold">Email:</span> {submittedData.email}</div>
                        <div><span className="font-semibold">Category:</span> {submittedData.category}</div>
                        <div><span className="font-semibold">Submitted:</span> {submittedData.timestamp}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  {submitErr && (
                    <div className="rounded-xl border border-red-400/30 bg-red-500/10 p-5 flex items-start gap-3">
                      <AlertTriangle className="h-6 w-6 text-red-300 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-bold text-lg text-white mb-1">Error</div>
                        <p className="text-white/80 text-base">{submitErr}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-base font-bold text-white mb-2">First Name *</label>
                      <input
                        type="text"
                        value={form.firstName}
                        onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                        className={`w-full rounded-xl border ${categoryColors?.input} px-4 py-4 text-base text-white placeholder:text-white/40 outline-none transition ${categoryColors?.inputFocus} ring-2 ring-transparent`}
                        placeholder="John"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-base font-bold text-white mb-2">Last Name *</label>
                      <input
                        type="text"
                        value={form.lastName}
                        onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                        className={`w-full rounded-xl border ${categoryColors?.input} px-4 py-4 text-base text-white placeholder:text-white/40 outline-none transition ${categoryColors?.inputFocus} ring-2 ring-transparent`}
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-base font-bold text-white mb-2">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={`w-full rounded-xl border ${categoryColors?.input} px-4 py-4 text-base text-white placeholder:text-white/40 outline-none transition ${categoryColors?.inputFocus} ring-2 ring-transparent`}
                      placeholder="john.doe@company.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-white mb-2">Phone (optional)</label>
                    <input
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className={`w-full rounded-xl border ${categoryColors?.input} px-4 py-4 text-base text-white placeholder:text-white/40 outline-none transition ${categoryColors?.inputFocus} ring-2 ring-transparent`}
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-white mb-2">Company (optional)</label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className={`w-full rounded-xl border ${categoryColors?.input} px-4 py-4 text-base text-white placeholder:text-white/40 outline-none transition ${categoryColors?.inputFocus} ring-2 ring-transparent`}
                      placeholder="Your company name"
                    />
                  </div>

                  <div>
                    <label className="block text-base font-bold text-white mb-2">Message *</label>
                    <textarea
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      rows={5}
                      className={`w-full rounded-xl border ${categoryColors?.input} px-4 py-4 text-base text-white placeholder:text-white/40 outline-none transition ${categoryColors?.inputFocus} ring-2 ring-transparent resize-none`}
                      placeholder="Describe your issue or question in detail..."
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className={`w-full rounded-xl ${categoryColors?.bg} ${categoryColors?.border} px-6 py-4 text-lg font-black text-white hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
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
    if (!form.message.trim() || form.message.trim().length < 10) {
      setSubmitErr('Please add a short message (at least 10 characters).')
      scrollToId('support-form-feedback')
      return
    }

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
                className="inline-flex items-center justify-center gap-3 rounded-xl bg-emerald-400 px-7 py-4 text-lg font-extrabold text-white shadow-lg hover:bg-emerald-300 transition-all"
              >
                <Send className="h-6 w-6" />
                Send Us a message
              </button>
            </div>

            {/* INCREASED FONT SIZE AND ADDED CONTENT BELOW */}
            <div className="mt-8 space-y-4">
              <div className="flex flex-wrap gap-4 text-base">
                <span className="rounded-full border border-white/10 bg-white/5 px-5 py-2.5">
                  Typical response: <span className="font-bold text-white">1 business day</span>
                </span>
                <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-5 py-2.5">
                  Best for complex issues: <span className="font-bold text-emerald-200">meeting</span>
                </span>
              </div>
              
              {/* Additional Content Below Response Time - Centered, Orange, Bold, Larger */}
              <div className="rounded-xl border border-orange-400/30 bg-orange-500/10 backdrop-blur-sm p-6 sm:p-8 mx-auto text-center">
                <p className="text-base sm:text-lg lg:text-xl font-black text-orange-400 leading-relaxed">
                  <span className="text-orange-300">Quick Tip:</span> Whether you're troubleshooting a technical issue, 
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
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3">
                  <ShieldCheck className="h-6 w-6 text-emerald-200" />
                </div>
              </div>

              <div className="mt-7 space-y-6 text-base">
                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-lg bg-cyan-500/12 p-3 border border-cyan-400/25">
                    <Mail className="h-6 w-6 text-cyan-200" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold mb-1">Email</div>
                    <a
                      href={`mailto:${SUPPORT_EMAIL}`}
                      className="text-lg font-black text-cyan-200 hover:underline"
                    >
                      {SUPPORT_EMAIL}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-lg bg-emerald-500/12 p-3 border border-emerald-400/25">
                    <Clock className="h-6 w-6 text-emerald-200" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold mb-1">Hours</div>
                    <div className="text-lg font-black">Mon–Fri • 9am–5pm ET</div>
                    <div className="text-white/65 text-sm mt-1">Response: usually within 1 business day</div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-0.5 rounded-lg bg-orange-500/12 p-3 border border-orange-400/25">
                    <Phone className="h-6 w-6 text-orange-200" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold mb-1">Phone</div>
                    <a className="text-lg font-black text-orange-200 hover:underline" href={`tel:${SUPPORT_TEL.replace(/[^0-9+]/g, '')}`}>
                      ({SUPPORT_TEL})
                    </a>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-5">
                  <div className="text-base text-white/75">
                    <span className="font-black text-white">Tip:</span> Include your account email, the page URL, and
                    what you expected to happen.
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSupportModalOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-3 rounded-xl border border-white/12 bg-white/5 px-5 py-4 text-base font-black hover:bg-white/10 transition"
                >
                  <Send className="h-5 w-5 text-orange-200" />
                  Open contact options
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TOPICS - MOVED UP WITH REDUCED TOP MARGIN */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {topicCards.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className={cx(
                'group rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-7 transition-all',
                'hover:bg-white/10',
                t.ring
              )}
            >
              <div className={cx('rounded-xl border border-white/10 bg-gradient-to-br p-3.5 w-fit', t.accent)}>
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

              <div className="mt-6 text-base font-black text-emerald-200 group-hover:underline">{t.cta}</div>
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

          <div className="rounded-xl overflow-hidden border border-white/10 bg-white/5">
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