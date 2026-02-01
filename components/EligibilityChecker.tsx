// components/EligibilityChecker.tsx
'use client'

import { useState } from 'react'
import { CheckCircle, Send, Shield, Award, Users, Target } from 'lucide-react'

const certifications = [
  { id: 'small-business', label: 'Small Business', description: 'Under SBA size standards', icon: Shield },
  { id: '8a', label: '8(a) Business Development', description: 'Socially & economically disadvantaged', icon: Award },
  { id: 'sdvosb', label: 'SDVOSB', description: 'Service-Disabled Veteran-Owned', icon: Shield },
  { id: 'vosb', label: 'VOSB', description: 'Veteran-Owned Small Business', icon: Shield },
  { id: 'wosb', label: 'WOSB', description: 'Women-Owned Small Business', icon: Users },
  { id: 'edwosb', label: 'EDWOSB', description: 'Economically Disadvantaged WOSB', icon: Users },
  { id: 'hubzone', label: 'HUBZone', description: 'Historically Underutilized Business Zone', icon: Target },
]

export default function EligibilityChecker() {
  const [selected, setSelected] = useState<string[]>([])
  const [formData, setFormData] = useState({ name: '', email: '', company: '', phone: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await fetch('/api/eligibility-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          certifications: selected.map(id => certifications.find(c => c.id === id)?.label)
        }),
      })
      setSubmitted(true)
    } catch (error) {
      alert('Error submitting. Please email sales@precisegovcon.com')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="bg-emerald-50 rounded-3xl p-12 text-center border-2 border-emerald-200">
        <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-4" />
        <h3 className="text-3xl font-black mb-4">Request Received!</h3>
        <p className="text-gray-600 mb-6">We'll contact you within 24 hours with your eligibility assessment.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-3xl p-8 border-2 border-emerald-200 shadow-xl">
      <h3 className="text-3xl font-black mb-6">Check Your Eligibility</h3>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid md:grid-cols-2 gap-4">
          {certifications.map((cert) => {
            const Icon = cert.icon
            const isSelected = selected.includes(cert.id)
            return (
              <button
                key={cert.id}
                type="button"
                onClick={() => setSelected(prev => 
                  prev.includes(cert.id) ? prev.filter(id => id !== cert.id) : [...prev, cert.id]
                )}
                className={`p-5 border-2 rounded-2xl text-left transition-all ${
                  isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isSelected ? 'bg-emerald-500' : 'bg-gray-100'}`}>
                    {isSelected ? <CheckCircle className="w-6 h-6 text-white" /> : <Icon className="w-6 h-6 text-gray-500" />}
                  </div>
                  <div>
                    <div className="font-bold mb-1">{cert.label}</div>
                    <div className="text-sm text-gray-600">{cert.description}</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none" />
          <input type="email" placeholder="Email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none" />
          <input type="text" placeholder="Company Name" required value={formData.company} onChange={(e) => setFormData({...formData, company: e.target.value})} className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none" />
          <input type="tel" placeholder="Phone" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 outline-none" />
        </div>

        <button type="submit" disabled={selected.length === 0 || submitting} className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-xl transition-all">
          {submitting ? 'Submitting...' : <><Send className="w-5 h-5" /> Get Free Assessment</>}
        </button>
      </form>
    </div>
  )
}