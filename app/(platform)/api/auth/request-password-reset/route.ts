//app/api/auth/request-password-reset/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { brandedEmail } from "@/lib/email/template"
import { sendEmail } from "@/lib/email/send"
import { resolvePublicAppUrl } from "@/lib/url-safety"

export const runtime = "nodejs"
const AUTH_EMAIL_ALERT_TO = process.env.AUTH_EMAIL_ALERT_TO || "admin@precisegovcon.com"

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex")
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

async function alertAuthEmailFailure(stage: string, email: string, error: unknown) {
  try {
    const anyErr = error as any
    const message = String(anyErr?.message || error || stage)
    const stack = String(anyErr?.stack || "").slice(0, 5000)
    await sendEmail({
      to: AUTH_EMAIL_ALERT_TO,
      subject: `[Precise GovCon] Auth email failed: ${stage}`,
      html: `
        <div style="font-family:Arial,sans-serif;color:#0f172a;">
          <h2>Auth Email Failure</h2>
          <table style="border-collapse:collapse;width:100%;max-width:760px;">
            <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:700;background:#f8fafc;">Stage</td><td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(stage)}</td></tr>
            <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:700;background:#f8fafc;">Email</td><td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:8px 10px;border:1px solid #e5e7eb;font-weight:700;background:#f8fafc;">Error</td><td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(message)}</td></tr>
          </table>
          ${stack ? `<h3 style="margin:20px 0 8px;">Stack</h3><pre style="white-space:pre-wrap;background:#0f172a;color:#e2e8f0;padding:14px;border-radius:8px;overflow:auto;">${escapeHtml(stack)}</pre>` : ""}
        </div>
      `,
      text: `Auth Email Failure\nStage: ${stage}\nEmail: ${email}\nError: ${message}${stack ? `\n\n${stack}` : ""}`,
    })
  } catch (alertErr) {
    console.error("request-password-reset admin alert failed:", alertErr)
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body?.email || "").trim().toLowerCase()

    // Always return OK to prevent account enumeration
    if (!email) return NextResponse.json({ ok: true })

    const user = await prisma.users.findUnique({
      where: { email },
      select: { id: true, email: true, first_name: true },
    })
    if (!user) return NextResponse.json({ ok: true })

    const raw = crypto.randomBytes(32).toString("hex")
    const tokenHash = sha256(raw)

    const ttlMin = Number(process.env.RESET_TOKEN_TTL_MINUTES || "30")
    const expiresAt = new Date(Date.now() + ttlMin * 60 * 1000)

    // Invalidate prior tokens (use snake_case field names)
    await prisma.password_reset_tokens.updateMany({
      where: { email, used_at: null },
      data: { used_at: new Date() },
    })

    // Create new token (use snake_case field names and include id)
    await prisma.password_reset_tokens.create({
      data: { 
        id: crypto.randomUUID(),
        email, 
        token_hash: tokenHash, 
        expires_at: expiresAt,
        created_at: new Date(),
      },
    })

    const appUrl = resolvePublicAppUrl(
      process.env.APP_URL,
      process.env.NEXT_PUBLIC_APP_URL,
      process.env.NEXTAUTH_URL
    )
    const resetUrl = `${appUrl}/reset-password?token=${raw}`

    const { html, text } = brandedEmail({
      title: "Reset your Precise GovCon password",
      preheader: `Reset your password (link expires in ${ttlMin} minutes).`,
      intro:
        "We received a request to reset your password for your Precise GovCon account. If you didn't request this, you can safely ignore this email.",
      ctaText: "Reset Password",
      ctaUrl: resetUrl,
      note: `This reset link expires in ${ttlMin} minutes and can only be used once.`,
    })

    try {
      await sendEmail({
        to: email,
        subject: "Reset your Precise GovCon password",
        html,
        text,
      })
    } catch (emailErr) {
      console.error("request-password-reset email failed:", emailErr)
      await alertAuthEmailFailure("password_reset_failed", email, emailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("request-password-reset error:", err)
    return NextResponse.json({ ok: true }) // keep non-enumerating behavior
  }
}
