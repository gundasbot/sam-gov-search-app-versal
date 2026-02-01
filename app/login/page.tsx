// app/login/page.tsx - Fixed for Next.js 15+ 

import { redirect } from 'next/navigation'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  // ✅ Await searchParams in Next.js 15+
  const params = await searchParams
  const callbackUrl = params?.callbackUrl || '/dashboard'

  // Your actual login UI lives on the homepage
  redirect(`/?mode=login&callbackUrl=${encodeURIComponent(callbackUrl)}`)
}