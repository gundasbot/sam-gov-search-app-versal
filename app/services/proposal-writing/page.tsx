//app/services/proposal-writing/page.tsx

import Image from 'next/image'
import Link from 'next/link'
import { 
  CheckCircle, FileText, Award, Shield, Users, TrendingUp,
  ArrowRight, Calendar, Target, Zap, Star, Trophy,
  CheckSquare, Lightbulb, MessageSquare, AlertTriangle, BarChart3
} from 'lucide-react'

export const metadata = {
  title: 'Federal Proposal Writing Services | Precise GovCon',
  description: 'Compliance-first proposal writing that wins. Expert writers who understand evaluation criteria, scoring rubrics, and what evaluators actually look for.',
}

export default function ProposalWritingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-purple-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-900">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDM0djJoLTJ2LTJoMnptMC00djJoLTJ2LTJoMnoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-40" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-full text-purple-200 text-sm font-bold mb-6 border border-purple-500/30">
                <Trophy className="w-4 h-4" />
                <span>Compliance + Persuasion = Winning Proposals</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                Win More Federal Contracts with Expert Proposal Writing
              </h1>
              
              <p className="text-2xl text-purple-100 font-semibold mb-4 leading-relaxed">
                Compliance is the baseline. Persuasion wins the contract. We deliver both.
              </p>

              <p className="text-lg text-purple-200 font-medium mb-8">
                Our proposal writers are former federal evaluators who know exactly what scores points. We create compliant, compelling proposals that align perfectly with evaluation criteria and scoring rubrics.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-purple-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-6 h-6" />
                  Request Proposal Support
                </Link>
                
                <Link
                  href="#process"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  See Our Process
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-purple-100">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-purple-300" />
                  <span className="font-semibold">72% win rate</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-300" />
                  <span className="font-semibold">100% compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-300" />
                  <span className="font-semibold">$2B+ in wins</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10">
                <Image
                  src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&h=600&fit=crop"
                  alt="Professional proposal writing and strategy"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-purple-900/60 to-transparent" />
                
                {/* Floating stats */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-purple-600" />
                    <div>
                      <div className="text-3xl font-black text-purple-600">72%</div>
                      <div className="text-sm font-bold text-gray-700">Win Rate</div>
                    </div>
                  </div>
                </div>
                
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <div className="text-3xl font-black text-purple-600">$2B+</div>
                  <div className="text-sm font-bold text-gray-700">Contract Value Won</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Statement */}
      <section className="py-16 bg-red-50 border-y-4 border-red-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-6">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-4">
                Why Most Proposals Lose
              </h2>
              <div className="grid md:grid-cols-3 gap-6 text-lg">
                <div>
                  <div className="text-4xl font-black text-red-600 mb-2">Non-Compliance</div>
                  <p className="text-gray-700 font-semibold">Missing requirements, wrong format, incomplete sections = automatic disqualification</p>
                </div>
                <div>
                  <div className="text-4xl font-black text-red-600 mb-2">Generic Content</div>
                  <p className="text-gray-700 font-semibold">Template responses that don't address specific evaluation criteria or agency needs</p>
                </div>
                <div>
                  <div className="text-4xl font-black text-red-600 mb-2">Poor Strategy</div>
                  <p className="text-gray-700 font-semibold">No win themes, weak discriminators, missing the evaluator's perspective</p>
                </div>
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
              End-to-End Proposal Development
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From compliance matrix to final submission—we handle everything
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: CheckSquare,
                title: 'Compliance Matrix & Outline',
                description: 'Complete traceability to every RFP requirement. Cross-referenced outline ensures nothing gets missed. Foundation for a fully compliant proposal.',
                color: 'purple',
              },
              {
                icon: Lightbulb,
                title: 'Win Strategy & Themes',
                description: 'Clear discriminators that set you apart. Win themes woven throughout the proposal. Evaluator-focused messaging that scores points.',
                color: 'emerald',
              },
              {
                icon: FileText,
                title: 'Technical Approach Writing',
                description: 'Detailed methodology aligned to SOW. Clear, compelling solutions to agency problems. Graphics and visuals that enhance understanding.',
                color: 'blue',
              },
              {
                icon: Users,
                title: 'Management Approach',
                description: 'Org charts, staffing plans, and management processes. Quality control and risk mitigation strategies. Transition plans and performance monitoring.',
                color: 'cyan',
              },
              {
                icon: Trophy,
                title: 'Past Performance Packaging',
                description: 'Relevant contract examples aligned to requirements. Metrics and outcomes that prove capability. Formatted for easy evaluator review.',
                color: 'amber',
              },
              {
                icon: Target,
                title: 'Red Team Review & Polish',
                description: 'External expert review from evaluator perspective. Final compliance check and quality assurance. Executive summary and submission package.',
                color: 'purple',
              },
            ].map((item, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-purple-50 rounded-3xl p-8 border-2 border-purple-100 shadow-xl hover:shadow-2xl transition-all hover:-translate-y-1">
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

      {/* Our Approach */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-purple-50" id="process">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Our Proven Proposal Process
            </h2>
            <p className="text-xl text-gray-600">
              Systematic approach that has won over $2B in federal contracts
            </p>
          </div>

          <div className="space-y-8">
            {[
              {
                phase: 'Phase 1',
                title: 'Analysis & Planning',
                duration: 'Days 1-3',
                activities: [
                  'RFP analysis and requirements mapping',
                  'Win strategy development',
                  'Compliance matrix creation',
                  'Proposal outline and assignment',
                ],
                color: 'purple',
              },
              {
                phase: 'Phase 2',
                title: 'Content Development',
                duration: 'Days 4-14',
                activities: [
                  'Technical approach writing',
                  'Management approach development',
                  'Past performance packaging',
                  'Graphics and visual elements',
                ],
                color: 'blue',
              },
              {
                phase: 'Phase 3',
                title: 'Review & Refinement',
                duration: 'Days 15-18',
                activities: [
                  'Internal quality review',
                  'Red team evaluation',
                  'Client review and feedback',
                  'Final revisions and polish',
                ],
                color: 'emerald',
              },
              {
                phase: 'Phase 4',
                title: 'Finalization & Submission',
                duration: 'Days 19-21',
                activities: [
                  'Executive summary',
                  'Final compliance check',
                  'Production and formatting',
                  'Submission package preparation',
                ],
                color: 'purple',
              },
            ].map((phase, idx) => (
              <div key={idx} className="bg-white rounded-3xl p-8 border-2 border-purple-200 shadow-xl">
                <div className="flex items-start gap-6">
                  <div className={`flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-br from-${phase.color}-500 to-${phase.color}-600 text-white flex items-center justify-center font-black text-2xl shadow-lg`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <h3 className="text-2xl font-black text-gray-900">{phase.title}</h3>
                      <span className={`px-4 py-1 bg-${phase.color}-100 text-${phase.color}-700 rounded-full text-sm font-bold`}>
                        {phase.duration}
                      </span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {phase.activities.map((activity, aidx) => (
                        <div key={aidx} className="flex items-start gap-3">
                          <CheckCircle className={`w-5 h-5 text-${phase.color}-500 flex-shrink-0 mt-0.5`} />
                          <span className="text-gray-700 font-semibold">{activity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Real Results from Real Proposals
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                quote: "They turned our vague ideas into a compelling technical approach. The evaluators specifically praised our methodology in the debrief.",
                author: "Robert Martinez",
                title: "CEO, TechSolutions Inc",
                result: "$12M contract won",
                score: "Technical: 95/100",
              },
              {
                quote: "The compliance matrix alone was worth the investment. We've never been so confident in our submission package.",
                author: "Lisa Chen",
                title: "Proposal Manager, DataSecure LLC",
                result: "$8M IDIQ awarded",
                score: "Perfect compliance",
              },
              {
                quote: "Their red team review caught issues that would have cost us points. We won by less than 2 points—those edits made the difference.",
                author: "James Thompson",
                title: "VP Business Development, SecureNet",
                result: "$25M 5-year contract",
                score: "Won by 1.8 points",
              },
            ].map((testimonial, idx) => (
              <div key={idx} className="bg-gradient-to-br from-slate-50 to-purple-50 rounded-3xl p-8 border-2 border-purple-200 shadow-xl">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-purple-500 text-purple-500" />
                  ))}
                </div>
                <p className="text-gray-700 font-semibold mb-6 leading-relaxed text-lg italic">
                  "{testimonial.quote}"
                </p>
                <div className="border-t-2 border-purple-200 pt-6">
                  <div className="font-black text-gray-900 mb-1">{testimonial.author}</div>
                  <div className="text-sm text-gray-600 font-semibold mb-3">{testimonial.title}</div>
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500 text-white rounded-lg text-sm font-bold">
                      <Trophy className="w-4 h-4" />
                      {testimonial.result}
                    </div>
                    <div className="block text-sm text-purple-600 font-bold">
                      {testimonial.score}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing CTA */}
      <section className="py-20 bg-gradient-to-br from-purple-900 via-indigo-800 to-purple-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Win Your Next Contract?
          </h2>
          <p className="text-2xl text-purple-100 font-semibold mb-12">
            Custom pricing based on opportunity size and complexity
          </p>

          <div className="bg-white rounded-3xl p-12 shadow-2xl mb-12">
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-5xl font-black text-purple-600 mb-2">$15K+</div>
                <div className="text-lg font-bold text-gray-900 mb-2">Small Contracts</div>
                <div className="text-sm text-gray-600">Under $1M value</div>
              </div>
              <div className="text-center border-x-2 border-purple-200">
                <div className="text-5xl font-black text-purple-600 mb-2">$35K+</div>
                <div className="text-lg font-bold text-gray-900 mb-2">Medium Contracts</div>
                <div className="text-sm text-gray-600">$1M - $10M value</div>
              </div>
              <div className="text-center">
                <div className="text-5xl font-black text-purple-600 mb-2">Custom</div>
                <div className="text-lg font-bold text-gray-900 mb-2">Large Contracts</div>
                <div className="text-sm text-gray-600">$10M+ value</div>
              </div>
            </div>

            <div className="bg-purple-50 rounded-2xl p-8 mb-8">
              <h3 className="text-xl font-black text-gray-900 mb-4">All packages include:</h3>
              <div className="grid md:grid-cols-2 gap-4 text-left">
                {[
                  'Compliance matrix & outline',
                  'Complete proposal writing',
                  'Graphics and visuals',
                  'Red team review',
                  'Executive summary',
                  'Unlimited revisions',
                  'Final formatting & production',
                  'Submission package prep',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                    <span className="text-gray-700 font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-purple-500/50 hover:scale-105 transition-all"
            >
              <Calendar className="w-7 h-7" />
              Request Custom Quote
            </Link>

            <p className="text-center text-sm text-gray-500 mt-4 font-medium">
              Rush pricing available • Typical turnaround: 3-4 weeks
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center text-purple-100 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-purple-300" />
              <span>72% win rate</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-purple-300" />
              <span>Former federal evaluators</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-purple-300" />
              <span>$2B+ in contract wins</span>
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
                q: 'How long does it take to write a proposal?',
                a: 'Typical turnaround is 3-4 weeks from kickoff to submission, depending on complexity and RFP page limits. We can accommodate rush requests with additional fees.',
              },
              {
                q: 'Do you guarantee we\'ll win?',
                a: 'No one can guarantee a win—too many factors outside our control. However, our 72% win rate speaks for itself. We guarantee 100% compliance and high-quality, persuasive content.',
              },
              {
                q: 'What information do you need from us?',
                a: 'The RFP/solicitation, your company profile, past performance examples, team resumes, any technical solutions or methodologies you want to propose, and subject matter expert availability for interviews.',
              },
              {
                q: 'Can you help with pricing and cost volumes?',
                a: 'We focus on technical and management volumes. For cost/pricing, we partner with certified pricing specialists and can make introductions.',
              },
              {
                q: 'What if we need support after submission?',
                a: 'We provide debrief analysis if you don\'t win, and Q&A support during the evaluation period if needed. This is included in our pricing.',
              },
            ].map((faq, idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-purple-50 rounded-2xl p-8 border-2 border-purple-100 hover:border-purple-300 transition-all">
                <h3 className="text-xl font-black text-gray-900 mb-3 flex items-start gap-3">
                  <MessageSquare className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
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