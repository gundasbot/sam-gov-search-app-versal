'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  ExternalLink,
  HelpCircle,
  Search,
  Mail,
  MessageCircle,
  FileText,
  Book,
  ChevronDown,
} from 'lucide-react'

export default function HelpStatusPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [activeTab, setActiveTab] = useState<'help' | 'status'>('help')

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const faqs = [
    {
      question: 'How do I search for contracts?',
      answer: 'Navigate to the Search page and use filters like NAICS code, agency, location, and set-aside type to find relevant opportunities. You can combine multiple filters for more precise results.'
    },
    {
      question: 'What is a set-aside contract?',
      answer: 'Set-aside contracts are reserved for specific business types like VOSB (Veteran-Owned Small Business), SDVOSB (VETERAN-OWNED Small Business), 8(a), HUBZone, WOSB (Women-Owned Small Business), and other small businesses. These set-asides help level the playing field for eligible businesses.'
    },
    {
      question: 'How often is data updated?',
      answer: 'We pull data from SAM.gov and state systems in real-time throughout the day, ensuring you never miss new opportunities. Our live ticker at the top of each page shows the most recent opportunities as they\'re posted.'
    },
    {
      question: 'Can I save searches or set alerts?',
      answer: 'Yes! Create a free account to save searches, set up email alerts for specific criteria, and track opportunities in your personalized dashboard. You can customize alert frequency and filters.'
    },
    {
      question: 'Do you cover state and local contracts?',
      answer: 'Yes, we aggregate opportunities from federal (SAM.gov), state, and local procurement systems nationwide. This includes systems like eVA (Virginia), eMMA (Maryland), and other state portals.'
    },
    {
      question: 'How do I register my business for government contracting?',
      answer: 'Visit SAM.gov to register your business for federal contracting (required for all federal contracts). For state contracts, check your state\'s procurement portal. Registration is free but may require documentation like tax ID, DUNS number, and business certifications.'
    },
    {
      question: 'What are NAICS codes and why do they matter?',
      answer: 'NAICS (North American Industry Classification System) codes classify businesses by industry. Government contracts are often categorized by NAICS codes, and some set-asides require specific codes. Make sure your business is registered with relevant NAICS codes.'
    },
    {
      question: 'How do I get certified as a VOSB or other set-aside?',
      answer: 'For VOSB/SDVOSB certification, visit the VA\'s Vets First Verification Program. For 8(a), contact the SBA. For WOSB, use the SBA\'s certification program. HUBZone certification is also through the SBA. Each has specific eligibility requirements and documentation.'
    },
  ]

  const helpTopics = [
    {
      icon: Search,
      title: 'Help & Documentation | PreciseGovCon',
      description: 'Learn how to search for opportunities and use filters effectively',
      topics: [
        'Creating your account',
        'Understanding the search interface',
        'Using advanced filters',
        'Saving searches and setting alerts'
      ]
    },
    {
      icon: FileText,
      title: 'Help & Documentation | PreciseGovCon',
      description: 'Guide to reading and responding to government solicitations',
      topics: [
        'Reading solicitation documents',
        'Understanding deadlines and requirements',
        'Preparing competitive proposals',
        'Common submission mistakes to avoid'
      ]
    },
    {
      icon: Book,
      title: 'Help & Documentation | PreciseGovCon',
      description: 'Learn about VOSB, 8(a), HUBZone, WOSB and more',
      topics: [
        'Overview of set-aside types',
        'Eligibility requirements',
        'Certification processes',
        'Maintaining your certification'
      ]
    },
    {
      icon: MessageCircle,
      title: 'Help & Documentation | PreciseGovCon',
      description: 'Manage your account, subscription, and billing',
      topics: [
        'Updating account information',
        'Managing subscriptions',
        'Billing and payment methods',
        'Cancellation policy'
      ]
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-emerald-500/20 via-teal-500/15 to-cyan-500/10 rounded-full blur-3xl animate-pulse" />
        <div
          className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tr from-orange-500/15 via-amber-500/10 to-rose-500/5 rounded-full blur-3xl animate-pulse"
          style={{ animationDelay: '1s' }}
        />
      </div>

      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Scroll to Top Button - TOP LEFT */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="fixed top-32 left-6 z-50 p-3 bg-gradient-to-br from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-full shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 transition-all hover:scale-110 group"
        aria-label="Scroll to top"
      >
        <ChevronDown className="w-5 h-5 rotate-180 group-hover:-translate-y-1 transition-transform" />
      </button>

      {/* Hero */}
      <section className="relative z-10 pt-24 pb-16 px-6">
        <div className="max-w-480 mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-black mb-6">
            <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
              Help Center & System Status
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Find answers, check system status, and get support
          </p>
        </div>
      </section>

      {/* Tab Navigation */}
      <section className="relative z-10 px-6 mb-8">
        <div className="max-w-480 mx-auto">
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setActiveTab('help')}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'help'
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              Help Center
            </button>
            <button
              onClick={() => setActiveTab('status')}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'status'
                  ? 'bg-gradient-to-r from-emerald-600 to-cyan-600 text-white shadow-lg'
                  : 'bg-slate-800/50 text-slate-400 hover:text-white'
              }`}
            >
              System Status
            </button>
          </div>
        </div>
      </section>

      {/* Help Center Content */}
      {activeTab === 'help' && (
        <>
          {/* Help Topics */}
          <section className="relative z-10 py-16 px-6 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-purple-500/5">
            <div className="max-w-480 mx-auto">
              <h2 className="text-3xl font-black text-white mb-8 text-center">Browse Help Topics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {helpTopics.map((topic) => (
                  <div
                    key={topic.title}
                    className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-emerald-500/30 transition-all"
                  >
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl mb-4 group-hover:scale-110 transition-transform">
                      <topic.icon className="w-6 h-6 text-emerald-400" />
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">{topic.title}</h3>
                    <p className="text-sm text-slate-400 mb-4">{topic.description}</p>
                    <ul className="space-y-2">
                      {topic.topics.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-500 flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* FAQs */}
          <section className="relative z-10 py-16 px-6">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-black text-white mb-8 text-center">Frequently Asked Questions</h2>
              
              <div className="space-y-4">
                {faqs.map((faq, index) => (
                  <details
                    key={index}
                    className="group bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-xl overflow-hidden"
                  >
                    <summary className="flex items-center gap-3 px-6 py-4 cursor-pointer hover:bg-white/5 transition-colors">
                      <HelpCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                      <span className="font-bold text-white flex-1">{faq.question}</span>
                      <ChevronDown className="w-5 h-5 text-slate-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <div className="px-6 pb-4 text-slate-300 leading-relaxed border-t border-slate-700/50 pt-4 mt-2">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </section>

          {/* Contact Support */}
          <section className="relative z-10 py-16 px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl font-black text-white mb-4">
                Still Need Help?
              </h2>
              <p className="text-lg text-slate-300 mb-8">
                Our support team is here to help you succeed
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a
                  href="mailto:support@precisegovcon.com"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-bold rounded-xl transition-all hover:scale-105"
                >
                  <Mail className="w-5 h-5" />
                  Email Support
                </a>
                
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Mon–Fri • 9am–5pm ET</span>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* System Status Content */}
      {activeTab === 'status' && (
        <>
          <section className="relative z-10 pb-16 px-6">
            <div className="max-w-480 mx-auto">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Pentagon-Style Clock */}
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-6 h-6 text-cyan-400" />
                    <h3 className="text-2xl font-bold text-white">Current Time (Eastern)</h3>
                  </div>
                  
                  {/* Digital Clock Display */}
                  <div className="bg-black/40 rounded-xl p-8 mb-4 border border-cyan-500/30">
                    <div className="text-center">
                      <div className="text-6xl font-mono font-black text-emerald-400 mb-2 tracking-wider">
                        {currentTime.toLocaleTimeString('en-US', { 
                          timeZone: 'America/New_York', 
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit',
                          hour12: false 
                        })}
                      </div>
                      <div className="text-lg text-slate-400 font-semibold">
                        {currentTime.toLocaleDateString('en-US', { 
                          timeZone: 'America/New_York', 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-slate-400 text-xs mb-1">Timezone</div>
                      <div className="text-white font-bold">EST/EDT</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                      <div className="text-slate-400 text-xs mb-1">UTC Offset</div>
                      <div className="text-white font-bold">-05:00</div>
                    </div>
                  </div>
                </div>

                {/* Precise GovCon Status */}
                <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-2xl font-bold text-white">Precise GovCon Status</h3>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-6">
                    <div className="relative">
                      <div className="w-4 h-4 bg-emerald-500 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
                    </div>
                    <span className="text-2xl font-bold text-emerald-400">All Systems Operational</span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Search Engine</span>
                      <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Dashboard</span>
                      <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">Email Alerts</span>
                      <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Online
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <span className="text-slate-300">API Services</span>
                      <span className="flex items-center gap-2 text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Online
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SAM.gov Status */}
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <ExternalLink className="w-6 h-6 text-blue-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-white">SAM.gov System Status</h3>
                    </div>
                    <p className="text-slate-300 mb-4">
                      Check the official SAM.gov system status for real-time updates on federal contracting systems and data feeds.
                    </p>
                    <a
                      href="https://sam.gov"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all hover:scale-105"
                    >
                      Visit SAM.gov
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
