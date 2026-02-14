// app/ContactModal.tsx
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { 
  X, Upload, Trash2, CheckCircle, AlertCircle, 
  Loader2, Send, ChevronDown, FileText, File, 
  FileSpreadsheet, Image as ImageIcon, Paperclip,
  Phone, Mail, Building, User, AlertTriangle, Check
} from "lucide-react";

interface ContactModalProps { 
  isOpen: boolean; 
  onClose: () => void; 
}

interface AttachedFile { 
  file: File; 
  id: string; 
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  inquiry?: string;
  phone?: string;
  company?: string;
}

// Precise GovCon brand colors
const BRAND = {
  navy: '#1e3a4c',
  navyLight: '#2d5266',
  navyDark: '#0f2a36',
  green: '#7cb342',
  greenLight: '#a5d6a5',
  greenDark: '#558b2f',
  orange: '#ff9800',
  orangeLight: '#ffb74d',
  orangeDark: '#f57c00',
  cyan: '#06b6d4',
  teal: '#10b981',
  darkBg: '#0a1a1f',
  darkerBg: '#051013',
  cardBg: '#0d2229',
  error: '#ef4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  success: '#7cb342',
  successLight: 'rgba(124, 179, 66, 0.15)',
  warning: '#ff9800',
  warningLight: 'rgba(255, 152, 0, 0.15)',
};

const INQUIRY_OPTIONS = [
  { 
    value: "contract",       
    label: "Contract Opportunity",  
    icon: "📋", 
    desc: "Federal contract bids & awards",
    color: BRAND.green
  },
  { 
    value: "consulting",     
    label: "Consulting Services",   
    icon: "💼", 
    desc: "Expert GovCon guidance",
    color: BRAND.orange
  },
  { 
    value: "partnership",    
    label: "Partnership Inquiry",   
    icon: "🤝", 
    desc: "Team up on opportunities",
    color: BRAND.navy
  },
  { 
    value: "subcontracting", 
    label: "Subcontracting",        
    icon: "🔗", 
    desc: "Sub / prime relationships",
    color: BRAND.green
  },
  { 
    value: "support",        
    label: "Technical Support",     
    icon: "🛠️", 
    desc: "Platform help & issues",
    color: BRAND.orange
  },
  { 
    value: "other",          
    label: "Other",                 
    icon: "💬", 
    desc: "General inquiries",
    color: BRAND.cyan
  },
];

const MAX_MB = 10;
const MAX_FILES = 5;
const ALLOWED = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png", "image/jpeg", "image/webp", "text/plain",
];

const formatFileSize = (bytes: number) => 
  bytes < 1048576 ? `${(bytes/1024).toFixed(0)} KB` : `${(bytes/1048576).toFixed(1)} MB`;

const getFileIcon = (type: string) => {
  if (type.includes("pdf")) return <FileText className="w-5 h-5" style={{ color: BRAND.orange }} />;
  if (type.includes("word") || type.includes("doc")) return <File className="w-5 h-5" style={{ color: BRAND.cyan }} />;
  if (type.includes("excel") || type.includes("sheet")) return <FileSpreadsheet className="w-5 h-5" style={{ color: BRAND.green }} />;
  if (type.startsWith("image")) return <ImageIcon className="w-5 h-5" style={{ color: '#a78bfa' }} />;
  return <Paperclip className="w-5 h-5" style={{ color: '#94a3b8' }} />;
};

const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const validatePhone = (phone: string): boolean => {
  if (!phone) return true;
  const re = /^[\d\s\-+()]{10,20}$/;
  return re.test(phone.replace(/\s/g, ''));
};

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [files, setFiles] = useState<AttachedFile[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inquiry, setInquiry] = useState("");
  const [submittedData, setSubmittedData] = useState({
    name: "",
    email: "",
    inquiry: ""
  });
  
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const reset = useCallback(() => {
    setStatus("idle");
    setFormErrors({});
    setTouchedFields(new Set());
    setLoading(false);
    setFiles([]);
    setFileError(null);
    setInquiry("");
    setDropdownOpen(false);
  }, []);

  const closeAll = useCallback(() => {
    reset();
    onClose();
  }, [reset, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) closeAll();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, closeAll]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) reset();
  }, [isOpen, reset]);

  const validateField = (name: string, value: string): string | undefined => {
    switch (name) {
      case 'firstName':
        return !value.trim() ? 'First name is required' : undefined;
      case 'lastName':
        return !value.trim() ? 'Last name is required' : undefined;
      case 'email':
        if (!value.trim()) return 'Email is required';
        if (!validateEmail(value.trim())) return 'Please enter a valid email address';
        return undefined;
      case 'phone':
        if (value && !validatePhone(value)) return 'Please enter a valid phone number';
        return undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouchedFields(prev => new Set(prev).add(name));
    const error = validateField(name, value);
    setFormErrors(prev => ({ ...prev, [name]: error }));
  };

  const validateForm = (formData: FormData): boolean => {
    const errors: FormErrors = {};
    
    const firstName = String(formData.get("firstName") || "").trim();
    const lastName = String(formData.get("lastName") || "").trim();
    const email = String(formData.get("email") || "").trim();

    if (!firstName) errors.firstName = "First name is required";
    if (!lastName) errors.lastName = "Last name is required";
    if (!email) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!inquiry) errors.inquiry = "Please select an inquiry type";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  function addFiles(list: FileList | File[]) {
    setFileError(null);
    const arr = Array.from(list);
    const toAdd: AttachedFile[] = [];
    
    for (const f of arr) {
      if (files.length + toAdd.length >= MAX_FILES) {
        setFileError(`Maximum ${MAX_FILES} files allowed`);
        break;
      }
      if (!ALLOWED.includes(f.type)) {
        setFileError(`"${f.name}" - File type not supported`);
        continue;
      }
      if (f.size > MAX_MB * 1048576) {
        setFileError(`"${f.name}" exceeds ${MAX_MB} MB limit`);
        continue;
      }
      toAdd.push({ file: f, id: `${Date.now()}-${Math.random()}` });
    }
    
    if (toAdd.length > 0) {
      setFiles(p => [...p, ...toAdd]);
    }
  }

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    if (!validateForm(formData)) {
      setStatus("error");
      return;
    }

    setLoading(true);
    setStatus("idle");

    const payload = {
      firstName: String(formData.get("firstName") || "").trim(),
      lastName: String(formData.get("lastName") || "").trim(),
      email: String(formData.get("email") || "").trim(),
      phone: String(formData.get("phone") || "").trim(),
      company: String(formData.get("company") || "").trim(),
      inquiryType: inquiry,
      message: String(formData.get("message") || "").trim(),
      attachments: await Promise.all(
        files.map(async ({ file }) => ({
          filename: file.name,
          content: await fileToBase64(file),
          contentType: file.type,
        }))
      ),
    };

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();

      if (res.ok && data?.success) {
        setSubmittedData({
          name: payload.firstName || "there",
          email: payload.email,
          inquiry: INQUIRY_OPTIONS.find(o => o.value === inquiry)?.label || inquiry,
        });
        setStatus("success");
        formRef.current?.reset();
        setFiles([]);
        setInquiry("");
      } else {
        setStatus("error");
        setFormErrors({ email: data?.error || "Unable to send. Please try again." });
      }
    } catch {
      setStatus("error");
      setFormErrors({ email: "Network error. Please check your connection." });
    } finally {
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  const selectedOption = INQUIRY_OPTIONS.find(o => o.value === inquiry);
  const errorCount = Object.keys(formErrors).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <style>{`
        @keyframes slideIn {
          from { opacity: 0; transform: scale(0.96) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          100% { background-position: 300% 50%; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .modal-card { animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .fade-in { animation: fadeIn 0.25s ease forwards; }
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(30, 58, 76, 0.3); border-radius: 20px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { 
          background: linear-gradient(to bottom, ${BRAND.green}, ${BRAND.orange});
          border-radius: 20px;
        }
        .input-focus-ring:focus {
          outline: none;
          border-color: ${BRAND.green} !important;
          box-shadow: 0 0 0 4px rgba(124, 179, 66, 0.15) !important;
        }
        .btn-hover {
          transition: all 0.2s ease;
        }
        .btn-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.3);
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="absolute inset-0 transition-all duration-300"
        style={{ 
          background: status === "success" 
            ? 'rgba(10, 26, 31, 0.98)' 
            : 'rgba(5, 16, 19, 0.98)',
          backdropFilter: 'blur(12px)',
        }}
        onClick={status === "success" ? undefined : closeAll}
      />

      {/* Modal Card */}
      <div
        className="modal-card relative z-10 w-full max-w-4xl flex flex-col rounded-2xl overflow-hidden"
        style={{
          maxHeight: "90vh",
          background: `
            radial-gradient(1200px 800px at 20% 0%, rgba(124, 179, 66, 0.12), transparent 60%),
            radial-gradient(1000px 700px at 90% 15%, rgba(255, 152, 0, 0.08), transparent 65%),
            radial-gradient(900px 750px at 50% 110%, rgba(30, 58, 76, 0.2), transparent 70%),
            linear-gradient(165deg, ${BRAND.darkBg} 0%, ${BRAND.cardBg} 45%, ${BRAND.darkerBg} 100%)
          `,
          border: `1px solid ${BRAND.green}30`,
          boxShadow: `0 50px 80px -20px rgba(0,0,0,0.8), 0 0 0 1px ${BRAND.green}20, 0 0 40px ${BRAND.green}20`,
        }}
      >
        {/* Animated gradient bar */}
        <div
          style={{
            height: "6px",
            flexShrink: 0,
            background: `linear-gradient(90deg, ${BRAND.green}, ${BRAND.orange}, ${BRAND.navy}, ${BRAND.green})`,
            backgroundSize: "300% 100%",
            animation: "gradientShift 8s linear infinite",
          }}
        />

        {/* Header */}
        <div
          className="flex-shrink-0 flex items-center justify-between px-8 py-5"
          style={{ 
            borderBottom: `1px solid ${BRAND.green}20`,
            background: `linear-gradient(to right, ${BRAND.navyDark}80, ${BRAND.darkBg}80)`,
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="flex items-center gap-4">
            <div 
              className="relative w-12 h-12 rounded-xl overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${BRAND.navy}, ${BRAND.navyDark})`,
                border: `1px solid ${BRAND.green}40`,
                boxShadow: `0 4px 12px ${BRAND.navy}80`
              }}
            >
              <Image 
                src="/precise-govcon-logo.jpg" 
                alt="Precise GovCon" 
                fill
                className="object-contain p-1.5"
              />
            </div>
            <div>
              <div className="font-black text-2xl leading-tight tracking-tight">
                <span className="text-white">PRECISE </span>
                <span style={{ color: BRAND.orange }}>GOVCON</span>
              </div>
              <p className="text-sm font-medium mt-0.5 flex items-center gap-1.5">
                <span style={{ color: BRAND.green }}>●</span>
                <span style={{ color: '#e2e8f0' }}>Federal Contract Intelligence</span>
                <span style={{ color: BRAND.green }}>●</span>
                <span style={{ color: BRAND.orange }}>2-3 day response</span>
              </p>
            </div>
          </div>
          <button
            onClick={closeAll}
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-all btn-hover"
            style={{ 
              color: '#94a3b8',
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${BRAND.green}30`,
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="custom-scrollbar flex-1 overflow-y-auto">
          {status === "success" ? (
            /* ----- SUCCESS STATE ----- */
            <div className="fade-in flex flex-col items-center text-center px-8 py-16 gap-6">
              <div
                className="w-28 h-28 rounded-2xl flex items-center justify-center"
                style={{
                  background: BRAND.successLight,
                  border: `2px solid ${BRAND.green}`,
                  boxShadow: `0 0 40px ${BRAND.green}40`,
                }}
              >
                <Check className="w-14 h-14" style={{ color: BRAND.green }} />
              </div>

              <div>
                <h3 className="text-4xl font-black text-white mb-2">
                  Got it, {submittedData.name}! 👋
                </h3>
                <p className="text-xl text-slate-300 max-w-md mx-auto">
                  Your <span style={{ color: BRAND.orange, fontWeight: 700 }}>{submittedData.inquiry}</span> inquiry
                </p>
                <p className="text-lg text-slate-400 mt-1">
                  has been received and queued for review
                </p>
              </div>

              <div
                className="w-full max-w-lg rounded-2xl p-6 text-left"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.navy}40, ${BRAND.navyDark}60)`,
                  border: `1px solid ${BRAND.green}40`,
                  backdropFilter: 'blur(8px)',
                }}
              >
                <h4 className="text-sm font-bold uppercase tracking-wider mb-4" style={{ color: BRAND.green }}>
                  📋 What happens next
                </h4>
                <div className="space-y-3">
                  {[
                    { step: '1', text: 'Our team reviews your inquiry', color: BRAND.green },
                    { step: '2', text: 'Specialist contacts you (2-3 days)', color: BRAND.orange },
                    { step: '3', text: 'Discuss goals & next steps', color: BRAND.cyan },
                  ].map(({ step, text, color }) => (
                    <div key={step} className="flex items-center gap-3">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{
                          background: `${color}20`,
                          border: `1px solid ${color}60`,
                          color: color,
                        }}
                      >
                        {step}
                      </div>
                      <span className="text-slate-300">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="flex items-center gap-3 px-6 py-4 rounded-xl"
                style={{
                  background: BRAND.successLight,
                  border: `1px solid ${BRAND.green}40`,
                }}
              >
                <Mail className="w-5 h-5" style={{ color: BRAND.green }} />
                <p className="text-slate-300">
                  Confirmation sent to <span style={{ color: BRAND.green, fontWeight: 700 }}>{submittedData.email}</span>
                </p>
              </div>

              <div
                className="flex items-center gap-3 px-5 py-4 rounded-xl"
                style={{ background: "rgba(6,182,212,.07)", border: "1px solid rgba(6,182,212,.2)" }}
              >
                <Image 
                  src="/precise-govcon-logo.jpg" 
                  alt="Precise GovCon" 
                  width={28} 
                  height={28} 
                  className="rounded-lg opacity-80" 
                />
                <p className="text-slate-400 text-sm font-medium">
                  Urgent? Email{" "}
                  <a href="mailto:support@precisegovcon.com" className="text-cyan-400 font-bold hover:underline">
                    support@precisegovcon.com
                  </a>
                </p>
              </div>

              <button
                onClick={closeAll}
                className="px-16 py-5 rounded-xl text-white text-lg font-black btn-hover"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.green}, ${BRAND.greenDark})`,
                  boxShadow: `0 8px 30px ${BRAND.green}60`,
                  border: `1px solid ${BRAND.greenLight}`,
                }}
              >
                Done
              </button>
            </div>
          ) : (
            /* ----- FORM ----- */
            <form ref={formRef} onSubmit={onSubmit}>
              
              {/* Error Summary Banner - Shows when validation fails */}
              {status === "error" && errorCount > 0 && (
                <div 
                  className="mx-8 mt-6 px-5 py-4 rounded-xl flex items-start gap-3 fade-in"
                  style={{
                    background: BRAND.errorLight,
                    border: `1px solid ${BRAND.error}60`,
                  }}
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: BRAND.error }} />
                  <div>
                    <p className="font-bold" style={{ color: '#fecaca' }}>Please fix the following errors:</p>
                    <ul className="text-sm mt-1 space-y-1" style={{ color: '#fecaca' }}>
                      {Object.entries(formErrors).map(([field, error]) => (
                        <li key={field} className="flex items-center gap-1.5">
                          <span>•</span> {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Section 1 — Contact Info */}
              <div className="px-8 pt-8 pb-6">
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-1.5 h-7 rounded-full" 
                    style={{ 
                      background: `linear-gradient(to bottom, ${BRAND.green}, ${BRAND.cyan})`,
                      boxShadow: `0 0 10px ${BRAND.green}60`
                    }} 
                  />
                  <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2" style={{ color: BRAND.green }}>
                    <User className="w-4 h-4" />
                    Your Information
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* First Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span style={{ color: BRAND.cyan }}>First Name</span>
                      <span style={{ color: BRAND.orange }}>*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                      <input
                        name="firstName"
                        placeholder="John"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-slate-600 transition-all input-focus-ring"
                        style={{
                          background: 'rgba(5, 16, 19, 0.8)',
                          borderTop: `2px solid ${formErrors.firstName ? BRAND.error : `${BRAND.green}30`}`,
                          borderRight: `2px solid ${formErrors.firstName ? BRAND.error : `${BRAND.green}30`}`,
                          borderBottom: `2px solid ${formErrors.firstName ? BRAND.error : `${BRAND.green}30`}`,
                          borderLeft: `4px solid ${formErrors.firstName ? BRAND.error : BRAND.cyan}`,
                        }}
                        onBlur={handleBlur}
                        onChange={() => setFormErrors(prev => ({ ...prev, firstName: undefined }))}
                      />
                    </div>
                    {formErrors.firstName && (
                      <p className="mt-2 text-sm font-medium flex items-center gap-1.5 fade-in" style={{ color: '#fecaca' }}>
                        <AlertCircle className="w-4 h-4" style={{ color: BRAND.error }} />
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>

                  {/* Last Name */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span style={{ color: BRAND.cyan }}>Last Name</span>
                      <span style={{ color: BRAND.orange }}>*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                      <input
                        name="lastName"
                        placeholder="Doe"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-slate-600 transition-all input-focus-ring"
                        style={{
                          background: 'rgba(5, 16, 19, 0.8)',
                          borderTop: `2px solid ${formErrors.lastName ? BRAND.error : `${BRAND.green}30`}`,
                          borderRight: `2px solid ${formErrors.lastName ? BRAND.error : `${BRAND.green}30`}`,
                          borderBottom: `2px solid ${formErrors.lastName ? BRAND.error : `${BRAND.green}30`}`,
                          borderLeft: `4px solid ${formErrors.lastName ? BRAND.error : BRAND.cyan}`,
                        }}
                        onBlur={handleBlur}
                        onChange={() => setFormErrors(prev => ({ ...prev, lastName: undefined }))}
                      />
                    </div>
                    {formErrors.lastName && (
                      <p className="mt-2 text-sm font-medium flex items-center gap-1.5 fade-in" style={{ color: '#fecaca' }}>
                        <AlertCircle className="w-4 h-4" style={{ color: BRAND.error }} />
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span style={{ color: BRAND.cyan }}>Business Email</span>
                      <span style={{ color: BRAND.orange }}>*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                      <input
                        name="email"
                        type="email"
                        placeholder="john.doe@company.com"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-slate-600 transition-all input-focus-ring"
                        style={{
                          background: 'rgba(5, 16, 19, 0.8)',
                          borderTop: `2px solid ${formErrors.email ? BRAND.error : `${BRAND.green}30`}`,
                          borderRight: `2px solid ${formErrors.email ? BRAND.error : `${BRAND.green}30`}`,
                          borderBottom: `2px solid ${formErrors.email ? BRAND.error : `${BRAND.green}30`}`,
                          borderLeft: `4px solid ${formErrors.email ? BRAND.error : BRAND.cyan}`,
                        }}
                        onBlur={handleBlur}
                        onChange={() => setFormErrors(prev => ({ ...prev, email: undefined }))}
                      />
                    </div>
                    {formErrors.email && (
                      <p className="mt-2 text-sm font-medium flex items-center gap-1.5 fade-in" style={{ color: '#fecaca' }}>
                        <AlertCircle className="w-4 h-4" style={{ color: BRAND.error }} />
                        {formErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span style={{ color: BRAND.cyan }}>Phone Number</span>
                      <span className="text-xs font-normal normal-case" style={{ color: '#94a3b8' }}>optional</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                      <input
                        name="phone"
                        type="tel"
                        placeholder="(555) 123-4567"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-slate-600 transition-all input-focus-ring"
                        style={{
                          background: 'rgba(5, 16, 19, 0.8)',
                          borderTop: `2px solid ${formErrors.phone ? BRAND.error : `${BRAND.green}30`}`,
                          borderRight: `2px solid ${formErrors.phone ? BRAND.error : `${BRAND.green}30`}`,
                          borderBottom: `2px solid ${formErrors.phone ? BRAND.error : `${BRAND.green}30`}`,
                          borderLeft: `4px solid ${formErrors.phone ? BRAND.error : BRAND.cyan}`,
                        }}
                        onBlur={handleBlur}
                      />
                    </div>
                    {formErrors.phone && (
                      <p className="mt-2 text-sm font-medium flex items-center gap-1.5 fade-in" style={{ color: '#fecaca' }}>
                        <AlertCircle className="w-4 h-4" style={{ color: BRAND.error }} />
                        {formErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <span style={{ color: BRAND.cyan }}>Company</span>
                      <span className="text-xs font-normal normal-case" style={{ color: '#94a3b8' }}>optional</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#94a3b8' }} />
                      <input
                        name="company"
                        placeholder="Acme Corp"
                        className="w-full pl-11 pr-4 py-3.5 rounded-xl text-white placeholder:text-slate-600 transition-all input-focus-ring"
                        style={{
                          background: 'rgba(5, 16, 19, 0.8)',
                          borderTop: `2px solid ${BRAND.green}30`,
                          borderRight: `2px solid ${BRAND.green}30`,
                          borderBottom: `2px solid ${BRAND.green}30`,
                          borderLeft: `4px solid ${BRAND.cyan}`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2 — Inquiry Type */}
              <div className="px-8 py-6" style={{ borderTop: `1px solid ${BRAND.green}20`, borderBottom: `1px solid ${BRAND.green}20` }}>
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-1.5 h-7 rounded-full" 
                    style={{ 
                      background: `linear-gradient(to bottom, ${BRAND.orange}, ${BRAND.orangeLight})`,
                      boxShadow: `0 0 10px ${BRAND.orange}60`
                    }} 
                  />
                  <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2" style={{ color: BRAND.orange }}>
                    <AlertCircle className="w-4 h-4" />
                    Inquiry Type <span style={{ color: BRAND.orange }}>*</span>
                  </span>
                </div>

                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full flex items-center justify-between px-6 py-4 rounded-xl text-left transition-all input-focus-ring"
                    style={{
                      background: 'rgba(5, 16, 19, 0.8)',
                      borderTop: `2px solid ${formErrors.inquiry ? BRAND.error : inquiry ? BRAND.orange : `${BRAND.green}30`}`,
                      borderRight: `2px solid ${formErrors.inquiry ? BRAND.error : inquiry ? BRAND.orange : `${BRAND.green}30`}`,
                      borderBottom: `2px solid ${formErrors.inquiry ? BRAND.error : inquiry ? BRAND.orange : `${BRAND.green}30`}`,
                      borderLeft: `4px solid ${formErrors.inquiry ? BRAND.error : inquiry ? BRAND.orange : BRAND.cyan}`,
                    }}
                  >
                    {inquiry && selectedOption ? (
                      <span className="flex items-center gap-3">
                        <span className="text-2xl">{selectedOption.icon}</span>
                        <div className="flex flex-col items-start">
                          <span className="text-white font-bold text-lg">{selectedOption.label}</span>
                          <span className="text-sm" style={{ color: '#94a3b8' }}>{selectedOption.desc}</span>
                        </div>
                      </span>
                    ) : (
                      <span style={{ color: '#94a3b8' }}>Select the nature of your inquiry…</span>
                    )}
                    <ChevronDown
                      className={`w-5 h-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                      style={{ color: BRAND.orange }}
                    />
                  </button>

                  {formErrors.inquiry && (
                    <p className="mt-2 text-sm font-medium flex items-center gap-1.5 fade-in" style={{ color: '#fecaca' }}>
                      <AlertCircle className="w-4 h-4" style={{ color: BRAND.error }} />
                      {formErrors.inquiry}
                    </p>
                  )}

                  {/* Dropdown */}
                  {dropdownOpen && (
                    <div
                      className="absolute left-0 right-0 top-full mt-2 z-50 rounded-xl overflow-hidden"
                      style={{
                        background: BRAND.darkerBg,
                        border: `2px solid ${BRAND.green}40`,
                        boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
                      }}
                    >
                      {INQUIRY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            setInquiry(opt.value);
                            setDropdownOpen(false);
                            setFormErrors(prev => ({ ...prev, inquiry: undefined }));
                          }}
                          className="w-full flex items-center gap-4 px-6 py-4 transition-all hover:bg-white/5"
                          style={{
                            borderBottom: `1px solid ${BRAND.green}20`,
                            background: inquiry === opt.value ? `${opt.color}20` : 'transparent',
                          }}
                        >
                          <span className="text-2xl w-8 text-center">{opt.icon}</span>
                          <div className="flex-1 text-left">
                            <div className="font-bold text-white">{opt.label}</div>
                            <div className="text-sm" style={{ color: '#94a3b8' }}>{opt.desc}</div>
                          </div>
                          {inquiry === opt.value && (
                            <Check className="w-5 h-5" style={{ color: opt.color }} />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3 — Message + Files */}
              <div className="px-8 pt-6 pb-8">
                <div className="flex items-center gap-3 mb-6">
                  <div 
                    className="w-1.5 h-7 rounded-full" 
                    style={{ 
                      background: `linear-gradient(to bottom, #818cf8, ${BRAND.cyan})`,
                      boxShadow: `0 0 10px ${BRAND.cyan}60`
                    }} 
                  />
                  <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2" style={{ color: BRAND.cyan }}>
                    <FileText className="w-4 h-4" />
                    Message & Attachments
                  </span>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span style={{ color: BRAND.cyan }}>Message</span>
                    <span className="text-xs font-normal normal-case" style={{ color: '#94a3b8' }}>— optional</span>
                  </label>
                  <textarea
                    name="message"
                    rows={4}
                    placeholder="Describe your project, contract opportunity, or question in detail. Include NAICS codes, set-asides, or specific agencies you're targeting..."
                    className="w-full px-5 py-4 rounded-xl text-white placeholder:text-slate-600 resize-none transition-all input-focus-ring"
                    style={{
                      background: 'rgba(5, 16, 19, 0.8)',
                      borderTop: `2px solid ${BRAND.green}30`,
                      borderRight: `2px solid ${BRAND.green}30`,
                      borderBottom: `2px solid ${BRAND.green}30`,
                      borderLeft: `4px solid ${BRAND.cyan}`,
                    }}
                  />
                </div>

                {/* File Upload */}
                <label className="block text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span style={{ color: BRAND.cyan }}>Attachments</span>
                  <span className="text-xs font-normal normal-case" style={{ color: '#94a3b8' }}>
                    — PDF, Word, Excel, Images · {MAX_MB}MB max · {MAX_FILES} files max
                  </span>
                </label>

                <div
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files); }}
                  onClick={() => fileRef.current?.click()}
                  className="relative rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center py-10 px-6 gap-4"
                  style={{
                    borderColor: dragOver ? BRAND.green : `${BRAND.green}40`,
                    background: dragOver ? `${BRAND.green}10` : `${BRAND.green}05`,
                  }}
                >
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all"
                    style={{
                      background: dragOver ? `${BRAND.green}20` : `${BRAND.green}10`,
                      border: `1px solid ${dragOver ? BRAND.green : `${BRAND.green}40`}`,
                    }}
                  >
                    <Upload className="w-8 h-8" style={{ color: dragOver ? BRAND.green : '#94a3b8' }} />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-lg">
                      <span style={{ color: BRAND.green }}>Click to browse</span> or drag & drop
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#94a3b8' }}>
                      PDF, Word, Excel, PNG, JPG, WEBP, TXT
                    </p>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.txt"
                    className="hidden"
                    onChange={(e) => e.target.files && addFiles(e.target.files)}
                  />
                </div>

                {/* File List */}
                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map(({ file, id }) => (
                      <div
                        key={id}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl"
                        style={{
                          background: `${BRAND.green}10`,
                          border: `1px solid ${BRAND.green}30`,
                        }}
                      >
                        {getFileIcon(file.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-white font-medium text-sm truncate">{file.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{formatFileSize(file.size)}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFiles(p => p.filter(f => f.id !== id))}
                          className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" style={{ color: '#94a3b8' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* File Error */}
                {fileError && (
                  <div
                    className="flex items-center gap-3 mt-4 px-5 py-4 rounded-xl fade-in"
                    style={{
                      background: BRAND.warningLight,
                      border: `1px solid ${BRAND.warning}60`,
                    }}
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" style={{ color: BRAND.warning }} />
                    <p className="text-sm font-medium" style={{ color: '#fed7aa' }}>{fileError}</p>
                  </div>
                )}
              </div>

              {/* Footer / Submit */}
              <div
                className="px-8 py-6 flex flex-col sm:flex-row items-center gap-4"
                style={{
                  background: `linear-gradient(to right, ${BRAND.navyDark}80, ${BRAND.darkBg}80)`,
                  backdropFilter: 'blur(12px)',
                  borderTop: `1px solid ${BRAND.green}30`,
                }}
              >
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-xl text-white font-black disabled:opacity-50 disabled:cursor-not-allowed btn-hover"
                  style={{
                    background: `linear-gradient(135deg, ${BRAND.green}, ${BRAND.greenDark})`,
                    boxShadow: `0 8px 20px ${BRAND.green}60`,
                    border: `1px solid ${BRAND.greenLight}`,
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Message
                      {files.length > 0 && (
                        <span
                          className="ml-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: 'rgba(255,255,255,0.2)' }}
                        >
                          {files.length}
                        </span>
                      )}
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={closeAll}
                  className="w-full sm:w-auto px-10 py-4 rounded-xl font-bold transition-all btn-hover"
                  style={{
                    color: '#94a3b8',
                    border: `2px solid ${BRAND.green}30`,
                    background: 'transparent',
                  }}
                >
                  Cancel
                </button>
                
                <p className="hidden sm:block text-xs leading-relaxed" style={{ color: '#64748b' }}>
                  By submitting, you agree<br />we may contact you.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}