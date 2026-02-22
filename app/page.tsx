// app/page.tsx
'use client'
export const dynamic = 'force-dynamic'
import React, { useCallback, useEffect, useMemo, useState, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import {
  CheckCircle2, AlertCircle, Loader2, Eye, EyeOff, Shield,
  Search, FileText, Award, Zap, ArrowRight, Mail,
  LayoutDashboard, Briefcase, Bell, LineChart, CreditCard,
  Building, ShieldCheck, TrendingUp,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────
type Mode = 'login' | 'verify' | 'resend' | 'forgot' | 'reset'

function getMode(sp: ReturnType<typeof useSearchParams>): Mode {
  if (!sp) return 'login'
  const m = sp.get('mode')?.toLowerCase()
  if (m === 'verify') return 'verify'
  if (m === 'resend') return 'resend'
  if (m === 'forgot') return 'forgot'
  if (m === 'reset')  return 'reset'
  return 'login'
}

function getQueryToken(sp: ReturnType<typeof useSearchParams>) {
  if (!sp) return undefined
  return sp.get('token') || sp.get('verificationtoken') || sp.get('verifyToken') || sp.get('resettoken') || sp.get('resetToken') || undefined
}

async function safeJson(res: Response) {
  const text = await res.text()
  try { return JSON.parse(text) } catch { return { message: text } }
}

async function postWithFallback(endpoints: string[], body: Record<string, unknown>) {
  let lastErr: { ok: false; error: string } = { ok: false, error: 'No endpoints tried' }
  for (const url of endpoints) {
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      if (res.status === 404) { lastErr = { ok: false, error: `Not found: ${url}` }; continue }
      const json = await safeJson(res)
      if (!res.ok) return { ok: false as const, status: res.status, error: json?.error || json?.message || `Request failed (${res.status})`, data: json }
      return { ok: true as const, status: res.status, data: json }
    } catch (e: unknown) { lastErr = { ok: false, error: (e as Error)?.message || 'Network error' } }
  }
  return lastErr
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function Notice({ variant, title, description }: { variant: 'success'|'error'|'warning'|'info'; title: string; description?: string }) {
  const c = { success:{ bg:'rgba(22,163,74,0.12)', border:'rgba(22,163,74,0.4)', text:'#4ADE80' }, error:{ bg:'rgba(239,68,68,0.12)', border:'rgba(239,68,68,0.4)', text:'#FCA5A5' }, warning:{ bg:'rgba(245,158,11,0.12)', border:'rgba(245,158,11,0.4)', text:'#FCD34D' }, info:{ bg:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.4)', text:'#93C5FD' } }[variant]
  const Icon = variant === 'success' ? CheckCircle2 : variant === 'info' ? Shield : AlertCircle
  return (
    <div style={{ display:'flex', gap:'10px', padding:'10px 13px', borderRadius:'9px', fontSize:'12.5px', marginBottom:'12px', alignItems:'flex-start', background:c.bg, border:`1px solid ${c.border}`, color:c.text }}>
      <Icon style={{ width:'16px', height:'16px', flexShrink:0, marginTop:'1px' }} />
      <div><div style={{ fontWeight:700 }}>{title}</div>{description && <div style={{ fontSize:'11px', marginTop:'2px', opacity:0.85 }}>{description}</div>}</div>
    </div>
  )
}

function FormInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...props}
      style={{ width:'100%', height:'40px', background:'rgba(0,0,0,0.35)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:'8px', padding:'0 12px', fontSize:'13px', color:'#F1F5F9', fontFamily:'inherit', outline:'none', transition:'border-color 0.2s, box-shadow 0.2s', boxSizing:'border-box', ...props.style }}
      onFocus={e => { e.currentTarget.style.borderColor='#f97316'; e.currentTarget.style.boxShadow='0 0 0 3px rgba(249,115,22,0.12)'; props.onFocus?.(e) }}
      onBlur={e  => { e.currentTarget.style.borderColor='rgba(255,255,255,0.1)';  e.currentTarget.style.boxShadow='none'; props.onBlur?.(e)  }}
    />
  )
}

function PrimaryBtn({ children, loading, variant = 'green', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: 'green'|'orange' }) {
  const bg  = variant === 'green' ? 'linear-gradient(135deg,#16A34A,#15803D)' : 'linear-gradient(135deg,#f97316,#ea580c)'
  const shd = variant === 'green' ? '0 3px 12px rgba(22,163,74,0.28)' : '0 3px 12px rgba(249,115,22,0.28)'
  return (
    <button {...props} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'7px', width:'100%', height:'40px', borderRadius:'8px', fontFamily:'inherit', fontSize:'13px', fontWeight:700, cursor:props.disabled?'not-allowed':'pointer', border:'none', background:loading?'#475569':bg, color:'white', transition:'all 0.2s', opacity:props.disabled?0.5:1, boxShadow:loading?'none':shd, ...props.style }}
      onMouseEnter={e => { if(!props.disabled&&!loading){ e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.filter='brightness(1.08)' } }}
      onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.filter='' }}>
      {loading && <Loader2 style={{ width:'14px', height:'14px', animation:'spin 0.65s linear infinite' }} />}
      {children}
    </button>
  )
}

function SecondaryBtn(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button {...props} style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', gap:'7px', width:'100%', height:'40px', borderRadius:'8px', fontFamily:'inherit', fontSize:'13px', fontWeight:700, cursor:props.disabled?'not-allowed':'pointer', border:'1px solid rgba(255,255,255,0.12)', background:'rgba(255,255,255,0.04)', color:'#CBD5E1', transition:'all 0.2s', opacity:props.disabled?0.5:1, ...props.style }}
      onMouseEnter={e => { if(!props.disabled){ e.currentTarget.style.background='rgba(255,255,255,0.08)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.22)' } }}
      onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)' }}>
      {props.children}
    </button>
  )
}

const GoogleIcon = (<svg style={{ width:'16px', height:'16px' }} viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>)
const MicrosoftIcon = (<svg style={{ width:'16px', height:'16px' }} viewBox="0 0 24 24"><rect x="1" y="1" width="10.5" height="10.5" fill="#f25022"/><rect x="12.5" y="1" width="10.5" height="10.5" fill="#7fba00"/><rect x="1" y="12.5" width="10.5" height="10.5" fill="#00a4ef"/><rect x="12.5" y="12.5" width="10.5" height="10.5" fill="#ffb900"/></svg>)

// ─── Service cards ─────────────────────────────────────────────────────────────
const SERVICES = [
  { href:'/search',                            title:'Search',                  subtitle:'Live federal opportunities',       gradient:'from-emerald-600 to-blue-600',   Icon:Search,      badge:undefined        },
  { href:'/services/sam-registration',         title:'SAM Registration',        subtitle:'Expert guidance & support',        gradient:'from-blue-600 to-cyan-500',      Icon:FileText,    badge:'Most Popular'   },
  { href:'/services/set-aside-certifications', title:'Set-Aside Certifications',subtitle:'8(a), SDVOSB, HUBZone, WOSB',    gradient:'from-purple-600 to-pink-500',    Icon:ShieldCheck,  badge:'Gov Special'   },
  { href:'/services/proposal-writing',         title:'Proposal Writing',        subtitle:'Win-focused writing',              gradient:'from-orange-500 to-red-500',     Icon:Award,       badge:undefined        },
  { href:'/services/bid-no-bid-review',        title:'Bid/No-Bid Analysis',     subtitle:'Strategic pursuit decisions',      gradient:'from-indigo-600 to-blue-500',    Icon:Zap,         badge:'AI Powered'     },
  { href:'/services/capability-statements',    title:'Capability Statements',   subtitle:'Professional one-pagers',          gradient:'from-teal-500 to-emerald-500',   Icon:TrendingUp,  badge:undefined        },
]

// ─── Main ─────────────────────────────────────────────────────────────────────
function LandingPageContent() {
  const router = useRouter()
  const sp     = useSearchParams()
  const { status } = useSession()
  const mode  = useMemo(() => getMode(sp), [sp])
  const token = useMemo(() => getQueryToken(sp), [sp])

  const [email,     setEmail]     = useState('')
  const [password,  setPassword]  = useState('')
  const [password2, setPassword2] = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [showPw2,   setShowPw2]   = useState(false)
  const [busy,      setBusy]      = useState(false)
  const [notice,    setNotice]    = useState<null|{ variant:'success'|'error'|'warning'|'info'; title:string; description?:string }>(null)
  const [countdown, setCountdown] = useState<number|null>(null)
  const [activeTab, setActiveTab] = useState<'login'|'signup'>('login')

  const setUrlMode = useCallback((nextMode: Mode, params?: Record<string,string>) => {
    const q = new URLSearchParams(params); q.set('mode', nextMode)
    router.push(`?${q.toString()}`, { scroll:false })
  }, [router])

  useEffect(() => { if (status === 'authenticated') router.push('/search') }, [status, router])

  useEffect(() => {
    if (countdown === null) return
    if (countdown > 0) { const t = setTimeout(() => setCountdown(c => (c??1)-1), 1000); return () => clearTimeout(t) }
    setUrlMode('login')
  }, [countdown, setUrlMode])

  useEffect(() => {
    if (mode !== 'verify' || !token || busy) return
    setBusy(true)
    ;(async () => {
      try {
        const res = await postWithFallback(['/api/auth/verify','/api/auth/verify-email'], { token })
        if (res.ok) { setNotice({ variant:'success', title:'Email verified!', description:'Redirecting in 5 seconds…' }); setCountdown(5) }
        else setNotice({ variant:'error', title:'Verification failed', description: res.error || 'Please try again.' })
      } catch { setNotice({ variant:'error', title:'Verification failed', description:'Please try again.' }) }
      finally { setBusy(false) }
    })()
  }, [mode, token]) // eslint-disable-line

  useEffect(() => { const t=getQueryToken(sp); if(!t||sp?.get('mode')) return; setUrlMode('verify') }, [sp, setUrlMode])

  useEffect(() => {
    const autoLogin=sp?.get('autoLogin'), emailParam=sp?.get('email'), verified=sp?.get('verified')
    if (autoLogin==='true'&&emailParam&&verified==='true') {
      setEmail(decodeURIComponent(emailParam))
      setNotice({ variant:'success', title:'✅ Email Verified!', description:'Your trial is active. Enter your password below to sign in.' })
      setUrlMode('login')
    }
  }, [sp]) // eslint-disable-line

  const onLogin = useCallback(async () => {
    setBusy(true); setNotice(null)
    const preCheck = await fetch('/api/auth/pre-login-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    if (!preCheck.ok) {
      const data = await preCheck.json().catch(() => ({}))
      setBusy(false)
      if (data.code === 'SUSPENDED') {
        setNotice({ variant:'error', title:'Account suspended', description:'Your account has been suspended. Contact support@precisegovcon.com.' })
        return
      }
    }
    const result = await signIn('credentials', { redirect:false, email, password, callbackUrl:'/search' })
    setBusy(false)
    if (result?.error) {
      const msg = String(result.error)
      if (msg.toLowerCase().includes('not verified')) { setNotice({ variant:'warning', title:'Email verification required', description:'We can send you a new verification link.' }); setUrlMode('resend'); return }
      if (msg.toLowerCase().includes('account not found')||msg.toLowerCase().includes('no user')) { setNotice({ variant:'error', title:'Account not found', description:'No account exists with this email address.' }); return }
      if (msg.toLowerCase().includes('suspended')) { setNotice({ variant:'error', title:'Account suspended', description:'Your account has been suspended. Contact support@precisegovcon.com.' }); return }
      setNotice({ variant:'error', title:'Login failed', description:'Incorrect email or password.' }); return
    }
    window.location.href = '/search'
  }, [email, password, setUrlMode])

  const onGoogle    = useCallback(() => { setBusy(true); signIn('google',             { callbackUrl:'/search', redirect:true }) }, [])
  const onMicrosoft = useCallback(() => { setBusy(true); signIn('microsoft-entra-id', { callbackUrl:'/search', redirect:true }) }, [])

  const onResend = useCallback(async () => {
    setBusy(true); setNotice(null)
    const res = await postWithFallback(['/api/auth/resend-verification','/api/auth/send-verification'], { email })
    setBusy(false)
    if (!res.ok) { setNotice({ variant:'error', title:'Resend failed', description:res.error||'Please try again.' }); return }
    setNotice({ variant:'success', title:'Verification email sent', description:'Please check your inbox.' })
  }, [email])

  const onForgot = useCallback(async () => {
    setBusy(true); setNotice(null)
    const res = await postWithFallback(['/api/auth/forgot-password','/api/forgot-password'], { email })
    setBusy(false)
    if (!res.ok) { setNotice({ variant:'error', title:'Request failed', description:res.error||'Please try again.' }); return }
    setNotice({ variant:'success', title:'Reset link sent', description:'Check your email.' })
    setTimeout(() => setUrlMode('login'), 3000)
  }, [email, setUrlMode])

  const onReset = useCallback(async () => {
    if (!token) { setNotice({ variant:'error', title:'Missing reset token', description:'Please use the link from your email.' }); return }
    if (password.length < 8) { setNotice({ variant:'warning', title:'Password too short', description:'Use at least 8 characters.' }); return }
    if (password !== password2) { setNotice({ variant:'warning', title:'Passwords do not match' }); return }
    setBusy(true); setNotice(null)
    const res = await postWithFallback(['/api/auth/reset-password','/api/reset-password'], { token, password })
    setBusy(false)
    if (!res.ok) { setNotice({ variant:'error', title:'Reset failed', description:res.error||'Your link may have expired.' }); return }
    setPassword(''); setPassword2('')
    setNotice({ variant:'success', title:'Password updated!', description:'You can now sign in with your new password.' })
    setUrlMode('login')
  }, [password, password2, setUrlMode, token])

  if (status === 'loading') {
    return <div className="flex min-h-screen items-center justify-center bg-slate-900"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
  }

  // ─── Auth form ───────────────────────────────────────────────────────────
  const fieldLabel = (text: string) => (
    <label style={{ display:'block', fontSize:'11px', fontWeight:600, color:'#94A3B8', marginBottom:'5px', letterSpacing:'0.04em', textTransform:'uppercase' }}>{text}</label>
  )

  const authForm = (
    <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
      {notice && <Notice variant={notice.variant} title={notice.title} description={notice.description} />}
      {countdown !== null && countdown >= 0 && (
        <p style={{ textAlign:'center', fontSize:'12px', color:'#94A3B8' }}>Redirecting in <strong style={{ color:'#4ADE80' }}>{countdown}</strong>s…</p>
      )}

      {/* ── LOGIN ── */}
      {mode === 'login' && (
        <>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            <SecondaryBtn onClick={onGoogle}    disabled={busy}>{GoogleIcon}    Continue with Google</SecondaryBtn>
            <SecondaryBtn onClick={onMicrosoft} disabled={busy}>{MicrosoftIcon} Continue with Microsoft</SecondaryBtn>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'8px', margin:'4px 0', fontSize:'10.5px', color:'#64748b', fontWeight:500 }}>
            <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />or sign in with email<div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }} />
          </div>
          <div>{fieldLabel('Email')}<FormInput value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" type="email" autoComplete="email" /></div>
          <div>
            {fieldLabel('Password')}
            <div style={{ position:'relative' }}>
              <FormInput value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" type={showPw?'text':'password'} autoComplete="current-password" style={{ paddingRight:'40px' }} />
              <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'3px', display:'flex' }} onMouseEnter={e=>e.currentTarget.style.color='#f1f5f9'} onMouseLeave={e=>e.currentTarget.style.color='#94A3B8'}>
                {showPw ? <EyeOff style={{ width:'14px', height:'14px' }} /> : <Eye style={{ width:'14px', height:'14px' }} />}
              </button>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', marginTop:'-4px' }}>
            <button type="button" onClick={()=>setUrlMode('forgot')} style={{ background:'none', border:'none', fontSize:'11.5px', fontWeight:600, color:'#fb923c', cursor:'pointer', fontFamily:'inherit', padding:0 }} onMouseEnter={e=>e.currentTarget.style.color='#f97316'} onMouseLeave={e=>e.currentTarget.style.color='#fb923c'}>Forgot password?</button>
          </div>
          <PrimaryBtn onClick={onLogin} loading={busy}>Sign In</PrimaryBtn>
          <p style={{ textAlign:'center', fontSize:'12px', color:'#64748b', marginTop:'4px' }}>
            No account?{' '}
            <Link href="/signup" style={{ color:'#fb923c', fontWeight:700, textDecoration:'none' }}>Create one free →</Link>
            {' · '}
            <button type="button" onClick={()=>setUrlMode('resend')} style={{ background:'none', border:'none', color:'#64748b', cursor:'pointer', fontFamily:'inherit', padding:0 }}>Resend verify</button>
          </p>
        </>
      )}

      {/* ── VERIFY ── */}
      {mode === 'verify' && (
        <>
          <div style={{ textAlign:'center', padding:'12px 0' }}>
            <div style={{ width:'52px', height:'52px', background:'rgba(22,163,74,0.1)', border:'2px solid #16A34A', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px' }}>
              <Mail style={{ width:'22px', height:'22px', color:'#4ADE80' }} />
            </div>
            <p style={{ fontSize:'13px', color:'#94A3B8', lineHeight:1.6 }}>Click the link in your email to verify your account and activate your free trial.</p>
          </div>
          {!token && <Notice variant="info" title="Use the link from your email" />}
          {busy   && <Notice variant="info" title="Verifying…" description="Just a moment." />}
          <SecondaryBtn onClick={()=>setUrlMode('login')} disabled={busy}>← Back to Sign In</SecondaryBtn>
        </>
      )}

      {/* ── RESEND ── */}
      {mode === 'resend' && (
        <>
          <div>{fieldLabel('Email')}<FormInput value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" type="email" /></div>
          <PrimaryBtn onClick={onResend} loading={busy} variant="orange">Send Verification Link</PrimaryBtn>
          <SecondaryBtn onClick={()=>setUrlMode('login')} disabled={busy}>← Back to Sign In</SecondaryBtn>
        </>
      )}

      {/* ── FORGOT ── */}
      {mode === 'forgot' && (
        <>
          <div>{fieldLabel('Email')}<FormInput value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@company.com" type="email" autoFocus /></div>
          <PrimaryBtn onClick={onForgot} loading={busy} variant="orange">Send Reset Link</PrimaryBtn>
          <SecondaryBtn onClick={()=>setUrlMode('login')} disabled={busy}>← Back to Sign In</SecondaryBtn>
        </>
      )}

      {/* ── RESET ── */}
      {mode === 'reset' && (
        <>
          {!token
            ? <Notice variant="error" title="Reset link issue" description="Your link is missing a token." />
            : <>
                <div>
                  {fieldLabel('New Password')}
                  <div style={{ position:'relative' }}>
                    <FormInput value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password" type={showPw?'text':'password'} autoComplete="new-password" style={{ paddingRight:'40px' }} />
                    <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'3px', display:'flex' }}>
                      {showPw ? <EyeOff style={{ width:'14px', height:'14px' }} /> : <Eye style={{ width:'14px', height:'14px' }} />}
                    </button>
                  </div>
                </div>
                <div>
                  {fieldLabel('Confirm Password')}
                  <div style={{ position:'relative' }}>
                    <FormInput value={password2} onChange={e=>setPassword2(e.target.value)} placeholder="Confirm password" type={showPw2?'text':'password'} autoComplete="new-password" style={{ paddingRight:'40px' }} />
                    <button type="button" onClick={()=>setShowPw2(v=>!v)} style={{ position:'absolute', right:'10px', top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94A3B8', padding:'3px', display:'flex' }}>
                      {showPw2 ? <EyeOff style={{ width:'14px', height:'14px' }} /> : <Eye style={{ width:'14px', height:'14px' }} />}
                    </button>
                  </div>
                </div>
              </>
          }
          <PrimaryBtn onClick={onReset} loading={busy}>Update Password</PrimaryBtn>
          <SecondaryBtn onClick={()=>setUrlMode('login')} disabled={busy}>← Back to Sign In</SecondaryBtn>
        </>
      )}
    </div>
  )

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <style>{`
        @keyframes spin      { to { transform:rotate(360deg); } }
        @keyframes blobDrift { 0%,100%{transform:translate(0,0)scale(1)}33%{transform:translate(30px,-25px)scale(1.05)}66%{transform:translate(-18px,32px)scale(0.97)} }
        @keyframes pulseDot  { 0%,100%{opacity:1}50%{opacity:0.35} }
        .page-blob { position:fixed; border-radius:50%; filter:blur(100px); pointer-events:none; animation:blobDrift 22s ease-in-out infinite; }
        .svc-card  { transition:all 0.2s; }
        .svc-card:hover { border-color:rgba(249,115,22,0.45)!important; transform:translateY(-3px); box-shadow:0 10px 28px rgba(0,0,0,0.4)!important; }
      `}</style>

      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="page-blob w-[480px] h-[480px] bg-emerald-500/8 -top-40 -left-24" />
        <div className="page-blob w-[400px] h-[400px] bg-orange-500/7 -bottom-28 -right-16" style={{ animationDelay:'-9s' }} />
        <div className="absolute inset-0" style={{ backgroundImage:'linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px)', backgroundSize:'48px 48px' }} />
      </div>

      {/* 80% container */}
      <div className="relative z-10 w-[80%] mx-auto" style={{ minWidth:'320px' }}>

        {/* ── HERO + AUTH ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 py-8 items-start">

          {/* LEFT: Hero */}
          <div className="flex flex-col gap-5">

            {/* Trial badge */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide text-emerald-400 bg-emerald-500/10 border border-emerald-500/25">
              <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#4ADE80', animation:'pulseDot 2s ease-in-out infinite', flexShrink:0, display:'inline-block' }} />
              7-Day Free Trial — No Credit Card Required
            </div>

            {/* Logo + wordmark */}
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="Precise GovCon" width={56} height={56} className="w-12 h-12 rounded-xl" />
              <div>
                <div className="text-2xl lg:text-3xl font-black leading-none tracking-tight">
                  <span className="text-white">PRECISE</span>{' '}
                  <span className="text-[#f97316]">GOVCON</span>
                </div>
                <div className="text-xs text-slate-400 font-medium tracking-wide mt-1">
                  Contracting Intelligence and Procurement Experts
                </div>
              </div>
            </div>

            {/* Headline */}
            <h1 className="text-4xl lg:text-5xl font-black leading-[1.08] tracking-tight text-slate-100">
              Find<span className="text-[#f97316]">.</span>{' '}
              Qualify<span className="text-[#f97316]">.</span>{' '}
              <span className="text-emerald-400">Win.</span>
            </h1>

            {/* Description */}
            <p className="text-sm lg:text-base text-slate-400 leading-relaxed max-w-[460px]">
              Your trusted partner in government contracting success. Access live federal, state &amp; local opportunities, expert proposal support, and AI-powered tools — built for minority-owned and veteran-owned small businesses.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white transition-all no-underline"
                style={{ background:'linear-gradient(135deg,#16A34A,#15803D)', boxShadow:'0 3px 12px rgba(22,163,74,0.28)' }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-1px)'; e.currentTarget.style.filter='brightness(1.08)' }}
                onMouseLeave={e => { e.currentTarget.style.transform='translateY(0)'; e.currentTarget.style.filter='' }}
              >
                <Zap className="w-4 h-4" /> Get Started Free
              </Link>
              <Link href="/search" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-slate-300 border border-white/12 bg-transparent transition-all hover:border-white/28 hover:text-white no-underline">
                <Search className="w-4 h-4" /> Browse Opportunities
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 pt-1">
              {[
                { val:'$2.4B+', label:'Contract Value',   color:'text-slate-100'   },
                { val:'15+',    label:'Years Experience', color:'text-[#f97316]'   },
                { val:'98%',    label:'Client Retention', color:'text-emerald-400' },
              ].map(({ val, label, color }) => (
                <div key={label}>
                  <div className={`text-xl font-black ${color} leading-none`}>{val}</div>
                  <div className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Auth panel */}
          <div className="rounded-2xl p-6 border" style={{ background:'rgba(30,41,59,0.8)', border:'1px solid rgba(255,255,255,0.09)', backdropFilter:'blur(20px)' }}>

            {/* Tab switcher */}
            <div className="grid grid-cols-2 rounded-xl p-1 mb-5" style={{ background:'rgba(0,0,0,0.3)' }}>
              {(['login','signup'] as const).map(tab => (
                <button key={tab}
                  onClick={() => {
                    if (tab === 'signup') {
                      router.push('/signup')
                    } else {
                      setActiveTab('login')
                    }
                  }}
                  className="py-2 rounded-lg text-sm font-bold transition-all"
                  style={{
                    background: activeTab === tab ? '#f97316' : 'transparent',
                    color: activeTab === tab ? 'white' : '#94A3B8',
                    boxShadow: activeTab === tab ? '0 2px 8px rgba(249,115,22,0.3)' : 'none',
                  }}>
                  {tab === 'login' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Mode heading */}
            <div className="text-center mb-4">
              {mode==='login'  && <><h2 className="text-lg font-bold text-slate-100">Welcome back</h2><p className="text-xs text-slate-400 mt-0.5">Access your Precise GovCon dashboard</p></>}
              {mode==='verify' && <><h2 className="text-lg font-bold text-slate-100">Check Your Email</h2><p className="text-xs text-slate-400 mt-0.5">We&apos;ve sent a verification link</p></>}
              {mode==='resend' && <><h2 className="text-lg font-bold text-slate-100">Resend Verification</h2><p className="text-xs text-slate-400 mt-0.5">Enter your email to get a new link</p></>}
              {mode==='forgot' && <><h2 className="text-lg font-bold text-slate-100">Reset Password</h2><p className="text-xs text-slate-400 mt-0.5">We&apos;ll email you a reset link</p></>}
              {mode==='reset'  && <><h2 className="text-lg font-bold text-slate-100">Create New Password</h2><p className="text-xs text-slate-400 mt-0.5">Minimum 8 characters</p></>}
            </div>

            {/* Auth form — always login mode content here, signup routes away */}
            {authForm}
          </div>
        </div>

        {/* ── SERVICE CARDS ── */}
        <div className="border-t border-white/8 pt-6 pb-8">

          <div className="flex items-center gap-3 mb-4">
            <span className="text-[10px] font-bold tracking-[0.12em] uppercase text-slate-500">Our Services</span>
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] font-bold text-orange-400 whitespace-nowrap">6 Core Solutions</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {SERVICES.map(({ href, title, subtitle, gradient, Icon, badge }) => (
              <Link key={href} href={href}
                className="svc-card flex flex-col rounded-xl overflow-hidden no-underline"
                style={{ background:'#1e293b', border:'1px solid rgba(255,255,255,0.09)', textDecoration:'none' }}>
                <div className={`relative h-14 bg-gradient-to-br ${gradient} overflow-hidden flex-shrink-0`}>
                  <Icon className="absolute bottom-1 right-1.5 w-8 h-8 text-white/18" />
                  {badge && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/30 backdrop-blur-sm text-white text-[8px] font-bold rounded-full">{badge}</span>
                  )}
                </div>
                <div className="flex items-start gap-2 p-2 border-t border-white/8">
                  <Icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-slate-100 leading-tight">{title}</div>
                    <div className="text-[9px] text-slate-500 leading-tight mt-0.5">{subtitle}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Quick nav links */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5 pt-4 border-t border-white/8">
            <span className="text-[9.5px] font-bold uppercase tracking-wider text-slate-600">Quick Links</span>
            {[
              { href:'/dashboard',     label:'Dashboard',         Icon:LayoutDashboard },
              { href:'/opportunities', label:'Opportunities',     Icon:Briefcase       },
              { href:'/alerts',        label:'Alerts & Searches', Icon:Bell            },
              { href:'/insights',      label:'Insights',          Icon:LineChart       },
              { href:'/services',      label:'All Services',      Icon:Building        },
              { href:'/pricing',       label:'Pricing',           Icon:CreditCard      },
              { href:'/support',       label:'Support',           Icon:Mail            },
            ].map(({ href, label, Icon: NavIcon }) => (
              <Link key={href} href={href} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-orange-400 transition-colors no-underline">
                <NavIcon className="w-3 h-3" />{label}
              </Link>
            ))}
          </div>
        </div>

      </div>{/* end 80% container */}
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <LandingPageContent />
    </Suspense>
  )
}
