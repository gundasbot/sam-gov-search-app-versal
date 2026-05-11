import { POST } from '@/app/(platform)/api/auth/signup/route'
import { sendEmail } from '@/lib/email/send'

jest.mock('@/lib/email/send', () => ({
  sendEmail: jest.fn().mockResolvedValue({ success: true, data: { id: 'mock-email-id' } }),
}))

jest.mock('@/lib/prisma', () => ({
  prisma: {},
}))

jest.mock('@/lib/email/brand', () => ({
  getBrand: () => ({
    name: 'Precise GovCon',
    appUrl: 'https://platform.precisegovcon.com',
    logoUrl: 'https://www.precisegovcon.com/logo.png',
    tagline: 'Contracting intelligence and procurement experts',
  }),
}))

jest.mock('@/lib/email/signup-welcome', () => ({
  sendSignupWelcomeEmailOnce: jest.fn(),
}))

describe('signup admin alerts', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.SIGNUP_ERROR_ALERT_EMAIL = 'admin@precisegovcon.com'
  })

  it('emails admin when the signup request fails before account creation', async () => {
    const req = {
      url: 'https://platform.precisegovcon.com/api/auth/signup',
      json: jest.fn().mockRejectedValue(new Error('Invalid JSON body')),
    } as unknown as Request

    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: 'Failed to create account. Please try again.' })
    expect(sendEmail).toHaveBeenCalledTimes(1)
    expect(sendEmail).toHaveBeenCalledWith(expect.objectContaining({
      to: 'admin@precisegovcon.com',
      subject: '[Precise GovCon] Signup error: signup_request_failed',
      text: expect.stringContaining('Stage: signup_request_failed'),
      html: expect.stringContaining('Signup Error Alert'),
    }))
    expect((sendEmail as jest.Mock).mock.calls[0][0].text).toContain('Invalid JSON body')
  })
})
