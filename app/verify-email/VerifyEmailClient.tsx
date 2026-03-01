"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import Link from "next/link";

function VerifyEmailContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { status: sessionStatus } = useSession();

  // Get params from redirect (not from original token)
  const status = params?.get("status"); // 'success' or 'error'
  const autoLoginToken = params?.get("autoLogin");
  const welcome = params?.get("welcome") === 'true';
  const errorMessage = params?.get("message");

  const [autoLoginStatus, setAutoLoginStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [countdown, setCountdown] = useState(5);
  const [userName, setUserName] = useState('');
  const [shouldRedirect, setShouldRedirect] = useState(false);

  // STEP 1: Use the autoLoginToken to sign in via NextAuth
  useEffect(() => {
    if (status === 'success' && autoLoginToken && autoLoginStatus === 'idle') {
      setAutoLoginStatus('loading');

      fetch('/api/auth/auto-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: autoLoginToken }),
      })
        .then((res) => res.json())
        .then(async (data) => {
          if (data.ok && data.user) {
            setUserName(data.user.first_name || data.user.name || '');

            const result = await signIn('credentials', {
              email: data.user.email,
              password: '',
              auto_login_user_id: data.user.id,
              redirect: false,
            });

            if (result?.ok) {
              setAutoLoginStatus('success');
            } else {
              console.error('SignIn failed:', result?.error);
              setAutoLoginStatus('error');
            }
          } else {
            console.error('Auto-login validation failed:', data.error);
            setAutoLoginStatus('error');
          }
        })
        .catch((err) => {
          console.error('Auto-login fetch error:', err);
          setAutoLoginStatus('error');
        });
    }
  }, [status, autoLoginToken, autoLoginStatus]);

  // STEP 2: Countdown + auto-redirect after successful sign-in
  useEffect(() => {
    if (status === 'success' && (autoLoginStatus === 'success' || sessionStatus === 'authenticated')) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setShouldRedirect(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [status, autoLoginStatus, sessionStatus]);

  // STEP 3: Navigate after countdown
  useEffect(() => {
    if (shouldRedirect) {
      router.push('/search');
    }
  }, [shouldRedirect, router]);

  // ─── LOADING (if somehow no status yet) ─────────────────────────────
  if (!status) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-11 w-11 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
          <p className="text-slate-500 text-sm font-medium">Verifying your email…</p>
        </div>
      </main>
    );
  }

  // ─── SUCCESS ─────────────────────────────────────────────────────────
  if (status === 'success') {
    const isSignedIn = autoLoginStatus === 'success' || sessionStatus === 'authenticated';

    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-emerald-50 p-4">
        <div className="max-w-lg w-full">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img
              src="/precise-govcon-logo.jpg"
              alt="Precise GovCon"
              className="h-10 object-contain"
            />
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/60 p-8">
            {/* Success Icon */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full blur-lg" />
                <div className="relative h-18 w-18 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center"
                     style={{ height: '72px', width: '72px' }}>
                  <svg className="h-9 w-9 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Headline */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-slate-800 mb-1">
                Welcome to Precise GovCon{userName ? `, ${userName}` : ''}!
              </h2>
              
              <p className="text-slate-500">
                Your email has been verified successfully.
              </p>
            </div>

            {/* Trial badge - only show if welcome is true (first time) */}
            {welcome && (
              <div className="flex justify-center mb-6">
                <span className="inline-flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold px-3 py-1 rounded-full">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  7-Day Free Trial Started
                </span>
              </div>
            )}

            {/* Feature highlights */}
            <div className="space-y-2 mb-7">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-blue-50">
                  <svg className="h-4.5 w-4.5 text-blue-600" style={{ height: '18px', width: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-800 font-semibold text-sm">Search Federal Contracts</p>
                  <p className="text-slate-500 text-xs">Access thousands of opportunities from SAM.gov</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-emerald-50">
                  <svg className="h-4.5 w-4.5 text-emerald-600" style={{ height: '18px', width: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-800 font-semibold text-sm">Filter by Set-Asides</p>
                  <p className="text-slate-500 text-xs">SDVOSB, 8(a), HUBZone, WOSB & more</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div className="p-2 rounded-lg bg-violet-50">
                  <svg className="h-4.5 w-4.5 text-violet-600" style={{ height: '18px', width: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </div>
                <div>
                  <p className="text-slate-800 font-semibold text-sm">Track Opportunities</p>
                  <p className="text-slate-500 text-xs">Save and monitor contracts that match your business</p>
                </div>
              </div>
            </div>

            {/* CTA area */}
            {isSignedIn ? (
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/search')}
                  className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800
                           text-white font-semibold text-base flex items-center justify-center gap-2
                           transition-colors duration-150 shadow-md shadow-emerald-200"
                >
                  Start Your Search
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
                <p className="text-center text-slate-400 text-xs">
                  Redirecting in {countdown} seconds…
                </p>
              </div>
            ) : autoLoginStatus === 'loading' ? (
              <div className="flex items-center justify-center gap-2 py-3">
                <svg className="animate-spin h-5 w-5 text-emerald-500" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-slate-500 text-sm">Signing you in…</span>
              </div>
            ) : autoLoginStatus === 'error' ? (
              <div className="space-y-3">
                <p className="text-center text-red-500 text-sm">Auto-login failed. Please sign in manually.</p>
                <Link
                  href="/login"
                  className="block w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700
                           text-white font-semibold text-base text-center transition-colors duration-150
                           shadow-md shadow-emerald-200"
                >
                  Sign In Manually
                </Link>
              </div>
            ) : (
              <Link
                href="/login"
                className="block w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700
                         text-white font-semibold text-base text-center transition-colors duration-150
                         shadow-md shadow-emerald-200"
              >
                Sign In to Start Searching
              </Link>
            )}
          </div>

          {/* Footer hint */}
          <p className="text-center text-slate-400 text-xs mt-5">
            Press <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-500 font-mono text-xs">/</kbd> or{' '}
            <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-100 text-slate-500 font-mono text-xs">Ctrl K</kbd> to quickly search
          </p>
        </div>
      </main>
    );
  }

  // ─── ERROR ───────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-red-50 p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <img
            src="/precise-govcon-logo.jpg"
            alt="Precise GovCon"
            className="h-10 object-contain"
          />
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg shadow-slate-200/60 p-8 text-center">
          {/* Error Icon */}
          <div className="flex justify-center mb-5">
            <div className="h-16 w-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <svg className="h-7 w-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Verification Failed
          </h2>
          
          <p className="text-slate-500 text-sm mb-6">
            {errorMessage || 'This verification link is invalid or has expired. Please request a new verification email.'}
          </p>

          <div className="space-y-2.5">
            <Link
              href="/login"
              className="block w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700
                       text-white font-semibold text-sm text-center transition-colors duration-150
                       shadow-md shadow-emerald-200"
            >
              Go to Login
            </Link>
            <Link
              href="/signup"
              className="block w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white
                       hover:bg-slate-50 text-slate-600 font-semibold text-sm text-center transition-colors duration-150"
            >
              Create New Account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function VerifyEmailClient() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="animate-spin h-11 w-11 border-4 border-emerald-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}


