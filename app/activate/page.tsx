'use client';

// app/activate/page.tsx 
// This page handles admin-created user activation:
//   1. Reads ?token=&email=&code= from the URL
//   2. Shows a "Set your password" form
//   3. POSTs to /api/auth/activate which verifies the token,
//      sets the password, marks email_verified, activates the account
//   4. Auto-signs the user in and redirects to /search

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, EyeOff, Check, X, Loader2, AlertCircle, ArrowRight, Shield } from 'lucide-react';

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: '8+ characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  const allPass = checks.every(c => c.pass);
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
            i < checks.filter(c => c.pass).length
              ? checks.filter(c => c.pass).length === 3 ? 'bg-emerald-500' : 'bg-orange-400'
              : 'bg-slate-200'
          }`} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.map(c => (
          <div key={c.label} className="flex items-center gap-1">
            {c.pass
              ? <Check className="w-3 h-3 text-emerald-500" />
              : <X className="w-3 h-3 text-slate-300" />}
            <span className={`text-xs ${c.pass ? 'text-emerald-600' : 'text-slate-400'}`}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type Stage = 'form' | 'loading' | 'success' | 'error' | 'expired';

function ActivateContent() {
  const params   = useSearchParams();
  const router   = useRouter();

  const token     = params.get('token')     ?? '';
  const email     = params.get('email')     ?? '';
  const code      = params.get('code')      ?? '';
  const firstName = params.get('firstName') ?? '';
  const trialDays = parseInt(params.get('trialDays') ?? '7', 10);

  const [password,    setPassword]    = useState('');
  const [confirm,     setConfirm]     = useState('');
  const [showPw,      setShowPw]      = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [stage,       setStage]       = useState<Stage>('form');
  const [errorMsg,    setErrorMsg]    = useState('');

  // Guard: no token in URL
  if (!token || !email) {
    return <ErrorState message="This activation link is incomplete or malformed. Please use the exact link from your email." />;
  }

  const passwordsMatch    = confirm.length > 0 && password === confirm;
  const passwordsMismatch = confirm.length > 0 && password !== confirm;
  const passwordStrong    = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordStrong)  { setErrorMsg('Please choose a stronger password.'); return; }
    if (!passwordsMatch)  { setErrorMsg('Passwords do not match.'); return; }

    setErrorMsg('');
    setStage('loading');

    try {
      // Step 1: Verify token + set password + activate account
      const res = await fetch('/api/auth/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password, activationCode: code || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 410) { setStage('expired'); return; }
        setErrorMsg(data?.error || 'Activation failed. Please try again or contact support.');
        setStage('form');
        return;
      }

      // Step 2: Auto sign-in with the new credentials
      const signInResult = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.ok) {
        setStage('success');
      } else {
        // Activation worked but auto-login failed — still show success, ask to log in
        setStage('success');
      }
    } catch {
      setErrorMsg('Something went wrong. Please try again.');
      setStage('form');
    }
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (stage === 'success') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4">
        <div className="max-w-lg w-full">
          <div className="flex justify-center mb-6">
            <Image src="/precise-govcon-logo.jpg" alt="PreciseGovCon" width={150} height={50} className="h-12 w-auto" />
          </div>
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
            {/* Green header */}
            <div className="bg-gradient-to-r from-emerald-500 to-green-600 px-8 py-10 text-center">
              <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-5">
                <Check className="w-10 h-10 text-white" strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-black text-white mb-2">
                You're all set{firstName ? `, ${firstName}` : ''}!
              </h1>
              <p className="text-emerald-100 text-lg font-semibold">Account activated — your trial has started</p>
            </div>
            {/* Body */}
            <div className="px-8 py-8 space-y-4">
              {[
                { icon: '✅', title: 'Password set & email verified',            sub: 'Your account is fully secured' },
                { icon: '🎯', title: `${trialDays}-day free trial activated`,    sub: 'Full platform access unlocked immediately' },
                { icon: '🔍', title: '1,300+ live federal opportunities waiting', sub: 'Start finding contracts that match your profile' },
              ].map(({ icon, title, sub }) => (
                <div key={title} className="flex items-start gap-4 bg-slate-50 rounded-2xl px-5 py-4">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{icon}</span>
                  <div>
                    <p className="text-base font-black text-slate-900">{title}</p>
                    <p className="text-sm font-medium text-slate-500 mt-0.5">{sub}</p>
                  </div>
                </div>
              ))}
              <button
                onClick={() => router.push('/search')}
                className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white text-lg font-black flex items-center justify-center gap-3 transition-colors shadow-lg shadow-orange-500/25 mt-2"
              >
                Start Searching Contracts <ArrowRight className="w-5 h-5" />
              </button>
              <p className="text-center text-sm text-slate-400 font-medium">You're signed in and ready to go</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── EXPIRED ───────────────────────────────────────────────────────────────
  if (stage === 'expired') {
    return (
      <ErrorState
        message="This activation link has expired (links are valid for 72 hours). Please contact support for a new one."
        showContact
      />
    );
  }

  // ── FORM ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-orange-50 p-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Image src="/precise-govcon-logo.jpg" alt="PreciseGovCon" width={140} height={46} className="h-10 w-auto" />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden">

          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-8 text-center">
            <h1 className="text-3xl font-black text-white">
              {firstName ? `Welcome, ${firstName}!` : 'Activate your account'}
            </h1>
            <p className="text-orange-100 text-base font-semibold mt-2">Set a password to complete your account setup</p>
          </div>

          <div className="px-8 py-7">

            {/* Email display */}
            <div className="mb-6 flex items-center gap-4 bg-slate-50 border-2 border-slate-200 rounded-2xl px-5 py-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                <span className="text-orange-600 font-black text-xl">{email[0]?.toUpperCase()}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Activating account for</p>
                <p className="text-base font-black text-slate-800 truncate">{email}</p>
              </div>
            </div>

            {/* Activation code badge */}
            {code && (
              <div className="mb-5 flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-amber-700 font-semibold">Activation code applied</p>
                  <p className="text-sm font-black text-amber-800 font-mono tracking-widest">{code}</p>
                </div>
              </div>
            )}

            {/* Error */}
            {errorMsg && (
              <div className="mb-5 flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-red-700">{errorMsg}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Password */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">
                  Choose a Password *
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 chars, 1 uppercase, 1 number"
                    required
                    disabled={stage === 'loading'}
                    className="w-full h-12 rounded-xl border-2 border-slate-200 bg-slate-50 px-4 pr-12 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-500/10 transition-all disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <PasswordStrength password={password} />
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm font-black text-slate-700 mb-2 uppercase tracking-wider">
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    disabled={stage === 'loading'}
                    className={`w-full h-12 rounded-xl border-2 bg-slate-50 px-4 pr-12 text-[15px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-4 transition-all disabled:opacity-60 ${
                      passwordsMismatch ? 'border-red-400 focus:ring-red-400/10'
                      : passwordsMatch  ? 'border-emerald-400 focus:ring-emerald-400/10 bg-emerald-50'
                      : 'border-slate-200 focus:border-orange-400 focus:ring-orange-500/10 focus:bg-white'
                    }`}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    {passwordsMatch    && <Check className="w-4 h-4 text-emerald-500" />}
                    {passwordsMismatch && <X    className="w-4 h-4 text-red-400" />}
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="text-slate-400 hover:text-slate-600">
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {passwordsMismatch && <p className="mt-1.5 text-xs text-red-500 font-medium">Passwords do not match</p>}
                {passwordsMatch    && <p className="mt-1.5 text-xs text-emerald-600 font-medium">✓ Passwords match</p>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={stage === 'loading' || passwordsMismatch || !password || !confirm}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-all disabled:opacity-60 shadow-lg shadow-orange-500/25 mt-2"
              >
                {stage === 'loading'
                  ? <><Loader2 className="w-5 h-5 animate-spin" /> Activating…</>
                  : <><span>Activate My Account</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>

            </form>

            <p className="text-center text-xs text-slate-400 mt-5">
              Wrong account?{' '}
              <Link href="/login" className="text-orange-500 font-semibold hover:text-orange-600">Go to login</Link>
              {' · '}
              <a href="mailto:support@precisegovcon.com" className="text-orange-500 font-semibold hover:text-orange-600">Need help?</a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function ErrorState({ message, showContact }: { message: string; showContact?: boolean }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-red-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="flex justify-center mb-8">
          <Image src="/precise-govcon-logo.jpg" alt="PreciseGovCon" width={140} height={46} className="h-10 w-auto" />
        </div>
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-8">
          <div className="h-14 w-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
            <X className="w-7 h-7 text-red-500" strokeWidth={2.5} />
          </div>
          <h1 className="text-xl font-black text-slate-800 mb-2">Activation Failed</h1>
          <p className="text-slate-500 text-sm mb-6">{message}</p>
          {showContact && (
            <a
              href="mailto:support@precisegovcon.com?subject=Activation Link Expired"
              className="block w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm text-center transition-colors mb-3"
            >
              Request a New Link
            </a>
          )}
          <Link href="/login" className="block w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold text-sm text-center transition-colors">
            Back to Login
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function ActivatePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    }>
      <ActivateContent />
    </Suspense>
  );
}