import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = "Precise GovCon <noreply@precisegovcon.com>";
const REPLY_TO = "support@precisegovcon.com";

export async function sendPasswordReset(to: string, resetUrl: string) {
  return resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: "Reset your Precise GovCon password",
    html: `
      <p>Hello,</p>
      <p>Click below to reset your passwordHash:</p>
      <p><a href="${resetUrl}">Reset Password</a></p>
      <p>This link expires in 30 minutes. If you didn’t request it, ignore this email.</p>
    `,
  });
}

export async function sendAccessRequestConfirmation(to: string, requestId: string) {
  return resend.emails.send({
    from: FROM,
    to,
    replyTo: REPLY_TO,
    subject: "We received your Precise GovCon access request",
    html: `
      <p>Thanks — we received your access request.</p>
      <p><strong>Request ID:</strong> ${requestId}</p>
      <p>We’ll follow up shortly.</p>
    `,
  });
}
