'use client'

import Link from 'next/link'
import { FileText, ChevronRight, Mail, AlertCircle } from 'lucide-react'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <section className="relative z-10 pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Terms of Use</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/10 border border-cyan-500/30 mb-4">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-bold text-cyan-300">Legal</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Terms of Use
            </h1>
            <p className="text-slate-400">Last updated: January 10, 2026</p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Agreement to Terms</h2>
              <p className="text-slate-300 leading-relaxed">
                By accessing or using Precise GovCon, you agree to be bound by these Terms of Use and all applicable 
                laws and regulations. If you do not agree with any of these terms, you are prohibited from using this platform.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Service Description</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Precise GovCon provides a platform for discovering and tracking federal, state, and local government 
                contracting opportunities. Our services include:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Access to aggregated contract opportunity data from SAM.gov and state systems</li>
                <li>Search and filtering tools for finding relevant opportunities</li>
                <li>Email alerts and notifications</li>
                <li>Dashboard analytics and tracking features</li>
                <li>Educational resources and support</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">User Accounts</h2>
              
              <h3 className="text-xl font-semibold text-cyan-400 mb-3">Registration</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                To access certain features, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mb-6">
                <li>Provide accurate, current, and complete information</li>
                <li>Maintain and update your information as needed</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>

              <h3 className="text-xl font-semibold text-cyan-400 mb-3">Account Termination</h3>
              <p className="text-slate-300 leading-relaxed">
                We reserve the right to suspend or terminate your account at any time for violations of these Terms, 
                fraudulent activity, or any other reason at our discretion.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Acceptable Use</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                You agree NOT to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Use the platform for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Infringe intellectual property rights of others</li>
                <li>Transmit viruses, malware, or harmful code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Scrape, copy, or redistribute our data without permission</li>
                <li>Use automated systems to access the platform excessively</li>
                <li>Impersonate any person or entity</li>
                <li>Harass, abuse, or harm other users</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Intellectual Property</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                The platform and its content, features, and functionality are owned by Precise Analytics LLC and are 
                protected by copyright, trademark, and other intellectual property laws.
              </p>
              <p className="text-slate-300 leading-relaxed mb-4">
                Public contract data from SAM.gov and state systems remains in the public domain. Our value-added 
                services, including our search algorithms, analytics, and aggregation methods, are proprietary.
              </p>
              <p className="text-slate-300 leading-relaxed">
                You may not reproduce, distribute, modify, or create derivative works without our written permission.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 backdrop-blur-xl border border-orange-500/30 rounded-2xl p-8">
              <div className="flex items-start gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-orange-400 flex-shrink-0 mt-1" />
                <div>
                  <h2 className="text-2xl font-bold text-white mb-2">Disclaimers</h2>
                  <p className="text-slate-300 leading-relaxed mb-4">
                    THE PLATFORM IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                  </p>
                  <ul className="list-disc list-inside text-slate-300 space-y-2">
                    <li>We do not guarantee the accuracy, completeness, or timeliness of contract data</li>
                    <li>We are not responsible for errors in data from SAM.gov or state systems</li>
                    <li>We do not guarantee uninterrupted or error-free service</li>
                    <li>We do not provide legal, financial, or business advice</li>
                    <li>You are responsible for verifying all information independently</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Limitation of Liability</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                TO THE FULLEST EXTENT PERMITTED BY LAW, PRECISE ANALYTICS LLC SHALL NOT BE LIABLE FOR:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Indirect, incidental, special, consequential, or punitive damages</li>
                <li>Loss of profits, revenue, data, or business opportunities</li>
                <li>Damages resulting from your use or inability to use the platform</li>
                <li>Damages from reliance on information provided through the platform</li>
                <li>Any claim exceeding the amount you paid us in the past 12 months</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Payment Terms</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                For paid subscription plans:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Fees are billed in advance on a recurring basis</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We may change prices with 30 days' notice</li>
                <li>You authorize us to charge your payment method on file</li>
                <li>Failure to pay may result in account suspension</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Governing Law</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the Commonwealth of Virginia, 
                United States, without regard to its conflict of law provisions.
              </p>
              <p className="text-slate-300 leading-relaxed">
                Any disputes shall be resolved in the state or federal courts located in Richmond, Virginia.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Changes to Terms</h2>
              <p className="text-slate-300 leading-relaxed">
                We reserve the right to modify these Terms at any time. We will notify you of material changes by 
                posting the updated Terms and updating the "Last updated" date. Your continued use of the platform 
                after changes constitute acceptance of the new Terms.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                Questions about these Terms? Contact us:
              </p>
              <div className="flex items-center gap-2 text-cyan-400">
                <Mail className="w-5 h-5" />
                <a href="mailto:legal@precisegovcon.com" className="hover:text-cyan-300 transition-colors">
                  legal@precisegovcon.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
