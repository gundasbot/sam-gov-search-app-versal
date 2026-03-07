// app/contact/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { 
  Mail, Building, Phone, User, MessageSquare, Send, Loader2, CheckCircle,
  FileText, Award, ShieldCheck, Zap, TrendingUp, Search as SearchIcon, Calendar
} from 'lucide-react'
import Link from 'next/link'
import { Suspense } from 'react'

export const dynamic = 'force-dynamic'

// Service configurations for dynamic hero
const serviceConfigs: Record<string, {
  title: string
  subtitle: string
  icon: React.ReactNode
  color: string
  benefits: string[]
}> = {
  'sam-registration': {
    title: 'Get Started with SAM Registration',
    subtitle: 'Expert guidance for your SAM.gov registration and renewals',
    icon: <ShieldCheck className="w-12 h-12" />,
    color: 'blue',
    benefits: [
      'Complete registration support',
      'Annual renewal reminders',
      'Compliance guidance',
      'Entity monitoring',
    ],
  },
  'proposal-writing': {
    title: 'Win More with Professional Proposals',
    subtitle: 'AI-powered proposal writing that gets results',
    icon: <FileText className="w-12 h-12" />,
    color: 'orange',
    benefits: [
      'AI-powered drafting',
      'Expert review & editing',
      'Competitive pricing analysis',
      'Fast turnaround',
    ],
  },
  'bid-no-bid': {
    title: 'Make Smarter Bid Decisions',
    subtitle: 'Strategic bid/no-bid analysis',
    icon: <Zap className="w-12 h-12" />,
    color: 'indigo',
    benefits: [
      'Win probability analysis',
      'Risk assessment',
      'Strategic recommendations',
      'Resource optimization',
    ],
  },
  'certifications': {
    title: 'Get Certified for Set-Aside Contracts',
    subtitle: '8(a), SDVOSB, HUBZone, WOSB/EDWOSB support',
    icon: <Award className="w-12 h-12" />,
    color: 'purple',
    benefits: [
      '8(a) certification support',
      'SDVOSB/VOSB guidance',
      'HUBZone & WOSB help',
      'Compliance monitoring',
    ],
  },
  'capability-statements': {
    title: 'Create a Capability Statement That Wins',
    subtitle: 'Professional one-pagers that open doors',
    icon: <TrendingUp className="w-12 h-12" />,
    color: 'teal',
    benefits: [
      'Professional design',
      'Strategic positioning',
      'Prime & sub versions',
      'Multiple formats',
    ],
  },
  'search': {
    title: 'Start Finding Federal Opportunities',
    subtitle: 'Advanced search tools and saved searches',
    icon: <SearchIcon className="w-12 h-12" />,
    color: 'emerald',
    benefits: [
      'Real-time opportunity alerts',
      'Advanced filtering',
      'Saved searches',
      'Export capabilities',
    ],
  },
  'general': {
    title: 'Contact PreciseGovCon',
    subtitle: 'Expert guidance tailored to your business',
    icon: <Building className="w-12 h-12" />,
    color: 'cyan',
    benefits: [
      'Free consultation',
      'Expert guidance',
      'No obligation',
      'Fast response within 24 hours',
    ],
  },
}

function ContactPageContent() {
  const { data: session } = useSession()
  const searchParams = useSearchParams()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState('')

  // Get service from URL parameter
  const serviceParam = searchParams?.get('service') || 'general'
  const config = serviceConfigs[serviceParam] || serviceConfigs['general']

  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
    company: '',
    phone: '',
    service: serviceParam,
    message: '',
  })

  // Update service when URL parameter changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, service: serviceParam }))
  }, [serviceParam])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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
      setError('Failed to send your inquiry. Please try again or email us directly at support@precisegovcon.com')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          <div className="bg-slate-800/50 border border-emerald-500/30 rounded-2xl p-8 backdrop-blur-sm">
            <div className="h-16 w-16 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-4">
              Thank You!
            </h2>
            
            <p className="text-slate-300 mb-6">
              We've received your inquiry and one of our team members will reach out to you within 24 hours.
            </p>
            
            <div className="flex gap-3 justify-center">
              <Link
                href="/search"
                className="inline-flex items-center justify-center bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Continue to Search
              </Link>
              <Link
                href="/services"
                className="inline-flex items-center justify-center bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-600 transition-colors"
              >
                View Services
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Dynamic Header based on service */}
        <div className="mb-10">
          <div className="flex items-center justify-center mb-4">
            <div className={`h-16 w-16 rounded-2xl bg-${config.color}-500/20 flex items-center justify-center text-${config.color}-400`}>
              {config.icon}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3 text-center">
            {config.title}
          </h1>
          <p className="text-lg text-slate-300 text-center max-w-2xl mx-auto">
            {config.subtitle}
          </p>
        </div>

        <div className="grid lg:grid-cols-[2fr_1fr] gap-8">
          {/* Contact Form - Takes up ~66% (2/3) of width */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-bold text-white mb-6">Send Us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-10 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-10 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
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
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-10 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="Acme Corp"
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
                      className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-10 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="(555) 123-4567"
                    />
                  </div>
                </div>
              </div>

              {/* Service Dropdown */}
              <div>
                <label htmlFor="service" className="block text-sm font-medium text-slate-300 mb-2">
                  What are you interested in? *
                </label>
                <select
                  id="service"
                  name="service"
                  required
                  value={formData.service}
                  onChange={handleChange}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="general">General Inquiry</option>
                  <option value="sam-registration">SAM Registration</option>
                  <option value="proposal-writing">Proposal Writing</option>
                  <option value="bid-no-bid">Bid/No-Bid Analysis</option>
                  <option value="certifications">Set-Aside Certifications</option>
                  <option value="capability-statements">Capability Statements</option>
                  <option value="search">Search & Alerts</option>
                </select>
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
                    className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-10 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    placeholder="Tell us about your requirements and what you're looking to achieve..."
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
                className="w-full bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

          {/* Sidebar - Takes up ~33% (1/3) of width */}
          <div className="space-y-6">
            {/* What You Get */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-6">What You Get</h3>
              <ul className="space-y-4">
                {config.benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-300">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Schedule a Call with Calendly */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/30 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4">Schedule a Call</h3>
              <p className="text-slate-300 text-sm mb-4">
                Prefer to talk? Schedule a time that works for you.
              </p>
              <a
                href={process.env.NEXT_PUBLIC_CALENDLY_LINK || 'https://calendly.com/contact-preciseanalytics/demo-session-with-precise-govcon'}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                <Calendar className="h-5 w-5" />
                Book a Meeting
              </a>
            </div>

            {/* Need Help Right Away */}
            <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm">
              <h3 className="text-xl font-bold text-white mb-4">Need Help Right Away?</h3>
              <div className="space-y-3">
                <p className="text-slate-300 text-sm">
                  Our team is here to help. Reach out directly:
                </p>

                <a
                  href="mailto:support@precisegovcon.com"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Mail className="h-5 w-5" />
                  support@precisegovcon.com
                </a>

                <a
                  href="tel:804-404-6005"
                  className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Phone className="h-5 w-5" />
                  (804) 404-6005
                </a>

                <p className="text-sm text-slate-400 mt-4">
                  We typically respond within 1 business day.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ContactPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ContactPageContent />
    </Suspense>
  )
}