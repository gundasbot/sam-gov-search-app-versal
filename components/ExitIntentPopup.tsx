//app/components/ExitIntentPopup.tsx
"use client"

import { useEffect, useState, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { X, ArrowRight, Search, Bell, Shield, Gift } from "lucide-react"

// Rotating headlines for variety
const HEADLINES = [
  { 
    eyebrow: "Wait! Before you go...",
    title: "Don't Miss Out on Federal Contracts",
    subtitle: "Join 500+ contractors finding opportunities before their competitors.",
    cta: "Start Free 7-Day Trial",
  },
  { 
    eyebrow: "One more thing...",
    title: "Your Competitors Are Already Here",
    subtitle: "Get instant alerts when new contracts match your NAICS codes.",
    cta: "Try Free for 7 Days",
  },
  { 
    eyebrow: "Special offer!",
    title: "Start Winning More Contracts",
    subtitle: "AI-powered search finds the right opportunities for your business.",
    cta: "Get Started Free",
  },
]

const BENEFITS = [
  { icon: Search, text: "Search 1,500+ live opportunities" },
  { icon: Bell, text: "Instant email alerts for new contracts" },
  { icon: Shield, text: "Filter by SDVOSB, VOSB, 8(a) & more" },
]

function ExitIntentPopup() {
  const { status } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const [headlineIndex] = useState(() => Math.floor(Math.random() * HEADLINES.length))
  const pathname = usePathname()
  const router = useRouter()

  // Pages where we don't show the popup
  const isHiddenPage =
    pathname?.includes("/login") ||
    pathname?.includes("/sign-in") ||
    pathname?.includes("/sign-up") ||
    pathname?.includes("/signup") ||
    pathname?.includes("/reset-password") ||
    pathname?.includes("/reset-request") ||
    pathname?.includes("/account") ||
    pathname?.includes("/pricing") ||
    pathname?.includes("/verify-email") ||
    pathname?.includes("/register") ||
    pathname?.includes("/checkout")

  const handleClose = useCallback(() => {
    setIsVisible(false)
    try {
      sessionStorage.setItem("exit-popup-shown", "true")
    } catch {
      // ignore
    }
  }, [])

  const goToSignup = useCallback(() => {
    handleClose()
    router.push("/signup")
  }, [router, handleClose])

  useEffect(() => {
    // Don't run on server
    if (typeof window === "undefined") return

    // Check if already shown this session
    try {
      if (sessionStorage.getItem("exit-popup-shown") === "true") {
        setHasTriggered(true)
        return
      }
    } catch {
      // ignore
    }

    // Exit intent detection (desktop only - mouse leaving viewport)
    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves through top of viewport
      if (e.clientY <= 5 && !hasTriggered) {
        setHasTriggered(true)
        // Small delay for better UX
        setTimeout(() => setIsVisible(true), 100)
      }
    }

    // Add listener after a delay (don't trigger immediately)
    const timeout = setTimeout(() => {
      document.addEventListener("mouseleave", handleMouseLeave)
    }, 5000) // Wait 5 seconds before enabling

    return () => {
      clearTimeout(timeout)
      document.removeEventListener("mouseleave", handleMouseLeave)
    }
  }, [hasTriggered])

  // Don't render for authenticated users or on certain pages
  if (status === "authenticated" || isHiddenPage || !isVisible) return null

  const headline = HEADLINES[headlineIndex]

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="relative w-full max-w-[92vw] sm:max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden pointer-events-auto animate-in zoom-in-95 fade-in duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Orange header banner */}
          <div
            className="px-4 sm:px-6 py-4 sm:py-5 text-center"
            style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Gift className="h-5 w-5 text-yellow-300" />
              <span className="text-sm font-bold text-white/90 uppercase tracking-wide">
                {headline.eyebrow}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {headline.title}
            </h2>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 py-4 sm:py-6">
            <p className="text-center text-slate-600 text-base mb-6">
              {headline.subtitle}
            </p>

            {/* Benefits list */}
            <div className="space-y-3 mb-6">
              {BENEFITS.map((benefit, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 shrink-0">
                    <benefit.icon className="h-5 w-5 text-orange-600" />
                  </div>
                  <span className="text-slate-700 font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <button
                onClick={goToSignup}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl text-white font-bold text-lg transition-all hover:scale-[1.02] shadow-lg"
                style={{ background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)' }}
              >
                {headline.cta}
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={handleClose}
                className="w-full px-6 py-3 rounded-xl text-slate-500 font-medium text-sm hover:text-slate-700 hover:bg-slate-50 transition-colors"
              >
                No thanks, I'll pass
              </button>
            </div>

            {/* Trust badge */}
            <p className="text-center text-xs text-slate-400 mt-4">
              ✓ No credit card required · ✓ Cancel anytime · ✓ SOC 2 Compliant
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ExitIntentPopup