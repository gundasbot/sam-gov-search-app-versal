import Image from 'next/image'
import Link from 'next/link'
import {
  Search,
  Bell,
  Filter,
  Clock,
  Bookmark,
  Target,
  ArrowRight,
  Calendar,
  CheckCircle,
  FileText,
  Users,
} from 'lucide-react'

export const metadata = {
  alternates: { canonical: 'https://www.precisegovcon.com/services/bid-search' },
  title: 'Federal Bid Search Tools | PreciseGovCon',
  description: 'Search SAM.gov more efficiently with filters, saved searches, alerts, and a cleaner opportunity review workflow built for government contractors.',
}

export default function BidSearchPage() {
  return (
    <div className="mx-auto w-full max-w-480 min-h-screen bg-gradient-to-br from-white via-gray-50 to-emerald-50 text-slate-900">
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 opacity-90" />

        <div className="relative w-full px-3 py-8 sm:px-5 lg:px-6 lg:py-10">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.12fr_0.88fr] lg:items-start">
            <div className="lg:pr-6">
              <div className="mb-3 text-4xl font-black tracking-tight text-emerald-700 md:text-5xl">
                Search Smarter. Pursue Better.
              </div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-base font-bold text-emerald-700 shadow-sm">
                <Search className="w-5 h-5" />
                <span>Search workflow for federal opportunities</span>
              </div>

              <h1 className="mb-5 text-5xl font-black leading-tight text-slate-900 md:text-6xl">
                Find federal opportunities without spending your day buried in SAM.gov
              </h1>

              <p className="mb-4 text-2xl font-semibold leading-relaxed text-slate-700">
                Search faster, filter more precisely, and keep the opportunities that actually deserve follow-up.
              </p>

              <p className="mb-7 max-w-4xl text-lg leading-8 text-slate-600 md:text-xl">
                Our bid search workflow helps teams move from broad searching to a more repeatable process with filters,
                saved searches, alerts, and a cleaner way to review what fits.
              </p>

              <div className="mb-7 flex flex-wrap gap-3">
                <Link
                  href="/search"
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-3.5 text-lg font-bold text-white shadow-xl transition-all hover:scale-105 hover:bg-emerald-700"
                >
                  <Search className="w-5 h-5" />
                  Try Search
                </Link>
                <Link
                  href="/contact?service=bid-search"
                  className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-7 py-3.5 text-lg font-bold text-emerald-700 shadow-sm transition-all hover:bg-emerald-50"
                >
                  <Calendar className="w-5 h-5" />
                  Talk With Our Team
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-5 text-slate-700">
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-emerald-600" />
                  <span className="text-base font-semibold">NAICS and set-aside filters</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-emerald-600" />
                  <span className="text-base font-semibold">Saved searches and alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-emerald-600" />
                  <span className="text-base font-semibold">Shortlist-worthy opportunities</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative overflow-hidden rounded-3xl border-4 border-white/20 shadow-2xl">
                <Image
                  src="/auth-slides/hero-contract-strategy.jpg"
                  alt="Federal bid search workflow"
                  width={1280}
                  height={720}
                  className="w-full h-auto"
                  priority
                />
              </div>

              <div className="absolute top-6 right-6 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur-sm">
                <div className="text-3xl font-black text-emerald-600">Live</div>
                <div className="text-sm font-bold text-gray-700">Search, filter, review</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y-2 border-emerald-200 bg-emerald-50 py-12">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black text-gray-900 md:text-3xl">
              Why manual search gets messy fast
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                emoji: '🔎',
                title: 'Too much noise',
                desc: 'Broad search results bury the opportunities that actually fit your NAICS codes, agencies, and set-aside posture.',
              },
              {
                emoji: '⏰',
                title: 'Too much rechecking',
                desc: 'Without saved searches and alerts, teams keep rerunning the same searches and still worry they missed something important.',
              },
              {
                emoji: '📋',
                title: 'Too little triage',
                desc: 'Finding an opportunity is only the start. You still need a fast way to review fit, deadline pressure, and next steps.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border-2 border-emerald-200 bg-white p-5 shadow-md">
                <div className="mb-2 text-4xl font-black text-emerald-600">{item.emoji}</div>
                <h3 className="mb-2 text-lg font-black text-gray-900">{item.title}</h3>
                <p className="text-sm font-medium text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-gray-900 md:text-4xl">
              What the bid search workflow includes
            </h2>
            <p className="mx-auto mt-3 max-w-3xl text-lg text-gray-600">
              Built to help teams search broadly, narrow quickly, and keep their follow-up organized.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Search,
                title: 'Live opportunity search',
                description: 'Search current SAM.gov opportunities with a more usable workflow for scanning titles, agencies, dates, and fit.',
              },
              {
                icon: Filter,
                title: 'Practical filters',
                description: 'Narrow by NAICS, set-aside, agency, deadline timing, and other search criteria that matter during triage.',
              },
              {
                icon: Bell,
                title: 'Saved searches and alerts',
                description: 'Turn repeat searches into reusable workflows so new matches can surface without constant manual checking.',
              },
              {
                icon: Bookmark,
                title: 'Opportunity tracking',
                description: 'Keep the opportunities worth revisiting in view so the team is not rebuilding a shortlist from scratch.',
              },
              {
                icon: Target,
                title: 'Better pursuit focus',
                description: 'Move from “what was posted” to “what fits us” with a cleaner review path for next-step decisions.',
              },
              {
                icon: FileText,
                title: 'Search to action handoff',
                description: 'Use saved results and filters as the starting point for alerts, dashboard review, and downstream proposal work.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-white to-emerald-50 p-6 shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                  <item.icon className="w-6 h-6 text-emerald-600" />
                </div>
                <h3 className="mb-2 text-lg font-black text-gray-900">{item.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-slate-50 to-emerald-50 py-12">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-gray-900 md:text-4xl">
              How teams usually use it
            </h2>
            <p className="text-lg text-gray-600">A simple rhythm for keeping search work repeatable.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">
            {[
              { step: '1', title: 'Define filters', desc: 'Set up the codes, agencies, geography, and set-asides that reflect your target profile.', icon: Filter },
              { step: '2', title: 'Review results', desc: 'Scan new postings quickly and separate likely fits from noise before spending team time.', icon: Search },
              { step: '3', title: 'Save and alert', desc: 'Turn recurring searches into saved workflows so new matches surface automatically.', icon: Bell },
              { step: '4', title: 'Act on shortlist', desc: 'Move the better candidates into your follow-up process, dashboard, or proposal planning.', icon: CheckCircle },
            ].map((item, idx) => (
              <div key={item.title} className="relative">
                <div className="rounded-2xl border-2 border-emerald-200 bg-white p-6 text-center shadow-lg">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-2xl font-black text-white shadow-md">
                    {item.step}
                  </div>
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                    <item.icon className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h3 className="mb-2 text-base font-black text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <div className="absolute top-1/2 -right-3 hidden -translate-y-1/2 transform md:block">
                    <ArrowRight className="w-6 h-6 text-emerald-400" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="w-full px-3 sm:px-5 lg:px-6">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-gray-900">
              Where this is most useful
            </h2>
            <p className="text-gray-600">A few common cases where search support helps immediately.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                title: 'New market coverage',
                detail: 'Helpful when you are expanding into new agencies, new NAICS areas, or new set-aside categories and need a more disciplined search routine.',
              },
              {
                title: 'Lean BD teams',
                detail: 'Useful when one or two people are carrying business development and need a cleaner way to stay on top of posted opportunities.',
              },
              {
                title: 'Search-to-pursuit workflow',
                detail: 'Worth using when the issue is not access to listings, but a better handoff from discovery into review, alerts, and next actions.',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-6 shadow-lg">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
                  <Users className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="mb-2 font-black text-gray-900">{item.title}</div>
                <p className="text-sm font-medium leading-relaxed text-gray-700">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-900 py-12">
        <div className="w-full px-3 text-center sm:px-5 lg:px-6">
          <h2 className="mb-4 text-3xl font-black text-white md:text-4xl">
            Ready to make search more usable?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-white">
            Start with the live search experience or talk with us about the search workflow your team needs.
          </p>

          <div className="mb-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-bold text-emerald-700 shadow-xl transition-all hover:scale-105 hover:shadow-2xl"
            >
              <Search className="w-6 h-6" />
              Open Search
            </Link>
            <Link
              href="/contact?service=bid-search"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-white/50 bg-white/20 px-8 py-4 text-lg font-bold text-white backdrop-blur-sm transition-all hover:bg-white/30"
            >
              <Calendar className="w-6 h-6" />
              Contact Our Team
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-slate-100">
            <div className="flex items-center gap-2"><Filter className="w-4 h-4" />Practical filters</div>
            <div className="flex items-center gap-2"><Bell className="w-4 h-4" />Saved searches</div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4" />Less manual checking</div>
          </div>
        </div>
      </section>
    </div>
  )
}
