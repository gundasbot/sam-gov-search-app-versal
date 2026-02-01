'use client'

import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'

export default function ScrollToTopLeft() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => {
      setIsVisible(window.scrollY > 80)
    }

    window.addEventListener('scroll', toggleVisibility, { passive: true })
    toggleVisibility()

    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (!isVisible) return null

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 left-6 z-[9999] p-3 bg-gradient-to-br from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-full shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-110 group"
      aria-label="Scroll to top"
    >
      <ChevronUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
    </button>
  )
}
