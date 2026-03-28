'use client'
// ── DARK MODE TEMPORARILY DISABLED ──────────────────────────────────────────
// Uncomment the original implementation below to re-enable dark mode.
// Dark mode caused rendering inconsistencies across pages (mixed Tailwind
// dark: variants, [data-theme="dark"] selectors, and inline styles).
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect } from 'react'

export default function ThemeToggle() {
  useEffect(() => {
    // Force light mode globally — clear any stored preference
    const root = document.documentElement
    root.setAttribute('data-theme', 'light')
    root.classList.remove('dark')
    try {
      localStorage.removeItem('theme')
      localStorage.removeItem('color-theme')
      localStorage.removeItem('pgc-theme')
      localStorage.setItem('theme', 'light')
    } catch {}
  }, [])

  // Render nothing — toggle is hidden until dark mode is properly implemented
  return null
}

/* ── ORIGINAL IMPLEMENTATION (restore when ready) ───────────────────────────
'use client'

import { Moon, Sun } from 'lucide-react'
import { useSyncExternalStore } from 'react'

type ThemePreference = 'light' | 'dark' | 'system'
type ResolvedTheme = 'light' | 'dark'
type ThemeSnapshot = { preference: ThemePreference; resolvedTheme: ResolvedTheme }
const SERVER_SNAPSHOT: ThemeSnapshot = { preference: 'system', resolvedTheme: 'light' }
let cachedSnapshot: ThemeSnapshot = SERVER_SNAPSHOT

function resolveTheme(pref: ThemePreference): ResolvedTheme {
  if (pref === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return pref
}

function applyTheme(pref: ThemePreference) {
  const resolved = resolveTheme(pref)
  const root = document.documentElement

  root.classList.add('theme-transition')
  root.setAttribute('data-theme', resolved)
  root.setAttribute('data-theme-preference', pref)
  root.style.colorScheme = resolved

  localStorage.setItem('theme-preference', pref)
  window.dispatchEvent(new Event('pg-theme-change'))

  window.setTimeout(() => {
    root.classList.remove('theme-transition')
  }, 220)
}

function getServerSnapshot(): ThemeSnapshot {
  return SERVER_SNAPSHOT
}

function getClientSnapshot(): ThemeSnapshot {
  if (typeof window === 'undefined') {
    return SERVER_SNAPSHOT
  }

  const stored = localStorage.getItem('theme-preference')
  const preference: ThemePreference = stored === 'light' || stored === 'dark' ? stored : 'system'
  const resolvedTheme: ResolvedTheme =
    preference === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference

  if (
    cachedSnapshot.preference === preference &&
    cachedSnapshot.resolvedTheme === resolvedTheme
  ) {
    return cachedSnapshot
  }

  cachedSnapshot = { preference, resolvedTheme }
  return cachedSnapshot
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {}

  const media = window.matchMedia('(prefers-color-scheme: dark)')
  const onMediaChange = () => onStoreChange()
  const onStorage = () => onStoreChange()
  const onThemeChange = () => onStoreChange()

  media.addEventListener('change', onMediaChange)
  window.addEventListener('storage', onStorage)
  window.addEventListener('pg-theme-change', onThemeChange)

  return () => {
    media.removeEventListener('change', onMediaChange)
    window.removeEventListener('storage', onStorage)
    window.removeEventListener('pg-theme-change', onThemeChange)
  }
}

export default function ThemeToggle() {
  const { preference, resolvedTheme } = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  )

  const toggleTheme = () => {
    const nextPref: ThemePreference = resolvedTheme === 'dark' ? 'light' : 'dark'
    applyTheme(nextPref)
  }

  const label =
    preference === 'system'
      ? `Theme: System (${resolvedTheme})`
      : `Theme: ${resolvedTheme}`

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm transition hover:bg-[var(--color-surface-muted)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
      aria-label={label}
      title={label}
    >
      <span
        className={`transition-transform duration-200 ${resolvedTheme === 'dark' ? 'rotate-0' : 'rotate-180'}`}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="h-4.5 w-4.5" />
        ) : (
          <Moon className="h-4.5 w-4.5" />
        )}
      </span>
    </button>
  )
}

─────────────────────────────────────────────────────────────────────────────*/
