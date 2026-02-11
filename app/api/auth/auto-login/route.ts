// app/api/auth/auto-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

function sha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex')
}

// POST method - called by verify-email page to validate token and return user info
export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json()

    if (!token) {
      return NextResponse.json({ ok: false, error: 'No token provided' }, { status: 400 })
    }

    const tokenHash = sha256Hex(token)
    const now = new Date()

    // âœ… FIX: changed `user` â†’ `users` to match the actual Prisma relation
    const autoLoginToken = await prisma.auto_login_tokens.findFirst({
      where: {
        token_hash: tokenHash,
        expires_at: { gt: now },
        used_at: null,
      },
      include: {
        users: true,
      },
    })

    if (!autoLoginToken) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid or expired auto-login token'
      }, { status: 401 })
    }

    // Mark token as used
    await prisma.auto_login_tokens.update({
      where: { id: autoLoginToken.id },
      data: { used_at: now },
    })

    const user = autoLoginToken.users

    console.log(`âœ… Auto-login token validated for ${user.email}`)

    return NextResponse.json({
      ok: true, users: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        name: user.name,
      },
    })

  } catch (error: any) {
    console.error('âŒ Auto-login POST error:', error)
    return NextResponse.json({
      ok: false,
      error: 'Auto-login failed'
    }, { status: 500 })
  }
}

// GET method - fallback for direct link access
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const isWelcome = searchParams.get('welcome') === 'true'

    if (!token) {
      return NextResponse.redirect(
        new URL('/login?error=missing-auto-login-token', request.url)
      )
    }

    const tokenHash = sha256Hex(token)
    const now = new Date()

    // âœ… FIX: changed `user` â†’ `users` to match the actual Prisma relation
    const autoLoginToken = await prisma.auto_login_tokens.findFirst({
      where: {
        token_hash: tokenHash,
        expires_at: { gt: now },
      },
      include: {
        users: true,
      },
    })

    if (!autoLoginToken) {
      return NextResponse.redirect(
        new URL('/login?error=invalid-auto-login-token', request.url)
      )
    }

    if (new Date() > autoLoginToken.expires_at) {
      await prisma.auto_login_tokens.delete({
        where: { id: autoLoginToken.id }
      })
      return NextResponse.redirect(
        new URL('/login?error=auto-login-expired', request.url)
      )
    }

    if (autoLoginToken.used_at) {
      return NextResponse.redirect(
        new URL('/login?error=auto-login-already-used', request.url)
      )
    }

    const user = autoLoginToken.users

    // Mark token as used
    await prisma.auto_login_tokens.update({
      where: { id: autoLoginToken.id },
      data: { used_at: now }
    })

    console.log(`ðŸ” Auto-login GET successful for: ${user.email}`)

    // Build display name
    let displayName = ''
    if (user.first_name && user.last_name) {
      displayName = `${user.first_name} ${user.last_name}`
    } else if (user.first_name) {
      displayName = user.first_name
    } else if (user.name) {
      displayName = user.name
    } else {
      displayName = user.email.split('@')[0]
    }

    const heading = isWelcome
      ? `Welcome ${displayName}! ðŸŽ‰`
      : 'Email Verified! ðŸŽ‰'

    const subtext = isWelcome
      ? 'Your 7-day free trial has started'
      : 'Welcome back'

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Signing you in...</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
            }
            .container { text-align: center; color: white; padding: 40px; }
            .checkmark {
              width: 80px; height: 80px; border-radius: 50%;
              display: block; margin: 0 auto 30px;
              stroke-width: 3; stroke: white; stroke-miterlimit: 10;
              box-shadow: inset 0px 0px 0px rgba(255,255,255,0.3);
              animation: fill 0.4s ease-in-out 0.4s forwards, scale 0.3s ease-in-out 0.9s both;
            }
            .checkmark-circle {
              stroke-dasharray: 166; stroke-dashoffset: 166;
              stroke-width: 3; stroke-miterlimit: 10;
              stroke: rgba(255,255,255,0.3); fill: none;
              animation: stroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards;
            }
            .checkmark-check {
              transform-origin: 50% 50%;
              stroke-dasharray: 48; stroke-dashoffset: 48;
              animation: stroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.8s forwards;
            }
            @keyframes stroke { 100% { stroke-dashoffset: 0; } }
            @keyframes scale { 0%,100% { transform: none; } 50% { transform: scale3d(1.1,1.1,1); } }
            @keyframes fill { 100% { box-shadow: inset 0px 0px 0px 60px rgba(255,255,255,0.2); } }
            .spinner {
              width: 50px; height: 50px;
              border: 4px solid rgba(255,255,255,0.3);
              border-top-color: white; border-radius: 50%;
              animation: spin 1s linear infinite; margin: 20px auto;
            }
            @keyframes spin { to { transform: rotate(360deg); } }
            h1 { margin: 0 0 10px; font-size: 32px; font-weight: 700; letter-spacing: -0.5px; }
            p { margin: 0; opacity: 0.95; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="container">
            <svg class="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle class="checkmark-circle" cx="26" cy="26" r="25" fill="none"/>
              <path class="checkmark-check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/>
            </svg>
            <h1>${heading}</h1>
            <p style="margin-bottom: 20px;">${subtext}</p>
            <div class="spinner"></div>
            <p>Signing you in automatically...</p>
          </div>
          <script>
            sessionStorage.setItem('autoLoginUserId', '${user.id}');
            sessionStorage.setItem('autoLoginEmail', '${user.email}');
            setTimeout(() => {
              window.location.href = '/?autoLogin=true${isWelcome ? '&welcome=true' : ''}';
            }, 2000);
          </script>
        </body>
      </html>
    `

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      },
    })

  } catch (error) {
    console.error('âŒ Auto-login GET error:', error)
    return NextResponse.redirect(
      new URL('/login?error=auto-login-failed', request.url)
    )
  }
}
