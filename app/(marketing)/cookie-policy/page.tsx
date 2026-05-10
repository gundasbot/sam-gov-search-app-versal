// app/cookie-policy/page.tsx
import type { Metadata } from 'next'
import CookiePolicyClient from './CookiePolicyClient'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description:
    'Learn how PreciseGovCon uses cookies to improve functionality, measure performance, and personalize your experience.',
  alternates: { canonical: '/cookie-policy' },
  openGraph: { url: '/cookie-policy' },
}

export default function CookiePolicyPage() {
  return <CookiePolicyClient />
}
