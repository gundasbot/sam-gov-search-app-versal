'use client'

import { useEffect } from 'react'

export default function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Enable smooth scrolling for the entire document
    document.documentElement.style.scrollBehavior = 'smooth'

    // Cleanup function
    return () => {
      document.documentElement.style.scrollBehavior = 'auto'
    }
  }, [])

  return <>{children}</>
}
