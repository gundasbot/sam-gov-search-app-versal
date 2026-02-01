const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  const email = 'admin@preciseanalytics.ai'
  const newPassword = 'TempPass123!' // Change this to whatever you want
  
  console.log(`🔐 Setting password for: ${email}\n`)
  
  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, firstName: true, lastName: true }
  })
  
  if (!user) {
    console.log('❌ User not found. Creating new user...\n')
    
    // Create new user with password
    const hashedPassword = await bcrypt.hash(newPassword, 10)
    const now = new Date()
    const trialExpires = new Date(now)
    trialExpires.setDate(trialExpires.getDate() + 7)
    trialExpires.setHours(23, 59, 59, 999)
    
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin',
        plan: 'trial',
        planTier: 'trial',
        planStatus: 'trialing',
        trialActive: true,
        trialStartedAt: now,
        trialExpiresAt: trialExpires,
        trialEndsAt: trialExpires,
        emailVerified: true,
        name: 'Admin User',
      }
    })
    
    console.log('✅ User created successfully!')
    console.log(`   Email: ${newUser.email}`)
    console.log(`   passwordHash: ${newPassword}`)
    console.log(`   Role: ${newUser.role}`)
    console.log(`\n🎉 You can now sign in with these credentials!`)
    return
  }
  
  // User exists - update password
  console.log('✅ User found. Updating password...\n')
  
  const hashedPassword = await bcrypt.hash(newPassword, 10)
  
  await prisma.user.update({
    where: { email },
    data: {
      passwordHash: hashedPassword,
      emailVerified: true, // Ensure email is verified
    }
  })
  
  console.log('✅ Password updated successfully!')
  console.log(`   Email: ${email}`)
  console.log(`   passwordHash: ${newPassword}`)
  console.log(`   Name: ${user.firstName} ${user.lastName}`)
  console.log(`\n🎉 You can now sign in with these credentials!`)
}

main()
  .catch(error => {
    console.error('❌ Error:', error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())