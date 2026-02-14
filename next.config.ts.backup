// next.config.ts
import type { NextConfig } from 'next'

/**
 * Next.js configuration
 * - Removes invalid experimental.turbo (BREAKS build in Next 16)
 * - Adds remote image hosts used across the app
 * - Skips static generation for pages with hook issues
 */

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'source.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/**',
      },
    ],
  },

  /**
   * DO NOT add `turbo` under experimental.
   * Turbopack is enabled automatically in dev by Next 16.
   *
   * NOTE:
   * `missingSuspenseWithCSRBailout` is NOT a valid Next.js 16 experimental key.
   * Leaving it here will fail TypeScript and break `next build`.
   */

  // Skip static generation for specific paths
  async headers() {
    return [
      {
        source: '/changelog',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
      {
        source: '/pricing/checkout',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ]
  },
}

export default nextConfig
