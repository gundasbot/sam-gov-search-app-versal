export default function DocsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black text-white">Documentation</h1>
        <p className="mt-3 text-slate-300">
          This is the starting point for Precise GovCon docs. Add guides here as you ship features.
        </p>

        <div className="mt-10 grid md:grid-cols-3 gap-6">
          {[
            { title: 'Getting Started', desc: 'How to search, filter, and save results.' },
            { title: 'Saved Searches & Alerts', desc: 'Create alerts and email digests.' },
            { title: 'Billing & Plans', desc: 'Understand tiers, upgrades, and invoices.' },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
              <h2 className="text-lg font-bold text-white">{c.title}</h2>
              <p className="mt-2 text-slate-300 text-sm">{c.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <h2 className="text-xl font-bold text-white">Next step</h2>
          <p className="mt-2 text-slate-300">
            If you want, I can generate a full docs structure (MDX pages + sidebar) based on your actual features.
          </p>
        </div>
      </div>
    </main>
  )
}
