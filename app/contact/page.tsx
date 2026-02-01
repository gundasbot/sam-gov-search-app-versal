'use client'

import React, { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Mail, Building, Phone, User, MessageSquare, Send, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'

export default function ContactPage() {
  const { data: session } = useSession()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    company: '',
    phone: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/contact/enterprise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to send inquiry')
      }

      setIsSuccess(true)
    } catch (err) {
      console.error('Contact form error:', err)
      setError('Failed to send your inquiry. Please try again or email us directly at sales@precisegovcon.com')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/30 rounded-2xl p-8">
            <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              Thank You!
            </h2>
            
            <p className="text-slate-300 mb-6">
              We've received your enterprise inquiry and one of our team members will reach out to you within 24 hours.
            </p>
            
            <Link
              href="/search"
              className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              Continue to Search
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent mb-4">
            Enterprise Solutions
          </h1>
          <p className="text-xl text-slate-400">
            Let's discuss how Precise GovCon can help your organization win more federal contracts
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6">Get in Touch</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                  Email Address *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              {/* Company */}
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-slate-300 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Acme Corporation"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-slate-300 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-500" />
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-slate-300 mb-2">
                  Tell us about your needs
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 h-5 w-5 text-slate-500" />
                  <textarea
                    id="message"
                    name="message"
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-10 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    placeholder="Tell us about your team size, requirements, and what you're looking to achieve..."
                  />
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg">
                  <p className="text-sm text-rose-400">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Inquiry
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Enterprise Benefits */}
          <div className="space-y-6">
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">Why Choose Enterprise?</h3>
              <ul className="space-y-4">
                {[
                  'Dedicated account manager',
                  'Custom integrations with your systems',
                  'Priority 24/7 phone support',
                  'SLA guarantee (99.9% uptime)',
                  'Unlimited team members',
                  'Advanced security & compliance',
                  'Custom training sessions',
                  'Quarterly business reviews',
                ].map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-white mb-4">Direct Contact</h3>
              <div className="space-y-3">
                <p className="text-slate-300">
                  Prefer to reach out directly?
                </p>

                <a
                  href="mailto:sales@precisegovcon.com"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  sales@precisegovcon.com
                </a>
                <p className="text-sm text-slate-400 mt-4">
                  We typically respond within 24 hours during business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}