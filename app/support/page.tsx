'use client'

import Script from 'next/script'
import { useMemo, useState } from 'react'
import Link from 'next/link'
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

export default function SupportPage() {
  const [form, setForm] = useState<FormState>(initialForm())
  const [submitting, setSubmitting] = useState(false)
  const [submitOk, setSubmitOk] = useState<string | null>(null)
  const [submitErr, setSubmitErr] = useState<string | null>(null)

  const fullName = useMemo(() => {
    const name = `${form.firstName} ${form.lastName}`.trim()
    return name || 'there'
  }, [form.firstName, form.lastName])

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitOk(null)
    setSubmitErr(null)

    if (!form.firstName.trim()) {
      setSubmitErr('Please enter your first name.')
      document.getElementById('support-form-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!form.lastName.trim()) {
      setSubmitErr('Please enter your last name.')
      document.getElementById('support-form-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!form.email.trim()) {
      setSubmitErr('Please enter your email.')
      document.getElementById('support-form-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!form.inquiryType.trim()) {
      setSubmitErr('Please select an inquiry type.')
      document.getElementById('support-form-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      return
    }
    if (!form.message.trim() || form.message.trim().length < 10) {
      setSubmitErr('Please add a short message (at least 10 characters).')
      document.getElementById('support-form-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
        setSubmitErr(data?.error || 'Could not send your message. Please email support@precisegovcon.com.')
        document.getElementById('support-form-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        return
      }

      setSubmitOk(`Thanks ${fullName}! We received your message and will respond soon.`)
      setForm(initialForm())
      document.getElementById('support-form-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    } catch {
      setSubmitErr('Network error. Please try again, or email support@precisegovcon.com.')
      document.getElementById('support-form-feedback')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
      {/* LIGHTER BACKGROUND + NEON GLOWS */}
      <div className="fixed inset-0 -z-20 bg-gradient-to-b from-[#0B1633] via-[#071028] to-[#050B1A]" />
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-24 left-1/2 h-[520px] w-[980px] -translate-x-1/2 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="absolute top-[220px] right-[-160px] h-[520px] w-[520px] rounded-full bg-orange-400/18 blur-3xl" />
        <div className="absolute top-[420px] left-[-220px] h-[560px] w-[560px] rounded-full bg-cyan-400/12 blur-3xl" />
      </div>

      {/* SHIFT HERO UP */}
      <div className="mx-auto max-w-[1600px] 2xl:max-w-[1760px] px-4 sm:px-6 lg:px-10 2xl:px-12 pt-10 pb-16">
        {/* HERO */}
        <div className="mb-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.05]">
              Get help fast — book a meeting or send a message.
            </h1>

            <p className="mt-4 text-lg sm:text-xl text-white/75 max-w-2xl">
              Billing questions, saved searches, alerts, or account access — we’ll get you sorted. If you prefer not to
              book time, use the form and we’ll respond within 1 business day.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#book"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-5 py-3.5 text-base font-extrabold text-slate-950 shadow-lg hover:from-emerald-400 hover:to-cyan-400 transition-all"
              >
                <CalendarClock className="h-5 w-5" />
                Book a 30-min meeting
              </a>

              <a
                href="#contact"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-400/30 bg-orange-400/10 px-5 py-3.5 text-base font-extrabold text-white hover:bg-orange-400/15 transition-all"
              >
                <Send className="h-5 w-5 text-orange-300" />
                Send a message
              </a>

              <a
                href={CALENDLY_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-base font-bold text-white/85 hover:text-white hover:bg-white/10 transition-all"
              >
                Open Calendly in new tab →
              </a>
            </div>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/65">
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
                Typical response: <span className="font-bold text-white">1 business day</span>
              </span>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1">
                Best for complex issues: <span className="font-bold text-emerald-200">meeting</span>
              </span>
              <span className="rounded-full border border-orange-400/20 bg-orange-400/10 px-3 py-1">
                Quick questions: <span className="font-bold text-orange-200">message</span>
              </span>
            </div>
          </div>

          {/* CONTACT CARD */}
          <div className="lg:col-span-4">
            <div
              id="contact"
              className="rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-6 shadow-[0_10px_40px_-20px_rgba(0,0,0,0.8)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black">Contact Support</h2>
                  <p className="mt-1 text-base text-white/70">Fastest ways to reach us.</p>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-200" />
                </div>
              </div>

              <div className="mt-6 space-y-5 text-base">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-cyan-500/12 p-2 border border-cyan-400/25">
                    <Mail className="h-5 w-5 text-cyan-200" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold">Email</div>
                    <a
                      href="mailto:support@precisegovcon.com"
                      className="text-lg font-black text-cyan-200 hover:underline"
                    >
                      support@precisegovcon.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-emerald-500/12 p-2 border border-emerald-400/25">
                    <Clock className="h-5 w-5 text-emerald-200" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold">Hours</div>
                    <div className="text-lg font-black">Mon–Fri • 9am–5pm ET</div>
                    <div className="text-white/65 text-sm">Response: usually within 1 business day</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-orange-500/12 p-2 border border-orange-400/25">
                    <Phone className="h-5 w-5 text-orange-200" />
                  </div>
                  <div>
                    <div className="text-white/60 text-sm font-bold">Phone</div>
                    <a className="text-lg font-black text-orange-200 hover:underline" href="tel:804-404-4005">
                      (804) 404-4005
                    </a>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                  <div className="text-sm text-white/75">
                    <span className="font-black text-white">Tip:</span> Include your account email, the page URL, and
                    what you expected to happen.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TOPICS */}
        <div className="mb-10 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {topicCards.map((t) => (
            <Link
              key={t.title}
              href={t.href}
              className={cx(
                'group rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-6 transition-all',
                'hover:bg-white/10',
                t.ring
              )}
            >
              <div className={cx('rounded-xl border border-white/10 bg-gradient-to-br p-3 w-fit', t.accent)}>
                {t.icon}
              </div>

              <div className="mt-4 text-xl font-black">{t.title}</div>
              <div className="mt-2 text-base text-white/70 leading-relaxed">{t.desc}</div>

              <ul className="mt-4 space-y-1 text-sm text-white/65">
                {t.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-300/70" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 text-sm font-black text-emerald-200 group-hover:underline">{t.cta}</div>
            </Link>
          ))}
        </div>

        {/* MAIN CONTENT: FORM + CALENDLY */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          {/* FORM */}
          <section className="xl:col-span-5 rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Send us a message</h2>
                <p className="mt-2 text-base sm:text-lg text-white/70">
                  Don’t want a meeting? No problem — send a message and we’ll respond quickly.
                </p>
              </div>
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-2">
                <Send className="h-5 w-5 text-emerald-200" />
              </div>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-black text-white/85">First Name *</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((p) => ({ ...p, firstName: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-black/20 px-4 py-3.5 text-base outline-none focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="John"
                    autoComplete="given-name"
                  />
                </div>
                <div>
                  <label className="text-sm font-black text-white/85">Last Name *</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((p) => ({ ...p, lastName: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-black/20 px-4 py-3.5 text-base outline-none focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Doe"
                    autoComplete="family-name"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-black text-white/85">Business Email *</label>
                <input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/12 bg-black/20 px-4 py-3.5 text-base outline-none focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="john.doe@company.com"
                  autoComplete="email"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-black text-white/85">Phone (optional)</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-black/20 px-4 py-3.5 text-base outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                  />
                </div>
                <div>
                  <label className="text-sm font-black text-white/85">Company (optional)</label>
                  <input
                    value={form.company}
                    onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                    className="mt-2 w-full rounded-xl border border-white/12 bg-black/20 px-4 py-3.5 text-base outline-none focus:border-orange-400/45 focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Your Company"
                    autoComplete="organization"
                  />
                </div>
              </div>

              {/* Inquiry Type (FIXED: visible dropdown options) */}
              <div>
                <label className="text-sm font-black text-white/85">Inquiry Type *</label>
                <select
                  value={form.inquiryType}
                  onChange={(e) => setForm((p) => ({ ...p, inquiryType: e.target.value }))}
                  className="mt-2 w-full rounded-xl border border-white/12 bg-black/20 px-4 py-3.5 text-base outline-none text-white
                             focus:border-emerald-400/45 focus:ring-2 focus:ring-emerald-500/20"
                >
                  <option value="" className="bg-slate-900 text-white">
                    Select an option
                  </option>
                  <option value="Billing & Plan" className="bg-slate-900 text-white">
                    Billing & Plan
                  </option>
                  <option value="Account / Login" className="bg-slate-900 text-white">
                    Account / Login
                  </option>
                  <option value="Saved Searches & Alerts" className="bg-slate-900 text-white">
                    Saved Searches & Alerts
                  </option>
                  <option value="Bug / Something Not Working" className="bg-slate-900 text-white">
                    Bug / Something Not Working
                  </option>
                  <option value="Services / Consulting" className="bg-slate-900 text-white">
                    Services / Consulting
                  </option>
                  <option value="Other" className="bg-slate-900 text-white">
                    Other
                  </option>
                </select>

                <p className="mt-2 text-xs text-white/55">
                  Pick the closest match — it helps us route your request faster.
                </p>
              </div>

              <div>
                <label className="text-sm font-black text-white/85">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  className="mt-2 w-full min-h-[160px] rounded-xl border border-white/12 bg-black/20 px-4 py-3.5 text-base outline-none focus:border-cyan-400/45 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Tell us what you need help with… (include your account email + steps to reproduce if it’s a bug)"
                />
              </div>

              <div id="support-form-feedback" />

              {submitErr && (
                <div className="rounded-xl border border-red-500/25 bg-red-500/12 px-4 py-3 text-sm text-red-100">
                  {submitErr}
                </div>
              )}
              {submitOk && (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/12 px-4 py-3 text-sm text-emerald-100">
                  {submitOk}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className={cx(
                    'inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-base font-black shadow-lg transition-all',
                    submitting
                      ? 'bg-white/10 text-white/60 cursor-not-allowed'
                      : 'bg-gradient-to-r from-orange-500 to-emerald-500 hover:from-orange-400 hover:to-emerald-400 text-slate-950'
                  )}
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                  {submitting ? 'Sending…' : 'Send message'}
                </button>

                <a
                  href="mailto:support@precisegovcon.com"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-base font-black text-white hover:bg-white/10 transition-all"
                >
                  <Mail className="h-5 w-5 text-cyan-200" />
                  Email instead
                </a>
              </div>

              <p className="text-xs text-white/55">By submitting, you agree we may contact you about your inquiry.</p>
            </form>
          </section>

          {/* CALENDLY */}
          <section id="book" className="xl:col-span-7 rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black">Book a 30-minute meeting</h2>
                <p className="mt-2 text-base sm:text-lg text-white/70">
                  Best for onboarding, services, strategy, or anything complex.
                </p>
              </div>

              <a href={CALENDLY_URL} target="_blank" rel="noreferrer" className="text-sm font-black text-emerald-200 hover:underline">
                Open in new tab →
              </a>
            </div>

            <Script src="https://assets.calendly.com/assets/external/widget.js" strategy="lazyOnload" />

            <div className="mt-5 overflow-hidden rounded-2xl border border-emerald-400/20 bg-black/20">
              <div className="h-[6px] bg-gradient-to-r from-emerald-400 via-cyan-400 to-orange-400" />
              <div className="p-3">
                <div className="calendly-inline-widget" data-url={CALENDLY_URL} style={{ minWidth: '320px', height: '780px' }} />
              </div>
            </div>

            <p className="mt-3 text-xs text-white/55">If the embed doesn’t load (ad blockers), use “Open in new tab”.</p>
          </section>
        </div>

        {/* FAQ */}
        <section className="mt-10 rounded-2xl border border-white/12 bg-white/7 backdrop-blur-xl p-6">
          <h3 className="text-3xl font-black">Common questions</h3>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                q: 'Where do I update my plan or billing?',
                a: 'Go to Account → Billing & Plan. You can view invoices and update payment methods there.',
              },
              {
                q: 'Why didn’t my alert email arrive?',
                a: 'Check spam/promotions first, then confirm the alert is enabled and the frequency is set. If it still doesn’t arrive, send us a message with the alert name.',
              },
              {
                q: 'Can you help with SAM registration and certifications?',
                a: 'Yes — use “Services / Consulting” in the form or book a meeting for a guided walkthrough.',
              },
              {
                q: 'Something is broken — what info helps most?',
                a: 'Include the page URL, your account email, what you clicked, what you expected, and what happened. Screenshots help a lot.',
              },
            ].map((item) => (
              <div key={item.q} className="rounded-2xl border border-white/12 bg-black/20 p-6">
                <div className="font-black text-xl">{item.q}</div>
                <div className="mt-3 text-base text-white/70 leading-relaxed">{item.a}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
