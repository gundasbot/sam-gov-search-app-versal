/**
 * Greeting utilities for personalized user salutations
 */

export function getTimeOfDayGreeting(): string {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return 'Good morning'
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon'
  } else if (hour >= 17 && hour < 21) {
    return 'Good evening'
  } else {
    return 'Good night'
  }
}

export function getFirstName(fullName?: string | null): string {
  if (!fullName) return 'there'
  const name = fullName.trim()
  if (!name) return 'there'

  // Handle email-based names (user@example.com → user)
  if (name.includes('@')) {
    return name.split('@')[0]
  }

  // Get first word of full name
  const parts = name.split(' ')
  return parts[0] || 'there'
}

export function getPersonalizedGreeting(userName?: string | null): string {
  const timeGreeting = getTimeOfDayGreeting()
  const firstName = getFirstName(userName)
  return `${timeGreeting}, ${firstName}`
}

/**
 * Get emoji based on time of day
 */
export function getTimeOfDayEmoji(): string {
  const hour = new Date().getHours()

  if (hour >= 5 && hour < 12) {
    return '🌅'
  } else if (hour >= 12 && hour < 17) {
    return '☀️'
  } else if (hour >= 17 && hour < 21) {
    return '🌆'
  } else {
    return '🌙'
  }
}
