// File: components/FloatingCTA.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Search, X, Sparkles } from "lucide-react"

function FloatingCTA() {
  const { status } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isInputFocused, setIsInputFocused] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Hide completely on auth/login/account pages and search page
  const isHiddenPage =
    pathname?.includes("/login") ||
    pathname?.includes("/sign-in") ||
    pathname?.includes("/sign-up") ||
    pathname?.includes("/signup") ||
    pathname?.includes("/reset-password") ||
    pathname?.includes("/reset-request") ||
    pathname?.includes("/account") ||
    pathname?.includes("/search") ||
    pathname?.includes("/pricing") ||
    pathname?.includes("/verify-email")

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    try {
      sessionStorage.setItem("cta-dismissed", "true")
    } catch {
      // ignore (Safari private mode, etc.)
    }
  }, [])

  const goToSearch = useCallback(() => {
    // Pass ?from=cta to trigger modal for non-authenticated visitors
    router.push("/search?from=cta")
  }, [router])

  useEffect(() => {
    // Check if user has dismissed it in this session
    try {
      const dismissed = sessionStorage.getItem("cta-dismissed")
      if (dismissed) {
        setIsDismissed(true)
        return
      }
    } catch {
      // ignore
    }

    // Show the CTA after user scrolls down 300px
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300)
    }

    // Hide when any input is focused (mobile keyboard / forms)
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName?.toUpperCase()
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        setIsInputFocused(true)
      }
    }

    const handleFocusOut = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return
      const tag = target.tagName?.toUpperCase()
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") {
        setTimeout(() => setIsInputFocused(false), 250)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    document.addEventListener("focusin", handleFocusIn)
    document.addEventListener("focusout", handleFocusOut)

    // IMPORTANT: set initial state immediately (not only after first scroll)
    handleScroll()

    return () => {
      window.removeEventListener("scroll", handleScroll)
      document.removeEventListener("focusin", handleFocusIn)
      document.removeEventListener("focusout", handleFocusOut)
    }
  }, [])

  // ✅ FIX: Don't render when authenticated, on hidden pages, dismissed, or when input is focused
  if (status === 'authenticated' || isDismissed || isHiddenPage || isInputFocused) return null

  return (
    <>
      {/* Floating Bottom Right CTA - Desktop */}
      <div
        className={`
          fixed bottom-6 right-6 z-40
          hidden md:block
          transition-all duration-500
          ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-12 opacity-0 pointer-events-none"
          }
        `}
      >
        <div className="group relative">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute -top-2 -right-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700 transition-colors"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>

          {/* Main CTA Card */}
          <button
            onClick={goToSearch}
            className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 p-5 shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all duration-300"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-bold text-white">Start Free Trial</p>
              <p className="text-xs text-emerald-50">Search government contracts</p>
            </div>
            <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
          </button>
        </div>
      </div>

      {/* Floating Bottom CTA - Mobile */}
      <div
        className={`
          fixed bottom-0 left-0 right-0 z-40
          md:hidden
          transition-all duration-500
          ${
            isVisible
              ? "translate-y-0 opacity-100"
              : "translate-y-full opacity-0 pointer-events-none"
          }
        `}
      >
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-2xl">
          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-800/80 text-white"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>

          {/* CTA Content */}
          <button
            onClick={goToSearch}
            className="w-full px-6 py-4 flex items-center gap-4"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 flex-shrink-0">
              <Search className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-bold text-white">Start Your Free Trial</p>
              <p className="text-sm text-emerald-50">Search 1,000+ government contracts</p>
            </div>
            <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse flex-shrink-0" />
          </button>
        </div>
      </div>
    </>
  )
}

export default FloatingCTA
