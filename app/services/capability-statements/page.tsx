//app/services/capability-statements/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import { 
  CheckCircle, FileText, Award, Zap, Users, TrendingUp,
  ArrowRight, Calendar, Target, Shield, Star, Sparkles,
  Download, BarChart3, Eye, Palette, MessageSquare, Clock, Phone
} from 'lucide-react'

export const metadata = {
  alternates: { canonical: 'https://precisegovcon.com/services/capability-statements' },
  title: 'Capability Statements',
  description: 'Modern, buyer-friendly one-page capability statements that win meetings and open doors. Tailored to your target agencies and NAICS codes.',
}

export default function CapabilityStatementsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      {/* Compact Hero Section - 2 Column */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full text-blue-200 text-sm font-bold mb-4 border border-blue-500/30">
                <Palette className="w-4 h-4" />
                <span>Professional Design + Strategic Positioning</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                Your Capability Statement Opens Doors—Make It Count
              </h1>
              
              <p className="text-lg text-blue-100 font-semibold mb-3 leading-relaxed">
                Get a modern, scannable one-pager that contracting officers actually want to read. No more outdated templates.
              </p>

              <p className="text-base text-blue-200 mb-6">
                We create capability statements designed for busy federal buyers—clear value proposition, easy-to-scan format, tailored to your target agencies and NAICS codes.
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  Get Started
                </Link>
                
                <Link
                  href="#examples"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-bold text-base hover:bg-white/20 transition-all"
                >
                  <Eye className="w-5 h-5" />
                  View Examples
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-blue-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-300" />
                  <span className="font-semibold text-sm">5-7 day delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-300" />
                  <span className="font-semibold text-sm">Prime & sub versions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-300" />
                  <span className="font-semibold text-sm">Unlimited revisions</span>
                </div>
              </div>
            </div>

            {/* Right: Stats & Social Proof */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <Star className="w-12 h-12 text-yellow-400 fill-yellow-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white">500+</div>
                    <div className="text-sm font-bold text-blue-200">Statements Created</div>
                  </div>
                </div>
                <p className="text-sm text-blue-200">Trusted by contractors nationwide to make lasting first impressions</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <Target className="w-12 h-12 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white">3x</div>
                    <div className="text-sm font-bold text-blue-200">More Meeting Requests</div>
                  </div>
                </div>
                <p className="text-sm text-blue-200">Our clients report significantly more opportunities after using our statements</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Users className="w-12 h-12 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">Partner with Experts</div>
                    <div className="text-sm font-semibold text-blue-200 mt-1">Decades of GovCon experience on your side</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement - More Compact */}
      <section className="py-12 bg-amber-50 border-y-2 border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 text-center">
            Most Capability Statements Get Ignored. Here's Why:
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '😴', title: 'Too Generic', desc: 'Template language that sounds like everyone else. No specific value proposition.' },
              { emoji: '📄', title: 'Poor Design', desc: 'Dense walls of text, tiny fonts, outdated styling. Not scannable in 10 seconds.' },
              { emoji: '🎯', title: 'Wrong Focus', desc: 'Features instead of outcomes. What you do instead of the problems you solve.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl p-5 border-2 border-amber-200 shadow-md">
                <div className="text-4xl font-black text-amber-600 mb-2">{item.emoji}</div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 font-medium">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What You Get - 3 Column Grid, More Compact */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              A Capability Statement That Actually Works
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We create buyer-friendly, modern capability statements that open doors
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Palette,
                title: 'Professional Design',
                description: 'Modern, scannable format with clear hierarchy. Visual elements that draw the eye. Mobile and print-friendly.',
                color: 'blue',
              },
              {
                icon: Target,
                title: 'Strategic Positioning',
                description: 'Value proposition tailored to your target agencies. Outcomes-focused language that resonates with buyers.',
                color: 'emerald',
              },
              {
                icon: BarChart3,
                title: 'NAICS & PSC Alignment',
                description: 'Clearly displayed codes with descriptions. Easy for buyers to see if you fit their needs.',
                color: 'purple',
              },
              {
                icon: Users,
                title: 'Prime & Sub Versions',
                description: 'Two versions: one for prime opportunities, one for subcontracting. Each with appropriate positioning.',
                color: 'cyan',
              },
              {
                icon: Award,
                title: 'Past Performance',
                description: 'Relevant contract examples presented clearly. Metrics and outcomes highlighted.',
                color: 'amber',
              },
              {
                icon: Download,
                title: 'Multiple Formats',
                description: 'High-res PDF for printing, web-optimized for email, editable source files.',
                color: 'blue',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-6 border-2 border-blue-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process - More Compact */}
      <section className="py-12 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              Simple, Collaborative Process
            </h2>
            <p className="text-lg text-gray-600">We work with you every step of the way</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Discovery Call', desc: 'We learn about your business, target agencies, and differentiators', icon: MessageSquare },
              { step: '2', title: 'Content Draft', desc: 'We write compelling copy focused on buyer needs and your unique value', icon: FileText },
              { step: '3', title: 'Design & Review', desc: 'Professional layout, visual elements, and your feedback round', icon: Palette },
              { step: '4', title: 'Final Delivery', desc: 'Multiple formats ready to use immediately in your BD activities', icon: Download },
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
                  <p className="text-sm text-gray-600">{item.desc}</p>
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

      {/* Testimonials - Compact, 3 Column */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              What Our Clients Say
            </h2>
            <p className="text-gray-600">Real results from real contractors</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "The new one from Precise GovCon gets compliments at every networking event.",
                author: "David Kim",
                title: "President, SecureTech Solutions",
                result: "3x meeting requests",
              },
              {
                quote: "They completely repositioned how we talk about our services. The focus on outcomes made a huge difference.",
                author: "Maria Gonzalez",
                title: "BD Director, Strategic Services LLC",
                result: "Landed first prime contract",
              },
              {
                quote: "Finally, a capability statement that doesn't look like everyone else's. Our team is proud to hand this out.",
                author: "James Wilson",
                title: "CEO, Wilson Engineering Group",
                result: "5 new opportunities",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-6 border-2 border-blue-100 shadow-lg">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 font-medium mb-4 italic">"{item.quote}"</p>
                <div className="border-t-2 border-blue-100 pt-4">
                  <div className="font-black text-gray-900">{item.author}</div>
                  <div className="text-sm text-gray-600 mb-2">{item.title}</div>
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

      {/* CTA Section - Partnership Focused */}
      <section className="py-12 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Make a Better First Impression?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Let's create a capability statement that opens doors and wins meetings. Our team is ready to partner with you.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-blue-600 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <Calendar className="w-6 h-6" />
              Schedule Consultation
            </Link>
            <a
              href="tel:804-404-4005"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-8 py-4 text-lg font-bold hover:bg-white/20 transition-all"
            >
              <Phone className="w-6 h-6" />
              (804) 404-4005
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-blue-200">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              5-7 day turnaround
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Unlimited revisions
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Expert guidance
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


