import VerifyEmailClient from "./VerifyEmailClient"

// H1 is server-rendered for SEO/crawlers.
// The client component handles interactive states (success/error UI).
export default function VerifyEmailPage() {
  return (
    <>
      {/* SSR H1 for Googlebot — visually hidden, single canonical H1 */}
      <h1 className="sr-only">Email Verification | Precise GovCon</h1>
      <VerifyEmailClient />
    </>
  )
}
