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
  .aptos-root input::placeholder { font-weight:500 !important; color:#475569; }

  .onb-hero {
    background: linear-gradient(135deg, #eaf3ff 0%, #f8fbff 100%);
    border: 1px solid #93c5fd;
    border-bottom: 4px solid #f97316;
  }
  .onb-bar {
    background-color: #ffffff;
    border: 1px solid #93c5fd;
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
  businessType?: string
  completedOnboarding:boolean
}

const CONTRACT_SIZES = [
  { label:'Under $250K',  min:0,        max:250000   },
  { label:'$250K – $1M',  min:250000,   max:1000000  },
  { label:'$1M – $5M',    min:1000000,  max:5000000  },
  { label:'$5M – $25M',   min:5000000,  max:25000000 },
  { label:'$25M+',        min:25000000, max:undefined },
]

const ALL_SET_ASIDES = SET_ASIDE_CODES.filter(c => typeof c.value === 'string' && c.value).map(c => c.value)
const ALL_STATES = US_STATES.slice(1).map(s => s.value)
const GUIDE_STEPS = [
  { title: 'Set-Asides', hint: 'Choose certifications' },
  { title: 'Industry', hint: 'Add NAICS / PSC / keywords' },
  { title: 'Location', hint: 'Choose service states' },
  { title: 'Budget', hint: 'Set contract range' },
  { title: 'Review', hint: 'Confirm and launch' },
] as const
const KEYWORD_SUGGESTIONS = [
  'cybersecurity',
  'cloud migration',
  'data analytics',
  'machine learning',
  'systems engineering',
  'program management',
  'logistics',
  'help desk',
]

function firstName(session:any):string {
  const n = session?.user?.name?.trim?.() || ''
  if (n) return n.split(' ')[0]
  const e = session?.user?.email || ''
  return e.includes('@') ? e.split('@')[0] : 'there'
}

function pickRandomSubset<T>(values: T[], min = 1, max = values.length): T[] {
  if (!values.length) return []
  const upper = Math.max(min, Math.min(max, values.length))
  const lower = Math.max(1, Math.min(min, upper))
  const count = lower + Math.floor(Math.random() * (upper - lower + 1))
  const shuffled = [...values]
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]
    shuffled[i] = shuffled[j]
    shuffled[j] = temp
  }
  return shuffled.slice(0, count)
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
  const [showSuccessToast, setShowSuccessToast] = useState(false)
  const [guideStep, setGuideStep] = useState(0)
  const [prefs, setPrefs] = useState<Partial<UserPreferences>>({
    setAsides:ALL_SET_ASIDES,naicsCodes:[],pscCodes:[],keywords:[],states:ALL_STATES,
  })
  const timerRef = useRef<NodeJS.Timeout|null>(null)
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    if (status==='unauthenticated') router.replace('/login?callbackUrl=/dashboard/onboarding')
  }, [status,router])

  useEffect(() => {
    let ok = true
    fetch('/api/account/preferences',{cache:'no-store'})
      .then(r=>r.ok?r.json():null)
      .then(d => {
        if (!ok||!d) return
        const useDefaultSetAsides = !d.completedOnboarding && (!Array.isArray(d.setAsides) || d.setAsides.length===0)
        const useDefaultStates = !d.completedOnboarding && (!Array.isArray(d.states) || d.states.length===0)
        setPrefs({
          setAsides:useDefaultSetAsides?ALL_SET_ASIDES:(d.setAsides||[]),
          naicsCodes:d.naicsCodes||[],
          pscCodes:d.pscCodes||[],
          keywords:d.keywords||[],
          states:useDefaultStates?ALL_STATES:(d.states||[]),
          contractSizeMin:d.contractSizeMin,
          contractSizeMax:d.contractSizeMax
        })
      }).catch(()=>{})
    return ()=>{ok=false}
  }, [nextPath])

  const normalizeBudgetPair = useCallback((minValue?: number, maxValue?: number) => {
    const min = typeof minValue === 'number' && Number.isFinite(minValue) ? minValue : undefined
    const max = typeof maxValue === 'number' && Number.isFinite(maxValue) ? maxValue : undefined
    if (typeof min === 'number' && typeof max === 'number' && min > max) {
      return { min: max, max: min }
    }
    return { min, max }
  }, [])

  const toPatchPayload = useCallback((p: Partial<UserPreferences>, completedOnboarding = true) => {
    const budget = normalizeBudgetPair(p.contractSizeMin, p.contractSizeMax)
    return {
      setAsides: Array.isArray(p.setAsides) ? p.setAsides : [],
      naicsCodes: Array.isArray(p.naicsCodes) ? p.naicsCodes : [],
      keywords: Array.isArray(p.keywords) ? p.keywords : [],
      states: Array.isArray(p.states) ? p.states : [],
      contractSizeMin: budget.min ?? null,
      contractSizeMax: budget.max ?? null,
      businessType: typeof p.businessType === 'string' && p.businessType.trim() ? p.businessType.trim() : 'SDVOSB',
      completedOnboarding,
    }
  }, [normalizeBudgetPair])

  const persistPrefs = useCallback(async (p: Partial<UserPreferences>) => {
    const payload = toPatchPayload(p, true)
    const res = await fetch('/api/account/preferences', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      const details = Array.isArray(data?.errors) ? data.errors.join('; ') : ''
      throw new Error(details || data?.error || 'Failed to save preferences')
    }
  }, [toPatchPayload])

  const autoSave = useCallback((p:Partial<UserPreferences>) => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setSaving(true)
    timerRef.current = setTimeout(async()=>{
      try {
        await persistPrefs(p)
        setSaved(true); setTimeout(()=>setSaved(false),2500)
      } catch {
        setSaved(false)
      } finally { setSaving(false) }
    },800)
  },[persistPrefs])

  const up = useCallback((u:Partial<UserPreferences>)=>{
    setPrefs(prev=>{
      const merged = { ...prev, ...u }
      const budget = normalizeBudgetPair(merged.contractSizeMin, merged.contractSizeMax)
      const next = { ...merged, contractSizeMin: budget.min, contractSizeMax: budget.max }
      autoSave(next)
      return next
    })
  },[autoSave, normalizeBudgetPair])

  const focusGuideStep = useCallback((index: number) => {
    const bounded = Math.max(0, Math.min(index, GUIDE_STEPS.length - 1))
    setGuideStep(bounded)
    sectionRefs.current[bounded]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [])

  const applyRandomSetAsides = useCallback(() => {
    const randomSetAsides = pickRandomSubset(ALL_SET_ASIDES, 2, Math.min(6, ALL_SET_ASIDES.length))
    up({ setAsides: randomSetAsides })
    setSetAsideOpen(true)
  }, [up])

  const applyRandomStates = useCallback(() => {
    const randomStates = pickRandomSubset(ALL_STATES, 4, Math.min(12, ALL_STATES.length))
    up({ states: randomStates })
    setStatesOpen(true)
  }, [up])

  const applyRandomBudget = useCallback(() => {
    if (!CONTRACT_SIZES.length) return
    const randomRange = CONTRACT_SIZES[Math.floor(Math.random() * CONTRACT_SIZES.length)]
    up({ contractSizeMin: randomRange.min, contractSizeMax: randomRange.max })
  }, [up])

  const finalizePreferences = useCallback(async (targetPath: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setSaving(true)
    try {
      await persistPrefs(prefs)
      if (typeof window !== 'undefined') {
        const emailKey = session?.user?.email?.toLowerCase?.() || 'anon'
        window.localStorage.setItem(`pgc-survey-dismissed:${emailKey}`, '1')
      }
      fetch('/api/ai/personalized-feed', { method: 'POST' }).catch(() => {})
      setSaved(true)
      setShowSuccessToast(true)
      await new Promise((resolve) => setTimeout(resolve, 900))
    } catch {
      // Save failed — navigate anyway so Skip/Confirm always work
    } finally {
      setSaving(false)
    }
    router.push(targetPath)
  }, [persistPrefs, prefs, router, session?.user?.email])

  const tog = <T,>(arr:T[],v:T)=>arr.includes(v)?arr.filter(x=>x!==v):[...arr,v]
  const addUnique = <T,>(arr: T[], values: T[]) => Array.from(new Set([...arr, ...values]))

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
  const budgetSummary = useMemo(() => {
    const min = typeof prefs.contractSizeMin === 'number' ? prefs.contractSizeMin : undefined
    const max = typeof prefs.contractSizeMax === 'number' ? prefs.contractSizeMax : undefined
    if (typeof min === 'number' && typeof max === 'number') {
      return {
        primary: `$${min.toLocaleString()} to $${max.toLocaleString()}`,
        secondary: `Floor: $${min.toLocaleString()} · Ceiling: $${max.toLocaleString()}`,
      }
    }
    if (typeof min === 'number') {
      return {
        primary: `$${min.toLocaleString()}+`,
        secondary: `Floor: $${min.toLocaleString()} · Ceiling: No limit`,
      }
    }
    if (typeof max === 'number') {
      return {
        primary: `Up to $${max.toLocaleString()}`,
        secondary: `Floor: none · Ceiling: $${max.toLocaleString()}`,
      }
    }
    return {
      primary: 'Any budget',
      secondary: 'Floor: none · Ceiling: none',
    }
  }, [prefs.contractSizeMin, prefs.contractSizeMax])

  const selectAllForActiveStepTwo = useCallback(() => {
    if (activeTab === 'naics') {
      const source = filteredNaics.length ? filteredNaics.map(code => code.code) : NAICS_CODES.slice(0, 30).map(code => code.code)
      up({ naicsCodes: addUnique(prefs.naicsCodes || [], source) })
      return
    }
    if (activeTab === 'psc') {
      const source = filteredPsc.length ? filteredPsc.map(code => code.code) : PSC_CODES.slice(0, 30).map(code => code.code)
      up({ pscCodes: addUnique(prefs.pscCodes || [], source) })
      return
    }
    up({ keywords: addUnique(prefs.keywords || [], KEYWORD_SUGGESTIONS) })
  }, [activeTab, addUnique, filteredNaics, filteredPsc, prefs.keywords, prefs.naicsCodes, prefs.pscCodes, up])

  const clearForActiveStepTwo = useCallback(() => {
    if (activeTab === 'naics') {
      up({ naicsCodes: [] })
      return
    }
    if (activeTab === 'psc') {
      up({ pscCodes: [] })
      return
    }
    up({ keywords: [] })
  }, [activeTab, up])

  const randomForActiveStepTwo = useCallback(() => {
    if (activeTab === 'naics') {
      up({ naicsCodes: pickRandomSubset(NAICS_CODES.map(code => code.code), 4, 8) })
      return
    }
    if (activeTab === 'psc') {
      up({ pscCodes: pickRandomSubset(PSC_CODES.map(code => code.code), 4, 8) })
      return
    }
    up({ keywords: pickRandomSubset(KEYWORD_SUGGESTIONS, 2, Math.min(5, KEYWORD_SUGGESTIONS.length)) })
  }, [activeTab, up])

  if (status==='loading') return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#0f172a'}}>
      <Loader2 style={{width:32,height:32,color:'#f97316',animation:'spin 1s linear infinite'}}/>
    </div>
  )

  const inputSt:React.CSSProperties = {
    width:'100%',
    paddingLeft:40,
    paddingRight:34,
    paddingTop:11,
    paddingBottom:11,
    fontSize:16,
    borderRadius:10,
    border:'3px solid #3b82f6',
    outline:'none',
    fontWeight:800,
    background:'#ffffff',
    color:'#0f172a',
    boxShadow:'0 2px 10px rgba(30,64,175,0.14)',
    transition:'all 0.15s',
    fontFamily:'Aptos,DM Sans,Calibri,ui-sans-serif,system-ui,sans-serif',
  }

  const EmptyState=({msg,hint}:{msg:string;hint:string})=>(
    <div style={{textAlign:'center',padding:'20px 0',color:'#334155'}}>
      <Search style={{width:22,height:22,margin:'0 auto 5px',color:'#1d4ed8'}}/>
      <p style={{fontSize:15,fontWeight:600}}>{msg}</p>
      <p style={{fontSize:12,marginTop:2,color:'#475569'}}>{hint}</p>
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
    /* Outer wrapper matches dashboard exactly: mx-auto w-full max-w-480 */
    <div className="aptos-root mx-auto w-full max-w-480 min-h-screen" style={{background:'#f1f5f9'}}>
      <style dangerouslySetInnerHTML={{__html:APTOS_STYLE}}/>

      {/* Inner padding matches dashboard: px-3 sm:px-4 lg:px-6 xl:px-8 */}
      <div className="px-3 sm:px-4 lg:px-6 xl:px-8 pb-10">

        {/* ── HERO — rounded card, same as dashboard hero section ── */}
        <section className="onb-hero rounded-2xl mb-3 shadow-md overflow-hidden">
          <div className="px-5 py-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p style={{color:'#c2410c',fontSize:13,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>Profile Setup</p>
              <h1 style={{fontSize:'clamp(22px,2.3vw,30px)',fontWeight:900,color:'#0f172a',margin:0}}>
                Welcome, <span style={{color:'#ea580c'}}>{firstName(session)}</span> — Let&apos;s personalise your feed
              </h1>
              <p style={{color:'#334155',fontSize:17,fontWeight:600,marginTop:4}}>Only see contracts that match your business. Changes save automatically.</p>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:9,flexShrink:0}}>
              {saved  && <span style={{display:'inline-flex',alignItems:'center',gap:5,background:'#16a34a',border:'1px solid #15803d',borderRadius:7,padding:'6px 12px',fontSize:15,fontWeight:800,color:'#ffffff'}}><Check style={{width:14,height:14}}/>Saved</span>}
              {saving && <span style={{display:'inline-flex',alignItems:'center',gap:5,background:'#1d4ed8',border:'1px solid #1e40af',borderRadius:7,padding:'6px 12px',fontSize:15,fontWeight:800,color:'#ffffff'}}><Loader2 style={{width:14,height:14}}/>Saving…</span>}
              <button onClick={()=>setShowModal(true)}
                style={{...S.orange,display:'inline-flex',alignItems:'center',gap:7,padding:'10px 18px',borderRadius:8,fontWeight:900,fontSize:16,border:'none',cursor:'pointer',boxShadow:'0 4px 14px rgba(249,115,22,0.3)'}}>
                Review &amp; Confirm <ArrowRight style={{width:14,height:14}}/>
              </button>
              <button onClick={()=>{ void finalizePreferences(nextPath) }}
                style={{background:'#334155',color:'#ffffff',border:'none',borderRadius:8,padding:'10px 14px',fontWeight:700,fontSize:15,cursor:'pointer'}}>
                Skip
              </button>
            </div>
          </div>
        </section>

        {/* ── STICKY SELECTIONS BAR — sectioned by category, larger, with top margin so header doesn't clip it ── */}
        <div className="onb-bar rounded-2xl mb-3" style={{position:'sticky',top:8,zIndex:50,boxShadow:'0 8px 20px rgba(30,64,175,0.16)',marginTop:6}}>
          {total===0 ? (
            <div style={{padding:'14px 20px'}}>
              <p style={{color:'#0f172a',fontSize:17,fontWeight:700,margin:0}}>No selections yet — make your choices below</p>
            </div>
          ) : (
            <div style={{padding:'12px 20px'}}>
              {/* Header row */}
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                <p style={{color:'#1d4ed8',fontSize:14,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.12em',margin:0}}>
                  Your Selections <span style={{color:'#334155',fontWeight:800}}>({total})</span>
                </p>
                <button onClick={()=>up({setAsides:[],naicsCodes:[],pscCodes:[],states:[],contractSizeMin:undefined,contractSizeMax:undefined})}
                  style={{background:'#ef4444',color:'#fff',border:'none',borderRadius:6,padding:'6px 14px',fontSize:14,fontWeight:900,cursor:'pointer'}}>
                  Clear All
                </button>
              </div>

              {/* Sections stacked vertically — no horizontal overflow */}
              <div style={{display:'flex',flexDirection:'column',gap:7}}>

                {/* Set-Asides */}
                {(prefs.setAsides||[]).length>0 && (
                  <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'#fff7ed',border:'1px solid #fdba74',borderRadius:10,padding:'7px 12px'}}>
                    <span style={{fontSize:11,fontWeight:900,color:'#fb923c',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:4,width:72,flexShrink:0}}>Set-Asides</span>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                      {(prefs.setAsides||[]).length===ALL_SET_ASIDES.length
                        ? <Pill label="All Set-Asides" onRemove={()=>up({setAsides:[]})}/>
                        : (prefs.setAsides||[]).map(c=><Pill key={`sa-${c}`} label={c} onRemove={()=>up({setAsides:(prefs.setAsides||[]).filter(v=>v!==c)})}/>)}
                    </div>
                  </div>
                )}

                {/* NAICS — show first 6 then "+N more" */}
                {(prefs.naicsCodes||[]).length>0 && (
                  <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'#eef2ff',border:'1px solid #a5b4fc',borderRadius:10,padding:'7px 12px'}}>
                    <span style={{fontSize:11,fontWeight:900,color:'#818cf8',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:4,width:44,flexShrink:0}}>NAICS</span>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5,flex:1}}>
                      {(prefs.naicsCodes||[]).slice(0,6).map(c=><Pill key={`n-${c}`} label={c} onRemove={()=>up({naicsCodes:(prefs.naicsCodes||[]).filter(v=>v!==c)})}/>)}
                      {(prefs.naicsCodes||[]).length>6 && (
                        <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,background:'#c7d2fe',border:'1px solid #818cf8',fontSize:12,fontWeight:900,color:'#312e81'}}>
                          +{(prefs.naicsCodes||[]).length-6} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* PSC */}
                {(prefs.pscCodes||[]).length>0 && (
                  <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'#ecfeff',border:'1px solid #67e8f9',borderRadius:10,padding:'7px 12px'}}>
                    <span style={{fontSize:11,fontWeight:900,color:'#22d3ee',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:4,width:44,flexShrink:0}}>PSC</span>
                    <div style={{display:'flex',flexWrap:'wrap',gap:5,flex:1}}>
                      {(prefs.pscCodes||[]).slice(0,6).map(c=><Pill key={`p-${c}`} label={c} onRemove={()=>up({pscCodes:(prefs.pscCodes||[]).filter(v=>v!==c)})}/>)}
                      {(prefs.pscCodes||[]).length>6 && (
                        <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',borderRadius:20,background:'#bae6fd',border:'1px solid #38bdf8',fontSize:12,fontWeight:900,color:'#0c4a6e'}}>
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
                      <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'#ecfdf5',border:'1px solid #34d399',borderRadius:10,padding:'7px 12px',flex:1,minWidth:180}}>
                        <span style={{fontSize:11,fontWeight:900,color:'#34d399',textTransform:'uppercase',letterSpacing:'0.08em',whiteSpace:'nowrap',marginTop:4,width:44,flexShrink:0}}>States</span>
                        <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                          {(prefs.states||[]).length===ALL_STATES.length
                            ? <Pill label="All States" onRemove={()=>up({states:[]})}/>
                            : (prefs.states||[]).length>=10
                              ? <Pill label={`${(prefs.states||[]).length} States`} onRemove={()=>up({states:[]})}/>
                              : (prefs.states||[]).map(s=><Pill key={`st-${s}`} label={s} onRemove={()=>up({states:(prefs.states||[]).filter(v=>v!==s)})}/>)}
                        </div>
                      </div>
                    )}
                    {prefs.contractSizeMin!==undefined && (
                      <div style={{display:'flex',alignItems:'flex-start',gap:8,background:'#f5f3ff',border:'1px solid #c4b5fd',borderRadius:10,padding:'7px 12px'}}>
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

        {/* Setup guide */}
        <section className="rounded-2xl mb-3" style={{background:'#ffffff',border:'1px solid #bfdbfe',boxShadow:'0 2px 10px rgba(30,64,175,0.08)',padding:'12px 16px'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,flexWrap:'wrap'}}>
            <p style={{fontSize:14,fontWeight:900,color:'#1d4ed8',textTransform:'uppercase',letterSpacing:'0.08em',margin:0}}>Guided setup</p>
            <div style={{display:'inline-flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:13,fontWeight:800,color:'#334155'}}>Step {guideStep + 1} of {GUIDE_STEPS.length}</span>
              <button
                type="button"
                onClick={() => focusGuideStep(Math.min(guideStep + 1, GUIDE_STEPS.length - 1))}
                style={{...S.orange,padding:'6px 12px',borderRadius:7,border:'none',fontSize:13,fontWeight:900,cursor:'pointer'}}
              >
                Next step
              </button>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(165px,1fr))',gap:8,marginTop:10}}>
            {GUIDE_STEPS.map((item, idx) => {
              const active = idx === guideStep
              return (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => focusGuideStep(idx)}
                  style={{
                    textAlign:'left',
                    borderRadius:10,
                    padding:'10px 11px',
                    cursor:'pointer',
                    border: active ? '2px solid #f97316' : '1px solid #bfdbfe',
                    background: active ? '#fff7ed' : '#f8fbff',
                    boxShadow: active ? '0 2px 10px rgba(249,115,22,0.16)' : 'none',
                  }}
                >
                  <p style={{fontSize:12,fontWeight:900,color:active ? '#c2410c' : '#1d4ed8',margin:0}}>{idx + 1}. {item.title}</p>
                  <p style={{fontSize:13,fontWeight:700,color:active ? '#7c2d12' : '#334155',margin:'3px 0 0'}}>{item.hint}</p>
                </button>
              )
            })}
          </div>
        </section>

        {/* ── MAIN CONTENT GRID ── */}
        <div style={{paddingTop:8,paddingBottom:14}}>
        <div style={{display:'grid',gridTemplateColumns:'repeat(12,1fr)',gap:12,alignItems:'start'}}>

          {/* ── Step 1: Set-Asides ── */}
          <div
            ref={(el) => { sectionRefs.current[0] = el }}
            onMouseEnter={() => setGuideStep(0)}
            style={{gridColumn:'span 2',...card,border:guideStep===0?'2px solid #f97316':card.border}}
          >
            <span style={badge('#f97316')}>Step 1</span>
            <p style={{fontSize:18,fontWeight:900,color:'#0f172a',margin:'0 0 2px'}}>Set-Asides</p>
            <p style={{fontSize:15,color:'#374151',fontWeight:700,marginBottom:9}}>Business certifications</p>
              <p style={{fontSize:12,color:'#334155',fontWeight:700,marginBottom:9,lineHeight:1.5,background:'#f8fafc',borderRadius:6,padding:'5px 8px',border:'1px solid #cbd5e1'}}>
                💡 Hover any option to see its description
              </p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:5,marginBottom:9}}>
              <button type="button" onClick={()=>{up({setAsides:ALL_SET_ASIDES});setSetAsideOpen(false)}}
                style={{...S.orange,padding:'6px 4px',borderRadius:6,border:'none',fontSize:12,fontWeight:900,cursor:'pointer'}}>All</button>
              <button type="button" onClick={()=>{up({setAsides:[]});setSetAsideOpen(false)}}
                style={{background:'#f1f5f9',color:'#475569',padding:'6px 4px',borderRadius:6,border:'1px solid #cbd5e1',fontSize:12,fontWeight:900,cursor:'pointer'}}>None</button>
              <button type="button" onClick={applyRandomSetAsides}
                style={{background:'#7c3aed',color:'#fff',padding:'6px 4px',borderRadius:6,border:'none',fontSize:12,fontWeight:900,cursor:'pointer'}}>Random</button>
              <button type="button" onClick={()=>setSetAsideOpen(true)}
                style={{background:'#e0f2fe',color:'#075985',padding:'6px 4px',borderRadius:6,border:'1px solid #7dd3fc',fontSize:12,fontWeight:900,cursor:'pointer'}}>Manual</button>
            </div>
            <button onClick={()=>setSetAsideOpen(o=>!o)}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:8,border:'2px solid',borderColor:setAsideOpen?'#f97316':'#e2e8f0',background:'#f8fafc',cursor:'pointer',marginBottom:setAsideOpen?0:7}}>
              <span style={{fontSize:15,fontWeight:700,color:'#374151'}}>
                {(prefs.setAsides||[]).length===0
                  ? 'None selected'
                  : (prefs.setAsides||[]).length===ALL_SET_ASIDES.length
                    ? 'All set-asides selected'
                    : `${(prefs.setAsides||[]).length} selected`}
              </span>
              <ChevronDown style={{width:15,height:15,color:'#f97316',transform:setAsideOpen?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
            </button>
            {setAsideOpen && (
              <div style={{border:'2px solid #f97316',borderTop:'none',borderRadius:'0 0 8px 8px',marginBottom:7}}>
                <div style={{display:'flex',gap:6,padding:'7px 9px',background:'#fff7ed',borderBottom:'1px solid #fed7aa'}}>
                  <button onClick={()=>up({setAsides:ALL_SET_ASIDES})}
                    style={{...S.orange,fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer'}}>All</button>
                  <button onClick={()=>up({setAsides:[]})}
                    style={{background:'#f1f5f9',color:'#475569',fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer'}}>None</button>
                  <button onClick={applyRandomSetAsides}
                    style={{background:'#7c3aed',color:'#fff',fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer'}}>Random</button>
                  <button onClick={()=>setSetAsideOpen(true)}
                    style={{background:'#e0f2fe',color:'#075985',fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'1px solid #7dd3fc',cursor:'pointer'}}>Manual</button>
                </div>
                <div style={{maxHeight:250,overflowY:'auto',padding:'5px 7px',display:'flex',flexDirection:'column',gap:3}}>
                  {SET_ASIDE_CODES.filter(c => typeof c.value === 'string' && c.value).map(code => (
                    <SetAsideChip key={code.value} value={code.value} label={code.label || code.value}
                      selected={(prefs.setAsides || []).includes(code.value)}
                      onClick={() => up({ setAsides: tog(prefs.setAsides || [], code.value) })} />
                  ))}
                </div>
              </div>
            )}
            {(prefs.setAsides||[]).length>0 && (
              <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                {(prefs.setAsides||[]).length===ALL_SET_ASIDES.length ? (
                  <button onClick={()=>up({setAsides:[]})}
                    style={{...S.orange,fontSize:13,fontWeight:900,padding:'3px 8px',borderRadius:5,border:'none',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:3}}>
                    All set-asides selected <X style={{width:9,height:9}}/>
                  </button>
                ) : (
                  (prefs.setAsides||[]).map(c=>(
                    <button key={c} onClick={()=>up({setAsides:(prefs.setAsides||[]).filter(v=>v!==c)})}
                      style={{...S.orange,fontSize:13,fontWeight:900,padding:'3px 8px',borderRadius:5,border:'none',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:3}}>
                      {c} <X style={{width:9,height:9}}/>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* ── Steps 2 + 3 stacked in center panel ── */}
          <div style={{gridColumn:'span 5',display:'flex',flexDirection:'column',gap:12}}>

            {/* Step 2: Industry & Services */}
            <div
              ref={(el) => { sectionRefs.current[1] = el }}
              onMouseEnter={() => setGuideStep(1)}
              style={{...card,border:guideStep===1?'2px solid #f97316':'2px solid #a5b4fc',background:'#f8faff'}}
            >
              <span style={badge('#4f46e5')}>Step 2</span>
              <p style={{fontSize:18,fontWeight:900,color:'#0f172a',margin:'0 0 2px'}}>Industry &amp; Services</p>
              <p style={{fontSize:15,color:'#374151',fontWeight:700,marginBottom:9}}>Search NAICS or PSC codes that describe your work</p>
              <div style={{background:'#eef2ff',border:'1px solid #a5b4fc',borderRadius:8,padding:'8px 10px',marginBottom:9}}>
                <p style={{fontSize:13,fontWeight:800,color:'#3730a3',margin:0}}>
                  Pro tip: choose set-asides first, then add NAICS/PSC to improve match quality.
                </p>
              </div>

              {/* Tabs */}
              <div style={{display:'flex',gap:3,background:'#f1f5f9',borderRadius:8,padding:3,marginBottom:9}}>
                {(['naics','psc','keywords'] as const).map(tab=>{
                  const count=tab==='naics'?prefs.naicsCodes?.length:tab==='psc'?prefs.pscCodes?.length:0
                  const active=activeTab===tab
                  return (
                    <button key={tab} onClick={()=>setActiveTab(tab)}
                      style={{flex:1,padding:'6px 4px',borderRadius:6,fontSize:13,fontWeight:900,textTransform:'uppercase',letterSpacing:'0.05em',border:'none',cursor:'pointer',transition:'all 0.15s',
                        background:active?'#fff':'#e2e8f0',color:active?'#0f172a':'#334155',
                        boxShadow:active?'0 1px 3px rgba(0,0,0,0.1)':'none'}}>
                      {tab==='naics'?('NAICS'+((count||0)>0?` (${count})`:'')):tab==='psc'?('PSC'+((count||0)>0?` (${count})`:'')):'Keyword'}
                    </button>
                  )
                })}
              </div>

              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:8,flexWrap:'wrap',marginBottom:9}}>
                <p style={{fontSize:12,fontWeight:900,color:'#334155',margin:0}}>Selection mode for this step:</p>
                <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:6,maxWidth:460,width:'100%'}}>
                  <button
                    type="button"
                    onClick={selectAllForActiveStepTwo}
                    style={{background:'#4f46e5',color:'#fff',fontSize:12,fontWeight:900,padding:'6px 8px',border:'none',borderRadius:6,cursor:'pointer'}}
                  >
                    All
                  </button>
                  <button
                    type="button"
                    onClick={clearForActiveStepTwo}
                    style={{background:'#334155',color:'#fff',fontSize:12,fontWeight:900,padding:'6px 8px',border:'none',borderRadius:6,cursor:'pointer'}}
                  >
                    None
                  </button>
                  <button
                    type="button"
                    onClick={randomForActiveStepTwo}
                    style={{background:'#7c3aed',color:'#fff',fontSize:12,fontWeight:900,padding:'6px 8px',border:'none',borderRadius:6,cursor:'pointer'}}
                  >
                    Random
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowKwResults(activeTab === 'keywords')}
                    style={{background:'#e0f2fe',color:'#075985',fontSize:12,fontWeight:900,padding:'6px 8px',border:'1px solid #7dd3fc',borderRadius:6,cursor:'pointer'}}
                  >
                    Manual
                  </button>
                </div>
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
                  <p style={{fontSize:13,fontWeight:900,color:'#4338ca',margin:'0 0 4px'}}>Search NAICS code or title</p>
                  <div style={{position:'relative',marginBottom:7}}>
                    <Search style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',width:16,height:16,color:'#4338ca'}}/>
                    <input style={{...inputSt,borderColor:'#4f46e5',boxShadow:'0 0 0 2px rgba(79,70,229,0.12), 0 2px 10px rgba(30,64,175,0.16)'}} placeholder='Search: "541512", "computer systems", "cybersecurity"…'
                      value={naicsSearch} onChange={e=>setNaicsSearch(e.target.value)}/>
                    {naicsSearch&&<button onClick={()=>setNaicsSearch('')} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#334155'}}><X style={{width:13,height:13}}/></button>}
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
                  <p style={{fontSize:13,fontWeight:900,color:'#0c4a6e',margin:'0 0 4px'}}>Search PSC code, title, or category</p>
                  <div style={{position:'relative',marginBottom:7}}>
                    <Search style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',width:16,height:16,color:'#0369a1'}}/>
                    <input style={{...inputSt,borderColor:'#0284c7',boxShadow:'0 0 0 2px rgba(2,132,199,0.14), 0 2px 10px rgba(2,132,199,0.16)'}} placeholder='Search: "D302", "data processing", "logistics"…'
                      value={pscSearch} onChange={e=>setPscSearch(e.target.value)}/>
                    {pscSearch&&<button onClick={()=>setPscSearch('')} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#334155'}}><X style={{width:13,height:13}}/></button>}
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
                  <p style={{fontSize:13,fontWeight:900,color:'#6d28d9',margin:'0 0 4px'}}>Keyword search across NAICS and PSC</p>
                  <div style={{position:'relative',marginBottom:7}}>
                    <Search style={{position:'absolute',left:13,top:'50%',transform:'translateY(-50%)',width:16,height:16,color:'#7c3aed'}}/>
                    <input style={{...inputSt,borderColor:'#7c3aed',boxShadow:'0 0 0 2px rgba(124,58,237,0.14), 0 2px 10px rgba(124,58,237,0.18)'}} placeholder='Type any keyword: "cloud", "cybersecurity", "AI"…'
                      value={keywordInput}
                      onChange={e=>{setKeywordInput(e.target.value);setShowKwResults(e.target.value.trim().length>0)}}
                      onBlur={()=>setTimeout(()=>setShowKwResults(false),200)}
                      onFocus={()=>setShowKwResults(keywordInput.trim().length>0)}/>
                    {keywordInput&&<button onClick={()=>{setKeywordInput('');setShowKwResults(false)}} style={{position:'absolute',right:7,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:'#334155'}}><X style={{width:13,height:13}}/></button>}
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

            {/* Step 3: Location — sits below Step 2 in the center panel */}
            <div
              ref={(el) => { sectionRefs.current[2] = el }}
              onMouseEnter={() => setGuideStep(2)}
              style={{...card,border:guideStep===2?'2px solid #f97316':card.border}}
            >
              <span style={badge('#059669')}>Step 3</span>
              <p style={{fontSize:18,fontWeight:900,color:'#0f172a',margin:'0 0 2px'}}>Location</p>
              <p style={{fontSize:15,color:'#374151',fontWeight:700,marginBottom:9}}>States you can serve</p>
              <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:5,marginBottom:9}}>
                <button type="button" onClick={()=>{up({states:ALL_STATES});setStatesOpen(false)}}
                  style={{background:'#059669',color:'#fff',fontSize:12,fontWeight:900,padding:'6px 4px',border:'none',borderRadius:6,cursor:'pointer'}}>All</button>
                <button type="button" onClick={()=>{up({states:[]});setStatesOpen(false)}}
                  style={{background:'#334155',color:'#fff',fontSize:12,fontWeight:900,padding:'6px 4px',border:'none',borderRadius:6,cursor:'pointer'}}>None</button>
                <button type="button" onClick={applyRandomStates}
                  style={{background:'#7c3aed',color:'#fff',fontSize:12,fontWeight:900,padding:'6px 4px',border:'none',borderRadius:6,cursor:'pointer'}}>Random</button>
                <button type="button" onClick={()=>setStatesOpen(true)}
                  style={{background:'#e0f2fe',color:'#075985',fontSize:12,fontWeight:900,padding:'6px 4px',border:'1px solid #7dd3fc',borderRadius:6,cursor:'pointer'}}>Manual</button>
              </div>
              <button onClick={()=>setStatesOpen(o=>!o)}
                style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',borderRadius:8,border:'2px solid',borderColor:statesOpen?'#059669':'#e2e8f0',background:'#f8fafc',cursor:'pointer',marginBottom:statesOpen?0:7}}>
                <span style={{fontSize:15,fontWeight:700,color:'#374151'}}>
                  {(prefs.states||[]).length===0?'None selected':(prefs.states||[]).length===ALL_STATES.length?'All states':`${(prefs.states||[]).length} states selected`}
                </span>
                <ChevronDown style={{width:15,height:15,color:'#059669',transform:statesOpen?'rotate(180deg)':'none',transition:'transform 0.2s'}}/>
              </button>
              {statesOpen&&(
                <div style={{border:'2px solid #059669',borderTop:'none',borderRadius:'0 0 8px 8px',overflow:'hidden',marginBottom:7}}>
                  <div style={{display:'flex',gap:6,padding:'7px 9px',background:'#f0fdf4',borderBottom:'1px solid #bbf7d0'}}>
                    <button onClick={()=>up({states:ALL_STATES})}
                      style={{background:'#059669',color:'#fff',fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer'}}>All</button>
                    <button onClick={()=>up({states:[]})}
                      style={{background:'#f1f5f9',color:'#475569',fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer'}}>None</button>
                    <button onClick={applyRandomStates}
                      style={{background:'#7c3aed',color:'#fff',fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'none',cursor:'pointer'}}>Random</button>
                    <button onClick={()=>setStatesOpen(true)}
                      style={{background:'#e0f2fe',color:'#075985',fontSize:13,fontWeight:900,padding:'4px 11px',borderRadius:5,border:'1px solid #7dd3fc',cursor:'pointer'}}>Manual</button>
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
              {!statesOpen&&(prefs.states||[]).length>0&&(prefs.states||[]).length<ALL_STATES.length&&(
                <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                  {(prefs.states||[]).slice(0,12).map(s=>(
                    <button key={s} onClick={()=>up({states:(prefs.states||[]).filter(v=>v!==s)})}
                      style={{background:'#059669',color:'#fff',fontSize:13,fontWeight:900,padding:'3px 8px',borderRadius:5,border:'none',cursor:'pointer',display:'inline-flex',alignItems:'center',gap:3}}>
                      {s} <X style={{width:9,height:9}}/>
                    </button>
                  ))}
                  {(prefs.states||[]).length>12&&<span style={{fontSize:13,fontWeight:800,color:'#334155',alignSelf:'center'}}>+{(prefs.states||[]).length-12} more</span>}
                </div>
              )}
              {!statesOpen&&(prefs.states||[]).length===ALL_STATES.length&&(
                <div style={{display:'inline-flex',alignItems:'center',gap:5,background:'#059669',color:'#fff',fontSize:14,fontWeight:900,padding:'4px 11px',borderRadius:6}}>
                  <Check style={{width:12,height:12}}/> All states selected
                </div>
              )}
            </div>
          </div>

          {/* ── Step 4: Budget Range — promoted to right of Step 2 ── */}
          <div
            ref={(el) => { sectionRefs.current[3] = el }}
            onMouseEnter={() => setGuideStep(3)}
            style={{gridColumn:'span 2',...card,border:guideStep===3?'2px solid #f97316':card.border}}
          >
            <span style={badge('#7c3aed')}>Step 4</span>
            <p style={{fontSize:18,fontWeight:900,color:'#0f172a',margin:'0 0 2px'}}>Budget Range</p>
            <p style={{fontSize:15,color:'#374151',fontWeight:700,marginBottom:9}}>Target contract value</p>
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:5,marginBottom:9}}>
              <button type="button" onClick={()=>up({contractSizeMin:undefined,contractSizeMax:undefined})}
                style={{background:'#7c3aed',color:'#fff',fontSize:12,fontWeight:900,padding:'6px 4px',border:'none',borderRadius:6,cursor:'pointer'}}>All</button>
              <button type="button" onClick={()=>up({contractSizeMin:undefined,contractSizeMax:undefined})}
                style={{background:'#334155',color:'#fff',fontSize:12,fontWeight:900,padding:'6px 4px',border:'none',borderRadius:6,cursor:'pointer'}}>None</button>
              <button type="button" onClick={applyRandomBudget}
                style={{background:'#f97316',color:'#fff',fontSize:12,fontWeight:900,padding:'6px 4px',border:'none',borderRadius:6,cursor:'pointer'}}>Random</button>
              <button type="button"
                style={{background:'#e0f2fe',color:'#075985',fontSize:12,fontWeight:900,padding:'6px 4px',border:'1px solid #7dd3fc',borderRadius:6,cursor:'pointer'}}>
                Manual
              </button>
            </div>
            <p style={{fontSize:12,fontWeight:800,color:'#475569',margin:'0 0 10px'}}>
              {(prefs.contractSizeMin===undefined && prefs.contractSizeMax===undefined) ? 'Any budget selected' : 'Custom budget filter selected'}
            </p>
            <div style={{display:'flex',flexDirection:'column',gap:5,marginBottom:11}}>
              <Chip key="Any budget" label="Any budget" selected={prefs.contractSizeMin===undefined && prefs.contractSizeMax===undefined}
                onClick={()=>up({contractSizeMin:undefined,contractSizeMax:undefined})}/>
              {CONTRACT_SIZES.map(sz=>(
                <Chip key={sz.label} label={sz.label} selected={prefs.contractSizeMin===sz.min}
                  onClick={()=>up({contractSizeMin:sz.min,contractSizeMax:sz.max})}/>
              ))}
            </div>
            <div style={{borderTop:'1px solid #e2e8f0',paddingTop:9}}>
              <p style={{fontSize:11,fontWeight:900,color:'#334155',textTransform:'uppercase',marginBottom:6}}>Custom</p>
              <div style={{display:'flex',gap:6}}>
                {[{label:'Min ($)',key:'min'},{label:'Max ($)',key:'max'}].map(f=>(
                  <div key={f.key} style={{flex:1}}>
                    <p style={{fontSize:11,color:'#334155',fontWeight:700,marginBottom:3}}>{f.label}</p>
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
          <div
            ref={(el) => { sectionRefs.current[4] = el }}
            onMouseEnter={() => setGuideStep(4)}
            style={{gridColumn:'span 3',...card,border:guideStep===4?'2px solid #f97316':card.border,padding:'16px 14px',minHeight:360}}
          >
            <span style={badge('#f97316')}>Step 5</span>
            <p style={{fontSize:24,fontWeight:900,color:'#0f172a',margin:'0 0 2px'}}>Ready to launch?</p>
            <p style={{fontSize:16,color:'#374151',fontWeight:700,marginBottom:14,lineHeight:1.5}}>
              Review your feed profile and go live with the best-matching opportunities.
            </p>

            <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:8,marginBottom:14}}>
              {[
                {label:'Set-Asides',n:prefs.setAsides?.length||0},
                {label:'NAICS',     n:prefs.naicsCodes?.length||0},
                {label:'PSC Codes', n:prefs.pscCodes?.length||0},
                {label:'States',    n:prefs.states?.length||0},
              ].map(({label,n})=>(
                <div key={label} style={{background:n>0?'#f97316':'#334155',border:'none',borderRadius:10,padding:'12px 8px',textAlign:'center'}}>
                  <p style={{fontSize:28,fontWeight:900,color:'#fff',margin:0,lineHeight:1}}>{n}</p>
                  <p style={{fontSize:13,color:'#fff',fontWeight:800,marginTop:4,opacity:0.9,letterSpacing:'0.02em'}}>{label}</p>
                </div>
              ))}
            </div>
            <div style={{background:'#f8fafc',border:'2px solid #bfdbfe',borderRadius:10,padding:'10px 12px',marginBottom:12}}>
              <p style={{fontSize:12,fontWeight:900,color:'#1d4ed8',textTransform:'uppercase',letterSpacing:'0.08em',margin:'0 0 4px'}}>Contract Budget Target</p>
              <p style={{fontSize:17,fontWeight:900,color:'#0f172a',margin:0}}>{budgetSummary.primary}</p>
              <p style={{fontSize:13,fontWeight:700,color:'#334155',margin:'2px 0 0'}}>{budgetSummary.secondary}</p>
            </div>

            <button onClick={()=>setShowModal(true)}
              style={{...S.orange,width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'12px',borderRadius:10,fontWeight:900,fontSize:17,border:'none',cursor:'pointer',boxShadow:'0 4px 14px rgba(249,115,22,0.3)',marginBottom:8}}>
              Review &amp; Confirm <ArrowRight style={{width:14,height:14}}/>
            </button>
            <button onClick={()=>{ void finalizePreferences(nextPath) }}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',padding:'10px',borderRadius:10,fontWeight:700,fontSize:15,border:'2px solid #e2e8f0',background:'#f8fafc',color:'#475569',cursor:'pointer',marginBottom:5}}>
              Save &amp; go to Dashboard
            </button>
            <button onClick={()=>{ void finalizePreferences(nextPath) }}
              style={{width:'100%',textAlign:'center',padding:'6px',fontSize:14,fontWeight:700,color:'#334155',background:'none',border:'none',cursor:'pointer'}}>
              Skip for now
            </button>
          </div>

        </div>
        </div>
      </div>{/* end px-3 inner padding */}

      {/* ── Success Toast ── */}
      {showSuccessToast&&(
        <div style={{position:'fixed',top:24,left:'50%',transform:'translateX(-50%)',zIndex:9999,
          background:'#15803d',color:'#fff',borderRadius:12,padding:'14px 28px',
          display:'inline-flex',alignItems:'center',gap:10,
          boxShadow:'0 8px 32px rgba(0,0,0,0.25)',fontSize:16,fontWeight:900,whiteSpace:'nowrap'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
          Preferences saved! Redirecting…
        </div>
      )}

      {/* ── Confirmation Modal ── */}
      {showModal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',backdropFilter:'blur(4px)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:200,padding:16}}>
          <div style={{background:'#fff',borderRadius:18,boxShadow:'0 25px 60px rgba(0,0,0,0.3)',maxWidth:1100,width:'min(96vw, 1100px)',maxHeight:'92vh',overflowY:'auto',border:'1px solid #e2e8f0'}}>
            <div style={{background:'#0f172a',color:'#fff',padding:'16px 22px',borderRadius:'18px 18px 0 0',borderBottom:'4px solid #f97316',display:'flex',alignItems:'center',justifyContent:'space-between',position:'sticky',top:0}}>
              <div>
                <p style={{fontSize:20,fontWeight:900,margin:0}}>Confirm Your Preferences</p>
                <p style={{fontSize:14,color:'#fb923c',fontWeight:700,marginTop:2}}>Review your selections before saving</p>
              </div>
              <button onClick={()=>setShowModal(false)} style={{background:'none',border:'none',color:'#ffffff',cursor:'pointer'}}><X style={{width:19,height:19}}/></button>
            </div>
            <div style={{padding:26,display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(320px,1fr))',gap:18,alignItems:'start'}}>
              {(prefs.setAsides||[]).length>0&&(
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:'#334155',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>Business Classifications</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:5}}>
                    {(prefs.setAsides||[]).map(c=><span key={c} style={{...S.orange,padding:'5px 11px',borderRadius:7,fontSize:15,fontWeight:900,border:'none'}}>{c}</span>)}
                  </div>
                </div>
              )}
              {(prefs.naicsCodes||[]).length>0&&(
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:'#334155',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>NAICS Codes ({prefs.naicsCodes?.length})</p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5}}>
                    {(prefs.naicsCodes||[]).map(c=>{const o=NAICS_CODES.find(n=>n.code===c);return o?<div key={c} style={{padding:'7px 11px',borderRadius:7,border:'2px solid #fed7aa',background:'#fff7ed'}}><p style={{fontSize:15,fontWeight:900,color:'#0f172a',margin:0}}>{c} — {o.title}</p></div>:null})}
                  </div>
                </div>
              )}
              {(prefs.pscCodes||[]).length>0&&(
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:'#334155',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>PSC Codes ({prefs.pscCodes?.length})</p>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:5}}>
                    {(prefs.pscCodes||[]).map(c=>{const o=PSC_CODES.find(p=>p.code===c);return o?<div key={c} style={{padding:'7px 11px',borderRadius:7,border:'2px solid #fed7aa',background:'#fff7ed'}}><p style={{fontSize:15,fontWeight:900,color:'#0f172a',margin:0}}>{c} — {o.title}</p></div>:null})}
                  </div>
                </div>
              )}
              {(prefs.states||[]).length>0&&(
                <div>
                  <p style={{fontSize:13,fontWeight:900,color:'#334155',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>Geographic Focus — {prefs.states?.length} state{(prefs.states?.length||0)!==1?'s':''}</p>
                  <div style={{display:'flex',flexWrap:'wrap',gap:4}}>
                    {(prefs.states||[]).map(s=><span key={s} style={{...S.orange,padding:'5px 9px',borderRadius:7,fontSize:14,fontWeight:900,border:'none'}}>{s}</span>)}
                  </div>
                </div>
              )}
              <div>
                <p style={{fontSize:13,fontWeight:900,color:'#334155',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:7}}>Contract Size Range</p>
                <span style={{...S.orange,display:'inline-block',padding:'7px 13px',borderRadius:7,fontSize:15,fontWeight:900,border:'none'}}>
                  {budgetSummary.primary}
                </span>
                <p style={{fontSize:13,fontWeight:700,color:'#334155',margin:'6px 0 0'}}>{budgetSummary.secondary}</p>
              </div>
              {total===0&&<p style={{color:'#334155',textAlign:'center',padding:'22px 0',fontSize:15,fontWeight:700,gridColumn:'1 / -1'}}>No preferences selected yet.</p>}
              <div style={{gridColumn:'1 / -1',borderTop:'1px solid #e2e8f0',paddingTop:14,display:'flex',flexWrap:'wrap',justifyContent:'flex-end',gap:7}}>
                <button onClick={()=>setShowModal(false)} style={{padding:'9px 18px',borderRadius:8,border:'2px solid #e2e8f0',background:'#fff',color:'#374151',fontWeight:700,fontSize:15,cursor:'pointer'}}>Back to Editing</button>
                <button onClick={async()=>{
                  setShowModal(false)
                  await finalizePreferences(nextPath)
                }} style={{padding:'9px 18px',borderRadius:8,border:'none',background:'#16a34a',color:'#fff',fontWeight:900,fontSize:15,cursor:'pointer',display:'inline-flex',alignItems:'center',gap:6}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  Save &amp; Go to Dashboard
                </button>
                <button onClick={async()=>{
                  setShowModal(false)
                  await finalizePreferences('/opportunities')
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
