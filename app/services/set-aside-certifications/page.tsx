//app/services/set-aside-certifications/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import EligibilityChecker from '@/components/EligibilityChecker'
import { 
  CheckCircle, Shield, Award, TrendingUp, Users, Target,
  ArrowRight, Calendar, Zap, Star, FileCheck, Lightbulb,
  MessageSquare, AlertCircle, BarChart3, DollarSign, Trophy
} from 'lucide-react'

export const metadata = {
  title: 'Set-Aside Certification Services | Precise GovCon',
  description: 'Expert guidance on 8(a), SDVOSB, HUBZone, WOSB/EDWOSB certifications. Expand your pipeline with set-aside opportunities.',
}

export default function SetAsideCertificationsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        
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
                Billions in contracts reserved for small businesses. Are you eligible? We'll help you find out and get certified.
              </p>

              <p className="text-lg text-emerald-200 font-medium mb-8">
                Set-aside certifications (8(a), SDVOSB, HUBZone, WOSB/EDWOSB) give you access to less competitive opportunities. We provide eligibility screening, application support, and ongoing compliance guidance.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  href="#eligibility-checker"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-6 h-6" />
                  Check Your Eligibility
                </Link>
                
                <Link
                  href="#certifications"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  Learn About Programs
                  <ArrowRight className="w-5 h-5" />
                </Link>
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
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/60 to-transparent" />
                
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
                title: '8(a) Business Development',
                value: '$30B+/year',
                description: 'Nine-year program for socially and economically disadvantaged businesses. Includes sole-source contracts up to $4M.',
                requirements: ['Personally disadvantaged owner', 'Net worth under $850K', 'Good character', '2+ years in business'],
                color: 'emerald',
              },
              {
                icon: Shield,
                title: 'SDVOSB (Service-Disabled Veteran)',
                value: '$20B+/year',
                description: 'For businesses owned and controlled by service-disabled veterans. 3% federal goal creates steady opportunities.',
                requirements: ['Service-disabled veteran owner', '51%+ ownership', 'Day-to-day management', 'Honorable discharge'],
                color: 'blue',
              },
              {
                icon: Target,
                title: 'HUBZone',
                value: '$15B+/year',
                description: 'For businesses in historically underutilized zones. 35% of employees must live in HUBZone. Less competitive than 8(a).',
                requirements: ['Principal office in HUBZone', '35% employees in HUBZone', 'Small business size', 'US citizen owned'],
                color: 'purple',
              },
              {
                icon: Users,
                title: 'WOSB / EDWOSB',
                value: '$25B+/year',
                description: 'For women-owned (WOSB) and economically disadvantaged women-owned (EDWOSB) businesses. 5% federal goal.',
                requirements: ['51%+ owned by women', 'Women manage daily operations', 'US citizen women', 'Economically disadvantaged (EDWOSB)'],
                color: 'pink',
              },
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
                  <h4 className="text-sm font-black text-gray-900 mb-3 uppercase">Key Requirements:</h4>
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
                title: 'Eligibility Screening',
                description: 'Free assessment to determine which certifications you qualify for and strategic fit analysis.',
                color: 'emerald',
              },
              {
                icon: FileCheck,
                title: 'Documentation Checklist',
                description: 'Complete list of required documents, templates, and guidance on gathering evidence.',
                color: 'blue',
              },
              {
                icon: Lightbulb,
                title: 'Application Drafting',
                description: 'We complete the application forms, write narratives, and ensure all requirements are met.',
                color: 'purple',
              },
              {
                icon: Shield,
                title: 'Compliance Guardrails',
                description: 'Ongoing guidance on maintaining certification and avoiding common compliance pitfalls.',
                color: 'emerald',
              },
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
          <EligibilityChecker />
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
                title: "CEO, Johnson Tech Solutions",
                result: "Revenue doubled",
                certification: "8(a) Certified",
              },
              {
                quote: "The SDVOSB certification process seemed overwhelming until Precise GovCon walked us through every step. Approved in 45 days.",
                author: "Sarah Martinez",
                title: "President, SecureVet Services",
                result: "Approved in 45 days",
                certification: "SDVOSB",
              },
              {
                quote: "We thought we weren't eligible for HUBZone, but they helped us restructure to qualify. Now we're winning set-aside contracts.",
                author: "David Kim",
                title: "Owner, DataBridge Consulting",
                result: "$3M in new contracts",
                certification: "HUBZone",
              },
            ].map((story, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-3xl p-8 border-2 border-emerald-200 shadow-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <p className="text-gray-700 font-semibold mb-6 leading-relaxed text-lg italic">
                  "{story.quote}"
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
                <div className="text-5xl font-black text-emerald-600 mb-2">$2,500+</div>
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
                  '12 months compliance support',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-gray-700 font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all"
            >
              <Calendar className="w-7 h-7" />
              Schedule Free Assessment
            </Link>

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
                a: 'Timelines vary by program: WOSB/EDWOSB (30-60 days), SDVOSB (45-90 days), HUBZone (60-90 days), 8(a) (90-120 days). We help expedite by ensuring complete, accurate applications.',
              },
              {
                q: 'Can I have multiple certifications?',
                a: 'Yes! Many businesses hold multiple certifications (e.g., 8(a) + SDVOSB, or WOSB + HUBZone). We help you identify all programs you qualify for and prioritize based on your target opportunities.',
              },
              {
                q: 'What are the ongoing requirements?',
                a: 'Most certifications require annual renewals with updated documentation. Some have specific requirements like HUBZone\'s 35% employee residency rule. We provide compliance guidance to help you maintain certification.',
              },
              {
                q: 'Is certification worth it for small contracts?',
                a: 'Absolutely. Set-aside certifications give you access to opportunities with less competition, even for smaller contracts. Many businesses see 50-100% revenue growth in their first certified year.',
              },
              {
                q: 'What if I\'m not eligible?',
                a: 'Sometimes business restructuring can create eligibility (e.g., moving office to HUBZone, changing ownership structure). We\'ll explore all options and provide honest guidance on your best path forward.',
              },
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
    </div>
  )
}