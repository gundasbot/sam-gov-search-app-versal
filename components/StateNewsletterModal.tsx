// components/StateNewsletterModal.tsx
'use client'

import { useState } from 'react'
import { X, Mail, CheckCircle } from 'lucide-react'

interface StateNewsletterModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function StateNewsletterModal({ isOpen, onClose }: StateNewsletterModalProps) {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      // In a real app, you would send this to your backend
      // For now, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Here you would typically make an API call:
      // const response = await fetch('/api/newsletter/subscribe', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ email, name })
      // })
      
      // For demo purposes, we'll just show success
      setIsSubmitted(true)
      
      // Reset form after 3 seconds and close modal
      setTimeout(() => {
        setEmail('')
        setName('')
        setIsSubmitted(false)
        onClose()
      }, 3000)
      
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
                <Mail className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Get State Updates</h3>
                <p className="text-sm text-slate-400">Be the first to know about new state coverage</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-700 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </div>
              <h4 className="text-xl font-bold text-white mb-2">You're on the list!</h4>
              <p className="text-slate-300 mb-1">
                Thanks <span className="text-emerald-400 font-semibold">{name}</span>!
              </p>
              <p className="text-slate-400">
                We'll email updates about new state coverage to <span className="text-cyan-300">{email}</span>
              </p>
              <div className="mt-4 text-xs text-slate-500">
                Closing in a few seconds...
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-lg">
                <p className="text-sm text-slate-200">
                  We're expanding our state procurement coverage. Sign up to get notified when we add new states!
                </p>
                <div className="flex items-center gap-2 mt-2 text-xs text-emerald-300">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span>Next up: New York, New Jersey, Connecticut</span>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                      Your Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition"
                      placeholder="you@company.com"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <p className="text-sm text-red-400">{error}</p>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-semibold rounded-lg transition-all disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Submitting...
                        </span>
                      ) : (
                        'Get Notified of New States'
                      )}
                    </button>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-slate-500">
                      We respect your privacy. Unsubscribe anytime.
                    </p>
                  </div>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}