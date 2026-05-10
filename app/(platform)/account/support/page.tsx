"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AccountSupportRedirect() {
  const router = useRouter()

  useEffect(() => {
    const existing = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : ""
    const suffix = existing ? `&${existing}` : ""
    router.replace(`/account?tab=support${suffix}`)
  }, [router])

  return null
}
