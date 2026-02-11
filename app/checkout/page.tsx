'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function CheckoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to pricing page
    router.replace('/pricing')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-4" />
        <p className="text-slate-400">Redirecting to pricing...</p>
      </div>
    </div>
  )
}
