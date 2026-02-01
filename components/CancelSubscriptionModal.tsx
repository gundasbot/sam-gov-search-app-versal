// components/CancelSubscriptionModal.tsx
'use client'

import { useState } from 'react'
import { X, AlertTriangle, Check, Loader2, Shield } from 'lucide-react'

interface CancelSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
  subscriptionId: string | null
  planName?: string
  billingPeriodEnd?: string
  onSuccess?: () => void
}

export default function CancelSubscriptionModal({
  isOpen,
  onClose,
  subscriptionId,
  planName = 'Premium',
  billingPeriodEnd,
  onSuccess,
}: CancelSubscriptionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleCancel = async () => {
    if (!subscriptionId) {
      setError('No subscription ID found. Please contact support.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      setSuccess(true)
      
      // Wait a moment to show success state
      setTimeout(() => {
        onSuccess?.()
        onClose()
      }, 2000)
    } catch (err) {
      console.error('Cancel error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-red-500 to-orange-600 p-8 text-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors backdrop-blur-sm"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="relative">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-sm mb-4 shadow-lg">
              {success ? (
                <Check className="w-10 h-10 text-white animate-scaleIn" />
              ) : (
                <AlertTriangle className="w-10 h-10 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-black text-white mb-2">
              {success ? 'Cancellation Scheduled' : 'Cancel Subscription?'}
            </h2>
            <p className="text-white/90 text-sm font-medium">
              {success 
                ? 'Your subscription will be canceled at the end of your billing period'
                : `You're about to cancel your ${planName} plan`
              }
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-8">
          {!success ? (
            <>
              {/* What Happens */}
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100">
                  <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-1">
                      Your subscription will remain active
                    </div>
                    <div className="text-sm text-gray-600 leading-relaxed">
                      You'll continue to have full access until{' '}
                      <span className="font-bold text-gray-900">
                        {billingPeriodEnd 
                          ? new Date(billingPeriodEnd).toLocaleDateString('en-US', { 
                              month: 'long', 
                              day: 'numeric', 
                              year: 'numeric' 
                            })
                          : 'the end of your billing period'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 rounded-2xl bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-100">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-sm font-bold text-gray-900 mb-1">
                      You'll lose access to
                    </div>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Advanced search & filters</li>
                      <li>• AI-powered insights</li>
                      <li>• Unlimited opportunity tracking</li>
                      <li>• Priority support</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-200 animate-shake">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-bold text-red-900 mb-1">
                        Cancellation failed
                      </div>
                      <div className="text-sm text-red-700">
                        {error}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Debug Info - Show subscription ID if error */}
              {error && (
                <div className="mb-6 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <div className="text-xs text-gray-500 mb-1 font-bold">Debug Info:</div>
                  <div className="text-xs text-gray-600 break-all">
                    Subscription ID: {subscriptionId || 'Not provided'}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 px-6 py-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-900 font-bold text-sm transition-all hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  Keep Subscription
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 px-6 py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white font-bold text-sm transition-all hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  disabled={loading || !subscriptionId}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Canceling...
                    </>
                  ) : (
                    'Cancel Plan'
                  )}
                </button>
              </div>
            </>
          ) : (
            // Success State
            <div className="text-center py-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 mb-4 shadow-lg">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                Cancellation Confirmed
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your subscription will end on{' '}
                <span className="font-bold text-gray-900">
                  {billingPeriodEnd 
                    ? new Date(billingPeriodEnd).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric' 
                      })
                    : 'your billing end date'
                  }
                </span>
                . You can reactivate anytime before then.
              </p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  )
}