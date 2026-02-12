// next.config.ts
import type { NextConfig } from 'next'

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

  // Add rewrites for icon redirects to Precise GovCon logo
  async rewrites() {
    return [
      {
        source: '/icons/icon-192x192.png',
        destination: '/precise-govcon-logo.jpg',
      },
      {
        source: '/icon-192x192.png',
        destination: '/precise-govcon-logo.jpg',
      },
      {
        source: '/favicon.ico',
        destination: '/precise-govcon-logo.jpg',
      },
    ]
  },

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
