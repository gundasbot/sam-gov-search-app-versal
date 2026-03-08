//app/services/bid-no-bid-review/page.tsx
import Link from 'next/link'
import { CheckCircle, Zap, Target, Clock, Calendar, BarChart3, ArrowRight, Users, Star, Phone, TrendingUp, AlertTriangle, ThumbsUp } from 'lucide-react'

export const metadata = {
  alternates: { canonical: 'https://www.precisegovcon.com/services/bid-no-bid-review' },
  title: 'Bid/No-Bid Analysis Tool | PreciseGovCon',
  description: "Make smarter bid decisions with AI-powered analysis. Stop wasting resources on opportunities you can't win.",
}

export default function BidNoBidPage() {
  return (
    <div className="mx-auto w-full max-w-[1920px] min-h-screen bg-gradient-to-br from-white via-gray-50 to-indigo-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-indigo-800 to-purple-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        <div className="relative w-full px-3 sm:px-5 lg:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 backdrop-blur-sm rounded-full text-slate-100 text-sm font-bold mb-4 border border-indigo-500/30">
                <Zap className="w-4 h-4" /><span>AI-Powered Strategic Analysis</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-white mb-4 leading-tight">Stop Wasting Time on Opportunities You Can't Win</h1>
              <p className="text-lg text-white font-semibold mb-3 leading-relaxed">Our AI-powered bid/no-bid analysis helps you focus on winnable opportunities and avoid costly pursuits.</p>
              <p className="text-base text-slate-100 mb-6">Not every opportunity is worth pursuing. Our data-driven analysis evaluates win probability, competitive positioning, and resource requirements—so you can make smarter bid decisions.</p>
              <div className="flex flex-wrap gap-3 mb-6">
                <Link href="/contact?service=bid-no-bid" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all"><Calendar className="w-5 h-5" />Get Started</Link>
                <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900/40 backdrop-blur-sm text-white border-2 border-white/40 rounded-xl font-bold text-base hover:bg-slate-900/55 transition-all"><ArrowRight className="w-5 h-5" />View All Services</Link>
                <a href="tel:804-404-6005" className="inline-flex items-center gap-2 px-6 py-3 bg-white/20 backdrop-blur-sm text-white border-2 border-white/50 rounded-xl font-bold text-base hover:bg-white/30 transition-all"><Phone className="w-5 h-5" />(804) 404-6005</a>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-white">
                <div className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-slate-200" /><span className="font-semibold text-sm">Data-driven insights</span></div>
                <div className="flex items-center gap-2"><Target className="w-4 h-4 text-slate-200" /><span className="font-semibold text-sm">Win probability scoring</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-slate-200" /><span className="font-semibold text-sm">24-48 hour turnaround</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white/20 backdrop-blur-sm border border-white/40 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4"><Target className="w-12 h-12 text-emerald-400" /><div><div className="text-4xl font-black text-white">3.2x</div><div className="text-sm font-bold text-slate-100">Higher Win Rate</div></div></div>
                <p className="text-sm text-slate-100">Our clients win 3x more often when they follow our recommendations</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm border border-white/40 rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-4"><BarChart3 className="w-12 h-12 text-cyan-400" /><div><div className="text-4xl font-black text-white">$8.4M</div><div className="text-sm font-bold text-slate-100">Avg. Resources Saved</div></div></div>
                <p className="text-sm text-slate-100">By avoiding unwinnable bids, our clients save millions in pursuit costs</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm border border-white/40 rounded-2xl p-6">
                <div className="flex items-center gap-4"><Users className="w-12 h-12 text-yellow-400" /><div><div className="text-2xl font-black text-white">Strategic Partnership</div><div className="text-sm font-semibold text-slate-100 mt-1">We help you win smarter, not just more</div></div></div>
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
            <h2 className="text-3xl font-black text-gray-900 mb-2">What Our Clients Say</h2>
            <p className="text-gray-600">Smart decisions lead to better outcomes</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "They told us not to bid on a $50M opportunity. We listened. The winner bid 40% lower than we would have. Saved us months of work.", author: "Patricia Rodriguez", title: "VP Business Development", result: "Avoided costly loss" },
              { quote: "The analysis showed us exactly where we were weak and how to strengthen our position. We bid, we won, and it wasn't even close.", author: "James Anderson", title: "CEO, Anderson Federal Services", result: "$3.2M contract won" },
              { quote: "We went from a 1-in-5 win rate to 3-in-5 by only bidding opportunities where we had real advantages. Game changer.", author: "Michelle Lee", title: "President, Lee Tech Solutions", result: "3x win rate improvement" },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border-2 border-indigo-100 shadow-lg">
                <div className="flex gap-1 mb-3">{[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />)}</div>
                <p className="text-gray-700 font-medium mb-4 italic">"{item.quote}"</p>
                <div className="border-t-2 border-indigo-100 pt-4">
                  <div className="font-black text-gray-900">{item.author}</div>
                  <div className="text-sm text-gray-600 mb-2">{item.title}</div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3" />{item.result}</div>
                </div>
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
