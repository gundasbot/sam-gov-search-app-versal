// app/api/auth/signup/route.ts
import { NextResponse } from 'next/server'
import { hash } from 'bcryptjs'
import crypto from 'crypto'
import { Resend } from 'resend'
import { prisma } from '@/lib/prisma'

import { randomBytes } from 'crypto'
const resend = new Resend(process.env.RESEND_API_KEY)

const TRIAL_DAYS = 7

function endOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(23, 59, 59, 999)
  return x
}

function addDays(from: Date, days: number) {
  const x = new Date(from)
  x.setDate(x.getDate() + days)
  return x
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { email, password, firstName, lastName, phone, company } = body

    // Validation
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user already exists
    const existingUser = await prisma.users.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = await hash(password, 12)

    // Calculate trial dates (not used yet - trial starts after verification)
    const now = new Date()
    const trialExpires = endOfDay(addDays(now, TRIAL_DAYS))

    // Create user - IMPORTANT: Trial does NOT start until email is verified
    const user = await prisma.users.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        name: `${firstName.trim()} ${lastName.trim()}`,
        role: 'user',
        plan: 'trial',
        plan_tier: 'trial',
        plan_status: 'pending', // â† Not 'trialing' yet!
        trial_active: false,    // â† Not active yet!
        trialStartedAt: null,  // â† Null until verified
        trial_expires_at: null,  // â† Null until verified
        trial_ends_at: null,     // â† Null until verified
        emailVerified: null,   // â† Must verify email
        isActive: false,       // â† Not active yet
        isSuspended: false,
      },
    })

    // Generate verification token
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Create verification token
    await prisma.emailVerif
        id: randomBytes(12).toString('hex'),icationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    })

    // Get app URL
    const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const verificationUrl = `${appUrl}/api/verify-email?token=${rawToken}`

    // Send verification email
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'noreply@preciseanalytics.io',
        to: user.email,
        subject: 'Verify Your Email - Precise GovCon',
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Verify Your Email</title>
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 40px 20px;">
                    <table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                      
                      <!-- Header with Logo -->
                      <tr>
                        <td style="padding: 40px 40px 20px; text-align: center; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); border-radius: 16px 16px 0 0;">
                          <!-- Logo -->
                          <div style="margin-bottom: 20px;">
                            <img src="${appUrl}/logo.png" alt="Precise GovCon" style="height: 60px; width: auto;" />
                          </div>
                          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Welcome to Precise GovCon!</h1>
                        </td>
                      </tr>
                      
                      <!-- Body -->
                      <tr>
                        <td style="padding: 40px;">
                          <p style="margin: 0 0 16px; color: #374151; font-size: 16px; line-height: 1.6;">
                            Hi ${firstName},
                          </p>
                          
                          <p style="margin: 0 0 24px; color: #374151; font-size: 16px; line-height: 1.6;">
                            Thanks for signing up! Click the button below to verify your email and automatically sign in to start your 7-day free trial:
                          </p>
                          
                          <!-- Button -->
                          <table role="presentation" style="margin: 32px 0; width: 100%;">
                            <tr>
                              <td align="center">
                                <a href="${verificationUrl}" 
                                   style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                  Verify Email & Sign In
                                </a>
                              </td>
                            </tr>
                          </table>
                          
                          <div style="margin: 24px 0; padding: 20px; background-color: #f0fdf4; border-left: 4px solid #10b981; border-radius: 8px;">
                            <p style="margin: 0 0 12px; color: #166534; font-size: 14px; font-weight: 600;">
                              ðŸŽ‰ What happens next:
                            </p>
                            <ul style="margin: 0; padding-left: 20px; color: #166534; font-size: 14px; line-height: 1.8;">
                              <li>Your email will be verified</li>
                              <li>Your 7-day free trial will start</li>
                              <li>You'll be automatically signed in</li>
                            </ul>
                          </div>
                          
                          <p style="margin: 24px 0 16px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Or copy and paste this link into your browser:
                          </p>
                          
                          <p style="margin: 0 0 24px; padding: 12px; background-color: #f3f4f6; border-radius: 8px; color: #4b5563; font-size: 13px; word-break: break-all; font-family: monospace;">
                            ${verificationUrl}
                          </p>
                          
                          <p style="margin: 0 0 8px; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            This link will expire in 24 hours.
                          </p>
                          
                          <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                            If you didn't create an account with Precise GovCon, you can safely ignore this email.
                          </p>
                        </td>
                      </tr>
                      
                      <!-- Footer -->
                      <tr>
                        <td style="padding: 30px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; text-align: center;">
                          <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                            Â© ${new Date().getFullYear()} Precise Analytics LLC. All rights reserved.
                          </p>
                          <p style="margin: 8px 0 0; color: #9ca3af; font-size: 12px;">
                            Richmond, Virginia
                          </p>
                        </td>
                      </tr>
                      
                    </table>
                  </td>
                </tr>
              </table>
            </body>
          </html>
        `,
      })
      
      console.log(`âœ… Verification email sent to: ${user.email}`)
    } catch (emailError) {
      console.error('âŒ Failed to send verification email:', emailError)
      // Don't fail signup if email fails - user can request resend
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Account created successfully! Please check your email to verify your account.',
        userId: user.id 
      },
      { status: 201 }
    )

  } catch (error: any) {
    console.error('âŒ Signup error:', error)
    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}