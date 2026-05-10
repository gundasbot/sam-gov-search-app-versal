'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function UnsubscribePage() {
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';

  const [email, setEmail] = useState(emailParam);
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (emailParam) setEmail(emailParam);
  }, [emailParam]);

  const handleUnsubscribe = async () => {
    if (!email.trim()) return;
    setStatus('loading');
    try {
      const res = await fetch('/api/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const d = await res.json();
      if (res.ok) {
        setStatus('done');
      } else {
        setErrorMsg(d.error || 'Something went wrong.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Nav */}
      <nav className="bg-[#0f172a] px-6 lg:px-12 h-16 flex items-center justify-between shrink-0">
        <Link href="/" className="font-black text-xl tracking-tight">
          <span className="text-white">PRECISE</span>
          <span className="text-orange-400">GOVCON</span>
        </Link>
        <span className="text-xs text-white/40 uppercase tracking-widest hidden sm:block">
          Contracting Intelligence
        </span>
      </nav>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-10 max-w-md w-full text-center">

          {status === 'done' ? (
            <>
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-slate-900 mb-3">You're Unsubscribed</h1>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                <strong className="text-slate-700">{email}</strong> has been removed from our outreach list.
                We won't contact you again.
              </p>
              <div className="space-y-3">
                <Link
                  href="/signup"
                  className="block bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-xl text-sm transition"
                >
                  Create a Free Account
                </Link>
                <Link
                  href="/"
                  className="block border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-3 px-6 rounded-xl text-sm transition"
                >
                  Back to PreciseGovCon
                </Link>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-7 h-7 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <h1 className="text-2xl font-black text-slate-900 mb-2">Unsubscribe</h1>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                Confirm your email below to be removed from PreciseGovCon contractor outreach emails.
              </p>

              <div className="mb-4 text-left">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 transition"
                />
              </div>

              {status === 'error' && (
                <p className="text-red-600 text-xs font-semibold mb-4">{errorMsg}</p>
              )}

              <button
                onClick={handleUnsubscribe}
                disabled={status === 'loading' || !email.trim()}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-xl text-sm transition mb-4"
              >
                {status === 'loading' ? 'Unsubscribing…' : 'Confirm Unsubscribe'}
              </button>

              <Link href="/" className="text-xs text-slate-400 hover:text-slate-600 transition">
                Never mind — take me back
              </Link>
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#0f172a] px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
        <span className="text-sm font-bold text-white/40">
          PRECISE<span className="text-orange-400">GOVCON</span>
        </span>
        <div className="flex gap-6 text-xs text-white/30">
          <Link href="/privacy" className="hover:text-white/60 transition">Privacy</Link>
          <Link href="/terms" className="hover:text-white/60 transition">Terms</Link>
          <a href="mailto:support@precisegovcon.com" className="hover:text-white/60 transition">Support</a>
        </div>
        <span className="text-xs text-white/20">© {new Date().getFullYear()} Precise Analytics LLC</span>
      </footer>
    </div>
  );
}

export default function UnsubscribeRoute() {
  return (
    <Suspense>
      <UnsubscribePage />
    </Suspense>
  );
}
