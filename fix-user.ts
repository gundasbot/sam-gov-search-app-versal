// fix-user.ts - Run this to fix contact@preciseanalytics.io account
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Fixing contact@preciseanalytics.io account...')

  // First, check current state
  const before = await prisma.user.findUnique({
    where: { email: 'contact@preciseanalytics.io' },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      trialActive: true,
      trialEndsAt: true,
      planStatus: true,
      planTier: true,
    },
  })

  console.log('📊 Before update:', JSON.stringify(before, null, 2))

  if (!before) {
    console.error('❌ User not found!')
    return
  }

  // Update the user
  const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const updated = await prisma.user.update({
    where: { email: 'contact@preciseanalytics.io' },
    data: {
      emailVerified: new Date(),
      trialActive: true,
      trialStartedAt: new Date(),
      trialEndsAt: trialEndsAt,
      trialExpiresAt: trialEndsAt,
      planStatus: 'active',
      planTier: 'trial',
      subscriptionStatus: 'active',
      subscriptionTier: 'trial',
      updatedAt: new Date(),
    },
  })

  console.log('✅ After update:', JSON.stringify({
    id: updated.id,
    email: updated.email,
    emailVerified: updated.emailVerified,
    trialActive: updated.trialActive,
    trialEndsAt: updated.trialEndsAt,
    planStatus: updated.planStatus,
  }, null, 2))

  console.log('🎉 User account fixed! You can now sign in.')
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })