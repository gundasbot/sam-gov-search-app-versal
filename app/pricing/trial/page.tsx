// app/pricing/trial/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AccessControlModal from '@/components/AccessControlModal'

export default function PricingTrialPage() {
  const router = useRouter()
  const [open, setOpen] = useState(true)

  useEffect(() => {
    // Ensure modal opens on load
    setOpen(true)
  }, [])

  return (
    <main className="min-h-screen bg-slate-950">
      <AccessControlModal
        isOpen={open}
        onClose={() => {
          setOpen(false)
          router.push('/pricing')
        }}
        featureName="7-Day Free Trial"
        onAccessGranted={() => {
          // AccessControlModal already pushes to /search after auth in your component,
          // so we don't need extra routing here.
        }}
      />
    </main>
  )
}
