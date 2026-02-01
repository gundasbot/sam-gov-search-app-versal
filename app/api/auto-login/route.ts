// app/api/auth/auto-login/route.ts - BEAUTIFUL FIRST-TIME WELCOME

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.redirect(
        new URL('/?error=missing-auto-login-token', request.url)
      )
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const autoLoginToken = await prisma.auto_login_tokens.findUnique({
      where: { token_hash: tokenHash },
    })

    if (!autoLoginToken) {
      return NextResponse.redirect(
        new URL('/?error=invalid-auto-login-token', request.url)
      )
    }

    if (new Date() > autoLoginToken.expires_at) {
      await prisma.auto_login_tokens.delete({
        where: { id: autoLoginToken.id }
      })
      return NextResponse.redirect(
        new URL('/?error=auto-login-expired', request.url)
      )
    }

    if (autoLoginToken.used_at) {
      return NextResponse.redirect(
        new URL('/?error=auto-login-already-used', request.url)
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: autoLoginToken.user_id },
      select: { 
        id: true, 
        email: true, 
        firstName: true,
        lastName: true,
        trialExpiresAt: true,
        trialStartedAt: true
      }
    })

    if (!user) {
      return NextResponse.redirect(
        new URL('/?error=user-not-found', request.url)
      )
    }

    await prisma.auto_login_tokens.update({
      where: { id: autoLoginToken.id },
      data: { used_at: new Date() }
    })

    console.log(`🔐 Auto-login successful for: ${user.email}`)

    // Calculate trial days remaining
    const trialDaysRemaining = user.trialExpiresAt 
      ? Math.ceil((user.trialExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 7

    const firstName = user.firstName || user.email.split('@')[0]

    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Welcome to Precise GovCon 🎉</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      overflow-x: hidden;
    }

    .container {
      max-width: 600px;
      padding: 2rem;
      text-align: center;
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo {
      width: 100px;
      height: 100px;
      margin: 0 auto 2rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      border-radius: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 50px;
      box-shadow: 0 20px 60px rgba(16, 185, 129, 0.4);
      animation: checkmark 0.6s ease-out 0.3s both;
    }

    @keyframes checkmark {
      0% { transform: scale(0) rotate(-45deg); }
      50% { transform: scale(1.1) rotate(5deg); }
      100% { transform: scale(1) rotate(0deg); }
    }

    h1 {
      font-size: 2.5rem;
      font-weight: 900;
      margin-bottom: 1rem;
      background: linear-gradient(135deg, #10b981 0%, #34d399 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.2;
    }

    .subtitle {
      color: #94a3b8;
      font-size: 1.25rem;
      margin-bottom: 2rem;
      line-height: 1.6;
    }

    .trial-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(16, 185, 129, 0.1);
      border: 2px solid #10b981;
      padding: 0.75rem 1.5rem;
      border-radius: 12px;
      font-weight: 700;
      font-size: 1rem;
      color: #10b981;
      margin-bottom: 3rem;
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
      50% { transform: scale(1.02); box-shadow: 0 0 20px 10px rgba(16, 185, 129, 0); }
    }

    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
      font-size: 1.25rem;
      font-weight: 800;
      padding: 1.25rem 2.5rem;
      border-radius: 16px;
      text-decoration: none;
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 40px rgba(16, 185, 129, 0.4);
      transition: all 0.3s ease;
      animation: slideUp 0.6s ease-out 0.6s both;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .cta-button:hover {
      transform: translateY(-2px);
      box-shadow: 0 15px 50px rgba(16, 185, 129, 0.5);
    }

    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1.5rem;
      margin-top: 3rem;
      animation: fadeIn 0.8s ease-out 0.9s both;
    }

    .feature {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      padding: 1.5rem 1rem;
      border-radius: 12px;
      transition: all 0.3s ease;
    }

    .feature:hover {
      background: rgba(255, 255, 255, 0.08);
      transform: translateY(-4px);
    }

    .feature-icon {
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }

    .feature-text {
      font-size: 0.9rem;
      color: #cbd5e1;
      font-weight: 600;
    }

    .spinner {
      display: none;
      width: 40px;
      height: 40px;
      margin: 2rem auto 0;
      border: 4px solid rgba(16, 185, 129, 0.2);
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .spinner.active {
      display: block;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .signing-in {
      display: none;
      margin-top: 1rem;
      color: #94a3b8;
      font-size: 0.9rem;
    }

    .signing-in.active {
      display: block;
    }

    @media (max-width: 640px) {
      h1 { font-size: 2rem; }
      .subtitle { font-size: 1.1rem; }
      .cta-button { font-size: 1.1rem; padding: 1rem 2rem; }
      .features { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">✓</div>
    
    <h1>Welcome, ${firstName}! 🎉</h1>
    
    <p class="subtitle">
      Your email is verified and your free trial is active.<br>
      Let's find your next government contract!
    </p>
    
    <div class="trial-badge">
      🎁 ${trialDaysRemaining} days of full access remaining
    </div>
    
    <button class="cta-button" id="ctaBtn">
      Let's Get to Work! 🚀
    </button>

    <div class="features">
      <div class="feature">
        <div class="feature-icon">🔍</div>
        <div class="feature-text">Search 1,000+ opportunities</div>
      </div>
      <div class="feature">
        <div class="feature-icon">🎯</div>
        <div class="feature-text">AI-powered matching</div>
      </div>
      <div class="feature">
        <div class="feature-icon">📊</div>
        <div class="feature-text">Real-time alerts</div>
      </div>
    </div>

    <div class="spinner" id="spinner"></div>
    <p class="signing-in" id="signingIn">Signing you in securely...</p>
  </div>

  <script>
    const ctaBtn = document.getElementById('ctaBtn');
    const spinner = document.getElementById('spinner');
    const signingIn = document.getElementById('signingIn');

    ctaBtn.addEventListener('click', async () => {
      ctaBtn.style.display = 'none';
      spinner.classList.add('active');
      signingIn.classList.add('active');

      try {
        const response = await fetch('/api/auth/signin/credentials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: '${user.email}',
            autoLoginToken: '${token}',
            redirect: false,
            callbackUrl: '/search'
          })
        });

        if (response.ok) {
          // Redirect to search page with welcome flag
          window.location.href = '/search?welcome=true';
        } else {
          console.error('Auto-login failed:', await response.text());
          window.location.href = '/?error=auto-login-failed';
        }
      } catch (err) {
        console.error('Auto-login error:', err);
        window.location.href = '/?error=auto-login-failed';
      }
    });
  </script>
</body>
</html>
    `

    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    })

  } catch (error: any) {
    console.error('❌ Auto-login error:', error)
    return NextResponse.redirect(
      new URL('/?error=auto-login-failed', request.url)
    )
  }
}
