// app/changelog/page.tsx

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function ChangelogPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">What&apos;s New</h1>
        <p className="text-slate-400 mb-8">
          Product updates and improvements will appear here.
        </p>

        <div className="space-y-8">
          <div className="border-l-4 border-emerald-500 pl-6 py-2">
            <h2 className="text-2xl font-semibold mb-2">Initial release</h2>
            <ul className="list-disc list-inside text-slate-300 space-y-1">
              <li>Changelog page added</li>
              <li>Eliminates 404 from the Account dropdown</li>
              <li>Ready for real release notes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
