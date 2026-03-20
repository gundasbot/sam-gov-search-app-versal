// app/cookie-policy/page.tsx
import type { Metadata } from 'next'
import CookiePolicyClient from './CookiePolicyClient'

export const metadata: Metadata = {
  title: 'Cookie Policy | PreciseGovCon',
  description:
    'Learn how PreciseGovCon uses cookies to improve functionality, measure performance, and personalize your experience on our federal contracting intelligence platform.',
}

export default function CookiePolicyPage() {
  return <CookiePolicyClient />
}
