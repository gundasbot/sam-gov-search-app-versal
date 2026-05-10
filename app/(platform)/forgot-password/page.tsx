// app/forgot-password/page.tsx
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import ForgotPasswordClient from './ForgotPasswordClient'

export const metadata = {
  title: 'Reset Password | Precise GovCon',
  description: 'Reset your Precise GovCon account password.',
}

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>
}) {
  const params = await searchParams
  const initialEmail = params?.email || ''

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: '#f97316' }} />
      </div>
    }>
      <ForgotPasswordClient initialEmail={initialEmail} />
    </Suspense>
  )
}