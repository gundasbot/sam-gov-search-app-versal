// Run this script to check the saved search in your database
// Usage: npx tsx scripts/check-saved-search.ts

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSavedSearch() {
  const searchId = 'cmla45pvq0003qwjmnyj1zibn'
  const userId = 'cml7ew80a0000nqn74nwahj4m'

  console.log('🔍 Checking saved search:', searchId)
  console.log('👤 Expected user ID:', userId)
  console.log('---')

  // Check if the search exists at all
  const search = await prisma.savedSearch.findUnique({
    where: { id: searchId },
    include: { user: true }
  })

  if (!search) {
    console.log('❌ Search NOT FOUND in database')
    console.log('\nLet\'s check all saved searches for this user:')
    
    const userSearches = await prisma.savedSearch.findMany({
      where: { userId: userId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        isSubscription: true
      }
    })
    
    console.log(`Found ${userSearches.length} saved searches for this user:`)
    userSearches.forEach(s => {
      console.log(`  - ${s.name} (${s.id}) - ${s.isSubscription ? 'Subscription' : 'Saved'} - Created: ${s.createdAt}`)
    })
  } else {
    console.log('✅ Search FOUND')
    console.log('📋 Details:')
    console.log('  - Name:', search.name)
    console.log('  - User ID:', search.userId)
    console.log('  - User Email:', search.user.email)
    console.log('  - Is Subscription:', search.isSubscription)
    console.log('  - Created:', search.createdAt)
    
    if (search.userId !== userId) {
      console.log('\n⚠️  USER ID MISMATCH!')
      console.log('  Expected:', userId)
      console.log('  Actual:', search.userId)
    } else {
      console.log('\n✅ User ID matches!')
    }
  }

  await prisma.$disconnect()
}

checkSavedSearch().catch(console.error)