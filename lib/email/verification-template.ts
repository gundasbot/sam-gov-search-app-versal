// lib/email/verification-template.ts

export function getVerificationEmailTemplate(name: string, verificationUrl: string, planName: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.precisegovcon.com';
  const logoUrl = process.env.NEXT_PUBLIC_LOGO_URL || `${baseUrl}/logo.png`;
  
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email - Precise GovCon</title>
  </head>
  <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f3f4f6;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <!-- Header with Logo -->
      <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <img src="${logoUrl}" alt="Precise GovCon" style="max-width: 200px; height: auto; margin-bottom: 20px;" />
        <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Welcome to Precise GovCon!</h1>
      </div>
      
      <!-- Content -->
      <div style="background: white; padding: 40px 30px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="font-size: 18px; margin-top: 0; color: #111827;">Hi ${name},</p>
        
        <p style="font-size: 16px; line-height: 1.8; color: #374151;">
          Thanks for signing up! Click the button below to verify your email and automatically activate your <strong>${planName}</strong> 7-day free trial:
        </p>

        <!-- CTA Button -->
        <table role="presentation" style="width: 100%; margin: 35px 0;">
          <tr>
            <td style="text-align: center;">
              <a href="${verificationUrl}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                Verify Email & Start Trial
              </a>
            </td>
          </tr>
        </table>

        <!-- What happens next -->
        <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 30px 0; border-radius: 4px;">
          <p style="margin: 0 0 15px 0; font-size: 14px; color: #065f46; font-weight: 700;">
            🎯 What happens next:
          </p>
          <ul style="margin: 0; padding-left: 20px; color: #065f46; font-size: 14px;">
            <li style="margin-bottom: 8px;">Your email will be verified</li>
            <li style="margin-bottom: 8px;">Your <strong>${planName}</strong> 7-day free trial starts</li>
            <li style="margin-bottom: 8px;">You'll be automatically signed in</li>
            <li>No credit card required!</li>
          </ul>
        </div>

        <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          Or copy and paste this link into your browser:<br>
          <a href="${verificationUrl}" style="color: #10b981; word-break: break-all;">${verificationUrl}</a>
        </p>

        <p style="font-size: 12px; color: #9ca3af; margin-top: 30px;">
          This link will expire in 24 hours.
        </p>

        <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
          If you didn't create an account with Precise GovCon, you can safely ignore this email.
        </p>

        <p style="font-size: 16px; margin-bottom: 0; color: #374151; margin-top: 30px;">
          Best regards,<br>
          <strong>The Precise GovCon Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px; padding: 20px; text-align: center;">
        <p style="margin: 5px 0; font-size: 14px; color: #6b7280;">
          <a href="${baseUrl}/support" style="color: #10b981; text-decoration: none; margin: 0 8px;">Support</a>
          <span style="color: #d1d5db;">•</span>
          <a href="${baseUrl}/privacy" style="color: #10b981; text-decoration: none; margin: 0 8px;">Privacy</a>
          <span style="color: #d1d5db;">•</span>
          <a href="${baseUrl}/terms" style="color: #10b981; text-decoration: none; margin: 0 8px;">Terms</a>
        </p>
        <p style="margin: 15px 0 5px 0; font-size: 13px; color: #9ca3af;">
          © ${new Date().getFullYear()} Precise GovCon. All rights reserved.
        </p>
        <p style="margin: 5px 0; font-size: 12px; color: #9ca3af;">
          Richmond, Virginia
        </p>
      </div>

    </div>
  </body>
</html>
  `.trim();
}

export function getVerificationEmailText(name: string, verificationUrl: string, planName: string): string {
  return `
Hi ${name},

Thanks for signing up! Click the link below to verify your email and automatically activate your ${planName} 7-day free trial:

${verificationUrl}

What happens next:
• Your email will be verified
• Your ${planName} 7-day free trial starts  
• You'll be automatically signed in
• No credit card required!

This link will expire in 24 hours.

If you didn't create an account with Precise GovCon, you can safely ignore this email.

Best regards,
The Precise GovCon Team

---
Support: ${process.env.NEXTAUTH_URL}/support
Privacy: ${process.env.NEXTAUTH_URL}/privacy
Terms: ${process.env.NEXTAUTH_URL}/terms

© ${new Date().getFullYear()} Precise GovCon. All rights reserved.
Richmond, Virginia
  `.trim();
}
