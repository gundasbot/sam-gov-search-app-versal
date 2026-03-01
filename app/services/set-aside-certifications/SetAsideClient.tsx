// app/services/set-aside-certifications/page.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { 
  CheckCircle, 
  Shield, 
  Award, 
  TrendingUp, 
  Users, 
  Target, 
  ArrowRight, 
  Zap, 
  Star, 
  FileCheck, 
  Lightbulb, 
  MessageSquare, 
  AlertCircle, 
  BarChart3, 
  DollarSign, 
  Trophy, 
  Calendar, 
  X, 
  Mail, 
  Phone as PhoneIcon, 
  Building, 
  Clock, 
  Send 
} from 'lucide-react'


export const metadata = {
  alternates: { canonical: 'https://www.precisegovcon.com/services/set-aside-certifications' },
  title: 'Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon',
  description: 'Get certified as SDVOSB, 8(a), HUBZone, or WOSB. We guide you through the entire federal set-aside certification process.',
}
export default function SetAsideCertificationsPage() {
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    message: '',
    preferredDate: '',
    preferredTime: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const certifications = [
    { 
      id: 'small-business', 
      label: 'SBA Small Business', 
      description: 'Under SBA size standards', 
      icon: Shield 
    },
    { 
      id: '8a', 
      label: '8(a)', 
      description: 'Socially & economically disadvantaged', 
      icon: Award 
    },
    { 
      id: 'sdvosb', 
      label: 'SDVOSB', 
      description: 'VETERAN-OWNED', 
      icon: Shield 
    },
    { 
      id: 'vosb', 
      label: 'VOSB', 
      description: 'Veteran-Owned Small Business', 
      icon: Shield 
    },
    { 
      id: 'wosb', 
      label: 'WOSB', 
      description: 'Women-Owned Small Business', 
      icon: Users 
    },
    { 
      id: 'edwosb', 
      label: 'EDWOSB', 
      description: 'Economically Disadvantaged WOSB', 
      icon: Users 
    },
    { 
      id: 'hubzone', 
      label: 'HUBZone', 
      description: 'Historically Underutilized Business Zone', 
      icon: Target 
    },
  ]

  const toggleCertification = (id: string) => {
    setSelectedCertifications(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const selectedCertNames = selectedCertifications
        .map(id => certifications.find(c => c.id === id)?.label)
        .filter(Boolean)

      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          certifications: selectedCertNames.join(', '),
          subject: 'Set-Aside Certification Inquiry'
        }),
      })

      if (response.ok) {
        setSubmitSuccess(true)
        setTimeout(() => {
          setShowModal(false)
          setSubmitSuccess(false)
          setFormData({
            name: '',
            email: '',
            phone: '',
            company: '',
            message: '',
            preferredDate: '',
            preferredTime: ''
          })
        }, 20000)
      } else {
        throw new Error('Failed to send')
      }
    } catch (error) {
      alert('Error submitting form. Please try again or email contact@preciseanalytics.io')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-200 text-sm font-bold mb-6 border border-emerald-500/30">
                <Award className="w-4 h-4" />
                <span>Unlock Set-Aside Opportunities</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                Expand Your Federal Pipeline with Set-Aside Certifications
              </h1>
              
              <p className="text-2xl text-emerald-100 font-semibold mb-4 leading-relaxed">
                Billions in contracts reserved for small businesses. Are you eligible? We will help you find out and get certified.
              </p>
              
              <p className="text-lg text-emerald-200 font-medium mb-8">
                Set-aside certifications (8(a), SDVOSB, HUBZone, WOSB/EDWOSB) give you access to less competitive opportunities. We provide eligibility screening, application support, and ongoing compliance guidance.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <a 
                  href="#eligibility-checker" 
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-6 h-6" />
                  Check Your Eligibility
                </a>
                <a 
                  href="#certifications" 
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  Learn About Programs
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-emerald-100">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-300" />
                  <span className="font-semibold">$100B+ set aside annually</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-300" />
                  <span className="font-semibold">Less competition</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                <Image 
                  src="https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&h=600&fit=crop" 
                  alt="Business growth and certification success" 
                  width={800} 
                  height={600} 
                  className="w-full h-auto"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent"></div>
                
                {/* Floating badge */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <div className="text-3xl font-black text-emerald-600 mb-1">$100B+</div>
                  <div className="text-sm font-bold text-gray-700">Set Aside Annually</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Set-Aside Programs */}
      <section className="py-20 bg-white" id="certifications">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Federal Set-Aside Programs We Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each program opens doors to billions in less competitive opportunities
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Trophy,
                title: 'Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon',
                value: '$30B/year',
                description: 'Nine-year program for socially and economically disadvantaged businesses. Includes sole-source contracts up to $4M.',
                requirements: [
                  'Personally disadvantaged owner',
                  'Net worth under $850K',
                  'Good character',
                  '2+ years in business'
                ],
                color: 'emerald'
              },
              {
                icon: Shield,
                title: 'Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon',
                value: '$20B/year',
                description: 'For businesses owned and controlled by service-disabled veterans. 3% federal goal creates steady opportunities.',
                requirements: [
                  'Service-disabled veteran owner',
                  '51%+ ownership',
                  'Day-to-day management',
                  'Honorable discharge'
                ],
                color: 'blue'
              },
              {
                icon: Target,
                title: 'Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon',
                value: '$15B/year',
                description: 'For businesses in historically underutilized zones. 35% of employees must live in HUBZone. Less competitive than 8(a).',
                requirements: [
                  'Principal office in HUBZone',
                  '35% employees in HUBZone',
                  'Small business size',
                  'U.S. citizen owned'
                ],
                color: 'purple'
              },
              {
                icon: Users,
                title: 'Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon',
                value: '$25B/year',
                description: 'For women-owned (WOSB) and economically disadvantaged women-owned (EDWOSB) businesses. 5% federal goal.',
                requirements: [
                  '51% owned by women',
                  'Women manage daily operations',
                  'U.S. citizen women',
                  'Economically disadvantaged (EDWOSB)'
                ],
                color: 'pink'
              }
            ].map((program, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl p-8 border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all">
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${program.color}-100 to-${program.color}-200 flex items-center justify-center`}>
                    <program.icon className={`w-8 h-8 text-${program.color}-600`} />
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-black text-emerald-600">{program.value}</div>
                    <div className="text-sm text-gray-600 font-semibold">Set Aside</div>
                  </div>
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 mb-3">{program.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium mb-6">{program.description}</p>
                
                <div className="bg-white rounded-2xl p-4 border-2 border-emerald-100">
                  <h4 className="text-sm font-black text-gray-900 mb-3 uppercase">Key Requirements</h4>
                  <ul className="space-y-2">
                    {program.requirements.map((req, ridx) => (
                      <li key={ridx} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 font-medium">{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              End-to-End Certification Support
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From eligibility screening to ongoing compliance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Target,
                title: 'Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon',
                description: 'Free assessment to determine which certifications you qualify for and strategic fit analysis.',
                color: 'emerald'
              },
              {
                icon: FileCheck,
                title: 'Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon',
                description: 'Complete list of required documents, templates, and guidance on gathering evidence.',
                color: 'blue'
              },
              {
                icon: Lightbulb,
                title: 'Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon',
                description: 'We complete the application forms, write narratives, and ensure all requirements are met.',
                color: 'purple'
              },
              {
                icon: Shield,
                title: 'Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon',
                description: 'Ongoing guidance on maintaining certification and avoiding common compliance pitfalls.',
                color: 'emerald'
              }
            ].map((service, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 border-2 border-emerald-100 shadow-xl hover:shadow-2xl transition-all text-center">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${service.color}-100 to-${service.color}-200 flex items-center justify-center mx-auto mb-6`}>
                  <service.icon className={`w-8 h-8 text-${service.color}-600`} />
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Eligibility Checker */}
      <section className="py-20 bg-white" id="eligibility-checker">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-white to-emerald-50 rounded-3xl p-8 md:p-12 border-2 border-emerald-200 shadow-2xl">
            <div className="text-center mb-10">
              <h2 className="text-4xl font-black text-gray-900 mb-4">Check Your Eligibility</h2>
              <p className="text-lg text-gray-700 font-semibold max-w-2xl mx-auto">
                Select the certifications you are interested in and we will help you get started with a free consultation.
              </p>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-black text-gray-900 mb-6 text-center">Select certifications to check:</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {certifications.map(cert => {
                  const isSelected = selectedCertifications.includes(cert.id)
                  const Icon = cert.icon
                  return (
                    <button
                      key={cert.id}
                      onClick={() => toggleCertification(cert.id)}
                      type="button"
                      className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                        isSelected 
                          ? 'bg-emerald-500 border-emerald-600 shadow-xl scale-105' 
                          : 'bg-white border-gray-200 hover:border-emerald-300 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-white/20' : 'bg-emerald-100'
                        }`}>
                          <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-lg font-black mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                            {cert.label}
                          </div>
                          <div className={`text-sm font-semibold ${isSelected ? 'text-white/90' : 'text-gray-600'}`}>
                            {cert.description}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="w-6 h-6 text-white flex-shrink-0" />
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {selectedCertifications.length > 0 ? (
              <div className="text-center">
                <button
                  onClick={() => setShowModal(true)}
                  type="button"
                  className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-lg shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all"
                >
                  <Calendar className="w-6 h-6" />
                  Get Free Assessment
                  <ArrowRight className="w-5 h-5" />
                </button>
                <p className="mt-4 text-sm text-gray-600 font-semibold">
                  {selectedCertifications.length} certification{selectedCertifications.length > 1 ? 's' : ''} selected
                </p>
              </div>
            ) : (
              <p className="text-center text-gray-700 font-semibold text-lg">
                Select one or more certifications above to get started
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Certification Success Stories
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "Getting 8(a) certified opened up sole-source opportunities we never had access to. Our revenue doubled in the first year.",
                author: "Marcus Johnson",
                title: "Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon",
                result: "Revenue doubled",
                certification: "8(a) Certified"
              },
              {
                quote: "The SDVOSB certification process seemed overwhelming until Precise GovCon walked us through every step. Approved in 45 days.",
                author: "Sarah Martinez",
                title: "Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon",
                result: "Approved in 45 days",
                certification: "SDVOSB"
              },
              {
                quote: "We thought we weren't eligible for HUBZone, but they helped us restructure to qualify. Now we're winning set-aside contracts.",
                author: "David Kim",
                title: "Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon",
                result: "$3M in new contracts",
                certification: "HUBZone"
              }
            ].map((story, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-3xl p-8 border-2 border-emerald-200 shadow-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <p className="text-gray-700 font-semibold mb-6 leading-relaxed text-lg italic">
                  &quot;{story.quote}&quot;
                </p>
                <div className="border-t-2 border-emerald-200 pt-6">
                  <div className="font-black text-gray-900 mb-1">{story.author}</div>
                  <div className="text-sm text-gray-600 font-semibold mb-3">{story.title}</div>
                  <div className="space-y-2">
                    <div className="inline-block px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-bold">
                      {story.certification}
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-emerald-700 font-bold">{story.result}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Unlock Set-Aside Opportunities?
          </h2>
          <p className="text-2xl text-emerald-100 font-semibold mb-12">
            Start with a free eligibility assessment
          </p>

          <div className="bg-white rounded-3xl p-12 shadow-2xl mb-12">
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <div className="text-center">
                <div className="text-5xl font-black text-emerald-600 mb-2">FREE</div>
                <div className="text-lg font-bold text-gray-900 mb-2">Eligibility Screening</div>
                <div className="text-sm text-gray-600">30-minute consultation to assess which programs you qualify for</div>
              </div>
              <div className="text-center border-l-2 border-emerald-200">
                <div className="text-5xl font-black text-emerald-600 mb-2">From $250</div>
                <div className="text-lg font-bold text-gray-900 mb-2">Application Support</div>
                <div className="text-sm text-gray-600">Full application preparation and submission assistance</div>
              </div>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-8 mb-8">
              <h3 className="text-xl font-black text-gray-900 mb-4">Application support includes:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                {[
                  'Eligibility analysis & strategy',
                  'Complete documentation checklist',
                  'Application form completion',
                  'Supporting narrative writing',
                  'Document organization & review',
                  'Submission package preparation',
                  'Follow-up and status monitoring',
                  '12 months compliance support'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700 font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <a 
              href="https://calendly.com/contact-preciseanalytics/initial-consultation" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all"
            >
              <Calendar className="w-7 h-7" />
              Schedule Free Assessment
            </a>
            <p className="text-center text-sm text-gray-500 mt-4 font-medium">
              No obligation • Pricing varies by certification type
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center text-emerald-100 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-300" />
              <span>Free eligibility check</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-300" />
              <span>Expert guidance</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-300" />
              <span>Compliance support included</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-gray-900 mb-12 text-center">
            Common Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'How long does certification take?',
                a: 'Timelines vary by program: WOSB/EDWOSB (30-60 days), SDVOSB (45-90 days), HUBZone (60-90 days), 8(a) (90-120 days). We help expedite by ensuring complete, accurate applications.'
              },
              {
                q: 'Can I have multiple certifications?',
                a: 'Yes! Many businesses hold multiple certifications (e.g., 8(a) + SDVOSB, or WOSB + HUBZone). We help you identify all programs you qualify for and prioritize based on your target opportunities.'
              },
              {
                q: 'What are the ongoing requirements?',
                a: 'Most certifications require annual renewals with updated documentation. Some have specific requirements like HUBZone\'s 35% employee residency rule. We provide compliance guidance to help you maintain certification.'
              },
              {
                q: 'Is certification worth it for small contracts?',
                a: 'Absolutely. Set-aside certifications give you access to opportunities with less competition, even for smaller contracts. Many businesses see 50-100% revenue growth in their first certified year.'
              },
              {
                q: 'What if I am not eligible?',
                a: 'Sometimes business restructuring can create eligibility (e.g., moving office to HUBZone, changing ownership structure). We will explore all options and provide honest guidance on your best path forward.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-emerald-50 rounded-2xl p-8 border-2 border-emerald-100 hover:border-emerald-300 transition-all">
                <h3 className="text-xl font-black text-gray-900 mb-3 flex items-start gap-3">
                  <MessageSquare className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-1" />
                  {faq.q}
                </h3>
                <p className="text-gray-600 leading-relaxed font-medium pl-9">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShowModal(false)}
        >
          <div 
            className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="text-3xl font-black text-gray-900">Get Your Free Assessment</h2>
                <p className="text-sm text-gray-600 font-semibold mt-1">
                  {selectedCertifications.length} certification{selectedCertifications.length > 1 ? 's' : ''} selected
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            <div className="p-8">
              {submitSuccess ? (
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-12 h-12 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-3">Confirmation Sent!</h3>
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 mb-4 max-w-md mx-auto">
                    <p className="text-emerald-800 font-bold text-lg mb-2">
                      📧 Check your email at:
                    </p>
                    <p className="text-emerald-600 font-semibold text-base mb-3">
                      {formData.email}
                    </p>
                    <p className="text-gray-700 font-medium text-sm">
                      You will receive a confirmation email with all the details{formData.preferredDate && formData.preferredTime && ', including a calendar invite to add the meeting to your calendar'}.
                    </p>
                  </div>
                  <p className="text-gray-600 font-semibold">
                    We will contact you within 24 hours to confirm your consultation.
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-8">
                  {/* Option 1: Schedule via Calendly */}
                  <div className="border-2 border-emerald-200 rounded-2xl p-6 bg-gradient-to-br from-emerald-50 to-white hover:border-emerald-400 transition-all">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900">Schedule Meeting</h3>
                    </div>
                    <p className="text-gray-600 font-semibold mb-6">
                      Book a 30-minute consultation at a time that works for you. We will discuss your eligibility and answer all your questions.
                    </p>
                    <a 
                      href="https://calendly.com/contact-preciseanalytics/initial-consultation" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
                    >
                      <Calendar className="w-5 h-5" />
                      Open Calendly
                    </a>
                  </div>

                  {/* Option 2: Contact Form */}
                  <div className="border-2 border-gray-200 rounded-2xl p-6 bg-white">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-gray-500 rounded-xl flex items-center justify-center">
                        <Mail className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-black text-gray-900">Send Message</h3>
                    </div>
                    <p className="text-gray-600 font-semibold mb-6">
                      Not ready to schedule? Send us your information and we will reach out to you.
                    </p>

                    <form onSubmit={handleSubmitForm} className="space-y-4">
                      {/* Selected Certifications Display */}
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                        <div className="text-sm font-black text-gray-900 mb-2">Selected Certifications</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedCertifications.map(id => {
                            const cert = certifications.find(c => c.id === id)
                            return (
                              <span key={id} className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-semibold">
                                {cert?.label}
                              </span>
                            )
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Full Name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 outline-none font-semibold text-gray-900 placeholder:text-gray-600"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 outline-none font-semibold text-gray-900 placeholder:text-gray-600"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="tel"
                          placeholder="Phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 outline-none font-semibold text-gray-900 placeholder:text-gray-600"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={formData.company}
                          onChange={(e) => setFormData({...formData, company: e.target.value})}
                          className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 outline-none font-semibold text-gray-900 placeholder:text-gray-600"
                        />
                      </div>

                      <textarea
                        placeholder="Message or questions (optional)"
                        rows={3}
                        value={formData.message}
                        onChange={(e) => setFormData({...formData, message: e.target.value})}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 outline-none font-semibold resize-none text-gray-900 placeholder:text-gray-600"
                      />

                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          placeholder="Preferred Date"
                          value={formData.preferredDate}
                          onChange={(e) => setFormData({...formData, preferredDate: e.target.value})}
                          className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 outline-none font-semibold text-gray-900 placeholder:text-gray-600"
                        />
                        <select
                          value={formData.preferredTime}
                          onChange={(e) => setFormData({...formData, preferredTime: e.target.value})}
                          className="px-4 py-3 border-2 border-gray-300 rounded-xl focus:border-emerald-500 outline-none font-semibold text-gray-900 bg-white"
                        >
                          <option value="">Select Time</option>
                          <option value="08:00 AM">8:00 AM</option>
                          <option value="08:30 AM">8:30 AM</option>
                          <option value="09:00 AM">9:00 AM</option>
                          <option value="09:30 AM">9:30 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="10:30 AM">10:30 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="11:30 AM">11:30 AM</option>
                          <option value="12:00 PM">12:00 PM</option>
                          <option value="12:30 PM">12:30 PM</option>
                          <option value="01:00 PM">1:00 PM</option>
                          <option value="01:30 PM">1:30 PM</option>
                          <option value="02:00 PM">2:00 PM</option>
                          <option value="02:30 PM">2:30 PM</option>
                          <option value="03:00 PM">3:00 PM</option>
                          <option value="03:30 PM">3:30 PM</option>
                          <option value="04:00 PM">4:00 PM</option>
                          <option value="04:30 PM">4:30 PM</option>
                          <option value="05:00 PM">5:00 PM</option>
                          <option value="05:30 PM">5:30 PM</option>
                          <option value="06:00 PM">6:00 PM</option>
                        </select>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          'Sending...'
                        ) : (
                          <>
                            <Send className="w-5 h-5" />
                            Send Message
                          </>
                        )}
                      </button>
                      <p className="text-xs text-gray-500 text-center">* Required fields</p>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
