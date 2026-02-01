// lib/subscription-utils.ts - Centralized subscription logic

export type PlanTier = 'basic' | 'professional' | 'enterprise' | 'none'
export type BillingInterval = 'monthly' | 'annual'
export type SubscriptionStatus = 'active' | 'inactive' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'none'

export interface SubscriptionData {
  tier: PlanTier
  status: SubscriptionStatus
  billing: BillingInterval
  currentPeriodEnd?: string
  cancelAt?: string
  cancelAtPeriodEnd?: boolean
  scheduledChange?: {
    newPlan: string
    effectiveAt: string
  }
}

/**
 * Normalize subscription status from various sources
 */
export function normalizeStatus(status: string | null | undefined): SubscriptionStatus {
  const s = String(status || '').toLowerCase().trim()
  
  // Stripe status mappings
  if (s === 'active' || s === 'trialing') return 'active'
  if (s === 'past_due') return 'past_due'
  if (s === 'canceled' || s === 'cancelled') return 'canceled'
  if (s === 'incomplete' || s === 'incomplete_expired') return 'incomplete'
  if (s === 'unpaid' || s === 'inactive') return 'inactive'
  
  return 'none'
}

/**
 * Normalize plan tier from various sources
 */
export function normalizeTier(tier: string | null | undefined): PlanTier {
  const t = String(tier || '').toLowerCase().trim()
  
  if (t === 'basic' || t === 'BASIC') return 'basic'
  if (t === 'professional' || t === 'PROFESSIONAL' || t === 'pro') return 'professional'
  if (t === 'enterprise' || t === 'ENTERPRISE') return 'enterprise'
  
  return 'none'
}

/**
 * Check if subscription is actually active (includes trialing)
 */
export function isSubscriptionActive(status: SubscriptionStatus): boolean {
  return status === 'active' || status === 'trialing'
}

/**
 * Check if subscription allows access to features
 */
export function hasActiveAccess(subscription: Partial<SubscriptionData>): boolean {
  const status = normalizeStatus(subscription.status)
  const tier = normalizeTier(subscription.tier)
  
  return isSubscriptionActive(status) && tier !== 'none'
}

/**
 * Get display-friendly status label
 */
export function getStatusLabel(status: SubscriptionStatus): string {
  const labels: Record<SubscriptionStatus, string> = {
    active: 'Active',
    trialing: 'Trial Active',
    past_due: 'Payment Due',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    inactive: 'Inactive',
    none: 'No Plan',
  }
  
  return labels[status] || 'Unknown'
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: SubscriptionStatus): {
  bg: string
  text: string
  border: string
  dot: string
} {
  const colors = {
    active: {
      bg: 'bg-emerald-500/20',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
      dot: 'bg-emerald-400',
    },
    trialing: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
      dot: 'bg-blue-400',
    },
    past_due: {
      bg: 'bg-amber-500/20',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
      dot: 'bg-amber-400',
    },
    canceled: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
      dot: 'bg-red-400',
    },
    incomplete: {
      bg: 'bg-purple-500/20',
      text: 'text-purple-400',
      border: 'border-purple-500/30',
      dot: 'bg-purple-400',
    },
    inactive: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      dot: 'bg-slate-400',
    },
    none: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
      dot: 'bg-slate-400',
    },
  }
  
  return colors[status] || colors.none
}

/**
 * Plan pricing configuration
 */
export const PLAN_PRICES = {
  basic: { monthly: 24.99, annual: 249.99 },
  professional: { monthly: 49.99, annual: 499.99 },
  enterprise: { monthly: 199.99, annual: 1999.99 },
  none: { monthly: 0, annual: 0 },
}

/**
 * Calculate if plan change is an upgrade
 */
export function isUpgrade(currentTier: PlanTier, newTier: PlanTier): boolean {
  const tierOrder: Record<PlanTier, number> = {
    none: 0,
    basic: 1,
    professional: 2,
    enterprise: 3,
  }
  
  return tierOrder[newTier] > tierOrder[currentTier]
}

/**
 * Calculate if plan change is a downgrade
 */
export function isDowngrade(currentTier: PlanTier, newTier: PlanTier): boolean {
  const tierOrder: Record<PlanTier, number> = {
    none: 0,
    basic: 1,
    professional: 2,
    enterprise: 3,
  }
  
  return tierOrder[newTier] < tierOrder[currentTier] && tierOrder[newTier] > 0
}

/**
 * Get price for plan and billing
 */
export function getPlanPrice(tier: PlanTier, billing: BillingInterval): number {
  return PLAN_PRICES[tier][billing]
}

/**
 * Calculate annual savings percentage
 */
export function getAnnualSavingsPercent(tier: PlanTier): number {
  const monthly = PLAN_PRICES[tier].monthly * 12
  const annual = PLAN_PRICES[tier].annual
  return Math.round(((monthly - annual) / monthly) * 100)
}

/**
 * Parse subscription data from API response
 */
export function parseSubscriptionData(data: any): SubscriptionData {
  return {
    tier: normalizeTier(data?.tier),
    status: normalizeStatus(data?.status),
    billing: (data?.billing === 'annual' ? 'annual' : 'monthly') as BillingInterval,
    currentPeriodEnd: data?.currentPeriodEnd,
    cancelAt: data?.cancelAt,
    cancelAtPeriodEnd: data?.cancelAtPeriodEnd,
    scheduledChange: data?.scheduledChange,
  }
}