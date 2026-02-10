//app/lib/email/brandTemplate.ts

type BrandEmailParams = {
  subject: string
  preheader?: string
  headline: string
  intro: string
  ctaLabel: string
  ctaUrl: string
  footerNote?: string
}

function escapeHtml(s: string) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

export function buildBrandEmailHtml(params: BrandEmailParams) {
  const appUrl = (process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")
  // Use the full logo from your public directory
  const logoUrl = process.env.BRAND_LOGO_URL || `${appUrl}/logo.png`

  const preheader = params.preheader ?? params.intro
  const footerNote =
    params.footerNote ??
    "If you didn't request this, you can safely ignore this email. For security, links may expire."

  // Table-based layout for maximum email client compatibility
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(params.subject)}</title>
    <style type="text/css">
      @media only screen and (max-width: 600px) {
        .mobile-padding { padding: 20px 16px !important; }
        .mobile-text { font-size: 14px !important; }
      }
    </style>
  </head>
  <body style="margin:0;padding:0;background:#020617;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
      ${escapeHtml(preheader)}
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background:#020617;">
      <tr>
        <td align="center" style="padding:28px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="600" style="width:600px;max-width:600px;">
            
            <!-- Logo Header with Full Branding -->
            <tr>
              <td style="padding:0 0 20px 0;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="left" style="padding:0 8px;">
                      <a href="${appUrl}" style="text-decoration:none;display:block;">
                        <!-- Logo Container -->
                        <table role="presentation" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="padding:12px 16px;background:#0f1729;border-radius:12px;display:inline-block;">
                              <table role="presentation" cellpadding="0" cellspacing="0">
                                <tr>
                                  <td style="vertical-align:middle;padding-right:12px;">
                                    <!-- Icon SVG -->
                                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                      <rect width="40" height="40" rx="8" fill="#10b981"/>
                                      <path d="M12 28V20L20 12L28 20V28" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                      <path d="M16 24L20 20L24 24" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                    </svg>
                                  </td>
                                  <td style="vertical-align:middle;">
                                    <!-- Brand Text -->
                                    <div style="line-height:1;">
                                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:20px;font-weight:800;letter-spacing:-0.5px;">
                                        <span style="color:#ffffff;">PRECISE</span> <span style="color:#f97316;">GOVCON</span>
                                      </div>
                                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;font-size:10px;color:#94a3b8;margin-top:2px;letter-spacing:0.3px;">
                                        contracting intelligence and procurement experts
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Main Content Card -->
            <tr>
              <td style="border-radius:18px;overflow:hidden;border:1px solid rgba(148,163,184,0.18);background:rgba(15,23,42,0.72);">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                  <!-- Gradient Top Bar -->
                  <tr>
                    <td style="padding:0;">
                      <div style="height:10px;background:linear-gradient(90deg,#10b981,#3b82f6);"></div>
                    </td>
                  </tr>

                  <!-- Headline -->
                  <tr>
                    <td style="padding:26px 26px 10px 26px;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:#ffffff;font-size:22px;font-weight:800;line-height:1.25;">
                        ${escapeHtml(params.headline)}
                      </div>
                    </td>
                  </tr>

                  <!-- Intro Text -->
                  <tr>
                    <td style="padding:0 26px 18px 26px;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:rgba(226,232,240,0.9);font-size:14px;line-height:1.6;">
                        ${escapeHtml(params.intro)}
                      </div>
                    </td>
                  </tr>

                  <!-- CTA Button -->
                  <tr>
                    <td style="padding:0 26px 24px 26px;">
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="border-radius:12px;background:linear-gradient(90deg,#10b981,#3b82f6);">
                            <a href="${params.ctaUrl}" style="display:inline-block;padding:14px 24px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;">
                              ${escapeHtml(params.ctaLabel)}
                            </a>
                          </td>
                        </tr>
                      </table>

                      <div style="margin-top:14px;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:rgba(148,163,184,0.95);font-size:12px;line-height:1.6;">
                        Or copy and paste this link:<br>
                        <span style="word-break:break-all;color:rgba(147,197,253,0.95);">${params.ctaUrl}</span>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer Note -->
                  <tr>
                    <td style="padding:0 26px 26px 26px;">
                      <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:rgba(148,163,184,0.95);font-size:12px;line-height:1.6;">
                        ${escapeHtml(footerNote)}
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="padding:14px 8px 0 8px;">
                <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:rgba(148,163,184,0.9);font-size:12px;line-height:1.6;text-align:center;">
                  © ${new Date().getFullYear()} Precise Analytics LLC · VETERAN-OWNED Small Business
                </div>
                <div style="font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;color:rgba(100,116,139,0.9);font-size:11px;line-height:1.6;text-align:center;margin-top:6px;">
                  Richmond, Virginia · Powered by SAM.gov API
                </div>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

export function buildBrandEmailText(params: BrandEmailParams) {
  return `${params.headline}

${params.intro}

${params.ctaLabel}: ${params.ctaUrl}

If you didn't request this, you can safely ignore this email.

---
© ${new Date().getFullYear()} Precise Analytics LLC
VETERAN-OWNED Small Business
Richmond, Virginia`
}