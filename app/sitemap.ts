import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.precisegovcon.com'

  const currentDate = new Date()

  // High priority - core marketing & conversion pages
  const highPriorityPages = [
    '/',
    '/contact',
    '/pricing',
    '/services',
    '/features',
    '/about',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 1.0,
  }))

  // Service pages - high value for SEO
  const servicePages = [
    '/services/sam-registration',
    '/services/proposal-writing',
    '/services/bid-no-bid-review',
    '/services/capability-statements',
    '/services/set-aside-certifications',
    '/services/compliance',
    '/services/bid-search',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: currentDate,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }))

  // Info / legal pages
  const infoPages = [
    '/privacy',
    '/terms',
    '/security',
    '/accessibility',
    '/help',
    '/support',
    '/docs',
    '/status',
    '/changelog',
    '/insights',
    '/opportunities',
  ].map((path) => ({
    url: `${baseUrl}${path}`,
    lastModified: currentDate,
    changeFrequency: 'monthly' as const,
    priority: 0.4,
  }))

  return [
    ...highPriorityPages,
    ...servicePages,
    ...infoPages,
  ]
}
