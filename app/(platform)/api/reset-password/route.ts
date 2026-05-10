import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import crypto from "crypto"
import bcrypt from "bcryptjs"
import { sendPasswordChangedNotification } from "@/lib/email/passwordChangeNotification"

export const runtime = "nodejs"

function sha256(s: string) {
  return crypto.createHash("sha256").update(s).digest("hex")
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}))
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    // Hash the token to match what's stored in the database
    const tokenHash = sha256(token)

    // Find the reset token
    const resetToken = await prisma.password_reset_tokens.findUnique({
      where: { token_hash: tokenHash },
    })

    if (!resetToken) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (resetToken.expires_at < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired" },
        { status: 400 }
      )
    }

    // Check if token was already used
    if (resetToken.used_at) {
      return NextResponse.json(
        { error: "Reset token has already been used" },
        { status: 400 }
      )
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(password, 12)
    console.log('🔒 Reset password for:', resetToken.email)
    console.log('🔑 New hash starts with:', passwordHash.substring(0, 10))

    // Update the user's password
    const updatedUser = await prisma.users.update({
      where: { email: resetToken.email },
      data: { 
        password_hash: passwordHash,
        updated_at: new Date()
      },
    })
    console.log('✅ User updated:', updatedUser.email, 'at', updatedUser.updated_at)

    // Mark the token as used
    await prisma.password_reset_tokens.update({
      where: { token_hash: tokenHash },
      data: { used_at: new Date() },
    })

    // Send security notification email
    try {
      await sendPasswordChangedNotification(resetToken.email)
      console.log('📧 Password change notification sent to:', resetToken.email)
    } catch (emailError) {
      console.error('Failed to send notification email:', emailError)
      // Don't fail the password reset if email fails
    }

    return NextResponse.json({ 
      ok: true,
      message: "Password successfully reset" 
    })
  } catch (err) {
    console.error("reset-password error:", err)
    return NextResponse.json(
      { error: "An error occurred while resetting your password" },
      { status: 500 }
    )
  }
}
