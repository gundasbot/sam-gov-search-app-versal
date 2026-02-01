// app/api/verify-password/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

function clamp(v: unknown, max = 255) {
  return String(v ?? "").trim().slice(0, max)
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({} as any))

    const email = clamp(body?.email, 320).toLowerCase()
    const password = clamp(body?.password, 512)

    // IMPORTANT: do not allow defaults in an auth endpoint
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Missing email or password" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        passwordHash: true,
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Check passwordHash (not password)
    if (!user.passwordHash) {
      return NextResponse.json(
        {
          success: false,
          error: "No password set for this user",
          email: user.email,
        },
        { status: 400 }
      )
    }

    const { compare } = await import("bcryptjs")
    const isValid = await compare(password, user.passwordHash)

    return NextResponse.json({
      success: true,
      email: user.email,
      role: user.role,
      passwordValid: isValid,
      message: isValid ? "✅ Password is VALID!" : "❌ Password is INVALID",
    })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: String(error?.message || error) },
      { status: 500 }
    )
  }
}