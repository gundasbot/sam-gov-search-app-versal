"use client"

import { useState } from "react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
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
    <main className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
        <h1 className="text-xl font-semibold">Forgot password</h1>
        <p className="text-sm text-slate-300 mt-2">
          Enter your email and we’ll send a reset link.
        </p>

        {sent ? (
          <div className="mt-5 rounded-xl border border-emerald-700/40 bg-emerald-900/20 p-4 text-sm">
            If an account exists for that email, a reset link has been sent.
          </div>
        ) : (
          <form onSubmit={onSubmit} className="mt-5 space-y-3">
            <input
              className="w-full rounded-xl bg-slate-950 border border-slate-800 px-4 py-3 outline-none"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
            />
            <button
              disabled={loading}
              className="w-full rounded-xl bg-white text-slate-900 py-3 font-medium disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-5 text-sm text-slate-300">
          <Link className="underline" href="/login">
            Back to login
          </Link>
        </div>
      </div>
    </main>
  )
}
