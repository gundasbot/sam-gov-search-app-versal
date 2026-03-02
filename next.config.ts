// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'source.unsplash.com', pathname: '/**' },
      { protocol: 'https', hostname: 'res.cloudinary.com', pathname: '/**' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com', pathname: '/**' },
      { protocol: 'https', hostname: 'cdn.britannica.com', pathname: '/**' },
      { protocol: 'https', hostname: 'images.crowdspring.com', pathname: '/**' },
      { protocol: 'https', hostname: 'dashthis.com', pathname: '/**' },
      { protocol: 'https', hostname: 'formspal.com', pathname: '/**' },
      { protocol: 'https', hostname: 'legiit-service.s3.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: 'contentfuel.co', pathname: '/**' },
    ],
  },

  async redirects() {
    return [

      // Security headers (Fixing Screaming Frog warnings)
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },      { source: '/signin',      destination: '/login',  permanent: true },
      { source: '/sign-in',     destination: '/login',  permanent: true },
      { source: '/auth/signin', destination: '/login',  permanent: true },
      { source: '/register',    destination: '/signup', permanent: true },
    ]
  },

  async rewrites() {
    return [
      { source: '/icons/icon-192x192.png', destination: '/precise-govcon-logo.jpg' },
      { source: '/icon-192x192.png',       destination: '/precise-govcon-logo.jpg' },
      { source: '/favicon.ico',            destination: '/precise-govcon-logo.jpg' },
    ]
  },

  async headers() {
    return [
      // Auth/account/admin pages - noindex
      { source: '/login',              headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/signup',             headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/forgot-password',    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/reset-password',     headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/reset-request',      headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/verify-email',       headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/activate',           headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/account',            headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/account/:path*',     headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/checkout',           headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/pricing/checkout',   headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/admin/:path*',       headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      { source: '/dashboard/:path*',   headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },

      // URL parameter variants - noindex to prevent duplicate content
      {
        source: '/contact',
        has: [{ type: 'query', key: 'service' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/',
        has: [{ type: 'query', key: 'mode' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },
      {
        source: '/:path*',
        has: [{ type: 'query', key: 'callbackUrl' }],
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      },

      // Security headers on all routes
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',          value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',          value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy',       value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com https://js.stripe.com https://cdn.jsdelivr.net",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "connect-src 'self' https://api.sam.gov https://api.stripe.com https://accounts.google.com https://*.anthropic.com wss:",
              "frame-src https://js.stripe.com https://hooks.stripe.com https://accounts.google.com",
              "worker-src 'self' blob:",
            ].join('; '),
          },
        ],
      },

      // Cache rules
      { source: '/changelog',        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }] },
      { source: '/pricing/checkout', headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }] },
    ]
  },
}

export default nextConfig