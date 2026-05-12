"use client"

import { useEffect } from "react"
import {
  X, Heart, ArrowUpRight, Building2, MapPin, Phone,
  Mail, FileText, Calendar, Tag, Shield, Clock, Hash,
} from "lucide-react"

interface Props {
  opp: any | null
  isSaved: boolean
  onToggleSaved: (id: string, data?: any) => void
  onClose: () => void
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function deadlineClass(dateStr?: string): string {
  const d = daysUntil(dateStr)
  if (d === null) return "text-gray-800"
  if (d <= 7) return "text-red-600 font-bold"
  if (d <= 30) return "text-amber-600 font-semibold"
  return "text-gray-800"
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "—"
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    })
  } catch {
    return dateStr
  }
}

function FieldCell({ label, value, className }: { label: string; value?: string | null; className?: string }) {
  if (!value) return null
  return (
    <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
      <div className="text-xs text-gray-500 font-medium mb-0.5">{label}</div>
      <div className={`text-sm font-bold text-gray-900 ${className ?? ""}`}>{value}</div>
    </div>
  )
}

export default function OpportunityDetailDrawer({ opp, isSaved, onToggleSaved, onClose }: Props) {
  // Escape key to close
  useEffect(() => {
    if (!opp) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [opp, onClose])

  // Body scroll lock
  useEffect(() => {
    if (!opp) return
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = "" }
  }, [opp])

  if (!opp) return null

  const id = opp.noticeId || opp.title || String(Date.now())
  const dept = opp.department || opp.fullParentPathName || opp.office || ""
  const setAside = opp.typeOfSetAsideDescription || opp.typeOfSetAside || opp.setAside || opp.setAsideCode || ""
  const contacts: any[] = Array.isArray(opp.pointOfContact) ? opp.pointOfContact : []
  const pop = opp.placeOfPerformance
  const popText = [
    pop?.city?.name,
    pop?.state?.code,
    pop?.zip,
    pop?.country?.code && pop.country.code !== "USA" ? pop.country.code : null,
  ].filter(Boolean).join(", ")

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel — bottom sheet on mobile, right panel on sm+ */}
      <div
        className="fixed z-50 bg-white shadow-2xl flex flex-col
                   bottom-0 left-0 right-0 h-[90dvh] rounded-t-2xl
                   sm:left-auto sm:top-0 sm:bottom-auto sm:h-full sm:w-[480px] sm:rounded-none lg:w-[560px]"
        role="dialog"
        aria-modal="true"
        aria-label="Opportunity details"
      >
        {/* ── Action bar ── */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-200 flex-shrink-0">
          {/* Favorite / Favorited button */}
          <button
            onClick={() => onToggleSaved(id, opp)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-bold text-sm transition-all duration-150 active:scale-95 ${
              isSaved
                ? "bg-rose-500 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:border-rose-400 hover:text-rose-500"
            }`}
          >
            <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
            {isSaved ? "Favorited ♥" : "Favorite"}
          </button>

          {/* Open SAM.gov */}
          {opp.uiLink && (
            <a
              href={opp.uiLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 text-white font-bold text-sm shadow-sm hover:brightness-95 transition"
            >
              Open SAM.gov <ArrowUpRight className="h-3.5 w-3.5" />
            </a>
          )}

          {/* Close */}
          <button
            onClick={onClose}
            className="ml-auto flex items-center justify-center w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors flex-shrink-0"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

          {/* Title & agency */}
          <div>
            <h2 className="text-xl font-black text-gray-900 leading-snug mb-2">
              {opp.title || "Untitled Opportunity"}
            </h2>
            {dept && (
              <div className="flex items-center gap-2 text-sm text-slate-700 font-semibold">
                <Building2 className="h-4 w-4 flex-shrink-0" />
                <span>{dept}</span>
              </div>
            )}
            {opp.office && opp.department && opp.office !== opp.department && (
              <div className="text-xs text-gray-500 mt-0.5 ml-6">{opp.office}</div>
            )}
          </div>

          {/* Key fields grid */}
          <div className="grid grid-cols-2 gap-3">
            {opp.solicitationNumber && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 col-span-2 sm:col-span-1">
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mb-0.5">
                  <Hash className="h-3 w-3" /> Solicitation #
                </div>
                <div className="text-sm font-bold text-gray-900 break-all">{opp.solicitationNumber}</div>
              </div>
            )}
            {opp.type && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mb-0.5">
                  <FileText className="h-3 w-3" /> Notice Type
                </div>
                <div className="text-sm font-bold text-gray-900">{opp.type}</div>
              </div>
            )}
            {opp.naicsCode && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mb-0.5">
                  <Tag className="h-3 w-3" /> NAICS Code
                </div>
                <div className="text-sm font-bold text-gray-900">{opp.naicsCode}</div>
              </div>
            )}
            {setAside && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mb-0.5">
                  <Shield className="h-3 w-3" /> Set-Aside
                </div>
                <div className="text-sm font-bold text-gray-900">{setAside}</div>
              </div>
            )}
            {opp.postedDate && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mb-0.5">
                  <Calendar className="h-3 w-3" /> Posted
                </div>
                <div className="text-sm font-bold text-gray-900">{formatDate(opp.postedDate)}</div>
              </div>
            )}
            {opp.responseDeadLine && (
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="flex items-center gap-1 text-xs text-gray-500 font-medium mb-0.5">
                  <Clock className="h-3 w-3" /> Response Due
                </div>
                <div className={`text-sm ${deadlineClass(opp.responseDeadLine)}`}>
                  {formatDate(opp.responseDeadLine)}
                  {(() => {
                    const d = daysUntil(opp.responseDeadLine)
                    if (d === null) return null
                    if (d < 0) return <span className="ml-1 text-xs font-medium text-gray-400">(Expired)</span>
                    return <span className="ml-1 text-xs font-medium">({d}d left)</span>
                  })()}
                </div>
              </div>
            )}
            {opp.classificationCode && (
              <FieldCell label="PSC Code" value={opp.classificationCode} />
            )}
            {opp.active && (
              <div className="rounded-lg bg-gray-50 border border-gray-200 p-3">
                <div className="text-xs text-gray-500 font-medium mb-0.5">Status</div>
                <div className={`text-sm font-bold ${opp.active === "Yes" ? "text-green-700" : "text-gray-500"}`}>
                  {opp.active === "Yes" ? "Active" : opp.active}
                </div>
              </div>
            )}
          </div>

          {/* Place of Performance */}
          {popText && (
            <div className="rounded-xl border border-slate-200 p-4 bg-white">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900 mb-1">
                <MapPin className="h-4 w-4 text-slate-500" />
                Place of Performance
              </div>
              <p className="text-sm text-gray-700 ml-6">{popText}</p>
            </div>
          )}

          {/* Description */}
          {opp.description && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-2">Description</h4>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {opp.description}
              </p>
            </div>
          )}

          {/* Point of Contact */}
          {contacts.length > 0 && (
            <div className="rounded-xl border border-gray-200 p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">Point of Contact</h4>
              <div className="space-y-3">
                {contacts.map((c: any, i: number) => (
                  <div key={i} className="text-sm">
                    {c.fullName && <div className="font-semibold text-gray-900">{c.fullName}</div>}
                    {c.title && <div className="text-gray-500 text-xs">{c.title}</div>}
                    {c.email && (
                      <a
                        href={`mailto:${c.email}`}
                        className="flex items-center gap-1.5 mt-1 text-[#166534] hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                        {c.email}
                      </a>
                    )}
                    {c.phone && (
                      <a
                        href={`tel:${c.phone}`}
                        className="flex items-center gap-1.5 mt-0.5 text-gray-600 hover:underline font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3.5 w-3.5 flex-shrink-0" />
                        {c.phone}
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Spacer so last section isn't clipped by iOS safe area */}
          <div className="h-4" />
        </div>
      </div>
    </>
  )
}
