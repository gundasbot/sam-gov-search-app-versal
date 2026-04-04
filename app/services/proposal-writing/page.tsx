//app/services/proposal-writing/page.tsx
import Link from 'next/link'
import { CheckCircle, FileText, Sparkles, Clock, Calendar, Target, ArrowRight, Users, Star, Phone, Award, BarChart3, Zap } from 'lucide-react'

export const metadata = {
  alternates: { canonical: 'https://www.precisegovcon.com/services/proposal-writing' },
  title: 'AI Proposal Writing Services | PreciseGovCon',
  description: 'Win more federal contracts with professional proposal writing. AI-powered drafting combined with expert review.',
}

export default function ProposalWritingPage() {
  return (
    <div className="mx-auto w-full max-w-[1920px] min-h-screen bg-gradient-to-br from-white via-gray-50 to-orange-50 text-slate-900">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 opacity-90" />
        <div className="relative w-full px-3 sm:px-5 lg:px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-orange-200 rounded-full text-orange-700 text-sm font-bold mb-4 shadow-sm">
                <Sparkles className="w-4 h-4" /><span>AI-Powered + Expert Review</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-4 leading-tight">Win More Contracts with Professional Proposals</h1>
              <p className="text-lg text-slate-700 font-semibold mb-3 leading-relaxed">Stop losing to better-written proposals. Our AI-powered service creates compelling, compliant proposals that win.</p>
              <p className="text-base text-slate-600 mb-6">We combine cutting-edge AI technology with expert federal contracting writers. The result? Proposals that stand out, meet compliance requirements, and demonstrate clear value.</p>
              <div className="flex flex-wrap gap-3 mb-6">
                <Link href="/contact?service=proposal-writing" className="inline-flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-bold text-base shadow-xl hover:shadow-2xl hover:scale-105 transition-all"><Calendar className="w-5 h-5" />Get Started</Link>
                <Link href="/services" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-700 border border-orange-200 rounded-xl font-bold text-base shadow-sm hover:bg-orange-50 transition-all"><ArrowRight className="w-5 h-5" />View All Services</Link>
                <a href="tel:804-404-6005" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-orange-700 border border-orange-200 rounded-xl font-bold text-base shadow-sm hover:bg-orange-50 transition-all"><Phone className="w-5 h-5" />(804) 404-6005</a>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-slate-700">
                <div className="flex items-center gap-2"><Zap className="w-4 h-4 text-orange-600" /><span className="font-semibold text-sm">AI-powered drafting</span></div>
                <div className="flex items-center gap-2"><Award className="w-4 h-4 text-orange-600" /><span className="font-semibold text-sm">Expert review</span></div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-orange-600" /><span className="font-semibold text-sm">Fast turnaround</span></div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4"><Award className="w-12 h-12 text-emerald-500" /><div><div className="text-4xl font-black text-slate-900">850+</div><div className="text-sm font-bold text-slate-600">Winning Proposals</div></div></div>
                <p className="text-sm text-slate-700">We've helped contractors win hundreds of millions in contracts</p>
              </div>
              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4"><BarChart3 className="w-12 h-12 text-cyan-500" /><div><div className="text-4xl font-black text-slate-900">73%</div><div className="text-sm font-bold text-slate-600">Win Rate</div></div></div>
                <p className="text-sm text-slate-700">Our proposals have a significantly higher win rate than industry average</p>
              </div>
              <div className="bg-white border border-orange-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4"><Users className="w-12 h-12 text-amber-500" /><div><div className="text-2xl font-black text-slate-900">Your Partner in Winning</div><div className="text-sm font-semibold text-slate-600 mt-1">Expert writers who understand federal contracting</div></div></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-amber-50 border-y-2 border-amber-200">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 text-center">Why Most Proposals Lose</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { emoji: '📝', title: 'Generic Responses', desc: "Cookie-cutter responses that don't address the specific RFP requirements." },
              { emoji: '🎯', title: 'Non-Compliant Format', desc: "Evaluators quickly reject proposals that don't follow instructions or miss key sections." },
              { emoji: '💤', title: 'Hard to Read', desc: 'Technical jargon and dense paragraphs that evaluators skip over.' },
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
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">Our Full-Service Proposal Writing</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">Technology meets expertise for proposals that win</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: 'AI-Powered First Draft', description: 'Our AI analyzes the RFP and generates a compliant first draft in hours, not days.' },
              { icon: Users, title: 'Expert Review & Refinement', description: 'Federal contracting experts review and refine the AI draft for quality and compliance.' },
              { icon: Target, title: 'Targeted Positioning', description: 'Every response addresses the specific evaluation criteria and demonstrates your unique value.' },
              { icon: FileText, title: 'Full Compliance Check', description: 'We ensure your proposal meets all RFP requirements, formatting, and page limits.' },
              { icon: BarChart3, title: 'Competitive Intelligence', description: 'We research the competition and position your proposal to stand out.' },
              { icon: Clock, title: 'Fast Turnaround', description: 'AI speeds up the process so you can submit winning proposals on tight deadlines.' },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-orange-50 rounded-2xl p-6 border-2 border-orange-100 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center mb-4"><item.icon className="w-6 h-6 text-orange-600" /></div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-br from-slate-50 to-orange-50">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 mb-3">How It Works</h2>
            <p className="text-lg text-gray-600">AI speed + human expertise = winning proposals</p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'RFP Analysis', desc: 'We review the solicitation and identify all requirements', icon: FileText },
              { step: '2', title: 'AI Draft', desc: 'Our AI generates a compliant first draft in hours', icon: Sparkles },
              { step: '3', title: 'Expert Review', desc: 'Federal contracting experts review and enhance the draft', icon: Users },
              { step: '4', title: 'Final Delivery', desc: 'We do a final compliance check and deliver your proposal', icon: CheckCircle },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-2xl p-6 border-2 border-orange-200 shadow-lg text-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-500 text-white text-2xl font-black flex items-center justify-center mx-auto mb-3 shadow-md">{item.step}</div>
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mx-auto mb-3"><item.icon className="w-5 h-5 text-orange-600" /></div>
                  <h3 className="text-base font-black text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                {idx < 3 && <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2"><ArrowRight className="w-6 h-6 text-orange-400" /></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900 mb-2">What Our Clients Say</h2>
            <p className="text-gray-600">Real wins from real contractors</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { quote: "The AI draft saved us 40 hours of work. The expert review made it winning quality. We got the contract.", author: "Robert Martinez", title: "CEO, Martinez Defense Solutions", result: "$2.4M contract won" },
              { quote: "Best proposal we've ever submitted. The team understood our differentiators and positioned us perfectly.", author: "Lisa Thompson", title: "President, Thompson IT Services", result: "Beat 12 competitors" },
              { quote: "Fast, professional, and they made us look like the obvious choice. Worth every dollar.", author: "Kevin Park", title: "Owner, Park Logistics", result: "First prime contract" },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-orange-50 to-white rounded-2xl p-6 border-2 border-orange-100 shadow-lg">
                <div className="flex gap-1 mb-3">{[...Array(5)].map((_, i) => <Star key={i} className="w-5 h-5 text-yellow-500 fill-yellow-500" />)}</div>
                <p className="text-gray-700 font-medium mb-4 italic">"{item.quote}"</p>
                <div className="border-t-2 border-orange-100 pt-4">
                  <div className="font-black text-gray-900">{item.author}</div>
                  <div className="text-sm text-gray-600 mb-2">{item.title}</div>
                  <div className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-bold"><CheckCircle className="w-3 h-3" />{item.result}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-br from-orange-900 via-orange-800 to-red-900">
        <div className="w-full px-3 sm:px-5 lg:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to Win Your Next Contract?</h2>
          <p className="text-lg text-white mb-8 max-w-2xl mx-auto">Let our AI-powered proposal service give you the competitive edge. Expert writers + cutting-edge technology = winning proposals.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link href="/contact?service=proposal-writing" className="inline-flex items-center gap-2 rounded-xl bg-white text-orange-600 px-8 py-4 text-lg font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all"><Calendar className="w-6 h-6" />Get Started Today</Link>
            <a href="tel:804-404-6005" className="inline-flex items-center gap-2 rounded-xl border-2 border-white/50 bg-white/20 backdrop-blur-sm text-white px-8 py-4 text-lg font-bold hover:bg-white/30 transition-all"><Phone className="w-6 h-6" />(804) 404-6005</a>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-100">
            <div className="flex items-center gap-2"><Zap className="w-4 h-4" />AI-powered drafting</div>
            <div className="flex items-center gap-2"><Users className="w-4 h-4" />Expert review</div>
            <div className="flex items-center gap-2"><Award className="w-4 h-4" />73% win rate</div>
          </div>
        </div>
      </section>
    </div>
  )
}
