// app/checkout/success/page.tsx
import { Suspense } from 'react'
import SuccessClient from './SuccessClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-8">
          <div>Loading…</div>
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  )
}
