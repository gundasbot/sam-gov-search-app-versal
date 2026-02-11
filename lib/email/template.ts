//app/lib/email/template.ts

import { getBrand } from "./brand"

function esc(s: string) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

export function brandedEmail(args: {
  title: string
  preheader?: string
  intro?: string
  ctaText: string
  ctaUrl: string
  note?: string
}) {
  const brand = getBrand()

  const title = esc(args.title)
  const preheader = esc(args.preheader || "")
  const intro = esc(args.intro || "")
  const ctaText = esc(args.ctaText)
  const ctaUrl = args.ctaUrl
  const note = esc(args.note || "")

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#0b1220;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    ${preheader}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#0b1220;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
          
          <!-- Logo Header -->
          <tr>
            <td style="padding:10px 6px 20px 6px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left">
                    <a href="${brand.appUrl}" style="text-decoration:none;display:block;">
                      <!-- Logo Container -->
                      <table role="presentation" cellpadding="0" cellspacing="0">
                        <tr>
                          <td style="padding:10px 14px;background:#0f1729;border-radius:10px;display:inline-block;">
                            <table role="presentation" cellpadding="0" cellspacing="0">
                              <tr>
                                <td style="vertical-align:middle;padding-right:10px;">
                                  <!-- Icon SVG -->
                                  <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <rect width="36" height="36" rx="7" fill="#10b981"/>
                                    <path d="M11 26V18L18 11L25 18V26" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                                    <path d="M14 21L18 17L22 21" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                                </td>
                                <td style="vertical-align:middle;">
                                  <!-- Brand Text -->
                                  <div style="line-height:1;">
                                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;font-weight:800;letter-spacing:-0.3px;">
                                      <span style="color:#ffffff;">PRECISE</span> <span style="color:#f97316;">GOVCON</span>
                                    </div>
                                    <div style="font-family:Arial,Helvetica,sans-serif;font-size:9px;color:#94a3b8;margin-top:2px;letter-spacing:0.2px;">
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

          <!-- Main Content -->
          <tr>
            <td style="background:#0f172a;border:1px solid rgba(148,163,184,0.18);border-radius:18px;overflow:hidden;">
              <div style="height:6px;background:linear-gradient(90deg,#10b981,#3b82f6);"></div>

              <div style="padding:26px 22px 18px 22px;">
                <h1 style="margin:0 0 10px 0;color:#ffffff;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:1.25;font-weight:800;">
                  ${title}
                </h1>

                ${intro ? `<p style="margin:0 0 18px 0;color:#cbd5e1;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;">
                  ${intro}
                </p>` : ""}

                <table role="presentation" cellspacing="0" cellpadding="0" style="margin:16px 0 14px 0;">
                  <tr>
                    <td style="border-radius:14px;background:linear-gradient(90deg,#10b981,#3b82f6);">
                      <a href="${ctaUrl}" style="display:inline-block;padding:13px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#ffffff;text-decoration:none;border-radius:14px;font-weight:700;">
                        ${ctaText}
                      </a>
                    </td>
                  </tr>
                </table>

                <p style="margin:0 0 12px 0;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">
                  If the button doesn't work, copy and paste this link into your browser:<br/>
                  <a href="${ctaUrl}" style="color:#38bdf8;text-decoration:none;word-break:break-all;">${ctaUrl}</a>
                </p>

                ${note ? `<div style="margin-top:12px;padding:12px;border-radius:14px;background:rgba(2,132,199,0.10);border:1px solid rgba(56,189,248,0.25);">
                  <p style="margin:0;color:#cbd5e1;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">
                    ${note}
                  </p>
                </div>` : ""}
              </div>

              <div style="padding:14px 22px;border-top:1px solid rgba(148,163,184,0.18);background:rgba(15,23,42,0.6);">
                <p style="margin:0;color:#94a3b8;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">
                  Need help? Contact us at
                  <a href="mailto:${brand.supportEmail}" style="color:#38bdf8;text-decoration:none;">${brand.supportEmail}</a>.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:14px 6px 0 6px;color:#64748b;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;">
              <p style="margin:0 0 4px 0;color:#64748b;font-weight:600;">
                © ${new Date().getFullYear()} Precise Analytics LLC
              </p>
              <p style="margin:0;color:#475569;font-size:11px;">
                VETERAN-OWNED Small Business · Richmond, Virginia
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text =
`PRECISE GOVCON
contracting intelligence and procurement experts

${args.title}

${args.intro || ""}

${args.ctaText}: ${args.ctaUrl}

${args.note ? `Note: ${args.note}\n` : ""}
Support: ${getBrand().supportEmail}

---
© ${new Date().getFullYear()} Precise Analytics LLC
Veteran-Owned Small Business
Richmond, Virginia
`

  return { html, text }
}
