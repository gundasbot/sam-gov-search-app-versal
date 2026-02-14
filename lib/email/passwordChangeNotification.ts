import { sendEmail } from "./send"
import { buildBrandEmailHtml, buildBrandEmailText } from "./brandTemplate"
import { getBrand } from "./brand"

export async function sendPasswordChangedNotification(email: string) {
  const brand = getBrand()
  
  const subject = `Your ${brand.name} password was changed`
  
  const html = buildBrandEmailHtml({
    subject,
    headline: "Password Changed Successfully",
    intro: `Your ${brand.name} account password was recently changed. If you made this change, no further action is needed.`,
    ctaLabel: "Sign In to Your Account",
    ctaUrl: `${brand.appUrl}/login`,
    footerNote: `⚠️ If you did NOT make this change, please contact our support team immediately at ${brand.supportEmail} or reset your password right away.`,
  })
  
  const text = buildBrandEmailText({
    subject,
    headline: "Password Changed Successfully",
    intro: `Your ${brand.name} account password was recently changed. If you made this change, no further action is needed.`,
    ctaLabel: "Sign In to Your Account",
    ctaUrl: `${brand.appUrl}/login`,
  })
  
  await sendEmail({ to: email, subject, html, text })
}