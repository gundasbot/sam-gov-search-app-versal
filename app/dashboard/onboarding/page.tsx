'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { ArrowRight, Loader2, X, Check, Search, ChevronDown } from 'lucide-react'
import { NAICS_CODES } from '@/lib/naics-codes'
import { PSC_CODES } from '@/lib/psc-codes'
import { SET_ASIDE_CODES, US_STATES } from '@/lib/sam-gov-constants'

export const dynamic = 'force-dynamic'

// ─── Styles ─────────────────────────────────────────────────────────────────
const APTOS_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;0,9..40,900&display=swap');

  .aptos-root, .aptos-root * {
    font-family: 'DM Sans', ui-sans-serif, system-ui, sans-serif !important;
    -webkit-font-smoothing: antialiased;
  }
  .aptos-root input::placeholder { font-weight:400 !important; color:#94a3b8; }

  .onb-hero {
    background-color: #0f172a;
    border-bottom: 4px solid #f97316;
  }
  .onb-bar {
    background-color: #0f172a;
    border-bottom: 2px solid #f97316;
  }

  .sa-tooltip {
    position: fixed;
    background: #0f172a;
    color: #e2e8f0;
    border: 1px solid #334155;
    border-radius: 10px;
    padding: 10px 14px;
    width: 260px;
    z-index: 9999;
    pointer-events: none;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }
`

// ─── Set-Aside descriptions ──────────────────────────────────────────────────
const SA_DESC: Record<string, { full:string; agency:string; benefit:string }> = {
  'SBA':        { full:'Small Business Administration Set-Aside', agency:'SBA', benefit:'Reserved for small businesses meeting SBA size standards by NAICS code.' },
  'SDVOSB':     { full:'Service-Disabled Veteran-Owned Small Business', agency:'VA / SBA', benefit:'For businesses ≥51% owned/controlled by service-disabled veterans.' },
  'VOSB':       { full:'Veteran-Owned Small Business', agency:'VA', benefit:'For businesses ≥51% owned and controlled by veterans.' },
  'WOSB':       { full:"Women-Owned Small Business", agency:'SBA', benefit:'For businesses ≥51% owned/controlled by women in underrepresented industries.' },
  'EDWOSB':     { full:'Economically Disadvantaged Women-Owned Small Business', agency:'SBA', benefit:'Enhanced WOSB for women with personal net worth under $750K.' },
  'HUBZONE':    { full:'Historically Underutilized Business Zone', agency:'SBA', benefit:'For businesses in economically distressed areas — comes with a 10% price evaluation preference.' },
  'HUBZone':    { full:'Historically Underutilized Business Zone', agency:'SBA', benefit:'For businesses in economically distressed areas — comes with a 10% price evaluation preference.' },
  '8(a)':       { full:'8(a) Business Development Program', agency:'SBA', benefit:'Nine-year program for socially/economically disadvantaged small businesses; sole-source awards possible.' },
  'ABILITYONE': { full:'AbilityOne Program', agency:'U.S. AbilityOne Commission', benefit:'Mandatory source for agencies; for businesses employing blind/severely disabled workers.' },
  'ISBEE':      { full:'Indian Small Business Economic Enterprise', agency:'BIA', benefit:'Set-aside for Native American-owned small businesses on or near Indian reservations.' },
  'EMERGING_SMALL_BUSINESS': { full:'Emerging Small Business', agency:'SBA', benefit:'Subset of small business set-aside targeting the smallest firms within a size standard.' },
  'PARTIAL':    { full:'Partial Small Business Set-Aside', agency:'SBA', benefit:'Portion of a larger acquisition reserved exclusively for small businesses.' },
  'LOCAL_AREA_SET_ASIDE': { full:'Local Area Set-Aside', agency:'Varies', benefit:'Restricts competition to businesses physically located in a specific geographic area.' },
}
function getSAInfo(value: string) {
  return SA_DESC[value]
    || Object.entries(SA_DESC).find(([k]) =>
        value.toUpperCase().includes(k.toUpperCase()) || k.toUpperCase().includes(value.toUpperCase())
      )?.[1]
    || null
}

// ─── Style constants ─────────────────────────────────────────────────────────
const S = {
  orange:    { backgroundColor:'#f97316', color:'#ffffff' } as React.CSSProperties,
  orangeHov: { backgroundColor:'#ea580c', color:'#ffffff' } as React.CSSProperties,
} as const

type UserPreferences = {
  setAsides:string[]; naicsCodes:string[]; pscCodes:string[]
  keywords:string[]; states:string[]
  contractSizeMin?:number; contractSizeMax?:number
  completedOnboarding:boolean
}

const CONTRACT_SIZES = [
  { label:'Under $250K',  min:0,        max:250000   },
  { label:'$250K – $1M',  min:250000,   max:1000000  },
  { label:'$1M – $5M',    min:1000000,  max:5000000  },
  { label:'$5M – $25M',   min:5000000,  max:25000000 },
  { label:'$25M+',        min:25000000, max:undefined },
]

function firstName(session:any):string {
  const n = session?.user?.name?.trim?.() || ''
  if (n) return n.split(' ')[0]
  const e = session?.user?.email || ''
  return e.includes('@') ? e.split('@')[0] : 'there'
}

// ─── Pill ────────────────────────────────────────────────────────────────────
function Pill({ label, onRemove }: { label:string; onRemove:()=>void }) {
  const [h, setH] = useState(false)
  return (
    <button onClick={onRemove} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
      style={{ ...(h?S.orangeHov:S.orange), borderRadius:7, padding:'4px 9px', fontSize:13,
        fontWeight:900, display:'inline-flex', alignItems:'center', gap:4, whiteSpace:'nowrap',
        border:'none', cursor:'pointer', transition:'background 0.15s' }}>
      {label} <X style={{width:10,height:10,flexShrink:0}}/>
    </button>
  )
}

// ─── SetAsideChip (with fixed-position tooltip) ──────────────────────────────
function SetAsideChip({ value, label, selected, onClick }:
  { value:string; label:string; selected:boolean; onClick:()=>void }) {
  const [hov, setHov] = useState(false)
  const [pos, setPos] = useState({top:0,left:0})
  const btnRef = useRef<HTMLButtonElement>(null)
  const info = getSAInfo(value)

  function onEnter() {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setPos({ top: r.top + r.height/2 - 60, left: r.right + 12 })
    }
    setHov(true)
  }

  return (
    <>
      <button ref={btnRef}
        style={{ width:'100%', textAlign:'left', borderRadius:7, padding:'7px 10px',
          fontSize:15, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'space-between',
          gap:4, border:'2px solid', cursor:'pointer', transition:'all 0.15s',
          backgroundColor: selected?'#f97316': hov?'#fff7ed':'#fff',
          borderColor:     selected?'#f97316': hov?'#f97316':'#e2e8f0',
          color:           selected?'#fff':'#374151' }}
        onClick={onClick} onMouseEnter={onEnter} onMouseLeave={()=>setHov(false)}>
        <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label||value}</span>
        {selected && <Check style={{width:12,height:12,flexShrink:0}}/>}
      </button>
      {hov && info && (
        <div className="sa-tooltip" style={{top:pos.top, left:pos.left}}>
          <p style={{fontSize:13,fontWeight:900,color:'#f97316',margin:'0 0 3px'}}>{value}</p>
          <p style={{fontSize:12,fontWeight:700,color:'#e2e8f0',margin:'0 0 7px',lineHeight:1.4}}>{info.full}</p>
          <div style={{borderTop:'1px solid #334155',paddingTop:6,display:'flex',flexDirection:'column',gap:3}}>
            <p style={{fontSize:11,color:'#94a3b8',margin:0}}><span style={{fontWeight:700}}>Agency: </span>{info.agency}</p>
            <p style={{fontSize:11,color:'#cbd5e1',margin:0,lineHeight:1.5}}>{info.benefit}</p>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Generic Chip ────────────────────────────────────────────────────────────
function Chip({ label, selected, onClick }: { label:string; selected:boolean; onClick:()=>void }) {
  const [h,setH] = useState(false)
  return (
    <button
      style={{ width:'100%', textAlign:'left', borderRadius:7, padding:'7px 10px',
        fontSize:15, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'space-between',
        gap:4, border:'2px solid', cursor:'pointer', transition:'all 0.15s',
        backgroundColor: selected?'#f97316': h?'#fff7ed':'#fff',
        borderColor:     selected?'#f97316': h?'#f97316':'#e2e8f0',
        color:           selected?'#fff':'#374151' }}
      onClick={onClick} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>
      <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{label}</span>
      {selected && <Check style={{width:12,height:12,flexShrink:0}}/>}
    </button>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardOnboardingPage() {
  const router = useRouter()
  const { data:session, status } = useSession()
  const [nextPath, setNextPath] = useState('/dashboard')

  useEffect(() => {
    if (typeof window==='undefined') return
    const p = new URLSearchParams(window.location.search).get('next')
    if (p?.startsWith('/')) setNextPath(p)
  }, [])

  const [naicsSearch,   setNaicsSearch]   = useState('')
  const [pscSearch,     setPscSearch]     = useState('')
  const [keywordInput,  setKeywordInput]  = useState('')
  const [showKwResults, setShowKwResults] = useState(false)
  const [activeTab,     setActiveTab]     = useState<'naics'|'psc'|'keywords'>('naics')
  const [setAsideOpen,  setSetAsideOpen]  = useState(false)
  const [statesOpen,    setStatesOpen]    = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    setAsides:[],naicsCodes:[],pscCodes:[],keywords:[],states:[],
  })
  const timerRef = useRef<NodeJS.Timeout|null>(null)

  useEffect(() => {
    if (status==='unauthenticated') router.replace('/login?callbackUrl=/dashboard/onboarding')
  }, [status,router])

  useEffect(() => {
    let ok = true
    fetch('/api/account/preferences',{cache:'no-store'})
      .then(r=>r.ok?r.json():null)
      .then(d => {
        if (!ok||!d) return
        setPrefs({setAsides:d.setAsides||[],naicsCodes:d.naicsCodes||[],pscCodes:d.pscCodes||[],
          keywords:d.keywords||[],states:d.states||[],contractSizeMin:d.contractSizeMin,contractSizeMax:d.contractSizeMax})
      }).catch(()=>{})
    return ()=>{ok=false}
  }, [nextPath])

  const autoSave = useCallback((p:Partial<UserPreferences>) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaving(true)
    timerRef.current = setTimeout(async()=>{
      try {
        await fetch('/api/account/preferences',{method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({...p,completedOnboarding:true})})
        setSaved(true); setTimeout(()=>setSaved(false),2500)
      } catch {} finally { setSaving(false) }
    },800)
  },[])

  const up = useCallback((u:Partial<UserPreferences>)=>{
    setPrefs(prev=>{ const n={...prev,...u}; autoSave(n); return n })
  },[autoSave])

  const tog = <T,>(arr:T[],v:T)=>arr.includes(v)?arr.filter(x=>x!==v):[...arr,v]

  const filteredNaics = useMemo(()=>{
    if (!naicsSearch.trim()) return []
    const q=naicsSearch.toLowerCase(), sel=new Set(prefs.naicsCodes||[])
    return NAICS_CODES.filter(c=>!sel.has(c.code)&&(c.code.includes(q)||c.title.toLowerCase().includes(q)||c.description?.toLowerCase().includes(q))).slice(0,20)
  },[naicsSearch,prefs.naicsCodes])

  const filteredPsc = useMemo(()=>{
    if (!pscSearch.trim()) return []
    const q=pscSearch.toLowerCase(), sel=new Set(prefs.pscCodes||[])
    return PSC_CODES.filter(c=>!sel.has(c.code)&&(c.code.toLowerCase().includes(q)||c.title.toLowerCase().includes(q)||c.description?.toLowerCase().includes(q)||c.category?.toLowerCase().includes(q))).slice(0,20)
  },[pscSearch,prefs.pscCodes])

  const kwResults = useMemo(()=>{
    if (!keywordInput.trim()) return {naics:[],psc:[]}
    const q=keywordInput.toLowerCase(), sn=new Set(prefs.naicsCodes||[]), sp=new Set(prefs.pscCodes||[])
    return {
      naics:NAICS_CODES.filter(c=>!sn.has(c.code)&&(c.code.includes(q)||c.title.toLowerCase().includes(q)||c.description?.toLowerCase().includes(q))).slice(0,8),
      psc:  PSC_CODES.filter(c=>!sp.has(c.code)&&(c.code.toLowerCase().includes(q)||c.title.toLowerCase().includes(q)||c.description?.toLowerCase().includes(q)||c.category?.toLowerCase().includes(q))).slice(0,8),
    }
  },[keywordInput,prefs.naicsCodes,prefs.pscCodes])

  const total=(prefs.setAsides?.length||0)+(prefs.naicsCodes?.length||0)+(prefs.pscCodes?.length||0)+(prefs.states?.length||0)

  if (status==='loading') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a'}}>
      <Loader2 style={{width:32,height:32,color:'#f97316',animation:'spin 1s linear infinite'}}/>
    </div>
  )

  const inputSt:React.CSSProperties = {
    width:'100%',paddingLeft:34,paddingRight:30,paddingTop:8,paddingBottom:8,
    fontSize:15,borderRadius:8,border:'2px solid #e2e8f0',outline:'none',
    fontWeight:600,background:'#fff',color:'#0f172a',transition:'border 0.15s',
    fontFamily:'Aptos,DM Sans,Calibri,ui-sans-serif,system-ui,sans-serif',
  }

  const EmptyState=({msg,hint}:{msg:string;hint:string})=>(
    <div style={{textAlign:'center',padding:'20px 0',color:'#94a3b8'}}>
      <Search style={{width:22,height:22,margin:'0 auto 5px',opacity:0.2}}/>
      <p style={{fontSize:15,fontWeight:600}}>{msg}</p>
      <p style={{fontSize:12,marginTop:2,opacity:0.7}}>{hint}</p>
    </div>
  )

  const ResultRow=({title,onAdd}:{title:string;onAdd:()=>void})=>{
    const [h,setH]=useState(false)
    return (
      <button onClick={onAdd} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
        style={{width:'100%',textAlign:'left',padding:'8px 11px',border:'2px solid',
          borderColor:h?'#f97316':'#f1f5f9',borderRadius:8,background:h?'#fff7ed':'#fff',
          cursor:'pointer',transition:'all 0.15s',display:'flex',alignItems:'center',
          justifyContent:'space-between',gap:7,marginBottom:3,
          fontFamily:'Aptos,DM Sans,Calibri,ui-sans-serif,system-ui,sans-serif'}}>
        <span style={{fontSize:15,fontWeight:900,color:'#0f172a',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{title}</span>
        {h&&<span style={{fontSize:13,fontWeight:900,color:'#f97316',flexShrink:0}}>+ Add</span>}
      </button>
    )
  }

  const card:React.CSSProperties={background:'#fff',borderRadius:13,border:'1px solid #e2e8f0',padding:13,boxShadow:'0 1px 3px rgba(0,0,0,0.06)'}
  const badge=(color:string)=>({background:color,color:'#fff',fontSize:11,fontWeight:900,padding:'2px 8px',borderRadius:5,textTransform:'uppercase' as const,border:'none',display:'inline-block' as const,marginBottom:7})

  return (
    /* Outer wrapper matches dashboard exactly: mx-auto w-full max-w-[1920px] */
    <div className="aptos-root mx-auto w-full max-w-[1920px] min-h-screen" style={{background:'#f1f5f9'}}>
      <style dangerouslySetInnerHTML={{__html:APTOS_STYLE}}/>

      {/* Inner padding matches dashboard: px-3 sm:px-4 lg:px-6 xl:px-8 */}
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8 pb-10">

        {/* ── HERO — rounded card, same as dashboard hero section ── */}
        <section className="onb-hero rounded-2xl mb-3 shadow-md border border-slate-700 overflow-hidden">
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p style={{color:'#fb923c',fontSize:12,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:3}}>Profile Setup</p>
              <h1 style={{fontSize:'clamp(18px,2vw,26px)',fontWeight:900,color:'#fff',margin:0}}>
                Welcome, <span style={{color:'#fb923c'}}>{firstName(session)}</span> — Let&apos;s personalise your feed
              </h1>
              <p style={{color:'#94a3b8',fontSize:14,marginTop:3}}>Only see contracts that match your business. Changes save automatically.</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:9,flexShrink:0}}>
              {saved  && <span style={{display:'inline-flex',alignItems:'center',gap:5,background:'rgba(34,197,94,0.15)',border:'1px solid rgba(34,197,94,0.4)',borderRadius:7,padding:'5px 11px',fontSize:14,fontWeight:700,color:'#4ade80'}}><Check style={{width:13,height:13}}/>Saved</span>}
              {saving && <span style={{display:'inline-flex',alignItems:'center',gap:5,background:'#1e293b',border:'1px solid #334155',borderRadius:7,padding:'5px 11px',fontSize:14,fontWeight:700,color:'#94a3b8'}}><Loader2 style={{width:13,height:13}}/>Saving…</span>}
              <button onClick={()=>setShowModal(true)}
                style={{...S.orange,display:'inline-flex',alignItems:'center',gap:7,padding:'9px 18px',borderRadius:8,fontWeight:900,fontSize:15,border:'none',cursor:'pointer',boxShadow:'0 4px 14px rgba(249,115,22,0.3)'}}>
                Review &amp; Confirm <ArrowRight style={{width:14,height:14}}/>
              </button>
              <button onClick={()=>router.push('/dashboard')}
                style={{background:'#334155',color:'#cbd5e1',border:'none',borderRadius:8,padding:'9px 14px',fontWeight:700,fontSize:15,cursor:'pointer'}}>
                Skip
              </button>
            </div>
          </div>
        </section>

        {/* ── STICKY SELECTIONS BAR — sectioned by category, larger, with top margin so header doesn't clip it ── */}
        <div className="onb-bar rounded-2xl mb-3" style={{position:'sticky',top:8,zIndex:50,boxShadow:'0 6px 24px rgba(0,0,0,0.35)',marginTop:6}}>
          {total===0 ? (
            <div style={{padding:'14px 20px'}}>
              <p style={{color:'#64748b',fontSize:15,fontWeight:600,margin:0}}>No selections yet — make your choices below</p>
            </div>
          ) : (
            <div style={{padding:'12px 20px'}}>
              {/* Header row */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <p style={{color:'#fb923c',fontSize:13,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.12em',margin:0}}>
                  Your Selections <span style={{color:'#94a3b8',fontWeight:700}}>({total})</span>
                </p>
                <button onClick={()=>up({setAsides:[],naicsCodes:[],pscCodes:[],states:[],contractSizeMin:undefined,contractSizeMax:undefined})}
                  style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:6,padding:'4px 14px',fontSize:13,fontWeight:900,cursor:'pointer'}}>
                  Clear All
                </button>
              </div>

              {/* Sections stacked vertically — no horizontal overflow */}
              <div style={{display:'flex',flexDirection:'column',gap:7}}>

                {/* Set-Asides */}
                {(prefs.setAsides||[]).length>0 && (
                  <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'rgba(249,115,22,0.08)',border:'1px solid rgba(249,115,22,0.25)',borderRadius:10,padding:'7px 12px'}}>
                    <span style={{fontSize:11,fontWeight:900,color:'#fb923c',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:4,width:72,flexShrink:0}}>Set-Asides</span>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {(prefs.setAsides||[]).map(c=><Pill key={`sa-${c}`} label={c} onRemove={()=>up({setAsides:(prefs.setAsides||[]).filter(v=>v!==c)})}/>)}
                    </div>
                  </div>
                )}

                {/* NAICS — show first 6 then "+N more" */}
                {(prefs.naicsCodes||[]).length>0 && (
                  <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'rgba(79,70,229,0.08)',border:'1px solid rgba(79,70,229,0.25)',borderRadius:10,padding:'7px 12px'}}>
                    <span style={{fontSize:11,fontWeight:900,color:'#818cf8',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:4,width:44,flexShrink:0}}>NAICS</span>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5,flex:1}}>
                      {(prefs.naicsCodes||[]).slice(0,6).map(c=><Pill key={`n-${c}`} label={c} onRemove={()=>up({naicsCodes:(prefs.naicsCodes||[]).filter(v=>v!==c)})}/>)}
                      {(prefs.naicsCodes||[]).length>6 && (
                        <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,background:'rgba(129,140,248,0.15)',border:'1px solid rgba(129,140,248,0.4)',fontSize:12,fontWeight:900,color:'#818cf8'}}>
                          +{(prefs.naicsCodes||[]).length-6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* PSC */}
                {(prefs.pscCodes||[]).length>0 && (
                  <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'rgba(6,182,212,0.08)',border:'1px solid rgba(6,182,212,0.25)',borderRadius:10,padding:'7px 12px'}}>
                    <span style={{fontSize:11,fontWeight:900,color:'#22d3ee',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:4,width:44,flexShrink:0}}>PSC</span>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5,flex:1}}>
                      {(prefs.pscCodes||[]).slice(0,6).map(c=><Pill key={`p-${c}`} label={c} onRemove={()=>up({pscCodes:(prefs.pscCodes||[]).filter(v=>v!==c)})}/>)}
                      {(prefs.pscCodes||[]).length>6 && (
                        <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,background:'rgba(34,211,238,0.15)',border:'1px solid rgba(34,211,238,0.4)',fontSize:12,fontWeight:900,color:'#22d3ee'}}>
                          +{(prefs.pscCodes||[]).length-6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* States + Budget in one flex row */}
                {((prefs.states||[]).length>0 || prefs.contractSizeMin!==undefined) && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:7}}>
                    {(prefs.states||[]).length>0 && (
                      <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'rgba(5,150,105,0.08)',border:'1px solid rgba(5,150,105,0.25)',borderRadius:10,padding:'7px 12px',flex:1,minWidth:180}}>
                        <span style={{fontSize:11,fontWeight:900,color:'#34d399',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:4,width:44,flexShrink:0}}>States</span>
                        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                          {(prefs.states||[]).length===US_STATES.slice(1).length
                            ? <Pill label="All States" onRemove={()=>up({states:[]})}/>
                            : (prefs.states||[]).length>=10
                              ? <Pill label={`${(prefs.states||[]).length} States`} onRemove={()=>up({states:[]})}/>
                              : (prefs.states||[]).map(s=><Pill key={`st-${s}`} label={s} onRemove={()=>up({states:(prefs.states||[]).filter(v=>v!==s)})}/>)}
                        </div>
                      </div>
                    )}
                    {prefs.contractSizeMin!==undefined && (
                      <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'rgba(124,58,237,0.08)',border:'1px solid rgba(124,58,237,0.25)',borderRadius:10,padding:'7px 12px'}}>
                        <span style={{fontSize:11,fontWeight:900,color:'#a78bfa',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:4,width:48,flexShrink:0}}>Budget</span>
                        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                          <Pill label={`$${(prefs.contractSizeMin/1000).toFixed(0)}K${prefs.contractSizeMax?`–$${(prefs.contractSizeMax/1e6).toFixed(1)}M`:'+'}` }
                            onRemove={()=>up({contractSizeMin:undefined,contractSizeMax:undefined})}/>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

        {/* ── MAIN CONTENT GRID ── */}
        <div style={{paddingTop:8,paddingBottom:14}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:12,alignItems:'start'}}>

          {/* ── Step 1: Set-Asides ── */}
          <div style={{gridColumn:'span 2',...card}}>
            <span style={badge('#f97316')}>Step 1</span>
            <p style={{fontSize:18,fontWeight:900,color:'#0f172a',margin:'0 0 2px'}}>Set-Asides</p>
            <p style={{fontSize:15,color:'#374151',fontWeight:700,marginBottom:9}}>Business certifications</p>
            <p style={{fontSize:12,color:'#64748b',fontWeight:600,marginBottom:9,lineHeight:1.5,background:'#f8fafc',borderRadius:6,padding:'5px 8px',border:'1px solid #e2e8f0'}}>
              💡 Hover any option to see its description
            </p>
            <button onClick={()=>setSetAsideOpen(o=>!o)}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:8,border:'2px solid',borderColor:setAsideOpen?'#f97316':'#e2e8f0',background:'#f8fafc',cursor:'pointer',marginBottom:setAsideOpen?0:7}}>
              <span style={{fontSize:15,fontWeight:700,color:'#374151'}}>
                {(prefs.setAsides||[]).length===0?'None selected':`${(prefs.setAsides||[]).length} selected`}
              </span>
              <ChevronDown style={{width:15,height:15,color:'#f97316',transform:setAsideOpen?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
            </button>
            {setAsideOpen && (
              <div style={{border:'2px solid #f97316',borderTop:'none',borderRadius:'0 0 8px 8px',marginBottom:7}}>
                <div style={{display:'flex',gap:6,padding:'7px 9px',background:'#fff7ed',borderBottom:'1px solid #fed7aa'}}>
                  <button onClick={()=>up({setAsides:SET_ASIDE_CODES.filter(c=>c.value).map(c=>c.value)})}
                    style={{...S.orange,fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer'}}>All</button>
                  <button onClick={()=>up({setAsides:[]})}
                    style={{background:'#f1f5f9',color:'#475569',fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer'}}>None</button>
                </div>
                <div style={{maxHeight:250,overflowY:'auto',padding:'5px 7px',display:'flex',flexDirection:'column',gap:3}}>
                  {SET_ASIDE_CODES.filter(c=>c.value).map(code=>(
                    <SetAsideChip key={code.value} value={code.value} label={code.label||code.value}
                      selected={(prefs.setAsides||[]).includes(code.value)}
                      onClick={()=>up({setAsides:tog(prefs.setAsides||[],code.value)})}/>
                  ))}
                </div>
              </div>
            )}
            {(prefs.setAsides||[]).length>0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {(prefs.setAsides||[]).map(c=>(
                  <button key={c} onClick={()=>up({setAsides:(prefs.setAsides||[]).filter(v=>v!==c)})}
                    style={{...S.orange,fontSize:13,fontWeight:900,padding:'3px 8px',borderRadius:5,border:'none',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:3}}>
                    {c} <X style={{width:9,height:9}}/>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Steps 2 + 3 stacked in same 6 cols ── */}
          <div style={{gridColumn:'span 6',display:'flex',flexDirection:'column',gap:12}}>

            {/* Step 2: Industry & Services */}
            <div style={card}>
              <span style={badge('#4f46e5')}>Step 2</span>
              <p style={{fontSize:18,fontWeight:900,color:'#0f172a',margin:'0 0 2px'}}>Industry &amp; Services</p>
              <p style={{fontSize:15,color:'#374151',fontWeight:700,marginBottom:9}}>Search NAICS or PSC codes that describe your work</p>

              {/* Tabs */}
              <div style={{display:'flex',gap:3,background:'#f1f5f9',borderRadius:8,padding:3,marginBottom:9}}>
                {(['naics','psc','keywords'] as const).map(tab=>{
                  const count=tab==='naics'?prefs.naicsCodes?.length:tab==='psc'?prefs.pscCodes?.length:0
                  const active=activeTab===tab
                  return (
                    <button key={tab} onClick={()=>setActiveTab(tab)}
                      style={{flex:1,padding:'6px 4px',borderRadius:6,fontSize:13,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.05em',border:'none',cursor:'pointer',transition:'all 0.15s',
                        background:active?'#fff':'transparent',color:active?'#0f172a':'#94a3b8',
                        boxShadow:active?'0 1px 3px rgba(0,0,0,0.1)':'none'}}>
                      {tab==='naics'?('NAICS'+((count||0)>0?` (${count})`:'')):tab==='psc'?('PSC'+((count||0)>0?` (${count})`:'')):'Keyword'}
                    </button>
                  )
                })}
              </div>

              {/* Pills for active tab */}
              {activeTab==='naics'&&(prefs.naicsCodes||[]).length>0&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:4,padding:9,background:'#fff7ed',borderRadius:8,border:'1px solid #fed7aa',marginBottom:9}}>
                  {(prefs.naicsCodes||[]).map(c=><Pill key={c} label={c} onRemove={()=>up({naicsCodes:(prefs.naicsCodes||[]).filter(v=>v!==c)})}/>)}
                </div>
              )}
              {activeTab==='psc'&&(prefs.pscCodes||[]).length>0&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:4,padding:9,background:'#fff7ed',borderRadius:8,border:'1px solid #fed7aa',marginBottom:9}}>
                  {(prefs.pscCodes||[]).map(c=><Pill key={c} label={c} onRemove={()=>up({pscCodes:(prefs.pscCodes||[]).filter(v=>v!==c)})}/>)}
                </div>
              )}

              {/* NAICS */}
              {activeTab==='naics'&&(
                <div>
                  <div style={{position:'relative',marginBottom:7}}>
                    <Search style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#6366f1'}}/>
                    <input style={inputSt} placeholder='Search: "541512", "computer systems", "cybersecurity"…'
                      value={naicsSearch} onChange={e=>setNaicsSearch(e.target.value)}/>
                    {naicsSearch&&<button onClick={()=>setNaicsSearch('')} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8'}}><X style={{width:13,height:13}}/></button>}
                  </div>
                  {!naicsSearch?<EmptyState msg="Start typing to search NAICS codes" hint='Try: "541512", "engineering", "cybersecurity"'/>
                   :filteredNaics.length===0?<EmptyState msg={`No results for "${naicsSearch}"`} hint="Try a different keyword or code"/>
                   :<div style={{maxHeight:200,overflowY:'auto'}}>
                      <p style={{fontSize:13,fontWeight:700,color:'#6366f1',marginBottom:5}}>{filteredNaics.length} results — click to add</p>
                      {filteredNaics.map(c=><ResultRow key={c.code} title={`${c.code} — ${c.title}`} onAdd={()=>up({naicsCodes:[...(prefs.naicsCodes||[]),c.code]})}/>)}
                    </div>}
                </div>
              )}

              {/* PSC */}
              {activeTab==='psc'&&(
                <div>
                  <div style={{position:'relative',marginBottom:7}}>
                    <Search style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#3b82f6'}}/>
                    <input style={inputSt} placeholder='Search: "D302", "data processing", "logistics"…'
                      value={pscSearch} onChange={e=>setPscSearch(e.target.value)}/>
                    {pscSearch&&<button onClick={()=>setPscSearch('')} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8'}}><X style={{width:13,height:13}}/></button>}
                  </div>
                  {!pscSearch?<EmptyState msg="Start typing to search PSC codes" hint='Try: "D302", "software", "logistics"'/>
                   :filteredPsc.length===0?<EmptyState msg={`No results for "${pscSearch}"`} hint="Try a different keyword or code"/>
                   :<div style={{maxHeight:200,overflowY:'auto'}}>
                      <p style={{fontSize:13,fontWeight:700,color:'#3b82f6',marginBottom:5}}>{filteredPsc.length} results — click to add</p>
                      {filteredPsc.map(c=><ResultRow key={c.code} title={`${c.code} — ${c.title}`} onAdd={()=>up({pscCodes:[...(prefs.pscCodes||[]),c.code]})}/>)}
                    </div>}
                </div>
              )}

              {/* Keywords */}
              {activeTab==='keywords'&&(
                <div>
                  <div style={{position:'relative',marginBottom:7}}>
                    <Search style={{position:'absolute',left:9,top:'50%',transform:'translateY(-50%)',width:14,height:14,color:'#8b5cf6'}}/>
                    <input style={inputSt} placeholder='Type any keyword: "cloud", "cybersecurity", "AI"…'
                      value={keywordInput}
                      onChange={e=>{setKeywordInput(e.target.value);setShowKwResults(e.target.value.trim().length>0)}}
                      onBlur={()=>setTimeout(()=>setShowKwResults(false),200)}
                      onFocus={()=>setShowKwResults(keywordInput.trim().length>0)}/>
                    {keywordInput&&<button onClick={()=>{setKeywordInput('');setShowKwResults(false)}} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#94a3b8'}}><X style={{width:13,height:13}}/></button>}
                  </div>
                  {!keywordInput?<EmptyState msg="Search NAICS and PSC at once" hint='Try: "cloud","data","engineering","cybersecurity"'/>
                   :showKwResults&&(kwResults.naics.length>0||kwResults.psc.length>0)?(
                    <div style={{border:'2px solid #e2e8f0',borderRadius:8,overflow:'hidden',maxHeight:240,overflowY:'auto',boxShadow:'0 4px 16px rgba(0,0,0,0.1)'}}>
                      {kwResults.naics.length>0&&<>
                        <div style={{padding:'6px 11px',background:'#4f46e5'}}><p style={{color:'#fff',fontSize:12,fontWeight:900,textTransform:'uppercase',margin:0}}>NAICS Codes</p></div>
                        {kwResults.naics.map(c=><ResultRow key={c.code} title={`${c.code} — ${c.title}`} onAdd={()=>{up({naicsCodes:[...(prefs.naicsCodes||[]),c.code]});setKeywordInput('');setShowKwResults(false)}}/>)}
                      </>}
                      {kwResults.psc.length>0&&<>
                        <div style={{padding:'6px 11px',background:'#3b82f6'}}><p style={{color:'#fff',fontSize:12,fontWeight:900,textTransform:'uppercase',margin:0}}>PSC Codes</p></div>
                        {kwResults.psc.map(c=><ResultRow key={c.code} title={`${c.code} — ${c.title}`} onAdd={()=>{up({pscCodes:[...(prefs.pscCodes||[]),c.code]});setKeywordInput('');setShowKwResults(false)}}/>)}
                      </>}
                    </div>
                   ):keywordInput?<EmptyState msg={`No results for "${keywordInput}"`} hint="Try a different keyword"/>:null}
                </div>
              )}
            </div>

            {/* Step 3: Location — sits BELOW Step 2 in the same 6-col span */}
            <div style={card}>
              <span style={badge('#059669')}>Step 3</span>
              <p style={{fontSize:18,fontWeight:900,color:'#0f172a',margin:'0 0 2px'}}>Location</p>
              <p style={{fontSize:15,color:'#374151',fontWeight:700,marginBottom:9}}>States you can serve</p>
              <button onClick={()=>setStatesOpen(o=>!o)}
                style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:8,border:'2px solid',borderColor:statesOpen?'#059669':'#e2e8f0',background:'#f8fafc',cursor:'pointer',marginBottom:statesOpen?0:7}}>
                <span style={{fontSize:15,fontWeight:700,color:'#374151'}}>
                  {(prefs.states||[]).length===0?'None selected':(prefs.states||[]).length===US_STATES.slice(1).length?'All states':`${(prefs.states||[]).length} states selected`}
                </span>
                <ChevronDown style={{width:15,height:15,color:'#059669',transform:statesOpen?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
              </button>
              {statesOpen&&(
                <div style={{border:'2px solid #059669',borderTop:'none',borderRadius:'0 0 8px 8px',overflow:'hidden',marginBottom:7}}>
                  <div style={{display:'flex',gap:6,padding:'7px 9px',background:'#f0fdf4',borderBottom:'1px solid #bbf7d0'}}>
                    <button onClick={()=>up({states:US_STATES.slice(1).map(s=>s.value)})}
                      style={{background:'#059669',color:'#fff',fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer'}}>All</button>
                    <button onClick={()=>up({states:[]})}
                      style={{background:'#f1f5f9',color:'#475569',fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer'}}>None</button>
                  </div>
                  {/* 6 cols so all states visible without deep scrolling */}
                  <div style={{maxHeight:200,overflowY:'auto',padding:'5px 7px'}}>
                    <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:3}}>
                      {US_STATES.slice(1).map(s=>(
                        <Chip key={s.value} label={s.value} selected={(prefs.states||[]).includes(s.value)}
                          onClick={()=>up({states:tog(prefs.states||[],s.value)})}/>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {!statesOpen&&(prefs.states||[]).length>0&&(prefs.states||[]).length<US_STATES.slice(1).length&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                  {(prefs.states||[]).slice(0,12).map(s=>(
                    <button key={s} onClick={()=>up({states:(prefs.states||[]).filter(v=>v!==s)})}
                      style={{background:'#059669',color:'#fff',fontSize:13,fontWeight:900,padding:'3px 8px',borderRadius:5,border:'none',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:3}}>
                      {s} <X style={{width:9,height:9}}/>
                    </button>
                  ))}
                  {(prefs.states||[]).length>12&&<span style={{fontSize:13,fontWeight:700,color:'#64748b',alignSelf:'center'}}>+{(prefs.states||[]).length-12} more</span>}
                </div>
              )}
              {!statesOpen&&(prefs.states||[]).length===US_STATES.slice(1).length&&(
                <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'#059669',color:'#fff',fontSize:14,fontWeight:900,padding:'4px 11px',borderRadius:6}}>
                  <Check style={{width:12,height:12}}/> All states selected
                </div>
              )}
            </div>
          </div>

          {/* ── Step 4: Budget Range — promoted to right of Step 2 ── */}
          <div style={{gridColumn:'span 2',...card}}>
            <span style={badge('#7c3aed')}>Step 4</span>
            <p style={{fontSize:18,fontWeight:900,color:'#0f172a',margin:'0 0 2px'}}>Budget Range</p>
            <p style={{fontSize:15,color:'#374151',fontWeight:700,marginBottom:9}}>Target contract value</p>
            <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:11}}>
              {CONTRACT_SIZES.map(sz=>(
                <Chip key={sz.label} label={sz.label} selected={prefs.contractSizeMin===sz.min}
                  onClick={()=>up({contractSizeMin:sz.min,contractSizeMax:sz.max})}/>
              ))}
            </div>
            <div style={{borderTop:'1px solid #e2e8f0',paddingTop:9}}>
              <p style={{fontSize:11,fontWeight:900,color:'#94a3b8',textTransform:'uppercase',marginBottom:6}}>Custom</p>
              <div style={{display:'flex',gap:6}}>
                {[{label:'Min ($)',key:'min'},{label:'Max ($)',key:'max'}].map(f=>(
                  <div key={f.key} style={{flex:1}}>
                    <p style={{fontSize:11,color:'#94a3b8',fontWeight:700,marginBottom:3}}>{f.label}</p>
                    <input type="number" placeholder={f.key==='min'?'0':'Any'}
                      value={f.key==='min'?(prefs.contractSizeMin||''):(prefs.contractSizeMax||'')}
                      onChange={e=>up(f.key==='min'?{contractSizeMin:e.target.value?parseInt(e.target.value):undefined}:{contractSizeMax:e.target.value?parseInt(e.target.value):undefined})}
                      style={{width:'100%',padding:'6px 7px',fontSize:14,borderRadius:6,border:'2px solid #e2e8f0',fontWeight:600,outline:'none',fontFamily:'inherit',boxSizing:'border-box'}}/>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Step 5: Review CTA ── */}
          <div style={{gridColumn:'span 2',...card}}>
            <span style={badge('#f97316')}>Step 5</span>
            <p style={{fontSize:18,fontWeight:900,color:'#0f172a',margin:'0 0 2px'}}>Ready?</p>
            <p style={{fontSize:15,color:'#374151',fontWeight:700,marginBottom:12,lineHeight:1.5}}>Review your selections and go live.</p>

            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:7,marginBottom:12}}>
              {[
                {label:'Set-Asides',n:prefs.setAsides?.length||0},
                {label:'NAICS',     n:prefs.naicsCodes?.length||0},
                {label:'PSC Codes', n:prefs.pscCodes?.length||0},
                {label:'States',    n:prefs.states?.length||0},
              ].map(({label,n})=>(
                <div key={label} style={{background:'#f8fafc',border:'1px solid #e2e8f0',borderRadius:8,padding:'9px 5px',textAlign:'center'}}>
                  <p style={{fontSize:22,fontWeight:900,color:n>0?'#f97316':'#cbd5e1',margin:0}}>{n}</p>
                  <p style={{fontSize:13,color:'#374151',fontWeight:700,marginTop:2}}>{label}</p>
                </div>
              ))}
            </div>

            <button onClick={()=>setShowModal(true)}
              style={{...S.orange,width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px',borderRadius:8,fontWeight:900,fontSize:15,border:'none',cursor:'pointer',boxShadow:'0 2px 8px rgba(249,115,22,0.25)',marginBottom:7}}>
              Review &amp; Confirm <ArrowRight style={{width:14,height:14}}/>
            </button>
            <button onClick={()=>{up({completedOnboarding:true});setTimeout(()=>router.push('/dashboard'),500)}}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'8px',borderRadius:8,fontWeight:700,fontSize:14,border:'2px solid #e2e8f0',background:'#f8fafc',color:'#475569',cursor:'pointer',marginBottom:4}}>
              Save &amp; go to Dashboard
            </button>
            <button onClick={()=>router.push('/dashboard')}
              style={{width:'100%',textAlign:'center',padding:'5px',fontSize:13,fontWeight:600,color:'#94a3b8',background:'none',border:'none',cursor:'pointer'}}>
              Skip for now
            </button>
          </div>

        </div>
        </div>
      </div>{/* end px-3 inner padding */}

      {/* ── Confirmation Modal ── */}
      {showModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div style={{background:'#fff',borderRadius:18,boxShadow:'0 25px 60px rgba(0,0,0,0.3)',maxWidth:620,width:'100%',maxHeight:'90vh',overflowY:'auto',border:'1px solid #e2e8f0'}}>
            <div style={{background:'#0f172a',color:'#fff',padding:'16px 22px',borderRadius:'18px 18px 0 0',borderBottom:'4px solid #f97316',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0}}>
              <div>
                <p style={{fontSize:20,fontWeight:900,margin:0}}>Confirm Your Preferences</p>
                <p style={{fontSize:14,color:'#94a3b8',marginTop:2}}>Review selections before going live</p>
              </div>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',color:'#94a3b8',cursor:'pointer'}}><X style={{width:19,height:19}}/></button>
            </div>
            <div style={{padding:22,display:'flex',flexDirection:'column',gap:16}}>
              {(prefs.setAsides||[]).length>0&&(
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>Business Classifications</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {(prefs.setAsides||[]).map(c=><span key={c} style={{...S.orange,padding:'5px 11px',borderRadius:7,fontSize:15,fontWeight:900,border:'none'}}>{c}</span>)}
                  </div>
                </div>
              )}
              {(prefs.naicsCodes||[]).length>0&&(
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>NAICS Codes ({prefs.naicsCodes?.length})</p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5}}>
                    {(prefs.naicsCodes||[]).map(c=>{const o=NAICS_CODES.find(n=>n.code===c);return o?<div key={c} style={{padding:'7px 11px',borderRadius:7,border:'2px solid #fed7aa',background:'#fff7ed'}}><p style={{fontSize:15,fontWeight:900,color:'#0f172a',margin:0}}>{c} — {o.title}</p></div>:null})}
                  </div>
                </div>
              )}
              {(prefs.pscCodes||[]).length>0&&(
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>PSC Codes ({prefs.pscCodes?.length})</p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5}}>
                    {(prefs.pscCodes||[]).map(c=>{const o=PSC_CODES.find(p=>p.code===c);return o?<div key={c} style={{padding:'7px 11px',borderRadius:7,border:'2px solid #fed7aa',background:'#fff7ed'}}><p style={{fontSize:15,fontWeight:900,color:'#0f172a',margin:0}}>{c} — {o.title}</p></div>:null})}
                  </div>
                </div>
              )}
              {(prefs.states||[]).length>0&&(
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>Geographic Focus — {prefs.states?.length} state{(prefs.states?.length||0)!==1?'s':''}</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {(prefs.states||[]).map(s=><span key={s} style={{...S.orange,padding:'5px 9px',borderRadius:7,fontSize:14,fontWeight:900,border:'none'}}>{s}</span>)}
                  </div>
                </div>
              )}
              {prefs.contractSizeMin!==undefined&&(
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>Contract Size Range</p>
                  <span style={{...S.orange,display:'inline-block',padding:'7px 13px',borderRadius:7,fontSize:15,fontWeight:900,border:'none'}}>
                    ${prefs.contractSizeMin.toLocaleString()} – {prefs.contractSizeMax?`$${prefs.contractSizeMax.toLocaleString()}`:'Unlimited'}
                  </span>
                </div>
              )}
              {total===0&&<p style={{color:'#94a3b8',textAlign:'center',padding:'22px 0',fontSize:15}}>No preferences selected yet.</p>}
              <div style={{borderTop:'1px solid #e2e8f0',paddingTop:14,display:'flex',flexWrap:'wrap',justifyContent:'flex-end',gap:7}}>
                <button onClick={()=>setShowModal(false)} style={{padding:'9px 18px',borderRadius:8,border:'2px solid #e2e8f0',background:'#fff',color:'#374151',fontWeight:700,fontSize:15,cursor:'pointer'}}>Back to Editing</button>
                <button onClick={async()=>{
                  up({completedOnboarding:true})
                  // Warm up the AI feed in the background so dashboard loads instantly
                  fetch('/api/ai/personalized-feed',{method:'POST'}).catch(()=>{})
                  await new Promise(r=>setTimeout(r,600))
                  router.refresh()
                  router.push('/dashboard')
                }} style={{padding:'9px 18px',borderRadius:8,border:'none',background:'#334155',color:'#fff',fontWeight:900,fontSize:15,cursor:'pointer'}}>Go to Dashboard</button>
                <button onClick={async()=>{
                  up({completedOnboarding:true})
                  fetch('/api/ai/personalized-feed',{method:'POST'}).catch(()=>{})
                  await new Promise(r=>setTimeout(r,600))
                  router.refresh()
                  router.push('/opportunities')
                }}
                  style={{...S.orange,display:'inline-flex',alignItems:'center',gap:6,padding:'9px 18px',borderRadius:8,border:'none',fontWeight:900,fontSize:15,cursor:'pointer',boxShadow:'0 2px 8px rgba(249,115,22,0.25)'}}>
                  Browse Opportunities <ArrowRight style={{width:14,height:14}}/>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}