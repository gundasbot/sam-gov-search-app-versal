"use client";

import React, { Suspense, useState, useEffect, useCallback, useMemo, useRef } from"react";
import Link from"next/link";
import Image from"next/image";
import { useRouter, useSearchParams } from"next/navigation";
import { useSession } from"next-auth/react";
import {
 FileText, Building2, Target, MapPin, Loader2, HelpCircle, X, Save, Bell,
 Settings, Tag, Layers, Users, MessageSquare, ExternalLink, Shield, Check,
 Bookmark, Heart, Clock, Calendar, Hash, Copy, ArrowUpRight, Phone, AlertTriangle,
 ChevronUp, ChevronDown, Search, StopCircle, RefreshCw, CheckCircle,
 Filter, SlidersHorizontal, List, Grid, AlertCircle, Plus, BarChart3,
 TrendingUp, Sparkles, BarChart2, Download,
} from"lucide-react";

import OpportunityDetailDrawer from "@/components/OpportunityDetailDrawer";
import StickySearchBar from "@/components/StickySearchBar";

// ─── Shims for hooks/components imported from your project ────────────────
// Replace these with your real imports once the file is in place.

function useSubscription() {
 return {
 hasActiveSubscription: () => false as boolean,
 tier:""as string,
 status:""as string,
 loading: false as boolean,
 };
}

function useDebounce<T>(value: T, delay: number): T {
 const [dv, setDv] = useState<T>(value);
 useEffect(() => {
 const t = setTimeout(() => setDv(value), delay);
 return () => clearTimeout(t);
 }, [value, delay]);
 return dv;
}

const BRAND_CONFIG = {
 logo: { path:"/logo.png", alt:"PreciseGovCon"},
};

// ─── Set-aside constants & helpers ────────────────────────────────────────
const SET_ASIDE_MAP: Record<string, string> = {
 SBA:"Small Business Set-Aside",
"8A":"8(a) Sole Source",
"8AN":"8(a) Competitive",
 SDB:"Small Disadvantaged Business",
 HZC:"HUBZone",
 HZS:"HUBZone Sole Source",
 SDVOSBC:"SDVOSB Competitive",
 SDVOSBSS:"SDVOSB Sole Source",
 WOSB:"Women-Owned Small Business",
 WOSBSS:"WOSB Sole Source",
 EDWOSB:"Economically Disadvantaged WOSB",
 EDWOSBSS:"EDWOSB Sole Source",
 VSB:"Veteran-Owned Small Business",
 VOSB:"Veteran-Owned Small Business",
 ISBEE:"Indian Economic Enterprise",
 TIPSS:"Total Small Business Set-Aside",
};

const SET_ASIDE_CODE_BY_LABEL: Record<string, string> = Object.fromEntries(
 Object.entries(SET_ASIDE_MAP).map(([k, v]) => [v, k])
);

const SET_ASIDE_OPTIONS = [
 { code:"", label:"Any Set-Aside"},
 ...Object.entries(SET_ASIDE_MAP).map(([code, label]) => ({ code, label })),
];

const PROCUREMENT_TYPE_LABELS: Record<string, string> = {
 a: 'Award Notice',
 p: 'Pre-solicitation',
 o: 'Solicitation',
 r: 'Sources Sought',
 s: 'Special Notice',
 u: 'Justification (J&A)',
 k: 'Combined Synopsis/Solicitation',
 g: 'Sale of Surplus Property',
 i: 'Intent to Bundle (DoD)',
};

// ─── Filter toggle helpers (module-level, no state needed) ──────────────────

function getFilterKey(part: string): string | null {
 if (part.startsWith('Status:')) return 'status'
 if (part.startsWith('Due on/after')) return 'deadline-after'
 if (part.startsWith('Due on/before')) return 'deadline-before'
 if (part.startsWith('Posted on/after')) return 'posted-after'
 if (part.startsWith('Posted on/before')) return 'posted-before'
 if (part.startsWith('Keyword:')) return 'keyword'
 if (part.startsWith('Set-aside:')) return 'set-aside'
 if (part.startsWith('State:')) return 'state'
 if (part.startsWith('NAICS:')) return 'naics'
 if (part.startsWith('PSC:')) return 'psc'
 if (part.startsWith('Agency:')) return 'agency'
 if (part.startsWith('Type:')) return 'type'
 if (part.startsWith('Solicitation #:')) return 'solicitation'
 if (part.startsWith('ZIP:')) return 'zip'
 return null
}

// Deadline filters are frontend-only — no API call needed when toggling them
const FRONTEND_ONLY_FILTER_KEYS = new Set(['deadline-after', 'deadline-before'])

// Params to pass to runSearchWithOverrides when DISABLING an API filter
function getDisableApiOverride(key: string): Record<string, string> {
 const m: Record<string, Record<string, string>> = {
  status:       { opportunityStatus: '' },
  'posted-after':  { postedAfter: '' },
  'posted-before': { postedBefore: '' },
  keyword:      { keywords: '' },
  'set-aside':  { setAside: '' },
  state:        { stateOfPerformance: '' },
  naics:        { naics: '' },
  psc:          { classificationCode: '' },
  agency:       { agency: '' },
  type:         { procurementType: '' },
  solicitation: { solicitationNumber: '' },
  zip:          { placeOfPerformanceZip: '' },
 }
 return m[key] ?? {}
}

function getSetAsideLabel(code: string): string {
 return SET_ASIDE_MAP[(code ||"").toUpperCase()] || code ||"";
}

function setAsideCodesToString(codes: string[]): string {
 return codes.filter(Boolean).join(",");
}

function stringToSetAsideCodes(str: string): string[] {
 return str ? str.split(",").filter(Boolean) : [];
}

// ─── Location constants & helpers ─────────────────────────────────────────
const US_STATES_AND_TERRITORIES = [
 { code:"", label:"Any State/Territory"},
 { code:"AL", label:"Alabama"}, { code:"AK", label:"Alaska"},
 { code:"AZ", label:"Arizona"}, { code:"AR", label:"Arkansas"},
 { code:"CA", label:"California"}, { code:"CO", label:"Colorado"},
 { code:"CT", label:"Connecticut"}, { code:"DE", label:"Delaware"},
 { code:"FL", label:"Florida"}, { code:"GA", label:"Georgia"},
 { code:"HI", label:"Hawaii"}, { code:"ID", label:"Idaho"},
 { code:"IL", label:"Illinois"}, { code:"IN", label:"Indiana"},
 { code:"IA", label:"Iowa"}, { code:"KS", label:"Kansas"},
 { code:"KY", label:"Kentucky"}, { code:"LA", label:"Louisiana"},
 { code:"ME", label:"Maine"}, { code:"MD", label:"Maryland"},
 { code:"MA", label:"Massachusetts"}, { code:"MI", label:"Michigan"},
 { code:"MN", label:"Minnesota"}, { code:"MS", label:"Mississippi"},
 { code:"MO", label:"Missouri"}, { code:"MT", label:"Montana"},
 { code:"NE", label:"Nebraska"}, { code:"NV", label:"Nevada"},
 { code:"NH", label:"New Hampshire"}, { code:"NJ", label:"New Jersey"},
 { code:"NM", label:"New Mexico"}, { code:"NY", label:"New York"},
 { code:"NC", label:"North Carolina"}, { code:"ND", label:"North Dakota"},
 { code:"OH", label:"Ohio"}, { code:"OK", label:"Oklahoma"},
 { code:"OR", label:"Oregon"}, { code:"PA", label:"Pennsylvania"},
 { code:"RI", label:"Rhode Island"}, { code:"SC", label:"South Carolina"},
 { code:"SD", label:"South Dakota"}, { code:"TN", label:"Tennessee"},
 { code:"TX", label:"Texas"}, { code:"UT", label:"Utah"},
 { code:"VT", label:"Vermont"}, { code:"VA", label:"Virginia"},
 { code:"WA", label:"Washington"}, { code:"WV", label:"West Virginia"},
 { code:"WI", label:"Wisconsin"}, { code:"WY", label:"Wyoming"},
 { code:"DC", label:"District of Columbia"},
 { code:"PR", label:"Puerto Rico"}, { code:"GU", label:"Guam"},
 { code:"VI", label:"U.S. Virgin Islands"},
];

function getLocationLabel(code: string): string {
 return US_STATES_AND_TERRITORIES.find((s) => s.code === code)?.label || code;
}

function locationCodesToString(codes: string[]): string {
 return codes.filter(Boolean).join(",");
}

function stringToLocationCodes(str: string): string[] {
 return str ? str.split(",").filter(Boolean) : [];
}

// ─── Date helpers ──────────────────────────────────────────────────────────
function getSixMonthsAgo(): string {
 const d = new Date();
 d.setMonth(d.getMonth() - 6);
 return d.toISOString().split("T")[0];
}

function getToday(): string {
 return new Date().toISOString().split("T")[0];
}

function isMeaningful(value?: string | null): boolean {
 const v = (value ||"").trim();
 if (!v) return false;
 const upper = v.toUpperCase();
 return upper !=="N/A" && upper !=="NA" && upper !=="NONE" && upper !=="—";
}

function getPlaceLabel(opp: Opp): string | null {
 const city = isMeaningful(opp.placeOfPerformance?.city?.name) ? opp.placeOfPerformance?.city?.name?.trim() :"";
 const state = isMeaningful(opp.placeOfPerformance?.state?.code) ? opp.placeOfPerformance?.state?.code?.trim() :"";
 const parts = [city, state].filter(Boolean);
 return parts.length ? parts.join(", ") : null;
}

function formatDisplayDate(date: Date): string {
 return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatHumanDate(value?: string): string {
 if (!value) return '';
 const date = new Date(`${value}T00:00:00`);
 if (Number.isNaN(date.getTime())) return value;
 return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatSummaryList(items: string[], maxVisible = 2): string {
 const unique = Array.from(new Set(items.map(v => v.trim()).filter(Boolean)));
 if (unique.length === 0) return '';
 if (unique.length <= maxVisible) return unique.join(', ');
 return `${unique.slice(0, maxVisible).join(', ')} +${unique.length - maxVisible} more`;
}

function getProcurementTypeLabel(value: string): string {
 return PROCUREMENT_TYPE_LABELS[value?.toLowerCase()] || value;
}

function getSummaryChipTone(part: string): string {
 const lower = part.toLowerCase();
 if (lower.startsWith('keyword:')) return 'border-amber-300 bg-amber-50 text-amber-900';
 if (lower.startsWith('set-aside:')) return 'border-indigo-300 bg-indigo-50 text-indigo-900';
 if (lower.startsWith('state:')) return 'border-cyan-300 bg-cyan-50 text-cyan-900';
 if (lower.startsWith('status:')) return 'border-emerald-300 bg-emerald-50 text-emerald-900';
 if (lower.startsWith('posted ')) return 'border-blue-300 bg-blue-50 text-blue-900';
 if (lower.startsWith('due ')) return 'border-orange-300 bg-orange-50 text-orange-900';
 if (lower.startsWith('naics:')) return 'border-violet-300 bg-violet-50 text-violet-900';
 if (lower.startsWith('psc:')) return 'border-fuchsia-300 bg-fuchsia-50 text-fuchsia-900';
 if (lower.startsWith('agency:')) return 'border-teal-300 bg-teal-50 text-teal-900';
 if (lower.startsWith('type:')) return 'border-sky-300 bg-sky-50 text-sky-900';
 if (lower.startsWith('solicitation')) return 'border-rose-300 bg-rose-50 text-rose-900';
 return 'border-slate-300 bg-slate-100 text-slate-800';
}

function getDeadlineMeta(deadline?: string) {
 if (!deadline) return null;
 const due = new Date(deadline);
 if (isNaN(due.getTime())) return null;
 const days = Math.round((due.getTime() - Date.now()) / 86400000);
 let gradient ="bg-gradient-to-r from-slate-300 to-slate-200 text-slate-800";
 let label = `Due ${formatDisplayDate(due)}`;
 if (days < 0) {
 gradient ="bg-gradient-to-r from-slate-500 to-slate-700 text-white";
 label = `Closed • ${formatDisplayDate(due)}`;
 } else if (days <= 3) {
 gradient ="bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 text-white";
 label = `Due ${formatDisplayDate(due)} • ${days === 0 ?"today": `${days} day${days === 1 ? "":"s"} left`}`;
 } else if (days <= 10) {
 gradient ="bg-gradient-to-r from-amber-300 via-lime-300 to-emerald-300 text-gray-900";
 label = `Due ${formatDisplayDate(due)} • ${days} days left`;
 } else {
 gradient ="bg-gradient-to-r from-sky-500 via-cyan-500 to-indigo-500 text-white";
 label = `Due ${formatDisplayDate(due)} • ${days} days left`;
 }
 return { gradient, label, days, date: due };
}

const BADGE_BASE ="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold rounded-full shadow-[0_1px_8px_rgba(0,0,0,0.08)] text-white";

// ─── QuickDateLookupProps type ────────────────────────────────────────────
interface QuickDateLookupProps {
 keywords: string;
 setKeywords: (v: string) => void;
 postedAfter: string;
 setPostedAfter: (v: string) => void;
 responseDeadlineBefore: string;
 setResponseDeadlineBefore: (v: string) => void;
 onRunSearch: () => void;
 onStopSearch: () => void;
 onReset: () => void;
 loading: boolean;
 searchDuration: number;
 onSaveSearch: () => void;
 onCreateAlert: () => void;
}

// ─── Stub modal/component shims (replace with your real implementations) ──

interface MultiSelectDropdownProps {
 label: string;
 options: { code: string; label: string }[];
 selected: string[];
 onChange: (v: string[]) => void;
 placeholder?: string;
}

function MultiSelectDropdown({ label, options, selected, onChange, placeholder }: MultiSelectDropdownProps) {
 const [open, setOpen] = useState(false);
 return (
 <div className="relative">
 <label className="block font-bold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.08em", fontWeight: 700 }}>{label}</label>
 <button type="button"onClick={() => setOpen((p) => !p)}
 className="multi-select-trigger w-full rounded-lg border-2 border-gray-200 px-3 font-semibold text-left text-gray-900 bg-white flex items-center justify-between focus:border-[#166534] outline-none transition-colors" style={{ height: "42px", fontSize: "15px" }}>
 <span className="truncate">{selected.length > 0 ? `${selected.length} selected` : (placeholder ||"Any")}</span>
 <ChevronDown className="h-4 w-4 shrink-0 text-gray-400"/>
 </button>
 {open && (
 <div className="multi-select-dropdown absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-60 overflow-auto">
 {options.map((opt) => (
 <label key={opt.code} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm text-gray-800">
 <input type="checkbox"checked={selected.includes(opt.code)}
 onChange={(e) => {
 if (e.target.checked) onChange([...selected, opt.code]);
 else onChange(selected.filter((c) => c !== opt.code));
 }} />
 {opt.label}
 </label>
 ))}
 </div>
 )}
 </div>
 );
}

function OpportunityCard({ opportunity, index, isSaved, toggleSaved, copyText, copiedId, onOpen }: {
 opportunity: Opp; index: number; isSaved: boolean;
 toggleSaved: (id: string, data?: any) => void;
 copyText: (txt: string) => void; copiedId: string | null;
 onOpen: (opp: Opp) => void;
}) {
 const id = opportunity.noticeId || String(index);
 const dept = opportunity.department || opportunity.fullParentPathName || opportunity.office ||"N/A";
 const rawSetAside = getSetAsideLabel(opportunity.typeOfSetAside || opportunity.setAside ||"");
 const setAsideLabel = isMeaningful(rawSetAside) ? rawSetAside : null;
 const place = getPlaceLabel(opportunity);
 const naics = isMeaningful(opportunity.naicsCode) ? opportunity.naicsCode : null;
 const deadlineMeta = getDeadlineMeta(opportunity.responseDeadLine);
 const handleOpen = () => onOpen(opportunity);
 return (
 <div
 className="group relative overflow-hidden rounded-2xl border border-(--color-border) bg-white p-5 shadow-sm hover:shadow-lg transition-all cursor-pointer"
 onClick={handleOpen}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleOpen(); } }}
 >
 <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-slate-50 via-white to-emerald-50 opacity-0 group-hover:opacity-90 transition-opacity" />
 <div className="relative flex items-start justify-between gap-3">
 <div className="space-y-1">
 <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 line-clamp-1">{dept}</p>
 <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2">{opportunity.title ||"Untitled Opportunity"}</h3>
 </div>
 <button
 onClick={(e) => { e.stopPropagation(); toggleSaved(id, opportunity); }}
 className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${isSaved ?"bg-orange-500 text-white border-orange-500":"bg-white text-gray-500 border-gray-200 hover:border-orange-400 hover:text-orange-500"}`}
 >
 <Bookmark className={`h-4 w-4 ${isSaved ?"fill-current":""}`}/>
 </button>
 </div>
 <div className="relative mt-3 flex flex-wrap gap-2">
 {deadlineMeta && (
 <span className={`${BADGE_BASE} ${deadlineMeta.gradient}`} style={{ color: '#fff' }}>{deadlineMeta.label}</span>
 )}
 {setAsideLabel && (
 <span className={`${BADGE_BASE} bg-linear-to-r from-indigo-500 to-purple-600 text-white`} style={{ color: '#fff' }}>{setAsideLabel}</span>
 )}
 {naics && (
 <span className={`${BADGE_BASE} bg-linear-to-r from-sky-500 to-blue-600 text-white`} style={{ color: '#fff' }}>NAICS {naics}</span>
 )}
 {place && (
 <span className={`${BADGE_BASE} bg-linear-to-r from-emerald-500 to-teal-500 text-white`} style={{ color: '#fff' }}>{place}</span>
 )}
 </div>
 <div className="relative mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-600">
 {opportunity.uiLink && (
 <a
 href={opportunity.uiLink}
 target="_blank"
 rel="noopener noreferrer"
 onClick={(e) => e.stopPropagation()}
 className="inline-flex items-center gap-1 text-slate-700 hover:text-emerald-700"
 >
 Open SAM.gov <ArrowUpRight className="h-3.5 w-3.5"/>
 </a>
 )}
 <button
 onClick={(e) => { e.stopPropagation(); copyText(opportunity.noticeId ||''); }}
 className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700"
 >
 {copiedId === opportunity.noticeId ? 'Copied!' : <>Copy ID <Copy className="h-3 w-3"/></>}
 </button>
 </div>
 </div>
 );
}

function ExportSharePanel({ results, searchLabel, requireAccess }: {
 results: Opp[];
 searchLabel: string;
 requireAccess?: (feature: string) => boolean;
}) {
 const [open, setOpen] = useState(false);
 const panelRef = useRef<HTMLDivElement>(null)
 const gate = () => {
 if (requireAccess && !requireAccess('Export Results')) return false
 return true
 }

 const baseName = (searchLabel || 'opportunities')
 .toLowerCase()
 .replace(/[^a-z0-9]+/g, '-')
 .replace(/^-+|-+$/g, '')
 .slice(0, 60) || 'opportunities'

 const makeRows = () =>
 results.map((o) => ({
 title: o.title || '',
 solicitationNumber: o.solicitationNumber || '',
 agency: o.department || '',
 postedDate: o.postedDate || '',
 deadline: o.responseDeadLine || '',
 setAside: o.typeOfSetAside || o.setAside || '',
 naics: o.naicsCode || '',
 location: [o.placeOfPerformance?.city?.name, o.placeOfPerformance?.state?.code].filter(Boolean).join(','),
 samLink: o.uiLink || '',
 noticeId: o.noticeId || '',
 }))

 const downloadBlob = (content: BlobPart, type: string, ext: string) => {
 const blob = new Blob([content], { type })
 const url = URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `${baseName}-${getToday()}.${ext}`
 document.body.appendChild(a)
 a.click()
 a.remove()
 URL.revokeObjectURL(url)
 }

 const exportAs = (format: 'csv' | 'json' | 'txt' | 'xml') => {
 if (!results.length) return
 if (!gate()) return

 const rows = makeRows()

 if (format === 'csv') {
 const headers = ['Title', 'Solicitation Number', 'Agency', 'Posted Date', 'Deadline', 'Set-Aside', 'NAICS', 'Location', 'Solicitation Link']
 const csvRows = rows.map((r) => [r.title, r.solicitationNumber, r.agency, r.postedDate, r.deadline, r.setAside, r.naics, r.location, r.samLink])
 const csv = [headers, ...csvRows]
 .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
 .join('\n')
 downloadBlob(csv, 'text/csv', 'csv')
 return
 }

 if (format === 'json') {
 downloadBlob(JSON.stringify(rows, null, 2), 'application/json', 'json')
 return
 }

 if (format === 'txt') {
 const txt = rows.map((r, idx) => (
 `${idx + 1}. ${r.title}\nAgency: ${r.agency}\nSolicitation: ${r.solicitationNumber}\nDeadline: ${r.deadline}\nSet-Aside: ${r.setAside}\nNAICS: ${r.naics}\nLocation: ${r.location}\nLink: ${r.samLink}`
 )).join('\n\n')
 downloadBlob(txt, 'text/plain', 'txt')
 return
 }

 const esc = (v: string) => v
 .replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;')
 .replace(/"/g, '&quot;')
 .replace(/'/g, '&apos;')

 const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<opportunities>\n${rows.map((r) => `  <opportunity>\n    <title>${esc(r.title)}</title>\n    <solicitationNumber>${esc(r.solicitationNumber)}</solicitationNumber>\n    <agency>${esc(r.agency)}</agency>\n    <postedDate>${esc(r.postedDate)}</postedDate>\n    <deadline>${esc(r.deadline)}</deadline>\n    <setAside>${esc(r.setAside)}</setAside>\n    <naics>${esc(r.naics)}</naics>\n    <location>${esc(r.location)}</location>\n    <solicitationLink>${esc(r.samLink)}</solicitationLink>\n    <noticeId>${esc(r.noticeId)}</noticeId>\n  </opportunity>`).join('\n')}\n</opportunities>`
 downloadBlob(xml, 'application/xml', 'xml')
 }

 useEffect(() => {
 if (!open) return
 const onDown = (e: MouseEvent) => {
 if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
 setOpen(false)
 }
 }
 document.addEventListener('mousedown', onDown)
 return () => document.removeEventListener('mousedown', onDown)
 }, [open])

 return (
 <div className="relative" ref={panelRef}>
 <button
 type="button"
 aria-expanded={open}
 aria-haspopup="menu"
 onClick={() => {
 if (requireAccess && !requireAccess('Export Results')) return;
 setOpen((p) => !p);
 }}
 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-linear-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-black shadow-lg transition-all">
 <Download className="h-4 w-4"/>Export Results
 </button>
 {open && (
 <div className="absolute right-0 top-full mt-2 z-50 bg-white border-2 border-blue-200 rounded-2xl shadow-2xl p-2.5 min-w-64">
 <p className="px-2 py-1 text-xs font-black uppercase tracking-wide text-blue-700">Choose format</p>
 <button type="button" onClick={() => { exportAs('csv'); setOpen(false); }}
 className="w-full text-left px-3 py-2.5 text-sm font-bold text-gray-800 hover:bg-blue-50 rounded-lg transition-colors">CSV - Spreadsheet</button>
 <button type="button" onClick={() => { exportAs('json'); setOpen(false); }}
 className="w-full text-left px-3 py-2.5 text-sm font-bold text-gray-800 hover:bg-blue-50 rounded-lg transition-colors">JSON - Full data</button>
 <button type="button" onClick={() => { exportAs('txt'); setOpen(false); }}
 className="w-full text-left px-3 py-2.5 text-sm font-bold text-gray-800 hover:bg-blue-50 rounded-lg transition-colors">TXT - Readable text</button>
 <button type="button" onClick={() => { exportAs('xml'); setOpen(false); }}
 className="w-full text-left px-3 py-2.5 text-sm font-bold text-gray-800 hover:bg-blue-50 rounded-lg transition-colors">XML - Structured feed</button>
 </div>
 )}
 </div>
 );
}

function UnifiedSaveSearchModal({ mode, isOpen, onClose, searchParams, onSave }: {
 mode:"save"|"alert"; isOpen: boolean; onClose: () => void;
 searchParams: Record<string, string>; onSave: (payload: any) => Promise<void>;
}) {
 const [name, setName] = useState("");
 const [saving, setSaving] = useState(false);
 const [err, setErr] = useState("");
 if (!isOpen) return null;
 const handleSubmit = async () => {
 if (!name.trim()) { setErr("Please enter a name."); return; }
 setSaving(true); setErr("");
 try { await onSave({ name: name.trim(), ...searchParams, subscription_enabled: mode ==="alert"}); }
 catch (e: any) { setErr(e.message ||"Failed to save."); }
 finally { setSaving(false); }
 };
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
 <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-xl font-bold">{mode ==="save"?"Save Search":"Create Alert from this Search"}</h2>
 <button onClick={onClose}><X className="h-5 w-5"/></button>
 </div>
 <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Search name…"
 className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-4 font-semibold focus:border-blue-400 outline-none"/>
 {err && <p className="text-red-500 text-sm mb-3">{err}</p>}
 <div className="flex gap-2 justify-end">
 <button onClick={onClose} className="px-4 py-2 rounded-xl border border-gray-200 font-semibold text-sm">Cancel</button>
 <button onClick={handleSubmit} disabled={saving}
 className="px-6 py-2 rounded-xl bg-green-600 text-white font-bold text-sm disabled:opacity-50">
 {saving ?"Saving…": mode ==="save"?"Save":"Create Alert from this Search"}
 </button>
 </div>
 </div>
 </div>
 );
}

function SaveSearchSuccessModal({ isOpen, onClose, searchName, isSubscription }: {
 isOpen: boolean; onClose: () => void; searchName: string; isSubscription: boolean;
}) {
  if (!isOpen) return null;
  // Unified button for both actions
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3"/>
        <h2 className="text-xl font-bold mb-2">{isSubscription ? "Alert Created!" : "Search Saved!"}</h2>
        <p className="text-gray-600 mb-4">"{searchName}" has been saved.</p>
        <div className="flex flex-col gap-2 justify-center">
          <Link href="/alerts/manage-searches" onClick={onClose}
            className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 transition-colors">
            View Your Saved Searches and Alerts
          </Link>
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors">Done</button>
        </div>
      </div>
    </div>
  );
}

function AccessControlModal({ isOpen, onClose, featureName }: {
 isOpen: boolean; onClose: () => void; featureName: string;
}) {
 if (!isOpen) return null;
 const isPremiumFeature = !featureName.toLowerCase().includes('search')
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
 <div className="bg-white rounded-2xl shadow-2xl p-7 w-full max-w-md text-center relative"
 style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"}}>

 {/* ── Close X — always visible, always works ── */}
 <button
 onClick={onClose}
 aria-label="Close"
 style={{ position: 'absolute', top: '14px', right: '14px', color: '#6b7280', background: '#f3f4f6', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
 >
 <X style={{ width: '16px', height: '16px' }} />
 </button>

 <div className="w-14 h-14 rounded-full bg-green-50 border-2 border-green-600 flex items-center justify-center mx-auto mb-4">
 <Shield style={{ width: '28px', height: '28px', color: '#166534' }} />
 </div>
 <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: '#111827', marginBottom: '8px', fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"}}>
 {isPremiumFeature ? 'Sign In Required' : 'Create a Free Account'}
 </h2>
 <p style={{ color: '#4b5563', fontSize: '0.875rem', marginBottom: '20px', lineHeight: '1.6' }}>
 {isPremiumFeature
 ? <>To use <strong>{featureName}</strong>, please sign in. It only takes a moment.</>
 : <>Start a <strong>7-day free trial</strong> to save searches, set up email alerts, export results, and unlock your full history. Cancel any time before the trial ends — no charge.</>
 }
 </p>

 <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
 {/* Primary CTA — green background, white text */}
 <Link href="/signup" onClick={onClose}>
 <button style={{
 width: '100%', padding: '12px 0', borderRadius: '12px',
 background: '#166534', color: '#ffffff', fontWeight: 900,
 fontSize: '1rem', border: 'none', cursor: 'pointer',
 boxShadow: '0 4px 12px rgba(22,101,52,0.3)', transition: 'opacity 0.15s'
 }}>
 Create Free Account — 14-Day Free Trial
 </button>
 </Link>

 {/* Secondary CTA — white background, green border, green text */}
 <Link href="/login"onClick={onClose}>
 <button style={{
 width: '100%', padding: '11px 0', borderRadius: '12px',
 background: '#ffffff', color: '#166534', fontWeight: 700,
 fontSize: '0.9rem', border: '2px solid #166534', cursor: 'pointer',
 transition: 'background 0.15s'
 }}>
 Sign In to Existing Account
 </button>
 </Link>
 </div>

 <button
 onClick={onClose}
 style={{ fontSize: '0.8rem', color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
 >
 Continue browsing as guest
 </button>
 </div>
 </div>
 );
}

// Soft reminder banner shown at 10 and 15 minutes
function BrowseReminderModal({ level, onClose, onSignUp }: {
 level: 0 | 1 | 2; onClose: () => void; onSignUp: () => void;
}) {
 if (level === 0) return null
 const is10 = level === 1
 return (
 <div className="fixed bottom-6 right-6 z-50 w-80 bg-white rounded-2xl shadow-2xl border-2 border-[#166534] p-5"
 style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"}}>
 <div className="flex items-start justify-between gap-2 mb-3">
 <div className="flex items-center gap-2">
 <div className="pgc-green w-8 h-8 rounded-full bg-[#166534] flex items-center justify-center shrink-0">
 <Clock className="h-4 w-4 text-white"/>
 </div>
 <span className="font-black text-gray-900 text-sm">
 {is10 ? '10 minutes in' : '5 minutes left'}
 </span>
 </div>
 <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-0.5">
 <X className="h-4 w-4"/>
 </button>
 </div>
 <p className="text-xs text-gray-600 mb-4 leading-relaxed">
 {is10
 ? 'Enjoying the search? Create a free account — includes a 7-day free trial. Your card is stored securely and only charged after the trial ends.'
 : 'Your guest session ends in 5 minutes. Start your free 7-day trial to keep searching, save results, and never miss a contract.'}
 </p>
 <div className="pgc-green flex gap-2">
 <button onClick={onSignUp}
 style={{ background: '#166534', color: '#ffffff' }}
 className="pgc-green flex-1 py-2 rounded-lg font-black text-xs hover:opacity-90 transition-opacity">
 Sign Up Free
 </button>
 <button onClick={onClose}
 className="flex-1 py-2 rounded-lg font-semibold text-xs text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
 Keep browsing
 </button>
 </div>
 </div>
 )
}

// Hard lockout modal shown at 20 minutes
function LockoutModal({ onSignUp, onClose }: { onSignUp: () => void; onClose?: () => void }) {
 return (
 <div style={{
 position: 'fixed', inset: 0, zIndex: 9999,
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', padding: '16px',
 fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"
 }}>
 <div style={{
 background: '#ffffff', borderRadius: '24px', padding: '48px 40px 40px',
 width: '100%', maxWidth: '540px', textAlign: 'center',
 boxShadow: '0 24px 64px rgba(0,0,0,0.35)', position: 'relative'
 }}>

 {/* ── Red Close Button ── */}
 {onClose && (
 <button
 onClick={onClose}
 aria-label="Close"
 style={{
 position: 'absolute', top: '16px', right: '16px',
 background: '#dc2626', color: '#ffffff',
 border: 'none', borderRadius: '50%',
 width: '40px', height: '40px',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 cursor: 'pointer', boxShadow: '0 4px 12px rgba(220,38,38,0.4)',
 fontSize: '18px', fontWeight: 900, lineHeight: 1,
 }}
 >
 ✕
 </button>
 )}

 {/* Icon */}
 <div style={{
 width: '72px', height: '72px', borderRadius: '50%',
 background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
 border: '3px solid #16a34a',
 display: 'flex', alignItems: 'center', justifyContent: 'center',
 margin: '0 auto 20px'
 }}>
 <div style={{ position: 'relative', width: '36px', height: '36px' }}>
 <Image src={BRAND_CONFIG.logo.path} alt={BRAND_CONFIG.logo.alt} fill sizes="36px" style={{ objectFit: 'contain' }}/>
 </div>
 </div>

 {/* Headline */}
 <h2 style={{
 fontSize: '1.75rem', fontWeight: 900, color: '#111827',
 marginBottom: '12px', lineHeight: 1.2,
 fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"
 }}>
 Your Free Preview Has Ended
 </h2>

 {/* Body */}
 <p style={{ color: '#374151', fontSize: '1rem', marginBottom: '8px', lineHeight: 1.7 }}>
 You've had <strong>20 minutes</strong> to explore our platform.
 You're still welcome to browse the rest of this page to get a feel for what we offer across search, dashboard, and insights.
 Start a <strong>7-day free trial</strong> to keep searching with no time limits, save your work, and unlock the full personalized experience.
 </p>

 <div style={{
 background: '#f8fafc',
 border: '1px solid #dbeafe',
 borderRadius: '14px',
 padding: '14px 16px',
 marginBottom: '18px',
 textAlign: 'left'
 }}>
 <p style={{ color: '#0f172a', fontWeight: 800, fontSize: '0.9rem', marginBottom: '10px' }}>
 Keep exploring while you're here:
 </p>
 <div style={{ display: 'grid', gap: '8px' }}>
 <p style={{ color: '#334155', fontSize: '0.86rem', lineHeight: 1.55, margin: 0 }}>
 <strong style={{ color: '#111827' }}>Dashboard:</strong> see how saved searches, alerts, match scoring, and pipeline tracking come together in one personalized workspace.
 </p>
 <p style={{ color: '#334155', fontSize: '0.86rem', lineHeight: 1.55, margin: 0 }}>
 <strong style={{ color: '#111827' }}>Insights:</strong> preview trend signals, set-aside activity, and agency patterns that help you spot where demand is building.
 </p>
 <p style={{ color: '#334155', fontSize: '0.86rem', lineHeight: 1.55, margin: 0 }}>
 <strong style={{ color: '#111827' }}>Opportunities:</strong> explore live SAM.gov results, filters, and fit-focused views built to help you find contracts faster.
 </p>
 </div>
 </div>

 {/* Stripe security note */}
 <div style={{
 background: '#f0fdf4', border: '1px solid #bbf7d0',
 borderRadius: '12px', padding: '12px 16px', marginBottom: '28px',
 display: 'flex', alignItems: 'flex-start', gap: '10px', textAlign: 'left'
 }}>
 <span style={{ fontSize: '20px', flexShrink: 0, marginTop: '1px' }}>🔒</span>
 <div>
 <p style={{ color: '#166534', fontWeight: 700, fontSize: '0.85rem', marginBottom: '2px' }}>
 Your card is stored securely — only charged after your trial
 </p>
 <p style={{ color: '#4b5563', fontSize: '0.8rem', lineHeight: 1.5 }}>
 We use <strong>Stripe</strong> to securely store your payment details during signup.
 You get a <strong>7-day free trial</strong> first — no charge until it ends,
 and you can cancel any time before then.
 </p>
 </div>
 </div>

 {/* CTAs */}
 <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
 <Link href="/signup">
 <button style={{
 width: '100%', padding: '18px 0', borderRadius: '14px',
 background: 'linear-gradient(135deg, #16a34a, #166534)',
 color: '#ffffff', fontWeight: 900, fontSize: '1.15rem',
 border: 'none', cursor: 'pointer',
 boxShadow: '0 6px 20px rgba(22,101,52,0.35)',
 letterSpacing: '0.01em'
 }}>
 Start My 7-Day Free Trial
 </button>
 </Link>
 <Link href="/login">
 <button style={{
 width: '100%', padding: '15px 0', borderRadius: '14px',
 background: '#ffffff', color: '#166534', fontWeight: 700,
 fontSize: '1rem', border: '2px solid #16a34a', cursor: 'pointer',
 transition: 'background 0.15s'
 }}>
 Sign In to Existing Account
 </button>
 </Link>
 </div>

 {/* Dismiss link */}
 {onClose && (
 <button
 onClick={onClose}
 style={{
 marginTop: '18px', background: 'none', border: 'none',
 color: '#9ca3af', fontSize: '0.8rem', cursor: 'pointer',
 textDecoration: 'underline'
 }}
 >
 Continue browsing (limited access)
 </button>
 )}
 </div>
 </div>
 )
}




// SSR-safe FirstTimeGuide component
function FirstTimeGuide() {
 const [show, setShow] = React.useState(true);
 React.useEffect(() => {
 if (typeof window !== 'undefined') {
 if (window.localStorage.getItem('searchGuideDismissed')) {
 setShow(false);
 }
 }
 }, []);
 if (!show) return null;
 return (

 <div id="first-time-guide"className="mb-6 rounded-2xl border border-[--color-border] bg-white shadow p-6 flex flex-col md:flex-row items-center gap-6 relative">
 <div className="flex-1">
 <h2
 className="text-2xl md:text-3xl font-black text-[--color-primary] mb-2"
 style={{ fontFamily: 'Aptos, Inter, Arial, sans-serif' }}
 >
 Welcome to Precise GovCon Search
 </h2>
 <ol className="list-decimal list-inside text-base font-semibold text-[--color-text-primary] space-y-1 pl-2">
 <li>Enter keywords, NAICS, agency, or solicitation number in the search bar below.</li>
 <li>Click <span className="inline-block bg-[--color-primary] text-white px-2 py-0.5 rounded font-black">Search</span> or press <span className="font-black">Enter</span>.</li>
 <li>Use filters to refine results. Save searches or set up alerts as needed.</li>
 </ol>
 </div>
 <button
 className="absolute top-3 right-3 text-[--color-primary] hover:text-[--color-primary-hover] text-xl font-black bg-white rounded-full p-2 border border-[--color-border] shadow"
 onClick={() => {
 if (typeof window !== 'undefined') {
 window.localStorage.setItem('searchGuideDismissed', '1');
 setShow(false);
 }
 }}
 >
 ×
 </button>
 </div>
 );
}

// ResultCard component
type ResultCardProps = {
 opportunity: Opp;
 index: number;
 department?: string;
 setAsideLabel?: string;
 placeOfPerformance?: string;
 isAuthenticated?: boolean;
 isExpanded?: boolean;
 toggleExpanded?: (id: string) => void;
 showAuthModal?: () => void;
 id?: string;
 isSaved?: boolean;
 toggleSaved?: (id: string, data?: any) => void;
 copyText?: (txt: string) => void;
 copiedId?: string | null;
};

function ResultCard({
 opportunity,
 index,
 department: departmentProp,
 setAsideLabel: setAsideLabelProp,
 placeOfPerformance: placeOfPerformanceProp,
 isAuthenticated,
 isExpanded,
 toggleExpanded = () => {},
 showAuthModal = () => {},
 id: idProp,
 isSaved = false,
 toggleSaved = () => {},
 copyText = () => {},
 copiedId = null,
}: ResultCardProps) {
const id = idProp || opportunity.noticeId || String(index);
const department = departmentProp || opportunity.department || opportunity.fullParentPathName || opportunity.office || 'N/A';
const rawSetAside = setAsideLabelProp || getSetAsideLabel(opportunity.typeOfSetAside || opportunity.setAside || '') || '';
const setAsideLabel = isMeaningful(rawSetAside) ? rawSetAside : '';
const placeOfPerformance = placeOfPerformanceProp || getPlaceLabel(opportunity) || '';
const naics = isMeaningful(opportunity.naicsCode) ? opportunity.naicsCode : '';
return (
<div>
{/* Key Information Grid - UPDATED with important criteria */}
<div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
{/* Solicitation Number */}
 {opportunity.solicitationNumber && (
 <div className="flex items-start gap-2">
 <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[--color-text-subtle]"/>
 <div>
 <div className="text-sm font-bold text-[--color-text-secondary]">Solicitation #</div>
 <div className="text-sm font-medium text-[--color-text-primary]">{opportunity.solicitationNumber}</div>
 </div>
 </div>
 )}
{/* Department/Agency */}
<div className="flex items-start gap-2">
<Building2 className="mt-0.5 h-4 w-4 shrink-0 text-[--color-text-subtle]"/>
<div>
<div className="text-sm font-bold text-[--color-text-secondary]">Department/Agency</div>
 <div className="line-clamp-2 wrap-break-word text-sm font-medium text-slate-900" title={department}>
{department}
</div>
</div>
</div>
{/* Set-Aside */}
{setAsideLabel && (
<div className="flex items-start gap-2">
<Target className="mt-0.5 h-4 w-4 shrink-0 text-[--color-text-subtle]"/>
<div>
<div className="text-sm font-bold text-[--color-text-secondary]">Set-Aside</div>
<div className="line-clamp-2 wrap-break-word text-sm font-medium text-slate-900" title={setAsideLabel}>
{setAsideLabel}
</div>
</div>
</div>
)}
{/* Place of Performance (City/State) */}
{isMeaningful(placeOfPerformance) && (
<div className="flex items-start gap-2">
<MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[--color-primary]"/>
<div>
<div className="text-sm font-extrabold text-[--color-text-secondary]">Place of Performance</div>
<div className="wrap-break-word text-sm font-extrabold text-slate-900">{placeOfPerformance}</div>
</div>
</div>
)}
 {/* ...existing code... */}
 </div>
 {/* Gated details: expand/collapse */}
 <div>
 <button
 className="mt-2 text-emerald-700 underline text-sm font-bold"
 onClick={isAuthenticated ? () => toggleExpanded(id) : showAuthModal}
 >
 {isExpanded ? 'Hide Details' : 'View Details'}
 </button>
 {isExpanded && isAuthenticated && (
 <div className="mt-4">
 {/* ...existing expanded details code... */}
 </div>
 )}
 </div>
 </div>
 );
}

function useBrowsingSession() {
 const { data: session, status } = useSession()
 const { hasActiveSubscription, tier, status: plan_status, loading: planLoading } = useSubscription()

 // Use a ref-backed start time so it's always available synchronously
 const browsingStartTimeRef = useRef<number | null>(null)
 const [browsingStartTime, setBrowsingStartTime] = useState<number | null>(null)
 const [showReminderModal, setShowReminderModal] = useState(false)
 const [reminderLevel, setReminderLevel] = useState<0 | 1 | 2>(0) // 0=none, 1=soft@10min, 2=firm@15min
 const [showLockoutModal, setShowLockoutModal] = useState(false)

 // Initialize on first render synchronously from localStorage (avoids flicker)
 useEffect(() => {
 if (status === 'loading') return // wait until auth resolves

 if (status === 'authenticated') {
 // Authenticated users: clear any guest session timer
 localStorage.removeItem('browsingStartTime')
 browsingStartTimeRef.current = null
 setBrowsingStartTime(null)
 setShowLockoutModal(false)
 setShowReminderModal(false)
 return
 }

 // Unauthenticated guest: read or create browsing start time
 const stored = localStorage.getItem('browsingStartTime')
 const now = Date.now()

 if (stored) {
 const startTime = parseInt(stored, 10)
 if (isNaN(startTime)) {
 // Corrupt value — reset
 localStorage.setItem('browsingStartTime', now.toString())
 browsingStartTimeRef.current = now
 setBrowsingStartTime(now)
 } else {
 const elapsed = now - startTime
 if (elapsed >= 1200000) {
 // Already past 20 minutes — lock out immediately
 browsingStartTimeRef.current = startTime
 setBrowsingStartTime(startTime)
 setShowLockoutModal(true)
 } else {
 browsingStartTimeRef.current = startTime
 setBrowsingStartTime(startTime)
 // Restore reminder state based on elapsed time
 if (elapsed >= 900000) setReminderLevel(2) // past 15min
 else if (elapsed >= 600000) setReminderLevel(1) // past 10min
 }
 }
 } else {
 // First visit — start the clock
 localStorage.setItem('browsingStartTime', now.toString())
 browsingStartTimeRef.current = now
 setBrowsingStartTime(now)
 }
 }, [status])

 // Tick every second and fire prompts at 10, 15, 20 minutes
 useEffect(() => {
 if (status !== 'unauthenticated' || !browsingStartTime) return

 const interval = setInterval(() => {
 const elapsed = Date.now() - browsingStartTime

 if (elapsed >= 1200000) {
 // 20 min — hard lockout
 setShowLockoutModal(true)
 clearInterval(interval)
 return
 }
 if (elapsed >= 900000 && reminderLevel < 2) {
 // 15 min — firm prompt
 setReminderLevel(2)
 setShowReminderModal(true)
 return
 }
 if (elapsed >= 600000 && reminderLevel < 1) {
 // 10 min — soft prompt
 setReminderLevel(1)
 setShowReminderModal(true)
 }
 }, 1000)

 return () => clearInterval(interval)
 }, [browsingStartTime, status, reminderLevel])

 const hasValidAccess = useMemo(() => {
 if (planLoading || status === 'loading') return false

 if (status === 'authenticated') {
 const user = session?.user as any
 if (user?.role === 'admin') return true
 if (hasActiveSubscription()) return true
 return false
 }

 return false
 }, [status, session, hasActiveSubscription, tier, plan_status, planLoading])

 // canBrowse: true for guests within 20-minute window OR for paid users
 // IMPORTANT: default true during initial loading to prevent flash-of-block
 const canBrowse = useMemo(() => {
 if (hasValidAccess) return true
 if (status === 'loading') return true // assume browsable until auth resolves
 if (showLockoutModal) return false
 if (status === 'unauthenticated') {
 // Allow browsing even before localStorage is read (browsingStartTime still null)
 // because we'll read it in the effect above
 return true
 }
 return false
 }, [hasValidAccess, showLockoutModal, status])

 return {
 hasValidAccess,
 canBrowse,
 reminderLevel,
 showReminderModal,
 setShowReminderModal,
 showLockoutModal,
 setShowLockoutModal,
 isAuthenticated: status === 'authenticated',
 tier,
 plan_status,
 planLoading,
 }
}

// --- Types ---
type Opp = {
 noticeId?: string
 title?: string
 solicitationNumber?: string
 fullParentPathName?: string
 department?: string
 subTier?: string
 office?: string
 postedDate?: string
 responseDeadLine?: string
 type?: string
 // SAM.gov often returns both a set-aside *code* and a human-readable description.
 // Different endpoints / export formats may use different field names, so we support both.
 typeOfSetAside?: string
 typeOfSetAsideDescription?: string
 setAside?: string
 setAsideCode?: string
 naicsCode?: string
 placeOfPerformance?: {
 city?: { name?: string }
 state?: { code?: string }
 county?: { name?: string }
 zip?: string
 country?: { code?: string }
 }
 description?: string
 uiLink?: string
 resourceLinks?: string[]
 active?: string
 status?: string // opportunity status (active/inactive/archived/cancelled)
 organizationName?: string // agency / org name
 organizationId?: string // agency / org identifier
 modifiedDate?: string
 baseType?: string
 archiveType?: string
 award?: any
 pointOfContact?: any
 classificationCode?: string
 productServiceCode?: string
 contractOpportunityType?: string
}

type ApiResponse = {
 totalRecords?: number
 opportunitiesData?: Opp[]
 [k: string]: any
}

type FacetItem = {
 name: string
 count: number
 value?: string
}

type Facets = {
 agencies: FacetItem[]
 setAsides: Array<FacetItem & { label: string }>
 naics: FacetItem[]
 states: FacetItem[]
 cities: Array<FacetItem & { state: string }>
 productServices: FacetItem[]
 departments: FacetItem[]
 types: FacetItem[]
}

// --- Constants ---
const US_STATES = [
 { value: '', label: 'Any State/Territory' },
 // ...other states...
];

// SSR-safe FirstTimeGuide component
const Badge = ({ 
 children, 
 variant = 'default',
 size = 'sm'
}: { 
 children: React.ReactNode, 
 variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger',
 size?: 'sm' | 'md'
}) => {
 const variants = {
 default: 'bg-[--color-surface] text-[--color-text-primary] border border-[--color-border]',
 primary: 'bg-[--color-accent-soft] text-[--color-primary] border border-[--color-border]',
 success: 'bg-[--color-accent-soft] text-[--color-primary] border border-[--color-border]',
 warning: 'bg-[--color-surface-muted] text-[--color-text-primary] border border-[--color-border]',
 danger: 'bg-rose-500/20 text-white border-rose-500/30',
 }
 
 const sizes = {
 sm: 'px-2 py-0.5 text-xs rounded-full',
 md: 'px-3 py-1 text-sm rounded-full',
 }
 
 return (
 <span className={`inline-flex items-center border ${variants[variant]} ${sizes[size]}`}>
 {children}
 </span>
 )
}

const Button = ({
 children,
 onClick,
 disabled = false,
 loading = false,
 variant = 'primary',
 size = 'md',
 fullWidth = false,
 icon,
 className = '',
 ...props
}: {
 children: React.ReactNode,
 onClick?: () => void,
 disabled?: boolean,
 loading?: boolean,
 variant?: string,
 size?: string,
 fullWidth?: boolean,
 icon?: React.ReactNode,
 className?: string,
 [key: string]: any
}) => {
 return (
 <button
 type="button"
 onClick={onClick}
 disabled={disabled || loading}
 className={`inline-flex items-center justify-center gap-2 rounded font-bold transition-all ${fullWidth ? 'w-full' : ''} ${className}`}
 {...props}
 >
 {icon && <span className="mr-2">{icon}</span>}
 {loading ? 'Loading...' : children}
 </button>
 );
};

// --- Utility Functions ---

/**
 * Retry a fetch request with exponential backoff for SAM.gov reliability
 */
async function fetchWithRetry(
 url: string,
 options: RequestInit,
 maxRetries = 3,
 initialDelay = 2000
): Promise<Response> {
 let last_error: Error | null = null;
 
 for (let attempt = 0; attempt <= maxRetries; attempt++) {
 // Bail out immediately if the request was intentionally cancelled
 if (options.signal?.aborted) {
 throw new DOMException('Search stopped by user', 'AbortError');
 }

 try {
 const response = await fetch(url, options);
 
 // If response is OK or it's a client error (4xx), return immediately
 if (response.ok || (response.status >= 400 && response.status < 500)) {
 if (attempt > 0) {
 console.log(`✅ Request succeeded after ${attempt} ${attempt === 1 ? 'retry' : 'retries'}`);
 }
 return response;
 }
 
 // For 5xx errors (server errors), we'll retry
 if (response.status >= 500 && attempt < maxRetries) {
 const delay = initialDelay * Math.pow(2, attempt);
 console.log(`⚠️ Server error ${response.status}, retrying in ${delay/1000}s... (attempt ${attempt + 1}/${maxRetries})`);
 await new Promise(resolve => setTimeout(resolve, delay));
 continue;
 }
 
 return response;
 } catch (error) {
 last_error = error as Error;

 // Don't retry aborted requests — user cancelled intentionally
 if (last_error.name === 'AbortError' || options.signal?.aborted) {
 throw last_error;
 }
 
 if (attempt < maxRetries) {
 const delay = initialDelay * Math.pow(2, attempt);
 console.log(`❌ Request failed: ${last_error.message}, retrying in ${delay/1000}s... (attempt ${attempt + 1}/${maxRetries})`);
 await new Promise(resolve => setTimeout(resolve, delay));
 }
 }
 }
 
 // Only log as error for genuine failures, not user cancellations
 console.error(`🚫 Max retries (${maxRetries}) exceeded. Last error:`, last_error);
 throw last_error || new Error('Max retries exceeded');
}

function clamp(str: string, max: number) {
 return str.length > max ? str.substring(0, max) : str
}

/** Convert URLSearchParams to a plain object without relying on .entries() iterator */
function qsToObj(qs: URLSearchParams): Record<string, string> {
 const obj: Record<string, string> = {}
 qs.forEach((value, key) => { obj[key] = value })
 return obj
}

function safeJsonParse(str: string) {
 try {
 return JSON.parse(str)
 } catch {
 return null
 }
}

function formatDate(dateStr: string) {
 return new Date(dateStr).toLocaleDateString('en-US', {
 year: 'numeric',
 month: 'short',
 day: 'numeric'
 })
}

function normalizeText(str?: string) {
 return (str || '').trim()
}

function normalizeAgency(o: Opp) {
 return normalizeText(o.department || o.fullParentPathName || o.office)
}

function normalizeNaics(o: Opp) {
 return normalizeText(o.naicsCode)
}

function normalizeState(o: Opp) {
 return normalizeText(o.placeOfPerformance?.state?.code)
}

function normalizeCity(o: Opp) {
 return normalizeText(o.placeOfPerformance?.city?.name)
}

function normalizeSol(o: Opp) {
 return normalizeText(o.solicitationNumber)
}

function normalizeProductService(o: Opp) {
 return normalizeText(o.productServiceCode)
}

function normalizeNoticeId(o: Opp) {
 return normalizeText(o.noticeId)
}

function normalizeTitle(o: Opp) {
 return normalizeText(o.title)
}

function normalizeType(o: Opp) {
 return normalizeText(o.type)
}

function normalizeSetAsideCode(o: Opp) {
 return normalizeText(o.setAsideCode || o.setAside)
}

function groupLabelFromSetAside(o: Opp) {
 const code = normalizeSetAsideCode(o)
 return getSetAsideLabel(code) || code
}

function formatNaicsDisplay(o: Opp) {
 const code = normalizeNaics(o)
 return code ? `NAICS ${code}` : ''
}

function formatSetAsideDisplay(o: Opp) {
 const label = groupLabelFromSetAside(o)
 return label || ''
}

function summarizePlace(o: Opp) {
 const city = normalizeCity(o)
 const state = normalizeState(o)
 return [city, state].filter(Boolean).join(', ')
}

function withinText(hay: string, needle: string) {
 return hay.toLowerCase().includes(needle.toLowerCase())
}

function formatSearchQuery(query: string): string {
 try {
 const params = new URLSearchParams(query)
 const parts: string[] = []
 
 // Get readable labels for parameters
 const title = params.get('title')
 if (title && title !== '*') parts.push(`"${title}"`)
 
 const ptype = params.get('ptype')
 if (ptype) {
 const typeMap: Record<string, string> = {
 'a': 'Award Notice',
 'p': 'Pre-solicitation',
 'o': 'Solicitation',
 'r': 'Sources Sought',
 's': 'Special Notice',
 'u': 'Justification (J&A)',
 'k': 'Combined Synopsis/Solicitation',
 'g': 'Sale of Surplus Property',
 'i': 'Intent to Bundle (DoD)'
 }
 parts.push(typeMap[ptype] || `Type: ${ptype}`)
 }
 
 const typeOfSetAside = params.get('typeOfSetAside')
 if (typeOfSetAside) {
 parts.push(getSetAsideLabel(typeOfSetAside) || `Set-Aside: ${typeOfSetAside}`)
 }
 
 const state = params.get('state')
 if (state) {
 const stateLabel = US_STATES.find(s => s.value === state)?.label || state
 parts.push(`State: ${stateLabel}`)
 }
 
 const postedFrom = params.get('postedFrom')
 const postedTo = params.get('postedTo')
 if (postedFrom || postedTo) {
 if (postedFrom && postedTo) {
 parts.push(`${postedFrom} to ${postedTo}`)
 } else if (postedFrom) {
 parts.push(`After ${postedFrom}`)
 } else if (postedTo) {
 parts.push(`Before ${postedTo}`)
 }
 }
 
 const naics = params.get('naics')
 if (naics) parts.push(`NAICS: ${naics}`)
 
 const organizationCode = params.get('organizationCode')
 if (organizationCode) parts.push(`Agency: ${organizationCode}`)
 
 const solnum = params.get('solnum')
 if (solnum) parts.push(`Solicitation: ${solnum}`)
 
 return parts.length > 0 ? parts.join(' ') : 'Empty search'
 } catch {
 return query.length > 30 ? query.substring(0, 30) + '...' : query
 }
}

// Add this function BEFORE updateFacets
function getSolicitationDates(opportunity: Opp): { start?: string, end?: string } {
 // Check for contract start/end dates in the award data
 if (opportunity.award?.contractDates) {
 return {
 start: opportunity.award.contractDates.start,
 end: opportunity.award.contractDates.end
 }
 }
 
 // Check for performance period in description
 if (opportunity.description) {
 const startMatch = opportunity.description.match(/start(?:ing)?\s*(?:date)?\s*[:]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
 const endMatch = opportunity.description.match(/(?:end|completion|closing)\s*(?:date)?\s*[:]?\s*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i)
 
 return {
 start: startMatch ? startMatch[1] : undefined,
 end: endMatch ? endMatch[1] : undefined
 }
 }
 
 return {}
}

function updateFacets(opps: Opp[]) {
 // Implementation would go here
 return {
 agencies: [],
 setAsides: [],
 naics: [],
 states: [],
 cities: [],
 productServices: [],
 departments: [],
 types: []
 }
}

// --- Custom Hooks ---

// Search History Hook
const useSearchHistory = () => {
 const [recentSearches, setRecentSearches] = useState<string[]>([]);

 const saveSearchToHistory = useCallback((searchParams: string) => {
 try {
 const updated = [searchParams, ...recentSearches.filter(s => s !== searchParams)].slice(0, 10)
 setRecentSearches(updated)
 localStorage.setItem('govcon_recent_searches', JSON.stringify(updated))
 } catch (error) {
 console.error('Failed to save search history:', error)
 }
 }, [recentSearches]);

 return { recentSearches, saveSearchToHistory, setRecentSearches };
};

// Opportunity Management Hook — persists to DB via API so dashboard & alerts show saved opps
const useOpportunityManagement = (showToast?: (msg: string) => void) => {
 const [saved, setSaved] = useState<Record<string, boolean>>({});
 // Store full opportunity data keyed by id so we can POST it to the API
 const opportunityDataRef = React.useRef<Record<string, any>>({});

 const toggleSaved = useCallback((id: string, opportunityData?: any) => {
 const currentlySaved = !!opportunityDataRef.current[`__saved_${id}`]
 const isNowSaved = !currentlySaved

 // Optimistic UI update
 setSaved((p) => ({ ...p, [id]: isNowSaved }))
 opportunityDataRef.current[`__saved_${id}`] = isNowSaved

 if (isNowSaved && opportunityData) {
   opportunityDataRef.current[id] = opportunityData
   // Show optimistic toast
   if (showToast) showToast(`✓ Saved: ${opportunityData.title?.slice(0, 45) || 'Opportunity'}`)

   fetch('/api/saved-opportunities', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({
       noticeId: id,
       title: opportunityData.title,
       solicitationNumber: opportunityData.solicitationNumber,
       department: opportunityData.department || opportunityData.fullParentPathName,
       postedDate: opportunityData.postedDate,
       responseDeadLine: opportunityData.responseDeadLine,
       naicsCode: opportunityData.naicsCode,
       type: opportunityData.type,
       setAside: opportunityData.typeOfSetAsideDescription || opportunityData.typeOfSetAside || opportunityData.setAside,
       placeOfPerformance: opportunityData.placeOfPerformance,
       uiLink: opportunityData.uiLink,
       organizationName: opportunityData.organizationName,
     }),
   })
   .then(async (res) => {
     if (!res.ok) {
       // Revert optimistic update on failure
       setSaved((p) => ({ ...p, [id]: false }))
       opportunityDataRef.current[`__saved_${id}`] = false
       const data = await res.json().catch(() => ({}))
       if (showToast) showToast(`⚠ Could not save: ${data?.error || `Server error ${res.status}`}`)
       console.error('POST /api/saved-opportunities failed:', res.status, data)
     }
   })
   .catch((err) => {
     setSaved((p) => ({ ...p, [id]: false }))
     opportunityDataRef.current[`__saved_${id}`] = false
     if (showToast) showToast('⚠ Could not save — check your connection')
     console.error('Failed to save opportunity to DB:', err)
   })
 } else if (!isNowSaved) {
   if (showToast) showToast('Removed from saved opportunities')
   fetch(`/api/saved-opportunities/${id}`, { method: 'DELETE' })
     .then(async (res) => {
       if (!res.ok) {
         // Revert
         setSaved((p) => ({ ...p, [id]: true }))
         opportunityDataRef.current[`__saved_${id}`] = true
         console.error('DELETE /api/saved-opportunities failed:', res.status)
       }
     })
     .catch((err) => {
       setSaved((p) => ({ ...p, [id]: true }))
       opportunityDataRef.current[`__saved_${id}`] = true
       console.error('Failed to delete saved opportunity from DB:', err)
     })
 }
 }, [showToast]);

 return { saved, toggleSaved, setSaved };
};

// Search State Persistence Hook
const useSearchStatePersistence = () => {
 const SEARCH_STATE_KEY = 'searchState'
 const SEARCH_RESULTS_KEY = 'searchResultsCache'

 const saveSearchState = useCallback((state: any) => {
 try {
 sessionStorage.setItem(SEARCH_STATE_KEY, JSON.stringify(state));
 } catch (error) {
 console.error('Failed to save search state:', error);
 }
 }, [SEARCH_STATE_KEY]);

 const restoreSearchState = useCallback(() => {
 try {
 const saved = sessionStorage.getItem(SEARCH_STATE_KEY);
 if (saved) {
 return JSON.parse(saved);
 }
 } catch (error) {
 console.error('Failed to restore search state:', error);
 }
 return null;
 }, [SEARCH_STATE_KEY]);

 const saveSearchResults = useCallback((payload: {
 data: ApiResponse
 searchParams: string
 currentPage: number
 hasMoreResults: boolean
 }) => {
  try {
   sessionStorage.setItem(SEARCH_RESULTS_KEY, JSON.stringify(payload))
  } catch (error) {
   console.error('Failed to save search results cache:', error)
  }
 }, [SEARCH_RESULTS_KEY])

 const restoreSearchResults = useCallback(() => {
  try {
   const saved = sessionStorage.getItem(SEARCH_RESULTS_KEY)
   if (!saved) return null
   return JSON.parse(saved) as {
    data: ApiResponse
    searchParams: string
    currentPage: number
    hasMoreResults: boolean
   }
  } catch (error) {
   console.error('Failed to restore search results cache:', error)
  }
  return null
 }, [SEARCH_RESULTS_KEY])

 const clearSearchResults = useCallback(() => {
  try {
   sessionStorage.removeItem(SEARCH_RESULTS_KEY)
  } catch (error) {
   console.error('Failed to clear search results cache:', error)
  }
 }, [SEARCH_RESULTS_KEY])

 return { saveSearchState, restoreSearchState, saveSearchResults, restoreSearchResults, clearSearchResults };
};

// Error Boundary Component
class SearchErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
 constructor(props: { children: React.ReactNode }) {
 super(props);
 this.state = { hasError: false };
 }

 static getDerivedStateFromError(error: Error) {
 return { hasError: true };
 }

 componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
 console.error('Search Error:', error, errorInfo);
 }

 render() {
 if (this.state.hasError) {
 return (
 <div className="min-h-screen bg-white flex items-center justify-center">
 <div className="text-center p-8">
 <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4"/>
 <h2 className="text-2xl font-bold text-gray-900 mb-2">Search Failed to Load</h2>
 <p className="text-gray-600 mb-4">Please refresh the page and try again.</p>
 <button
 onClick={() => window.location.reload()}
 className="px-6 py-3 bg-(--color-surface-muted) text-white rounded-lg hover:bg-(--color-surface-muted) transition-colors"
 >
 Refresh Page
 </button>
 </div>
 </div>
 )
 }
 return this.props.children;
 }
}

// Dismissable warning banner shown when no Quick Search results are loaded yet
function WarnBanner() {
 const [dismissed, setDismissed] = React.useState(false)
 if (dismissed) return null
 return (
 <div className="flex items-center gap-3 px-4 py-3 rounded-lg text-white font-bold text-sm shadow-lg"
 style={{ background: 'linear-gradient(90deg, #92400e 0%, #78350f 100%)' }}>
 <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-300"/>
 <span className="flex-1">
 ⚠️ Run Quick Search first to load results — then use these filters to narrow them down client-side.
 </span>
 <button
 onClick={() => setDismissed(true)}
 className="ml-2 px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition-all shrink-0"
 aria-label="Dismiss"
 >
 Got it ✓
 </button>
 </div>
 )
}


export default function SearchPage() {
 return (
 <Suspense fallback={
 <div className="min-h-screen bg-white flex items-center justify-center">
 <div className="animate-spin h-12 w-12 border-4 border-[--color-border] border-t-transparent rounded-full"></div>
 </div>
 }>
 <SearchPageContent />
 </Suspense>
 );
}

function QuickDateLookup({
 keywords,
 setKeywords,
 postedAfter,
 setPostedAfter,
 responseDeadlineBefore,
 setResponseDeadlineBefore,
 onRunSearch,
 onStopSearch,
 onReset,
 loading,
 searchDuration,
 onSaveSearch,
 onCreateAlert,
}: QuickDateLookupProps) {
 return (
 <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border-2 border-(--color-border) shadow-lg mb-4">
 {/* Header row: title on left, Save/Alert buttons on right */}
 <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
 <div>
 <h3 style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="text-2xl font-bold text-blue-900 uppercase tracking-wide leading-none">
 Quick Solicitations Lookup
 </h3>
 <p className="text-sm text-blue-700 font-semibold mt-0.5">Fast search with date quick-fills — refine further with Advanced Filters</p>
 </div>
 {/* Save Search + Create Alert */}
 <div className="flex items-center gap-3 flex-wrap mt-2 mb-4">
   <button
     onClick={onSaveSearch}
     className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 shadow-md transition-all"
     aria-label="Save this search"
   >
     <Save className="h-5 w-5 shrink-0"/>
     Save This Search
   </button>
   <button
     onClick={onCreateAlert}
     className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white font-bold text-base hover:bg-blue-700 shadow-md transition-all"
     aria-label="Create alert from this search"
   >
     <Bell className="h-5 w-5 shrink-0"/>
     Create an Alert from This Search
   </button>
 </div>
 </div>

 {/* 3-column: keyword + posted date (with quick-fills) + deadline date (with quick-fills) */}
 <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
 {/* Keyword */}
 <div>
 <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">
 Keyword:
 </label>
 <input
 type="text"
 value={keywords}
 onChange={(e) => setKeywords(e.target.value)}
 onKeyDown={(e) => { if (e.key === 'Enter') onRunSearch() }}
 placeholder="e.g., Data Analytics"
 className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-400 text-gray-900 placeholder-gray-500 hover:border-(--color-border) focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--color-border) transition-colors"
 />
 </div>

 {/* Solicitation Posted Date */}
 <div>
 <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">
 Solicitation Posted Date:
 </label>
 <input
 type="date"
 value={postedAfter}
 onChange={(e) => setPostedAfter(e.target.value)}
 className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-400 text-gray-900 hover:border-(--color-border) focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-(--color-border) mb-2"
 />
 <div className="font-bold text-gray-700 mb-1" style={{ fontSize: "13px" }}>POSTED WITHIN:</div>
 <div className="flex flex-wrap gap-1">
 {[['1 Mo', -1], ['3 Mo', -3], ['6 Mo', -6], ['9 Mo', -9], ['12 Mo', -12]].map(([label, months]) => {
 const colors = ['from-[var(--color-primary)] to-[var(--color-primary-hover)]', 'from-[var(--color-primary)] to-[var(--color-primary-hover)]', 'from-[var(--color-primary)] to-[var(--color-primary-hover)]', 'from-[var(--color-primary)] to-[var(--color-primary-hover)]', 'from-slate-600 to-slate-800']
 const idx = ['-1', '-3', '-6', '-9', '-12'].indexOf(String(months))
 return (
 <button
 key={label}
 type="button"
 onClick={() => {
 const d = new Date()
 d.setMonth(d.getMonth() + (months as number))
 setPostedAfter(d.toISOString().split('T')[0])
 }}
 className={`px-3 py-1.5 text-xs font-bold bg-linear-to-r ${colors[idx].replace('from-[var(--color-primary)]','from-(--color-primary)').replace('to-[var(--color-primary-hover)]','to-(--color-primary-hover)')} text-white rounded-lg hover:shadow-md transition-all`}
 >
 {label}
 </button>
 )
 })}
 </div>
 </div>

 {/* Submission Deadline Date */}
 <div>
 <label style={{ fontFamily: 'var(--font-ui), system-ui, sans-serif' }} className="block text-base font-bold text-gray-900 mb-2">
 Submission Deadline Date:
 </label>
 <input
 type="date"
 value={responseDeadlineBefore}
 onChange={(e) => setResponseDeadlineBefore(e.target.value)}
 className="w-full px-4 py-2.5 text-base font-semibold rounded-lg bg-white border-2 border-gray-400 text-gray-900 hover:border-[var(--color-border)] focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-[var(--color-border)] mb-2"
 />
 <div className="font-bold text-gray-700 mb-1" style={{ fontSize: "13px" }}>DEADLINE WITHIN:</div>
 <div className="flex flex-wrap gap-1">
 {[['1 Mo', 1, 'from-[var(--color-primary)] to-[var(--color-primary-hover)]'], ['3 Mo', 3, 'from-[var(--color-primary)] to-[var(--color-primary-hover)]'], ['6 Mo', 6, 'from-[var(--color-primary)] to-[var(--color-primary-hover)]'], ['9 Mo', 9, 'from-[var(--color-primary)] to-[var(--color-primary-hover)]'], ['12 Mo', 12, 'from-[var(--color-primary)] to-[var(--color-primary-hover)]']].map(([label, months, color]) => (
 <button
 key={label as string}
 type="button"
 onClick={() => {
 const d = new Date()
 d.setMonth(d.getMonth() + (months as number))
 setResponseDeadlineBefore(d.toISOString().split('T')[0])
 }}
 className={`px-3 py-1.5 text-xs font-bold bg-linear-to-r ${(color as string).replace('from-[var(--color-primary)]','from-(--color-primary)').replace('to-[var(--color-primary-hover)]','to-(--color-primary-hover)')} text-white rounded-lg hover:shadow-md transition-all`}
 >
 {label}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Action row: Run / Stop / Save / Alert */}
 <div className="flex flex-wrap items-center gap-2">
 <button
 onClick={onRunSearch}
 disabled={loading}
 className="pg-btn pg-btn-primary inline-flex items-center justify-center gap-2 px-8 py-3 text-base font-bold rounded-lg text-white transition-all shadow-md disabled:opacity-50 whitespace-nowrap"
 >
 {loading ? (
 <><Loader2 className="h-5 w-5 animate-spin"/>Searching...</>
 ) : (
 <><Search className="h-5 w-5"/>RUN QUICK SEARCH</>
 )}
 </button>
 <button
 onClick={onStopSearch}
 disabled={!loading}
 className="inline-flex items-center justify-center gap-2 px-5 py-3 text-base font-bold rounded-lg bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
 >
 <StopCircle className="h-5 w-5"/>
 STOP
 {loading && searchDuration > 0 && <span className="text-sm opacity-90">({searchDuration}s)</span>}
 </button>
 <div className="w-px h-8 bg-[var(--color-surface-muted)] mx-1 hidden sm:block"/>
 <button
 onClick={onSaveSearch}
 className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg bg-linear-to-r from-(--color-primary) to-(--color-primary-hover) text-white font-bold text-sm hover:shadow-lg hover:shadow-emerald-500/25 transition-all whitespace-nowrap"
 aria-label="Save current search"
 >
 <Save className="h-4 w-4 shrink-0"/>
 Save Search
 </button>
 <button
 onClick={onCreateAlert}
 className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg bg-linear-to-r from-(--color-primary) to-(--color-primary-hover) text-white font-bold text-sm hover:shadow-lg hover:shadow-violet-500/25 transition-all whitespace-nowrap"
 aria-label="Create email alert"
 >
 <Bell className="h-4 w-4 shrink-0"/>
 Create Alert
 </button>
 <button
 onClick={onReset}
 className="inline-flex items-center gap-1.5 px-4 py-3 rounded-lg bg-white border-2 border-gray-400 hover:bg-gray-50 text-gray-800 font-bold text-sm transition-all whitespace-nowrap shadow-sm"
 aria-label="Reset all fields"
 >
 <RefreshCw className="h-4 w-4 shrink-0"/>
 Reset All
 </button>
 </div>
 </div>
 )
}

// Keep a thin shim so existing call sites compile — unused after JSX update
interface QuickSearchProps {
 quickKeyword: string; setQuickKeyword: (v: string) => void
 quickPostedDate: string; setQuickPostedDate: (v: string) => void
 quickDeadlineDate: string; setQuickDeadlineDate: (v: string) => void
 onRunSearch: () => void; onStopSearch: () => void
 isSearching: boolean; isLoading: boolean
}
function QuickSearch(_p: QuickSearchProps) { return null }

// ── STEP 2: Add these helpers OUTSIDE the component (above SearchPageContent) ──

/** Write last search to sessionStorage so Dashboard & Insights can read it */
function writeSearchContext(results: any[], params: Record<string, string>) {
 try {
 sessionStorage.setItem('lastSearchResults', JSON.stringify({
 results: results.slice(0, 50),
 params,
 searchedAt: new Date().toISOString(),
 count: results.length,
 }))
 } catch { /* quota — ignore */ }
}

/** Simple toast hook (paste once near the top of the file) */
function useToast() {
 const [toast, setToast] = useState<string | null>(null)
 const showToast = useCallback((msg: string) => {
 setToast(msg)
 setTimeout(() => setToast(null), 2500)
 }, [])
 const ToastUI = toast ? (
 <div className="fixed bottom-6 right-6 z-200 flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-2xl text-sm font-bold">
 <Check className="h-4 w-4 text-(--color-primary)"/>
 {toast}
 </div>
 ) : null
 return { showToast, ToastUI }
}

// ── STEP 8: Add sticky prompt component + render ──
// Add this component definition above SearchPageContent:
function StickyResultsPrompt({
 count, keywords, postedAfter, responseDeadlineBefore, selectedSetAsides, selectedStates, onSave, onAlert, onDismiss,
}: { 
 count: number; keywords: string; 
 postedAfter?: string; responseDeadlineBefore?: string;
 selectedSetAsides?: string[]; selectedStates?: string[];
 onSave: () => void; onAlert: () => void; onDismiss: () => void 
}) {
 // Build a compact description
 const parts: string[] = []
 if (keywords) parts.push(`"${keywords}"`)
 if (postedAfter) parts.push(`posted ≥ ${new Date(postedAfter + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
 if (responseDeadlineBefore) parts.push(`due on or after ${new Date(responseDeadlineBefore + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`)
 if (selectedSetAsides && selectedSetAsides.length > 0) parts.push(`${selectedSetAsides.length} set-aside${selectedSetAsides.length > 1 ? 's' : ''}`)
 if (selectedStates && selectedStates.length > 0) parts.push(`${selectedStates.length} state${selectedStates.length > 1 ? 's' : ''}`)

 return (
 <div className="fixed bottom-0 left-0 right-0 z-50 bg-white text-slate-900 px-4 py-3 shadow-2xl border-t border-slate-200">
 <div className="max-w-440 mx-auto flex items-center justify-between gap-3 flex-wrap">
 <div className="flex items-center gap-3">
 <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0"/>
 <span className="font-bold text-sm text-slate-900">
 Found <span className="text-emerald-700 text-base">{count.toLocaleString()}</span> results
 {parts.length > 0 && <> for <span className="text-slate-700">{parts.join(' · ')}</span></>}
 {' '}— save this search or get alerts so you never miss an update
 </span>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={onSave}
 className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold text-sm rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
 >
 <Save className="h-4 w-4"/>Save Search
 </button>
 <button
 onClick={onAlert}
 className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg transition-colors bg-orange-500 text-white font-bold shadow-sm hover:bg-orange-600"
 >
 <Bell className="h-4 w-4"/>Get Alerts
 </button>
 <button
 onClick={onDismiss}
 className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
 aria-label="Dismiss"
 >
 <X className="h-4 w-4"/>
 </button>
 </div>
 </div>
 </div>
 )
}

// --- Main Component ---
// ============================================================
// ANIMATED COMPONENTS FOR DYNAMIC SEARCH PAGE
// ============================================================

// Animated Tips Carousel Component
function AnimatedTipsCarousel() {
 const [currentTip, setCurrentTip] = useState(0)
 
 const tips = [
 {
 icon: <FileText className="h-5 w-5"/>,
 text:"Pro tip: Use specific keywords like 'cybersecurity services' instead of broad terms like 'IT'.",
 color:"from-[var(--color-primary)] to-[var(--color-primary-hover)]"
 },
 {
 icon: <Calendar className="h-5 w-5"/>,
 text:"Quick trick: Use the date buttons below to instantly apply common time ranges.",
 color:"from-[var(--color-primary)] to-[var(--color-primary-hover)]"
 },
 {
 icon: <Bell className="h-5 w-5"/>,
 text:"Set up alerts to get notified when new opportunities match your saved filters.",
 color:"from-[var(--color-primary)] to-[var(--color-primary-hover)]"
 },
 {
 icon: <Shield className="h-5 w-5"/>,
 text:"VOSB advantage: apply set-aside filters to surface contracts reserved for eligible firms.",
 color:"from-[var(--color-primary)] to-[var(--color-primary-hover)]"
 },
 {
 icon: <MapPin className="h-5 w-5"/>,
 text:"Local advantage: filter by state to find nearby opportunities with lower competition.",
 color:"from-[var(--color-primary)] to-[var(--color-primary-hover)]"
 },
 {
 icon: <Clock className="h-5 w-5"/>,
 text:"Heads up: prioritize items with near deadlines first so you don't miss submission windows.",
 color:"from-[var(--color-primary)] to-[var(--color-primary-hover)]"
 }
 ]

 useEffect(() => {
 const interval = setInterval(() => {
 setCurrentTip((prev) => (prev + 1) % tips.length)
 }, 5000)
 return () => clearInterval(interval)
 }, [tips.length])

 return (
 <div className="relative mt-3 h-21 overflow-hidden sm:h-16.5">
 {tips.map((tip, index) => (
 <div
 key={index}
 className={`absolute inset-0 transition-all duration-700 ease-in-out ${
 index === currentTip 
 ? 'opacity-100 translate-y-0' 
 : index < currentTip 
 ? 'opacity-0 -translate-y-full' 
 : 'opacity-0 translate-y-full'
 }`}
 >
 <div className="rounded-lg border border-(--color-border) bg-(--color-surface-muted) p-2.5 shadow-sm sm:p-3">
 <div className="flex items-center gap-2.5 text-(--color-text-primary) sm:gap-3">
 <div className="shrink-0 rounded-lg bg-(--color-accent-soft) p-2">
 {tip.icon}
 </div>
 <p className="text-xs font-semibold leading-snug text-[var(--color-text-primary)] sm:text-sm">
 {tip.text}
 </p>
 </div>
 </div>
 </div>
 ))}
 
 <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 flex gap-1.5">
 {tips.map((_, index) => (
 <button
 key={index}
 onClick={() => setCurrentTip(index)}
 className={`w-1.5 h-1.5 rounded-full transition-all ${
 index === currentTip 
 ? 'bg-[var(--color-surface-muted)] w-4' 
 : 'bg-gray-500 hover:bg-gray-400'
 }`}
 aria-label={`Go to tip ${index + 1}`}
 />
 ))}
 </div>
 </div>
 )
}

// Quick Start Guide Component
function QuickStartGuide() {
 const [isOpen, setIsOpen] = useState(false)

 return (
 <div className="mt-3">
 <button
 onClick={() => setIsOpen(!isOpen)}
 className="w-full flex items-center justify-between p-3.5 bg-white rounded-xl border border-gray-300 hover:border-[var(--color-border)] transition-all shadow-sm"
 >
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center">
 <HelpCircle className="h-5 w-5 text-white"/>
 </div>
 <span className="text-sm sm:text-base font-semibold text-gray-900">
 {isOpen ? 'Hide Quick Start Guide' : 'New here? Click for Quick Start Guide'}
 </span>
 </div>
 {isOpen ? <ChevronUp className="h-5 w-5 text-gray-600"/> : <ChevronDown className="h-5 w-5 text-gray-600"/>}
 </button>

 {isOpen && (
 <div className="mt-2.5 bg-gray-50 rounded-xl p-4 sm:p-5 border border-gray-300 shadow">
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div className="flex gap-3">
 <div className="flex-shrink-0">
 <div className="w-8 h-8 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center text-white font-black text-sm">
 1
 </div>
 </div>
 <div>
 <h3 className="text-sm font-bold text-gray-900 mb-1">Enter Your Search</h3>
 <p className="text-sm text-gray-700 leading-relaxed">
 Type keywords, company names, products, or services. Leave blank to see all opportunities.
 </p>
 </div>
 </div>

 <div className="flex gap-3">
 <div className="flex-shrink-0">
 <div className="w-8 h-8 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center text-white font-black text-sm">
 2
 </div>
 </div>
 <div>
 <h3 className="text-sm font-bold text-gray-900 mb-1">Select Date Ranges</h3>
 <p className="text-sm text-gray-700 leading-relaxed">
 Use quick-fill buttons or pick custom dates to narrow your search.
 </p>
 </div>
 </div>

 <div className="flex gap-3">
 <div className="flex-shrink-0">
 <div className="w-8 h-8 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center text-white font-black text-sm">
 3
 </div>
 </div>
 <div>
 <h3 className="text-sm font-bold text-gray-900 mb-1">Click Search</h3>
 <p className="text-sm text-gray-700 leading-relaxed">
 Hit the green Search button to find matching opportunities from SAM.gov.
 </p>
 </div>
 </div>

 <div className="flex gap-3">
 <div className="flex-shrink-0">
 <div className="w-8 h-8 bg-[var(--color-surface-muted)] rounded-lg flex items-center justify-center text-white font-black text-sm">
 4
 </div>
 </div>
 <div>
 <h3 className="text-sm font-bold text-gray-900 mb-1">Refine & Save</h3>
 <p className="text-sm text-gray-700 leading-relaxed">
 Use filters to narrow results, then save your search or create an email alert.
 </p>
 </div>
 </div>
 </div>

 <div className="mt-3 pt-3 border-t border-gray-300">
 <h3 className="text-sm font-bold text-gray-900 mb-3">Pro Tips</h3>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
 <div className="flex items-start gap-2 text-sm text-gray-700">
 <CheckCircle className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5"/>
 <span><strong>Be Specific:</strong>"Cloud services"beats"IT"</span>
 </div>
 <div className="flex items-start gap-2 text-sm text-gray-700">
 <CheckCircle className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5"/>
 <span><strong>Check Daily:</strong> New opportunities posted constantly</span>
 </div>
 <div className="flex items-start gap-2 text-sm text-gray-700">
 <CheckCircle className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5"/>
 <span><strong>Save Searches:</strong> Rerun successful searches quickly</span>
 </div>
 <div className="flex items-start gap-2 text-sm text-gray-700">
 <CheckCircle className="h-4 w-4 text-[var(--color-primary)] flex-shrink-0 mt-0.5"/>
 <span><strong>Set Alerts:</strong> Get emailed automatically</span>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}

// Searching Facts Component
function SearchingFacts({ duration }: { duration: number }) {
 const [currentFact, setCurrentFact] = useState(0)

 const facts = [
"💼 The U.S. government spends over $600 billion annually on contracts",
"📊 Small businesses win over 25% of federal contract dollars each year",
"🎯 Set-aside opportunities give small businesses exclusive access to bids",
"⚡ SAM.gov posts thousands of new opportunities every week",
"🏆 Veterans can access special set-asides through the SDVOSB program",
"🌟 Women-owned businesses have dedicated WOSB opportunities",
"📈 Federal contracts can transform small businesses into major players",
"🔍 Being specific in searches helps you find better-matched opportunities"
 ]

 useEffect(() => {
 if (duration > 0 && duration % 3 === 0) {
 setCurrentFact((prev) => (prev + 1) % facts.length)
 }
 }, [duration, facts.length])

 return (
 <div className="mt-4 pt-4 border-t-2 border-[var(--color-border)]">
 <div className="flex items-center gap-3">
 <Sparkles className="h-5 w-5 text-blue-600 animate-pulse"/>
 <p className="text-base font-semibold text-blue-800">
 <strong>Did you know?</strong> {facts[currentFact]}
 </p>
 </div>
 </div>
 )
}


function SearchPageContent() {
 const router = useRouter()
 const { data: session, status } = useSession()
 const FIRST_SIGNIN_NAV_GUIDE_KEY = 'pgc_search_signedin_nav_guide_seen_v1'

 // Access Control
 const {
 hasValidAccess,
 canBrowse,
 reminderLevel,
 showReminderModal,
 setShowReminderModal,
 showLockoutModal,
 setShowLockoutModal,
 isAuthenticated,
 planLoading,
 } = useBrowsingSession()

 const DEFAULT_LIMIT = 10000 // Increased to get more results
 const LOAD_MORE_INCREMENT = 1000
 const DEFAULT_RESULTS_PER_PAGE = 25

 // Search form states
 const [keywords, setKeywords] = useState('')
 const [naics, setNaics] = useState('')
 const [agency, setAgency] = useState('')
 const [selectedSetAsides, setSelectedSetAsides] = useState<string[]>([])
 const [selectedStates, setSelectedStates] = useState<string[]>([])
 // ✅ QUICK SEARCH STATE
 const [quickKeyword, setQuickKeyword] = useState('')
 const [quickPostedDate, setQuickPostedDate] = useState(getSixMonthsAgo())
 const [quickDeadlineDate, setQuickDeadlineDate] = useState(getToday())
 
 // Calculate default dates: 6 months back for"from", 1 month ahead for response deadline (both auto-update daily)
 const defaults = useMemo(() => {
 const today = new Date()
 const lookback = new Date()
 lookback.setMonth(lookback.getMonth() - 6) // Always 6 months back from today
 const responseDeadlineDate = new Date()
 responseDeadlineDate.setMonth(responseDeadlineDate.getMonth() + 1) // Always 1 month ahead from today
 return {
 from: lookback.toISOString().split('T')[0],
 responseDeadline: responseDeadlineDate.toISOString().split('T')[0]
 }
 }, []) // Recalculates on component mount (each day)

 const [postedAfter, setPostedAfter] = useState(getSixMonthsAgo())
 const [postedBefore, setPostedBefore] = useState('') // Removed default - field will be hidden
 const [showDateWarning, setShowDateWarning] = useState(false)
 const [dateWarningMessage, setDateWarningMessage] = useState('')

 // Validate date range doesn't exceed 364 days
 const validateDateRange = useCallback((startDate: string, endDate: string) => {
 if (!startDate || !endDate) return true
 
 const start = new Date(startDate)
 const end = new Date(endDate)
 const diffTime = Math.abs(end.getTime() - start.getTime())
 const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
 
 if (diffDays > 364) {
 setDateWarningMessage(
 `⚠️ Your date range is ${diffDays} days. SAM.gov's API limits searches to 364 days (1 year). Please select a shorter date range for better results.`
 )
 setShowDateWarning(true)
 return false
 }
 
 setShowDateWarning(false)
 return true
 }, [])

 const [procurementType, setProcurementType] = useState('') // '' = All Types
 const [isActive, setIsActive] = useState('') // 'true' | 'false' | '' (all)
 const [activeFilter, setActiveFilter] = useState<string | null>(null) // null = show all;"true"/"false"= subset view

 // ===== ADVANCED SEARCH — client-side filter applied flag =====
 const [advancedApplied, setAdvancedApplied] = useState(false) // true = filter results client-side
 // Separate keyword/date fields for Advanced Search client-side filtering
 const [advKeywords, setAdvKeywords] = useState('')
 const [advPostedAfter, setAdvPostedAfter] = useState(getSixMonthsAgo())
 const [advResponseDeadline, setAdvResponseDeadline] = useState(getToday())

 // ===== NEW CRITICAL SEARCH PARAMETERS =====
 // Phase 1: Critical
 const [solicitationNumber, setSolicitationNumber] = useState('') // Priority 1B - Direct lookup
 const [classificationCode, setClassificationCode] = useState('') // Priority 1C - PSC codes
 const [responseDeadline, setResponseDeadline] = useState(getToday())// Priority 1A - CRITICAL - Filter by specific deadline date (default: today)
 // Empty by default - no upper limit
 const [responseDeadlineAfter, setResponseDeadlineAfter] = useState(getToday())
 const [responseDeadlineBefore, setResponseDeadlineBefore] = useState(getToday())

 // Phase 2: High Value
 const [noticeId, setNoticeId] = useState('') // Priority 2B - Direct ID
 const [opportunityStatus, setOpportunityStatus] = useState('active') // Priority 2A - Default to Active status
 const [disabledFilters, setDisabledFilters] = useState<Set<string>>(new Set())

 // Phase 3: Medium Value
 const [placeOfPerformanceZip, setPlaceOfPerformanceZip] = useState('') // Priority 3A - ZIP
 const [organizationCode, setOrganizationCode] = useState('') // Priority 3B - Org code

 // PERFORMANCE FIX: Debounce keywords to reduce API calls
 const debouncedKeywords = useDebounce(keywords, 500)
 
 // PERFORMANCE FIX: AbortController for canceling requests
 const abortControllerRef = useRef<AbortController | null>(null)

 // UI states
 const [loading, setLoading] = useState(false)
 const [loadingMore, setLoadingMore] = useState(false)
 const [error, setError] = useState<string | null>(null)
 const [data, setData] = useState<ApiResponse | null>(null)
 const [hasSearched, setHasSearched] = useState(false)
 const [showFilters, setShowFilters] = useState(false)
 const [showExportMenu, setShowExportMenu] = useState(false)
 const [showSavedOnly, setShowSavedOnly] = useState(false)
 const [showAllSearchParams, setShowAllSearchParams] = useState(false)
 const [expanded, setExpanded] = useState<Record<string, boolean>>({})
 const [copiedId, setCopiedId] = useState<string | null>(null)
 const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
 const [sortBy, setSortBy] = useState<"posted-desc"|"posted-asc"|"deadline-desc"|"deadline-asc"|"relevance">("posted-desc")
 const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
 
 // Search timer for stop button
 const [searchStartTime, setSearchStartTime] = useState<Date | null>(null)
 const [searchDuration, setSearchDuration] = useState(0)

 // Access control - with feature-specific gating
 const [showAccessModal, setShowAccessModal] = useState(false)
 const [blockedFeature, setBlockedFeature] = useState('Advanced Federal Bid Search')
 const pendingActionRef = useRef<(() => void) | null>(null)

 const [isSignUp, setIsSignUp] = useState(true)
 const [showSignedInNavGuide, setShowSignedInNavGuide] = useState(false)

 // Detail drawer
 const [selectedOpp, setSelectedOpp] = useState<Opp | null>(null)

 // ✅ FIXED: Unified modal state
 const [showSaveModal, setShowSaveModal] = useState(false)
 
 // ✅ Alert builder modal state (used when arriving with ?action=create-alert)
 const [showAlertBuilder, setShowAlertBuilder] = useState(false)
const [saveModalMode, setSaveModalMode] = useState<'save' | 'alert'>('save')
 const [showSuccessModal, setShowSuccessModal] = useState(false)
 const [successData, setSuccessData] = useState({
 searchName: '',
 isSubscription: false,
 saved_search_id: null as string | null
 })

 // Results limit and pagination
 const [resultsLimit, setResultsLimit] = useState(DEFAULT_LIMIT)
 const [hasMoreResults, setHasMoreResults] = useState(false)
 const [currentPage, setCurrentPage] = useState(1)
 const [uiPage, setUiPage] = useState(1)
 const [resultsPerPage, setResultsPerPage] = useState(DEFAULT_RESULTS_PER_PAGE)
 // Drill-down states
 const [showSetAsideDrilldown, setShowSetAsideDrilldown] = useState(false)
 const [showStateDrilldown, setShowStateDrilldown] = useState(false)
 const [showNaicsDrilldown, setShowNaicsDrilldown] = useState(false)
 const [showAgencyDrilldown, setShowAgencyDrilldown] = useState(false)

 // Interactive breakdown states
 const [expandedBreakdown, setExpandedBreakdown] = useState<'setAsides' | 'naics' | 'agencies' | 'states' | null>(null)

 // Refs
 const resultsRef = useRef<HTMLDivElement>(null)
 const filtersRef = useRef<HTMLDivElement>(null)
 const lastSearchParamsRef = useRef<string>('') // CRITICAL FIX: Track last search to prevent duplicates
 const searchCardRef = useRef<HTMLDivElement>(null)
 const [showStickyBar, setShowStickyBar] = useState(false)

 // Custom hooks
 const { recentSearches, saveSearchToHistory, setRecentSearches } = useSearchHistory();
 const { showToast, ToastUI } = useToast()
 const [showStickyPrompt, setShowStickyPrompt] = useState(false)
 const [stickyPromptDismissed, setStickyPromptDismissed] = useState(false)
 const { saved, toggleSaved, setSaved } = useOpportunityManagement(showToast);
 const { saveSearchState, restoreSearchState, saveSearchResults, restoreSearchResults, clearSearchResults } = useSearchStatePersistence();

 const dismissSignedInNavGuide = useCallback(() => {
 try {
 localStorage.setItem(FIRST_SIGNIN_NAV_GUIDE_KEY, '1')
 } catch {}
 setShowSignedInNavGuide(false)
 }, [FIRST_SIGNIN_NAV_GUIDE_KEY])

 // Timer effect - updates search duration every second
 useEffect(() => {
 if (!loading || !searchStartTime) {
 setSearchDuration(0)
 return
 }

 const interval = setInterval(() => {
 const duration = Math.floor((Date.now() - searchStartTime.getTime()) / 1000)
 setSearchDuration(duration)
 }, 1000)

 return () => clearInterval(interval)
 }, [loading, searchStartTime])

 // Stop/Cancel search function with keyboard shortcut
 const stopSearch = useCallback(() => {
 if (abortControllerRef.current) {
 abortControllerRef.current.abort('Search stopped by user')
 abortControllerRef.current = null
 }
 setLoading(false)
 setLoadingMore(false)
 setSearchStartTime(null)
 setSearchDuration(0)
 console.log('🛑 Search stopped by user')
 }, [])

 // Add keyboard shortcut for stopping search
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === 'Escape' && loading) {
 stopSearch();
 }
 };

 document.addEventListener('keydown', handleKeyDown);
 return () => document.removeEventListener('keydown', handleKeyDown);
 }, [loading, stopSearch]);

 const scrollToResults = useCallback(() => {
 resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
 }, [])

 const scrollToSearch = useCallback(() => {
 searchCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
 }, [])

 // IntersectionObserver: show sticky search bar when search card scrolls out of view
 useEffect(() => {
 const el = searchCardRef.current
 if (!el) return
 const obs = new IntersectionObserver(
 ([entry]) => setShowStickyBar(!entry.isIntersecting),
 { threshold: 0 }
 )
 obs.observe(el)
 return () => obs.disconnect()
 }, [])

 // Load saved data from localStorage
 useEffect(() => {
 try {
 const savedSearches = localStorage.getItem('govcon_recent_searches')
 if (savedSearches) setRecentSearches(JSON.parse(savedSearches).slice(0, 5))
 
 const savedData = localStorage.getItem('govcon_saved_opportunities')
 if (savedData) setSaved(JSON.parse(savedData))

 const savedViewMode = localStorage.getItem('pgc_search_view_mode')
 if (savedViewMode === 'list' || savedViewMode === 'grid') {
 setViewMode(savedViewMode)
 }

 // Restore search state from sessionStorage
 const restoredState = restoreSearchState();
 if (restoredState) {
 // Optionally restore state here
 }

 // Restore prior result set only when user navigates back/forward.
 // On full refresh, start with a clean search page.
 const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
 const isBackForward = navEntry?.type === 'back_forward'
 if (isBackForward) {
 const restoredResults = restoreSearchResults()
 if (restoredResults?.data?.opportunitiesData?.length) {
  setData(restoredResults.data)
  setCurrentPage(restoredResults.currentPage || 1)
  setHasMoreResults(Boolean(restoredResults.hasMoreResults))
  setHasSearched(true)
  if (restoredResults.searchParams) {
   lastSearchParamsRef.current = restoredResults.searchParams
  }
 }
 } else {
 clearSearchResults()
 }
 } catch (error) {
 console.error('Failed to load data:', error)
 }
 }, [setRecentSearches, setSaved, restoreSearchState, restoreSearchResults, clearSearchResults])

 // First-time signed-in helper: show lightweight navigation guide once per browser.
 useEffect(() => {
 if (status !== 'authenticated') {
 setShowSignedInNavGuide(false)
 return
 }

 try {
 const seen = localStorage.getItem(FIRST_SIGNIN_NAV_GUIDE_KEY)
 setShowSignedInNavGuide(!seen)
 } catch {
 setShowSignedInNavGuide(false)
 }
 }, [status])

 useEffect(() => {
 try {
 localStorage.setItem('pgc_search_view_mode', viewMode)
 } catch {}
 }, [viewMode])

 // Persist returned results so users can navigate away and return without re-querying.
 useEffect(() => {
 if (!data?.opportunitiesData?.length) return

 saveSearchResults({
  data,
  searchParams: lastSearchParamsRef.current,
  currentPage,
  hasMoreResults,
 })
 }, [data, currentPage, hasMoreResults, saveSearchResults])

 const searchParams = useSearchParams()
 const hydratedUrlParamsRef = useRef<string | null>(null)

 // Hydrate search UI + run search when arriving with URL filters (e.g., Quick Search -> Full Search).
 useEffect(() => {
 if (!searchParams || planLoading) return
 if (searchParams.get('loadSavedSearch')) return

 const rawSnapshot = searchParams.toString()
 if (!rawSnapshot || hydratedUrlParamsRef.current === rawSnapshot) return

 const pick = (...keys: string[]) => {
 for (const key of keys) {
 const value = searchParams.get(key)
 if (value && value.trim()) return value.trim()
 }
 return ''
 }

 const splitCsv = (value: string) =>
 value
 .split(',')
 .map(v => v.trim())
 .filter(Boolean)

 const toDateInput = (value: string) => {
 const raw = value.trim()
 if (!raw) return ''
 if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw
 const slashMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
 if (slashMatch) {
 const mm = slashMatch[1].padStart(2, '0')
 const dd = slashMatch[2].padStart(2, '0')
 const yyyy = slashMatch[3]
 return `${yyyy}-${mm}-${dd}`
 }
 const parsed = new Date(raw)
 if (Number.isNaN(parsed.getTime())) return ''
 return parsed.toISOString().slice(0, 10)
 }

 const keywordsFromUrl = pick('title', 'keyword', 'q', 'query', 'search')
 const naicsFromUrl = pick('ncode', 'naics')
 const classCodeFromUrl = pick('ccode')
 const agencyFromUrl = pick('organizationName', 'deptname', 'agency')
 const ptypeFromUrl = pick('ptype')
 const setAsideFromUrl = pick('typeOfSetAside', 'setAside')
 const stateFromUrl = pick('state')
 const solicitationFromUrl = pick('solnum')
 const zipFromUrl = pick('zip')
 const statusFromUrl = pick('status')
 const postedFrom = toDateInput(pick('postedFrom', 'posted_after'))
 const postedTo = toDateInput(pick('postedTo', 'posted_before'))
 const deadlineTo = toDateInput(pick('rdlto', 'responseDeadlineTo', 'responseDeadline'))

 const stateCodes = splitCsv(stateFromUrl)
 .map(s => s.toUpperCase())
 .filter(s => s !== 'ALL' && s !== 'ANY')
 const setAsideCodes = stringToSetAsideCodes(setAsideFromUrl)

 const hasFilters = Boolean(
 keywordsFromUrl ||
 naicsFromUrl ||
 classCodeFromUrl ||
 agencyFromUrl ||
 ptypeFromUrl ||
 setAsideCodes.length > 0 ||
 stateCodes.length > 0 ||
 solicitationFromUrl ||
 zipFromUrl ||
 statusFromUrl ||
 postedFrom ||
 postedTo ||
 deadlineTo
 )
 if (!hasFilters) return

 hydratedUrlParamsRef.current = rawSnapshot

 setKeywords(keywordsFromUrl)
 setNaics(naicsFromUrl)
 setClassificationCode(classCodeFromUrl)
 setAgency(agencyFromUrl)
 setProcurementType(ptypeFromUrl)
 setSelectedSetAsides(setAsideCodes)
 setSelectedStates(stateCodes)
 setSolicitationNumber(solicitationFromUrl)
 setPlaceOfPerformanceZip(zipFromUrl)
 if (statusFromUrl) setOpportunityStatus(statusFromUrl)
 if (postedFrom) setPostedAfter(postedFrom)
 if (postedTo) setPostedBefore(postedTo)
 if (deadlineTo) {
 setResponseDeadline(deadlineTo)
 setResponseDeadlineBefore(deadlineTo)
 }

 void executeSearchWithParams({
 keywords: keywordsFromUrl,
 naics: naicsFromUrl,
 classificationCode: classCodeFromUrl,
 agency: agencyFromUrl,
 procurementType: ptypeFromUrl,
 setAside: setAsideCodes.join(','),
 stateOfPerformance: stateCodes.join(','),
 solicitationNumber: solicitationFromUrl,
 placeOfPerformanceZip: zipFromUrl,
 opportunityStatus: statusFromUrl || opportunityStatus,
 postedAfter: postedFrom,
 postedBefore: postedTo,
 responseDeadlineTo: deadlineTo,
 responseDeadline: deadlineTo,
 })
 }, [searchParams, planLoading])

 // Auto-load saved search if loadSavedSearch param is present
 useEffect(() => {
 const savedSearchId = searchParams?.get('loadSavedSearch');
 const runImmediately = searchParams?.get('run') === '1';
 
 if (!savedSearchId) return;
 
 // Wait for subscription to load before running
 if (planLoading) {
 console.log('Waiting for subscription data before loading saved search...');
 return;
 }

 (async () => {
 try {
 console.log('Loading saved search:', savedSearchId);
 const res = await fetch(`/api/saved-searches/${savedSearchId}`);
 if (!res.ok) {
 console.error('Failed to load saved search:', res.status);
 return;
 }
 
 const { search } = await res.json();
 console.log('✅ Loaded saved search:', search);
 console.log('🔍 Date fields in saved search:', {
 posted_after: search.posted_after,
 posted_before: search.posted_before,
 rdl_from: search.rdl_from,
 rdl_to: search.rdl_to,
 postedAfter: search.posted_after,
 postedBefore: search.posted_before,
 });

 // Helper to convert DateTime to date string (YYYY-MM-DD)
 const toDateString = (dateTime: any): string => {
 if (!dateTime) return '';
 try {
 // If it's already just a date string, return it
 if (typeof dateTime === 'string' && !dateTime.includes('T')) {
 return dateTime;
 }
 // Otherwise parse and extract date part
 const date = new Date(dateTime);
 return date.toISOString().split('T')[0];
 } catch {
 return '';
 }
 };

 // Map database field names to UI/API field names
 const mappedParams = {
 keywords: search.keywords || '',
 naics: search.naics || '',
 agency: search.agency || '',
 setAside: search.setAside || '', // Database uses set_aside
 stateOfPerformance: search.stateOfPerformance || '', // Database uses state_of_performance
 procurementType: search.procurementType || '', // Database uses procurement_type
 postedAfter: toDateString(search.posted_after), // Convert DateTime to date string
 postedBefore: toDateString(search.posted_before), // Convert DateTime to date string
 is_active: search.is_active !== null && search.is_active !== undefined && search.is_active !== 'undefined' ? search.is_active : '',
 solicitationNumber: search.solicitation_number || '', // Database uses solicitation_number
 classificationCode: search.classification_code || '', // Database uses classification_code
 responseDeadlineFrom: toDateString(search.rdl_from), // Database uses rdl_from
 responseDeadlineTo: toDateString(search.rdl_to), // Database uses rdl_to
 noticeId: search.noticeId || '', // Database uses notice_id
 opportunityStatus: search.opportunity_status || '', // Database uses opportunity_status
 placeOfPerformanceZip: search.place_of_performance_zip || '', // Database uses place_of_performance_zip
 organizationCode: search.organization_code || '', // Database uses organization_code
 };

 // Apply the filters to UI state for display
 console.log('📝 Setting UI state from saved search...');
 setKeywords(mappedParams.keywords);
 setNaics(mappedParams.naics);
 setAgency(mappedParams.agency);
 setSelectedSetAsides(stringToSetAsideCodes(mappedParams.setAside));
 setSelectedStates(stringToLocationCodes(mappedParams.stateOfPerformance));
 setProcurementType(mappedParams.procurementType);
 setPostedAfter(mappedParams.postedAfter);
 setPostedBefore(mappedParams.postedBefore);
 setIsActive(mappedParams.is_active);
 setSolicitationNumber(mappedParams.solicitationNumber);
 setClassificationCode(mappedParams.classificationCode);
 setResponseDeadline(mappedParams.responseDeadlineTo || mappedParams.responseDeadlineFrom);
 setResponseDeadlineAfter(mappedParams.responseDeadlineFrom || '');
 setNoticeId(mappedParams.noticeId);
 setOpportunityStatus(mappedParams.opportunityStatus);
 setPlaceOfPerformanceZip(mappedParams.placeOfPerformanceZip);
 setOrganizationCode(mappedParams.organizationCode);
 
 console.log('✅ UI state updated with mapped params:', mappedParams);

 // CRITICAL FIX: If run=1, execute search IMMEDIATELY with mapped parameters
 // No timeout needed since we're passing params directly, not relying on state
 if (runImmediately) {
 console.log('🚀 Auto-running search with loaded parameters...');
 console.log('📋 Mapped parameters:', mappedParams);
 
 // Execute immediately - no timeout needed since we pass params directly
 executeSearchWithParams(mappedParams);
 }
 } catch (e) {
 console.error('Failed to auto-load saved search:', e);
 }
 })();
 }, [searchParams, planLoading]);
 
 // Handle URL action parameters from Alerts page
 useEffect(() => {
 const action = searchParams?.get('action')
 
 if (action === 'create-saved-search') {
 // Open saved search modal
 setTimeout(() => setShowSaveModal(true), 300)
 } else if (action === 'create-alert') {
 // Open alert modal 
 setTimeout(() => setShowAlertBuilder(true), 300)
 }
 }, [searchParams])

 useEffect(() => {
 try {
 const from = searchParams?.get('from')
 if (from !== 'cta') return
 // ✅ CRITICAL FIX: Don't show modal if user has valid access OR is in browsing window
 if (hasValidAccess || canBrowse) return

 const shown = sessionStorage.getItem('govcon_gate_shown')
 if (shown) return
 sessionStorage.setItem('govcon_gate_shown', 'true')

 setBlockedFeature('Advanced Federal Bid Search')
 pendingActionRef.current = () => { void runSearch(false, true) }
 setTimeout(() => setShowAccessModal(true), 350)
 } catch {
 // ignore
 }
 }, [searchParams, hasValidAccess, canBrowse])


// Save current search state
useEffect(() => {
 const searchState = {
 keywords, naics, agency, selectedSetAsides, selectedStates, // ✅ FIXED
 postedAfter, postedBefore, procurementType, isActive,
 solicitationNumber, classificationCode, responseDeadline,
 noticeId, opportunityStatus, placeOfPerformanceZip, organizationCode
 };
 saveSearchState(searchState);
}, [
 keywords, naics, agency, selectedSetAsides, selectedStates, // ✅ FIXED
 postedAfter, postedBefore, procurementType, isActive,
 solicitationNumber, classificationCode, responseDeadline,
 noticeId, opportunityStatus, placeOfPerformanceZip, organizationCode,
 saveSearchState
]);
 // Check if user has access - Robust version
 /**
 * Gate a premium action - if user doesn't have access, show modal
 * @param featureName - The name of the feature being accessed (shown in modal)
 * @returns true if user has access, false if gated (modal shown)
 */

 const requireAccess = useCallback((featureName: string): boolean => {
 const normalizedFeature = featureName.toLowerCase()

 // ── SEARCH: always allowed during loading OR while canBrowse ──────────
 // Never block search itself — the API will reject if truly unauthorised.
 // Showing the modal BEFORE the search would break the free-browse window.
 if (normalizedFeature.includes('search')) {
 return true
 }

 // ── PREMIUM FEATURES: save / alert / export / download ────────────────
 // These require a real authenticated account even within the browse window.
 if (planLoading || status === 'loading') {
 // Still resolving auth — silently defer, don't show modal yet
 return false
 }

 if (status === 'unauthenticated') {
 setBlockedFeature(featureName)
 setShowAccessModal(true)
 return false
 }

 // Auth-only features (no paid-plan gate): users who are already logged in
 // should be able to create alerts and save searches/opportunities.
 if (
  normalizedFeature.includes('email alerts') ||
  normalizedFeature.includes('save searches') ||
  normalizedFeature.includes('save opportunities') ||
  normalizedFeature.includes('export')
 ) {
  return true
 }

 // Authenticated but no active subscription
 if (!hasValidAccess) {
 setBlockedFeature(featureName)
 setShowAccessModal(true)
 return false
 }

 return true
 }, [hasValidAccess, canBrowse, planLoading, status])

 // ✅ Then define handleOpenSaveModal (line 1898)
 const handleOpenSaveModal = useCallback((mode: 'save' | 'alert') => {
 if (!requireAccess(mode === 'save' ? 'Save Searches' : 'Email Alerts for New Opportunities')) {
 return
 }
 setSaveModalMode(mode)
 setShowSaveModal(true)
 }, [requireAccess])

 // ✅ Handle successful save
 const handleSaveSuccess = useCallback(async (payload: any) => {
 try {
 console.log('💾 Saving search with payload:', payload)
 
 const endpoint = '/api/saved-searches'
 
 const response = await fetch(endpoint, {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 })

 if (!response.ok) {
 // 401 means unauthenticated — prompt sign-in instead of showing a generic error
 if (response.status === 401) {
 setShowSaveModal(false)
 setShowAccessModal(true)
 setBlockedFeature('Save Searches')
 return
 }
 const errorData = await response.json()
 throw new Error(errorData.error || 'Failed to save search')
 }

 const result = await response.json()
 console.log('✅ Save successful:', result)
 
 setShowSaveModal(false)
 setSuccessData({
 searchName: result.search?.name || payload.name,
 isSubscription: Boolean(payload.subscription_enabled),
 saved_search_id: result.search?.id || null
 })
 setShowSuccessModal(true)
 router.refresh()
 } catch (error: any) {
 console.error('❌ Failed to save:', error)
 throw error
 }
 }, [router])





 const handleCreateAlert = () => {
 if (status === 'loading') return
 if (!requireAccess('Email Alerts for New Opportunities')) return
 setShowAlertBuilder(true)
 }
 
 // Dashboard should be accessible to everyone
 const handleViewDashboard = () => {
 router.push('/dashboard')
 }

 // Helper: Convert YYYY-MM-DD to MM/dd/yyyy for SAM.gov API
 function formatDateForAPI(isoDate: string): string {
 if (!isoDate) return ''
 const date = new Date(isoDate)
 const month = String(date.getMonth() + 1).padStart(2, '0')
 const day = String(date.getDate()).padStart(2, '0')
 const year = date.getFullYear()
 return `${month}/${day}/${year}` // MM/dd/yyyy format required by SAM.gov
 }

 // Data validation function
 const validateSearchParams = useCallback((params: any) => {
 const errors: string[] = [];
 
 if (params.postedAfter && params.postedBefore) {
 const start = new Date(params.postedAfter);
 const end = new Date(params.postedBefore);
 if (start > end) {
 errors.push('Start date must be before end date');
 }
 }
 
 if (params.naics && !/^\d{2,6}$/.test(params.naics)) {
 errors.push('NAICS code must be 2-6 digits');
 }
 
 if (params.placeOfPerformanceZip && !/^\d{5}(-\d{4})?$/.test(params.placeOfPerformanceZip)) {
 errors.push('ZIP code must be 5 digits or 5+4 format');
 }
 
 return errors;
 }, []);

 /**
 * Execute search with explicit parameters (used for saved searches)
 * This bypasses state variables to avoid race conditions
 */
 const executeSearchWithParams = async (params: any) => {
 console.log('executeSearchWithParams called with:', params);
 
 // Validate parameters
 const validationErrors = validateSearchParams(params);
 if (validationErrors.length > 0) {
 setError(validationErrors.join('. '));
 return;
 }

 // CRITICAL: Check if user can browse
 // TODO: Reinstate this blocking mechanism after search testing
 // if (!canBrowse) {
 // console.log('Search blocked: canBrowse is false');
 // setShowLockoutModal(true);
 // return;
 // }

 // Gate the search action
 if (!requireAccess('Search Federal Opportunities')) {
 console.log('Search blocked: requireAccess failed');
 return;
 }

 console.log('All checks passed, executing search with saved params...');

 // Cancel any pending requests
 if (abortControllerRef.current) {
 abortControllerRef.current.abort('New search started');
 }

 const abortController = new AbortController();
 abortControllerRef.current = abortController;

 setLoading(true);
 setSearchStartTime(new Date());
 setResultsLimit(DEFAULT_LIMIT);
 setCurrentPage(1);
 setUiPage(1);
 setHasSearched(true);
 setShowAllSearchParams(false);
 setError(null);

 try {
 const qs = new URLSearchParams();

 // Build query from explicit params instead of state variables
 if (params.solicitationNumber?.trim()) {
 qs.set('solnum', params.solicitationNumber.trim());
 }
 if (params.noticeId?.trim()) {
 qs.set('noticeid', params.noticeId.trim());
 }
 if (params.keywords?.trim()) {
 qs.set('title', params.keywords.trim());
 }
 if (params.naics?.trim()) {
 qs.set('ncode', clamp(params.naics.trim(), 6));
 }
 if (params.classificationCode?.trim()) {
 qs.set('ccode', params.classificationCode.trim());
 }
 if (params.agency?.trim()) {
 qs.set('organizationName', clamp(params.agency.trim(), 120));
 }
 if (params.organizationCode?.trim()) {
 qs.set('organizationCode', params.organizationCode.trim());
 }
 if (params.setAside && params.setAside.trim() !== '') {
 qs.set('typeOfSetAside', params.setAside.trim());
 }
 if (params.procurementType?.trim()) {
 qs.set('ptype', params.procurementType.trim());
 }
 if (params.stateOfPerformance?.trim() && params.stateOfPerformance !== '') {
 qs.set('state', params.stateOfPerformance.trim());
 }
 if (params.placeOfPerformanceZip?.trim()) {
 qs.set('zip', params.placeOfPerformanceZip.trim());
 }
 if (params.opportunityStatus?.trim()) {
 qs.set('status', params.opportunityStatus.trim());
 }
 if (params.is_active && params.is_active !== '' && params.is_active !== 'undefined') {
 qs.set('isActive', params.is_active);
 }
 if (params.postedAfter?.trim()) {
 qs.set('postedFrom', formatDateForAPI(params.postedAfter.trim()));
 }
 if (params.postedBefore?.trim()) {
 qs.set('postedTo', formatDateForAPI(params.postedBefore.trim()));
 }
 // Handle response deadline range
 if (params.responseDeadlineFrom?.trim()) {
 qs.set('responseDeadlineFrom', formatDateForAPI(params.responseDeadlineFrom.trim()));
 }
 if (params.responseDeadlineTo?.trim()) {
 qs.set('responseDeadlineTo', formatDateForAPI(params.responseDeadlineTo.trim()));
 }
 // Fallback for single deadline field (backward compatibility)
 if (params.responseDeadline?.trim() && !params.responseDeadlineFrom && !params.responseDeadlineTo) {
 qs.set('responseDeadline', formatDateForAPI(params.responseDeadline.trim()));
 }

 qs.set('limit', '1000');
 qs.set('offset', '0');

 console.log('Calling API with saved search parameters:', qsToObj(qs));

 const res = await fetchWithRetry(`/api/sam?${qs.toString()}`, {
 method: 'GET',
 headers: {
 'Content-Type': 'application/json',
 ...(canBrowse && !isAuthenticated ? { 'x-browsing-session': 'true' } : {}),
 },
 signal: abortController.signal,
 }, 3, 2000); // 3 retries, 2 second initial delay

 if (!res.ok) {
 const errorText = await res.text();
 console.error('API request failed:', { status: res.status, errorText });
 
 // Handle payment-required status
 if (res.status === 402) {
 if (!canBrowse && !hasValidAccess) {
 setBlockedFeature('Search Federal Opportunities');
 setShowAccessModal(true);
 setError('Your trial has ended. Please upgrade to continue searching.');
 setLoading(false);
 return; // Don't throw - just return early
 }
 }

 // Build user-friendly error message
 let userMessage = 'Search failed. Please try again.';
 if (res.status === 400) {
 userMessage = 'Invalid search parameters. Please check your filters and try again.';
 } else if (res.status === 401 || res.status === 403) {
 userMessage = 'You need to sign in to search. Please log in and try again.';
 } else if (res.status === 404) {
 userMessage = 'Search service not found. Please refresh the page and try again.';
 } else if (res.status === 429) {
 userMessage = 'Too many searches. Please wait a moment and try again.';
 } else if (res.status === 500) {
 userMessage = 'SAM.gov service is temporarily unavailable. Please try again in a few moments.';
 } else if (res.status === 502 || res.status === 503 || res.status === 504) {
 userMessage = 'Connection to SAM.gov failed. The service may be down. Please try again later.';
 }
 
 // Set error state instead of throwing
 setError(userMessage);
 setData(null);
 setLoading(false);
 return; // Exit early instead of throwing
 }

 const json = await res.json();
 const payload = json as ApiResponse;
 const opps = payload.opportunitiesData || [];

 const total = payload.totalCount || 0;
 const loaded = (opps?.length ?? 0);
 const currentTotalLoaded = loaded;
 
 setHasMoreResults(currentTotalLoaded < total);
 setData(payload);
 setActiveFilter(null);
 setShowFilters(false);
 if ((opps?.length ?? 0) === 0) {
 showToast('No results found. Try broadening your search filters.')
 }
 
 saveSearchToHistory(qs.toString());

 // ── STEP 5: In runSearch(), after setData(payload) on a successful search, add: ──
 writeSearchContext(opps || [], qsToObj(qs))
 if (!stickyPromptDismissed) setTimeout(() => setShowStickyPrompt(true), 8000)

 console.log('API Search successful:', {
 results: (opps?.length ?? 0),
 totalRecords: total,
 hasMoreResults: currentTotalLoaded < total,
 });

 } catch (e: any) {
 if (e.name === 'AbortError' || abortController.signal.aborted) {
 console.log('Request aborted');
 return;
 }
 
 console.error('Search error:', e);
 setError(e?.message || 'Search failed. Please try again.');
 setData(null);
 } finally {
 if (!abortController.signal.aborted) {
 setLoading(false);
 setSearchStartTime(null);
 setSearchDuration(0);
 }
 }
 };

 // ✅ NEW: Run Quick Search - Auto-populate advanced fields 
 const runQuickSearch = useCallback(() => {
 // Auto-populate advanced search fields from quick search
 setKeywords(quickKeyword)
 setPostedAfter(quickPostedDate)
 setResponseDeadline(quickDeadlineDate)
 
 // Also populate advanced search fields so they're in sync
 setAdvKeywords(quickKeyword)
 setAdvPostedAfter(quickPostedDate)
 setAdvResponseDeadline(quickDeadlineDate)
 
 // Trigger the actual search
 runSearch(false, true)
 }, [quickKeyword, quickPostedDate, quickDeadlineDate])

 // ✅ NEW: Stop Quick Search
 const stopQuickSearch = useCallback(() => {
 setLoading(false)
 setLoadingMore(false)
 if (abortControllerRef.current) {
 abortControllerRef.current.abort('Search stopped by user')
 abortControllerRef.current = null
 }
 }, [])

 const runSearch = async (isLoadMore = false, forceRefresh = false) => {
 // ── Prevent duplicate simultaneous searches ───────────────────────────
 if (!isLoadMore && loading) return
 if (isLoadMore && loadingMore) return

 // ── Hard lockout: trial window expired ───────────────────────────────
 if (showLockoutModal && !hasValidAccess) {
 return
 }
 
 
 // PERFORMANCE FIX: Cancel any pending requests
 if (abortControllerRef.current) {
 abortControllerRef.current.abort('New search started')
 }

 // PERFORMANCE FIX: Create new AbortController for this request
 const abortController = new AbortController()
 abortControllerRef.current = abortController

 if (isLoadMore) {
 setLoadingMore(true)
 } else {
 setLoading(true)
 setSearchStartTime(new Date()) // Start timer
 setResultsLimit(DEFAULT_LIMIT)
 setCurrentPage(1)
 setUiPage(1)
 setHasSearched(true)
 setShowAllSearchParams(false)
 }
 
 setError(null)

 try {
 const qs = new URLSearchParams()
 
 // ===== DIRECT LOOKUPS (Priority - Skip other filters if provided) =====
 if (solicitationNumber.trim()) {
 qs.set('solnum', solicitationNumber.trim())
 }
 if (noticeId.trim()) {
 qs.set('noticeid', noticeId.trim())
 }
 
 // ===== TEXT SEARCH =====
 // Use the live keyword value for explicit button-triggered searches.
 if (keywords.trim()) {
 const kw = keywords.trim()
 const isNaicsLike = /^\d{2,6}$/.test(kw)
 if (isNaicsLike && !naics.trim()) { qs.set('ncode', kw) }
 else if (!isNaicsLike) { qs.set('title', kw) }
 }
 
 // ===== CLASSIFICATION CODES =====
 // NAICS Code
 if (naics.trim()) {
 qs.set('ncode', clamp(naics.trim(), 6))
 }
 // PSC Code (NEW - CRITICAL)
 if (classificationCode.trim()) {
 qs.set('ccode', classificationCode.trim())
 }
 
 // ===== ORGANIZATION =====
 // Agency/Department
 if (agency.trim()) {
 qs.set('organizationName', clamp(agency.trim(), 120))
 }
 // Organization Code (NEW)
 if (organizationCode.trim()) {
 qs.set('organizationCode', organizationCode.trim())
 }
 
 // SET-ASIDE TYPE - convert array to comma-separated string for API
 const setAsideString = setAsideCodesToString(selectedSetAsides)
 if (setAsideString) {
 qs.set('typeOfSetAside', setAsideString)
 }

 // Procurement Type (ptype)
 if (procurementType.trim()) {
 qs.set('ptype', procurementType.trim())
 }
 
 // STATE — skip if ncode is set (SAM.gov returns 0 when both sent together)
 const stateString = locationCodesToString(selectedStates)
 if (stateString && !qs.has('ncode')) { qs.set('state', stateString) }
 // ZIP Code (NEW)
 if (placeOfPerformanceZip.trim()) {
 qs.set('zip', placeOfPerformanceZip.trim())
 }
 
 // ===== STATUS =====
 if (!disabledFilters.has('status')) {
 qs.set('status', opportunityStatus.trim() || 'active')
 }
 // Active / Inactive status (existing)
 if (isActive && isActive !== '' && isActive !== 'undefined') {
 qs.set('isActive', isActive)
 }

 // ===== POSTED DATE RANGE =====
 // Only apply postedFrom if user has chosen a specific date (not the auto-default of today)
 if (postedAfter.trim()) {
 qs.set('postedFrom', formatDateForAPI(postedAfter.trim()))
 }
 // postedTo (upper bound on posted date) — only if explicitly set by user
 if (postedBefore.trim()) {
 qs.set('postedTo', formatDateForAPI(postedBefore.trim()))
 }
 // NOTE: Do NOT add postedTo=today automatically — it restricts to 1 day and filters too aggressively
 
 // ===== RESPONSE DEADLINE (DEADLINE BY - LESS THAN OR EQUAL TO) =====
 // Use responseDeadlineBefore (the UI date picker) as rdlto upper bound.
 // Fall back to legacy responseDeadline for saved-search compatibility.
 const deadlineUpperBound = responseDeadlineBefore.trim() || responseDeadline.trim()
 if (deadlineUpperBound) {
 qs.set('rdlto', formatDateForAPI(deadlineUpperBound))
 }
 // Only send rdlfrom if user explicitly set it (avoids conflicting with route.ts default)
 if (responseDeadlineAfter.trim()) {
 qs.set('rdlfrom', formatDateForAPI(responseDeadlineAfter.trim()))
 }
 
 // ===== PAGINATION =====
 qs.set('limit', '1000') // SAM.gov max per request is 1000
 qs.set('offset', String((currentPage - 1) * DEFAULT_LIMIT))

 // CRITICAL FIX: Prevent duplicate identical searches
 const searchParamsString = qs.toString()
 if (!isLoadMore && !forceRefresh && searchParamsString === lastSearchParamsRef.current) {
 console.log('⚠️ Duplicate search prevented - params unchanged')
 setLoading(false)
 setSearchStartTime(null)
 setSearchDuration(0)
 return
 }
 lastSearchParamsRef.current = searchParamsString

 console.log('Calling API with corrected SAM.gov parameters:', qsToObj(qs))

 // PERFORMANCE FIX: Pass signal to fetch for cancellation + RELIABILITY FIX: Retry on failures
 const res = await fetchWithRetry(`/api/sam?${qs.toString()}`, { 
 method: 'GET',
 headers: {
 'Content-Type': 'application/json',
 ...(canBrowse && !isAuthenticated ? { 'x-browsing-session': 'true' } : {}),
 },
 signal: abortController.signal
 }, 3, 2000) // 3 retries, 2 second initial delay
 
 if (!res.ok) {
 const errorText = await res.text()
 if (errorText && errorText.trim() !== '' && errorText.trim() !== '{}') {
 console.error('API request failed:', { status: res.status, errorText })
 }
 
 // Handle payment required (trial ended)
 // ✅ CRITICAL FIX: Only show modal if user is NOT in free browsing window
 if (res.status === 402) {
 if (!canBrowse && !hasValidAccess) {
 setBlockedFeature('Search Federal Opportunities')
 setShowAccessModal(true)
 setError('Your trial has ended. Please upgrade to continue searching.')
 if (isLoadMore) {
 setLoadingMore(false)
 } else {
 setLoading(false)
 }
 return // Don't throw - just return early
 }
 }
 
 // ===== USER-FRIENDLY ERROR MESSAGES =====
 let userMessage = 'Search failed. Please try again.'
 
 if (res.status === 400) {
 userMessage = 'Invalid search parameters. Please check your filters and try again.'
 } else if (res.status === 401 || res.status === 403) {
 // Guests within their 20-minute window: just show a friendly message, no modal
 // Only show modal if the 20-minute lockout has actually triggered
 if (showLockoutModal && !hasValidAccess) {
 setBlockedFeature('Search Federal Opportunities')
 setShowAccessModal(true)
 if (isLoadMore) setLoadingMore(false); else setLoading(false)
 return
 }
 userMessage = 'Search session expired. Please refresh and try again.'
 } else if (res.status === 404) {
 userMessage = 'Search service not found. Please refresh the page and try again.'
 } else if (res.status === 429) {
 userMessage = 'Too many searches. Please wait a moment and try again.'
 } else if (res.status === 500) {
 userMessage = 'SAM.gov service is temporarily unavailable. Please try again in a few moments.'
 } else if (res.status === 502 || res.status === 503 || res.status === 504) {
 userMessage = 'Connection to SAM.gov failed. The service may be down. Please try again later.'
 }
 
 // Set error state instead of throwing
 setError(userMessage)
 if (isLoadMore) {
 setLoadingMore(false)
 } else {
 setLoading(false)
 }
 return // Exit early instead of throwing
 }
 
 let json = await res.json()

 const payload: ApiResponse = json
 const opps = payload.opportunitiesData

 
 // Check if there are more results available
 const total = payload.totalCount || 0
 const loaded = (opps?.length ?? 0)
 const currentTotalLoaded = isLoadMore 
 ? (data?.opportunitiesData?.length || 0) + loaded
 : loaded
 setHasMoreResults(currentTotalLoaded < total)
 
 if (isLoadMore) {
 setData(prev => ({
 ...prev,
 totalRecords: total,
 opportunitiesData: [...(prev?.opportunitiesData || []), ...(opps ?? [])]
 }))
 setCurrentPage(prev => prev + 1)
 } else {
 setData(payload)
 setActiveFilter(null) // reset subset view on fresh search
 setShowFilters(false)
 if ((opps?.length ?? 0) === 0) {
 showToast('No results found. Try broadening your search filters.')
 }
 // Save search to history
 saveSearchToHistory(qs.toString())
 writeSearchContext(opps || [], qsToObj(qs))
 if (!stickyPromptDismissed) setTimeout(() => setShowStickyPrompt(true), 8000)
 // NOTE: Do NOT show access modal here — guests are allowed to see results
 // The 20-minute timer handles the browse window limit separately
 }

 console.log('API Search successful', { 
 results: (opps?.length ?? 0), 
 totalRecords: total,
 hasMoreResults: currentTotalLoaded < total,
 procurementType: procurementType,
 setAsideFilter: setAsideCodesToString(selectedSetAsides),
 isLoadMore 
 })
 
 } catch (e: any) {
 // PERFORMANCE FIX: Don't show errors for aborted requests
 if (e.name === 'AbortError' || abortController.signal.aborted) {
 console.log('Request aborted')
 return
 }
 
 console.error('Search error:', e)
 setError(e?.message || 'Search failed. Please try again.')
 } finally {
 // PERFORMANCE FIX: Only update loading state if request wasn't aborted
 if (!abortController.signal.aborted) {
 if (isLoadMore) {
 setLoadingMore(false)
 } else {
 setLoading(false)
 setSearchStartTime(null)
 setSearchDuration(0)
 }
 }
 }
 }

 const runSearchWithOverrides = useCallback((overrides: Record<string, string>) => {
 void executeSearchWithParams({
 keywords: keywords.trim(),
 naics: naics.trim(),
 classificationCode: classificationCode.trim(),
 agency: agency.trim(),
 procurementType: procurementType.trim(),
 setAside: setAsideCodesToString(selectedSetAsides),
 stateOfPerformance: locationCodesToString(selectedStates),
 solicitationNumber: solicitationNumber.trim(),
 placeOfPerformanceZip: placeOfPerformanceZip.trim(),
 opportunityStatus: (opportunityStatus || 'active').trim(),
 postedAfter: postedAfter.trim(),
 postedBefore: postedBefore.trim(),
 responseDeadlineFrom: responseDeadlineAfter.trim(),
 responseDeadlineTo: (responseDeadlineBefore || responseDeadline).trim(),
 responseDeadline: (responseDeadlineBefore || responseDeadline).trim(),
 noticeId: noticeId.trim(),
 organizationCode: organizationCode.trim(),
 is_active: isActive,
 ...overrides,
 })
 }, [
 executeSearchWithParams,
 keywords,
 naics,
 classificationCode,
 agency,
 procurementType,
 selectedSetAsides,
 selectedStates,
 solicitationNumber,
 placeOfPerformanceZip,
 opportunityStatus,
 postedAfter,
 postedBefore,
 responseDeadlineAfter,
 responseDeadlineBefore,
 responseDeadline,
 noticeId,
 organizationCode,
 isActive,
 ])

 // Keep initial date card interactive: changing dates after first search reruns immediately.
 const updatePostedAfterAndRefresh = useCallback((value: string) => {
 setPostedAfter(value)
 if (!hasSearched) return
 runSearchWithOverrides({ postedAfter: value })
 }, [hasSearched, runSearchWithOverrides])

 const updateDeadlineBeforeAndRefresh = useCallback((value: string) => {
 setResponseDeadlineBefore(value)
 setResponseDeadline(value)
 if (!hasSearched) return
 runSearchWithOverrides({ responseDeadlineTo: value, responseDeadline: value })
 }, [hasSearched, runSearchWithOverrides])

 // ── Chip toggle: disable/enable a filter without removing its state ──
 const handleChipToggle = useCallback((part: string) => {
 const key = getFilterKey(part)
 if (!key) return
 const isDisabled = disabledFilters.has(key)
 setDisabledFilters(prev => {
  const n = new Set(prev)
  isDisabled ? n.delete(key) : n.add(key)
  return n
 })
 if (!FRONTEND_ONLY_FILTER_KEYS.has(key)) {
  if (isDisabled) {
   runSearchWithOverrides({}) // re-enable: use current state values
  } else {
   runSearchWithOverrides(getDisableApiOverride(key)) // disable: clear this filter
  }
 }
 }, [disabledFilters, runSearchWithOverrides])

 // Load more results
 const loadMoreResults = () => {
 runSearch(true)
 }

 // Reset all filters
 const resetAll = () => {
 // ── Quick Date Lookup card fields ──
 setQuickKeyword('')
 setQuickPostedDate(getSixMonthsAgo())
 setQuickDeadlineDate(getToday())

 // ── Shared state (synced from Quick Search) ──
 setKeywords('')
 setPostedAfter(getSixMonthsAgo())
 setResponseDeadlineBefore(getToday())
 setResponseDeadline(getToday())

 // ── Advanced filter state ──
 setAdvKeywords('')
 setAdvPostedAfter(getSixMonthsAgo())
 setAdvResponseDeadline(getToday())
 setAdvancedApplied(false)

 // ── All other filters ──
 setNaics('')
 setAgency('')
 setSelectedSetAsides([])
 setSelectedStates([])
 setPostedBefore('')
 setProcurementType('')
 setIsActive('')
 setSolicitationNumber('')
 setClassificationCode('')
 setResponseDeadlineAfter('')
 setNoticeId('')
 setOpportunityStatus('')
 setPlaceOfPerformanceZip('')
 setOrganizationCode('')

 // ── UI state ──
 setDisabledFilters(new Set())
 setError(null)
 setData(null)
 setHasSearched(false)
 setShowAllSearchParams(false)
 setResultsLimit(DEFAULT_LIMIT)
 setCurrentPage(1)
 setUiPage(1)
 setSortBy('deadline-asc')
 setSortOrder('asc')
 setActiveFilter(null)
 setShowSetAsideDrilldown(false)
 setShowStateDrilldown(false)
 setShowNaicsDrilldown(false)
 setShowAgencyDrilldown(false)
 clearSearchResults()
 }

 // Filter functions
 const filterBySetAside = (setAsideCode: string) => {
 setSelectedSetAsides(setAsideCode ? [setAsideCode] : [])
 setShowSetAsideDrilldown(false)
 }

 const filterByState = (state: string) => {
 setSelectedStates(state ? [state] : [])
 setShowStateDrilldown(false)
 }

 const filterByNaics = (naicsCode: string) => {
 setNaics(naicsCode)
 setShowNaicsDrilldown(false)
 }

 const filterByAgency = (agencyName: string) => {
 setAgency(agencyName)
 setShowAgencyDrilldown(false)
 }

 // Click-to-filter handlers for breakdown cards
 const handleBreakdownFilter = useCallback((type: 'setAside' | 'naics' | 'agency' | 'state', value: string) => {
 // Convert set-aside label to code if needed
 let filterValue = value
 if (type === 'setAside') {
 filterValue = SET_ASIDE_CODE_BY_LABEL[value] || value
 }

 // Set the filter
 switch (type) {
 case 'setAside':
 setSelectedSetAsides(filterValue ? [filterValue] : [])
 break
 case 'naics':
 setNaics(filterValue)
 break
 case 'agency':
 setAgency(filterValue)
 break
 case 'state':
 setSelectedStates(filterValue ? [filterValue] : [])
 break
 }

 // Collapse the breakdown
 setExpandedBreakdown(null)
 }, [])

 // Clear specific filters - NO AUTO-REFRESH
 const clearAllClientFilters = () => {
 setAgency('')
 setSelectedSetAsides([])
 setNaics('')
 setSelectedStates([])
 }

 // Update search when filter is removed (user must click search button)
 const handleFilterRemoveAndSearch = (filterType: string) => {
 switch (filterType) {
 case 'agency':
 setAgency('')
 break
 case 'setAside':
 setSelectedSetAsides([])
 break
 case 'naics':
 setNaics('')
 break
 case 'state':
 setSelectedStates([])
 break
 }
 
 // User needs to click search button to see updated results
 // This gives them control over when the search happens
 }

 // Export functions
 const exportCsv = () => {
 if (!filteredResults.length) return
 
 // Gate the export action
 if (!requireAccess('Export to CSV')) return
 
 const headers = ['Title', 'Solicitation Number', 'Agency', 'Posted Date', 'Deadline', 'Set-Aside', 'NAICS', 'Location']
 const rows = filteredResults.map(opp => [
 opp.title || '',
 opp.solicitationNumber || '',
 opp.department || '',
 opp.postedDate || '',
 opp.responseDeadLine || '',
 opp.setAside || '',
 opp.naicsCode || '',
 `${opp.placeOfPerformance?.city?.name || ''}, ${opp.placeOfPerformance?.state?.code || ''}`.replace(/^, |, $/g, '')
 ])
 
 const csvContent = [headers, ...rows]
 .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
 .join('\n')
 
 const blob = new Blob([csvContent], { type: 'text/csv' })
 const url = window.URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `opportunities-${new Date().toISOString().split('T')[0]}.csv`
 a.click()
 window.URL.revokeObjectURL(url)
 }

 const exportJson = () => {
 if (!filteredResults.length) return
 
 // Gate the export action
 if (!requireAccess('Export to JSON')) return
 
 const dataStr = JSON.stringify(filteredResults, null, 2)
 const blob = new Blob([dataStr], { type: 'application/json' })
 const url = window.URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `opportunities-${new Date().toISOString().split('T')[0]}.json`
 a.click()
 window.URL.revokeObjectURL(url)
 }

 const exportTxt = () => {
 if (!filteredResults.length) return
 if (!requireAccess('Export to TXT')) return
 
 const txtContent = filteredResults.map((opp, idx) => {
 return `
==========================================
OPPORTUNITY ${idx + 1}
==========================================
Title: ${opp.title || 'N/A'}
Solicitation Number: ${opp.solicitationNumber || 'N/A'}
Agency: ${opp.department || 'N/A'}
Posted Date: ${opp.postedDate || 'N/A'}
Response Deadline: ${opp.responseDeadLine || 'N/A'}
Set-Aside: ${opp.setAside || 'N/A'}
NAICS Code: ${opp.naicsCode || 'N/A'}
Location: ${opp.placeOfPerformance?.city?.name || ''}, ${opp.placeOfPerformance?.state?.code || ''}
Notice ID: ${opp.noticeId || 'N/A'}
Link: ${opp.uiLink || 'N/A'}
==========================================
`
 }).join('\n')
 
 const blob = new Blob([txtContent], { type: 'text/plain' })
 const url = window.URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `opportunities-${new Date().toISOString().split('T')[0]}.txt`
 a.click()
 window.URL.revokeObjectURL(url)
 }

 const exportXml = () => {
 if (!filteredResults.length) return
 if (!requireAccess('Export to XML')) return
 
 const xmlContent = `<?xml version="1.0"encoding="UTF-8"?>
<opportunities>
${filteredResults.map(opp => ` <opportunity>
 <title>${escapeXml(opp.title || '')}</title>
 <solicitationNumber>${escapeXml(opp.solicitationNumber || '')}</solicitationNumber>
 <agency>${escapeXml(opp.department || '')}</agency>
 <postedDate>${escapeXml(opp.postedDate || '')}</postedDate>
 <responseDeadline>${escapeXml(opp.responseDeadLine || '')}</responseDeadline>
 <setAside>${escapeXml(opp.setAside || '')}</setAside>
 <naicsCode>${escapeXml(opp.naicsCode || '')}</naicsCode>
 <noticeId>${escapeXml(opp.noticeId || '')}</noticeId>
 <uiLink>${escapeXml(opp.uiLink || '')}</uiLink>
 </opportunity>`).join('\n')}
</opportunities>`
 
 const blob = new Blob([xmlContent], { type: 'application/xml' })
 const url = window.URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `opportunities-${new Date().toISOString().split('T')[0]}.xml`
 a.click()
 window.URL.revokeObjectURL(url)
 }

 const exportEmail = () => {
 if (!filteredResults.length) return
 if (!requireAccess('Email Export')) return
 
 const subject = `Government Contract Opportunities - ${new Date().toLocaleDateString()}`
 const body = filteredResults.slice(0, 10).map((opp, idx) => {
 return `${idx + 1}. ${opp.title}\n Agency: ${opp.department || 'N/A'}\n Deadline: ${opp.responseDeadLine || 'N/A'}\n Link: ${opp.uiLink || 'N/A'}\n`
 }).join('\n')
 
 const fullBody = `Found ${filteredResults.length} opportunities:\n\n${body}\n\n${filteredResults.length > 10 ? `... and ${filteredResults.length - 10} more opportunities. Export to CSV/JSON for full list.` : ''}`
 
 const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(fullBody)}`
 window.location.href = mailtoLink
 }

 const exportBinary = () => {
 if (!filteredResults.length) return
 if (!requireAccess('Export to Binary')) return
 
 // Create a binary format (MessagePack-like structure)
 const binaryData = new TextEncoder().encode(JSON.stringify({
 version: '1.0',
 exportDate: new Date().toISOString(),
 count: filteredResults.length,
 opportunities: filteredResults
 }))
 
 const blob = new Blob([binaryData], { type: 'application/octet-stream' })
 const url = window.URL.createObjectURL(blob)
 const a = document.createElement('a')
 a.href = url
 a.download = `opportunities-${new Date().toISOString().split('T')[0]}.bin`
 a.click()
 window.URL.revokeObjectURL(url)
 }

 // Helper function for XML escaping
 const escapeXml = (str: string) => {
 return str.replace(/&/g, '&amp;')
 .replace(/</g, '&lt;')
 .replace(/>/g, '&gt;')
 .replace(/"/g, '&quot;')
 .replace(/'/g, '&apos;')
 }

 const toggleExpanded = (k: string) => setExpanded((p) => ({ ...p, [k]: !p[k] }))

 const copyText = async (txt: string) => {
 try {
 await navigator.clipboard.writeText(txt)
 setCopiedId(txt)
 setTimeout(() => setCopiedId(null), 1200)
 } catch {}
 }

 // Results data
 const totalRecords = data?.totalRecords ?? 0
 const results = data?.opportunitiesData ?? []

 // When Quick Search returns results, pre-populate the Advanced Search date/keyword fields
 // so they're ready to refine — but DON'T auto-apply the advanced filter
 useEffect(() => {
 if (results.length > 0) {
 // Only sync if user hasn't typed their own filter keyword yet
 if (!advKeywords) setAdvKeywords(keywords)
 setAdvPostedAfter(postedAfter)
 setAdvResponseDeadline(responseDeadlineBefore || responseDeadline)
 setAdvancedApplied(false)
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [data])

 // Filtered results with memoization - PERFORMANCE OPTIMIZED
 // ===== APPLY ADVANCED FILTERS (client-side if results exist, API search if not) =====
 const applyAdvancedFilters = useCallback(() => {
 if (results.length === 0) {
 // No Quick Search results loaded — run a full SAM.gov API search using ONLY advanced fields
 // DO NOT sync to quick search state - keep them separate
 // We'll use the advanced field values directly in runSearch
 
 // Temporarily set the main search state to advanced values
 const prevKeywords = keywords
 const prevPostedAfter = postedAfter 
 const prevResponseDeadline = responseDeadline
 
 if (advKeywords) setKeywords(advKeywords)
 if (advPostedAfter) setPostedAfter(advPostedAfter)
 if (advResponseDeadline) setAdvResponseDeadline(advResponseDeadline)
 
 // Defer to next tick so state is flushed before runSearch reads it
 setTimeout(() => {
 runSearch(false, true)
 // Don't restore - let advanced values persist
 }, 0)
 } else {
 // Results already loaded — filter client-side, no API call
 if (!advPostedAfter) setAdvPostedAfter(postedAfter)
 if (!advResponseDeadline) setAdvResponseDeadline(responseDeadline)
 if (!advKeywords) setAdvKeywords(keywords)
 setAdvancedApplied(true)
 setActiveFilter(null)
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [results.length, advPostedAfter, advResponseDeadline, advKeywords, postedAfter, responseDeadline, keywords, selectedSetAsides, naics, selectedStates])

 const clearAdvancedFilters = useCallback(() => {
 setAdvancedApplied(false)
 setActiveFilter(null)
 }, [])

 const filteredResults = useMemo(() => {
 let arr = results.slice()

 // ── ALWAYS filter by set-aside if selected (SAM.gov API doesn't filter reliably) ──
 if (selectedSetAsides.length > 0) {
 arr = arr.filter(o => {
 const oppSetAside = (o.typeOfSetAside || o.setAside || o.setAsideCode || '').toUpperCase()
 const oppSetAsideDesc = (o.typeOfSetAsideDescription || '').toUpperCase()
 return selectedSetAsides.some(code => {
 const selectedCode = code.toUpperCase()
 return oppSetAside === selectedCode || oppSetAsideDesc.includes(selectedCode)
 })
 })
 }

 // ── Filter by status when a specific non-active status is selected and not disabled ──
 if (!disabledFilters.has('status') && opportunityStatus.trim() && opportunityStatus.toLowerCase() !== 'active') {
 arr = arr.filter(o => {
 const oppActive = (o.active || '').toString().toLowerCase()
 const oppStatus = (o.status || '').toLowerCase()
 return oppActive === opportunityStatus.toLowerCase() || oppStatus === opportunityStatus.toLowerCase()
 })
 }

 // ── Deadline filters (frontend-only, both toggleable) ──
 if (!disabledFilters.has('deadline-after') && responseDeadlineAfter) {
 const fromMs = new Date(responseDeadlineAfter + 'T00:00:00').getTime()
 arr = arr.filter(o => !o.responseDeadLine || new Date(o.responseDeadLine).getTime() >= fromMs)
 }
 if (!disabledFilters.has('deadline-before') && responseDeadlineBefore) {
 const toMs = new Date(responseDeadlineBefore + 'T23:59:59').getTime()
 arr = arr.filter(o => !o.responseDeadLine || new Date(o.responseDeadLine).getTime() <= toMs)
 }

 // ── Always-on Refine Filters (instant client-side) ──
 if (agency.trim()) { const ag = agency.trim().toLowerCase(); arr = arr.filter(o => (o.organizationName||'').toLowerCase().includes(ag)||(o.fullParentPathName||'').toLowerCase().includes(ag)) }
 if (naics.trim()) { arr = arr.filter(o => (o.naicsCode||'').startsWith(naics.trim())) }
 if (classificationCode.trim()) { arr = arr.filter(o => (o.classificationCode||'').toLowerCase().startsWith(classificationCode.trim().toLowerCase())) }
 if (selectedStates.length > 0) { arr = arr.filter(o => selectedStates.some(code => (o.placeOfPerformance?.state?.code||'').toUpperCase()===code.toUpperCase())) }
 if (procurementType.trim()) { arr = arr.filter(o => (o.type||'').toLowerCase().startsWith(procurementType.toLowerCase())||(o.baseType||'').toLowerCase().startsWith(procurementType.toLowerCase())) }
 if (solicitationNumber.trim()) { arr = arr.filter(o => (o.solicitationNumber||'').toLowerCase().includes(solicitationNumber.trim().toLowerCase())) }
 if (organizationCode.trim()) { arr = arr.filter(o => (o.organizationId||'').toLowerCase().includes(organizationCode.trim().toLowerCase())) }
 if (advancedApplied) {
 const kw = advKeywords.trim().toLowerCase()
 if (kw) { arr = arr.filter(o => (o.title||'').toLowerCase().includes(kw)||(o.description||'').toLowerCase().includes(kw)) }
 if (advPostedAfter) { const from = new Date(advPostedAfter).getTime(); arr = arr.filter(o => new Date(o.postedDate||0).getTime()>=from) }
 if (advResponseDeadline) { const to = new Date(advResponseDeadline).getTime(); arr = arr.filter(o => new Date(o.responseDeadLine||0).getTime()<=to) }
 } else {
 if (activeFilter !== null) { arr = arr.filter(o => { const isActiveOpp = o.active==="Yes"||o.active==="true"||o.active===(true as any); return activeFilter==="true"?isActiveOpp:!isActiveOpp }) }
 }

 // ── Saved-only toggle ──
 if (showSavedOnly) { arr = arr.filter(o => saved[o.noticeId || '']) }

 // Apply sorting (always)
 arr.sort((a, b) => {
 let aVal, bVal
 const [field, direction] = sortBy.split('-')
 switch (field) {
 case 'deadline':
 aVal = new Date(a.responseDeadLine || 0).getTime()
 bVal = new Date(b.responseDeadLine || 0).getTime()
 break
 case 'posted':
 aVal = new Date(a.postedDate || 0).getTime()
 bVal = new Date(b.postedDate || 0).getTime()
 break
 case 'relevance':
 default:
 return 0
 }
 return direction === 'asc' ? aVal - bVal : bVal - aVal
 })

 return arr
 }, [results, sortBy, activeFilter, advancedApplied, showSavedOnly, saved,
 advKeywords, advPostedAfter, advResponseDeadline,
 agency, selectedSetAsides, naics, classificationCode, selectedStates,
 procurementType, opportunityStatus, solicitationNumber, organizationCode,
 responseDeadlineAfter, responseDeadlineBefore, disabledFilters])

 const totalUiPages = useMemo(
 () => Math.max(1, Math.ceil(filteredResults.length / resultsPerPage)),
 [filteredResults.length, resultsPerPage]
 )

 useEffect(() => {
 setUiPage(prev => Math.min(prev, totalUiPages))
 }, [totalUiPages])

 const paginatedResults = useMemo(() => {
 const start = (uiPage - 1) * resultsPerPage
 return filteredResults.slice(start, start + resultsPerPage)
 }, [filteredResults, uiPage, resultsPerPage])

 const pageStartIndex = filteredResults.length === 0 ? 0 : (uiPage - 1) * resultsPerPage + 1
 const pageEndIndex = Math.min(uiPage * resultsPerPage, filteredResults.length)

 const visiblePageNumbers = useMemo(() => {
 const maxButtons = 7
 if (totalUiPages <= maxButtons) {
 return Array.from({ length: totalUiPages }, (_, idx) => idx + 1)
 }

 const start = Math.max(1, Math.min(uiPage - 3, totalUiPages - (maxButtons - 1)))
 return Array.from({ length: maxButtons }, (_, idx) => start + idx)
 }, [uiPage, totalUiPages])

 // Summary statistics - ENHANCED with detailed breakdowns
const summaryStats = useMemo(() => {
 const arr = filteredResults
 const total = arr.length
 
 // Calculate quick stats
 const urgentCount = arr.filter(o => {
 if (!o.responseDeadLine) return false
 const daysUntil = Math.ceil((new Date(o.responseDeadLine).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
 return daysUntil <= 7
 }).length
 
 const smallBusinessCount = arr.filter(o => 
 o.setAside && ['SBA', '8A', 'SDB', 'HUBZone', 'SDVOSB', 'WOSB'].includes(o.setAside)
 ).length
 
 const recentCount = arr.filter(o => {
 if (!o.postedDate) return false
 const daysSince = Math.ceil((Date.now() - new Date(o.postedDate).getTime()) / (1000 * 60 * 60 * 24))
 return daysSince <= 7
 }).length

 // NEW: Detailed breakdowns by category
 const setAsideBreakdown: Record<string, number> = {}
 const naicsBreakdown: Record<string, number> = {}
 const agencyBreakdown: Record<string, number> = {}
 const stateBreakdown: Record<string, number> = {}

 arr.forEach(o => {
 // Set-aside breakdown
 const setAsideCode = normalizeSetAsideCode(o)
 if (setAsideCode) {
 const label = groupLabelFromSetAside(o)
 setAsideBreakdown[label] = (setAsideBreakdown[label] || 0) + 1
 } else {
 setAsideBreakdown['No Set-Aside'] = (setAsideBreakdown['No Set-Aside'] || 0) + 1
 }

 // NAICS breakdown
 const naicsCode = normalizeNaics(o)
 if (naicsCode) {
 naicsBreakdown[naicsCode] = (naicsBreakdown[naicsCode] || 0) + 1
 }

 // Agency breakdown
 const agencyName = normalizeAgency(o)
 if (agencyName) {
 agencyBreakdown[agencyName] = (agencyBreakdown[agencyName] || 0) + 1
 }

 // State breakdown
 const stateCode = normalizeState(o)
 if (stateCode) {
 stateBreakdown[stateCode] = (stateBreakdown[stateCode] || 0) + 1
 }
 })

 // Sort breakdowns by count (descending) and get top items
 const sortByCount = (obj: Record<string, number>) => 
 Object.entries(obj)
 .sort(([, a], [, b]) => b - a)
 .slice(0, 10) // Top 10

 return {
 total,
 urgentCount,
 smallBusinessCount,
 recentCount,
 savedCount: Object.keys(saved).length,
 // Detailed breakdowns
 uniqueSetAsides: Object.keys(setAsideBreakdown).length,
 uniqueNaics: Object.keys(naicsBreakdown).length,
 uniqueAgencies: Object.keys(agencyBreakdown).length,
 uniqueStates: Object.keys(stateBreakdown).length,
 topSetAsides: sortByCount(setAsideBreakdown),
 topNaics: sortByCount(naicsBreakdown),
 topAgencies: sortByCount(agencyBreakdown),
 topStates: sortByCount(stateBreakdown)
 }
 }, [filteredResults, saved])

 const activeSearchSummaryParts = useMemo(() => {
 const parts: string[] = []
 const trimmedKeywords = keywords.trim()
 const trimmedNaics = naics.trim()
 const trimmedClassificationCode = classificationCode.trim()
 const trimmedAgency = agency.trim()
 const trimmedProcurementType = procurementType.trim()
 const trimmedSolicitationNumber = solicitationNumber.trim()
 const trimmedOpportunityStatus = opportunityStatus.trim()
 const trimmedZip = placeOfPerformanceZip.trim()
 const trimmedOrganizationCode = organizationCode.trim()

 if (trimmedKeywords) parts.push(`Keyword: "${trimmedKeywords}"`)

 if (selectedSetAsides.length > 0) {
 const labels = selectedSetAsides.map(code => getSetAsideLabel(code) || code)
 parts.push(`Set-aside: ${formatSummaryList(labels, 3)}`)
 }

 if (selectedStates.length > 0) {
 const labels = selectedStates.map(code => getLocationLabel(code))
 parts.push(`State: ${formatSummaryList(labels, 3)}`)
 }

 if (trimmedNaics) parts.push(`NAICS: ${trimmedNaics}`)
 if (trimmedClassificationCode) parts.push(`PSC: ${trimmedClassificationCode}`)
 if (trimmedAgency) parts.push(`Agency: ${trimmedAgency}`)
 if (trimmedProcurementType) parts.push(`Type: ${getProcurementTypeLabel(trimmedProcurementType)}`)
 if (trimmedSolicitationNumber) parts.push(`Solicitation #: ${trimmedSolicitationNumber}`)
 if (trimmedZip) parts.push(`ZIP: ${trimmedZip}`)
 if (trimmedOrganizationCode) parts.push(`Org code: ${trimmedOrganizationCode}`)
 if (trimmedOpportunityStatus) parts.push(`Status: ${trimmedOpportunityStatus}`)
 if (postedAfter) parts.push(`Posted on/after ${formatHumanDate(postedAfter)}`)
 if (postedBefore) parts.push(`Posted on/before ${formatHumanDate(postedBefore)}`)
 if (responseDeadlineAfter) parts.push(`Due on/after ${formatHumanDate(responseDeadlineAfter)}`)
 if (responseDeadlineBefore) parts.push(`Due on/before ${formatHumanDate(responseDeadlineBefore)}`)

 return parts
 }, [
 keywords,
 selectedSetAsides,
 selectedStates,
 naics,
 classificationCode,
 agency,
 procurementType,
 solicitationNumber,
 placeOfPerformanceZip,
 organizationCode,
 opportunityStatus,
 postedAfter,
 postedBefore,
 responseDeadlineAfter,
 responseDeadlineBefore,
 ])

const visibleSearchSummaryParts = useMemo(
 () => (showAllSearchParams ? activeSearchSummaryParts : activeSearchSummaryParts.slice(0, 3)),
 [activeSearchSummaryParts, showAllSearchParams]
 )

 const hiddenSearchSummaryCount = Math.max(0, activeSearchSummaryParts.length - visibleSearchSummaryParts.length)

 // Active filter count for sticky search bar
 const activeFilterCount = useMemo(() => [
 agency, naics, classificationCode, solicitationNumber, procurementType,
 opportunityStatus !== 'active' ? opportunityStatus : '',
 ].filter(Boolean).length + selectedSetAsides.length + selectedStates.length,
 [agency, naics, classificationCode, solicitationNumber, procurementType,
 opportunityStatus, selectedSetAsides, selectedStates])

 // Status breakdown counts from the full loaded set (not filteredResults)
 // so pills always show accurate totals regardless of selection
 const statusCounts = useMemo(() => {
 const active = results.filter(o => o.active ==="Yes"|| o.active ==="true"|| o.active === (true as any)).length
 const inactive = results.length - active
 return { active, inactive, all: results.length }
 }, [results])

 // Performance monitoring
 useEffect(() => {
 if (loading) {
 const startTime = performance.now();
 return () => {
 const endTime = performance.now();
 console.log(`Search took ${endTime - startTime}ms`);
 // Could send to analytics here
 };
 }
 }, [loading]);

 // Google-style color palette
 const companyBlue = '#1a73e8'
 const companyGreen = '#0f9d58'
 const companyYellow = '#f4b400'
 const companyRed = '#db4437'

 return (
 <SearchErrorBoundary>
 {/* ── SCOPED STYLE OVERRIDE ─────────────────────────────────────────
 The app's global CSS resets button/span color to inherit or black.
 These rules use max specificity to force white text on every
 green-background element in this page only.
 ─────────────────────────────────────────────────────────────────── */}
 <style>{`
 /* ── Green button white text enforcement ─────────────────────── */
 button[style*="166534"], button[style*="166534"] span, button[style*="166534"] svg,
 a[style*="166534"], a[style*="166534"] span, a[style*="166534"] svg { color: #ffffff !important; }
 .pgc-green, .pgc-green * { color: #ffffff !important; }
 .pgc-green svg path, .pgc-green svg circle, .pgc-green svg line,
 .pgc-green svg polyline, .pgc-green svg rect,
 button[style*="166534"] svg path, button[style*="166534"] svg circle,
 button[style*="166534"] svg line, button[style*="166534"] svg polyline { stroke: #ffffff !important; }

 /* Force reset button to render as a true button (not pill-shaped) */
 .search-reset-btn {
 border-radius: 2px !important;
 min-height: 44px !important;
 padding: 0 18px !important;
 }
`}</style>
 <main
 className="search-main min-h-screen flex flex-col"
 style={{
   fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
   background: '#f4f6f4',
 }}
 >
 {ToastUI}

 <StickySearchBar
 visible={showStickyBar}
 keyword={keywords}
 activeFilterCount={activeFilterCount}
 resultCount={filteredResults.length}
 onRefineSearch={scrollToSearch}
 />

 <div className="mx-auto w-full max-w-480 px-3 sm:px-5 lg:px-6 py-6 flex-1 flex flex-col gap-5">

 {showSignedInNavGuide && (
 <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 shadow-sm">
 <div className="flex items-start justify-between gap-4">
 <div>
 <p className="text-sm font-black uppercase tracking-wide text-emerald-700">Quick Start Tips</p>
 <h2 className="mt-1 text-xl font-black text-emerald-900">First-time navigation guide</h2>
 <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-emerald-800 space-y-1">
 <li>Use <span className="font-black">Refine Filters</span> to narrow results by agency, set-aside, state, and status.</li>
 <li>Use <span className="font-black">Toggle View</span> to switch between List and Card layouts.</li>
 <li>Use <span className="font-black">Save Search</span> and <span className="font-black">Create Alert</span> so you do not repeat manual searches.</li>
 </ul>
 </div>
 <button
 type="button"
 onClick={dismissSignedInNavGuide}
 className="inline-flex items-center rounded-lg bg-emerald-700 px-3 py-2 text-sm font-black text-white hover:bg-emerald-800 transition-colors"
 >
 Got it
 </button>
 </div>
 </div>
 )}

 {/* ── HOW TO USE GUIDE ─────────────────────────────────────────── */}
 <div className="rounded-2xl overflow-hidden shadow-sm"style={{ border: '1px solid #bbf0d0' }}>
 <div className="px-5 py-4 flex items-center gap-3"style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}>
 <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"style={{ background: 'rgba(255,255,255,0.25)' }}>
 <HelpCircle className="h-5 w-5"style={{ color: '#ffffff' }} />
 </div>
 <h2 className="font-bold text-base"style={{ color: '#ffffff', fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"}}>
 How to Search — 3 Easy Steps
 </h2>
 </div>
 <div className="how-to-steps px-6 py-6 grid grid-cols-1 sm:grid-cols-3 gap-5" style={{ background: '#ffffff', fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}>
 {[
 {
 step: '1',
 icon: <Search className="h-5 w-5" style={{ color: '#16a34a' }} />,
 title: 'Type a keyword or code',
 desc: 'Enter a service (e.g. "cybersecurity"), a NAICS code like 541512, an agency name, or a solicitation number.',
 },
 {
 step: '2',
 icon: <Calendar className="h-5 w-5" style={{ color: '#16a34a' }} />,
 title: 'Set your date range',
 desc: 'Pick when solicitations were posted and when they are due. Use the quick-fill buttons for common ranges.',
 },
 {
 step: '3',
 icon: <CheckCircle className="h-5 w-5" style={{ color: '#16a34a' }} />,
 title: 'Click Search & refine',
 desc: 'Hit the green Search button. Use the Refine Filters panel to narrow by agency, set-aside, state, or type.',
 },
 ].map(({ step, icon, title, desc }) => (
 <div key={step} className="how-to-step-card flex gap-4 p-5 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
 <div className="how-to-step-num flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-black mt-0.5"
 style={{ background: '#16a34a', color: '#ffffff', fontSize: '15px', flexShrink: 0 }}>
 {step}
 </div>
 <div>
 <div className="flex items-center gap-2 mb-2">
 {icon}
 <span style={{ color: '#111714', fontWeight: 700, fontSize: '18px', fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}>{title}</span>
 </div>
 <p style={{ color: '#2f3f38', fontWeight: 400, fontSize: '17px', lineHeight: '1.65', margin: 0, fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif" }}>{desc}</p>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* ── MAIN SEARCH CARD ─────────────────────────────────────────── */}
 <div ref={searchCardRef} className="search-card bg-white rounded-2xl border-2 border-[#166534] shadow-lg overflow-hidden">

 {/* Header bar */}
 <div className="px-6 pt-5 pb-4 border-b border-gray-100">
 <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
 <div>
 <h1 className="font-black leading-tight" style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", fontSize: '24px', lineHeight: 1.25, marginBottom: '6px' }}>
   <span style={{ color: '#ea580c' }}>Welcome to </span>
   <span style={{ color: '#ea580c' }}>Precise </span><span style={{ color: '#16a34a', fontWeight: 900 }}>GovCon</span><sup style={{ color: '#ea580c', fontSize: '13px', fontWeight: 700, verticalAlign: 'super', lineHeight: 0 }}>®</sup>
   <span style={{ color: '#ea580c' }}>'s Contract Opportunity Search Platform</span>
 </h1>
 <p className="text-gray-500 mt-0.5" style={{ fontSize: '15px', margin: '4px 0 0' }}>
   Searching live SAM.gov data ·{' '}
   <span className="font-bold text-[#166534]">
     {(data?.totalRecords ?? 2143921).toLocaleString()} active opportunities
   </span>
 </p>
 </div>
 </div>

 {/* ── KEYWORD SEARCH BAR ── */}
 <div className="flex gap-0 items-stretch mb-3">
 <div className="relative flex-1">
 <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none"/>
 <input
 type="text"
 value={keywords}
 onChange={(e) => setKeywords(e.target.value)}
 onKeyDown={(e) => e.key === 'Enter' && runSearch(false, true)}
 placeholder="Type a keyword, NAICS code, agency name, or solicitation #"
 autoFocus
 style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", fontSize: '1rem' }}
 className="search-input w-full h-14 pl-11 pr-4 border-2 border-r-0 border-[#166534] rounded-l-xl bg-white text-gray-900 font-medium placeholder-gray-300 focus:outline-none focus:border-[#14532d] transition-colors"
 />
 </div>
 <button
 onClick={() => runSearch(false, true)}
 disabled={loading}
 style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", background: '#166534', color: '#ffffff', borderColor: '#166534' }}
 className="pgc-green h-14 px-8 hover:opacity-90 active:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed font-black text-base rounded-r-xl border-2 flex items-center gap-2 transition-opacity whitespace-nowrap shadow-md"
 >
 {loading
 ? <><Loader2 className="h-5 w-5 animate-spin"style={{ color: '#ffffff' }} /><span style={{ color: '#ffffff', fontWeight: 900 }}>Searching…</span></>
 : <><Search className="h-5 w-5"style={{ color: '#ffffff' }} /><span style={{ color: '#ffffff', fontWeight: 900 }}>Search</span></>}
 </button>
 </div>

 {/* Quick-fill keyword chips */}
 <div className="flex items-center gap-2 flex-wrap mb-1">
 <span className="try-label text-gray-400 font-semibold" style={{ fontSize: "16px", fontWeight: 600 }}>Try:</span>
 {[
 { label: 'IT Support', value: 'IT support services' },
 { label: 'Cybersecurity', value: 'cybersecurity' },
 { label: 'Construction', value: 'construction' },
 { label: '541512 (IT Systems)', value: '541512' },
 { label: '238210 (Electrical)', value: '238210' },
 { label: '336411 (Aircraft)', value: '336411' },
 ].map(({ label, value }) => (
 <button
 key={value}
 onClick={() => { setKeywords(value); runSearchWithOverrides({ keywords: value }); }}
 className="keyword-chip px-3 py-1.5 rounded-full font-semibold bg-gray-50 text-gray-600 border border-gray-200 hover:bg-green-50 hover:text-[#166534] hover:border-green-300 transition-colors" style={{ fontSize: "16px" }}
 >
 {label}
 </button>
 ))}
 {results.length > 0 && keywords && (
 <span className="active-search-badge text-xs font-bold text-[#166534] bg-green-50 px-3 py-1 rounded-full border border-green-200">
 ✓ &quot;{keywords}&quot;
 </span>
 )}
 <div className="flex-1"/>
            <button
              onClick={resetAll}
              className="search-reset-btn inline-flex h-11 items-center gap-2 px-5 font-black text-white bg-red-600 hover:bg-red-700 border-2 border-red-700 shadow-sm transition-colors"
              style={{ fontSize: "16px", letterSpacing: '0.01em' }}
            >
              <RefreshCw className="h-4 w-4" />
              Reset all filters
            </button>
 </div>
 </div>

 {/* ── DATE FILTERS ── */}
 <div className="date-section px-6 py-5 bg-gray-50 border-b border-gray-100">
 <p className="font-black text-gray-500 uppercase mb-1" style={{ fontSize: '13px', letterSpacing: '0.1em', fontWeight: 800, margin: '0 0 4px' }}>
 Step 2 — Narrow by Date
 </p>
 <p className="text-sm text-gray-600 mb-3 leading-snug">
 By default, results show <strong>active solicitations</strong> posted
 {postedAfter ? <> since <strong>{formatHumanDate(postedAfter)}</strong></> : ' within the last 6 months'}
 {responseDeadlineBefore ? <>, with deadlines up to <strong>{formatHumanDate(responseDeadlineBefore)}</strong></> : ''}
 {responseDeadlineAfter ? <>, and deadlines no earlier than <strong>{formatHumanDate(responseDeadlineAfter)}</strong></> : ''}.
 {' '}Adjust the dates below or use the quick-fill buttons to change the range.
 </p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

 {/* Posted date */}
 <div>
 <label className="flex items-center gap-2 font-bold text-gray-800 mb-2" style={{ fontSize: "17px", fontWeight: 700 }}>
 <span className="pgc-green w-5 h-5 rounded-full bg-[#166534] text-white flex items-center justify-center text-xs font-black flex-shrink-0">P</span>
 Solicitation Posted On or After
 </label>
 <input
 type="date"
 value={postedAfter}
 onChange={(e) => updatePostedAfterAndRefresh(e.target.value)}
 
 className="date-input w-full h-11 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-semibold text-sm focus:border-[#166534] focus:ring-2 focus:ring-green-100 outline-none transition-all mb-2"
 />
 <div className="flex flex-wrap gap-1.5">
 <span className="date-sublabel font-semibold text-gray-400 self-center mr-1" style={{ fontSize: "15px", fontWeight: 600 }}>WITHIN:</span>
 {[
 { label: '2 weeks', days: -14 },
 { label: '30 days', days: -30 },
 { label: '3 months', days: -91 },
 { label: '6 months', days: -182 },
 { label: '9 months', days: -274 },
 { label: '12 months', days: -365 },
 ].map(({ label, days }) => (
 <button
 key={label}
 onClick={() => {
 const d = new Date()
 d.setDate(d.getDate() + days)
 updatePostedAfterAndRefresh(d.toISOString().split('T')[0])
 }}
 className="date-btn-green pgc-green px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-[#166534] border border-[#166534] hover:bg-[#166534] hover:text-white transition-all"
 >
 {label}
 </button>
 ))}
 </div>
 </div>

 {/* Due date */}
 <div>
 <label className="flex items-center gap-2 font-bold text-gray-800 mb-2" style={{ fontSize: "17px", fontWeight: 700 }}>
 <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-black flex-shrink-0">D</span>
 Response Due Date Up To
 </label>
 <input
 type="date"
 value={responseDeadlineBefore}
 onChange={(e) => updateDeadlineBeforeAndRefresh(e.target.value)}
 
 className="date-input w-full h-11 px-4 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-semibold text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-100 outline-none transition-all mb-2"
 />
 <div className="flex flex-wrap gap-1.5">
 <span className="date-sublabel font-semibold text-gray-400 self-center mr-1" style={{ fontSize: "15px", fontWeight: 600 }}>NEXT:</span>
 {[
 { label: '2 weeks', days: 14 },
 { label: '30 days', days: 30 },
 { label: '45 days', days: 45 },
 { label: '60 days', days: 60 },
 { label: '90 days', days: 90 },
 ].map(({ label, days }) => (
 <button
 key={label}
 onClick={() => {
 const d = new Date()
 d.setDate(d.getDate() + days)
 updateDeadlineBeforeAndRefresh(d.toISOString().split('T')[0])
 }}
 className="date-btn-amber px-2.5 py-1 rounded-lg text-xs font-bold bg-white text-amber-600 border border-amber-400 hover:bg-amber-500 hover:text-white transition-all"
 >
 {label}
 </button>
 ))}
 </div>
 </div>
 </div>
 </div>

 {/* ── SEARCH ACTION ROW ── */}
 <div className="search-action-row px-6 py-4 flex items-center justify-between gap-3 flex-wrap bg-white border-t border-gray-100">
 <div className="flex items-center gap-3 flex-wrap">
 <button
 onClick={() => runSearch(false, true)}
 disabled={loading}
 style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif", background: '#166534', color: '#ffffff' }}
 className="pgc-green h-12 px-8 hover:opacity-90 disabled:opacity-50 font-black text-base rounded-xl flex items-center gap-2 transition-opacity shadow-md"
 >
 {loading ? <><Loader2 className="h-5 w-5 animate-spin"style={{ color: '#ffffff' }} /><span style={{ color: '#ffffff', fontWeight: 900 }}>Updating…</span></> : <><Search className="h-5 w-5"style={{ color: '#ffffff' }} /><span style={{ color: '#ffffff', fontWeight: 900 }}>Update results</span></>}
 </button>
 {loading && (
 <button onClick={stopSearch}
 className="h-12 px-6 bg-red-500 hover:bg-red-600 text-white font-bold text-sm rounded-xl flex items-center gap-2 transition-colors">
 <StopCircle className="h-4 w-4"/>Stop ({searchDuration}s)
 </button>
 )}
 </div>
 {loading && (
 <div className="flex items-center gap-2 text-sm text-[#166534] font-semibold bg-green-50 px-4 py-2 rounded-lg border border-green-200">
 <Loader2 className="h-4 w-4 animate-spin"/>
 Searching {keywords ? `"${keywords}"` : 'all opportunities'}… {searchDuration}s
 </div>
 )}
 </div>

 {/* Error */}
 {error && (
 <div className="mx-6 mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start gap-3">
 <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5"/>
 <div>
 <p className="font-bold text-red-700 text-sm">Search Error</p>
 <p className="text-red-600 text-sm mt-0.5">{error}</p>
 </div>
 </div>
 )}
 </div>

 {/* ── NO RESULTS FEEDBACK ─────────────────────────────────────── */}
 {hasSearched && !loading && !error && results.length === 0 && (
 <div className="mt-4 rounded-2xl border-2 border-amber-300 bg-amber-50 shadow-sm p-5">
 <div className="flex items-start gap-3">
 <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
 <div className="flex-1">
 <p className="text-lg font-black text-amber-900">No opportunities matched this search yet.</p>
 <p className="mt-1 text-base text-amber-800">
 Try broadening your keyword, widening your date range, or clearing one or two filters and searching again.
 </p>
 <div className="mt-3 flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={() => {
 const d = new Date()
 d.setMonth(d.getMonth() - 12)
 setPostedAfter(d.toISOString().split('T')[0])
 showToast('Expanded posted date range to 12 months.')
 }}
 className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-black text-white hover:bg-amber-600 transition-colors"
 >
 Expand to 12 months
 </button>
 <button
 type="button"
 onClick={() => {
 setSelectedSetAsides([])
 setSelectedStates([])
 setNaics('')
 setAgency('')
 setClassificationCode('')
 showToast('Cleared key filters. Run search again.')
 }}
 className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-black text-white hover:bg-blue-700 transition-colors"
 >
 Clear key filters
 </button>
 <button
 type="button"
 onClick={() => runSearch(false, true)}
 className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-black text-white hover:bg-emerald-700 transition-colors"
 >
 <Search className="h-4 w-4" />
 Search again
 </button>
 </div>
 </div>
 </div>
 </div>
 )}

 {/* ── RESULTS SECTION ──────────────────────────────────────────── */}
{hasSearched && results.length > 0 && (
 <div ref={resultsRef} className="flex flex-col gap-4">

 {/* Results header */}
 <div className="results-card bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4">
 <div className="mb-3 grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_auto]">
 <div className="min-w-0">
 <h2 className="text-2xl font-black text-gray-900"style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"}}>
 {filteredResults.length.toLocaleString()} <span className="text-[#166534]">opportunities found</span>
 </h2>
 <div className="mt-2">
 <div className="mb-2 flex items-center gap-2 flex-wrap">
 <span className="inline-flex items-center rounded-md bg-[#1d4ed8] px-3 py-1 text-sm font-black text-white">
 Search includes
 </span>
 {activeSearchSummaryParts.length > 3 && (
 <button
 type="button"
 onClick={() => setShowAllSearchParams(v => !v)}
 className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1 text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors"
 >
 {showAllSearchParams ? 'Show fewer parameters' : `Show ${hiddenSearchSummaryCount} more parameters`}
 </button>
 )}
 </div>
 <div className="flex flex-wrap items-center gap-2">
 {activeSearchSummaryParts.length > 0 ? (
 <>
 {visibleSearchSummaryParts.map((part, index) => {
   const filterKey = getFilterKey(part)
   const isDisabled = filterKey ? disabledFilters.has(filterKey) : false
   return (
 <span
 key={`${part}-${index}`}
 title={isDisabled ? 'Click ↺ to re-enable this filter' : undefined}
 className={`inline-flex items-center gap-1 rounded-md border px-3 py-1 text-sm font-bold shadow-sm transition-all ${
   isDisabled ? 'bg-gray-100 border-gray-300 text-gray-400 line-through' : getSummaryChipTone(part)
 }`}
 >
 {part}
 {filterKey && (
   <button
     type="button"
     onClick={() => handleChipToggle(part)}
     className="ml-0.5 rounded hover:opacity-70 transition-opacity"
     aria-label={isDisabled ? `Re-enable filter: ${part}` : `Disable filter: ${part}`}
   >
     {isDisabled
       ? <RefreshCw className="h-3.5 w-3.5 text-gray-500" />
       : <X className="h-3.5 w-3.5" />
     }
   </button>
 )}
 </span>
   )
 })}
 </>
 ) : (
 <span className="inline-flex items-center rounded-md border border-slate-300 bg-slate-100 px-3 py-1 text-sm font-bold text-slate-800 shadow-sm">
 All opportunities
 </span>
 )}
 {data?.totalRecords && data.totalRecords > filteredResults.length && (
 <span className="inline-flex items-center rounded-md border border-emerald-300 bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-900 shadow-sm">
 Filtered from {data.totalRecords.toLocaleString()} total
 </span>
 )}
 </div>
 </div>
 </div>
<div className="flex items-center gap-2 flex-wrap justify-start xl:justify-end">
<ExportSharePanel results={filteredResults} searchLabel={keywords || 'All opportunities'} requireAccess={requireAccess} />
<Link
  href="/alerts/manage-searches"
  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-cyan-600 text-white font-bold text-base hover:bg-cyan-700 shadow-md transition-all"
  aria-label="View your saved searches"
>
  <Bookmark className="h-5 w-5 shrink-0" />
  View your saved searches
</Link>
<Link
  href="/alerts/manage-alerts"
  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg bg-blue-600 text-white font-bold text-base hover:bg-blue-700 shadow-md transition-all"
  aria-label="View your alerts"
>
  <Bell className="h-5 w-5 shrink-0" />
  View your alerts
</Link>
</div>
</div>

 {/* Toolbar: sort + view + filter toggle */}
 <div className="pt-3 border-t border-gray-100">
 <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
 <div className="flex items-center gap-2 flex-wrap">
 <button onClick={() => setShowFilters(!showFilters)}
 className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold border transition-all ${showFilters ? 'bg-[#166534] text-white border-[#166534]' : 'bg-white text-gray-600 border-gray-200 hover:border-[#166534] hover:text-[#166534] '}`}>
 <SlidersHorizontal className="h-3.5 w-3.5"/>
 Refine Filters
 {showFilters ? <ChevronUp className="h-3.5 w-3.5"/> : <ChevronDown className="h-3.5 w-3.5"/>}
 </button>
 <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}
 
 className="px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 focus:border-[#166534] outline-none">
 <option value="deadline-asc">Deadline (Soonest first)</option>
 <option value="deadline-desc">Deadline (Latest first)</option>
 <option value="posted-desc">Posted (Newest first)</option>
 <option value="posted-asc">Posted (Oldest first)</option>
 </select>
 </div>
 <div className="relative sm:ml-auto">
 {showSignedInNavGuide && hasSearched && filteredResults.length > 0 && (
 <div className="absolute -top-12 right-0 rounded-md bg-emerald-900 px-3 py-1.5 text-xs font-bold text-white shadow-lg whitespace-nowrap">
 Toggle View: switch List/Card layouts
 </div>
 )}
 <div className={`inline-flex items-center rounded-lg border border-gray-300 bg-white p-0.5 ${
 showSignedInNavGuide && hasSearched && filteredResults.length > 0 ? 'ring-2 ring-emerald-400 ring-offset-2' : ''
 }`}>
 <button
 onClick={() => setViewMode('list')}
 className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black transition-colors ${
 viewMode === 'list' ? 'bg-[#166534] text-white' : 'text-gray-700 hover:bg-gray-100'
 }`}
 aria-label="Switch to list view"
 >
 <List className="h-3.5 w-3.5" />
 List view
 </button>
 <button
 onClick={() => setViewMode('grid')}
 className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-black transition-colors ${
 viewMode === 'grid' ? 'bg-[#166534] text-white' : 'text-gray-700 hover:bg-gray-100'
 }`}
 aria-label="Switch to card view"
 >
 <Grid className="h-3.5 w-3.5" />
 Card view
 </button>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Filter panel */}
 {showFilters && (
 <div className="filter-panel bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-black text-sm text-gray-900 flex items-center gap-2"style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"}}>
 <Filter className="h-4 w-4 text-[#166534]"/>Refine Results
 </h3>
 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => setShowFilters(false)}
 className="inline-flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-black text-slate-700 shadow-sm transition-colors hover:bg-slate-100"
 >
 <ChevronUp className="h-3.5 w-3.5" />
 Collapse
 </button>
 <button
 onClick={() => { setAgency(''); setSelectedSetAsides([]); setNaics(''); setSelectedStates([]); setProcurementType(''); setClassificationCode(''); setSolicitationNumber(''); setOpportunityStatus('active'); setAdvancedApplied(false); }}
 className="search-reset-btn flex items-center gap-2 border border-red-700 bg-red-600 px-4 py-2 text-sm font-black text-white shadow-sm transition-all hover:bg-red-700 active:scale-98"
 style={{ color: '#fff' }}>
 <RefreshCw className="h-4 w-4 text-white"/>Reset filters
 </button>
 </div>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
 {/* Keyword refine */}
 <div>
 <label className="block font-bold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.08em", fontWeight: 700 }}>Keyword Filter</label>
 <input type="text"value={advKeywords}
 onChange={(e) => { setAdvKeywords(e.target.value); setAdvancedApplied(true); }}
 placeholder="e.g., cloud services"
 
 className="w-full px-3 rounded-lg border-2 border-gray-200 bg-white font-medium text-gray-900 placeholder-gray-300 focus:border-[#166534] outline-none transition-all" style={{ height: "42px", fontSize: "15px" }}/>
 <p className="text-gray-400" style={{ fontSize: "15px", margin: "4px 0 0" }}>Filters results instantly</p>
 </div>
 {/* Set-aside */}
 <div>
 <MultiSelectDropdown
 label="Set-Aside Type"
 options={SET_ASIDE_OPTIONS.filter(o => o.code !== '')}
 selected={selectedSetAsides}
 onChange={setSelectedSetAsides}
 placeholder="Any set-aside"
 />
 </div>
 {/* State */}
 <div>
 <MultiSelectDropdown
 label="State / Territory"
 options={US_STATES_AND_TERRITORIES.filter(l => l.code !== '')}
 selected={selectedStates}
 onChange={setSelectedStates}
 placeholder="Any state"
 />
 </div>
 {/* Agency */}
 <div>
 <label className="block font-bold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.08em", fontWeight: 700 }}>Agency</label>
 <input type="text"value={agency} onChange={(e) => setAgency(e.target.value)}
 placeholder="e.g., Dept of Defense"
 
 className="w-full px-3 rounded-lg border-2 border-gray-200 bg-white font-medium text-gray-900 placeholder-gray-300 focus:border-[#166534] outline-none transition-all" style={{ height: "42px", fontSize: "15px" }}/>
 </div>
 {/* NAICS */}
 <div>
 <label className="block font-bold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.08em", fontWeight: 700 }}>NAICS Code</label>
 <input type="text"value={naics} onChange={(e) => setNaics(e.target.value)}
 placeholder="e.g., 541512"
 
 className="w-full px-3 rounded-lg border-2 border-gray-200 bg-white font-medium text-gray-900 placeholder-gray-300 focus:border-[#166534] outline-none transition-all" style={{ height: "42px", fontSize: "15px" }}/>
 </div>
 {/* Procurement type */}
 <div>
 <label className="block font-bold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.08em", fontWeight: 700 }}>Opportunity Type</label>
 <select value={procurementType} onChange={(e) => setProcurementType(e.target.value)}
 
 className="w-full px-3 rounded-lg border-2 border-gray-200 bg-white font-medium text-gray-900 focus:border-[#166534] outline-none transition-all" style={{ height: "42px", fontSize: "15px" }}>
 <option value="">All Types</option>
 <option value="o">Solicitation</option>
 <option value="k">Combined Synopsis/Solicitation</option>
 <option value="p">Pre-Solicitation</option>
 <option value="r">Sources Sought</option>
 <option value="a">Award Notice</option>
 <option value="u">Justification (J&amp;A)</option>
 <option value="s">Special Notice</option>
 </select>
 </div>
 {/* PSC */}
 <div>
 <label className="block font-bold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.08em", fontWeight: 700 }}>PSC Code</label>
 <input type="text"value={classificationCode} onChange={(e) => setClassificationCode(e.target.value)}
 placeholder="e.g., R425"
 
 className="w-full px-3 rounded-lg border-2 border-gray-200 bg-white font-medium text-gray-900 placeholder-gray-300 focus:border-[#166534] outline-none transition-all" style={{ height: "42px", fontSize: "15px" }}/>
 </div>
 {/* Solicitation # */}
 <div>
 <label className="block font-bold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.08em", fontWeight: 700 }}>Solicitation #</label>
 <input type="text"value={solicitationNumber} onChange={(e) => setSolicitationNumber(e.target.value)}
 placeholder="e.g., W912DY24R0001"
 
 className="w-full px-3 rounded-lg border-2 border-gray-200 bg-white font-medium text-gray-900 placeholder-gray-300 focus:border-[#166534] outline-none transition-all" style={{ height: "42px", fontSize: "15px" }}/>
 </div>
 {/* Status */}
 <div>
 <label className="block font-bold text-gray-600 mb-1.5 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.08em", fontWeight: 700 }}>Status</label>
 <select value={opportunityStatus} onChange={(e) => setOpportunityStatus(e.target.value)}
 
 className="w-full h-10 px-3 rounded-lg border-2 border-gray-200 text-sm font-medium text-gray-900 focus:border-[#166534] outline-none transition-all">
 <option value="">All Statuses</option>
 <option value="active">Active</option>
 <option value="archived">Archived</option>
 <option value="cancelled">Cancelled</option>
 </select>
 </div>
 </div>

 {/* Active filter chips */}
 {(agency || selectedSetAsides.length > 0 || naics || selectedStates.length > 0 || procurementType || classificationCode || solicitationNumber || opportunityStatus) && (
 <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
 {agency && <FilterChip label={`Agency: ${agency}`} onRemove={() => setAgency('')} />}
 {selectedSetAsides.length > 0 && <FilterChip label={`Set-Aside: ${selectedSetAsides.length === 1 ? (getSetAsideLabel(selectedSetAsides[0]) || selectedSetAsides[0]) : `${selectedSetAsides.length} selected`}`} onRemove={() => setSelectedSetAsides([])} />}
 {naics && <FilterChip label={`NAICS: ${naics}`} onRemove={() => setNaics('')} />}
 {selectedStates.length > 0 && <FilterChip label={`State: ${selectedStates.length === 1 ? getLocationLabel(selectedStates[0]) : `${selectedStates.length} selected`}`} onRemove={() => setSelectedStates([])} />}
 {procurementType && <FilterChip label={`Type: ${procurementType}`} onRemove={() => setProcurementType('')} />}
 {classificationCode && <FilterChip label={`PSC: ${classificationCode}`} onRemove={() => setClassificationCode('')} />}
 {solicitationNumber && <FilterChip label={`Sol #: ${solicitationNumber}`} onRemove={() => setSolicitationNumber('')} />}
 {opportunityStatus && <FilterChip label={`Status: ${opportunityStatus}`} onRemove={() => setOpportunityStatus('active')} />}
 </div>
 )}
 </div>
 )}

 {/* Results toolbar count */}
 <div className="results-count-bar rounded-2xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
 {showSavedOnly ? (
 <span className="text-[17px] font-semibold text-gray-700">
 Showing <strong>{filteredResults.length}</strong> saved of {results.length} results
 </span>
 ) : (
 <div className="flex w-full items-center justify-between gap-3 flex-wrap">
 <div className="flex-1 min-w-[300px]">
 <p className="text-[17px] font-semibold text-gray-700">
 {filteredResults.length >= 100 ? '🎯 ' : filteredResults.length >= 10 ? '✅ ' : ''}
 <strong className="text-[#166534]">{filteredResults.length.toLocaleString()}</strong>{' '}
 {filteredResults.length === 1 ? 'opportunity' : 'opportunities'}
 {keywords && <> for <em>&quot;{keywords}&quot;</em></>}
 </p>
 {activeSearchSummaryParts.length > 0 && (
 <div className="mt-2 flex flex-wrap items-center gap-2">
 <span className="inline-flex items-center rounded-md bg-slate-700 px-2.5 py-1 text-xs font-black text-white">
 Filters
 </span>
 {visibleSearchSummaryParts.map((part, index) => {
 const filterKey = getFilterKey(part)
 const isDisabled = filterKey ? disabledFilters.has(filterKey) : false
 return (
 <span
 key={`${part}-mini-${index}`}
 title={isDisabled ? 'Click ↺ to re-enable this filter' : undefined}
 className={`inline-flex items-center gap-1 rounded-md border px-3 py-1 text-xs font-bold shadow-sm transition-all ${
   isDisabled ? 'bg-gray-100 border-gray-300 text-gray-400 line-through' : getSummaryChipTone(part)
 }`}
 >
 {part}
 {filterKey && (
   <button
     type="button"
     onClick={(e) => { e.stopPropagation(); handleChipToggle(part) }}
     className="ml-0.5 rounded hover:opacity-70 transition-opacity"
     aria-label={isDisabled ? `Re-enable filter: ${part}` : `Disable filter: ${part}`}
   >
     {isDisabled
       ? <RefreshCw className="h-3 w-3 text-gray-500" />
       : <X className="h-3 w-3" />
     }
   </button>
 )}
 </span>
 )
 })}
 {activeSearchSummaryParts.length > 3 && (
 <button
 type="button"
 onClick={() => setShowAllSearchParams(v => !v)}
 className="inline-flex items-center rounded-md border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800 shadow-sm hover:bg-blue-100 transition-colors"
 >
 {showAllSearchParams ? 'Show less' : `+${hiddenSearchSummaryCount} more`}
 </button>
 )}
 </div>
 )}
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 onClick={() => handleOpenSaveModal('save')}
 className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700"
 >
 <Save className="h-4 w-4" />
 Save this search
 </button>
 <button
 type="button"
 onClick={() => handleOpenSaveModal('alert')}
 className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-4 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-orange-600"
 >
 <Bell className="h-4 w-4" />
 Get email alerts
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Results cards */}
 {filteredResults.length > 0 ? (
 <>
 {viewMode === 'list' ? (
 <div className="space-y-3">
 {paginatedResults.map((opp, idx) => {
 const globalIndex = (uiPage - 1) * resultsPerPage + idx
 const rawSetAside = getSetAsideLabel(opp.typeOfSetAside || opp.setAside || '') || '';
 const setAsideLabel = isMeaningful(rawSetAside) ? rawSetAside : null;
 const setAsideCode = SET_ASIDE_CODE_BY_LABEL[rawSetAside] || opp.typeOfSetAside || opp.setAside || '';
 const place = getPlaceLabel(opp);
 const stateCode = opp.placeOfPerformance?.state?.code?.trim() || '';
 const naics = isMeaningful(opp.naicsCode) ? opp.naicsCode : null;
 const oppAgency = opp.department || opp.fullParentPathName || opp.office || '';
 const deadlineMeta = getDeadlineMeta(opp.responseDeadLine);
 return (
 <div key={opp.noticeId || globalIndex}
 className="result-list-card bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md hover:border-[#166534]/30 transition-all p-5 cursor-pointer"
 style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"}}
 onClick={() => setSelectedOpp(opp)}
 role="button"
 tabIndex={0}
 onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setSelectedOpp(opp) }}
 >
 {/* Title row */}
 <div className="flex items-start justify-between gap-3 mb-3">
 <h3 className="font-bold text-gray-900 leading-snug flex-1" style={{ fontSize: "18px" }}>
 {opp.title || 'Untitled Opportunity'}
 </h3>
 <button
 onClick={(e) => {
 e.stopPropagation();
 if (!requireAccess('Save Opportunities')) return;
 toggleSaved(opp.noticeId || String(globalIndex), opp);
 }}
 title={saved[opp.noticeId || String(globalIndex)] ? 'Remove from favorites' : 'Add to favorites'}
 className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold text-xs transition-all duration-150 active:scale-95 ${saved[opp.noticeId || String(globalIndex)] ? 'bg-rose-500 text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-rose-400 hover:text-rose-500'}`}
 >
 <Heart className={`h-4 w-4 ${saved[opp.noticeId || String(globalIndex)] ? 'fill-current' : ''}`} />
 {saved[opp.noticeId || String(globalIndex)] ? '♥ Favorited' : 'Favorite'}
 </button>
 </div>
 {/* Highlight badges */}
 <div className="flex flex-wrap gap-2 mb-3">
 {deadlineMeta && <span className={`${BADGE_BASE} ${deadlineMeta.gradient}`} style={{ color: '#fff' }}>{deadlineMeta.label}</span>}
 {setAsideLabel && (
   <button type="button"
     onClick={(e) => { e.stopPropagation(); setSelectedSetAsides(setAsideCode ? [setAsideCode] : []); runSearchWithOverrides({ setAside: setAsideCode }); }}
     title={`Filter by set-aside: ${setAsideLabel}`}
     className={`${BADGE_BASE} bg-linear-to-r from-indigo-500 to-purple-600 text-white hover:opacity-80 transition-opacity`}
     style={{ color: '#fff' }}>
     <Filter className="h-2.5 w-2.5 mr-1 opacity-70 inline-block" />{setAsideLabel}
   </button>
 )}
 {naics && (
   <button type="button"
     onClick={(e) => { e.stopPropagation(); setNaics(naics); runSearchWithOverrides({ naics }); }}
     title={`Filter by NAICS: ${naics}`}
     className={`${BADGE_BASE} bg-linear-to-r from-sky-500 to-blue-600 text-white hover:opacity-80 transition-opacity`}
     style={{ color: '#fff' }}>
     <Filter className="h-2.5 w-2.5 mr-1 opacity-70 inline-block" />NAICS {naics}
   </button>
 )}
 {place && stateCode && (
   <button type="button"
     onClick={(e) => { e.stopPropagation(); setSelectedStates([stateCode]); runSearchWithOverrides({ stateOfPerformance: stateCode }); }}
     title={`Filter by state: ${place}`}
     className={`${BADGE_BASE} bg-linear-to-r from-emerald-500 to-teal-500 text-white hover:opacity-80 transition-opacity`}
     style={{ color: '#fff' }}>
     <Filter className="h-2.5 w-2.5 mr-1 opacity-70 inline-block" />{place}
   </button>
 )}
 {place && !stateCode && (
   <span className={`${BADGE_BASE} bg-linear-to-r from-emerald-500 to-teal-500 text-white`} style={{ color: '#fff' }}>{place}</span>
 )}
 </div>
 {/* Key fields grid */}
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2 mb-3">
 {opp.solicitationNumber && (
 <div>
 <div className="result-field-label font-bold text-gray-400 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>Solicitation #</div>
 <div className="result-field-value font-semibold text-gray-800" style={{ fontSize: "17px" }}>{opp.solicitationNumber}</div>
 </div>
 )}
 {oppAgency ? (
 <button type="button"
   onClick={(e) => { e.stopPropagation(); setAgency(oppAgency); runSearchWithOverrides({ agency: oppAgency }); }}
   title={`Filter by agency: ${oppAgency}`}
   className="text-left group rounded-md px-1 -mx-1 hover:bg-green-50 transition-colors cursor-pointer">
   <div className="result-field-label font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>
     Agency <Filter className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
   </div>
   <div className="text-sm font-semibold text-[#166534] line-clamp-1 group-hover:underline">{oppAgency}</div>
 </button>
 ) : (
 <div>
   <div className="result-field-label font-bold text-gray-400 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>Agency</div>
   <div className="text-sm font-semibold text-gray-400">—</div>
 </div>
 )}
 {setAsideLabel && (
 <button type="button"
   onClick={(e) => { e.stopPropagation(); setSelectedSetAsides(setAsideCode ? [setAsideCode] : []); runSearchWithOverrides({ setAside: setAsideCode }); }}
   title={`Filter by set-aside: ${setAsideLabel}`}
   className="text-left group rounded-md px-1 -mx-1 hover:bg-indigo-50 transition-colors cursor-pointer">
   <div className="result-field-label font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>
     Set-Aside <Filter className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
   </div>
   <div className="result-field-value font-semibold text-gray-800 group-hover:underline" style={{ fontSize: "17px" }}>{setAsideLabel}</div>
 </button>
 )}
 {stateCode ? (
 <button type="button"
   onClick={(e) => { e.stopPropagation(); setSelectedStates([stateCode]); runSearchWithOverrides({ stateOfPerformance: stateCode }); }}
   title={`Filter by state: ${place}`}
   className="text-left group rounded-md px-1 -mx-1 hover:bg-emerald-50 transition-colors cursor-pointer">
   <div className="result-field-label font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>
     Place of Performance <Filter className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
   </div>
   <div className="result-field-value font-semibold text-gray-800 group-hover:underline" style={{ fontSize: "17px" }}>{place}</div>
 </button>
 ) : (
 <div>
   <div className="result-field-label font-bold text-gray-400 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>Place of Performance</div>
   <div className="result-field-value font-semibold text-gray-400 italic" style={{ fontSize: "17px" }}>Unknown</div>
 </div>
 )}
 {naics && (
 <button type="button"
   onClick={(e) => { e.stopPropagation(); setNaics(naics); runSearchWithOverrides({ naics }); }}
   title={`Filter by NAICS: ${naics}`}
   className="text-left group rounded-md px-1 -mx-1 hover:bg-sky-50 transition-colors cursor-pointer">
   <div className="result-field-label font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>
     NAICS <Filter className="h-2.5 w-2.5 opacity-0 group-hover:opacity-60 transition-opacity" />
   </div>
   <div className="result-field-value font-semibold text-sky-700 group-hover:underline" style={{ fontSize: "17px" }}>{naics}</div>
 </button>
 )}
 {opp.postedDate && (
 <div>
 <div className="result-field-label font-bold text-gray-400 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>Posted</div>
 <div className="result-field-value font-semibold text-gray-800" style={{ fontSize: "17px" }}>{new Date(opp.postedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
 </div>
 )}
 {opp.responseDeadLine && (
 <div>
 <div className="result-field-label font-bold text-gray-400 uppercase tracking-wide" style={{ fontSize: "14px", letterSpacing: "0.06em" }}>Response Due</div>
 <div className={`text-sm font-bold ${new Date(opp.responseDeadLine).getTime() - Date.now() < 7 * 86400000 ? 'text-red-500 ' : 'text-amber-600 '}`}>
 {new Date(opp.responseDeadLine).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
 </div>
 </div>
 )}
 </div>
 {/* Actions row */}
 <div className="flex items-center gap-4 pt-3 border-t border-gray-100">
   <button
     className="font-bold text-[#166534] underline underline-offset-2 hover:text-[#14532d] transition-colors text-sm"
     onClick={(e) => { e.stopPropagation(); setSelectedOpp(opp); }}
   >
     Quick view
   </button>
   {opp.uiLink && (
     <a href={opp.uiLink} target="_blank" rel="noopener noreferrer"
       onClick={(e) => e.stopPropagation()}
       className="font-bold text-gray-500 flex items-center gap-1 hover:text-[#166534] transition-colors text-sm">
       View on SAM.gov <ArrowUpRight className="h-3.5 w-3.5"/>
     </a>
   )}
   {copiedId === opp.noticeId ? (
     <span className="text-xs text-green-600 font-semibold ml-auto">Copied!</span>
   ) : (
     <button onClick={(e) => { e.stopPropagation(); copyText(opp.noticeId || ''); }}
       className="ml-auto font-bold text-gray-400 flex items-center gap-1 hover:text-gray-600 transition-colors text-xs">
       <Copy className="h-3 w-3"/>Copy ID
     </button>
   )}
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
 {paginatedResults.map((opp, idx) => {
 const globalIndex = (uiPage - 1) * resultsPerPage + idx
 return (
 <OpportunityCard
 key={opp.noticeId || globalIndex}
 opportunity={opp} index={globalIndex}
 isSaved={!!saved[opp.noticeId || String(globalIndex)]}
 toggleSaved={toggleSaved}
 copyText={copyText} copiedId={copiedId}
 onOpen={setSelectedOpp}
 />
 )})}
 </div>
 )}

 {/* Pagination */}
 <div className="mt-4 flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <p className="text-sm font-bold text-gray-700">
 Showing <span className="text-[#166534]">{pageStartIndex.toLocaleString()}</span>–
 <span className="text-[#166534]">{pageEndIndex.toLocaleString()}</span> of{' '}
 <span className="text-[#166534]">{filteredResults.length.toLocaleString()}</span> results
 </p>
 <div className="flex items-center gap-2">
 <label htmlFor="results-per-page" className="text-xs font-bold uppercase tracking-wide text-gray-500">
 Per page
 </label>
 <select
 id="results-per-page"
 value={resultsPerPage}
 onChange={(e) => {
 const next = Number(e.target.value)
 setResultsPerPage(next)
 setUiPage(1)
 }}
 className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm font-bold text-gray-700 focus:border-[#166534] focus:outline-none"
 >
 <option value={10}>10</option>
 <option value={25}>25</option>
 <option value={50}>50</option>
 <option value={100}>100</option>
 </select>
 </div>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <button
 type="button"
 onClick={() => setUiPage(p => Math.max(1, p - 1))}
 disabled={uiPage <= 1}
 className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
 >
 Previous
 </button>
 {visiblePageNumbers.map((page) => (
 <button
 key={`page-${page}`}
 type="button"
 onClick={() => setUiPage(page)}
 className={`inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-black transition-colors ${
 page === uiPage
 ? 'border-[#166534] bg-[#166534] text-white'
 : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
 }`}
 >
 {page}
 </button>
 ))}
 <button
 type="button"
 onClick={() => setUiPage(p => Math.min(totalUiPages, p + 1))}
 disabled={uiPage >= totalUiPages}
 className="inline-flex h-9 items-center rounded-md border border-gray-300 bg-white px-3 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
 >
 Next
 </button>
 <span className="ml-1 text-xs font-semibold text-gray-500">
 Page {uiPage.toLocaleString()} of {totalUiPages.toLocaleString()}
 </span>
 </div>

 {hasMoreResults && (
 <div className="pt-1">
 <button
 onClick={() => runSearch(true)}
 disabled={loadingMore}
 className="inline-flex items-center gap-2 rounded-md border-2 border-[#166534] bg-white px-4 py-2 text-sm font-black text-[#166534] transition-colors hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
 >
 {loadingMore ? <><Loader2 className="h-4 w-4 animate-spin"/>Loading…</> : <><Plus className="h-4 w-4"/>Load next 1,000 from SAM.gov</>}
 </button>
 </div>
 )}
 </div>
 </>
 ) : (
 <div className="no-results bg-white rounded-2xl border border-gray-200 shadow-sm py-16 text-center">
 <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4"/>
 <h3 className="text-xl font-black text-gray-900 mb-2"style={{ fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif"}}>No Results Found</h3>
 <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">Your filters returned 0 opportunities. Try broadening your search.</p>
 <button onClick={resetAll}
 className="pgc-green px-6 py-3 rounded-xl bg-[#166534] hover:bg-[#14532d] text-white font-bold text-sm transition-colors">
 Clear All Filters &amp; Start Over
 </button>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Sticky prompt */}
 {showStickyPrompt && !stickyPromptDismissed && filteredResults.length > 0 && (
 <StickyResultsPrompt
 count={filteredResults.length} keywords={keywords}
 postedAfter={postedAfter} responseDeadlineBefore={responseDeadlineBefore}
 selectedSetAsides={selectedSetAsides} selectedStates={selectedStates}
 onSave={() => { handleOpenSaveModal('save'); setStickyPromptDismissed(true); setShowStickyPrompt(false); }}
 onAlert={() => { handleOpenSaveModal('alert'); setStickyPromptDismissed(true); setShowStickyPrompt(false); }}
 onDismiss={() => { setStickyPromptDismissed(true); setShowStickyPrompt(false); }}
 />
 )}

 {/* Soft reminder at 10 / 15 min */}
 <BrowseReminderModal
 level={showReminderModal ? reminderLevel : 0}
 onClose={() => setShowReminderModal(false)}
 onSignUp={() => { setShowReminderModal(false); setBlockedFeature('Search Federal Opportunities'); setShowAccessModal(true); }}
 />

 {/* Hard lockout at 20 min */}
 {showLockoutModal && !hasValidAccess && (
 <LockoutModal
 onSignUp={() => { setBlockedFeature('Search Federal Opportunities'); setShowAccessModal(true); }}
 onClose={() => setShowLockoutModal(false)}
 />
 )}

 {/* Modals */}
 <UnifiedSaveSearchModal
 mode={saveModalMode} isOpen={showSaveModal} onClose={() => setShowSaveModal(false)}
 searchParams={{
 title: keywords.trim(), postedFrom: postedAfter.trim(),
 rdlto: responseDeadlineBefore.trim(), solnum: solicitationNumber.trim(),
 ptype: procurementType, typeOfSetAside: setAsideCodesToString(selectedSetAsides),
 status: opportunityStatus.trim(), state: locationCodesToString(selectedStates),
 ncode: naics.trim(), ccode: classificationCode.trim(), organizationName: agency.trim(),
 }}
 onSave={handleSaveSuccess}
 />
 <SaveSearchSuccessModal
 isOpen={showSuccessModal} onClose={() => setShowSuccessModal(false)}
 searchName={successData.searchName} isSubscription={successData.isSubscription}
 />
 {/* Only render AccessControlModal if explicitly triggered by user action */}
 {showAccessModal && (
 <AccessControlModal
 isOpen={showAccessModal}
 onClose={() => setShowAccessModal(false)}
 featureName={blockedFeature}
 />
 )}

 {/* Opportunity detail drawer */}
 <OpportunityDetailDrawer
 opp={selectedOpp}
 isSaved={selectedOpp ? !!saved[selectedOpp.noticeId || ''] : false}
 onToggleSaved={(id, data) => {
 if (!requireAccess('Save Opportunities')) return;
 toggleSaved(id, data);
 }}
 onClose={() => setSelectedOpp(null)}
 />
 </main>
 </SearchErrorBoundary>
 )
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
 return (
 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-xs font-semibold"
 >
 {label}
 <button onClick={onRemove} className="hover:text-red-500 transition-colors ml-0.5">
 <X className="h-3 w-3"/>
 </button>
 </span>
 );
}
