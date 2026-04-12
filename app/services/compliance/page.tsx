// app/services/compliance/page.tsx
import { Metadata } from 'next'
import Link from 'next/link'
import {
  ShieldCheck,
  Bell,
  FileCheck,
  BarChart3,
  BookOpen,
  Clock,
  ArrowRight,
  Calendar,
  Phone,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'

export const metadata: Metadata = {
  alternates: { canonical: 'https://www.precisegovcon.com/services/compliance' },
  title: 'Federal Compliance Services',
  description: 'Stay compliant with federal contracting requirements through monitoring, alerts, and expert guidance. SAM registration, certifications, and regulatory updates.',
  openGraph: { url: 'https://www.precisegovcon.com/services/compliance' },
}

export default function CompliancePage() {
  return (
    <div className="mx-auto w-full max-w-480 min-h-screen bg-gradient-to-br from-white via-gray-50 to-teal-50 text-slate-900">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50 opacity-90" />

        <div className="relative w-full px-3 sm:px-5 lg:px-6 py-8 lg:py-10">
          <div className="grid grid-cols-1 lg:grid-cols-[1.12fr_0.88fr] gap-8 lg:items-start">
            <div className="lg:pr-6">
              <div className="mb-3 text-4xl font-black tracking-tight text-teal-700 md:text-5xl">
                Stay Compliant. Stay Competitive.
              </div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-teal-200 rounded-full text-teal-700 text-base font-bold mb-5 shadow-sm">
                <ShieldCheck className="w-5 h-5" /><span>Monitoring, Alerts & Compliance Guidance</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-5 leading-tight">
                Federal compliance support that keeps you off the debarment radar
              </h1>

              <p className="text-2xl text-slate-700 font-semibold mb-4 leading-relaxed">
                Missed renewals, lapsed certifications, and overlooked FAR changes can cost you contracts. We help you stay ahead of the requirements.
              </p>

              <p className="text-lg md:text-xl text-slate-600 mb-7 leading-8">
                We monitor your SAM registration, track certification deadlines, surface regulatory updates, and flag compliance gaps before they become disqualifying problems.
              </p>

              <div className="flex flex-wrap gap-3 mb-7">
                <Link
                  href="/contact?service=compliance"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-teal-600 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-5 h-5" />
                  Get Started
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-teal-700 border border-teal-200 rounded-xl font-bold text-lg shadow-sm hover:bg-teal-50 transition-all"
                >
                  <ArrowRight className="w-5 h-5" />
                  View All Services
                </Link>
                <a
                  href="tel:804-404-6005"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-white text-teal-700 border border-teal-200 rounded-xl font-bold text-lg shadow-sm hover:bg-teal-50 transition-all"
                >
                  <Phone className="w-5 h-5" />(804) 404-6005
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-slate-700">
                <div className="flex items-center gap-2"><Bell className="w-5 h-5 text-teal-600" /><span className="font-semibold text-base">Proactive alerts</span></div>
                <div className="flex items-center gap-2"><CheckCircle className="w-5 h-5 text-teal-600" /><span className="font-semibold text-base">SAM & cert monitoring</span></div>
                <div className="flex items-center gap-2"><Clock className="w-5 h-5 text-teal-600" /><span className="font-semibold text-base">Deadline tracking</span></div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <ShieldCheck className="w-12 h-12 text-teal-500" />
                  <div><div className="text-2xl font-black text-slate-900">Registration monitoring</div></div>
                </div>
                <p className="text-sm text-slate-700">Track your SAM.gov active status and get notified before renewals lapse and lock you out of bidding.</p>
              </div>
              <div className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4 mb-4">
                  <AlertTriangle className="w-12 h-12 text-amber-500" />
                  <div><div className="text-2xl font-black text-slate-900">Compliance alerts</div></div>
                </div>
                <p className="text-sm text-slate-700">Real-time flags on certification gaps, FAR updates, and deadline pressure before they become disqualifying issues.</p>
              </div>
              <div className="bg-white border border-teal-100 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <RefreshCw className="w-12 h-12 text-cyan-500" />
                  <div>
                    <div className="text-2xl font-black text-slate-900">Ongoing support</div>
                    <div className="text-sm font-semibold text-slate-600 mt-1">We help you respond to issues, not just find them.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-amber-50 border-y-2 border-amber-200">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-6 text-center">What Compliance Gaps Actually Cost You</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 text-center">
              <div className="text-4xl font-black text-red-600 mb-2">Disqualified</div>
              <p className="text-slate-700 text-sm">An expired SAM registration removes you from consideration on active opportunities automatically.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 text-center">
              <div className="text-4xl font-black text-orange-600 mb-2">Delayed</div>
              <p className="text-slate-700 text-sm">Certification lapses or outdated reps & certs slow down awards and trigger additional agency review.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100 text-center">
              <div className="text-4xl font-black text-amber-600 mb-2">Exposed</div>
              <p className="text-slate-700 text-sm">Missed FAR/DFARS changes can mean non-compliant clauses in active contracts — a risk during audits.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-14 bg-white">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-3 text-center">What We Cover</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto text-center mb-10">Compliance monitoring across the requirements that matter most to federal contractors.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: ShieldCheck, color: 'teal', title: 'Registration Monitoring', desc: 'Track SAM.gov registration status and receive alerts before expiration.' },
              { icon: FileCheck, color: 'green', title: 'Certification Tracking', desc: 'Monitor and manage required certifications and reps & certs.' },
              { icon: BookOpen, color: 'purple', title: 'Regulatory Updates', desc: 'Stay informed about FAR, DFARS, and acquisition regulation changes.' },
              { icon: Bell, color: 'red', title: 'Compliance Alerts', desc: 'Real-time notifications on compliance issues, deadlines, and gaps.' },
              { icon: BarChart3, color: 'yellow', title: 'Audit Support', desc: 'Generate compliance reports and documentation for audits and reviews.' },
              { icon: BookOpen, color: 'indigo', title: 'Guidance Resources', desc: 'Access practical guidance on compliance requirements for your contract type.' },
            ].map(({ icon: Icon, color, title, desc }) => (
              <div key={title} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 text-${color}-600`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{title}</h3>
                <p className="text-gray-600 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 bg-teal-700 text-white">
        <div className="w-full px-3 sm:px-5 lg:px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-4">Don&apos;t let a missed deadline cost you a contract.</h2>
          <p className="text-lg text-teal-100 mb-8 max-w-2xl mx-auto">
            Proactive monitoring is far cheaper than losing an award over an expired registration or overlooked requirement.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              href="/contact?service=compliance"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-teal-700 rounded-xl font-bold text-lg shadow-xl hover:scale-105 transition-all"
            >
              <Calendar className="w-5 h-5" />
              Get Started
            </Link>
            <a
              href="tel:804-404-6005"
              className="inline-flex items-center gap-2 px-8 py-4 bg-teal-600 border border-teal-400 text-white rounded-xl font-bold text-lg shadow-sm hover:bg-teal-500 transition-all"
            >
              <Phone className="w-5 h-5" />(804) 404-6005
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
