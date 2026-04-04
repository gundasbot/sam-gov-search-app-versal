// File: components/FloatingCTA.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { Search, X, Sparkles, ArrowRight, Zap, Trophy, Target } from "lucide-react"

// Rotating CTA messages for variety
const CTA_MESSAGES = [
  { text: "Start Free 7-Day Trial", subtext: "No credit card required" },
  { text: "Try Free for 7 Days", subtext: "Search government contracts" },
  { text: "Start Winning Contracts", subtext: "1,500+ live opportunities" },
  { text: "Get Started Free", subtext: "Join 500+ contractors" },
]

const CTA_ICONS = [Search, Zap, Trophy, Target]

function FloatingCTA() {
  const { status } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      if (typeof window === "undefined") return false
      return sessionStorage.getItem("cta-dismissed") === "true"
    } catch {
      return false
    }
  })
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [messageIndex, setMessageIndex] = useState(0)
  const pathname = usePathname()
  const router = useRouter()

  // Rotate messages every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % CTA_MESSAGES.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

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
    pathname?.includes("/verify-email") ||
    pathname?.includes("/register")

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    try {
      sessionStorage.setItem("cta-dismissed", "true")
    } catch {
      // ignore (Safari private mode, etc.)
    }
  }, [])

  const goToSignup = useCallback(() => {
    router.push("/signup")
  }, [router])

  useEffect(() => {
    if (isDismissed) return

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
  }, [isDismissed])

  // Don't render when authenticated, on hidden pages, dismissed, or when input is focused
  if (status === 'authenticated' || isDismissed || isHiddenPage || isInputFocused) return null

  const currentMessage = CTA_MESSAGES[messageIndex]
  const CurrentIcon = CTA_ICONS[messageIndex]

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

          {/* Pulsing ring animation */}
          <div className="absolute inset-0 rounded-2xl animate-ping opacity-20" style={{ background: '#ea580c' }} />

          {/* Main CTA Card */}
          <button
            onClick={goToSignup}
            className="relative flex max-w-96 items-center gap-3 rounded-2xl px-5 py-4 shadow-2xl hover:scale-[1.02] transition-all duration-300 group"
            style={{
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 group-hover:bg-white/30 transition-colors">
              <CurrentIcon className="h-6 w-6 text-white" />
            </div>
            <div className="text-left flex-1">
              <p className="text-base font-bold leading-tight text-white transition-all duration-300">
                {currentMessage.text}
              </p>
              <p className="text-sm leading-tight text-white/90 mt-0.5">
                {currentMessage.subtext}
              </p>
            </div>
            <ArrowRight className="h-5 w-5 text-white group-hover:translate-x-1 transition-transform" />
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
        <div
          className="shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
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
            onClick={goToSignup}
            className="w-full px-5 py-4 flex items-center gap-3"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 shrink-0">
              <CurrentIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-base font-bold text-white">{currentMessage.text}</p>
              <p className="text-sm text-white/90">{currentMessage.subtext}</p>
            </div>
            <ArrowRight className="h-5 w-5 text-white shrink-0" />
          </button>
        </div>
      </div>
    </>
  )
}

export default FloatingCTA