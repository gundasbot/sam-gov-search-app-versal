// lib/plan-features.ts

export type PlanTier = 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'

export interface PlanFeatures {
  // Search & Discovery
  unlimitedSearches: boolean
  advancedFilters: boolean
  savedSearches: number
  searchHistory: number // days
  
  // Alerts & Notifications
  emailAlerts: boolean
  realTimeAlerts: boolean
  customAlerts: number
  alertFrequency: 'daily' | 'realtime' | 'custom'
  
  // Export & Data
  exportCSV: boolean
  exportExcel: boolean
  exportJSON: boolean
  exportPDF: boolean
  
  // Analytics
  basicAnalytics: boolean
  advancedAnalytics: boolean
  competitorTracking: boolean
  historicalData: number // years
  
  // API Access
  apiAccess: boolean
  apiCallsPerMonth: number
  
  // Team & Collaboration
  teamMembers: number
  sharedWorkspaces: boolean
  roleBasedAccess: boolean
  
  // Support
  emailSupport: boolean
  prioritySupport: boolean
  phoneSupport: boolean
  dedicatedAccountManager: boolean
  customTraining: boolean
  
  // Advanced Features
  whitelabelReporting: boolean
  customIntegrations: boolean
  slaGuarantee: boolean
  uptime: string
}

export const PLAN_FEATURES: Record<PlanTier, PlanFeatures> = {
  FREE: {
    // Search & Discovery
    unlimitedSearches: false,
    advancedFilters: true,
    savedSearches: 5,
    searchHistory: 7,
    
    // Alerts & Notifications
    emailAlerts: false,
    realTimeAlerts: false,
    customAlerts: 0,
    alertFrequency: 'daily',
    
    // Export & Data
    exportCSV: false,
    exportExcel: false,
    exportJSON: false,
    exportPDF: false,
    
    // Analytics
    basicAnalytics: true,
    advancedAnalytics: false,
    competitorTracking: false,
    historicalData: 0,
    
    // API Access
    apiAccess: false,
    apiCallsPerMonth: 0,
    
    // Team & Collaboration
    teamMembers: 1,
    sharedWorkspaces: false,
    roleBasedAccess: false,
    
    // Support
    emailSupport: true,
    prioritySupport: false,
    phoneSupport: false,
    dedicatedAccountManager: false,
    customTraining: false,
    
    // Advanced Features
    whitelabelReporting: false,
    customIntegrations: false,
    slaGuarantee: false,
    uptime: '95%',
  },
  
  BASIC: {
    // Search & Discovery
    unlimitedSearches: true,
    advancedFilters: true,
    savedSearches: 25,
    searchHistory: 30,
    
    // Alerts & Notifications
    emailAlerts: true,
    realTimeAlerts: false,
    customAlerts: 5,
    alertFrequency: 'daily',
    
    // Export & Data
    exportCSV: true,
    exportExcel: false,
    exportJSON: true,
    exportPDF: false,
    
    // Analytics
    basicAnalytics: true,
    advancedAnalytics: false,
    competitorTracking: false,
    historicalData: 0,
    
    // API Access
    apiAccess: false,
    apiCallsPerMonth: 0,
    
    // Team & Collaboration
    teamMembers: 1,
    sharedWorkspaces: false,
    roleBasedAccess: false,
    
    // Support
    emailSupport: true,
    prioritySupport: false,
    phoneSupport: false,
    dedicatedAccountManager: false,
    customTraining: false,
    
    // Advanced Features
    whitelabelReporting: false,
    customIntegrations: false,
    slaGuarantee: false,
    uptime: '99%',
  },
  
  PROFESSIONAL: {
    // Search & Discovery
    unlimitedSearches: true,
    advancedFilters: true,
    savedSearches: 100,
    searchHistory: 365,
    
    // Alerts & Notifications
    emailAlerts: true,
    realTimeAlerts: true,
    customAlerts: 25,
    alertFrequency: 'realtime',
    
    // Export & Data
    exportCSV: true,
    exportExcel: true,
    exportJSON: true,
    exportPDF: true,
    
    // Analytics
    basicAnalytics: true,
    advancedAnalytics: true,
    competitorTracking: true,
    historicalData: 1,
    
    // API Access
    apiAccess: true,
    apiCallsPerMonth: 1000,
    
    // Team & Collaboration
    teamMembers: 3,
    sharedWorkspaces: true,
    roleBasedAccess: true,
    
    // Support
    emailSupport: true,
    prioritySupport: true,
    phoneSupport: false,
    dedicatedAccountManager: false,
    customTraining: false,
    
    // Advanced Features
    whitelabelReporting: false,
    customIntegrations: false,
    slaGuarantee: false,
    uptime: '99.5%',
  },
  
  ENTERPRISE: {
    // Search & Discovery
    unlimitedSearches: true,
    advancedFilters: true,
    savedSearches: -1, // unlimited
    searchHistory: 1825, // 5 years
    
    // Alerts & Notifications
    emailAlerts: true,
    realTimeAlerts: true,
    customAlerts: -1, // unlimited
    alertFrequency: 'custom',
    
    // Export & Data
    exportCSV: true,
    exportExcel: true,
    exportJSON: true,
    exportPDF: true,
    
    // Analytics
    basicAnalytics: true,
    advancedAnalytics: true,
    competitorTracking: true,
    historicalData: 5,
    
    // API Access
    apiAccess: true,
    apiCallsPerMonth: -1, // unlimited
    
    // Team & Collaboration
    teamMembers: -1, // unlimited
    sharedWorkspaces: true,
    roleBasedAccess: true,
    
    // Support
    emailSupport: true,
    prioritySupport: true,
    phoneSupport: true,
    dedicatedAccountManager: true,
    customTraining: true,
    
    // Advanced Features
    whitelabelReporting: true,
    customIntegrations: true,
    slaGuarantee: true,
    uptime: '99.9%',
  },
}

// Helper function to check if user has access to a feature
export function hasFeatureAccess(
  userTier: PlanTier | null | undefined,
  feature: keyof PlanFeatures
): boolean {
  if (!userTier) return PLAN_FEATURES.FREE[feature] as boolean
  return PLAN_FEATURES[userTier][feature] as boolean
}

// Helper function to get feature limit
export function getFeatureLimit(
  userTier: PlanTier | null | undefined,
  feature: keyof PlanFeatures
): number {
  if (!userTier) return PLAN_FEATURES.FREE[feature] as number
  return PLAN_FEATURES[userTier][feature] as number
}

// Helper to check if user can perform action based on usage
export function canPerformAction(
  userTier: PlanTier | null | undefined,
  feature: keyof PlanFeatures,
  currentUsage: number
): boolean {
  const limit = getFeatureLimit(userTier, feature)
  if (limit === -1) return true // unlimited
  return currentUsage < limit
}
