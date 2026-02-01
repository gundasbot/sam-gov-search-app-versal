export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-6 py-16">
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            Security
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Precise GovCon is built with security in mind—from authentication to infrastructure.
            This page explains our security approach, what we do to protect data, and how to report concerns.
          </p>
        </header>

        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Security Principles</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-300">
              <li><span className="font-semibold text-white">Least privilege:</span> access is limited to what’s necessary.</li>
              <li><span className="font-semibold text-white">Defense in depth:</span> multiple layers of controls (app + network + infrastructure).</li>
              <li><span className="font-semibold text-white">Secure by default:</span> safe defaults, validated inputs, and careful error handling.</li>
              <li><span className="font-semibold text-white">Continuous improvement:</span> we review and harden as the platform evolves.</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Account & Authentication</h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                We use modern authentication practices to reduce credential risk and prevent unauthorized access.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Passwords (if used) are stored using secure hashing—never plaintext.</li>
                <li>Session handling is designed to prevent common web threats (e.g., token leakage and replay).</li>
                <li>Protected areas (like Contract Search and Dashboard) require sign-in.</li>
              </ul>
              <p className="text-slate-400">
                Tip: Use a unique password and a password manager for best protection.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Data Protection</h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                We apply safeguards to protect user data in transit and at rest.
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-semibold text-white">Encryption in transit:</span> HTTPS/TLS for connections.</li>
                <li><span className="font-semibold text-white">Encryption at rest:</span> secure storage configurations where applicable.</li>
                <li><span className="font-semibold text-white">Access controls:</span> restricted internal access and environment separation.</li>
                <li><span className="font-semibold text-white">Logging:</span> operational logs used for reliability and threat detection.</li>
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Application Security</h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>We follow secure development best practices, including:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Input validation and safe output encoding to reduce XSS/Injection risk</li>
                <li>Principled dependency management and patching where possible</li>
                <li>Rate-limiting / abuse prevention patterns for public endpoints</li>
                <li>Separation of client and server responsibilities</li>
              </ul>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Responsible Disclosure</h2>
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p>
                If you believe you’ve found a security vulnerability, please report it privately so we can investigate and remediate quickly.
              </p>
              <p>
                Email:{" "}
                <a
                  href="mailto:support@precisegovcon.com?subject=Security%20Report%20-%20Precise%20GovCon"
                  className="text-cyan-300 underline underline-offset-2"
                >
                  support@precisegovcon.com
                </a>
              </p>
              <div className="rounded-xl border border-slate-800 bg-black/20 p-4 text-slate-300">
                <p className="font-semibold text-white mb-2">Include in your report:</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Steps to reproduce (as safely as possible)</li>
                  <li>What you expected vs. what happened</li>
                  <li>Impact estimate (data exposure, auth bypass, etc.)</li>
                  <li>Screenshots or logs (if available)</li>
                </ul>
              </div>
              <p className="text-slate-400">
                Please avoid testing that disrupts service availability or accesses other users’ data.
              </p>
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <h2 className="text-xl font-bold text-white mb-3">Security FAQs</h2>
            <div className="space-y-4">
              <details className="rounded-xl border border-slate-800 bg-slate-950/20 p-4">
                <summary className="cursor-pointer font-semibold text-white">
                  Do you store passwords in plain text?
                </summary>
                <p className="mt-2 text-slate-300">
                  No. Credentials are stored using secure hashing and are never stored or transmitted in plain text.
                </p>
              </details>

              <details className="rounded-xl border border-slate-800 bg-slate-950/20 p-4">
                <summary className="cursor-pointer font-semibold text-white">
                  How do I report a suspicious login or account issue?
                </summary>
                <p className="mt-2 text-slate-300">
                  Contact{" "}
                  <a
                    className="text-cyan-300 underline underline-offset-2"
                    href="mailto:support@precisegovcon.com?subject=Account%20Security%20Issue%20-%20Precise%20GovCon"
                  >
                    support@precisegovcon.com
                  </a>{" "}
                  with details, and we’ll help you secure the account.
                </p>
              </details>
            </div>
          </section>

          <section className="text-slate-400 text-sm">
            <p>
              Note: While no system can be guaranteed completely secure, we continuously evaluate and improve our practices.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
