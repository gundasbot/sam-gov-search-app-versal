const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Dropping database views that block schema changes...\n')
  
  try {
    // Drop the user_display_info view
    await prisma.$executeRaw`DROP VIEW IF EXISTS user_display_info CASCADE`
    console.log('✅ Dropped view: user_display_info')
    
    // Check for any other views
    const views = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public'
    `
    
    if (views.length > 0) {
      console.log('\n📋 Remaining views in database:')
      for (const view of views) {
        console.log(`  - ${view.table_name}`)
        await prisma.$executeRaw`DROP VIEW IF EXISTS ${view.table_name} CASCADE`
        console.log(`  ✅ Dropped: ${view.table_name}`)
      }
    } else {
      console.log('\n✅ No other views found')
    }
    
    console.log('\n✅ All blocking views removed! You can now run: npx prisma db push')
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())