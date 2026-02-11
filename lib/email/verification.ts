// lib/email/verification.ts

import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'
import { getVerificationEmailHtml, getVerificationEmailText } from '@/lib/email/verification-email'

import { randomBytes } from 'crypto'

export async function createVerificationToken(userId: string, email: string) {
  const token = crypto.randomBytes(32).toString('hex')
  const token_hash = crypto.createHash('sha256').update(token).digest('hex')
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  await prisma.email_verification_tokens.create({
    data: {
      id: randomBytes(12).toString('hex'),
      user_id: userId,
      token_hash,
      expires_at: expires,
    },
  })

  return token
}

export async function sendVerificationEmail(email: string, name: string, token: string) {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/verify-email?token=${token}`

  const html = getVerificationEmailHtml({
    first_name: name.split(' ')[0],
    verificationUrl,
  })

  const text = getVerificationEmailText({
    first_name: name.split(' ')[0],
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
  const token_hash = crypto.createHash('sha256').update(token).digest('hex')

  const verificationToken = await prisma.email_verification_tokens.findUnique({
    where: { token_hash },
  })

  if (!verificationToken) {
    return { success: false, error: 'Invalid verification token' }
  }

  if (new Date() > verificationToken.expires_at) {
    return { success: false, error: 'This verification link has expired' }
  }

  const user = await prisma.users.findUnique({
    where: { id: verificationToken.user_id },
  })

  if (!user) {
    return { success: false, error: 'User not found' }
  }

  await prisma.$transaction([
    prisma.users.update({
      where: { id: verificationToken.user_id },
      data: {
        email_verified: new Date(),
        is_active: true,
      },
    }),
    prisma.email_verification_tokens.delete({
      where: { token_hash },
    }),
  ])

  return {
    success: true,
    users: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  }
}