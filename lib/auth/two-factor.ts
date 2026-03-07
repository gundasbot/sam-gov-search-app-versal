// lib/auth/two-factor.ts
import crypto from 'crypto'
import { TOTP } from 'otplib'
import { generateTOTP } from '@otplib/uri'
import QRCode from 'qrcode'
import { prisma } from '@/lib/prisma'

function generateId(): string {
  return crypto.randomBytes(16).toString('hex')
}

// Use default TOTP instance
const totp = new TOTP()

// Configure step/window in a way that won't break TypeScript across otplib typings
;(totp as any).options = {
  ...(((totp as any).options ?? {}) as Record<string, unknown>),
  step: 30,   // 30 second time step
  window: 1,  // allow +/- 1 step drift
}

function verifyResultToBoolean(result: unknown): boolean {
  if (typeof result === 'boolean') return result
  if (result && typeof result === 'object') {
    const r = result as any
    if (typeof r.isValid === 'boolean') return r.isValid
    if (typeof r.valid === 'boolean') return r.valid
    if (typeof r.success === 'boolean') return r.success
  }
  return false
}

export async function generateTwoFactorSecret(userId: string, email: string) {
  const secret = totp.generateSecret()

  const otpauth = generateTOTP({
    issuer: 'Precise GovCon',
    label: email,
    secret,
    algorithm: 'sha1',
    digits: 6,
    period: 30,
  })

  const qrCodeDataUrl = await QRCode.toDataURL(otpauth)

  // Store secret temporarily (not enabled until verified)
  await prisma.users.update({
    where: { id: userId },
    data: { two_factor_secret: secret },
  })

  return {
    secret,
    qrCode: qrCodeDataUrl,
    otpauth,
  }
}

export async function verifyTwoFactorToken(secret: string, token: string): Promise<boolean> {
  try {
    const cleaned = String(token ?? '').replace(/\s+/g, '')
    if (!cleaned) return false

    const result = await (totp as any).verify({ token: cleaned, secret })
    return verifyResultToBoolean(result)
  } catch {
    return false
  }
}

export async function enableTwoFactor(userId: string, token: string) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: { two_factor_secret: true },
  })

  if (!user?.two_factor_secret) {
    return { success: false, error: '2FA secret not found' }
  }

  const isValid = await verifyTwoFactorToken(user.two_factor_secret, token)

  if (!isValid) {
    return { success: false, error: 'Invalid verification code' }
  }

  const backupCodes = generateBackupCodes()

  await prisma.$transaction([
    prisma.users.update({
      where: { id: userId },
      data: { two_factor_enabled: true },
    }),

    ...backupCodes.map(code =>
      prisma.two_factor_backup_codes.create({
        data: {
          id: generateId(),
          user_id: userId,
          code: hashBackupCode(code),
        },
      })
    ),
  ])

  return { success: true, backupCodes }
}

export async function disableTwoFactor(userId: string, password: string) {
  // Verify password first (implement password verification)
  // ...

  await prisma.$transaction([
    prisma.users.update({
      where: { id: userId },
      data: {
        two_factor_enabled: false,
        two_factor_secret: null,
      },
    }),

    prisma.two_factor_backup_codes.deleteMany({
      where: { user_id: userId },
    }),
  ])

  return { success: true }
}

export async function verifyBackupCode(userId: string, code: string) {
  const hashedCode = hashBackupCode(code)

  const backupCode = await prisma.two_factor_backup_codes.findFirst({
    where: { user_id: userId,
      code: hashedCode,
      used: false,
    },
  })

  if (!backupCode) return false

  await prisma.two_factor_backup_codes.update({
    where: { id: backupCode.id },
    data: {
      used: true,
      used_at: new Date(),
    },
  })

  return true
}

function generateBackupCodes(): string[] {
  const codes: string[] = []
  for (let i = 0; i < 10; i++) {
    const code = crypto.randomInt(10000000, 99999999).toString()
    codes.push(code)
  }
  return codes
}

function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}
