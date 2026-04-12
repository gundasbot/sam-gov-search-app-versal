// app/cookie-policy/page.tsx
import type { Metadata } from 'next'
import CookiePolicyClient from './CookiePolicyClient'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Learn how PreciseGovCon uses cookies to improve functionality, measure performance, and personalize your experience.',
  alternates: { canonical: 'https://www.precisegovcon.com/cookie-policy' },
  openGraph: { url: 'https://www.precisegovcon.com/cookie-policy' },
}

export default function CookiePolicyPage() {
  return <CookiePolicyClient />
}
