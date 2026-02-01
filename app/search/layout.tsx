'use client'

import React from 'react'

/**
 * IMPORTANT:
 * Do NOT gate /search in the layout.
 * The page (app/search/page.tsx) already contains the correct access logic
 * (NextAuth session + demo/trial fallback) and shows AccessControlModal when needed.
 *
 * The previous layout implementation hard-blocked the entire route using localStorage
 * and also passed onClose={() => {}} which made the modal impossible to close.
 */
export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
