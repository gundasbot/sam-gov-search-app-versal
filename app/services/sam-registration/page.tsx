//app/services/sam-registration/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import { 
  CheckCircle, ShieldCheck, Clock, Calendar, RefreshCw,
  ArrowRight, Target, Users, Star, Phone, AlertCircle, FileCheck
} from 'lucide-react'

export const metadata = {
  alternates: { canonical: 'https://www.precisegovcon.com/services/sam-registration' },
  title: 'SAM.gov Registration Services | PreciseGovCon',
  description: 'Expert SAM.gov registration and renewal services. Get registered quickly and stay compliant with our complete support.',
}

export default function SAMRegistrationPage() {
  return (
    <div className="mx-auto w-full max-w-480 min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50 text-slate-900">
      {/* Compact Hero - 2 Column */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 opacity-90" />
        
        <div className="relative w-full px-3 sm:px-5 lg:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 rounded-full text-blue-700 text-sm font-bold mb-4 shadow-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>Most Popular Service</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">
                SAM Registration Made Simple—We Handle Everything
              </h1>
              
              <p className="text-lg text-slate-700 font-semibold mb-3 leading-relaxed">
                Stop struggling with the complex SAM.gov registration process. Our experts handle it all—from start to finish.
              </p>

              <p className="text-base text-slate-600 mb-6">
                SAM registration is required to bid on federal contracts, but it's confusing and time-consuming. We make it easy with complete support, annual renewals, and compliance monitoring.
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  href="/contact?service=sam-registration"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  Get Started
                </Link>

                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-emerald-700 border border-emerald-200 rounded-xl font-bold text-base shadow-sm hover:bg-emerald-50 transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                  View All Services
                </Link>
                
                <a
                  href="tel:804-404-6005"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 border border-blue-200 rounded-xl font-bold text-base shadow-sm hover:bg-blue-50 transition-all"
                >
                  <Phone className="w-5 h-5" />
                  (804) 404-6005
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-slate-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm">2-3 week process</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm">100% accuracy guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-blue-600" />
                  <span className="font-semibold text-sm">Annual renewals included</span>
                </div>
              </div>
            </div>

            {/* Right: Stats & Social Proof */}
            <div className="space-y-4">
              <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <ShieldCheck className="w-12 h-12 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900">1,200+</div>
                    <div className="text-sm font-bold text-slate-600">Successful Registrations</div>
                  </div>
                </div>
                <p className="text-sm text-slate-700">We've helped over a thousand businesses get SAM registered</p>
              </div>

              <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <Target className="w-12 h-12 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-slate-900">100%</div>
                    <div className="text-sm font-bold text-slate-600">Approval Rate</div>
                  </div>
                </div>
                <p className="text-sm text-slate-700">Every registration we submit gets approved—no rejections</p>
              </div>

              <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Users className="w-12 h-12 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900">Your Partner in Success</div>
                    <div className="text-sm font-semibold text-slate-600 mt-1">We're with you every step of the way</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why It's Hard */}
      <section className="py-12 bg-amber-50 border-y-2 border-amber-200">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 text-center">
            Why SAM Registration Is So Difficult
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '📋', title: 'Complex Requirements', desc: '30+ data fields, CAGE codes, NAICS codes, and banking details. One mistake can trigger rejection.' },
              { emoji: '⏰', title: 'Time-Intensive Process', desc: 'Average DIY registration takes 8-12 hours over multiple sessions and revisions.' },
              { emoji: '🔄', title: 'Annual Renewal Pressure', desc: 'You must renew every year or lose eligibility. Missing deadlines can halt bidding.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border-2 border-amber-200 shadow-md">
                <div className="text-4xl font-black text-amber-600 mb-2">{item.emoji}</div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-700 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="py-12 bg-white">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              Complete SAM Registration Service
            </h2>
            <p className="text-lg text-gray-700 max-w-3xl mx-auto font-medium">
              We handle every step so you can focus on growing your business
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: FileCheck,
                title: 'Initial Registration Setup',
                description: 'We collect all required information, validate it, and submit your SAM.gov registration. No errors, no rejections.',
              },
              {
                icon: RefreshCw,
                title: 'Annual Renewal Management',
                description: 'We monitor your expiration date and handle renewals automatically. You\'ll never lose your SAM eligibility.',
              },
              {
                icon: ShieldCheck,
                title: 'Compliance Monitoring',
                description: 'We watch for any issues with your registration and alert you immediately if action is needed.',
              },
              {
                icon: Target,
                title: 'CAGE Code Assistance',
                description: 'We help you obtain and maintain your CAGE code, which is required for SAM registration.',
              },
              {
                icon: AlertCircle,
                title: 'Profile Updates & Changes',
                description: 'Changed your address, banking, or key personnel? We update your SAM profile to keep you compliant.',
              },
              {
                icon: Users,
                title: 'Dedicated Expert Support',
                description: 'Direct access to our SAM experts via phone, email, or chat. Get answers fast.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-12 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              How It Works
            </h2>
            <p className="text-lg text-gray-700 font-medium">Simple process, expert handling</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Information Collection', desc: 'We gather all required data using a guided questionnaire.', icon: FileCheck },
              { step: '2', title: 'Expert Validation', desc: 'Our team validates each field and resolves risk areas before submission.', icon: ShieldCheck },
              { step: '3', title: 'SAM.gov Submission', desc: 'We submit your registration with high-accuracy quality control.', icon: Target },
              { step: '4', title: 'Ongoing Monitoring', desc: 'We track status and handle renewals to keep you continuously compliant.', icon: RefreshCw },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-2xl p-6 border-2 border-blue-200 shadow-lg text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-2xl font-black flex items-center justify-center mx-auto mb-3 shadow-md">
                    {item.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-5 h-5 text-blue-600" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-700 font-medium">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-blue-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-white">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              What Our Clients Say
            </h2>
            <p className="text-gray-700 font-medium">Real feedback from real businesses</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: 'Tried to do it myself for 3 weeks. Hired PreciseGovCon and they had it done in 10 days. Worth every penny.',
                author: "Sarah Chen",
                title: 'Owner, Precision Tech LLC',
                result: "Registered in 10 days",
              },
              {
                quote: "They caught an error with my CAGE code that would have gotten my registration rejected. Saved me months of delays.",
                author: "Michael Torres",
                title: 'Founder, Torres Federal Solutions',
                result: "Avoided rejection",
              },
              {
                quote: "I was about to miss my annual renewal deadline. They handled everything and kept my SAM eligibility intact.",
                author: "Jennifer Williams",
                title: 'Operations Director, JW Contracting',
                result: "Stayed compliant",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border-2 border-blue-100 shadow-lg">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-800 font-medium mb-4 italic">"{item.quote}"</p>
                <div className="border-t-2 border-blue-100 pt-4">
                  <div className="font-black text-gray-900">{item.author}</div>
                  <div className="text-sm text-gray-700 mb-2 font-medium">{item.title}</div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold">
                    <CheckCircle className="w-3 h-3" />
                    {item.result}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="w-full px-3 sm:px-5 lg:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Get SAM Registered?
          </h2>
          <p className="text-lg text-white mb-8 max-w-2xl mx-auto">
            Stop struggling with the process. Let our experts handle your SAM registration from start to finish.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/contact?service=sam-registration"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-blue-600 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <Calendar className="w-6 h-6" />
              Get Started Today
            </Link>
            <a
              href="tel:804-404-6005"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/50 bg-white/20 backdrop-blur-sm text-white px-8 py-4 text-lg font-bold hover:bg-white/30 transition-all"
            >
              <Phone className="w-6 h-6" />
              (804) 404-6005
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              2-3 week turnaround
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              100% approval rate
            </div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Annual renewals included
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

