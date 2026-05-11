'use client'

import Link from 'next/link'
import { ExternalLink, Search, Building2, DollarSign, Shield, Globe, FileText, Award, MapPin, BookOpen } from 'lucide-react'

const GOV_LINKS = [
  {
    category: 'Contracting & Procurement',
    icon: Search,
    color: '#f97316',
    links: [
      {
        name: 'SAM.GOV',
        url: 'https://sam.gov',
        desc: 'The official U.S. government system for federal awards. Register your business, view solicitations, search contractors, and manage entity registrations. Required for all federal contract and grant work.',
      },
      {
        name: 'BETA.SAM.GOV',
        url: 'https://beta.sam.gov',
        desc: 'The modernized version of SAM.gov with improved search, entity management, and contract opportunity views. Use alongside SAM.gov for the best results.',
      },
      {
        name: 'USASPENDING.GOV',
        url: 'https://usaspending.gov',
        desc: 'A government source for data on federal grants, contracts, loans, and other financial assistance. Search federal awards from FY2008 to present by state, congressional district, city, and zip code.',
      },
    ],
  },
  {
    category: 'Business Search & Certifications',
    icon: Building2,
    color: '#2563eb',
    links: [
      {
        name: 'DSBS.GOV — Dynamic Small Business Search',
        url: 'https://dsbs.sba.gov',
        desc: 'Search the Dynamic Small Business Database. View business certifications, ownership/self-certifications, nature of business, NAICS codes, geographic area, and contact profiles.',
      },
      {
        name: 'SBA.GOV — Small Business Administration',
        url: 'https://sba.gov',
        desc: 'An independent federal agency dedicated to small businesses. Find counseling, capital, and contracting expertise. Search set-aside programs: 8(a), HUBZone, WOSB, SDVOSB.',
      },
      {
        name: 'VETBIZ.GOV — Veteran Small Business Certification',
        url: 'https://veterans.certify.sba.gov',
        desc: 'SBA\'s certification program for Veteran-Owned Small Businesses (VOSB) and Service-Disabled Veteran-Owned Small Businesses (SDVOSB). Required for VA set-aside contracts.',
      },
    ],
  },
  {
    category: 'GSA & Schedule Contracts',
    icon: DollarSign,
    color: '#16a34a',
    links: [
      {
        name: 'GSAADVANTAGE.GOV',
        url: 'https://gsaadvantage.gov',
        desc: 'The Amazon of the Federal Government — an online shopping and ordering service run by GSA. Agencies use it to purchase commercial products and services on GSA schedule contracts.',
      },
      {
        name: 'GSAELIBRARY.GOV',
        url: 'https://gsaelibrary.gsa.gov',
        desc: 'Research GSA Schedule contract award information. Search schedules, industry categories, and SIN\'s (Special Item Numbers). View contractor T&C\'s, pricelists, and company information.',
      },
      {
        name: 'GSA.GOV — General Services Administration',
        url: 'https://gsa.gov',
        desc: 'The federal agency that manages government property, products, services, and IT. Key resource for GSA Schedule contracts, real property, and federal acquisition policy.',
      },
    ],
  },
  {
    category: 'NAICS & Classification Codes',
    icon: BookOpen,
    color: '#7c3aed',
    links: [
      {
        name: 'NAICS CODES — U.S. Census Bureau',
        url: 'https://www.census.gov/naics',
        desc: 'The North American Industry Classification System (NAICS) is the federal standard for classifying businesses. Search keywords to determine which NAICS codes apply to your products and services.',
      },
      {
        name: 'PSC CODES — Product & Service Codes',
        url: 'https://www.acquisition.gov/PSC_Manual',
        desc: 'Federal supply codes used by the U.S. government to describe products, services, and R&D. View the PSC catalog to see which codes describe your business and link to contract opportunities.',
      },
      {
        name: 'CAGE CODES — Defense Logistics Agency',
        url: 'https://cage.dla.mil',
        desc: 'Commercial and Government Entity (CAGE) codes assigned to entities doing business with the federal government. Required for SAM.gov registration. Look up any contractor by CAGE code.',
      },
    ],
  },
  {
    category: 'Award History & Intelligence',
    icon: Award,
    color: '#0891b2',
    links: [
      {
        name: 'FPDS — Federal Procurement Data System',
        url: 'https://fpds.gov',
        desc: 'The official repository for all federal contract action data. View award history for agencies, contractors, NAICS codes, and set-aside types. Essential for market research and competitor analysis.',
      },
      {
        name: 'BGOV / GovWin — Market Intelligence',
        url: 'https://bgov.com',
        desc: 'Bloomberg Government\'s platform for federal market intelligence, contract data, and procurement forecasts. Track agency budgets, understand agency buying patterns, and identify opportunities early.',
      },
    ],
  },
  {
    category: 'Regulations & Compliance',
    icon: FileText,
    color: '#dc2626',
    links: [
      {
        name: 'FAR — Federal Acquisition Regulation',
        url: 'https://acquisition.gov/browse/index/far',
        desc: 'The primary regulation governing all federal executive agency acquisitions. Essential reading for government contractors — covers solicitation requirements, contract clauses, and compliance.',
      },
      {
        name: 'DFARS — Defense Acquisition Regulation',
        url: 'https://acquisition.gov/dfars',
        desc: 'DoD supplement to the FAR with defense-specific requirements including cybersecurity (CMMC), IP rights, and specialized acquisition procedures for defense contracts.',
      },
      {
        name: 'REGULATIONS.GOV',
        url: 'https://regulations.gov',
        desc: 'Official federal rulemaking portal. View proposed rules, final rules, and public comments. Monitor new federal regulations that may affect your contracting activities.',
      },
    ],
  },
  {
    category: 'Set-Aside & HUBZone Maps',
    icon: MapPin,
    color: '#059669',
    links: [
      {
        name: 'HUBZONE MAP — SBA HUBZone Locator',
        url: 'https://maps.certify.sba.gov/hubzone/map',
        desc: 'Determine if your business location qualifies for the HUBZone (Historically Underutilized Business Zone) certification. View HUBZone maps by address, county, and congressional district.',
      },
      {
        name: 'WOSB PROGRAM — Women-Owned Small Business',
        url: 'https://www.sba.gov/federal-contracting/contracting-assistance-programs/women-owned-small-business-federal-contracting-program',
        desc: 'Information on the Women-Owned Small Business (WOSB) and Economically Disadvantaged WOSB (EDWOSB) federal contracting programs, eligibility, and certification requirements.',
      },
    ],
  },
  {
    category: 'General Government Portals',
    icon: Globe,
    color: '#64748b',
    links: [
      {
        name: 'USA.GOV',
        url: 'https://usa.gov',
        desc: 'The official web portal of the U.S. federal government. Links to every federal agency and state, local, and tribal governments — a starting point for any government research.',
      },
      {
        name: 'FEMA.GOV — Emergency Management',
        url: 'https://fema.gov',
        desc: 'Federal Emergency Management Agency. Key resource for disaster response contracts, FEMA grant opportunities, and emergency preparedness contracting requirements.',
      },
      {
        name: 'GRANTS.GOV',
        url: 'https://grants.gov',
        desc: 'The single access point for over 1,000 grant programs offered by 26 federal grant-making agencies. Search, apply for, and track federal grants relevant to your business or organization.',
      },
    ],
  },
]

export default function GovLinksPage() {
  return (
    <main className="min-h-screen" style={{ background: '#f8fafc' }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-5 h-5 rounded flex items-center justify-center" style={{ background: '#f97316' }}>
              <span className="text-white font-black text-xs">G</span>
            </div>
            <span className="text-sm font-black uppercase tracking-wider" style={{ color: '#f97316' }}>Government Resources</span>
          </div>
          <h1 className="text-3xl font-black" style={{ color: '#0f172a' }}>Quick Links to Top Government Websites</h1>
          <p className="mt-2 text-base font-medium leading-relaxed" style={{ color: '#475569' }}>
            These links provide direct access to the federal contracting ecosystem — from registrations and solicitations to award history, certifications, and compliance resources.
          </p>

          {/* What you can do bullets */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'Access Government databases and search result display options',
              'GSA schedule industry categories, SINs, and registered business information',
              'Industry classification and product and service code details',
              'Registered business profiles, award history, and contact information',
              'Educational and beneficial information about contracts and grants',
              'Award history for businesses, departments, agencies, and sub-agencies',
            ].map((bullet) => (
              <div key={bullet} className="flex items-start gap-2 text-sm" style={{ color: '#475569' }}>
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ background: '#f97316' }} />
                {bullet}
              </div>
            ))}
          </div>
        </div>

        {/* Link categories */}
        <div className="space-y-8">
          {GOV_LINKS.map((cat) => {
            const CatIcon = cat.icon
            return (
              <div key={cat.category}>
                <div
                  className="flex items-center gap-2.5 mb-4 pb-2"
                  style={{ borderBottom: `2px solid ${cat.color}20` }}
                >
                  <CatIcon className="h-4 w-4 flex-shrink-0" style={{ color: cat.color }} />
                  <h2 className="font-black text-sm uppercase tracking-wider" style={{ color: cat.color }}>
                    {cat.category}
                  </h2>
                </div>

                <div className="space-y-4">
                  {cat.links.map((link) => (
                    <div key={link.name}>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-center gap-1.5 font-bold text-sm mb-1 hover:underline transition-colors"
                        style={{ color: cat.color }}
                      >
                        {link.name}
                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      </a>
                      <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>{link.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        <div className="mt-12 rounded-xl p-4 text-sm italic" style={{ background: '#ffffff', border: '1px solid #e2e8f0', color: '#94a3b8' }}>
          * Throughout the program, users are provided additional Government quick links relevant to their specific NAICS codes, PSC codes, and agency targets. Contact support for personalized resource recommendations.
        </div>

        {/* Back to home */}
        <div className="mt-6 text-center">
          <Link href="/home" className="text-sm font-semibold hover:underline" style={{ color: '#f97316' }}>
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}
