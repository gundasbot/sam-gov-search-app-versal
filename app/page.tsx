import Link from 'next/link'
import { ArrowRight, Bell, LineChart, Search, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Search,
    title: 'Search contracts faster',
    copy: 'Find relevant SAM.gov opportunities with smarter filters for NAICS, agency, set-aside, and response window.',
  },
  {
    icon: Bell,
    title: 'Never miss a deadline',
    copy: 'Saved searches and instant alerts keep your pipeline active without manually checking every day.',
  },
  {
    icon: LineChart,
    title: 'Prioritize better bids',
    copy: 'Use analytics and trend signals to focus on opportunities your team can realistically win.',
  },
]

const stats = [
  { label: 'Live opportunities tracked', value: '900+' },
  { label: 'Coverage', value: 'Federal + State + Local' },
  { label: 'Typical onboarding', value: 'Same day' },
]

const steps = [
  {
    title: 'Define your target profile',
    copy: 'Set your NAICS, preferred agencies, geography, and set-aside posture once.',
  },
  {
    title: 'Run and save search workflows',
    copy: 'Build repeatable search playbooks and run them in seconds from your dashboard.',
  },
  {
    title: 'Act quickly with team clarity',
    copy: 'Share opportunity context and next actions so your team moves before the market does.',
  },
]

export default function LandingPage() {
  return (
    <div className="pb-20">
      <section className="pg-container pt-16 md:pt-24">
        <div className="pg-reveal pg-card rounded-[28px] p-8 md:p-12">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-accent-soft)] px-4 py-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--color-primary)]">
            <Sparkles className="h-4 w-4" />
            Modern govcon workflow
          </div>

          <h1
            className="max-w-4xl text-4xl font-extrabold leading-tight text-[var(--color-text-primary)] md:text-6xl"
            style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
          >
            A cleaner, faster way to find and win government opportunities.
          </h1>

          <p className="mt-6 max-w-2xl text-base md:text-lg">
            Precise GovCon gives your team one place to search, qualify, and act on opportunities with less noise and better execution speed.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="pg-btn pg-btn-primary px-7 py-3 text-sm md:text-base">
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/search" className="pg-btn pg-btn-muted px-7 py-3 text-sm md:text-base">
              Explore search
            </Link>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] px-4 py-4">
                <p className="text-2xl font-extrabold text-[var(--color-text-primary)]">{item.value}</p>
                <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pg-container mt-12 md:mt-16">
        <div className="pg-grid md:grid-cols-3">
          {features.map((item, index) => {
            const Icon = item.icon
            return (
              <article
                key={item.title}
                className={`pg-card p-6 ${index === 1 ? 'pg-reveal-delay' : 'pg-reveal'}`}
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--color-accent-soft)] text-[var(--color-primary)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h2
                  className="text-xl font-extrabold text-[var(--color-text-primary)]"
                  style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
                >
                  {item.title}
                </h2>
                <p className="mt-3 text-sm md:text-base">{item.copy}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="pg-container mt-12 md:mt-16">
        <div className="grid items-start gap-6 md:grid-cols-2">
          <div className="pg-surface p-6 md:p-8">
            <span className="pg-badge">How it works</span>
            <h3
              className="mt-4 text-2xl font-extrabold text-[var(--color-text-primary)] md:text-3xl"
              style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
            >
              Build a repeatable bid pipeline in three steps.
            </h3>
            <p className="mt-4">Reduce manual effort and improve focus by turning one-off searching into a system.</p>
            <Link href="/dashboard" className="pg-btn pg-btn-muted mt-6 px-6 py-3 text-sm">
              See dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {steps.map((step, idx) => (
              <div key={step.title} className="pg-surface p-5 md:p-6">
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-[var(--color-primary)]">Step {idx + 1}</p>
                <h4 className="mt-2 text-lg font-bold text-[var(--color-text-primary)]">{step.title}</h4>
                <p className="mt-2 text-sm md:text-base">{step.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pg-container mt-12 md:mt-16">
        <div className="pg-cta-bg relative overflow-hidden rounded-[24px] border border-[var(--color-border)] p-8 shadow-[var(--shadow-lg)] md:p-10">

          <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.1em] text-white/85">Ready to modernize your workflow?</p>
              <h5
                className="mt-2 text-2xl font-extrabold text-white md:text-3xl"
                style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}
              >
                Start with a 7-day trial.
              </h5>
              <p className="mt-3 max-w-xl text-white/90">
                Get immediate access to search, alerts, and insights. Upgrade only when the workflow proves value for your team.
              </p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link href="/pricing" className="pg-btn pg-btn-secondary w-full rounded-xl border-white/70 bg-white px-6 py-3 text-sm font-bold text-[var(--color-primary)] shadow-md transition hover:-translate-y-0.5 hover:shadow-lg sm:w-auto">
                View Pricing
              </Link>
              <Link href="/support" className="pg-btn w-full rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-sm font-bold text-white transition hover:bg-white/20 sm:w-auto">
                Contact Team
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
