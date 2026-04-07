"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Mail, Loader2, CheckCircle2, KeyRound, ShieldCheck, Clock, Zap } from "lucide-react"

export default function ForgotPasswordClient({ initialEmail = "" }: { initialEmail?: string }) {
  const [email, setEmail] = useState(initialEmail)
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } finally {
      setLoading(false)
    }
  }

  const INFO = [
    { icon: Mail,        title: "Reset link emailed instantly",    desc: "A secure one-time link lands in your inbox within seconds.",                    color: "#f97316" },
    { icon: Clock,       title: "Valid for 15 minutes",            desc: "Each link is single-use and expires automatically for your security.",          color: "#0369a1" },
    { icon: Zap,         title: "No password? Use a sign-in link", desc: "Skip the password entirely — use a magic sign-in link for instant access.",    color: "#166534" },
    { icon: ShieldCheck, title: "Bank-grade security",             desc: "Every session is encrypted end-to-end. Your contracts data stays protected.",   color: "#7c3aed" },
  ]

  return (
    <div
      className="mx-auto max-w-480 px-4 pt-4 sm:px-6 lg:px-8"
      style={{ minHeight: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}
    >
      {/* ── Unified two-column card ── */}
      <div
        className="rounded-3xl shadow-xl overflow-hidden flex-1 flex flex-col"
        style={{ background: "var(--color-surface)", border: "1.5px solid var(--color-border)" }}
      >
        <div className="grid lg:grid-cols-2 lg:items-stretch flex-1">

          {/* ══ LEFT: Form ══ */}
          <div className="flex flex-col" style={{ borderRight: "1px solid var(--color-border)" }}>

            {/* Header */}
            <div
              className="px-6 py-5 flex items-center justify-between gap-4"
              style={{
                background: "linear-gradient(135deg,#0f172a 0%,#1e293b 60%,#0f172a 100%)",
                borderBottom: "1px solid rgba(249,115,22,0.25)",
              }}
            >
              <div>
                <div className="inline-flex items-center rounded-lg px-3 py-1 mb-2" style={{ background: "#f97316" }}>
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: "#ffffff" }}>
                    Account Recovery
                  </span>
                </div>
                <h1 className="text-2xl font-black" style={{ color: "#ffffff" }}>Reset your password</h1>
                <p className="text-sm font-semibold mt-1" style={{ color: "#94a3b8" }}>
                  {sent ? `Reset link sent to ${email}` : "Enter your email and we'll send a secure reset link."}
                </p>
              </div>
              <Link
                href="/"
                className="hidden sm:flex items-center rounded-xl px-4 py-2 flex-shrink-0"
                style={{ background: "#1e293b", border: "1px solid rgba(249,115,22,0.35)", textDecoration: "none" }}
              >
                <span style={{ fontSize: 16, fontWeight: 900, color: "#ffffff" }}>Precise</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: "#f97316" }}>GovCon</span>
              </Link>
            </div>

            {/* Body */}
            <div className="px-6 py-6 flex-1 space-y-4" style={{ background: "var(--color-surface)" }}>

              {sent ? (
                /* ── Success state ── */
                <>
                  <div className="rounded-xl overflow-hidden" style={{ border: "2px solid #16a34a" }}>
                    <div className="p-5 text-center" style={{ background: "#166534" }}>
                      <CheckCircle2 className="h-10 w-10 mx-auto mb-2" style={{ color: "#ffffff" }} />
                      <p className="text-lg font-black" style={{ color: "#ffffff" }}>Reset link sent!</p>
                      <p className="text-sm font-bold mt-1" style={{ color: "#86efac" }}>{email}</p>
                    </div>
                    <div className="p-5" style={{ background: "var(--color-surface)" }}>
                      <p className="text-base font-bold mb-1" style={{ color: "var(--color-text-primary)" }}>
                        Check your inbox and click the reset link.
                      </p>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)", opacity: 0.75 }}>
                        Expires in <strong>15 minutes</strong>. Check spam if you don't see it.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSent(false)}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-base font-black transition-all hover:-translate-y-0.5"
                    style={{ background: "#f97316", color: "#ffffff", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" }}
                  >
                    <Mail className="h-5 w-5" /> Resend reset link
                  </button>
                  <Link
                    href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-base font-black transition-all hover:-translate-y-0.5"
                    style={{ background: "var(--color-surface-muted)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)", textDecoration: "none" }}
                  >
                    <ArrowLeft className="h-5 w-5" /> Back to login
                  </Link>
                </>
              ) : (
                /* ── Form state ── */
                <form onSubmit={onSubmit} className="space-y-4">
                  <div>
                    <label
                      className="block text-sm font-black uppercase tracking-wide mb-2"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      Email address
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="h-14 w-full rounded-xl px-5 text-base outline-none transition-all focus:ring-2 focus:ring-orange-400"
                      style={{ background: "var(--color-surface-muted)", color: "var(--color-text-primary)", border: "2px solid var(--color-border)" }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl py-3.5 text-base font-black transition-all hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{ background: "#f97316", color: "#ffffff", boxShadow: "0 4px 14px rgba(249,115,22,0.4)" }}
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Mail className="h-5 w-5" /> Send Reset Link</>}
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: "var(--color-text-subtle)" }}>or</span>
                    <div className="h-px flex-1" style={{ background: "var(--color-border)" }} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all hover:-translate-y-0.5"
                      style={{ background: "var(--color-surface-muted)", color: "var(--color-text-primary)", border: "1.5px solid var(--color-border)", textDecoration: "none" }}
                    >
                      <ArrowLeft className="h-4 w-4" /> Back to Login
                    </Link>
                    <Link
                      href={`/login${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-black transition-all hover:-translate-y-0.5"
                      style={{ background: "#166534", color: "#ffffff", boxShadow: "0 2px 8px rgba(22,101,52,0.3)", textDecoration: "none" }}
                    >
                      <KeyRound className="h-4 w-4" /> Sign-In Link
                    </Link>
                  </div>

                  <p className="text-xs font-semibold text-center" style={{ color: "var(--color-text-subtle)" }}>
                    No password needed — use a magic sign-in link instead.
                  </p>

                  {/* Free trial CTA */}
                  <Link
                    href="/signup"
                    className="flex items-center justify-between gap-3 rounded-xl px-5 py-3.5 transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: "#166534", boxShadow: "0 4px 16px rgba(22,101,52,0.4)", textDecoration: "none" }}
                  >
                    <p className="text-sm font-black" style={{ color: "#ffffff" }}>
                      No account? <span style={{ color: "#86efac" }}>Start your 7-day free trial</span>
                    </p>
                    <div className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 flex-shrink-0" style={{ background: "#ffffff" }}>
                      <span className="text-sm font-black" style={{ color: "#166534" }}>Start Free Trial</span>
                    </div>
                  </Link>
                </form>
              )}
            </div>
          </div>

          {/* ══ RIGHT: Info panel ══ */}
          <div className="flex flex-col gap-6 p-6 sm:p-8" style={{ background: "var(--color-surface-muted)" }}>
            <div className="text-center">
              <p className="text-xl font-black uppercase tracking-widest mb-2" style={{ color: "#f97316", letterSpacing: "0.12em" }}>
                Account Security
              </p>
              <h2 className="text-4xl font-black leading-tight mb-3" style={{ color: "var(--color-text-primary)" }}>
                Back in your account in minutes.
              </h2>
              <p className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
                Precise GovCon makes account recovery fast, secure, and simple — so you never miss a contract deadline because of a login issue.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {INFO.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl p-4 flex gap-4 items-start"
                  style={{ background: "var(--color-surface)", border: "2px solid var(--color-border)" }}
                >
                  <div
                    className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: item.color }}
                  >
                    <item.icon className="h-5 w-5" style={{ color: "#ffffff" }} />
                  </div>
                  <div>
                    <p className="text-sm font-black" style={{ color: "var(--color-text-primary)" }}>{item.title}</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--color-text-primary)", opacity: 0.8 }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Support CTA */}
            <div
              className="rounded-xl p-5 flex items-center justify-between gap-4"
              style={{ background: "#0f172a", border: "1.5px solid rgba(249,115,22,0.3)" }}
            >
              <div>
                <p className="text-base font-black" style={{ color: "#ffffff" }}>Still having trouble?</p>
                <p className="text-sm font-bold mt-0.5" style={{ color: "#94a3b8" }}>
                  Our team can verify your identity and restore access manually.
                </p>
              </div>
              <Link
                href="/support?openContact=1&category=Account%20%26%20Access"
                className="shrink-0 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-black transition-all hover:-translate-y-0.5"
                style={{ background: "#f97316", color: "#ffffff", textDecoration: "none", boxShadow: "0 2px 8px rgba(249,115,22,0.4)" }}
              >
                Contact Support
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}