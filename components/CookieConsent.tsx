'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X, Shield, BarChart3, Cookie } from 'lucide-react'

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

const defaultPreferences: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
  preferences: false,
}

function Toggle({
  checked,
  onChange,
  disabled = false,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7a18] focus-visible:ring-offset-2 ${
        checked
          ? 'border-[#ff7a18] bg-[#ff7a18]'
          : 'border-gray-500 bg-gray-600'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
    >
      <span
        className={`pointer-events-none inline-block h-4 w-4 mt-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [visible, setVisible] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(() => {
    if (typeof window === 'undefined') return defaultPreferences
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) return defaultPreferences
    try {
      return JSON.parse(consent) as CookiePreferences
    } catch {
      return defaultPreferences
    }
  })

  // Show banner after short delay if no consent stored
  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      const timer = window.setTimeout(() => {
        setShowBanner(true)
        // Trigger slide-up after mount
        requestAnimationFrame(() => {
          requestAnimationFrame(() => setVisible(true))
        })
      }, 800)
      return () => window.clearTimeout(timer)
    }
  }, [])

  // Lock scroll when settings modal open
  useEffect(() => {
    if (!showSettings) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [showSettings])

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs))
    setPreferences(prefs)
    // Animate out
    setVisible(false)
    setTimeout(() => {
      setShowSettings(false)
      setShowBanner(false)
    }, 350)

    if (prefs.analytics) console.log('Analytics initialized')
    if (prefs.marketing) console.log('Marketing initialized')
  }

  const acceptAll = () =>
    savePreferences({ necessary: true, analytics: true, marketing: true, preferences: true })

  const rejectAll = () =>
    savePreferences({ necessary: true, analytics: false, marketing: false, preferences: false })

  const saveCustom = () => savePreferences(preferences)

  const dismiss = () => {
    setVisible(false)
    setTimeout(() => setShowBanner(false), 350)
  }

  if (!showBanner) return null

  return (
    <>
      {/* ── BOTTOM BAR ── Full width fix applied */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[1200] w-screen transition-transform duration-500 ease-out"
        style={{ 
          transform: visible ? 'translateY(0)' : 'translateY(110%)', 
          pointerEvents: visible ? 'auto' : 'none' 
        }}
        role="region"
        aria-label="Cookie consent"
      >
        {/* Backdrop fade at top of bar */}
        <div className="pointer-events-none h-6 w-full"
          style={{ background: 'linear-gradient(to bottom, transparent, rgba(15,23,42,0.15))' }} />

        {/* Main bar - full width with gradient background */}
        <div
          className="pgc-cookie-bar border-t w-full bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] shadow-[0_-8px_40px_rgba(0,0,0,0.5),0_-2px_0_rgba(255,122,24,0.3)] border-[rgba(255,122,24,0.25)]"
        >
          {/* Content container - centered with max width */}
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex w-full min-w-0 flex-col py-5 justify-between sm:flex-row sm:items-center sm:py-6 lg:py-6">

              {/* ── Left: icon + text ── */}
              <div className="flex min-w-0 flex-1 items-start gap-2 sm:gap-3 sm:items-center">
                <div
                  className="mt-0.5 flex-shrink-0 rounded-lg p-1.5 sm:p-2 sm:mt-0"
                  style={{ background: 'rgba(255,122,24,0.15)', border: '1px solid rgba(255,122,24,0.3)' }}
                >
                  <Cookie className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: '#ff7a18' }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold sm:text-base md:text-lg" style={{ color: '#ffffff', marginBottom: 2 }}>
                    We value your privacy
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed sm:text-sm md:text-base" style={{ color: '#94a3b8' }}>
                    We use cookies to improve functionality and measure performance.{' '}
                    <Link
                      href="/cookie-policy"
                      className="font-semibold underline underline-offset-2 transition-colors hover:text-white focus:outline-none"
                      style={{ color: '#ff7a18' }}
                    >
                      Cookie Policy
                    </Link>
                  </p>
                </div>
              </div>

              {/* ── Right: buttons ── */}
              <div
                className="flex min-w-0 items-center gap-1 sm:gap-2.5"
                style={{ flexWrap: 'nowrap', overflowX: 'auto' }}
              >
                <button
                  type="button"
                  onClick={() => setShowSettings(true)}
                  className="rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:px-4 sm:text-base whitespace-nowrap"
                  style={{ borderColor: 'rgba(148,163,184,0.3)', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}
                >
                  Customize Settings
                </button>

                <button
                  type="button"
                  onClick={rejectAll}
                  className="rounded-lg border px-2 py-1.5 text-xs font-semibold transition-all hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:px-4 sm:text-base whitespace-nowrap"
                  style={{ borderColor: 'rgba(148,163,184,0.3)', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}
                >
                  Essential Only
                </button>

                <button
                  type="button"
                  onClick={acceptAll}
                  className="rounded-lg px-3 py-1.5 text-xs font-black transition-all hover:opacity-90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-1 sm:px-5 sm:text-base whitespace-nowrap"
                  style={{
                    background: 'linear-gradient(135deg, #ff7a18, #f97316)',
                    boxShadow: '0 4px 14px rgba(255,122,24,0.4)',
                    color: '#ffffff',
                  }}
                >
                  Accept All
                </button>

                <button
                  type="button"
                  onClick={dismiss}
                  className="rounded-lg p-1 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                  style={{ color: '#64748b' }}
                  aria-label="Dismiss cookie notice"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SETTINGS MODAL ── (unchanged) */}
      {showSettings && (
        <div
          className="fixed inset-0 z-[1250] flex items-end justify-center p-0 sm:items-center sm:p-4"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowSettings(false) }}
        >
          <div
            className="pgc-cookie-modal animate-settings-in flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border sm:rounded-2xl"
            style={{
              background: 'linear-gradient(160deg, #1e293b 0%, #0f172a 100%)',
              borderColor: 'rgba(255,122,24,0.2)',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              color: '#ffffff',
            }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-5 py-4 sm:px-6"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="rounded-lg p-2"
                  style={{ background: 'rgba(255,122,24,0.15)', border: '1px solid rgba(255,122,24,0.3)' }}
                >
                  <Shield className="h-4 w-4" style={{ color: '#ff7a18' }} />
                </div>
                <h2 className="text-base font-black sm:text-lg" style={{ color: '#ffffff' }}>
                  Cookie Settings
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-2 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                style={{ color: '#64748b' }}
                aria-label="Close cookie settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
              <p className="mb-5 text-sm leading-relaxed" style={{ color: '#94a3b8' }}>
                Choose which optional cookies we can use. Necessary cookies are always enabled —
                they keep core features working.
              </p>

              <div className="space-y-3">
                {/* Necessary */}
                <div
                  className="rounded-xl p-4"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: '#ffffff' }}>Necessary cookies</h3>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: '#64748b' }}>
                        Required for authentication, session safety, and core functionality.
                      </p>
                    </div>
                    <Toggle checked={true} onChange={() => {}} disabled />
                  </div>
                </div>

                {/* Analytics */}
                <div
                  className="rounded-xl p-4 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${preferences.analytics ? 'rgba(255,122,24,0.3)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold" style={{ color: '#ffffff' }}>
                        <BarChart3 className="h-3.5 w-3.5" style={{ color: '#ff7a18' }} />
                        Analytics cookies
                      </h3>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: '#64748b' }}>
                        Help us understand feature usage and improve performance.
                      </p>
                    </div>
                    <Toggle
                      checked={preferences.analytics}
                      onChange={() => setPreferences((p) => ({ ...p, analytics: !p.analytics }))}
                    />
                  </div>
                </div>

                {/* Marketing */}
                <div
                  className="rounded-xl p-4 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${preferences.marketing ? 'rgba(255,122,24,0.3)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: '#ffffff' }}>Marketing cookies</h3>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: '#64748b' }}>
                        Used to measure campaigns and improve ad relevance.
                      </p>
                    </div>
                    <Toggle
                      checked={preferences.marketing}
                      onChange={() => setPreferences((p) => ({ ...p, marketing: !p.marketing }))}
                    />
                  </div>
                </div>

                {/* Preferences */}
                <div
                  className="rounded-xl p-4 transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${preferences.preferences ? 'rgba(255,122,24,0.3)' : 'rgba(255,255,255,0.08)'}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold" style={{ color: '#ffffff' }}>Preference cookies</h3>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: '#64748b' }}>
                        Remember your app settings and display preferences.
                      </p>
                    </div>
                    <Toggle
                      checked={preferences.preferences}
                      onChange={() => setPreferences((p) => ({ ...p, preferences: !p.preferences }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div
              className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-6"
              style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
            >
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:order-1" style={{ color: '#94a3b8' }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={rejectAll}
                className="rounded-lg border px-4 py-2.5 text-sm font-semibold transition-all hover:border-slate-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:order-2" 
                style={{ borderColor: 'rgba(148,163,184,0.3)', background: 'rgba(255,255,255,0.05)', color: '#cbd5e1' }}
              >
                Reject All
              </button>

              <button
                type="button"
                onClick={saveCustom}
                className="rounded-lg px-5 py-2.5 text-sm font-black transition-all hover:opacity-90 active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:order-3"
                style={{
                  background: 'linear-gradient(135deg, #ff7a18, #f97316)',
                  boxShadow: '0 4px 14px rgba(255,122,24,0.35)',
                  color: '#ffffff',
                }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes settingsIn {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)   scale(1);    }
        }
        .animate-settings-in {
          animation: settingsIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* ── Force correct text colours — overrides any global CSS reset ── */

        /* Dark bar: everything is white or slate, never black */
        .pgc-cookie-bar,
        .pgc-cookie-bar * {
          color: inherit !important;
        }
        .pgc-cookie-bar {
          color: #ffffff !important;
        }

        /* Specific text targets inside the bar */
        .pgc-cookie-bar p,
        .pgc-cookie-bar span,
        .pgc-cookie-bar h2,
        .pgc-cookie-bar h3 {
          color: inherit !important;
        }

        /* White text elements */
        .pgc-cookie-white {
          color: #ffffff !important;
        }

        /* Slate-400 muted text */
        .pgc-cookie-muted {
          color: #94a3b8 !important;
        }

        /* Slate-300 button text */
        .pgc-cookie-btn-ghost {
          color: #cbd5e1 !important;
        }
        .pgc-cookie-btn-ghost:hover {
          color: #ffffff !important;
        }

        /* Orange accent */
        .pgc-cookie-orange {
          color: #ff7a18 !important;
        }

        /* White button text on orange bg */
        .pgc-cookie-btn-primary,
        .pgc-cookie-btn-primary * {
          color: #ffffff !important;
        }

        /* SVG icons inside the bar */
        .pgc-cookie-bar svg path,
        .pgc-cookie-bar svg circle,
        .pgc-cookie-bar svg rect,
        .pgc-cookie-bar svg line,
        .pgc-cookie-bar svg polyline {
          stroke: currentColor !important;
        }

        /* Dark modal: same overrides */
        .pgc-cookie-modal,
        .pgc-cookie-modal * {
          color: inherit !important;
        }
        .pgc-cookie-modal {
          color: #ffffff !important;
        }
        .pgc-cookie-modal p,
        .pgc-cookie-modal span {
          color: inherit !important;
        }
      `}</style>
    </>
  )
}