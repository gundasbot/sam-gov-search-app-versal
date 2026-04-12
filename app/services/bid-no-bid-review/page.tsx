//app/services/bid-no-bid-review/page.tsx
import Link from 'next/link'
import { CheckCircle, Zap, Target, Clock, Calendar, BarChart3, ArrowRight, Users, Star, Phone, TrendingUp, AlertTriangle, ThumbsUp } from 'lucide-react'

export const metadata = {
  alternates: { canonical: 'https://www.precisegovcon.com/services/bid-no-bid-review' },
  title: 'Bid/No-Bid Analysis Tool',
  description: "Make smarter bid decisions with AI-powered analysis. Stop wasting resources on opportunities you can't win.",
  openGraph: { url: 'https://www.precisegovcon.com/services/bid-no-bid-review' },
}

export default function BidNoBidPage() {
  return (
    <div className="mx-auto w-full max-w-480 min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50 text-slate-900">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-50 via-slate-50 to-purple-50 opacity-90" />
        <div className="relative w-full px-3 sm:px-5 lg:px-6 py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-8 lg:items-start">
            <div className="lg:pr-6">
              <div className="mb-3 text-4xl font-black tracking-tight text-indigo-700 md:text-5xl">
                Stop Guessing. Start Deciding.
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-indigo-200 rounded-full text-indigo-700 text-base font-bold mb-5 shadow-sm">
                <Zap className="w-5 h-5" /><span>AI-Powered Strategic Analysis</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-5 leading-tight">Bid/no-bid review for opportunities that deserve a real look</h1>
              <p className="text-2xl text-slate-700 font-semibold mb-4 leading-relaxed">Use structured analysis to decide where your team has real fit, where the risk is high, and where to step back.</p>
              <p className="text-lg md:text-xl text-slate-600 mb-7 leading-8">Not every opportunity should move forward. We help assess fit, readiness, competitive position, and effort so pursuit decisions are less reactive.</p>
              <div className="flex flex-wrap gap-3 mb-7">
                <Link href="/contact?service=bid-no-bid" className="inline-flex items-center gap-2 px-7 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"><Calendar className="w-5 h-5" />Get Started</Link>
                <Link href="/services" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 border border-indigo-200 rounded-xl font-bold text-lg shadow-sm hover:bg-indigo-50 transition-all"><ArrowRight className="w-5 h-5" />View All Services</Link>
                <a href="tel:804-404-6005" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-indigo-700 border border-indigo-200 rounded-xl font-bold text-lg shadow-sm hover:bg-indigo-50 transition-all"><Phone className="w-5 h-5" />(804) 404-6005</a>
              </div>
              <div className="flex flex-wrap items-center gap-5 text-slate-700">
                <div className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /><span className="font-semibold text-base">Data-driven insights</span></div>
                <div className="flex items-center gap-2"><Target className="w-5 h-5 text-indigo-600" /><span className="font-semibold text-base">Win probability scoring</span></div>
                <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-indigo-600" /><span className="font-semibold text-base">24-48 hour turnaround</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4"><Target className="w-12 h-12 text-emerald-500" /><div><div className="text-2xl font-black text-slate-900">Fit review</div></div></div>
                <p className="text-sm text-slate-700">Useful when you need a clearer read on whether the opportunity actually matches your profile and past performance.</p>
              </div>
              <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4"><BarChart3 className="w-12 h-12 text-cyan-500" /><div><div className="text-2xl font-black text-slate-900">Risk review</div></div></div>
                <p className="text-sm text-slate-700">We look at timing, compliance, staffing, and other pressure points that can make a pursuit expensive or thin.</p>
              </div>
              <div className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4"><Users className="w-12 h-12 text-yellow-500" /><div><div className="text-2xl font-black text-slate-900">Decision support</div><div className="text-sm font-semibold text-slate-600 mt-1">You get a clearer recommendation and the reasoning behind it.</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-amber-50 border-y-2 border-amber-200">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 text-center">The Cost of Bad Bid Decisions</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '💸', title: 'Wasted Proposal Costs', desc: 'Proposal development costs $15K-$150K per bid. Pursuing unwinnable opportunities drains your budget.' },
              { emoji: '😓', title: 'Team Burnout', desc: 'Your team spreads thin across too many bids, reducing quality and morale.' },
              { emoji: '📉', title: 'Missed Opportunities', desc: 'Chasing bad opportunities means missing the right ones. Opportunity cost is real.' },
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

      <section className="py-12 bg-white">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Comprehensive Bid/No-Bid Analysis</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Data-driven insights to make confident bid decisions</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Win Probability Score', description: 'AI analyzes 50+ factors to calculate your realistic chance of winning this specific opportunity.' },
              { icon: BarChart3, title: 'Competitive Analysis', description: 'We identify likely competitors, their strengths/weaknesses, and how you stack up.' },
              { icon: AlertTriangle, title: 'Risk Assessment', description: 'Clear identification of technical, pricing, and compliance risks that could sink your bid.' },
              { icon: TrendingUp, title: 'Win Strategy', description: 'If we recommend bidding, we provide strategic guidance to maximize your win probability.' },
              { icon: Users, title: 'Resource Requirements', description: 'Realistic estimate of time, people, and budget needed to compete effectively.' },
              { icon: ThumbsUp, title: 'Clear Recommendation', description: 'Clear, data-backed recommendation with reasoning so you can make the final call.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-indigo-50 rounded-2xl p-6 border-2 border-indigo-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center mb-4"><item.icon className="w-6 h-6 text-indigo-600" /></div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">How It Works</h2>
            <p className="text-lg text-gray-600">Fast, data-driven analysis</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Submit Opportunity', desc: 'Send us the solicitation and your company profile', icon: Target },
              { step: '2', title: 'AI Analysis', desc: 'Our AI evaluates 50+ factors including past performance, competition, and requirements', icon: Zap },
              { step: '3', title: 'Expert Validation', desc: 'Federal contracting strategists validate and enhance the AI recommendations', icon: Users },
              { step: '4', title: 'Receive Report', desc: 'You receive actionable insights and a clear go/no-go recommendation', icon: BarChart3 },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-2xl p-6 border-2 border-indigo-200 shadow-lg text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-black flex items-center justify-center mx-auto mb-3 shadow-md">{item.step}</div>
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mx-auto mb-3"><item.icon className="w-5 h-5 text-indigo-600" /></div>
                  <h3 className="text-base font-black text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                {idx < 3 && <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2"><ArrowRight className="w-6 h-6 text-indigo-400" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Questions this review helps answer</h2>
            <p className="text-gray-600">The goal is not more bidding. The goal is better pursuit choices.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Do we really fit?', detail: 'Helpful when the team sees surface-level alignment but needs a harder look at requirements, past performance, and likely positioning.' },
              { title: 'What could sink this bid?', detail: 'Useful for uncovering timing, staffing, pricing, or compliance issues before you commit proposal resources.' },
              { title: 'What should happen next?', detail: 'The output is meant to support a practical go, no-go, or re-scope discussion rather than just produce another score.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border-2 border-indigo-100 shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center mb-4"><CheckCircle className="w-5 h-5 text-indigo-600" /></div>
                <div className="font-black text-gray-900 mb-2">{item.title}</div>
                <p className="text-sm text-gray-700 leading-relaxed font-medium">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900">
        <div className="w-full px-3 sm:px-5 lg:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Make Smarter Bid Decisions</h2>
          <p className="text-lg text-white mb-8 max-w-2xl mx-auto">Stop wasting resources on unwinnable opportunities. Let our AI-powered analysis help you focus on bids you can actually win.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/contact?service=bid-no-bid" className="inline-flex items-center gap-2 rounded-xl bg-white text-indigo-600 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"><Calendar className="w-6 h-6" />Get Started Today</Link>
            <a href="tel:804-404-6005" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/50 bg-white/20 backdrop-blur-sm text-white px-8 py-4 text-lg font-bold hover:bg-white/30 transition-all"><Phone className="w-6 h-6" />(804) 404-6005</a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-100">
            <div className="flex items-center gap-2"><Target className="w-4 h-4" />Win probability scoring</div>
            <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4" />Competitive analysis</div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4" />24-48 hour turnaround</div>
          </div>
        </div>
      </section>
    </div>
  )
}
