import { Clock, Headset, ShieldCheck } from 'lucide-react'
import ForgotPasswordClient from './ForgotPasswordClient'

const reassurancePoints = [
  { title: 'Secure reset links', body: 'Every request generates a single-use token that expires within 15 minutes.', icon: ShieldCheck },
  { title: 'Rapid delivery', body: 'Most emails arrive in under two minutes. Check spam if you do not see it right away.', icon: Clock },
  { title: 'Chat + phone support', body: 'Our team can manually confirm ownership and restore access if needed.', icon: Headset },
]

export default function ForgotPasswordPage({
  searchParams,
}: {
  searchParams?: { email?: string | string[] }
}) {
  const initialEmail = Array.isArray(searchParams?.email)
    ? searchParams?.email[0] || ''
    : searchParams?.email || ''

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[--color-surface-muted]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(165,243,252,0.28),transparent_62%)]" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom,_rgba(254,226,226,0.25),transparent_65%)]" aria-hidden="true" />

      <div className="pg-container relative z-10 py-16 lg:py-24">
        <div className="space-y-10">
          <section className="rounded-[32px] border border-[--color-border] bg-[--color-surface]/95 p-8 shadow-2xl backdrop-blur-xl md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--color-text-tertiary)]">Account recovery</p>
            <h1 className="mt-4 text-4xl font-black text-[var(--color-text-primary)] md:text-5xl" style={{ fontFamily: 'var(--font-display), system-ui, sans-serif' }}>
              Let&apos;s get you back in
            </h1>
            <p className="mt-4 max-w-xl text-base text-[var(--color-text-secondary)] md:text-lg">
              Request a secure reset link using the email tied to your Precise GovCon workspace. We verify every request to protect active contracts and alerts.
            </p>

            <div className="mt-8 max-w-2xl rounded-2xl border border-[--color-border] bg-[--color-surface-muted]/90 p-5 md:p-6">
              <ForgotPasswordClient initialEmail={initialEmail} />
            </div>
          </section>

          <div className="grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-stretch">
            <section className="rounded-[32px] border border-[--color-border] bg-[--color-surface]/90 p-8 shadow-xl backdrop-blur-xl md:p-12">
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {reassurancePoints.map((point) => (
                <div key={point.title} className="rounded-2xl border border-[--color-border] bg-[--color-surface-muted]/80 p-4">
                  <point.icon className="h-5 w-5 text-[var(--color-primary)]" />
                  <p className="mt-3 text-sm font-bold text-[var(--color-text-primary)]">{point.title}</p>
                  <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{point.body}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-[--color-border] bg-[--color-surface-muted]/80 p-5">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Need to talk to someone?</p>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">Support can verify identity and reset access manually.</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm font-bold text-[var(--color-text-primary)]">
                <a href="mailto:support@precisegovcon.com" className="text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]">support@precisegovcon.com</a>
                <span className="rounded-full border border-[--color-border] px-3 py-1 text-xs uppercase tracking-[0.2em]">(804) 404-6005</span>
              </div>
            </div>
            </section>

            <section className="relative">
            <div className="pointer-events-none absolute inset-0 rounded-[36px] bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),transparent_65%)]" aria-hidden="true" />
            <div className="relative rounded-[32px] border border-[--color-border-strong] bg-[--color-surface]/95 p-6 shadow-2xl backdrop-blur-md md:p-10">
              <h2 className="text-2xl font-black text-[var(--color-text-primary)]">What happens next</h2>
              <ul className="mt-4 space-y-3 text-sm text-[var(--color-text-secondary)]">
                <li>1. We send a secure, one-time reset link to your inbox.</li>
                <li>2. Open the link within 15 minutes and set a new password.</li>
                <li>3. Return to login and continue to your dashboard.</li>
              </ul>
            </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
