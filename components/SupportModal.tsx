'use client'

import { useState } from 'react'
import {
  Mail,
  Phone,
  HelpCircle,
  X,
  CalendarClock,
  Send,
  Bug,
  CreditCard,
  UserCog,
  Bell,
  ShieldCheck,
  MessageSquare,
  Briefcase,
  FileQuestion,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react'

interface SupportOptionsModalProps {
  isOpen: boolean
  onClose: () => void
}

type FormState = {
  firstName: string
  lastName: string
  email: string
  phone: string
  company: string
  inquiryType: string
  message: string
}

const SUPPORT_EMAIL = 'support@precisegovcon.com'
const SUPPORT_TEL = '804-404-6005'
const CALENDLY_URL = 'https://calendly.com/precisegovcon/30min'

export default function SupportOptionsModal({
  isOpen,
  onClose,
}: SupportOptionsModalProps) {
  const [view, setView] = useState<'options' | 'form'>('options')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [form, setForm] = useState<FormState>({
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
      const res = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to send message')
      }

      setSubmitOk('Message sent! We\'ll respond within 1 business day.')
      resetForm()
      
      // Auto-close after success
      setTimeout(() => {
        onClose()
        setView('options')
      }, 2500)
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
    const colors: Record<string, { border: string; bg: string; icon: string; hover: string }> = {
      red: {
        border: 'border-red-400/30',
        bg: 'bg-red-500/10',
        icon: 'text-red-300',
        hover: 'hover:bg-red-500/20',
      },
      blue: {
        border: 'border-blue-400/30',
        bg: 'bg-blue-500/10',
        icon: 'text-blue-300',
        hover: 'hover:bg-blue-500/20',
      },
      purple: {
        border: 'border-purple-400/30',
        bg: 'bg-purple-500/10',
        icon: 'text-purple-300',
        hover: 'hover:bg-purple-500/20',
      },
      yellow: {
        border: 'border-yellow-400/30',
        bg: 'bg-yellow-500/10',
        icon: 'text-yellow-300',
        hover: 'hover:bg-yellow-500/20',
      },
      green: {
        border: 'border-emerald-400/30',
        bg: 'bg-emerald-500/10',
        icon: 'text-emerald-300',
        hover: 'hover:bg-emerald-500/20',
      },
      indigo: {
        border: 'border-indigo-400/30',
        bg: 'bg-indigo-500/10',
        icon: 'text-indigo-300',
        hover: 'hover:bg-indigo-500/20',
      },
      cyan: {
        border: 'border-cyan-400/30',
        bg: 'bg-cyan-500/10',
        icon: 'text-cyan-300',
        hover: 'hover:bg-cyan-500/20',
      },
      gray: {
        border: 'border-white/20',
        bg: 'bg-white/5',
        icon: 'text-white/70',
        hover: 'hover:bg-white/10',
      },
    }
    return colors[color] || colors.gray
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 backdrop-blur-md p-6">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/10 bg-gradient-to-br from-[#0c1f2f] via-[#0e2436] to-[#0a1a28] p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white transition z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {view === 'options' ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="rounded-xl bg-emerald-500/20 p-3 border border-emerald-400/30">
                <HelpCircle className="h-7 w-7 text-emerald-300" />
              </div>
              <div>
                <h2 className="text-3xl font-extrabold text-white">How can we help?</h2>
                <p className="text-white/70 text-sm mt-1">
                  Choose a category below or contact us directly via phone, email, or schedule a meeting.
                </p>
              </div>
            </div>

            {/* Support Categories Grid */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4">Select a support category:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {supportCategories.map((category) => {
                  const colorClasses = getColorClasses(category.color)
                  const Icon = category.icon
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryClick(category.id)}
                      className={`group rounded-2xl border ${colorClasses.border} ${colorClasses.bg} p-5 text-left ${colorClasses.hover} transition-all`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className={`h-6 w-6 ${colorClasses.icon} mt-0.5 flex-shrink-0`} />
                        <div>
                          <div className="font-bold text-white mb-1">{category.label}</div>
                          <p className="text-white/60 text-sm leading-snug">{category.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Direct Contact Options */}
            <div className="border-t border-white/10 pt-6">
              <h3 className="text-lg font-bold text-white mb-4">Or reach us directly:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="group rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 hover:bg-cyan-500/20 transition-all text-center"
                >
                  <Mail className="h-6 w-6 text-cyan-300 mx-auto mb-2" />
                  <div className="font-bold text-white text-sm">Email Us</div>
                  <p className="text-white/60 text-xs mt-1">{SUPPORT_EMAIL}</p>
                </a>

                <a
                  href={`tel:${SUPPORT_TEL.replace(/[^0-9+]/g, '')}`}
                  className="group rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 hover:bg-emerald-500/20 transition-all text-center"
                >
                  <Phone className="h-6 w-6 text-emerald-300 mx-auto mb-2" />
                  <div className="font-bold text-white text-sm">Call Support</div>
                  <p className="text-white/60 text-xs mt-1">{SUPPORT_TEL}</p>
                </a>

                <a
                  href={CALENDLY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="group rounded-2xl border border-orange-400/30 bg-orange-500/10 p-4 hover:bg-orange-500/20 transition-all text-center"
                >
                  <CalendarClock className="h-6 w-6 text-orange-300 mx-auto mb-2" />
                  <div className="font-bold text-white text-sm">Book Meeting</div>
                  <p className="text-white/60 text-xs mt-1">30-min consultation</p>
                </a>
              </div>
            </div>

            {/* Footer Tip */}
            <div className="mt-6 rounded-xl bg-black/30 border border-white/10 p-4 text-xs text-white/60">
              <span className="font-bold text-white">💡 Tip:</span> For technical issues, include the page URL, what you
              clicked, and what you expected vs. what happened. Screenshots are super helpful!
            </div>
          </>
        ) : (
          <>
            {/* Form View */}
            <button
              onClick={handleBackToOptions}
              className="mb-6 inline-flex items-center gap-2 text-white/70 hover:text-white transition text-sm font-semibold"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to options
            </button>

            <div className="flex items-center gap-4 mb-6">
              <div className="rounded-xl bg-orange-500/20 p-3 border border-orange-400/30">
                <Send className="h-6 w-6 text-orange-300" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-white">Send us a message</h2>
                <p className="text-white/60 text-sm">
                  {selectedCategory && `Category: ${selectedCategory}`}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-white/85">First Name *</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-base outline-none text-white focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="John"
                    autoComplete="given-name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-white/85">Last Name *</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-base outline-none text-white focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Doe"
                    autoComplete="family-name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-white/85">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-base outline-none text-white focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="john.doe@company.com"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-bold text-white/85">Phone (optional)</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-base outline-none text-white focus:border-orange-400/45 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label className="text-sm font-bold text-white/85">Company (optional)</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-base outline-none text-white focus:border-orange-400/45 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Your Company"
                    autoComplete="organization"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-bold text-white/85">Category *</label>
                <select
                  value={form.inquiryType}
                  onChange={(e) => setForm((p) => ({ ...p, inquiryType: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-base outline-none text-white focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-500/20"
                  required
                >
                  <option value="" className="bg-slate-900">
                    Select a category
                  </option>
                  {supportCategories.map((cat) => (
                    <option key={cat.id} value={cat.id} className="bg-slate-900">
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-bold text-white/85">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="mt-2 w-full min-h-[160px] rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-base outline-none text-white focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Describe your question or issue in detail. For bugs, include the page URL and steps to reproduce."
                  required
                />
              </div>

              {submitErr && (
                <div className="flex items-start gap-3 rounded-xl border border-red-500/25 bg-red-500/12 px-4 py-3 text-sm text-red-100">
                  <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{submitErr}</span>
                </div>
              )}

              {submitOk && (
                <div className="flex items-start gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <span>{submitOk}</span>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-base font-bold shadow-lg transition-all ${
                    submitting
                      ? 'bg-white/10 text-white/60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-400 hover:to-emerald-400 text-slate-950'
                  }`}
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  {submitting ? 'Sending…' : 'Send message'}
                </button>

                <button
                  type="button"
                  onClick={handleBackToOptions}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3.5 text-base font-bold text-white hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-white/55">
                By submitting, you agree we may contact you about your inquiry. We typically respond within 1 business
                day.
              </p>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
