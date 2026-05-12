// Recommended Pricing Strategy for Precise GovCon
// Based on government contracting SaaS market research

export const PRICING_PLANS = {
  // Free Trial - 7 Days
  TRIAL: {
    name: 'Free Trial',
    duration: '7 days',
    price: 0,
    features: [
      'Access to SAM.gov opportunity search',
      'Up to 25 searches per day',
      'Basic filtering (NAICS, agency, set-aside)',
      'Save up to 10 opportunities',
      'Email support',
    ],
    limitations: [
      'No real-time alerts',
      'No advanced analytics',
      'Limited search history',
    ],
  },

  // Basic Plan - $49/month or $490/year (save $98)
  BASIC: {
    name: 'Basic',
    monthlyPrice: 49,
    annualPrice: 490, // 2 months free
    stripePriceIdMonthly: process.env.STRIPE_PRICE_BASIC_MONTHLY!,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_BASIC_ANNUAL!,
    features: [
      'Unlimited opportunity searches',
      'Advanced filtering (all criteria)',
      'Save unlimited opportunities',
      'Basic email alerts (daily digest)',
      'Search history (30 days)',
      'Export to CSV',
      'Email support',
    ],
    idealFor: 'Small contractors and consultants',
    limits: {
      activeAlerts: 5,
      savedOpportunities: 'unlimited',
      searches: 'unlimited',
      exports: 'unlimited',
      seats: 1,
    },
  },

  // Professional Plan - $149/month or $1,490/year (save $298)
  PROFESSIONAL: {
    name: 'Professional',
    monthlyPrice: 149,
    annualPrice: 1490, // 2 months free
    stripePriceIdMonthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!,
    stripePriceIdAnnual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL!,
    features: [
      'Everything in Basic, plus:',
      'Real-time opportunity alerts',
      'Advanced analytics dashboard',
      'Competitor tracking',
      'Custom alert criteria',
      'Priority email alerts',
      'Search history (1 year)',
      'API access (1,000 calls/month)',
      'Export to Excel with formatting',
      'Priority support (24-hour response)',
      'Team collaboration (up to 3 users)',
    ],
    idealFor: 'Growing businesses and small teams',
    limits: {
      activeAlerts: 25,
      seats: 3,
      apiCalls: 1000,
      searches: 'unlimited',
      exports: 'unlimited',
    },
    mostPopular: true,
  },

  // Enterprise Plan - Custom pricing (starts at $499/month)
  ENTERPRISE: {
    name: 'Enterprise',
    startingPrice: 499,
    contactSales: true,
    features: [
      'Everything in Professional, plus:',
      'Unlimited team members',
      'Dedicated account manager',
      'Custom integrations',
      'Advanced API access (unlimited)',
      'White-label reporting',
      'Custom training sessions',
      'SLA guarantees (99.9% uptime)',
      'Phone & priority support',
      'Custom data exports',
      'Historical data access (5+ years)',
      'Multi-office/subsidiary support',
    ],
    idealFor: 'Large contractors and prime contractors',
    limits: {
      activeAlerts: 'unlimited',
      seats: 10,
      apiCalls: 'unlimited',
      searches: 'unlimited',
      exports: 'unlimited',
    },
  },
}

// Feature comparison matrix for pricing page
export const FEATURE_COMPARISON = [
  {
    category: 'Search & Discovery',
    features: [
      { name: 'SAM.gov opportunity search', trial: true, basic: true, professional: true, enterprise: true },
      { name: 'Daily searches', trial: '25', basic: 'Unlimited', professional: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Advanced filtering', trial: false, basic: true, professional: true, enterprise: true },
      { name: 'Search history', trial: false, basic: '30 days', professional: '1 year', enterprise: '5+ years' },
    ],
  },
  {
    category: 'Alerts & Notifications',
    features: [
      { name: 'Email alerts', trial: false, basic: 'Daily digest', professional: 'Real-time', enterprise: 'Real-time + SMS' },
      { name: 'Active alert criteria', trial: 0, basic: '5', professional: '25', enterprise: 'Unlimited' },
      { name: 'Custom alert logic', trial: false, basic: false, professional: true, enterprise: true },
    ],
  },
  {
    category: 'Organization & Tracking',
    features: [
      { name: 'Save opportunities', trial: '10', basic: 'Unlimited', professional: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Deadline tracking', trial: false, basic: true, professional: true, enterprise: true },
      { name: 'Team seats', trial: false, basic: '1 seat', professional: '3 seats', enterprise: '10 seats' },
    ],
  },
  {
    category: 'Analytics & Insights',
    features: [
      { name: 'Basic analytics', trial: false, basic: true, professional: true, enterprise: true },
      { name: 'Advanced analytics', trial: false, basic: false, professional: true, enterprise: true },
      { name: 'Competitor tracking', trial: false, basic: false, professional: true, enterprise: true },
      { name: 'Custom reports', trial: false, basic: false, professional: false, enterprise: true },
    ],
  },
  {
    category: 'Integrations & API',
    features: [
      { name: 'CSV export', trial: false, basic: true, professional: true, enterprise: true },
      { name: 'Excel export', trial: false, basic: false, professional: true, enterprise: true },
      { name: 'API access', trial: false, basic: false, professional: '1,000/mo', enterprise: 'Unlimited' },
      { name: 'Custom integrations', trial: false, basic: false, professional: false, enterprise: true },
    ],
  },
  {
    category: 'Support',
    features: [
      { name: 'Email support', trial: true, basic: true, professional: 'Priority', enterprise: 'Dedicated' },
      { name: 'Response time', trial: '48 hours', basic: '24 hours', professional: '24 hours', enterprise: '4 hours' },
      { name: 'Phone support', trial: false, basic: false, professional: false, enterprise: true },
      { name: 'Dedicated account manager', trial: false, basic: false, professional: false, enterprise: true },
    ],
  },
]

// Add-ons (optional revenue boost)
export const ADD_ONS = {
  EXTRA_USERS: {
    name: 'Additional Team Members',
    price: 25, // per user/month
    availableFor: ['PROFESSIONAL'],
  },
  EXTRA_API_CALLS: {
    name: 'Extended API Access',
    price: 50, // per 10,000 calls/month
    availableFor: ['PROFESSIONAL'],
  },
  PRIORITY_SUPPORT: {
    name: 'Priority Support Upgrade',
    price: 99, // per month
    availableFor: ['BASIC'],
  },
}
