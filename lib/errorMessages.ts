// lib/errorMessages.ts
// Helper function to convert technical errors into user-friendly messages

export interface UserFriendlyError {
  title: string
  message: string
  details?: string
  showUpgradeButton?: boolean
  showRetryButton?: boolean
}

export function getErrorMessage(error: any, context: 'search' | 'export' | 'save' | 'general' = 'general'): UserFriendlyError {
  const errorMessage = error?.message || String(error)
  const errorStatus = error?.status || 0

  // Payment Required (402)
  if (errorStatus === 402 || errorMessage.includes('trial has ended') || errorMessage.includes('upgrade')) {
    return {
      title: 'Subscription Required',
      message: 'Your free trial has ended. To continue searching federal opportunities, please upgrade to a paid plan.',
      showUpgradeButton: true,
      showRetryButton: false,
    }
  }

  // Unauthorized (401)
  if (errorStatus === 401 || errorMessage.includes('unauthorized') || errorMessage.includes('not authenticated')) {
    return {
      title: 'Sign In Required',
      message: 'Please sign in to access this feature.',
      showUpgradeButton: false,
      showRetryButton: false,
    }
  }

  // Network/Timeout Errors
  if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('fetch')) {
    return {
      title: 'Connection Issue',
      message: "We're having trouble connecting to our servers. Please check your internet connection and try again.",
      showRetryButton: true,
      showUpgradeButton: false,
    }
  }

  // Rate Limiting (429)
  if (errorStatus === 429 || errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return {
      title: 'Too Many Requests',
      message: "You've made too many requests. Please wait a moment and try again.",
      showRetryButton: true,
      showUpgradeButton: false,
    }
  }

  // Server Errors (500s)
  if (errorStatus >= 500 || errorMessage.includes('server error') || errorMessage.includes('internal error')) {
    return {
      title: 'Server Issue',
      message: "We're experiencing technical difficulties. Our team has been notified. Please try again in a few minutes.",
      showRetryButton: true,
      showUpgradeButton: false,
    }
  }

  // Invalid Date Range
  if (errorMessage.includes('date') && errorMessage.includes('invalid')) {
    return {
      title: 'Invalid Date Range',
      message: 'The date range you selected is invalid. Please make sure the "Posted After" date is before the "Posted Before" date.',
      showRetryButton: false,
      showUpgradeButton: false,
    }
  }

  // No Results
  if (errorMessage.includes('no results') || errorMessage.includes('not found')) {
    return {
      title: 'No Results Found',
      message: 'No opportunities match your search criteria. Try adjusting your filters or expanding your date range.',
      showRetryButton: false,
      showUpgradeButton: false,
    }
  }

  // Context-specific messages
  switch (context) {
    case 'search':
      return {
        title: 'Search Failed',
        message: 'We encountered an error while searching for opportunities. Please try again.',
        details: errorMessage,
        showRetryButton: true,
        showUpgradeButton: false,
      }

    case 'export':
      return {
        title: 'Export Failed',
        message: "We couldn't export your search results. Please try again.",
        details: errorMessage,
        showRetryButton: true,
        showUpgradeButton: false,
      }

    case 'save':
      return {
        title: 'Save Failed',
        message: "We couldn't save your search. Please try again.",
        details: errorMessage,
        showRetryButton: true,
        showUpgradeButton: false,
      }

    default:
      return {
        title: 'Something Went Wrong',
        message: 'An unexpected error occurred. Please try again.',
        details: errorMessage,
        showRetryButton: true,
        showUpgradeButton: false,
      }
  }
}

// Specific error messages for common scenarios
export const ERROR_MESSAGES = {
  SUBSCRIPTION_REQUIRED: {
    title: 'Subscription Required',
    message: 'This feature requires an active subscription. Upgrade your plan to continue.',
    showUpgradeButton: true,
  },
  
  TRIAL_ENDED: {
    title: 'Free Trial Ended',
    message: 'Your 7-day free trial has ended. Upgrade to a paid plan to continue accessing premium features.',
    showUpgradeButton: true,
  },

  NETWORK_ERROR: {
    title: 'Connection Problem',
    message: 'Unable to connect to the server. Please check your internet connection and try again.',
    showRetryButton: true,
  },

  INVALID_SEARCH: {
    title: 'Invalid Search',
    message: 'Please check your search criteria and try again.',
    showRetryButton: false,
  },

  SERVER_ERROR: {
    title: 'Server Error',
    message: 'Our servers are experiencing issues. Please try again in a few moments.',
    showRetryButton: true,
  },

  UNAUTHORIZED: {
    title: 'Sign In Required',
    message: 'Please sign in to continue.',
    showUpgradeButton: false,
  },
}
