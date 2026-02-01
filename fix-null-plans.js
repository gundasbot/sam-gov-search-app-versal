const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Checking for users with NULL plan values...')
  
  // First, let's see how many users have NULL plans using raw SQL
  const usersWithNullPlan = await prisma.$queryRaw`
    SELECT id, email, plan 
    FROM users 
    WHERE plan IS NULL
  `
  
  console.log(`Found ${usersWithNullPlan.length} users with NULL plan:`)
  usersWithNullPlan.forEach(user => {
    console.log(`  - ${user.email} (ID: ${user.id})`)
  })
  
  if (usersWithNullPlan.length === 0) {
    console.log('✅ No users with NULL plan found. All good!')
    return
  }
  
  // Update all users with NULL plan to 'free' using raw SQL
  const result = await prisma.$executeRaw`
    UPDATE users 
    SET plan = 'free' 
    WHERE plan IS NULL
  `
  
  console.log(`✅ Updated ${result} users to have plan = 'free'`)
  
  // Verify the update
  const remainingNulls = await prisma.$queryRaw`
    SELECT COUNT(*) as count 
    FROM users 
    WHERE plan IS NULL
  `
  
  console.log(`✅ Verification: ${remainingNulls[0].count} users still have NULL plan (should be 0)`)
}

main()
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })