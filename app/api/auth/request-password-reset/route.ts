//app/api/auth/request-password-reset/route.ts

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import { brandedEmail } from "@/lib/email/template"
import { sendEmail } from "@/lib/email/send"

export const runtime = "nodejs"

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex")
}

function getAppUrl() {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000").replace(/\/$/, "")
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = String(body?.email || "").trim().toLowerCase()

    // Always return OK to prevent account enumeration
    if (!email) return NextResponse.json({ ok: true })

    const user = await prisma.users.findUnique({ where: { email } })
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

    const resetUrl = `${getAppUrl()}/reset-password?token=${raw}`

    const { html, text } = brandedEmail({
      title: "Reset your Precise GovCon password",
      preheader: `Reset your password (link expires in ${ttlMin} minutes).`,
      intro:
        "We received a request to reset your password for your Precise GovCon account. If you didn't request this, you can safely ignore this email.",
      ctaText: "Reset Password",
      ctaUrl: resetUrl,
      note: `This reset link expires in ${ttlMin} minutes and can only be used once.`,
    })

    await sendEmail({
      to: email,
      subject: "Reset your Precise GovCon password",
      html,
      text,
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("request-password-reset error:", err)
    return NextResponse.json({ ok: true }) // keep non-enumerating behavior
  }
}
