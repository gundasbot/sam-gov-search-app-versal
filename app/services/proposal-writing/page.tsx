//app/services/proposal-writing/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import { 
  CheckCircle, FileText, Sparkles, Clock, Calendar, Target,
  ArrowRight, Users, Star, Phone, Award, BarChart3, Zap
} from 'lucide-react'

export const metadata = {
  alternates: { canonical: 'https://precisegovcon.com/services/proposal-writing' },
  title: 'AI Proposal Writing Services | PreciseGovCon| Precise GovCon',
  description: 'Win more federal contracts with professional proposal writing. AI-powered drafting combined with expert review.',
}

export default function ProposalWritingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-orange-50">
      {/* Compact Hero - 2 Column */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-900 via-orange-800 to-red-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left: Content */}
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/20 backdrop-blur-sm rounded-full text-orange-200 text-sm font-bold mb-4 border border-orange-500/30">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered + Expert Review</span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">
                Win More Contracts with Professional Proposals
              </h1>
              
              <p className="text-lg text-orange-100 font-semibold mb-3 leading-relaxed">
                Stop losing to better-written proposals. Our AI-powered service creates compelling, compliant proposals that win.
              </p>

              <p className="text-base text-orange-200 mb-6">
                We combine cutting-edge AI technology with expert federal contracting writers. The result? Proposals that stand out, meet compliance requirements, and demonstrate clear value.
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  href="/contact?service=proposal-writing"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-600 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  Get Started
                </Link>
                
                <a
                  href="tel:804-404-4005"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-xl font-bold text-base hover:bg-white/20 transition-all"
                >
                  <Phone className="w-5 h-5" />
                  (804) 404-4005
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-orange-100">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-300" />
                  <span className="font-semibold text-sm">AI-powered drafting</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-300" />
                  <span className="font-semibold text-sm">Expert review</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-300" />
                  <span className="font-semibold text-sm">Fast turnaround</span>
                </div>
              </div>
            </div>

            {/* Right: Stats & Social Proof */}
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <Award className="w-12 h-12 text-emerald-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white">850+</div>
                    <div className="text-sm font-bold text-orange-200">Winning Proposals</div>
                  </div>
                </div>
                <p className="text-sm text-orange-200">We've helped contractors win hundreds of millions in contracts</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-shrink-0">
                    <BarChart3 className="w-12 h-12 text-cyan-400" />
                  </div>
                  <div>
                    <div className="text-4xl font-black text-white">73%</div>
                    <div className="text-sm font-bold text-orange-200">Win Rate</div>
                  </div>
                </div>
                <p className="text-sm text-orange-200">Our proposals have a significantly higher win rate than industry average</p>
              </div>

              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                <div className="flex items-center gap-4">
                  <div className="flex-shrink-0">
                    <Users className="w-12 h-12 text-yellow-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">Your Partner in Winning</div>
                    <div className="text-sm font-semibold text-orange-200 mt-1">Expert writers who understand federal contracting</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-12 bg-amber-50 border-y-2 border-amber-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 text-center">
            Why Most Proposals Lose
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '📝', title: 'Generic Content', desc: 'Cookie-cutter responses that don\'t address the specific RFP requirements.' },
              { emoji: '🎯', title: 'Missing Requirements', desc: 'Evaluators quickly reject proposals that don\'t follow instructions or miss key sections.' },
              { emoji: '💤', title: 'Boring Writing', desc: 'Technical jargon and dense paragraphs that evaluators skip over.' },
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

      {/* What's Included */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              AI Proposal Writing Services | PreciseGovConService
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Technology meets expertise for proposals that win
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: 'AI-Powered Drafting',
                description: 'Our AI analyzes the RFP and generates a compliant first draft in hours, not days.',
              },
              {
                icon: Users,
                title: 'Expert Review & Editing',
                description: 'Federal contracting experts review and refine the AI draft for quality and compliance.',
              },
              {
                icon: Target,
                title: 'Tailored Responses',
                description: 'Every response addresses the specific evaluation criteria and demonstrates your unique value.',
              },
              {
                icon: FileText,
                title: 'Compliance Check',
                description: 'We ensure your proposal meets all RFP requirements, formatting, and page limits.',
              },
              {
                icon: BarChart3,
                title: 'Competitive Analysis',
                description: 'We research the competition and position your proposal to stand out.',
              },
              {
                icon: Clock,
                title: 'Fast Turnaround',
                description: 'AI speeds up the process so you can submit winning proposals on tight deadlines.',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-orange-50 rounded-2xl p-6 border-2 border-orange-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-12 bg-gradient-to-br from-slate-50 to-orange-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">
              How It Works
            </h2>
            <p className="text-lg text-gray-600">AI speed + human expertise = winning proposals</p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'RFP Analysis', desc: 'We review the solicitation and identify all requirements', icon: FileText },
              { step: '2', title: 'AI Drafting', desc: 'Our AI generates a compliant first draft in hours', icon: Sparkles },
              { step: '3', title: 'Expert Refinement', desc: 'Federal contracting experts review and enhance the draft', icon: Users },
              { step: '4', title: 'Final Review', desc: 'We do a final compliance check and deliver your proposal', icon: CheckCircle },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-2xl p-6 border-2 border-orange-200 shadow-lg text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-2xl font-black flex items-center justify-center mx-auto mb-3 shadow-md">
                    {item.step}
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-5 h-5 text-orange-600" />
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="w-6 h-6 text-orange-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">
              What Our Clients Say
            </h2>
            <p className="text-gray-600">Real wins from real contractors</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "The AI draft saved us 40 hours of work. The expert review made it winning quality. We got the contract.",
                author: "Robert Martinez",
                title: "CEO, Martinez Defense Systems",
                result: "$2.4M contract won",
              },
              {
                quote: "Best proposal we've ever submitted. The team understood our differentiators and positioned us perfectly.",
                author: "Lisa Thompson",
                title: "BD Director, Thompson Consulting",
                result: "Beat 12 competitors",
              },
              {
                quote: "Fast, professional, and they made us look like the obvious choice. Worth every dollar.",
                author: "Kevin Park",
                title: "Owner, Park Engineering",
                result: "First prime contract",
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border-2 border-orange-100 shadow-lg">
                <div className="flex gap-1 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  ))}
                </div>
                <p className="text-gray-700 font-medium mb-4 italic">"{item.quote}"</p>
                <div className="border-t-2 border-orange-100 pt-4">
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

      {/* CTA */}
      <section className="py-12 bg-gradient-to-br from-orange-900 via-orange-800 to-red-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Win Your Next Contract?
          </h2>
          <p className="text-lg text-orange-100 mb-8 max-w-2xl mx-auto">
            Let our AI-powered proposal service give you the competitive edge. Expert writers + cutting-edge technology = winning proposals.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link
              href="/contact?service=proposal-writing"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-orange-600 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
            >
              <Calendar className="w-6 h-6" />
              Get Started Today
            </Link>
            <a
              href="tel:804-404-4005"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/30 bg-white/10 backdrop-blur-sm text-white px-8 py-4 text-lg font-bold hover:bg-white/20 transition-all"
            >
              <Phone className="w-6 h-6" />
              (804) 404-4005
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-orange-200">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              AI-powered drafting
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Expert review
            </div>
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              73% win rate
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

