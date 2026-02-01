// lib/email-templates/enterprise-inquiry.tsx

interface EnterpriseInquiryEmailProps {
  customerName: string
  customerEmail: string
  companyName?: string
  phoneNumber?: string
  message?: string
}

export function generateEnterpriseInquiryEmail({
  customerName,
  customerEmail,
  companyName,
  phoneNumber,
  message,
}: EnterpriseInquiryEmailProps): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Enterprise Inquiry - Precise GovCon</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1e293b; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);">
          
          <!-- Header with Logo -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); padding: 40px 30px; text-align: center;">
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <!-- Logo placeholder - replace with actual logo -->
                    <div style="width: 60px; height: 60px; background-color: white; border-radius: 12px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                      <img src="https://yourdomain.com/logo.png" alt="Precise GovCon Logo" style="width: 50px; height: 50px; display: block;" />
                    </div>
                    <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      Precise GovCon
                    </h1>
                    <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 500;">
                      Federal Contracting Intelligence Platform
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 20px; color: #10b981; font-size: 24px; font-weight: 600;">
                New Enterprise Inquiry
              </h2>
              
              <p style="margin: 0 0 30px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                A potential enterprise customer has expressed interest in our platform. Here are their details:
              </p>

              <!-- Customer Information Card -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f172a; border-radius: 12px; overflow: hidden; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <table role="presentation" style="width: 100%; border-collapse: collapse;">
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Contact Name</span>
                          <p style="margin: 8px 0 0; color: #f1f5f9; font-size: 16px; font-weight: 500;">${customerName}</p>
                        </td>
                      </tr>
                      
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Email Address</span>
                          <p style="margin: 8px 0 0;">
                            <a href="mailto:${customerEmail}" style="color: #06b6d4; font-size: 16px; font-weight: 500; text-decoration: none;">${customerEmail}</a>
                          </p>
                        </td>
                      </tr>
                      
                      ${companyName ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Company</span>
                          <p style="margin: 8px 0 0; color: #f1f5f9; font-size: 16px; font-weight: 500;">${companyName}</p>
                        </td>
                      </tr>
                      ` : ''}
                      
                      ${phoneNumber ? `
                      <tr>
                        <td style="padding: 12px 0; border-bottom: 1px solid #334155;">
                          <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Phone Number</span>
                          <p style="margin: 8px 0 0;">
                            <a href="tel:${phoneNumber}" style="color: #06b6d4; font-size: 16px; font-weight: 500; text-decoration: none;">${phoneNumber}</a>
                          </p>
                        </td>
                      </tr>
                      ` : ''}
                      
                      ${message ? `
                      <tr>
                        <td style="padding: 12px 0;">
                          <span style="color: #64748b; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Message</span>
                          <p style="margin: 8px 0 0; color: #f1f5f9; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${message}</p>
                        </td>
                      </tr>
                      ` : ''}
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Action Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <tr>
                  <td align="center">
                    <a href="mailto:${customerEmail}" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.3);">
                      Reply to Customer
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Next Steps -->
              <div style="background-color: #0f172a; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="margin: 0 0 12px; color: #10b981; font-size: 16px; font-weight: 600;">
                  Recommended Next Steps:
                </h3>
                <ul style="margin: 0; padding-left: 20px; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                  <li>Respond within 24 hours</li>
                  <li>Schedule a demo call</li>
                  <li>Prepare custom pricing proposal</li>
                  <li>Assess integration requirements</li>
                  <li>Discuss team size and needs</li>
                </ul>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0 0 10px; color: #64748b; font-size: 14px;">
                <strong style="color: #cbd5e1;">Precise Analytics LLC</strong>
              </p>
              <p style="margin: 0 0 10px; color: #64748b; font-size: 13px;">
                Service-Disabled Veteran-Owned Small Business (SDVOSB)
              </p>
              <p style="margin: 0 0 20px; color: #64748b; font-size: 13px;">
                Richmond, Virginia | <a href="https://precisegovcon.com" style="color: #06b6d4; text-decoration: none;">precisegovcon.com</a>
              </p>
              
              <!-- Social Links -->
              <table role="presentation" style="margin: 0 auto; border-collapse: collapse;">
                <tr>
                  <td style="padding: 0 10px;">
                    <a href="https://linkedin.com/company/precise-analytics" style="color: #06b6d4; text-decoration: none; font-size: 12px;">LinkedIn</a>
                  </td>
                  <td style="padding: 0 10px; color: #334155;">|</td>
                  <td style="padding: 0 10px;">
                    <a href="mailto:support@precisegovcon.com" style="color: #06b6d4; text-decoration: none; font-size: 12px;">Contact Support</a>
                  </td>
                </tr>
              </table>
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

// Customer-facing confirmation email
export function generateCustomerConfirmationEmail(customerName: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You - Precise GovCon</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; width: 100%; border-collapse: collapse; background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 28px; font-weight: 700;">Precise GovCon</h1>
              <p style="margin: 10px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">Federal Contracting Intelligence Platform</p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h2 style="margin: 0 0 20px; color: #10b981; font-size: 24px;">Thank You, ${customerName}!</h2>
              <p style="margin: 0 0 30px; color: #cbd5e1; font-size: 16px; line-height: 1.6;">
                We've received your enterprise inquiry and one of our team members will reach out to you within 24 hours.
              </p>
              <div style="background-color: #0f172a; padding: 24px; border-radius: 12px; margin-bottom: 30px;">
                <p style="margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.8;">
                  In the meantime, feel free to explore our platform or reach out to us directly at<br/>
                  <a href="mailto:sales@precisegovcon.com" style="color: #06b6d4; text-decoration: none; font-weight: 600;">sales@precisegovcon.com</a>
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #0f172a; padding: 30px; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0; color: #64748b; font-size: 13px;">
                © 2026 Precise Analytics LLC. All rights reserved.
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