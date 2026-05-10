// app/api/notify-submission/route.ts - Email Notifications for Form Submissions
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { formType, data, userEmail, userName } = body;

    // Format the data for email
    const formattedData = Object.entries(data)
      .map(([key, value]) => `<strong>${key}:</strong> ${value}`)
      .join('<br>');

    // Send email to Precise GovCon team
    await resend.emails.send({
      from: 'Precise GovCon Forms <noreply@precisegovcon.com>',
      to: ['contact@precisegovcon.com', 'team@precisegovcon.com'],
      subject: `🚨 New ${formType} Submission`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #06b6d4); padding: 30px; border-radius: 10px 10px 0 0; }
            .header h1 { color: white; margin: 0; font-size: 24px; }
            .content { background: #fff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .data-box { background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
            .btn { display: inline-block; padding: 12px 24px; background: #10b981; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 New ${formType} Submission</h1>
            </div>
            <div class="content">
              <p><strong>Submitted by:</strong> ${userName || 'Anonymous'}</p>
              <p><strong>Email:</strong> ${userEmail}</p>
              <p><strong>Timestamp:</strong> ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })} ET</p>
              
              <div class="data-box">
                <h3 style="margin-top: 0;">Form Data:</h3>
                ${formattedData}
              </div>

              <a href="mailto:${userEmail}" class="btn">Reply to User</a>
            </div>
            <div class="footer">
              <p>Precise GovCon | Federal Contract Intelligence</p>
              <p>This is an automated notification from your website form system.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    // Send confirmation email to user
    await resend.emails.send({
      from: 'Precise GovCon <noreply@precisegovcon.com>',
      to: userEmail,
      subject: `✅ Your ${formType} Submission Received`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #06b6d4); padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .content { background: #fff; padding: 40px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
            .checkmark { width: 80px; height: 80px; border-radius: 50%; background: #10b981; display: flex; align-items: center; justify-center; margin: 0 auto 20px; }
            .checkmark svg { width: 50px; height: 50px; stroke: white; }
            .info-box { background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Submission Received!</h1>
            </div>
            <div class="content">
              <div class="checkmark">
                <svg fill="none" viewBox="0 0 24 24" stroke-width="3" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              
              <h2 style="text-align: center; color: #1f2937;">Thank You for Your Submission!</h2>
              
              <p>Hi ${userName || 'there'},</p>
              
              <p>We've successfully received your <strong>${formType}</strong> submission. Our team at Precise GovCon is reviewing your information and will contact you within <strong>24 hours</strong>.</p>
              
              <div class="info-box">
                <h3 style="margin-top: 0; color: #059669;">What Happens Next?</h3>
                <ul style="margin: 0; padding-left: 20px;">
                  <li>Our experts will review your submission</li>
                  <li>We'll prepare a personalized assessment</li>
                  <li>You'll receive a detailed response via email</li>
                  <li>We may reach out with follow-up questions</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">In the meantime, feel free to explore our other services or reach out directly:</p>
              
              <p style="text-align: center;">
                <strong>Email:</strong> contact@precisegovcon.com<br>
                <strong>Phone:</strong> (555) 123-4567
              </p>
            </div>
            <div class="footer">
              <p><strong>Precise GovCon</strong> | Federal Contract Intelligence</p>
              <p>Helping businesses win more government contracts</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log(`✅ Email sent for ${formType} submission from ${userEmail}`);

    return NextResponse.json({ 
      success: true,
      message: 'Notification sent successfully'
    });

  } catch (error) {
    console.error('❌ Email notification error:', error);
    
    return NextResponse.json({ 
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send notification'
    }, { status: 500 });
  }
}
