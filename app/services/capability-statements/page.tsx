//app/services/capability-statements/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import { 
  CheckCircle, FileText, Award, Zap, Users, TrendingUp,
  ArrowRight, Calendar, Target, Shield, Star, Sparkles,
  Download, BarChart3, Eye, Palette, MessageSquare
} from 'lucide-react'

export const metadata = {
  title: 'Professional Capability Statements | Precise GovCon',
  description: 'Modern, buyer-friendly one-page capability statements that win meetings and open doors. Tailored to your target agencies and NAICS codes.',
}

export default function CapabilityStatementsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 backdrop-blur-sm rounded-full text-blue-200 text-sm font-bold mb-6 border border-blue-500/30">
                <Palette className="w-4 h-4" />
                <span>Professional Design + Strategic Positioning</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                Your Capability Statement is Your First Impression
              </h1>
              
              <p className="text-2xl text-blue-100 font-semibold mb-4 leading-relaxed">
                Make it count. Get a modern, scannable one-pager that contracting officers actually want to read.
              </p>

              <p className="text-lg text-blue-200 font-medium mb-8">
                Stop using outdated templates. Our capability statements are designed for busy federal buyers—clear value proposition, easy-to-scan format, and tailored to your target agencies and NAICS codes.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-6 h-6" />
                  Get Started
                </Link>
                
                <Link
                  href="#examples"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  <Eye className="w-6 h-6" />
                  View Examples
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-blue-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-300" />
                  <span className="font-semibold">5-7 day delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-300" />
                  <span className="font-semibold">Prime & sub versions</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&h=600&fit=crop"
                  alt="Professional business documents and branding materials"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent" />
                
                {/* Floating badge */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                    <div>
                      <div className="text-3xl font-black text-blue-600">500+</div>
                      <div className="text-sm font-bold text-gray-700">Created</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 bg-amber-50 border-y-4 border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-8">
              Most Capability Statements Get Ignored. Here's Why:
            </h2>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-white rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
                <div className="text-5xl font-black text-amber-600 mb-2">😴</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Too Generic</h3>
                <p className="text-gray-600 font-medium">Template language that sounds like everyone else. No specific value proposition.</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
                <div className="text-5xl font-black text-amber-600 mb-2">📄</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Poor Design</h3>
                <p className="text-gray-600 font-medium">Dense walls of text, tiny fonts, outdated styling. Not scannable in 10 seconds.</p>
              </div>
              <div className="bg-white rounded-2xl p-6 border-2 border-amber-200 shadow-lg">
                <div className="text-5xl font-black text-amber-600 mb-2">🎯</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Wrong Focus</h3>
                <p className="text-gray-600 font-medium">Features instead of outcomes. What you do instead of the problems you solve.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              A Capability Statement That Actually Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We create buyer-friendly, modern capability statements that open doors
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {[
              {
                icon: Palette,
                title: 'Professional Design & Layout',
                description: 'Modern, scannable format with clear hierarchy. Visual elements that draw the eye to key information. Mobile and print-friendly.',
                color: 'blue',
              },
              {
                icon: Target,
                title: 'Strategic Positioning & Content',
                description: 'Value proposition tailored to your target agencies. Problem/solution framing. Outcomes-focused language that resonates with buyers.',
                color: 'emerald',
              },
              {
                icon: BarChart3,
                title: 'NAICS & PSC Alignment',
                description: 'Clearly displayed codes with descriptions. Aligned to opportunities you actually want to pursue. Easy for buyers to see if you fit their needs.',
                color: 'purple',
              },
              {
                icon: Users,
                title: 'Prime & Subcontractor Versions',
                description: 'Two versions: one for prime opportunities, one for subcontracting. Each with appropriate positioning and messaging.',
                color: 'cyan',
              },
              {
                icon: Award,
                title: 'Past Performance Showcase',
                description: 'Relevant contract examples presented clearly. Metrics and outcomes highlighted. Social proof that builds credibility.',
                color: 'amber',
              },
              {
                icon: Download,
                title: 'Multiple Formats',
                description: 'High-resolution PDF for printing, web-optimized version for email, editable source files for future updates.',
                color: 'blue',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-blue-50 rounded-3xl p-8 border-2 border-blue-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
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

      {/* Process */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Simple, Collaborative Process
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Discovery Call', desc: 'We learn about your business, target agencies, and differentiators', icon: MessageSquare },
              { step: '2', title: 'Content Draft', desc: 'We write compelling copy focused on buyer needs and your unique value', icon: FileText },
              { step: '3', title: 'Design & Review', desc: 'Professional layout, visual elements, and your feedback round', icon: Palette },
              { step: '4', title: 'Final Delivery', desc: 'Multiple formats ready to use immediately in your BD activities', icon: Download },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-3xl p-8 border-2 border-blue-200 shadow-xl text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-3xl font-black flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 font-medium">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-blue-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              What Our Clients Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "The old capability statement we were using looked like it was from 1995. The new one from Precise GovCon gets compliments at every networking event.",
                author: "David Kim",
                title: "President, SecureTech Solutions",
                result: "3x meeting requests",
              },
              {
                quote: "They completely repositioned how we talk about our services. The focus on outcomes instead of features made a huge difference.",
                author: "Maria Gonzalez",
                title: "BD Director, Strategic Services LLC",
                result: "Featured in agency briefing",
              },
              {
                quote: "Having separate prime and sub versions was genius. We can now position ourselves appropriately for different opportunities.",
                author: "James Wilson",
                title: "CEO, DataBridge Consulting",
                result: "Won 2 subcontracts",
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-3xl p-8 border-2 border-blue-200 shadow-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-blue-500 text-blue-500" />
                  ))}
                </div>
                <p className="text-gray-700 font-semibold mb-6 leading-relaxed text-lg italic">
                  "{testimonial.quote}"
                </p>
                <div className="border-t-2 border-blue-200 pt-6">
                  <div className="font-black text-gray-900 mb-1">{testimonial.author}</div>
                  <div className="text-sm text-gray-600 font-semibold mb-3">{testimonial.title}</div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-lg text-sm font-bold">
                    <CheckCircle className="w-4 h-4" />
                    {testimonial.result}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready for a Capability Statement That Opens Doors?
          </h2>
          <p className="text-2xl text-blue-100 font-semibold mb-12">
            Get a professional one-pager that actually gets read
          </p>

          <div className="bg-white rounded-3xl p-12 shadow-2xl mb-12">
            <div className="text-center mb-8">
              <div className="text-6xl font-black text-gray-900 mb-2">$1,495</div>
              <div className="text-xl text-gray-600 font-semibold">Complete Package</div>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                <Zap className="w-4 h-4" />
                Includes prime & sub versions
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8 text-left">
              <div>
                <h3 className="text-xl font-black text-gray-900 mb-4">Includes:</h3>
                <ul className="space-y-3">
                  {[
                    'Discovery consultation',
                    'Strategic content writing',
                    'Professional design & layout',
                    'Prime version',
                    'Subcontractor version',
                    'PDF, JPG, and editable files',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-semibold">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-black text-gray-900 mb-4">Timeline:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-bold text-blue-600">1</div>
                    <div>
                      <div className="font-bold text-gray-900">Days 1-2:</div>
                      <div className="text-gray-600">Discovery & information gathering</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-bold text-blue-600">2</div>
                    <div>
                      <div className="font-bold text-gray-900">Days 3-5:</div>
                      <div className="text-gray-600">Content drafting & design</div>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 font-bold text-blue-600">3</div>
                    <div>
                      <div className="font-bold text-gray-900">Days 6-7:</div>
                      <div className="text-gray-600">Revisions & final delivery</div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-blue-500/50 hover:scale-105 transition-all"
            >
              <Calendar className="w-7 h-7" />
              Get Started Today
            </Link>

            <p className="text-center text-sm text-gray-500 mt-4 font-medium">
              One revision round included • Additional revisions $200
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center text-blue-100 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-blue-300" />
              <span>5-7 day delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-blue-300" />
              <span>Prime & sub versions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-blue-300" />
              <span>Multiple file formats</span>
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
                q: 'What information do you need from me?',
                a: 'Your company profile, past performance examples, target agencies and NAICS codes, differentiators, and any branding guidelines. We\'ll guide you through a simple questionnaire.',
              },
              {
                q: 'Can I update it myself later?',
                a: 'Yes! We provide the editable source files (Word and PowerPoint) so you can make minor updates. For major revisions, we offer update packages at $500.',
              },
              {
                q: 'What\'s the difference between prime and sub versions?',
                a: 'The prime version positions you as the prime contractor, emphasizing your full capabilities and management experience. The sub version highlights your technical expertise and ability to support prime contractors.',
              },
              {
                q: 'Do you provide examples before I commit?',
                a: 'We can share sanitized examples of past work during your discovery call to show our style and quality.',
              },
              {
                q: 'What if I need more than one revision?',
                a: 'One round of revisions is included. Additional rounds are $200 each, though 95% of clients are satisfied after the first round.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 border-2 border-blue-100 hover:border-blue-300 transition-all">
                <h3 className="text-xl font-black text-gray-900 mb-3">{faq.q}</h3>
                <p className="text-gray-600 leading-relaxed font-medium">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}