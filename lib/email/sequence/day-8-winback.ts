// lib/email/sequence/day-8-winback.ts
import { sendEmail } from '../send'
import { getBrand } from '../brand'

export async function sendWinbackEmail(email: string, name: string): Promise<void> {
  const brand = getBrand()
  const firstName = name.split(' ')[0] || 'there'

  await sendEmail({
    to: email,
    subject: `${firstName}, your trial just ended — but you can still save 50% 🎁`,
    html: getWinbackEmailHtml(firstName),
    text: getWinbackEmailText(firstName),
  })
}

function getWinbackEmailHtml(firstName: string): string {
  const brand = getBrand()
  const appUrl = brand.appUrl

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Come back and save 50% 🎁</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0f172a;">
    <tr>
      <td align="center" style="padding:40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
               style="max-width:600px;width:100%;background:#1e293b;border-radius:24px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.5);">

          <!-- Logo header -->
          <tr>
            <td style="padding:30px 40px 20px;background-color:#0f172a;text-align:center;">
              <img src="${brand.logoUrl}" alt="${brand.name}"
                   style="max-width:220px;height:auto;display:inline-block;border:0;margin-bottom:8px;" />
              <div style="font-size:11px;color:#94a3b8;letter-spacing:0.3px;">${brand.tagline}</div>
            </td>
          </tr>

          <!-- Hero banner -->
          <tr>
            <td style="background:linear-gradient(135deg,#10b981 0%,#059669 100%);padding:36px 40px 28px;text-align:center;">
              <div style="width:72px;height:72px;margin:0 auto 16px;background:rgba(255,255,255,0.15);border-radius:18px;text-align:center;line-height:72px;font-size:36px;">
                🎁
              </div>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">
                We miss you, ${firstName}!
              </h1>
              <p style="margin:8px 0 0;color:#a7f3d0;font-size:15px;">
                Your 7-day trial has ended, but we're keeping your 50% discount active.
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px 28px;background-color:#1e293b;">
              <p style="margin:0 0 18px;color:#f1f5f9;font-size:17px;font-weight:600;">
                Hey ${firstName},
              </p>
              <p style="margin:0 0 28px;color:#cbd5e1;font-size:15px;line-height:1.7;">
                Your free trial with Precise GovCon has ended. But here's the thing — we loved having you on board,
                and we want you to keep access to Precise GovCon without the full price tag.
              </p>

              <!-- Success story / testimonial -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:#0f172a;border-left:4px solid #10b981;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <p style="margin:0 0 12px;color:#cbd5e1;font-size:14px;line-height:1.7;font-style:italic;">
                      &quot;We found two qualified leads in the first week with Precise GovCon. Our response time to new
                      opportunities went from hours to minutes. It&apos;s already paying for itself.&quot;
                    </p>
                    <p style="margin:0;color:#94a3b8;font-size:13px;font-weight:600;">
                      — Sarah K., Government Contracting Manager
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Discount offer -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background:linear-gradient(135deg,#d1fae5 0%,#a7f3d0 100%);border:2px solid #10b981;border-radius:12px;margin-bottom:28px;">
                <tr>
                  <td style="padding:28px 24px;text-align:center;">
                    <p style="margin:0 0 12px;color:#065f46;font-size:13px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;">
                      Special offer: 50% off
                    </p>
                    <p style="margin:0 0 12px;color:#047857;font-size:42px;font-weight:900;">
                      FIRST MONTH
                    </p>
                    <p style="margin:0 0 16px;color:#065f46;font-size:14px;">
                      Get back to winning contracts
                      <br><span style="font-size:12px;">Limited time offer</span>
                    </p>
                    <p style="margin:0;color:#065f46;font-size:12px;font-family:monospace;font-weight:700;letter-spacing:1px;">
                      CODE: COMEBACK50
                    </p>
                  </td>
                </tr>
              </table>

              <!-- Pricing -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
                <tr><td style="padding:0 0 10px;color:#cbd5e1;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">After 50% discount:</td></tr>
                <tr><td style="padding:0 0 6px;color:#a7f3d0;font-size:14px;">💎 <strong>Basic:</strong> $12.49/month (was $24.99)</td></tr>
                <tr><td style="padding:0 0 6px;color:#a7f3d0;font-size:14px;">⚡ <strong>Professional:</strong> $24.50/month (was $49)</td></tr>
                <tr><td style="padding:0;color:#a7f3d0;font-size:14px;">👑 <strong>Enterprise:</strong> $99.50/month (was $199)</td></tr>
              </table>

              <!-- CTA -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="padding:0 0 28px;">
                    <a href="${appUrl}/pricing"
                       style="display:inline-block;padding:16px 48px;background:#10b981;color:#ffffff;text-decoration:none;font-weight:700;font-size:17px;border-radius:12px;box-shadow:0 8px 24px rgba(16,185,129,0.35);">
                      Restart with 50% Off &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;color:#94a3b8;font-size:13px;line-height:1.6;">
                Use code <strong>COMEBACK50</strong> at checkout to claim your discount. This offer is valid for the next
                <strong style="color:#a7f3d0;">7 days</strong>, so don't wait too long!
              </p>

              <details style="color:#94a3b8;font-size:13px;cursor:pointer;">
                <summary style="margin-bottom:12px;font-weight:600;color:#cbd5e1;">Why didn't you continue?</summary>
                <p style="margin:12px 0 0;color:#94a3b8;line-height:1.6;">
                  We'd love to hear your feedback! Whether it was the feature set, pricing, or just timing — please
                  <a href="mailto:${brand.supportEmail}" style="color:#10b981;text-decoration:none;">let us know</a>.
                  Your input helps us get better.
                </p>
              </details>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:28px 40px;background-color:#0f172a;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#64748b;font-size:12px;">
                This offer expires in 7 days.
                <br><a href="${appUrl}/account" style="color:#10b981;text-decoration:none;">Manage email preferences</a>
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

function getWinbackEmailText(firstName: string): string {
  const brand = getBrand()
  return `
🎁 We miss you, ${firstName}!

Your 7-day trial has ended, but we're keeping your 50% discount active.

Hey ${firstName},

Your free trial with Precise GovCon has ended. But here's the thing — we loved having you on board, and we want you to keep access to Precise GovCon without the full price tag.

SUCCESS STORY
"We found two qualified leads in the first week with Precise GovCon. Our response time to new opportunities went from hours to minutes. It's already paying for itself."
— Sarah K., Government Contracting Manager

SPECIAL OFFER: 50% OFF YOUR FIRST MONTH
Code: COMEBACK50

PRICING WITH YOUR 50% DISCOUNT:
- Basic: $12.49/month (was $24.99)
- Professional: $24.50/month (was $49)
- Enterprise: $99.50/month (was $199)

Get back to winning contracts: ${brand.appUrl}/pricing

Use code COMEBACK50 at checkout. This offer is valid for the next 7 days.

Why didn't you continue? We'd love to hear your feedback!
Reply to this email or contact ${brand.supportEmail}

—
Precise GovCon
Offer expires in 7 days
${brand.supportEmail}
  `
}
