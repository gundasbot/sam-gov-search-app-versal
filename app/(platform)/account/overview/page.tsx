"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AccountOverviewRedirect() {
  const router = useRouter()

  useEffect(() => {
    const existing = typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : ""
    const suffix = existing ? `&${existing}` : ""
    router.replace(`/account?tab=overview${suffix}`)
  }, [router])

  return null
}
