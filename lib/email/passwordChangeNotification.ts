import { sendEmail } from "./send"
import { buildBrandEmailHtml, buildBrandEmailText } from "./brandTemplate"

export async function sendPasswordChangedNotification(email: string) {
  const appUrl = (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")
  
  const subject = "Your Precise GovCon password was changed"
  
  const html = buildBrandEmailHtml({
    subject,
    headline: "Password Changed Successfully",
    intro: "Your Precise GovCon account password was recently changed. If you made this change, no further action is needed.",
    ctaLabel: "Sign In to Your Account",
    ctaUrl: `${appUrl}/login`,
    footerNote: "⚠️ If you did NOT make this change, please contact our support team immediately at support@precisegovcon.com or reset your password right away.",
  })
  
  const text = buildBrandEmailText({
    subject,
    headline: "Password Changed Successfully",
    intro: "Your Precise GovCon account password was recently changed. If you made this change, no further action is needed.",
    ctaLabel: "Sign In to Your Account",
    ctaUrl: `${appUrl}/login`,
  })
  
  await sendEmail({ to: email, subject, html, text })
}
