// scripts/test-password-reset.ts
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testPasswordReset() {
  const testEmail = 'test@example.com'
  
  // 1. Create a test user
  await prisma.user.upsert({
    where: { email: testEmail },
    update: {},
    create: {
      email: testEmail,
      name: 'Test User',
      passwordHash: await bcrypt.hash('oldpassword123', 12),
    }
  })

  // 2. Create a reset token
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expires = new Date(Date.now() + 3600000)
  
  await prisma.verificationToken.create({
    data: {
      identifier: `password-reset:${testEmail}`,
      token: tokenHash,
      expires,
    }
  })

  console.log('✅ Test user and token created')
  console.log(`📧 Email: ${testEmail}`)
  console.log(`🔗 Token: ${token}`)
  console.log(`🔗 Reset URL: http://localhost:3000/reset-password?token=${token}`)
}

testPasswordReset()
  .catch(console.error)
  .finally(() => prisma.$disconnect())