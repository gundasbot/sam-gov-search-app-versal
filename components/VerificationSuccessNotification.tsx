// components/VerificationSuccessNotification.tsx
'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function VerificationSuccessNotification() {
  const searchParams = useSearchParams()
  const [show, setShow] = useState(false)
  const [message, setMessage] = useState('')
  
  useEffect(() => {
    const verified = searchParams.get('verified')
    const name = searchParams.get('name') || 'there'
    const error = searchParams.get('error')
    const alreadyVerified = searchParams.get('message') === 'already-verified'

    if (verified === 'true') {
      setMessage(`🎉 Welcome ${decodeURIComponent(name)}! Your email is verified and your 7-day trial is active. Please sign in below to get started.`)
      setShow(true)
      
      // Auto-hide after 10 seconds
      setTimeout(() => setShow(false), 10000)
    } else if (alreadyVerified) {
      setMessage('ℹ️ Your email is already verified. Please sign in below.')
      setShow(true)
      setTimeout(() => setShow(false), 5000)
    } else if (error) {
      const errorMessages: Record<string, string> = {
        'invalid-token': '❌ Invalid verification link. Please request a new one.',
        'verification-failed': '❌ Verification failed. Please try again or contact support.',
        'expired': '❌ This verification link has expired. Please request a new one.',
      }
      setMessage(errorMessages[error] || '❌ Something went wrong. Please try again.')
      setShow(true)
      setTimeout(() => setShow(false), 8000)
    }
  }, [searchParams])

  if (!show) return null

  const isError = message.includes('❌')
  const isSuccess = message.includes('🎉')

  return (
    <div 
      className={`
        fixed top-4 left-1/2 transform -translate-x-1/2 z-50
        max-w-2xl w-full mx-4
        p-4 rounded-lg shadow-lg
        ${isError ? 'bg-red-50 border-2 border-red-500 text-red-900' : ''}
        ${isSuccess ? 'bg-green-50 border-2 border-green-500 text-green-900' : ''}
        ${!isError && !isSuccess ? 'bg-blue-50 border-2 border-blue-500 text-blue-900' : ''}
        animate-slide-down
      `}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-1">
          <p className="font-semibold text-sm md:text-base">{message}</p>
        </div>
        <button
          onClick={() => setShow(false)}
          className="ml-4 text-gray-500 hover:text-gray-700"
          aria-label="Close notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}

// Add this to your globals.css or tailwind config:
/*
@keyframes slide-down {
  from {
    opacity: 0;
    transform: translate(-50%, -100%);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0);
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}
*/