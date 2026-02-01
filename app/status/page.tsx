export default function StatusPage() {
  return (
    <main className="max-w-3xl mx-auto px-6 py-16 text-slate-200">
      <h1 className="text-2xl font-semibold mb-6">System Status</h1>

      <div className="space-y-4 text-slate-400 leading-relaxed">
        <p>
          Current Status: <span className="text-emerald-300">All systems operational</span>
        </p>

        <p>
          Scheduled maintenance and service updates will be posted here when applicable.
        </p>

        <p>
          For issues not listed, contact{" "}
          <a
            href="mailto:support@precisegovcon.com"
            className="text-cyan-300 underline underline-offset-2"
          >
            support@precisegovcon.com
          </a>.
        </p>
      </div>
    </main>
  );
}
