'use client'

import { useEffect, useState } from 'react'
import { X, Cookie, Shield, BarChart3 } from 'lucide-react'

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

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 rounded-full border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 ${
        checked
          ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-muted)]'
      } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0.5'
        }`}
      />
    </button>
  )
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
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

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent')
    if (!consent) {
      const timer = window.setTimeout(() => setShowBanner(true), 650)
      return () => window.clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    const shouldLock = showBanner || showSettings
    if (!shouldLock) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [showBanner, showSettings])

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs))
    setPreferences(prefs)
    setShowSettings(false)
    setShowBanner(false)

    if (prefs.analytics) {
      console.log('Analytics initialized')
    }
    if (prefs.marketing) {
      console.log('Marketing initialized')
    }
  }

  const acceptAll = () =>
    savePreferences({ necessary: true, analytics: true, marketing: true, preferences: true })

  const rejectAll = () =>
    savePreferences({ necessary: true, analytics: false, marketing: false, preferences: false })

  const saveCustom = () => savePreferences(preferences)

  if (!showBanner) return null

  return (
    <>
      {!showSettings && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[1200] px-3 pb-3 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:w-[420px] sm:px-0 sm:pb-0">
          <div className="pointer-events-auto animate-cookie-in rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)]">
            <div className="relative p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setShowBanner(false)}
                className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                aria-label="Dismiss cookie notice"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="flex items-start gap-3 pr-9">
                <div className="mt-0.5 hidden rounded-xl bg-[var(--color-primary)]/12 p-2.5 text-[var(--color-primary)] sm:block">
                  <Cookie className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-semibold text-[var(--color-text-primary)]">Cookie preferences</h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    We use cookies to improve functionality and measure performance. You can accept all,
                    reject optional cookies, or customize by category.
                  </p>

                  <div className="mt-2 text-sm">
                    <a
                      href="/privacy"
                      className="font-semibold text-[var(--color-primary)] underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    >
                      Read privacy policy
                    </a>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 px-2 sm:gap-2.5 sm:px-1">
                    <button
                      type="button"
                      onClick={acceptAll}
                      className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] active:translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    >
                      Accept All
                    </button>

                    <button
                      type="button"
                      onClick={rejectAll}
                      className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)] active:translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    >
                      Reject All
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowSettings(true)}
                      className="col-span-2 mx-0.5 w-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] active:translate-y-[1px] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                    >
                      Customize
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className="fixed inset-0 z-[1250] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
          <div className="animate-modal-in flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)] sm:rounded-2xl">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-4 sm:px-6">
              <div className="flex items-center gap-2.5">
                <div className="rounded-lg bg-[var(--color-primary)]/12 p-2 text-[var(--color-primary)]">
                  <Shield className="h-4 w-4" />
                </div>
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)] sm:text-xl">Cookie settings</h2>
              </div>

              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
                aria-label="Close cookie settings"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-6">
              <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Choose which optional cookies we can use. Necessary cookies are always enabled because
                they keep core features working.
              </p>

              <div className="space-y-3">
                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Necessary cookies</h3>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Required for authentication, session safety, and core functionality.</p>
                    </div>
                    <Toggle checked={true} onChange={() => {}} disabled />
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
                        <BarChart3 className="h-4 w-4 text-[var(--color-primary)]" /> Analytics cookies
                      </h3>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Help us understand feature usage and improve performance.</p>
                    </div>
                    <Toggle
                      checked={preferences.analytics}
                      onChange={() => setPreferences((p) => ({ ...p, analytics: !p.analytics }))}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Marketing cookies</h3>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Used to measure campaigns and improve ad relevance.</p>
                    </div>
                    <Toggle
                      checked={preferences.marketing}
                      onChange={() => setPreferences((p) => ({ ...p, marketing: !p.marketing }))}
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Preference cookies</h3>
                      <p className="mt-1 text-xs text-[var(--color-text-secondary)]">Remember your app settings and display preferences.</p>
                    </div>
                    <Toggle
                      checked={preferences.preferences}
                      onChange={() => setPreferences((p) => ({ ...p, preferences: !p.preferences }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-[var(--color-border)] px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="w-full rounded-xl bg-[var(--color-surface-muted)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition hover:text-[var(--color-text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={rejectAll}
                  className="w-full rounded-xl border border-[var(--color-border)] bg-transparent px-4 py-2.5 text-sm font-semibold text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Reject All
                </button>
                <button
                  type="button"
                  onClick={saveCustom}
                  className="w-full rounded-xl bg-[var(--color-primary)] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 sm:w-auto"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes cookieIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(8px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .animate-cookie-in {
          animation: cookieIn 220ms ease-out;
        }

        .animate-modal-in {
          animation: modalIn 220ms ease-out;
        }
      `}</style>
    </>
  )
}
