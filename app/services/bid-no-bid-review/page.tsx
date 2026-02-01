//app/services/bid-no-bid-review/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import { 
  CheckCircle, Target, TrendingUp, Users, Clock, Shield, 
  ArrowRight, Zap, BarChart3, Award, AlertCircle, Calendar,
  FileCheck, Lightbulb, MessageSquare, DollarSign,
  Sparkles  // Add this
} from 'lucide-react'

export const metadata = {
  title: 'AI-Powered Bid/No-Bid Analysis | Precise GovCon',
  description: 'Make data-driven bid decisions in minutes, not days. Our AI analyzes win probability, competition, and strategic fit to help you pursue the right opportunities.',
}

export default function BidNoBidReviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-slate-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/20 backdrop-blur-sm rounded-full text-emerald-300 text-sm font-bold mb-6 border border-emerald-500/30">
                <Sparkles className="w-4 h-4" />
                <span>AI-Powered Decision Intelligence</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                Stop Wasting Resources on the Wrong Bids
              </h1>
              
              <p className="text-2xl text-slate-300 font-semibold mb-4 leading-relaxed">
                Know your win probability in minutes, not weeks. Make data-driven go/no-go decisions with confidence.
              </p>

              <p className="text-lg text-slate-400 font-medium mb-8">
                Our AI-powered bid/no-bid analysis evaluates competitive positioning, strategic fit, resource requirements, and win probability—giving you a clear recommendation backed by data.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all"
                >
                  <Calendar className="w-6 h-6" />
                  Get Free Analysis
                </Link>
                
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  View Pricing
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-slate-300">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" />
                  <span className="font-semibold">Results in 24-48 hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-400" />
                  <span className="font-semibold">Data-backed recommendations</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
                  alt="Business analytics and decision-making dashboard"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                
                {/* Floating stat cards */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Target className="w-6 h-6 text-emerald-600" />
                    <div>
                      <div className="text-3xl font-black text-emerald-600">85%</div>
                      <div className="text-sm font-bold text-gray-700">Win Rate Accuracy</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Clock className="w-6 h-6 text-emerald-600" />
                    <div>
                      <div className="text-3xl font-black text-emerald-600">24hrs</div>
                      <div className="text-sm font-bold text-gray-700">Turnaround Time</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-20 bg-red-50 border-y-4 border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">
                The Hidden Cost of Bad Bid Decisions
              </h2>
              <div className="grid md:grid-cols-3 gap-6 text-lg">
                <div>
                  <div className="text-4xl font-black text-red-600 mb-2">$150K+</div>
                  <p className="text-gray-700 font-semibold">Average cost of pursuing a losing bid (time + resources)</p>
                </div>
                <div>
                  <div className="text-4xl font-black text-red-600 mb-2">60%</div>
                  <p className="text-gray-700 font-semibold">Of companies pursue opportunities they shouldn't</p>
                </div>
                <div>
                  <div className="text-4xl font-black text-red-600 mb-2">3-6 months</div>
                  <p className="text-gray-700 font-semibold">Wasted on proposals that never had a real chance</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You Get */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Comprehensive Bid Analysis in 48 Hours
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our proven framework evaluates every critical factor that determines bid success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: 'Win Probability Score',
                description: 'Data-driven assessment of your actual chances based on 15+ factors including past performance, competitive landscape, and technical capability.',
                color: 'emerald',
              },
              {
                icon: Users,
                title: 'Competitive Analysis',
                description: 'Identify incumbents, likely competitors, and their strengths/weaknesses. Know who you\'re up against and how to differentiate.',
                color: 'blue',
              },
              {
                icon: BarChart3,
                title: 'Strategic Fit Assessment',
                description: 'Evaluate alignment with your growth strategy, NAICS codes, past performance, and long-term business goals.',
                color: 'purple',
              },
              {
                icon: DollarSign,
                title: 'Resource Requirements',
                description: 'Detailed breakdown of time, team, and budget needed to pursue successfully. Know the real cost before you commit.',
                color: 'amber',
              },
              {
                icon: Lightbulb,
                title: 'Teaming Recommendations',
                description: 'Identify capability gaps and suggested teaming partners to strengthen your position and improve win probability.',
                color: 'cyan',
              },
              {
                icon: FileCheck,
                title: 'Action Plan & Timeline',
                description: 'If it\'s a GO: detailed roadmap with milestones, deadlines, and critical activities to maximize your chances of winning.',
                color: 'emerald',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
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

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-emerald-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Simple Process, Powerful Results
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Share Opportunity', desc: 'Send us the solicitation number or RFP document', icon: FileCheck },
              { step: '2', title: 'We Analyze', desc: 'Our team evaluates all factors using our proven framework', icon: BarChart3 },
              { step: '3', title: 'Get Recommendation', desc: 'Receive detailed report with GO/NO-GO recommendation', icon: Target },
              { step: '4', title: 'Execute Strategy', desc: 'Follow action plan if GO, save resources if NO-GO', icon: Zap },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-3xl p-8 border-2 border-emerald-200 shadow-xl text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 text-white text-3xl font-black flex items-center justify-center mx-auto mb-4 shadow-lg">
                    {item.step}
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-3">{item.title}</h3>
                  <p className="text-gray-600 font-medium">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-emerald-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Trusted by Smart Government Contractors
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "The bid/no-bid analysis saved us from pursuing a $5M opportunity we had no chance of winning. Worth every penny.",
                author: "Sarah Chen",
                title: "CEO, TechForward Solutions",
                result: "Avoided $200K wasted effort",
              },
              {
                quote: "Their competitive analysis revealed an incumbent partnership we didn't know about. We pivoted to a different opportunity and won.",
                author: "Marcus Rodriguez",
                title: "BD Director, Secure Systems Inc",
                result: "Won $8M contract instead",
              },
              {
                quote: "The teaming recommendations were spot-on. We partnered with their suggested subcontractor and significantly improved our technical score.",
                author: "Jennifer Park",
                title: "Proposal Manager, DataBridge Corp",
                result: "30% higher technical score",
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-emerald-50 rounded-3xl p-8 border-2 border-emerald-200 shadow-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Award key={i} className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                  ))}
                </div>
                <p className="text-gray-700 font-semibold mb-6 leading-relaxed text-lg italic">
                  "{testimonial.quote}"
                </p>
                <div className="border-t-2 border-emerald-200 pt-6">
                  <div className="font-black text-gray-900 mb-1">{testimonial.author}</div>
                  <div className="text-sm text-gray-600 font-semibold mb-3">{testimonial.title}</div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500 text-white rounded-lg text-sm font-bold">
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
      <section className="py-20 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Make Smarter Bid Decisions?
          </h2>
          <p className="text-2xl text-slate-300 font-semibold mb-12">
            Get your first analysis free—see the value before you commit
          </p>

          <div className="bg-white rounded-3xl p-12 shadow-2xl mb-12">
            <div className="grid md:grid-cols-2 gap-8 text-left">
              <div>
                <h3 className="text-2xl font-black text-gray-900 mb-6">What You'll Receive:</h3>
                <ul className="space-y-4">
                  {[
                    'Win probability score (0-100%)',
                    'Competitive landscape analysis',
                    'Strategic fit assessment',
                    'Resource requirements breakdown',
                    'GO/NO-GO recommendation',
                    'Action plan if recommended',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 font-semibold text-lg">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex flex-col justify-center">
                <div className="text-center mb-8">
                  <div className="text-6xl font-black text-gray-900 mb-2">$750</div>
                  <div className="text-xl text-gray-600 font-semibold">per analysis</div>
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-full text-sm font-bold">
                    <Zap className="w-4 h-4" />
                    25% below market rate
                  </div>
                </div>

                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-emerald-500/50 hover:scale-105 transition-all"
                >
                  <Calendar className="w-7 h-7" />
                  Start Free Analysis
                </Link>

                <p className="text-center text-sm text-gray-500 mt-4 font-medium">
                  No credit card required • 48-hour turnaround
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center text-slate-300 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <span>Money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <span>Delivered in 48 hours</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-400" />
              <span>No long-term commitment</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-black text-gray-900 mb-12 text-center">
            Frequently Asked Questions
          </h2>

          <div className="space-y-6">
            {[
              {
                q: 'How accurate is your win probability scoring?',
                a: 'Our scoring model has been validated against hundreds of actual bid outcomes and maintains 85%+ accuracy. We use 15+ factors including competitive landscape, past performance alignment, technical capability, incumbent status, and more.',
              },
              {
                q: 'What information do I need to provide?',
                a: 'At minimum, we need the solicitation number or RFP document. For best results, also share your company profile, relevant past performance, and any intelligence you have on potential competitors or incumbents.',
              },
              {
                q: 'Is this just for large contracts?',
                a: 'No—our analysis is valuable for any opportunity over $100K. The bigger the contract, the more critical it is to make the right decision, but even smaller opportunities benefit from strategic evaluation.',
              },
              {
                q: 'What if you recommend NO-GO but we still want to pursue?',
                a: 'That\'s your decision! Our job is to give you data-backed insights. If you choose to pursue despite a NO-GO recommendation, we\'ll still provide the competitive intelligence and action plan to maximize your chances.',
              },
              {
                q: 'Do you help write the actual proposal?',
                a: 'The bid/no-bid service is focused on the GO/NO-GO decision. If we recommend GO, we can absolutely help with proposal writing—see our Proposal Writing service for details.',
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