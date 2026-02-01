export default function SupportPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black text-white">Help & Support</h1>
        <p className="mt-3 text-slate-300">
          Need help with your account, billing, saved searches, or alerts? We’ve got you.
        </p>

        <div className="mt-10 grid md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white">Contact Support</h2>
            <p className="mt-2 text-slate-300">Email us and we’ll respond quickly.</p>
            <a
              href="mailto:support@precisegovcon.com"
              className="inline-flex mt-4 px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 font-semibold text-white"
            >
              support@precisegovcon.com
            </a>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white">Quick Links</h2>
            <ul className="mt-3 space-y-2 text-slate-300">
              <li><a className="text-cyan-300 hover:text-cyan-200" href="/account">Account Settings</a></li>
              <li><a className="text-cyan-300 hover:text-cyan-200" href="/account?tab=plan">Billing & Plan</a></li>
              <li><a className="text-cyan-300 hover:text-cyan-200" href="/search">Search Opportunities</a></li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
