export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            Accessibility
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Precise GovCon is committed to providing an accessible experience for all users.
            We aim to design and build features that work well with keyboards, screen readers, and a wide range of devices.
          </p>
        </header>

        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Our Commitment</h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                We strive to follow recognized accessibility standards and best practices.
                Our goal is to support inclusive access across core workflows like browsing, searching, and reviewing solicitations.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Clear navigation and readable typography</li>
                <li>Consistent focus states and keyboard-friendly controls</li>
                <li>Meaningful labels, headings, and structure</li>
                <li>Helpful error messaging and validation patterns</li>
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">What We’re Working Toward</h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                We aim to align with widely used guidance such as WCAG principles (Perceivable, Operable, Understandable, Robust).
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Keyboard operability across interactive UI</li>
                <li>Contrast improvements for charts, badges, and secondary text</li>
                <li>Better screen reader cues for dynamic content (filters, tabs, modals)</li>
                <li>Reduced motion options where animations are present</li>
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Accessibility Features</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-800 bg-black/20 p-4">
                <h3 className="font-semibold text-white mb-2">Keyboard Navigation</h3>
                <p className="text-slate-300 leading-relaxed">
                  Interactive elements are designed to be reachable and usable by keyboard where possible.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-black/20 p-4">
                <h3 className="font-semibold text-white mb-2">Readable Layout</h3>
                <p className="text-slate-300 leading-relaxed">
                  Clear heading hierarchy and spacing to reduce cognitive load during scanning and review.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-black/20 p-4">
                <h3 className="font-semibold text-white mb-2">Assistive Technology Support</h3>
                <p className="text-slate-300 leading-relaxed">
                  We work to ensure components provide useful semantics for screen readers and forms.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-black/20 p-4">
                <h3 className="font-semibold text-white mb-2">Accessible Support</h3>
                <p className="text-slate-300 leading-relaxed">
                  If something isn’t working, we want to hear about it and fix it quickly.
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Known Limitations</h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                We’re improving quickly, and some areas may not be perfect yet—especially complex visuals like charts and highly dynamic pages.
              </p>
              <p className="text-slate-400">
                If you encounter barriers (contrast, keyboard traps, missing labels, etc.), please tell us—specific examples help a lot.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Feedback & Support</h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                If you encounter accessibility issues or have suggestions, contact us and include:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>The page URL</li>
                <li>What you were trying to do</li>
                <li>Your device/browser and any assistive technology used</li>
                <li>What worked vs. what didn’t</li>
              </ul>

              <p>
                Email:{" "}
                <a
                  href="mailto:support@precisegovcon.com?subject=Accessibility%20Feedback%20-%20Precise%20GovCon"
                  className="text-cyan-300 underline underline-offset-2"
                >
                  support@precisegovcon.com
                </a>
              </p>
            </div>
          </section>

          <section className="text-slate-400 text-sm">
            <p>
              We’re committed to improving accessibility continuously and appreciate your feedback.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
