'use client'

import React, { useState, useRef } from 'react'
import {
  Download,
  Share2,
  Copy,
  Check,
  FileText,
  FileJson,
  Table2,
  Mail,
  Printer,
  Link,
  ChevronDown,
  X,
  FileSpreadsheet,
} from 'lucide-react'

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
  typeOfSetAside?: string
  typeOfSetAsideDescription?: string
  setAside?: string
  naicsCode?: string
  placeOfPerformance?: {
    city?: { name?: string }
    state?: { code?: string }
  }
  description?: string
  uiLink?: string
  organizationName?: string
}

interface ExportSharePanelProps {
  results: Opp[]
  searchLabel?: string // e.g. "Data Analytics — 6 months — Active"
}

function escapeXml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

function escapeCsv(val: string) {
  const s = (val || '').replace(/"/g, '""')
  return `"${s}"`
}

function formatDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function dateStamp() {
  return new Date().toISOString().split('T')[0]
}

export default function ExportSharePanel({ results, searchLabel }: ExportSharePanelProps) {
  const [showDownload, setShowDownload] = useState(false)
  const [showShare, setShowShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const downloadRef = useRef<HTMLDivElement>(null)
  const shareRef = useRef<HTMLDivElement>(null)

  const count = results.length
  const label = searchLabel || `${count} opportunities`

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ─── CSV ───────────────────────────────────────────────────────────────────
  function downloadCsv() {
    const headers = [
      'Title', 'Solicitation #', 'Agency', 'Type', 'Set-Aside',
      'NAICS', 'Posted Date', 'Response Deadline', 'State', 'City',
      'Notice ID', 'SAM.gov Link',
    ]
    const rows = results.map(o => [
      o.title || '',
      o.solicitationNumber || '',
      o.department || o.fullParentPathName || o.organizationName || '',
      o.type || '',
      o.typeOfSetAsideDescription || o.typeOfSetAside || o.setAside || '',
      o.naicsCode || '',
      formatDate(o.postedDate),
      formatDate(o.responseDeadLine),
      o.placeOfPerformance?.state?.code || '',
      o.placeOfPerformance?.city?.name || '',
      o.noticeId || '',
      o.uiLink || '',
    ].map(escapeCsv).join(','))

    triggerDownload(
      [headers.map(escapeCsv).join(','), ...rows].join('\n'),
      `opportunities-${dateStamp()}.csv`,
      'text/csv;charset=utf-8'
    )
    showToast('CSV downloaded')
    setShowDownload(false)
  }

  // ─── JSON ──────────────────────────────────────────────────────────────────
  function downloadJson() {
    const payload = {
      exportDate: new Date().toISOString(),
      searchLabel: label,
      totalCount: count,
      opportunities: results.map(o => ({
        noticeId: o.noticeId,
        title: o.title,
        solicitationNumber: o.solicitationNumber,
        agency: o.department || o.fullParentPathName || o.organizationName,
        type: o.type,
        setAside: o.typeOfSetAsideDescription || o.typeOfSetAside || o.setAside,
        naicsCode: o.naicsCode,
        postedDate: o.postedDate,
        responseDeadline: o.responseDeadLine,
        state: o.placeOfPerformance?.state?.code,
        city: o.placeOfPerformance?.city?.name,
        uiLink: o.uiLink,
      })),
    }
    triggerDownload(JSON.stringify(payload, null, 2), `opportunities-${dateStamp()}.json`, 'application/json')
    showToast('JSON downloaded')
    setShowDownload(false)
  }

  // ─── TXT ──────────────────────────────────────────────────────────────────
  function downloadTxt() {
    const lines = results.map((o, i) => [
      `──────────────────────────────────────────`,
      `#${i + 1}  ${o.title || 'Untitled'}`,
      `──────────────────────────────────────────`,
      `Agency:     ${o.department || o.fullParentPathName || 'N/A'}`,
      `Sol #:      ${o.solicitationNumber || 'N/A'}`,
      `Type:       ${o.type || 'N/A'}`,
      `Set-Aside:  ${o.typeOfSetAsideDescription || o.typeOfSetAside || o.setAside || 'N/A'}`,
      `NAICS:      ${o.naicsCode || 'N/A'}`,
      `Posted:     ${formatDate(o.postedDate) || 'N/A'}`,
      `Deadline:   ${formatDate(o.responseDeadLine) || 'N/A'}`,
      `Location:   ${[o.placeOfPerformance?.city?.name, o.placeOfPerformance?.state?.code].filter(Boolean).join(', ') || 'N/A'}`,
      `Link:       ${o.uiLink || 'N/A'}`,
      '',
    ].join('\n'))

    const header = [
      `GOVCON OPPORTUNITIES EXPORT`,
      `Generated: ${new Date().toLocaleString()}`,
      `Search: ${label}`,
      `Total: ${count} opportunities`,
      '',
      '',
    ].join('\n')

    triggerDownload(header + lines.join('\n'), `opportunities-${dateStamp()}.txt`, 'text/plain')
    showToast('TXT downloaded')
    setShowDownload(false)
  }

  // ─── XML ──────────────────────────────────────────────────────────────────
  function downloadXml() {
    const rows = results.map(o => `  <opportunity>
    <noticeId>${escapeXml(o.noticeId || '')}</noticeId>
    <title>${escapeXml(o.title || '')}</title>
    <solicitationNumber>${escapeXml(o.solicitationNumber || '')}</solicitationNumber>
    <agency>${escapeXml(o.department || o.fullParentPathName || o.organizationName || '')}</agency>
    <type>${escapeXml(o.type || '')}</type>
    <setAside>${escapeXml(o.typeOfSetAsideDescription || o.typeOfSetAside || o.setAside || '')}</setAside>
    <naicsCode>${escapeXml(o.naicsCode || '')}</naicsCode>
    <postedDate>${escapeXml(o.postedDate || '')}</postedDate>
    <responseDeadline>${escapeXml(o.responseDeadLine || '')}</responseDeadline>
    <state>${escapeXml(o.placeOfPerformance?.state?.code || '')}</state>
    <city>${escapeXml(o.placeOfPerformance?.city?.name || '')}</city>
    <uiLink>${escapeXml(o.uiLink || '')}</uiLink>
  </opportunity>`).join('\n')

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<export>
  <exportDate>${new Date().toISOString()}</exportDate>
  <searchLabel>${escapeXml(label)}</searchLabel>
  <totalCount>${count}</totalCount>
  <opportunities>
${rows}
  </opportunities>
</export>`
    triggerDownload(xml, `opportunities-${dateStamp()}.xml`, 'application/xml')
    showToast('XML downloaded')
    setShowDownload(false)
  }

  // ─── PRINT ────────────────────────────────────────────────────────────────
  function printResults() {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>GovCon Opportunities — ${label}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 11px; color: #111; margin: 20px; }
    h1 { font-size: 16px; margin-bottom: 4px; }
    .meta { color: #555; font-size: 10px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #1e3a5f; color: white; padding: 6px 8px; text-align: left; font-size: 10px; }
    td { padding: 5px 8px; border-bottom: 1px solid #e5e7eb; vertical-align: top; }
    tr:nth-child(even) td { background: #f9fafb; }
    a { color: #1d4ed8; text-decoration: none; }
    @media print { button { display: none; } }
  </style>
</head>
<body>
  <h1>GovCon Opportunities Export</h1>
  <div class="meta">Generated: ${new Date().toLocaleString()} &nbsp;|&nbsp; Search: ${label} &nbsp;|&nbsp; Total: ${count}</div>
  <table>
    <thead>
      <tr>
        <th>#</th><th>Title</th><th>Agency</th><th>Type</th>
        <th>Set-Aside</th><th>NAICS</th><th>Posted</th><th>Deadline</th><th>Location</th><th>Link</th>
      </tr>
    </thead>
    <tbody>
      ${results.map((o, i) => `<tr>
        <td>${i + 1}</td>
        <td>${escapeXml(o.title || '')}</td>
        <td>${escapeXml(o.department || o.fullParentPathName || o.organizationName || '')}</td>
        <td>${escapeXml(o.type || '')}</td>
        <td>${escapeXml(o.typeOfSetAsideDescription || o.typeOfSetAside || o.setAside || '')}</td>
        <td>${escapeXml(o.naicsCode || '')}</td>
        <td>${formatDate(o.postedDate)}</td>
        <td>${formatDate(o.responseDeadLine)}</td>
        <td>${escapeXml([o.placeOfPerformance?.city?.name, o.placeOfPerformance?.state?.code].filter(Boolean).join(', '))}</td>
        <td><a href="${o.uiLink || ''}">${o.uiLink ? 'SAM.gov' : ''}</a></td>
      </tr>`).join('')}
    </tbody>
  </table>
</body>
</html>`

    const w = window.open('', '_blank')
    if (w) {
      w.document.write(html)
      w.document.close()
      w.focus()
      setTimeout(() => w.print(), 400)
    }
    setShowShare(false)
  }

  // ─── COPY LINKS ───────────────────────────────────────────────────────────
  async function copyLinks() {
    const lines = results
      .filter(o => o.uiLink)
      .map((o, i) => `${i + 1}. ${o.title}\n   ${o.uiLink}`)
      .join('\n\n')
    await navigator.clipboard.writeText(lines)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast(`${results.filter(o => o.uiLink).length} links copied`)
    setShowShare(false)
  }

  // ─── COPY PAGE URL ────────────────────────────────────────────────────────
  async function copyPageUrl() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    showToast('Page URL copied')
    setShowShare(false)
  }

  // ─── EMAIL ────────────────────────────────────────────────────────────────
  function emailResults() {
    const subject = encodeURIComponent(`GovCon Opportunities — ${label}`)
    const top10 = results.slice(0, 10)
    const body = encodeURIComponent(
      `GovCon Opportunities Export\nGenerated: ${new Date().toLocaleString()}\nSearch: ${label}\nTotal: ${count}\n\n` +
      top10.map((o, i) =>
        `${i + 1}. ${o.title}\n   Agency: ${o.department || o.fullParentPathName || 'N/A'}\n   Deadline: ${formatDate(o.responseDeadLine) || 'N/A'}\n   ${o.uiLink || ''}`
      ).join('\n\n') +
      (count > 10 ? `\n\n...and ${count - 10} more. Export to CSV for the full list.` : '')
    )
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setShowShare(false)
  }

  if (count === 0) return null

  return (
    <div className="relative flex items-center gap-2">

      {/* ── DOWNLOAD dropdown ── */}
      <div className="relative" ref={downloadRef}>
        <button
          onClick={() => { setShowDownload(p => !p); setShowShare(false) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-sm"
        >
          <Download className="h-4 w-4" />
          Download
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showDownload ? 'rotate-180' : ''}`} />
        </button>

        {showDownload && (
          <div className="absolute left-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Download {count.toLocaleString()} results as</p>
            </div>
            {[
              { icon: <FileSpreadsheet className="h-4 w-4 text-emerald-600" />, label: 'CSV Spreadsheet', sub: 'Excel / Google Sheets', fn: downloadCsv },
              { icon: <FileJson className="h-4 w-4 text-amber-600" />, label: 'JSON', sub: 'Structured data', fn: downloadJson },
              { icon: <FileText className="h-4 w-4 text-blue-600" />, label: 'Plain Text', sub: 'Readable list', fn: downloadTxt },
              { icon: <Table2 className="h-4 w-4 text-purple-600" />, label: 'XML', sub: 'Structured markup', fn: downloadXml },
            ].map(({ icon, label, sub, fn }) => (
              <button
                key={label}
                onClick={fn}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors text-left"
              >
                {icon}
                <div>
                  <div className="text-sm font-bold text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500">{sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── SHARE dropdown ── */}
      <div className="relative" ref={shareRef}>
        <button
          onClick={() => { setShowShare(p => !p); setShowDownload(false) }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-sm"
        >
          <Share2 className="h-4 w-4" />
          Share
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showShare ? 'rotate-180' : ''}`} />
        </button>

        {showShare && (
          <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50">
            <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Share {count.toLocaleString()} results</p>
            </div>
            {[
              { icon: <Link className="h-4 w-4 text-blue-600" />, label: 'Copy Page URL', sub: 'Share this search', fn: copyPageUrl },
              { icon: copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-slate-600" />, label: 'Copy All SAM.gov Links', sub: `${results.filter(o => o.uiLink).length} links`, fn: copyLinks },
              { icon: <Mail className="h-4 w-4 text-orange-600" />, label: 'Email Results', sub: 'Top 10 via email client', fn: emailResults },
              { icon: <Printer className="h-4 w-4 text-gray-600" />, label: 'Print / Save PDF', sub: 'Full formatted table', fn: printResults },
            ].map(({ icon, label, sub, fn }) => (
              <button
                key={label}
                onClick={fn}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left"
              >
                {icon}
                <div>
                  <div className="text-sm font-bold text-gray-900">{label}</div>
                  <div className="text-xs text-gray-500">{sub}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Click-outside dismiss */}
      {(showDownload || showShare) && (
        <div className="fixed inset-0 z-40" onClick={() => { setShowDownload(false); setShowShare(false) }} />
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-2xl text-sm font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Check className="h-4 w-4 text-emerald-400" />
          {toast}
        </div>
      )}
    </div>
  )
}
