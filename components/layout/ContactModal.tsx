"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Upload, Trash2, CheckCircle, AlertCircle, Loader2, Send, ChevronDown } from "lucide-react";

interface ContactModalProps { isOpen: boolean; onClose: () => void; }
interface AttachedFile { file: File; id: string; }

const INQUIRY_OPTIONS = [
  { value: "contract",       label: "Contract Opportunity",  icon: "📋", desc: "Federal contract bids & awards" },
  { value: "consulting",     label: "Consulting Services",   icon: "💼", desc: "Expert GovCon guidance" },
  { value: "partnership",    label: "Partnership Inquiry",   icon: "🤝", desc: "Team up on opportunities" },
  { value: "subcontracting", label: "Subcontracting",        icon: "🔗", desc: "Sub / prime relationships" },
  { value: "support",        label: "Technical Support",     icon: "🛠️", desc: "Platform help & issues" },
  { value: "other",          label: "Other",                 icon: "💬", desc: "General inquiries" },
];

const MAX_MB = 10, MAX_FILES = 5;
const ALLOWED = [
  "application/pdf","application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png","image/jpeg","image/webp","text/plain",
];

const fmt  = (b: number) => b < 1048576 ? `${(b/1024).toFixed(0)} KB` : `${(b/1048576).toFixed(1)} MB`;
const fIco = (t: string) => t.includes("pdf") ? "📄" : t.includes("word")||t.includes("doc") ? "📝" : t.includes("excel")||t.includes("sheet") ? "📊" : t.startsWith("image") ? "🖼️" : "📎";

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [loading, setLoading]   = useState(false);
  const [status,  setStatus]    = useState<"idle"|"ok"|"err">("idle");
  const [errMsg,  setErrMsg]    = useState<string|null>(null);
  const [files,   setFiles]     = useState<AttachedFile[]>([]);
  const [dragOver,setDragOver]  = useState(false);
  const [fileErr, setFileErr]   = useState<string|null>(null);
  const [ddOpen,  setDdOpen]    = useState(false);
  const [inquiry, setInquiry]   = useState("");
  const [submittedName,    setSubmittedName]    = useState("");
  const [submittedEmail,   setSubmittedEmail]   = useState("");
  const [submittedInquiry, setSubmittedInquiry] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const reset = useCallback(() => {
    setStatus("idle"); setErrMsg(null); setLoading(false);
    setFiles([]); setFileErr(null); setInquiry(""); setDdOpen(false);
    setSubmittedName(""); setSubmittedEmail(""); setSubmittedInquiry("");
  }, []);
  const closeAll = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key==="Escape" && isOpen) closeAll(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, closeAll]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => { if (isOpen) reset(); }, [isOpen, reset]);

  function addFiles(list: FileList | File[]) {
    setFileErr(null);
    const arr = Array.from(list), toAdd: AttachedFile[] = [];
    for (const f of arr) {
      if (files.length + toAdd.length >= MAX_FILES) { setFileErr(`Max ${MAX_FILES} files.`); break; }
      if (!ALLOWED.includes(f.type))               { setFileErr(`"${f.name}" — unsupported type.`); continue; }
      if (f.size > MAX_MB * 1048576)               { setFileErr(`"${f.name}" exceeds ${MAX_MB} MB.`); continue; }
      toAdd.push({ file: f, id: `${Date.now()}-${Math.random()}` });
    }
    setFiles(p => [...p, ...toAdd]);
  }

  async function b64(file: File): Promise<string> {
    return new Promise((res, rej) => {
      const r = new FileReader();
      r.onload = () => res((r.result as string).split(",")[1]);
      r.onerror = rej;
      r.readAsDataURL(file);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!inquiry) { setStatus("err"); setErrMsg("Please select an inquiry type."); return; }
    setLoading(true); setStatus("idle"); setErrMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      firstName:   String(fd.get("firstName")||"").trim(),
      lastName:    String(fd.get("lastName") ||"").trim(),
      email:       String(fd.get("email")    ||"").trim(),
      phone:       String(fd.get("phone")    ||"").trim(),
      company:     String(fd.get("company")  ||"").trim(),
      inquiryType: inquiry,
      message:     String(fd.get("message")  ||"").trim(),
      attachments: await Promise.all(files.map(async ({file}) => ({
        filename: file.name, content: await b64(file), contentType: file.type,
      }))),
    };
    try {
      const res  = await fetch("/api/contact", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(payload) });
      const data = await res.json().catch(()=>({}));
      if (res.ok && data?.success) { setSubmittedName(payload.firstName || payload.lastName || "there"); setSubmittedEmail(payload.email); setSubmittedInquiry(INQUIRY_OPTIONS.find(o => o.value === inquiry)?.label || inquiry || "General Inquiry"); setStatus("ok"); formRef.current?.reset(); setFiles([]); }
      else { setStatus("err"); setErrMsg(typeof data?.error==="string" ? data.error : "Unable to send. Please try again."); }
    } catch { setStatus("err"); setErrMsg("Network error. Please try again."); }
    finally  { setLoading(false); }
  }

  if (!isOpen) return null;
  const selOpt = INQUIRY_OPTIONS.find(o => o.value === inquiry);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes pgcSlide {
          from { opacity:0; transform:scale(.96) translateY(22px); }
          to   { opacity:1; transform:scale(1)   translateY(0);    }
        }
        @keyframes pgcBar {
          0%   { background-position:0%   50% }
          100% { background-position:300% 50% }
        }
        @keyframes pgcFade {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0);   }
        }
        .pgc-card { animation: pgcSlide .35s cubic-bezier(.16,1,.3,1) forwards; }
        .pgc-fade { animation: pgcFade  .25s ease forwards; }

        .pgc-input {
          display: block; width: 100%;
          background: rgba(0,20,40,0.7);
          border: 2px solid rgba(6,182,212,.2);
          border-radius: 10px;
          padding: 14px 16px;
          color: #f0fdff;
          font-size: 17px;
          font-family: inherit;
          outline: none;
          transition: border-color .18s, box-shadow .18s, background .18s;
        }
        .pgc-input:focus {
          border-color: #06b6d4;
          box-shadow: 0 0 0 3px rgba(6,182,212,.18);
          background: rgba(0,20,40,.95);
        }
        .pgc-input::placeholder { color:rgba(148,163,184,.45); font-size:16px; }

        .pgc-lbl {
          display: block;
          font-size: 12px;
          font-weight: 900;
          letter-spacing: .1em;
          text-transform: uppercase;
          color: #22d3ee;
          margin-bottom: 7px;
        }
        .pgc-section-title {
          font-size: 13px;
          font-weight: 900;
          letter-spacing: .15em;
          text-transform: uppercase;
          color: rgba(255,255,255,.5);
        }
        .pgc-opt:hover { background: rgba(6,182,212,.08) !important; }
        .pgc-opt:last-child { border-bottom: none !important; }
        .pgc-scroll::-webkit-scrollbar { width:5px; }
        .pgc-scroll::-webkit-scrollbar-track { background:transparent; }
        .pgc-scroll::-webkit-scrollbar-thumb { background:rgba(6,182,212,.25); border-radius:99px; }
      `}</style>

      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/88 backdrop-blur-xl" onClick={closeAll} />

      {/* ── Card ── */}
      <div className="pgc-card relative z-10 w-full max-w-3xl flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxHeight: "94vh",
          background: "linear-gradient(160deg,#021020 0%,#031728 60%,#010c18 100%)",
          border: "2px solid rgba(6,182,212,.22)",
          boxShadow: "0 0 0 1px rgba(255,255,255,.05), 0 40px 100px rgba(0,0,0,.85), 0 0 160px rgba(6,182,212,.07)",
        }}
      >
        {/* Brand top bar — cyan → emerald → orange (matches footer) */}
        <div style={{
          height: "5px", flexShrink: 0,
          background: "linear-gradient(90deg,#06b6d4,#10b981,#f97316,#06b6d4)",
          backgroundSize: "300% 100%",
          animation: "pgcBar 5s linear infinite",
        }} />

        {/* ── Header ── */}
        <div className="flex-shrink-0 flex items-center justify-between px-8 py-5"
          style={{ borderBottom: "1px solid rgba(6,182,212,.12)", background: "rgba(6,182,212,.03)" }}
        >
          <div className="flex items-center gap-4">
            {/* Real logo */}
            <Image src="/logo.png" alt="Precise GovCon" width={52} height={52}
              className="rounded-xl flex-shrink-0"
              style={{ objectFit: "contain" }}
            />
            <div>
              <div className="font-black text-2xl leading-tight tracking-tight">
                <span className="text-white">PRECISE </span>
                <span style={{ color: "#f97316" }}>GOVCON</span>
              </div>
              <p className="text-cyan-400 text-sm font-semibold mt-0.5">
                Federal Contract Intelligence · 2–3 business day response
              </p>
            </div>
          </div>
          <button onClick={closeAll}
            className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="pgc-scroll flex-1 overflow-y-auto">

          {/* SUCCESS */}
          {status === "ok" ? (
            <div className="pgc-fade flex flex-col items-center text-center px-8 py-12 gap-5">

              {/* Animated check circle */}
              <div className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{ background: "rgba(16,185,129,.15)", border: "3px solid rgba(16,185,129,.45)", boxShadow: "0 0 50px rgba(16,185,129,.2)" }}
              >
                <CheckCircle className="w-12 h-12 text-emerald-400" />
              </div>

              {/* Personalized headline */}
              <div>
                <h3 className="text-3xl font-black text-white mb-2">
                  Got it, {submittedName}!
                </h3>
                <p className="text-slate-300 text-lg leading-relaxed max-w-md mx-auto">
                  Your{" "}
                  <span className="text-orange-400 font-bold">{submittedInquiry}</span>
                  {" "}inquiry has been received. We'll be in touch within{" "}
                  <span className="text-cyan-400 font-bold">2–3 business days</span>.
                </p>
              </div>

              {/* Confirmation sent to badge */}
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl w-full max-w-sm"
                style={{ background: "rgba(16,185,129,.08)", border: "1px solid rgba(16,185,129,.25)" }}
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <p className="text-slate-300 text-sm font-medium text-left">
                  Confirmation sent to{" "}
                  <span className="text-emerald-400 font-bold">{submittedEmail}</span>
                </p>
              </div>

              {/* Urgent contact */}
              <div className="flex items-center gap-3 px-5 py-4 rounded-xl"
                style={{ background: "rgba(6,182,212,.07)", border: "1px solid rgba(6,182,212,.2)" }}
              >
                <Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg opacity-80" />
                <p className="text-slate-400 text-sm font-medium">
                  Urgent? Email{" "}
                  <a href="mailto:support@precisegovcon.com" className="text-cyan-400 font-bold hover:underline">
                    support@precisegovcon.com
                  </a>
                </p>
              </div>

              <button onClick={closeAll}
                className="px-12 py-4 rounded-xl text-white text-lg font-black hover:scale-105 transition-transform"
                style={{ background: "linear-gradient(135deg,#059669,#06b6d4)", boxShadow: "0 6px 30px rgba(6,182,212,.3)" }}
              >
                Done
              </button>
            </div>
          ) : (

            /* ── FORM ── */
            <form ref={formRef} onSubmit={onSubmit}>

              {/* Section 1 — Contact Info */}
              <div className="px-8 pt-7 pb-6" style={{ borderBottom: "1px solid rgba(6,182,212,.1)" }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(#06b6d4,#10b981)" }} />
                  <span className="pgc-section-title">Your Information</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="pgc-lbl">First Name <span className="text-orange-400">*</span></label>
                    <input name="firstName" required placeholder="John" className="pgc-input" autoComplete="given-name" />
                  </div>
                  <div>
                    <label className="pgc-lbl">Last Name <span className="text-orange-400">*</span></label>
                    <input name="lastName" required placeholder="Doe" className="pgc-input" autoComplete="family-name" />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="pgc-lbl">Business Email <span className="text-orange-400">*</span></label>
                  <input name="email" type="email" required placeholder="john@company.com" className="pgc-input" autoComplete="email" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="pgc-lbl">Phone Number</label>
                    <input name="phone" type="tel" placeholder="(555) 123-4567" className="pgc-input" autoComplete="tel" />
                  </div>
                  <div>
                    <label className="pgc-lbl">Company / Organization</label>
                    <input name="company" placeholder="Acme Corp" className="pgc-input" autoComplete="organization" />
                  </div>
                </div>
              </div>

              {/* Section 2 — Inquiry Type */}
              <div className="px-8 pt-6 pb-6" style={{ borderBottom: "1px solid rgba(6,182,212,.1)" }}>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(#f97316,#fb923c)" }} />
                  <span className="pgc-section-title">Inquiry Type <span className="text-orange-400 ml-1">*</span></span>
                </div>

                <div className="relative">
                  <button type="button" onClick={() => setDdOpen(!ddOpen)}
                    className="pgc-input flex items-center justify-between w-full text-left"
                    style={{ cursor: "pointer", paddingRight: "44px",
                      borderColor: inquiry ? "rgba(249,115,22,.5)" : "rgba(6,182,212,.2)",
                      borderLeftColor: inquiry ? "#f97316" : "rgba(6,182,212,.2)",
                      borderLeftWidth: inquiry ? "4px" : "2px",
                    }}
                  >
                    {inquiry ? (
                      <span className="flex items-center gap-3">
                        <span className="text-xl">{selOpt?.icon}</span>
                        <span className="text-white font-bold text-lg">{selOpt?.label}</span>
                        <span className="text-slate-400 text-sm hidden sm:inline">— {selOpt?.desc}</span>
                      </span>
                    ) : (
                      <span style={{ color: "rgba(148,163,184,.5)", fontSize: "16px" }}>
                        Choose the nature of your inquiry…
                      </span>
                    )}
                  </button>
                  <ChevronDown className={`absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-cyan-400 pointer-events-none transition-transform ${ddOpen ? "rotate-180" : ""}`} />

                  {ddOpen && (
                    <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl overflow-hidden"
                      style={{ background: "#021020", border: "2px solid rgba(6,182,212,.3)", boxShadow: "0 24px 60px rgba(0,0,0,.85)" }}
                    >
                      {INQUIRY_OPTIONS.map(opt => (
                        <button key={opt.value} type="button"
                          onClick={() => { setInquiry(opt.value); setDdOpen(false); }}
                          className="pgc-opt w-full flex items-center gap-4 px-6 py-4 text-left transition-colors"
                          style={{
                            borderBottom: "1px solid rgba(6,182,212,.08)",
                            background: inquiry===opt.value ? "rgba(249,115,22,.1)" : "transparent",
                          }}
                        >
                          <span className="text-2xl w-8 text-center flex-shrink-0">{opt.icon}</span>
                          <div className="flex-1">
                            <div className={`font-bold text-lg ${inquiry===opt.value ? "text-orange-400" : "text-white"}`}>{opt.label}</div>
                            <div className="text-slate-400 text-sm mt-0.5">{opt.desc}</div>
                          </div>
                          {inquiry===opt.value && <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3 — Message + Files */}
              <div className="px-8 pt-6 pb-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(#818cf8,#a78bfa)" }} />
                  <span className="pgc-section-title">Message & Attachments</span>
                </div>

                <div className="mb-4">
                  <label className="pgc-lbl">
                    Message
                    <span className="ml-2 text-slate-500 normal-case font-normal text-xs tracking-normal">— optional</span>
                  </label>
                  <textarea name="message" rows={4}
                    placeholder="Describe your project, contract opportunity, or question in detail…"
                    className="pgc-input resize-none"
                    style={{ paddingTop: "14px", paddingLeft: "16px" }}
                  />
                </div>

                {/* Drop zone */}
                <label className="pgc-lbl mb-3">
                  Attachments
                  <span className="ml-2 text-slate-500 normal-case font-normal text-xs tracking-normal">
                    — PDF, Word, Excel, images · {MAX_MB} MB max · up to {MAX_FILES} files
                  </span>
                </label>
                <div
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={e => { e.preventDefault(); setDragOver(false); if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                  className="rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center py-8 gap-3"
                  style={{
                    borderColor: dragOver ? "#06b6d4" : "rgba(6,182,212,.22)",
                    background: dragOver ? "rgba(6,182,212,.08)" : "rgba(6,182,212,.03)",
                  }}
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all"
                    style={{ background: dragOver ? "rgba(6,182,212,.2)" : "rgba(6,182,212,.08)", border: "1px solid rgba(6,182,212,.25)" }}
                  >
                    <Upload className={`w-7 h-7 transition-colors ${dragOver ? "text-cyan-400" : "text-slate-400"}`} />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-bold text-base">
                      <span className="text-cyan-400">Click to browse</span> or drag & drop files here
                    </p>
                    <p className="text-slate-500 text-sm mt-1">PDF, Word, Excel, PNG, JPG supported</p>
                  </div>
                  <input ref={fileRef} type="file" multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                    className="hidden"
                    onChange={e => e.target.files && addFiles(e.target.files)}
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {files.map(({ file, id }) => (
                      <div key={id} className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{ background: "rgba(6,182,212,.06)", border: "1px solid rgba(6,182,212,.15)" }}
                      >
                        <span className="text-2xl flex-shrink-0">{fIco(file.type)}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{file.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{fmt(file.size)}</p>
                        </div>
                        <button type="button" onClick={() => setFiles(p => p.filter(f => f.id !== id))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {fileErr && (
                  <div className="flex items-center gap-2 mt-3 px-4 py-3 rounded-xl"
                    style={{ background: "rgba(245,158,11,.1)", border: "1px solid rgba(245,158,11,.25)" }}
                  >
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <p className="text-amber-300 text-sm font-semibold">{fileErr}</p>
                  </div>
                )}

                {status === "err" && (
                  <div className="flex items-start gap-3 mt-4 px-5 py-4 rounded-xl"
                    style={{ background: "rgba(239,68,68,.1)", border: "1.5px solid rgba(239,68,68,.3)" }}
                  >
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-base font-medium">{errMsg || "Unable to send. Please try again."}</p>
                  </div>
                )}
              </div>

              {/* ── Footer / Submit ── */}
              <div className="px-8 py-5 flex flex-col sm:flex-row items-center gap-4"
                style={{ borderTop: "1px solid rgba(6,182,212,.12)", background: "rgba(6,182,212,.03)" }}
              >
                <button type="submit" disabled={loading}
                  className="flex-1 w-full sm:w-auto flex items-center justify-center gap-3 py-4 rounded-xl text-white font-black disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[.99] transition-transform"
                  style={{
                    fontSize: "18px",
                    background: "linear-gradient(135deg,#059669,#06b6d4)",
                    boxShadow: "0 6px 32px rgba(6,182,212,.3)",
                  }}
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                      {files.length > 0 && (
                        <span className="rounded-full px-2.5 py-0.5 text-sm font-bold" style={{ background: "rgba(255,255,255,.22)" }}>
                          +{files.length} file{files.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </>
                  )}
                </button>
                <button type="button" onClick={closeAll}
                  className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-slate-300 hover:text-white hover:bg-white/8 transition-all"
                  style={{ fontSize: "17px", border: "2px solid rgba(255,255,255,.13)" }}
                >
                  Cancel
                </button>
                <p className="hidden sm:block text-xs text-slate-600 leading-relaxed">
                  By submitting, you agree<br/>we may contact you.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}