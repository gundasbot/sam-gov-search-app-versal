import { useState } from 'react'
import { Mail, Phone, HelpCircle, X } from 'lucide-react'

interface SupportModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, message })
      })

      if (response.ok) {
        alert('Support request submitted successfully!')
        onClose()
      } else {
        alert('Failed to submit support request')
      }
    } catch (error) {
      console.error('Support request error:', error)
      alert('An error occurred. Please try again.')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-8 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-slate-400 hover:text-white"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Need Support?</h2>
          <p className="text-slate-400">We're here to help you resolve any issues</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Your Email
            </label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
              placeholder="you@company.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Description of Issue
            </label>
            <textarea 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={4}
              className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-xl text-white"
              placeholder="Describe your issue in detail..."
            />
          </div>

          <div className="pt-4 border-t border-slate-700 text-center">
            <p className="text-slate-400 text-sm mb-2">
              Alternative Support Channels
            </p>
            <div className="flex justify-center gap-4">
              <a 
                href="mailto:support@precisegovcon.com" 
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
              >
                <Mail className="w-5 h-5" /> Email
              </a>
              <a 
                href="tel:+18004567890" 
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-2"
              >
                <Phone className="w-5 h-5" /> Call
              </a>
            </div>
          </div>

          <button 
            type="submit" 
            className="w-full mt-4 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-xl hover:from-cyan-600 hover:to-blue-600"
          >
            Submit Support Request
          </button>
        </form>
      </div>
    </div>
  )
}