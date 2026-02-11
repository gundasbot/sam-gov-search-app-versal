// app/login/page.tsx - Fixed for Next.js 15+ 

import { redirect } from 'next/navigation'

export default async function LoginPage({ search_params,
}: {
  search_params: Promise<{ callbackUrl?: string }>
}) {
  // ✅ Await search_params in Next.js 15+
  const params = await search_params
  const callbackUrl = params?.callbackUrl || '/dashboard'

  // Your actual login UI lives on the homepage
  redirect(`/?mode=login&callbackUrl=${encodeURIComponent(callbackUrl)}`)
}
