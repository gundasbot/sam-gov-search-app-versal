'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function AccountSettingsRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/account?tab=settings')
  }, [router])

  return (
    <div
      className="pg-account-modern min-h-screen flex items-center justify-center"
      style={{ background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
    >
      <div className="flex items-center gap-2 text-base font-bold text-slate-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        Opening Settings & Security...
      </div>
    </div>
  )
}
