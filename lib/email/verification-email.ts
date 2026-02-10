// lib/email/templates/verification-email.ts
// lib/email/templates/verification-email.ts
export function getVerificationEmailHtml(params: {
  firstName: string;
  verificationUrl: string;
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Verify Your Email - Precise GovCon</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        
        <!-- Main Container -->
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);">
          
          <!-- Logo Header -->
          <tr>
            <td style="padding: 30px 40px 20px; background-color: #0f1729;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <!-- Icon SVG -->
                    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="48" height="48" rx="10" fill="#10b981"/>
                      <path d="M14 33V24L24 14L34 24V33" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                      <path d="M19 28L24 23L29 28" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </td>
                  <td style="vertical-align:middle;">
                    <!-- Brand Text -->
                    <div style="line-height:1;">
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:24px; font-weight:800; letter-spacing:-0.5px;">
                        <span style="color:#ffffff;">PRECISE</span> <span style="color:#f97316;">GOVCON</span>
                      </div>
                      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size:11px; color:#94a3b8; margin-top:3px; letter-spacing:0.3px;">
                        contracting intelligence and procurement experts
                      </div>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Header with gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; text-align: center;">
              <!-- Checkmark Icon -->
              <div style="width: 80px; height: 80px; margin: 0 auto 20px; background: rgba(255, 255, 255, 0.15); border-radius: 20px; backdrop-filter: blur(10px); display: flex; align-items: center; justify-content: center;">
                <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="25" cy="25" r="20" stroke="white" stroke-width="2.5" fill="none"/>
                  <path d="M15 25L22 32L35 18" stroke="white" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);">
                Welcome to Precise GovCon! 🎉
              </h1>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 40px 30px; background-color: #1e293b;">
              <!-- Greeting -->
              <p style="margin: 0 0 20px; color: #f1f5f9; font-size: 18px; line-height: 1.6; font-weight: 500;">
                Hi ${params.firstName},
              </p>
              
              <!-- Main message -->
              <p style="margin: 0 0 30px; color: #cbd5e1; font-size: 16px; line-height: 1.7;">
                Thanks for signing up! You're one step away from accessing thousands of federal contract opportunities. Click the button below to verify your email and activate your <strong style="color: #10b981;">7-day free trial</strong>.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding: 0 0 30px;">
                    <a href="${params.verificationUrl}" 
                       style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; font-weight: 700; font-size: 18px; border-radius: 12px; box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4); transition: all 0.3s ease;">
                      Verify Email & Start Trial →
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- What's included box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(16, 185, 129, 0.1); border-left: 4px solid #10b981; border-radius: 12px; margin-bottom: 30px;">
                <tr>
                  <td style="padding: 24px;">
                    <p style="margin: 0 0 16px; color: #10b981; font-size: 16px; font-weight: 700;">
                      ✨ What happens next:
                    </p>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding: 0 0 10px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                          ✓ Your email will be verified instantly
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                          ✓ Your 7-day free trial starts immediately
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0 0 10px; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                          ✓ You'll be automatically signed in
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 0; color: #cbd5e1; font-size: 15px; line-height: 1.6;">
                          ✓ Start searching federal contracts right away
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- Alternative link -->
              <p style="margin: 0 0 10px; color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Or copy and paste this link into your browser:
              </p>
              <p style="margin: 0 0 30px; padding: 16px; background: rgba(15, 23, 42, 0.6); border-radius: 8px; color: #64748b; font-size: 13px; word-break: break-all; font-family: 'Courier New', monospace; border: 1px solid rgba(100, 116, 139, 0.2);">
                ${params.verificationUrl}
              </p>
              
              <!-- Expiry notice -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(251, 191, 36, 0.1); border-radius: 8px; border: 1px solid rgba(251, 191, 36, 0.2);">
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    <p style="margin: 0; color: #fbbf24; font-size: 14px; font-weight: 600;">
                      ⏰ This link expires in 24 hours
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Features Section -->
          <tr>
            <td style="padding: 0 40px 40px; background-color: #1e293b;">
              <p style="margin: 0 0 20px; color: #f1f5f9; font-size: 16px; font-weight: 600; text-align: center;">
                What you'll get with Precise GovCon:
              </p>
              
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <!-- Feature 1 -->
                <tr>
                  <td style="padding: 0 0 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(59, 130, 246, 0.1); border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.2);">
                      <tr>
                        <td style="padding: 16px; vertical-align: top; width: 40px;">
                          <div style="width: 32px; height: 32px; background: rgba(59, 130, 246, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 20px;">🔍</span>
                          </div>
                        </td>
                        <td style="padding: 16px 16px 16px 0; vertical-align: top;">
                          <p style="margin: 0 0 4px; color: #f1f5f9; font-size: 15px; font-weight: 600;">
                            Search 1,000+ Federal Contracts
                          </p>
                          <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                            Real-time access to opportunities from SAM.gov
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Feature 2 -->
                <tr>
                  <td style="padding: 0 0 16px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(16, 185, 129, 0.1); border-radius: 12px; border: 1px solid rgba(16, 185, 129, 0.2);">
                      <tr>
                        <td style="padding: 16px; vertical-align: top; width: 40px;">
                          <div style="width: 32px; height: 32px; background: rgba(16, 185, 129, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 20px;">🎯</span>
                          </div>
                        </td>
                        <td style="padding: 16px 16px 16px 0; vertical-align: top;">
                          <p style="margin: 0 0 4px; color: #f1f5f9; font-size: 15px; font-weight: 600;">
                            Filter by Set-Asides
                          </p>
                          <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                            SDVOSB, 8(a), HUBZone, WOSB & more
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Feature 3 -->
                <tr>
                  <td style="padding: 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background: rgba(168, 85, 247, 0.1); border-radius: 12px; border: 1px solid rgba(168, 85, 247, 0.2);">
                      <tr>
                        <td style="padding: 16px; vertical-align: top; width: 40px;">
                          <div style="width: 32px; height: 32px; background: rgba(168, 85, 247, 0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                            <span style="font-size: 20px;">📌</span>
                          </div>
                        </td>
                        <td style="padding: 16px 16px 16px 0; vertical-align: top;">
                          <p style="margin: 0 0 4px; color: #f1f5f9; font-size: 15px; font-weight: 600;">
                            Track & Save Opportunities
                          </p>
                          <p style="margin: 0; color: #94a3b8; font-size: 13px; line-height: 1.5;">
                            Never miss a deadline with smart notifications
                          </p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #0f172a; text-align: center; border-top: 1px solid rgba(100, 116, 139, 0.2);">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px; line-height: 1.6;">
                If you didn't create an account with Precise GovCon, you can safely ignore this email.
              </p>
              <p style="margin: 0; color: #475569; font-size: 12px; font-weight: 600;">
                © ${new Date().getFullYear()} Precise Analytics LLC
              </p>
              <p style="margin: 4px 0 0; color: #475569; font-size: 11px;">
                VETERAN-OWNED Small Business · Richmond, Virginia
              </p>
              <p style="margin: 8px 0 0; color: #475569; font-size: 12px;">
                <a href="https://precisegovcon.com/privacy" style="color: #64748b; text-decoration: none;">Privacy Policy</a> • 
                <a href="https://precisegovcon.com/terms" style="color: #64748b; text-decoration: none;">Terms of Service</a>
              </p>
            </td>
          </tr>
          
        </table>
        
      </td>
    </tr>
  </table>
  
</body>
</html>
  `.trim();
}

export function getVerificationEmailText(params: {
  firstName: string;
  verificationUrl: string;
}) {
  return `
PRECISE GOVCON
contracting intelligence and procurement experts

Welcome to Precise GovCon!

Hi ${params.firstName},

Thanks for signing up! You're one step away from accessing thousands of federal contract opportunities.

Verify your email and start your 7-day free trial:
${params.verificationUrl}

What happens next:
✓ Your email will be verified instantly
✓ Your 7-day free trial starts immediately
✓ You'll be automatically signed in
✓ Start searching federal contracts right away

What you'll get:
🔍 Search 1,000+ Federal Contracts
🎯 Filter by Set-Asides (SDVOSB, 8(a), HUBZone, WOSB & more)
📌 Track & Save Opportunities with smart notifications

⏰ This link expires in 24 hours.

If you didn't create an account with Precise GovCon, you can safely ignore this email.

---
© ${new Date().getFullYear()} Precise Analytics LLC
VETERAN-OWNED Small Business
Richmond, Virginia
  `.trim();
}