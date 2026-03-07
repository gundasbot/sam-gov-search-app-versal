// lib/auth.ts
import { compare, hash } from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

function generateId(): string {
  return randomBytes(16).toString('hex')
}

export type User = {
  id: string
  name: string | null
  email: string
  password_hash: string | null
  role: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  company: string | null
  plan: string | null
  trial_ends_at: Date | null
  image: string | null
}

const userSelect = {
  id: true,
  name: true,
  email: true,
  password_hash: true,
  role: true,
  first_name: true,
  last_name: true,
  phone: true,
  company: true,
  plan: true,
  trial_ends_at: true,
  image: true,
} as const

export async function findUserByEmail(email: string): Promise<User | null> {
  const e = email.toLowerCase().trim()
  if (!e) return null

  const user = await prisma.users.findUnique({
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
  first_name: string
  last_name: string
  password: string
  phone?: string
  company?: string
}): Promise<User> {
  const { email, first_name, last_name, password, phone, company } = userData

  const e = email.toLowerCase().trim()
  if (!e) throw new Error('Email is required')

  const existingUser = await findUserByEmail(e)
  if (existingUser) throw new Error('User with this email already exists')

  const passwordHash = await hash(password, 12)

  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 7)

  const user = await prisma.users.create({
    data: {
      id: generateId(),
      email: e,
      first_name,
      last_name,
      name: `${first_name} ${last_name}`.trim(),
      password_hash: passwordHash,
      phone: phone || null,
      company: company || null,
      plan: 'trial',
      trial_ends_at: trialEndsAt,
      role: 'user',
      updated_at: new Date(),
      created_at: new Date(),
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

  const user = await prisma.users.create({
    data: {
      id: generateId(),
      email: e,
      first_name: firstName,
      last_name: lastName,
      name: name || null,
      image: profileImage || null,
      plan: 'trial',
      trial_ends_at: trialEndsAt,
      role: 'user',
      updated_at: new Date(),
      created_at: new Date(),
    },
    select: userSelect,
  })

  // Create account record
  await prisma.accounts.create({
    data: {
      id: generateId(),
      user_id: user.id,
      type: 'oauth',
      provider: 'google',
      provider_account_id: googleId,
    },
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

  const existingAccount = await prisma.accounts.findUnique({
    where: {
      provider_provider_account_id: {
        provider: 'google',
        provider_account_id: googleId,
      },
    },
    select: { id: true },
  })

  if (!existingAccount) {
    await prisma.accounts.create({
      data: {
        id: generateId(),
        user_id: user.id,
        type: 'oauth',
        provider: 'google',
        provider_account_id: googleId,
      },
    })
  }

  if (profileImage && !user.image) {
    await prisma.users.update({
      where: { id: user.id },
      data: { image: profileImage, updated_at: new Date() },
      select: { id: true },
    })
  }
}

export async function isTrialActive(userId: string): Promise<boolean> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { trial_ends_at: true },
  })

  if (!user?.trial_ends_at) return false
  return new Date(user.trial_ends_at) > new Date()
}

export async function getTrialDaysRemaining(userId: string): Promise<number> {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { trial_ends_at: true },
  })

  if (!user?.trial_ends_at) return 0

  const end = new Date(user.trial_ends_at).getTime()
  const now = Date.now()
  const diffDays = Math.ceil((end - now) / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
}

// Re-export NextAuth configuration so route handlers can import from '@/lib/auth'
export { authOptions } from '@/app/api/auth/[...nextauth]/authOptions'
