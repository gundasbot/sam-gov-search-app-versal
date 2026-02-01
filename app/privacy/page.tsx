'use client'

import Link from 'next/link'
import { Shield, ChevronRight, Mail } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <section className="relative z-10 pt-24 pb-16 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-slate-400 mb-6">
            <Link href="/" className="hover:text-cyan-400 transition-colors">Home</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">Privacy Policy</span>
          </div>

          {/* Header */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/30 mb-4">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-bold text-emerald-300">Legal</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
              Privacy Policy
            </h1>
            <p className="text-slate-400">Last updated: January 10, 2026</p>
          </div>

          {/* Content */}
          <div className="space-y-8">
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Introduction</h2>
              <p className="text-slate-300 leading-relaxed mb-6">
                Precise Analytics LLC ("Precise GovCon," "we," "us," or "our") is committed to protecting your privacy. 
                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use 
                our federal contracting intelligence platform.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-emerald-400 mb-3">Personal Information</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mb-6">
                <li>Name, email address, and contact information</li>
                <li>Company name and business details</li>
                <li>Account credentials (username and encrypted password)</li>
                <li>Payment and billing information</li>
                <li>NAICS codes and business certifications</li>
              </ul>

              <h3 className="text-xl font-semibold text-emerald-400 mb-3">Usage Information</h3>
              <p className="text-slate-300 leading-relaxed mb-4">
                We automatically collect certain information when you use our platform:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Search queries and filter preferences</li>
                <li>Pages viewed and features used</li>
                <li>Device information and IP address</li>
                <li>Browser type and operating system</li>
                <li>Access times and referring URLs</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">How We Use Your Information</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Provide and maintain our platform services</li>
                <li>Process your account registration and manage your account</li>
                <li>Send you relevant contract opportunities based on your preferences</li>
                <li>Process payments and maintain billing records</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Improve our platform and develop new features</li>
                <li>Send administrative information and service updates</li>
                <li>Detect, prevent, and address technical issues or fraud</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Third-Party Services</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We integrate with the following third-party services:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
                <li><strong>SAM.gov API:</strong> To retrieve federal contracting opportunities</li>
                <li><strong>State Procurement Systems:</strong> To access state and local contract data</li>
                <li><strong>Payment Processors:</strong> To process subscription payments securely</li>
                <li><strong>Analytics Services:</strong> To understand how users interact with our platform</li>
              </ul>
              <p className="text-slate-300 leading-relaxed">
                These third parties have their own privacy policies governing their use of your information.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Data Security</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We implement appropriate technical and organizational security measures to protect your information:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Encryption of data in transit using SSL/TLS</li>
                <li>Encryption of sensitive data at rest</li>
                <li>Regular security audits and vulnerability assessments</li>
                <li>Access controls and authentication requirements</li>
                <li>Secure hosting infrastructure</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Your Rights</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate or incomplete information</li>
                <li>Request deletion of your personal information</li>
                <li>Object to processing of your information</li>
                <li>Request data portability</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Cookies and Tracking</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                We use cookies and similar tracking technologies to:
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
                <li>Maintain your session and keep you logged in</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze platform usage and performance</li>
                <li>Provide personalized content and recommendations</li>
              </ul>
              <p className="text-slate-300 leading-relaxed">
                You can control cookies through your browser settings, though some features may not work properly if cookies are disabled.
              </p>
            </div>

            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Changes to This Policy</h2>
              <p className="text-slate-300 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting 
                the new Privacy Policy on this page and updating the "Last updated" date. We encourage you to review 
                this Privacy Policy periodically for any changes.
              </p>
            </div>

            <div className="bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8">
              <h2 className="text-2xl font-bold text-white mb-4">Contact Us</h2>
              <p className="text-slate-300 leading-relaxed mb-4">
                If you have questions about this Privacy Policy or our privacy practices, please contact us:
              </p>
              <div className="flex items-center gap-2 text-cyan-400">
                <Mail className="w-5 h-5" />
                <a href="mailto:privacy@precisegovcon.com" className="hover:text-cyan-300 transition-colors">
                  privacy@precisegovcon.com
                </a>
              </div>
              <p className="text-slate-400 text-sm mt-4">
                Precise Analytics LLC<br />
                Richmond, Virginia<br />
                United States
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}