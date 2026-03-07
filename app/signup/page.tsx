// app/signup/page.tsx

import { Suspense } from 'react'
import SignUpClient from './signup-client'

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f7f8fa]" />}>
      <SignUpClient />
    </Suspense>
  )
}
