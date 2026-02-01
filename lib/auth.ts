// lib/auth.ts
import { compare, hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export type User = {
  id: string
  name: string | null
  email: string
  passwordHash: string | null
  role: string | null
  firstName: string | null
  lastName: string | null
  phone: string | null
  company: string | null
  plan: string | null
  trialEndsAt: Date | null
  image: string | null
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  passwordHash: true,
  role: true,
  firstName: true,
  lastName: true,
  phone: true,
  company: true,
  plan: true,
  trialEndsAt: true,
  image: true,
} as const

export async function findUserByEmail(email: string): Promise<User | null> {
  const e = email.toLowerCase().trim()
  if (!e) return null

  const user = await prisma.user.findUnique({
    where: { email: e },
    select: userSelect,
  })

  return user
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export async function createUser(userData: {
  email: string
  firstName: string
  lastName: string
  password: string
  phone?: string
  company?: string
}): Promise<User> {
  const { email, firstName, lastName, password, phone, company } = userData

  const e = email.toLowerCase().trim()
  if (!e) throw new Error('Email is required')

  const existingUser = await findUserByEmail(e)
  if (existingUser) throw new Error('User with this email already exists')

  const passwordHash = await hash(password, 12)

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 7)

  const user = await prisma.user.create({
    data: {
      email: e,
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      passwordHash: passwordHash,
      phone: phone || null,
      company: company || null,
      plan: 'trial',
      trialEndsAt,
      role: 'user',
    },
    select: userSelect,
  })

  return user
}

export async function createGoogleUser(googleData: {
  email: string
  name: string
  googleId: string
  profileImage?: string
}): Promise<User> {
  const { email, name, googleId, profileImage } = googleData

  const e = email.toLowerCase().trim()
  if (!e) throw new Error('Email is required')

  const parts = (name || '').trim().split(/\s+/).filter(Boolean)
  const firstName = parts[0] || null
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : null

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 7)

  const user = await prisma.user.create({
    data: {
      email: e,
      firstName,
      lastName,
      name: name || null,
      image: profileImage || null,
      plan: 'trial',
      trialEndsAt,
      role: 'user',
      accounts: {
        create: {
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleId,
        },
      },
    },
    select: userSelect,
  })

  return user
}

export async function linkGoogleAccount(
  email: string,
  googleId: string,
  profileImage?: string
): Promise<void> {
  const user = await findUserByEmail(email)
  if (!user) return

  const existingAccount = await prisma.account.findUnique({
    where: {
      provider_providerAccountId: {
        provider: 'google',
        providerAccountId: googleId,
      },
    },
    select: { id: true },
  })

  if (!existingAccount) {
    await prisma.account.create({
      data: {
        userId: user.id,
        type: 'oauth',
        provider: 'google',
        providerAccountId: googleId,
      },
    })
  }

  if (profileImage && !user.image) {
    await prisma.user.update({
      where: { id: user.id },
      data: { image: profileImage },
      select: { id: true },
    })
  }
}

export async function isTrialActive(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialEndsAt: true },
  })

  if (!user?.trialEndsAt) return false
  return new Date(user.trialEndsAt) > new Date()
}

export async function getTrialDaysRemaining(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { trialEndsAt: true },
  })

  if (!user?.trialEndsAt) return 0

  const end = new Date(user.trialEndsAt).getTime()
  const now = Date.now()
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

// Re-export NextAuth configuration so route handlers can import from '@/lib/auth'
export { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
