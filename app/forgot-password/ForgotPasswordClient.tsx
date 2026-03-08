"use client"

import { useState } from "react"
import Link from "next/link"

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

  return (
    <>
      <p className="text-sm text-[var(--color-text-secondary)] mt-1">
        Enter your email and we&apos;ll send a reset link.
      </p>

      {sent ? (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          If an account exists for that email, a reset link has been sent.
        </div>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 space-y-3">
          <input
            className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-[var(--color-text-primary)] outline-none focus:ring-2 focus:ring-orange-400"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <button
            disabled={loading}
            className="w-full rounded-2xl bg-[#ff7a18] py-3 text-sm font-black uppercase tracking-[0.2em] text-white shadow-[0_12px_25px_rgba(255,122,24,0.45)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}

      <div className="mt-5 text-sm text-[var(--color-text-secondary)]">
        <Link className="underline hover:text-[var(--color-primary)]" href="/login">
          Back to login
        </Link>
      </div>
    </>
  )
}
