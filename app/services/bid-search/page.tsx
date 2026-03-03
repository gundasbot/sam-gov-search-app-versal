import Image from 'next/image'
import Link from 'next/link'
import { Shield, CheckCircle, FileCheck, AlertTriangle, Clock, Users, ArrowRight, Calendar, Star, Award, Target } from 'lucide-react'

export const metadata = {
  alternates: { canonical: 'https://www.precisegovcon.com/services/bid-search' },
  title: 'Find Federal Contracts | PreciseGovCon',
  description: 'Stay compliant with federal contracting regulations. Annual renewals, FAR/DFARS compliance, and audit readiness.',
}

export default function CompliancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 py-20">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-200 text-sm font-bold mb-6 border border-emerald-500/30">
                <Shield className="w-4 h-4" />
                <span>Federal Compliance & Audit Readiness</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                Stay Compliant, Stay Competitive
              </h1>
              
              <p className="text-2xl text-emerald-100 font-semibold mb-4 leading-relaxed">
                Federal compliance is complex. We make it simple with automated tracking, renewal reminders, and expert guidance.
              </p>
              
              <p className="text-lg text-emerald-200 font-medium mb-8">
                From SAM registration renewals to FAR/DFARS compliance, we monitor deadlines, flag issues, and keep you audit-ready so you never lose contracting eligibility.
              </p>
              
              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-6 h-6" />
                  Get Compliance Audit
                </Link>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  View Services
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              
              <div className="flex flex-wrap items-center gap-6 text-emerald-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-300" />
                  <span className="font-semibold">Zero compliance violations</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-300" />
                  <span className="font-semibold">Audit-ready docs</span>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop"
                  alt="Federal compliance and audit documentation"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
              </div>
              
              <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                <div className="text-3xl font-black text-emerald-600">100%</div>
                <div className="text-sm font-bold text-gray-700">Compliance Rate</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Monitor */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Comprehensive Compliance Monitoring
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We track every deadline and requirement so you don't have to
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileCheck,
                title: 'Find Federal Contracts | PreciseGovCon',
                description: 'Annual renewal tracking with 90, 60, and 30-day reminders. We handle the entire renewal process.',
                color: 'emerald',
              },
              {
                icon: Shield,
                title: 'Find Federal Contracts | PreciseGovCon',
                description: '8(a), SDVOSB, HUBZone, WOSB certification renewals and ongoing compliance requirements.',
                color: 'blue',
              },
              {
                icon: Award,
                title: 'Find Federal Contracts | PreciseGovCon',
                description: 'Track changing regulations and ensure your policies, systems, and documentation stay compliant.',
                color: 'purple',
              },
              {
                icon: Users,
                title: 'Find Federal Contracts | PreciseGovCon',
                description: 'Monitor subcontracting plan requirements and small business utilization reporting.',
                color: 'cyan',
              },
              {
                icon: Clock,
                title: 'Find Federal Contracts | PreciseGovCon',
                description: 'Track required reports (CPARS, VETS-4212, EEO-1) and submission deadlines.',
                color: 'amber',
              },
              {
                icon: Target,
                title: 'Find Federal Contracts | PreciseGovCon',
                description: 'Maintain organized documentation and systems to pass DCAA and other federal audits.',
                color: 'emerald',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1"
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br from-${item.color}-100 to-${item.color}-200 flex items-center justify-center mb-6`}>
                  <item.icon className={`w-8 h-8 text-${item.color}-600`} />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Never Miss a Compliance Deadline Again
          </h2>
          <p className="text-2xl text-emerald-100 font-semibold mb-12">
            Get automated tracking and expert support for all federal requirements
          </p>
          
          <div className="bg-white rounded-3xl p-12 shadow-2xl mb-12">
            <div className="text-center mb-8">
              <div className="text-6xl font-black text-emerald-600 mb-2">$495/mo</div>
              <div className="text-xl font-semibold text-gray-600">Compliance Management</div>
            </div>
            
            <ul className="space-y-4 text-left mb-8">
              {[
                'SAM renewal tracking & reminders',
                'Certification maintenance alerts',
                'FAR/DFARS compliance monitoring',
                'Contract reporting calendar',
                'Audit readiness support',
                'Expert compliance guidance',
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700 font-semibold text-lg">{item}</span>
                </li>
              ))}
            </ul>
            
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all"
            >
              <Calendar className="w-7 h-7" />
              Schedule Free Audit
            </Link>
            
            <p className="text-sm text-gray-500 mt-4 font-medium">
              Free compliance audit • No long-term commitment
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

