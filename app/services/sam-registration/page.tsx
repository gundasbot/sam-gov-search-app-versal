// app/services/sam-registration/page.tsx

import Image from 'next/image';
import { 
  CheckCircle, Award, Clock, Users, TrendingUp, Shield, Zap, 
  ArrowRight, Phone, Mail, Calendar, Star, Target, BarChart3,
  FileCheck, Sparkles, MessageSquare, ExternalLink, AlertCircle,
  Download, DollarSign, Rocket
} from 'lucide-react';

export const metadata = {
  title: 'SAM Registration Services | Precise GovCon',
  description: 'Complete SAM.gov registration in 72 hours. Expert guidance, no errors, guaranteed approval.',
};

export default function SAMRegistrationPage() {
  const CALENDLY_LINK = process.env.NEXT_PUBLIC_CALENDLY_LINK || 'https://calendly.com/precisegovcon';
  const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || 'sales@precisegovcon.com';
  const CONTACT_PHONE = process.env.NEXT_PUBLIC_CONTACT_PHONE || '(804) 404-6005';

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-emerald-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTIwYzAtMi4yMS0xLjc5LTQtNC00cy00IDEuNzktNCA0IDEuNzkgNCA0IDQgNC0xLjc5IDQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-bold mb-6">
                <Rocket className="w-4 h-4" />
                <span>72-Hour Registration</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl font-black text-white mb-6 leading-tight">
                SAM.gov Registration Made Simple
              </h1>
              
              <p className="text-2xl text-white/90 font-semibold mb-4 leading-relaxed">
                Get registered in SAM.gov in 72 hours with zero errors and guaranteed approval.
              </p>

              <p className="text-lg text-white/80 font-medium mb-8">
                Stop wasting time on confusing forms. Our experts handle your entire SAM registration from start to finish - CAGE code, UEI, reps & certs, and annual renewals.
              </p>

              <div className="flex flex-wrap gap-4 mb-8">
                <a
                  href={CALENDLY_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white text-emerald-600 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
                >
                  <Calendar className="w-6 h-6" />
                  Schedule Free Consultation
                </a>
                
                <a
                  href={`mailto:${CONTACT_EMAIL}?subject=SAM Registration Inquiry`}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all"
                >
                  <Mail className="w-6 h-6" />
                  Email Us
                </a>
              </div>

              <div className="flex flex-wrap items-center gap-6 text-white/90">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-300" />
                  <span className="font-semibold">72-Hour Turnaround</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-emerald-300" />
                  <span className="font-semibold">100% Accuracy</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-300" />
                  <span className="font-semibold">500+ Registrations</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/20 bg-white">
                <Image
                  src="https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop"
                  alt="SAM.gov registration process"
                  width={800}
                  height={600}
                  className="w-full h-auto"
                  priority
                />
                {/* Floating stat cards */}
                <div className="absolute top-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <div className="text-3xl font-black text-emerald-600">72hrs</div>
                  <div className="text-sm font-bold text-gray-700">Average Completion</div>
                </div>
                <div className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-2 text-2xl font-black text-emerald-600">
                    <Star className="w-6 h-6 fill-emerald-500" />
                    100%
                  </div>
                  <div className="text-sm font-bold text-gray-700">Approval Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b-2 border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { number: '500+', label: 'Companies Registered', icon: Users },
              { number: '72hrs', label: 'Average Turnaround', icon: Clock },
              { number: '100%', label: 'Approval Rate', icon: CheckCircle },
              { number: '$0', label: 'Registration Errors', icon: Shield },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-cyan-100 mb-4">
                  <stat.icon className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="text-4xl font-black text-gray-900 mb-2">{stat.number}</div>
                <div className="text-sm font-bold text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why SAM Registration is Critical */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-4xl font-black text-gray-900 mb-6">
              Why SAM Registration is Mandatory
            </h2>
            <div className="space-y-6">
              {[
                {
                  title: 'Required for All Federal Contracts',
                  description: 'You cannot bid on or receive federal contracts over $10,000 without an active SAM registration. It\'s non-negotiable.',
                },
                {
                  title: 'Takes 10+ Hours to Complete Yourself',
                  description: 'SAM.gov has over 60 pages of forms, financial disclosures, and compliance certifications. Most people get stuck or make costly errors.',
                },
                {
                  title: 'Expires Annually',
                  description: 'SAM registration must be renewed every 12 months. Miss the deadline and you lose bidding eligibility instantly.',
                },
                {
                  title: 'Errors Cause 30-60 Day Delays',
                  description: 'One mistake in your NAICS codes, ownership structure, or reps & certs can delay approval by months.',
                },
              ].map((item, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 font-medium leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-3xl p-8 border-2 border-red-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-7 h-7 text-red-600" />
              </div>
              <h3 className="text-2xl font-black text-gray-900">Don't Risk Delays</h3>
            </div>
            <div className="space-y-4">
              <p className="text-gray-700 font-semibold">
                Common mistakes that cause rejection:
              </p>
              <ul className="space-y-3">
                {[
                  'Wrong NAICS code selection',
                  'Incomplete financial information',
                  'Incorrect entity structure',
                  'Missing CAGE code',
                  'Invalid UEI number',
                  'Incomplete reps & certifications',
                ].map((mistake, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-gray-700 font-medium">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>
                    <span>{mistake}</span>
                  </li>
                ))}
              </ul>
              <div className="bg-white rounded-2xl p-6 mt-6">
                <p className="text-lg font-bold text-gray-900 mb-4">
                  Our 72-hour service eliminates all these risks.
                </p>
                <a
                  href={CALENDLY_LINK}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What's Included */}
      <section className="bg-gradient-to-br from-emerald-50 to-cyan-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
              Complete SAM Registration Service
            </h2>
            <p className="text-xl text-gray-600 font-semibold">
              Everything you need for federal contracting eligibility
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: FileCheck,
                title: 'Entity Registration',
                description: 'Complete SAM.gov entity registration with all required information and documentation.',
                included: ['Business information', 'Financial data', 'Banking details', 'Points of contact'],
              },
              {
                icon: Shield,
                title: 'CAGE Code & UEI',
                description: 'We obtain your CAGE code and validate your Unique Entity ID for federal identification.',
                included: ['CAGE code application', 'UEI validation', 'D-U-N-S verification', 'Entity structure review'],
              },
              {
                icon: CheckCircle,
                title: 'Reps & Certifications',
                description: 'Complete all required representations and certifications for federal contracting.',
                included: ['FAR certifications', 'DFAR certifications', 'Compliance attestations', 'Annual updates'],
              },
              {
                icon: Target,
                title: 'NAICS Selection',
                description: 'Strategic NAICS code selection based on your capabilities and target opportunities.',
                included: ['Industry analysis', 'Size standard review', 'Code optimization', 'SBA verification'],
              },
              {
                icon: Clock,
                title: 'Renewal Management',
                description: 'Annual renewal reminders and services to maintain active status.',
                included: ['Renewal calendar', 'Update assistance', 'Expiration alerts', 'Compliance monitoring'],
              },
              {
                icon: Users,
                title: 'Dedicated Support',
                description: 'Personal specialist guides you through the entire process with direct access.',
                included: ['Account manager', 'Email support', 'Phone support', 'Status updates'],
              },
            ].map((service, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border-2 border-gray-100 hover:border-emerald-500 shadow-lg hover:shadow-2xl transition-all"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center mb-6">
                  <service.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-3">
                  {service.title}
                </h3>
                <p className="text-gray-600 leading-relaxed font-medium mb-4">
                  {service.description}
                </p>
                <ul className="space-y-2">
                  {service.included.map((item, iidx) => (
                    <li key={iidx} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Timeline */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            Our 72-Hour Process
          </h2>
          <p className="text-xl text-gray-600 font-semibold">
            From kickoff to active SAM registration in just 3 days
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
          {/* Connection line */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>

          {[
            {
              step: '01',
              title: 'Information Gathering',
              description: 'We collect your business information, banking details, and documentation in a simple onboarding call.',
              time: '1 hour',
            },
            {
              step: '02',
              title: 'Registration Preparation',
              description: 'Our team prepares your complete SAM registration package with NAICS codes and certifications.',
              time: '24 hours',
            },
            {
              step: '03',
              title: 'Submission & Review',
              description: 'We submit your registration to SAM.gov and handle any questions or additional requests.',
              time: '24 hours',
            },
            {
              step: '04',
              title: 'Activation & Training',
              description: 'Your SAM registration is activated and we provide training on maintaining compliance.',
              time: '24 hours',
            },
          ].map((process, idx) => (
            <div key={idx} className="relative">
              <div className="bg-white rounded-3xl p-8 border-2 border-emerald-200 shadow-xl hover:shadow-2xl transition-all">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-3xl font-black text-white mb-6 mx-auto relative z-10">
                  {process.step}
                </div>
                <h3 className="text-xl font-black text-gray-900 mb-3 text-center">
                  {process.title}
                </h3>
                <p className="text-gray-600 leading-relaxed text-center mb-4 font-medium">
                  {process.description}
                </p>
                <div className="flex items-center justify-center gap-2 text-sm font-bold text-emerald-600">
                  <Clock className="w-4 h-4" />
                  {process.time}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="bg-gradient-to-br from-gray-50 to-white py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 font-semibold">
              One-time fee, no hidden costs
            </p>
          </div>

          <div className="bg-white rounded-3xl p-12 border-2 border-emerald-200 shadow-2xl">
            <div className="text-center mb-8">
              <div className="text-6xl font-black text-emerald-600 mb-2">$1,495</div>
              <div className="text-xl font-bold text-gray-600">One-time registration fee</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-black text-gray-900 mb-4">Included:</h3>
                <ul className="space-y-3">
                  {[
                    'Complete SAM registration',
                    'CAGE code acquisition',
                    'UEI validation',
                    'All reps & certifications',
                    'NAICS code selection',
                    '72-hour turnaround',
                    'Dedicated specialist',
                    '1-year renewal reminder',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-500" />
                      <span className="font-semibold text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-6">
                <h3 className="text-lg font-black text-gray-900 mb-4">Annual Renewal:</h3>
                <div className="text-4xl font-black text-emerald-600 mb-2">$495/yr</div>
                <p className="text-gray-600 font-medium mb-4">
                  We handle your annual SAM renewal to maintain active status.
                </p>
                <ul className="space-y-2">
                  {[
                    'Renewal processing',
                    'Information updates',
                    'Certification refresh',
                    'Compliance check',
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="font-semibold text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="text-center">
              <a
                href={CALENDLY_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-10 py-5 bg-gradient-to-r from-emerald-500 to-cyan-500 text-white rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
              >
                <Calendar className="w-7 h-7" />
                Get Started Today
              </a>
              <p className="text-sm text-gray-500 mt-4 font-medium">
                Money-back guarantee if registration is denied
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            What Our Clients Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              quote: "Tried to do SAM registration myself and got stuck for weeks. Precise GovCon had me registered in 3 days. Worth every penny.",
              author: "Mike Rodriguez",
              company: "Rodriguez Construction",
              result: "Registered in 72 hours",
            },
            {
              quote: "They handled everything - CAGE code, reps & certs, the whole thing. I just signed the forms and was done. Couldn't be easier.",
              author: "Sarah Kim",
              company: "TechForward Solutions",
              result: "Zero errors, first try",
            },
            {
              quote: "Annual renewal reminders are clutch. I would have let my registration expire without them. Great ongoing support.",
              author: "James Peterson",
              company: "Peterson Consulting",
              result: "3 years active",
            },
          ].map((testimonial, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-xl">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-emerald-500 text-emerald-500" />
                ))}
              </div>
              <p className="text-gray-700 font-semibold mb-6 leading-relaxed text-lg">
                "{testimonial.quote}"
              </p>
              <div className="border-t-2 border-gray-100 pt-6">
                <div className="font-black text-gray-900 mb-1">{testimonial.author}</div>
                <div className="text-sm text-gray-600 font-semibold mb-3">{testimonial.company}</div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-bold">
                  <CheckCircle className="w-4 h-4" />
                  {testimonial.result}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-emerald-600 via-cyan-600 to-blue-600 py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6">
            Ready to Get SAM Registered?
          </h2>
          <p className="text-2xl text-white/90 font-semibold mb-12">
            Schedule a free consultation to get started today
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <a
              href={CALENDLY_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 bg-white text-emerald-600 rounded-2xl font-black text-xl shadow-2xl hover:shadow-3xl hover:scale-105 transition-all"
            >
              <Calendar className="w-7 h-7" />
              Schedule Free Consultation
            </a>
            
            <a
              href={`tel:${CONTACT_PHONE.replace(/[^0-9+]/g, '')}`}
              className="inline-flex items-center gap-3 px-10 py-5 bg-white/10 backdrop-blur-sm text-white border-2 border-white/30 rounded-2xl font-black text-xl hover:bg-white/20 transition-all"
            >
              <Phone className="w-7 h-7" />
              Call {CONTACT_PHONE}
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-6 justify-center text-white/90 font-semibold">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-300" />
              <span>72-hour turnaround</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-300" />
              <span>100% accuracy guaranteed</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-300" />
              <span>Money-back guarantee</span>
            </div>
          </div>

          <div className="mt-12 pt-12 border-t border-white/20">
            <p className="text-white/80 font-medium mb-4">Prefer email?</p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=SAM Registration Inquiry`}
              className="text-white font-bold text-lg hover:text-emerald-200 transition-colors underline"
            >
              {CONTACT_EMAIL}
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-4xl font-black text-gray-900 mb-12 text-center">
          Frequently Asked Questions
        </h2>

        <div className="space-y-6">
          {[
            {
              q: 'How long does SAM registration really take?',
              a: 'With our service, 72 hours from the time you provide information. If you do it yourself, expect 10-15 hours of work spread over 2-4 weeks, plus potential delays if errors are made.',
            },
            {
              q: 'Is SAM registration free?',
              a: 'The government does not charge for SAM registration - it\'s free to register yourself. However, most businesses hire experts like us to avoid the 10+ hour time investment and eliminate costly errors that cause delays.',
            },
            {
              q: 'What happens if my registration is denied?',
              a: 'We offer a money-back guarantee. If your SAM registration is denied due to our error, we refund 100% of your fee. This has never happened in our 500+ registrations.',
            },
            {
              q: 'Do I need to renew SAM registration annually?',
              a: 'Yes, SAM registration expires every 12 months and must be renewed to maintain active status. We provide renewal reminders and can handle the renewal for $495/year.',
            },
            {
              q: 'Can I start bidding immediately after registration?',
              a: 'Yes! Once your SAM registration is active, you can immediately bid on federal contracts. We also provide guidance on finding opportunities that match your capabilities.',
            },
          ].map((faq, idx) => (
            <div key={idx} className="bg-white rounded-2xl p-8 border-2 border-gray-100 hover:border-emerald-500 transition-all">
              <h3 className="text-xl font-black text-gray-900 mb-3">{faq.q}</h3>
              <p className="text-gray-600 leading-relaxed font-medium">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}