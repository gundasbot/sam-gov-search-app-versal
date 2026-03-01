// lib/admin.ts
import { prisma } from './prisma'

/**
 * Check if a user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: { role: true }
    })
    
    return user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if a user is an admin by email
 */
export async function isEmailAdmin(email: string): Promise<boolean> {
  try {
    const user = await prisma.users.findUnique({
      where: { email: email.toLowerCase() },
      select: { role: true }
    })
    
    return user?.role === 'admin'
  } catch (error) {
    console.error('Error checking admin status:', error)
    return false
  }
}

/**
 * Check if user has access (either admin or has active subscription)
 */
export async function hasAccess(userId: string): Promise<boolean> {
  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        role: true,
        stripe_subscription_id: true,
        stripe_current_period_end: true
      }
    })
    
    if (!user) return false
    
    // Admins always have access
    if (user.role === 'admin') return true
    
    // Check subscription status
    if (user.stripe_subscription_id && user.stripe_current_period_end) {
      const isActive = new Date(user.stripe_current_period_end) > new Date()
      return isActive
    }
    
    return false
  } catch (error) {
    console.error('Error checking access:', error)
    return false
  }
}
