// lib/email/verification.ts

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { getVerificationEmailHtml, getVerificationEmailText } from '@/lib/email/verification-email'

export async function createVerificationToken(userId: string, email: string) {
  const token = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.emailVerificationToken.create({
    data: {
      userId,
      tokenHash,
      expiresAt: expires,
    },
  })

  return token
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`

  const html = getVerificationEmailHtml({
    firstName: name.split(' ')[0],
    verificationUrl,
  })

  const text = getVerificationEmailText({
    firstName: name.split(' ')[0],
    verificationUrl,
  })

  await sendEmail({
    to: email,
    subject: 'Verify Your Email - Precise GovCon',
    html,
    text,
  })
}

export async function verifyEmailToken(token: string) {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

  const verificationToken = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  })

  if (!verificationToken) {
    return { success: false, error: 'Invalid verification token' }
  }

  if (new Date() > verificationToken.expiresAt) {
    return { success: false, error: 'This verification link has expired' }
  }

  const user = await prisma.user.findUnique({
    where: { id: verificationToken.userId },
  })

  if (!user) {
    return { success: false, error: 'User not found' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: new Date(),
        isActive: true,
      },
    }),
    prisma.emailVerificationToken.delete({
      where: { tokenHash },
    }),
  ])

  return {
    success: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  }
}
