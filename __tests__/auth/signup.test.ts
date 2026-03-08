/**
 * Tests for /api/auth/signup endpoint
 *
 * Tests the complete signup flow:
 * - User registration with validation
 * - Plan selection
 * - Email verification token creation
 * - Verification email sending
 * - Duplicate account prevention
 */

import { POST } from '@/app/api/auth/signup/route'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email/send'

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    users: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    email_verification_tokens: {
      deleteMany: jest.fn(),
      create: jest.fn(),
    },
  },
}))

jest.mock('@/lib/email/send', () => ({
  sendEmail: jest.fn(),
}))

describe('POST /api/auth/signup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Validation Tests', () => {
    it('should reject signup without email', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          password: 'SecurePass123',
          plan: 'PROFESSIONAL',
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('required')
    })

    it('should reject password shorter than 8 characters', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'Short1',
          plan: 'PROFESSIONAL',
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('8 characters')
    })

    it('should reject signup without first/last name', async () => {
      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          email: 'jane@example.com',
          password: 'SecurePass123',
          plan: 'PROFESSIONAL',
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(400)
      expect(data.error).toContain('required')
    })
  })

  describe('Duplicate Account Prevention', () => {
    it('should prevent duplicate verified accounts', async () => {
      ;(prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 'existing-user',
        email: 'jane@example.com',
        email_verified: new Date(),
      })

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'SecurePass123',
          plan: 'PROFESSIONAL',
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(409)
      expect(data.error).toContain('already exists')
    })

    it('should allow re-sending verification for unverified account', async () => {
      ;(prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 'unverified-user',
        email: 'jane@example.com',
        email_verified: null,
      })

      ;(prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({
        count: 1,
      })

      ;(prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({
        id: 'token-1',
        user_id: 'unverified-user',
        token_hash: 'hashed-token',
        expires_at: new Date(),
      })

      ;(sendEmail as jest.Mock).mockResolvedValue({})

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'SecurePass123',
          plan: 'PROFESSIONAL',
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(200)
      expect(data.emailSent).toBe(true)
      expect(data.message).toContain('resent')
    })
  })

  describe('Successful Signup', () => {
    it('should create user with correct plan tier', async () => {
      ;(prisma.users.findUnique as jest.Mock).mockResolvedValue(null)

      ;(prisma.users.create as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        plan_tier: 'PROFESSIONAL',
        plan_status: 'pending_verification',
        trial_active: false,
        email_verified: null,
        is_active: false,
      })

      ;(prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })

      ;(prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({
        id: 'token-1',
        user_id: 'new-user-id',
        token_hash: 'hashed-token',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
      })

      ;(sendEmail as jest.Mock).mockResolvedValue({})

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'SecurePass123',
          plan: 'PROFESSIONAL',
          billing: 'monthly',
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      expect(res.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.emailSent).toBe(true)
      expect(data.user_id).toBe('new-user-id')

      // Verify user was created with correct plan
      expect(prisma.users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            plan_tier: 'PROFESSIONAL',
            plan_status: 'pending_verification',
            trial_active: false,
            email_verified: null,
            is_active: false,
          }),
        })
      )
    })

    it('should normalize plan tier to PROFESSIONAL if invalid', async () => {
      ;(prisma.users.findUnique as jest.Mock).mockResolvedValue(null)

      ;(prisma.users.create as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        plan_tier: 'BASIC', // normalized to BASIC
      })

      ;(prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({})
      ;(sendEmail as jest.Mock).mockResolvedValue({})

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'SecurePass123',
          plan: 'INVALID_PLAN',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(201)

      // Plan tier should be normalized to BASIC (default)
      expect(prisma.users.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            plan_tier: 'BASIC',
          }),
        })
      )
    })

    it('should send verification email', async () => {
      ;(prisma.users.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.users.create as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        email: 'jane@example.com',
        first_name: 'Jane',
      })
      ;(prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({})
      ;(sendEmail as jest.Mock).mockResolvedValue({})

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'SecurePass123',
          plan: 'PROFESSIONAL',
        }),
      })

      await POST(req)

      // Verify email was sent
      expect(sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'jane@example.com',
          subject: expect.stringContaining('Verify Your Email'),
          html: expect.stringContaining('Precise GovCon'),
        })
      )
    })

    it('should include company logo in verification email', async () => {
      ;(prisma.users.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.users.create as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        email: 'jane@example.com',
        first_name: 'Jane',
      })
      ;(prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({})
      ;(sendEmail as jest.Mock).mockResolvedValue({})

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'SecurePass123',
          plan: 'PROFESSIONAL',
        }),
      })

      await POST(req)

      const emailCall = (sendEmail as jest.Mock).mock.calls[0][0]
      expect(emailCall.html).toContain('<img')
      expect(emailCall.html).toContain('precisegovcon')
      expect(emailCall.html).toContain('alt=')
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      ;(prisma.users.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      )

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'SecurePass123',
        }),
      })

      const res = await POST(req)
      expect(res.status).toBe(500)
    })

    it('should handle email sending failures non-blocking', async () => {
      ;(prisma.users.findUnique as jest.Mock).mockResolvedValue(null)
      ;(prisma.users.create as jest.Mock).mockResolvedValue({
        id: 'new-user-id',
        email: 'jane@example.com',
      })
      ;(prisma.email_verification_tokens.deleteMany as jest.Mock).mockResolvedValue({ count: 0 })
      ;(prisma.email_verification_tokens.create as jest.Mock).mockResolvedValue({})
      ;(sendEmail as jest.Mock).mockRejectedValue(new Error('Email service down'))

      const req = new Request('http://localhost:3000/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          password: 'SecurePass123',
        }),
      })

      const res = await POST(req)
      const data = await res.json()

      // Account should still be created even if email fails
      expect(res.status).toBe(201)
      expect(data.success).toBe(true)
      expect(data.emailSent).toBe(false)
      expect(data.warning).toBe('EMAIL_SEND_FAILED')
    })
  })
})
