// app/verify-success/page.tsx
import { Suspense } from 'react'
import VerifySuccessClient from './VerifySuccessClient'

export const dynamic = 'force-dynamic'

export default function VerifySuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-white to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifySuccessClient />
    </Suspense>
  )
}
