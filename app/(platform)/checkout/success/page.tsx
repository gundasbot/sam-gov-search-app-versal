// app/checkout/success/page.tsx
import { Suspense } from 'react'
import SuccessClient from './SuccessClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 text-slate-900 flex items-center justify-center p-8">
          <div className="max-w-lg w-full rounded-2xl border border-slate-200 bg-white shadow-sm p-6 text-center">
            <div className="mx-auto mb-3 h-10 w-10 rounded-full border-4 border-slate-200 border-t-slate-800 animate-spin" />
            <div className="text-base font-semibold">Loading checkout confirmation...</div>
          </div>
        </div>
      }
    >
      <SuccessClient />
    </Suspense>
  )
}
