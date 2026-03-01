// lib/email/templates.ts
import { sendEmail } from './send'
import { getBrand } from './brand'

interface WelcomeEmailData {
  to: string
  name: string
  plan: 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE'
  trialEnd: Date | null
}

const PLAN_FEATURES = {
  BASIC: {
    name: 'Basic Plan',
    price: '$24.99/month',
    features: [
      'Unlimited opportunity searches',
      'Advanced filtering',
      'Save unlimited opportunities',
      'Daily email digest',
      '30-day search history',
      'CSV export',
      'Email support',
    ],
  },
  PROFESSIONAL: {
    name: 'Professional Plan',
    price: '$49/month',
    features: [
      'Everything in Basic, plus:',
      'Real-time opportunity alerts',
      'Advanced analytics dashboard',
      'Competitor tracking',
      '25 custom alert criteria',
      '1-year search history',
      'API access (1,000 calls/month)',
      'Excel export with formatting',
      'Team collaboration (3 users)',
      'Priority support',
    ],
  },
  ENTERPRISE: {
    name: 'Enterprise Plan',
    price: '$199/month',
    features: [
      'Everything in Professional, plus:',
      'Unlimited team members',
      'Dedicated account manager',
      'Custom integrations',
      'Unlimited API access',
      'White-label reporting',
      'Custom training sessions',
      '99.9% SLA guarantee',
      'Phone & priority support',
      '5+ years historical data',
    ],
  },
}

export async function sendWelcomeEmail(data: WelcomeEmailData) {
  const brand = getBrand()
  const planInfo = PLAN_FEATURES[data.plan]
  const trialText = data.trialEnd
    ? `Your 7-day free trial ends on ${data.trialEnd.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
    : ''

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
              
              <!-- Header with Precise GovCon Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #1e3a4c 0%, #2d5266 100%); padding: 40px; text-align: center;">
                  <img src="${brand.logoUrl}" alt="${brand.name}" style="max-width: 240px; height: auto; margin-bottom: 20px; display: inline-block; border: 0;" />
                  <h1 style="margin: 0 0 10px; color: #ffffff; font-size: 32px; font-weight: bold;">Welcome to Precise GovCon!</h1>
                  <p style="margin: 0; color: #d1fae5; font-size: 16px;">You're all set up and ready to find opportunities</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 24px;">
                    Hi ${data.name},
                  </p>
                  
                  <p style="margin: 0 0 20px; color: #cbd5e1; font-size: 16px; line-height: 24px;">
                    Thank you for subscribing to Precise GovCon! We're excited to help you discover and win more government contracts.
                  </p>
                  
                  ${data.trialEnd ? `
                  <div style="background-color: #0c4a6e; border-left: 4px solid ${brand.colors.green}; padding: 16px; margin: 20px 0; border-radius: 6px;">
                    <p style="margin: 0; color: #bae6fd; font-size: 14px;">
                      <strong>🎉 Free Trial Active:</strong> ${trialText}
                    </p>
                  </div>
                  ` : ''}
                  
                  <!-- Plan Details -->
                  <div style="background-color: #0f172a; border-radius: 12px; padding: 24px; margin: 30px 0;">
                    <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 20px; font-weight: bold;">
                      Your ${planInfo.name}
                    </h2>
                    <p style="margin: 0 0 16px; color: ${brand.colors.green}; font-size: 18px; font-weight: 600;">
                      ${planInfo.price}
                    </p>
                    <div style="border-top: 1px solid #334155; padding-top: 16px;">
                      ${planInfo.features.map(feature => `
                        <div style="display: flex; align-items: flex-start; margin-bottom: 12px;">
                          <span style="color: ${brand.colors.green}; margin-right: 8px; font-size: 18px;">✓</span>
                          <span style="color: ${feature.includes('Everything') ? '#ffffff' : '#cbd5e1'}; font-size: 14px; line-height: 20px; ${feature.includes('Everything') ? 'font-weight: 600;' : ''}">${feature}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                  
                  <!-- Quick Start Guide -->
                  <h3 style="margin: 30px 0 16px; color: #ffffff; font-size: 18px; font-weight: bold;">
                    🚀 Quick Start Guide
                  </h3>
                  
                  <div style="background-color: #0f172a; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                    <h4 style="margin: 0 0 8px; color: ${brand.colors.green}; font-size: 16px; font-weight: 600;">
                      1. Set Up Your Search Criteria
                    </h4>
                    <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 20px;">
                      Head to the Search page and configure filters for your business (NAICS codes, set-asides, agencies, etc.)
                    </p>
                  </div>
                  
                  <div style="background-color: #0f172a; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                    <h4 style="margin: 0 0 8px; color: ${brand.colors.green}; font-size: 16px; font-weight: 600;">
                      2. Create Custom Alerts
                    </h4>
                    <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 20px;">
                      Get notified instantly when new opportunities match your criteria
                    </p>
                  </div>
                  
                  <div style="background-color: #0f172a; border-radius: 8px; padding: 16px; margin-bottom: 12px;">
                    <h4 style="margin: 0 0 8px; color: ${brand.colors.green}; font-size: 16px; font-weight: 600;">
                      3. Track Your Pipeline
                    </h4>
                    <p style="margin: 0; color: #94a3b8; font-size: 14px; line-height: 20px;">
                      Save opportunities you're interested in and monitor them until the deadline
                    </p>
                  </div>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${brand.appUrl}/search" style="display: inline-block; background: linear-gradient(135deg, ${brand.colors.green} 0%, #689f38 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                      Start Searching Now
                    </a>
                  </div>
                  
                  <!-- Security Recommendation -->
                  <div style="background-color: #422006; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 6px;">
                    <h4 style="margin: 0 0 8px; color: #fbbf24; font-size: 14px; font-weight: 600;">
                      🔒 Secure Your Account
                    </h4>
                    <p style="margin: 0 0 12px; color: #fde68a; font-size: 13px; line-height: 18px;">
                      We recommend enabling Two-Factor Authentication to protect your account.
                    </p>
                    <a href="${brand.appUrl}/settings/security" style="color: #fbbf24; text-decoration: underline; font-size: 13px;">
                      Enable 2FA in Settings →
                    </a>
                  </div>
                  
                  <!-- Support -->
                  <p style="margin: 30px 0 0; color: #cbd5e1; font-size: 14px; line-height: 20px;">
                    Need help getting started? Our support team is here for you:
                  </p>
                  <ul style="margin: 12px 0 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 24px;">
                    <li>Email: <a href="mailto:${brand.supportEmail}" style="color: ${brand.colors.green}; text-decoration: none;">${brand.supportEmail}</a></li>
                    <li>Help Center: <a href="${brand.appUrl}/help" style="color: ${brand.colors.green}; text-decoration: none;">Help Center</a></li>
                  </ul>
                  
                  <p style="margin: 30px 0 0; color: #cbd5e1; font-size: 14px; line-height: 20px;">
                    Happy hunting!<br>
                    <strong style="color: #ffffff;">The Precise GovCon Team</strong>
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="padding: 30px 40px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
                  <img src="${brand.logoUrl}" alt="${brand.name}" style="max-width: 140px; height: auto; margin-bottom: 16px; display: inline-block; border: 0; opacity: 0.9;" />
                  <p style="margin: 0 0 12px; color: #64748b; font-size: 13px;">
                    © ${new Date().getFullYear()} ${brand.name}. All rights reserved.<br/>
                    <span style="font-size: 12px;">VETERAN-OWNED Small Business · Richmond, Virginia</span>
                  </p>
                  <p style="margin: 0; color: #64748b; font-size: 12px;">
                    <a href="${brand.appUrl}/settings" style="color: #64748b; text-decoration: none;">Manage Subscription</a> •
                    <a href="${brand.appUrl}/privacy" style="color: #64748b; text-decoration: none;">Privacy Policy</a> •
                    <a href="${brand.appUrl}/terms" style="color: #64748b; text-decoration: none;">Terms of Service</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  await sendEmail({
    to: data.to,
    subject: `Welcome to ${brand.name} - Your ${planInfo.name} is Active!`,
    html: htmlContent,
  })
}

export async function sendPaymentFailedEmail(to: string, name: string, planName: string) {
  const brand = getBrand()
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
              <tr>
                <td style="background: linear-gradient(135deg, #1e3a4c 0%, #2d5266 100%); padding: 40px; text-align: center;">
                  <img src="${brand.logoUrl}" alt="${brand.name}" style="max-width: 200px; height: auto; margin-bottom: 20px; display: inline-block; border: 0;" />
                  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Payment Failed</h1>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px;">Hi ${name},</p>
                  <p style="margin: 0 0 20px; color: #cbd5e1; font-size: 16px;">
                    We were unable to process your payment for your ${planName}. Your account will remain active for a few days, but please update your payment method to avoid service interruption.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${brand.appUrl}/settings/billing" style="display: inline-block; background: #dc2626; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600;">
                      Update Payment Method
                    </a>
                  </div>
                  <p style="margin: 20px 0 0; color: #94a3b8; font-size: 14px; text-align: center;">
                    Questions? Contact <a href="mailto:${brand.supportEmail}" style="color: ${brand.colors.green}; text-decoration: none;">${brand.supportEmail}</a>
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px 40px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
                  <img src="${brand.logoUrl}" alt="${brand.name}" style="max-width: 120px; height: auto; margin-bottom: 12px; display: inline-block; border: 0; opacity: 0.9;" />
                  <p style="margin: 0; color: #64748b; font-size: 12px;">
                    © ${new Date().getFullYear()} ${brand.name}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `

  await sendEmail({
    to,
    subject: `Action Required: Payment Failed - ${brand.name}`,
    html: htmlContent,
  })
}
// Export brandedEmail function for creating branded email templates
interface BrandedEmailParams {
  title: string
  preheader?: string
  intro: string
  ctaText?: string
  ctaUrl?: string
  note?: string
}

export function brandedEmail(params: BrandedEmailParams): { subject: string; html: string; text: string } {
  const brand = getBrand()
  const { title, preheader, intro, ctaText, ctaUrl, note } = params
  
  // Generate plain text version
  const text = `
${title}

${intro}

${ctaText && ctaUrl ? `${ctaText}: ${ctaUrl}` : ''}

${note || ''}

---
${brand.name}
${brand.supportEmail}
  `.trim()
  
  return {
    subject: title,
    text,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          ${preheader ? `<meta name="description" content="${preheader}">` : ''}
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
                  <tr>
                    <td style="background: linear-gradient(135deg, #1e3a4c 0%, #2d5266 100%); padding: 40px; text-align: center;">
                      <img src="${brand.logoUrl}" alt="${brand.name}" style="max-width: 200px; height: auto; margin-bottom: 20px; display: inline-block; border: 0;" />
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">${title}</h1>
                      ${preheader ? `<p style="margin: 10px 0 0; color: #d1fae5; font-size: 14px;">${preheader}</p>` : ''}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 40px;">
                      <p style="margin: 0 0 20px; color: #e2e8f0; font-size: 16px; line-height: 24px;">
                        ${intro}
                      </p>
                      
                      ${ctaText && ctaUrl ? `
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="${ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, ${brand.colors.green} 0%, #689f38 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                          ${ctaText}
                        </a>
                      </div>
                      ` : ''}
                      
                      ${note ? `
                      <div style="background-color: #422006; border-left: 4px solid #f59e0b; padding: 16px; margin: 30px 0; border-radius: 6px;">
                        <p style="margin: 0; color: #fde68a; font-size: 13px; line-height: 18px;">
                          ${note}
                        </p>
                      </div>
                      ` : ''}
                      
                      <p style="margin: 30px 0 0; color: #94a3b8; font-size: 14px; line-height: 20px;">
                        If you need assistance, contact us at <a href="mailto:${brand.supportEmail}" style="color: ${brand.colors.green}; text-decoration: none;">${brand.supportEmail}</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 30px 40px; background-color: #0f172a; border-top: 1px solid #334155; text-align: center;">
                      <img src="${brand.logoUrl}" alt="${brand.name}" style="max-width: 120px; height: auto; margin-bottom: 12px; display: inline-block; border: 0; opacity: 0.9;" />
                      <p style="margin: 0 0 8px; color: #64748b; font-size: 12px;">
                        © ${new Date().getFullYear()} ${brand.name}. All rights reserved.
                      </p>
                      <p style="margin: 0; color: #64748b; font-size: 11px;">
                        <a href="${brand.appUrl}/privacy" style="color: #64748b; text-decoration: none;">Privacy</a> •
                        <a href="${brand.appUrl}/terms" style="color: #64748b; text-decoration: none;">Terms</a>
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `
  }
}