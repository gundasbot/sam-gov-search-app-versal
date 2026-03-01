// app/ContactModal.tsx - BRIGHT VERSION
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { 
  X, Upload, Trash2, CheckCircle, AlertCircle, 
  Loader2, Send, ChevronDown, FileText, File, 
  FileSpreadsheet, Image as ImageIcon, Paperclip,
  Phone, Mail, Building, User, AlertTriangle, Check, Sparkles
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

// Precise GovCon brand colors - BRIGHTER PALETTE
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
  darkBg: '#0f2a36',      // Brightened
  darkerBg: '#0a1e28',    // Brightened
  cardBg: '#153542',      // Brightened
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
      case 'inquiry':
        return !inquiry ? 'Please select an inquiry type' : undefined;
      default:
        return undefined;
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouchedFields(prev => new Set(prev).add(name));
    
    const error = validateField(name, value);
    setFormErrors(prev => ({
      ...prev,
      [name]: error
    }));
  };

  const handleInquirySelect = (value: string) => {
    setInquiry(value);
    setDropdownOpen(false);
    setTouchedFields(prev => new Set(prev).add('inquiry'));
    setFormErrors(prev => ({
      ...prev,
      inquiry: undefined
    }));
  };

  const addFiles = (fileList: FileList) => {
    const arr = Array.from(fileList);
    const validFiles: AttachedFile[] = [];
    let err: string | null = null;

    for (const file of arr) {
      if (files.length + validFiles.length >= MAX_FILES) {
        err = `Maximum ${MAX_FILES} files allowed`;
        break;
      }
      if (!ALLOWED.includes(file.type)) {
        err = `${file.name}: unsupported file type`;
        break;
      }
      if (file.size > MAX_MB * 1048576) {
        err = `${file.name}: exceeds ${MAX_MB}MB limit`;
        break;
      }
      validFiles.push({ file, id: `${Date.now()}-${Math.random()}` });
    }

    if (err) {
      setFileError(err);
      setTimeout(() => setFileError(null), 5000);
    } else {
      setFiles(prev => [...prev, ...validFiles]);
      setFileError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const form = e.currentTarget;
    const fd = new FormData(form);

    // Validate all fields
    const firstName = fd.get('firstName') as string;
    const lastName = fd.get('lastName') as string;
    const email = fd.get('email') as string;
    const phone = fd.get('phone') as string;

    const errors: FormErrors = {};
    errors.firstName = validateField('firstName', firstName);
    errors.lastName = validateField('lastName', lastName);
    errors.email = validateField('email', email);
    errors.phone = validateField('phone', phone);
    errors.inquiry = validateField('inquiry', inquiry);

    // Mark all fields as touched
    setTouchedFields(new Set(['firstName', 'lastName', 'email', 'phone', 'inquiry', 'company']));

    // Check if there are any errors
    const hasErrors = Object.values(errors).some(e => e !== undefined);
    if (hasErrors) {
      setFormErrors(errors);
      setLoading(false);
      return;
    }

    try {
      const attachments = await Promise.all(
        files.map(async ({ file }) => ({
          filename: file.name,
          content: btoa(
            Array.from(new Uint8Array(await file.arrayBuffer()))
              .map(b => String.fromCharCode(b))
              .join('')
          ),
        }))
      );

      const payload = {
        firstName: fd.get('firstName'),
        lastName: fd.get('lastName'),
        email: fd.get('email'),
        phone: fd.get('phone') || '',
        company: fd.get('company') || '',
        message: fd.get('message') || '',
        inquiryType: inquiry,
        attachments,
      };

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSubmittedData({
        name: `${firstName} ${lastName}`,
        email: email,
        inquiry: INQUIRY_OPTIONS.find(opt => opt.value === inquiry)?.label || inquiry
      });
      
      setStatus('success');
      form.reset();
      setFiles([]);
      setInquiry('');
      setFormErrors({});
      setTouchedFields(new Set());
    } catch (error: any) {
      console.error('Submit error:', error);
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ 
        background: 'rgba(10, 26, 31, 0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAll();
      }}
    >
      {/* Animated gradient background - BRIGHTER */}
      <div 
        className="absolute inset-0 opacity-60"
        style={{
          background: `
            radial-gradient(circle at 15% 30%, ${BRAND.green}40 0%, transparent 40%),
            radial-gradient(circle at 85% 30%, ${BRAND.orange}35 0%, transparent 40%),
            radial-gradient(circle at 50% 70%, ${BRAND.cyan}25 0%, transparent 40%),
            linear-gradient(135deg, ${BRAND.navy}20, transparent)
          `,
          animation: 'pulse 8s ease-in-out infinite',
        }}
      />

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.7; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        .slide-down {
          animation: slideDown 0.3s ease-out;
        }
        .input-focus-ring:focus {
          outline: none;
          box-shadow: 0 0 0 3px ${BRAND.green}50;
        }
        .btn-hover {
          transition: all 0.2s ease;
        }
        .btn-hover:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(124, 179, 66, 0.5) !important;
        }
        .btn-hover:active:not(:disabled) {
          transform: translateY(0);
        }
      `}</style>

      <div 
        className="relative w-full max-w-5xl h-[88vh] flex flex-col rounded-3xl fade-in overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${BRAND.darkBg}f5 0%, ${BRAND.cardBg}f5 100%)`,
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${BRAND.green}40`,
          boxShadow: `0 25px 50px -12px rgba(0,0,0,0.8), 0 0 0 1px ${BRAND.green}30, 0 0 80px rgba(124, 179, 66, 0.15)`,
        }}
      >
        {/* Close button */}
        <button
          onClick={closeAll}
          className="absolute top-6 right-6 z-10 w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:rotate-90"
          style={{
            background: `${BRAND.error}25`,
            border: `1px solid ${BRAND.error}50`,
            color: '#fca5a5',
          }}
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Success State */}
        {status === "success" && (
          <div className="p-8 slide-down">
            <div 
              className="rounded-2xl p-10 text-center"
              style={{
                background: `linear-gradient(135deg, ${BRAND.green}15 0%, ${BRAND.cyan}15 100%)`,
                border: `2px solid ${BRAND.green}40`,
              }}
            >
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: `${BRAND.green}25`,
                  border: `2px solid ${BRAND.green}`,
                  boxShadow: `0 0 30px ${BRAND.green}70`,
                }}
              >
                <CheckCircle className="w-10 h-10" style={{ color: BRAND.green }} />
              </div>
              
              <h2 className="text-3xl font-black mb-4" style={{ color: BRAND.greenLight }}>
                Message Sent Successfully!
              </h2>
              
              <p className="text-lg mb-6" style={{ color: '#e2e8f0' }}>
                Thanks, <strong>{submittedData.name}</strong>! We've received your <strong>{submittedData.inquiry}</strong> inquiry.
              </p>
              
              <div 
                className="rounded-xl p-6 mb-6"
                style={{
                  background: `${BRAND.navy}50`,
                  border: `1px solid ${BRAND.cyan}40`,
                }}
              >
                <div className="flex items-center justify-center gap-2 mb-3">
                  <Sparkles className="w-5 h-5" style={{ color: BRAND.orange }} />
                  <p className="font-bold" style={{ color: BRAND.orangeLight }}>What's Next?</p>
                </div>
                <div className="space-y-3 text-left text-sm" style={{ color: '#cbd5e1' }}>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">✅</span>
                    <p>Our team is reviewing your inquiry and matching you with the right specialist</p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">📞</span>
                    <p>A specialist will contact you within <strong style={{ color: BRAND.orangeLight }}>2-3 business days</strong></p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-lg">🚀</span>
                    <p>We'll discuss your goals and map out the best path forward together</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm mb-6" style={{ color: '#94a3b8' }}>
                Confirmation email sent to: <strong style={{ color: BRAND.cyan }}>{submittedData.email}</strong>
              </p>
              
              <button
                onClick={closeAll}
                className="px-8 py-4 rounded-xl font-bold btn-hover"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.green}, ${BRAND.greenDark})`,
                  color: '#fff',
                  border: `1px solid ${BRAND.greenLight}`,
                  boxShadow: `0 8px 20px ${BRAND.green}70`,
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="p-8 slide-down">
            <div 
              className="rounded-2xl p-10 text-center"
              style={{
                background: `${BRAND.error}15`,
                border: `2px solid ${BRAND.error}50`,
              }}
            >
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
                style={{
                  background: `${BRAND.error}25`,
                  border: `2px solid ${BRAND.error}`,
                }}
              >
                <AlertCircle className="w-10 h-10" style={{ color: BRAND.error }} />
              </div>
              
              <h2 className="text-2xl font-black mb-4" style={{ color: BRAND.error }}>
                Oops! Something Went Wrong
              </h2>
              
              <p className="mb-6" style={{ color: '#e2e8f0' }}>
                We couldn't send your message. Please try again or contact us directly.
              </p>
              
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => setStatus('idle')}
                  className="px-6 py-3 rounded-xl font-bold btn-hover"
                  style={{
                    background: `${BRAND.orange}`,
                    color: '#fff',
                    border: `1px solid ${BRAND.orangeLight}`,
                  }}
                >
                  Try Again
                </button>
                <button
                  onClick={closeAll}
                  className="px-6 py-3 rounded-xl font-bold"
                  style={{
                    background: 'transparent',
                    color: '#94a3b8',
                    border: `2px solid ${BRAND.error}40`,
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Form State */}
        {status === "idle" && (
          <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col h-full">
            {/* Header - Fixed */}
            <div 
              className="flex-shrink-0 px-8 pt-8 pb-6"
              style={{
                borderBottom: `1px solid ${BRAND.green}40`,
              }}
            >
              <div className="flex items-center gap-4 mb-3">
                {/* Logo */}
                <div className="relative w-14 h-14 flex-shrink-0">
                  <img 
                    src="/logo.png" 
                    alt="Precise GovCon"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h2 className="text-3xl font-black" style={{ color: '#fff' }}>
                    We are here for you.
                  </h2>
                  <p className="text-sm" style={{ color: '#94a3b8' }}>
                    Tell us about your GovCon needs
                  </p>
                </div>
              </div>
            </div>

            {/* Scrollable Form Content */}
            <div className="flex-1 overflow-y-auto">

            {/* Section 1 — Contact Info */}
            <div className="px-8 pt-6 pb-6">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-1.5 h-7 rounded-full" 
                  style={{ 
                    background: `linear-gradient(to bottom, ${BRAND.green}, ${BRAND.cyan})`,
                    boxShadow: `0 0 15px ${BRAND.green}80, 0 0 30px ${BRAND.green}40`
                  }} 
                />
                <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2" style={{ color: BRAND.greenLight }}>
                  <User className="w-4 h-4" />
                  Your Information
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* First Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span style={{ color: BRAND.greenLight }}>First Name</span>
                    <span style={{ color: BRAND.error }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    onBlur={handleBlur}
                    placeholder="John"
                    required
                    className="w-full px-5 py-4 rounded-xl text-white placeholder:text-slate-500 transition-all input-focus-ring"
                    style={{
                      background: 'rgba(15, 42, 54, 0.6)',
                      borderTop: touchedFields.has('firstName') && formErrors.firstName 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderRight: touchedFields.has('firstName') && formErrors.firstName 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderBottom: touchedFields.has('firstName') && formErrors.firstName 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderLeft: touchedFields.has('firstName') && formErrors.firstName 
                        ? `4px solid ${BRAND.error}` 
                        : `4px solid ${BRAND.green}`,
                    }}
                  />
                  {touchedFields.has('firstName') && formErrors.firstName && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: BRAND.error }}>
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.firstName}
                    </p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span style={{ color: BRAND.greenLight }}>Last Name</span>
                    <span style={{ color: BRAND.error }}>*</span>
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    onBlur={handleBlur}
                    placeholder="Doe"
                    required
                    className="w-full px-5 py-4 rounded-xl text-white placeholder:text-slate-500 transition-all input-focus-ring"
                    style={{
                      background: 'rgba(15, 42, 54, 0.6)',
                      borderTop: touchedFields.has('lastName') && formErrors.lastName 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderRight: touchedFields.has('lastName') && formErrors.lastName 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderBottom: touchedFields.has('lastName') && formErrors.lastName 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderLeft: touchedFields.has('lastName') && formErrors.lastName 
                        ? `4px solid ${BRAND.error}` 
                        : `4px solid ${BRAND.green}`,
                    }}
                  />
                  {touchedFields.has('lastName') && formErrors.lastName && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: BRAND.error }}>
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.lastName}
                    </p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span style={{ color: BRAND.greenLight }}>Email</span>
                    <span style={{ color: BRAND.error }}>*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    onBlur={handleBlur}
                    placeholder="john.doe@company.com"
                    required
                    className="w-full px-5 py-4 rounded-xl text-white placeholder:text-slate-500 transition-all input-focus-ring"
                    style={{
                      background: 'rgba(15, 42, 54, 0.6)',
                      borderTop: touchedFields.has('email') && formErrors.email 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderRight: touchedFields.has('email') && formErrors.email 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderBottom: touchedFields.has('email') && formErrors.email 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderLeft: touchedFields.has('email') && formErrors.email 
                        ? `4px solid ${BRAND.error}` 
                        : `4px solid ${BRAND.green}`,
                    }}
                  />
                  {touchedFields.has('email') && formErrors.email && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: BRAND.error }}>
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.email}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span style={{ color: BRAND.greenLight }}>Phone</span>
                    <span className="text-xs font-normal normal-case" style={{ color: '#94a3b8' }}>— optional</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    onBlur={handleBlur}
                    placeholder="(555) 123-4567"
                    className="w-full px-5 py-4 rounded-xl text-white placeholder:text-slate-500 transition-all input-focus-ring"
                    style={{
                      background: 'rgba(15, 42, 54, 0.6)',
                      borderTop: touchedFields.has('phone') && formErrors.phone 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderRight: touchedFields.has('phone') && formErrors.phone 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderBottom: touchedFields.has('phone') && formErrors.phone 
                        ? `2px solid ${BRAND.error}` 
                        : `2px solid ${BRAND.green}40`,
                      borderLeft: touchedFields.has('phone') && formErrors.phone 
                        ? `4px solid ${BRAND.error}` 
                        : `4px solid ${BRAND.green}`,
                    }}
                  />
                  {touchedFields.has('phone') && formErrors.phone && (
                    <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: BRAND.error }}>
                      <AlertTriangle className="w-3 h-3" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>

                {/* Company */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <span style={{ color: BRAND.greenLight }}>Company / Organization</span>
                    <span className="text-xs font-normal normal-case" style={{ color: '#94a3b8' }}>— optional</span>
                  </label>
                  <input
                    type="text"
                    name="company"
                    placeholder="Acme Corp"
                    className="w-full px-5 py-4 rounded-xl text-white placeholder:text-slate-500 transition-all input-focus-ring"
                    style={{
                      background: 'rgba(15, 42, 54, 0.6)',
                      borderTop: `2px solid ${BRAND.green}40`,
                      borderRight: `2px solid ${BRAND.green}40`,
                      borderBottom: `2px solid ${BRAND.green}40`,
                      borderLeft: `4px solid ${BRAND.green}`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2 — Inquiry Type */}
            <div className="px-8 pt-6 pb-6">
              <div className="flex items-center gap-3 mb-6">
                <div 
                  className="w-1.5 h-7 rounded-full" 
                  style={{ 
                    background: `linear-gradient(to bottom, ${BRAND.orange}, ${BRAND.green})`,
                    boxShadow: `0 0 15px ${BRAND.orange}80, 0 0 30px ${BRAND.orange}40`
                  }} 
                />
                <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2" style={{ color: BRAND.orangeLight }}>
                  <Building className="w-4 h-4" />
                  Inquiry Type
                </span>
              </div>

              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span style={{ color: BRAND.orangeLight }}>How can we help?</span>
                  <span style={{ color: BRAND.error }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full px-5 py-4 rounded-xl text-left flex items-center justify-between transition-all input-focus-ring"
                  style={{
                    background: 'rgba(15, 42, 54, 0.6)',
                    borderTop: touchedFields.has('inquiry') && formErrors.inquiry 
                      ? `2px solid ${BRAND.error}` 
                      : `2px solid ${BRAND.orange}40`,
                    borderRight: touchedFields.has('inquiry') && formErrors.inquiry 
                      ? `2px solid ${BRAND.error}` 
                      : `2px solid ${BRAND.orange}40`,
                    borderBottom: touchedFields.has('inquiry') && formErrors.inquiry 
                      ? `2px solid ${BRAND.error}` 
                      : `2px solid ${BRAND.orange}40`,
                    borderLeft: touchedFields.has('inquiry') && formErrors.inquiry 
                      ? `4px solid ${BRAND.error}` 
                      : `4px solid ${BRAND.orange}`,
                  }}
                >
                  <span style={{ color: inquiry ? '#fff' : '#64748b' }}>
                    {inquiry 
                      ? INQUIRY_OPTIONS.find(opt => opt.value === inquiry)?.label 
                      : 'Select inquiry type...'}
                  </span>
                  <ChevronDown 
                    className="w-5 h-5 transition-transform"
                    style={{ 
                      color: BRAND.orangeLight,
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }} 
                  />
                </button>
                {touchedFields.has('inquiry') && formErrors.inquiry && (
                  <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: BRAND.error }}>
                    <AlertTriangle className="w-3 h-3" />
                    {formErrors.inquiry}
                  </p>
                )}

                {dropdownOpen && (
                  <div 
                    className="absolute z-10 w-full mt-2 rounded-xl overflow-hidden slide-down"
                    style={{
                      background: BRAND.cardBg,
                      border: `1px solid ${BRAND.orange}50`,
                      boxShadow: `0 20px 40px rgba(0,0,0,0.5)`,
                    }}
                  >
                    {INQUIRY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleInquirySelect(opt.value)}
                        className="w-full px-5 py-4 flex items-center gap-4 transition-all hover:bg-opacity-80"
                        style={{
                          background: inquiry === opt.value ? `${opt.color}25` : 'transparent',
                          borderBottom: `1px solid ${BRAND.orange}30`,
                        }}
                      >
                        <span className="text-2xl">{opt.icon}</span>
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
                    boxShadow: `0 0 15px ${BRAND.cyan}80, 0 0 30px ${BRAND.cyan}40`
                  }} 
                />
                <span className="text-xs font-black tracking-wider uppercase flex items-center gap-2" style={{ color: '#a5d6e8' }}>
                  <FileText className="w-4 h-4" />
                  Message & Attachments
                </span>
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span style={{ color: '#a5d6e8' }}>Message</span>
                  <span className="text-xs font-normal normal-case" style={{ color: '#94a3b8' }}>— optional</span>
                </label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder="Describe your project, contract opportunity, or question in detail. Include NAICS codes, set-asides, or specific agencies you're targeting..."
                  className="w-full px-5 py-4 rounded-xl text-white placeholder:text-slate-500 resize-none transition-all input-focus-ring"
                  style={{
                    background: 'rgba(15, 42, 54, 0.6)',
                    borderTop: `2px solid ${BRAND.green}40`,
                    borderRight: `2px solid ${BRAND.green}40`,
                    borderBottom: `2px solid ${BRAND.green}40`,
                    borderLeft: `4px solid ${BRAND.cyan}`,
                  }}
                />
              </div>

              {/* File Upload */}
              <label className="block text-xs font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span style={{ color: '#a5d6e8' }}>Attachments</span>
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
                  borderColor: dragOver ? BRAND.green : `${BRAND.green}50`,
                  background: dragOver ? `${BRAND.green}15` : `${BRAND.green}08`,
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all"
                  style={{
                    background: dragOver ? `${BRAND.green}30` : `${BRAND.green}15`,
                    border: `1px solid ${dragOver ? BRAND.green : `${BRAND.green}50`}`,
                  }}
                >
                  <Upload className="w-8 h-8" style={{ color: dragOver ? BRAND.greenLight : '#94a3b8' }} />
                </div>
                <div className="text-center">
                  <p className="text-white font-semibold text-lg">
                    <span style={{ color: BRAND.greenLight }}>Click to browse</span> or drag & drop
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
                        background: `${BRAND.green}15`,
                        border: `1px solid ${BRAND.green}40`,
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
            </div>

            {/* Footer / Submit - Fixed at bottom */}
            <div
              className="flex-shrink-0 px-8 py-6 flex flex-col sm:flex-row items-center gap-4"
              style={{
                background: `linear-gradient(to right, ${BRAND.navyDark}90, ${BRAND.darkBg}90)`,
                backdropFilter: 'blur(12px)',
                borderTop: `1px solid ${BRAND.green}40`,
              }}
            >
              <button
                type="submit"
                disabled={loading}
                className="flex-1 w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-4 rounded-xl text-white font-black disabled:opacity-50 disabled:cursor-not-allowed btn-hover"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.green}, ${BRAND.greenDark})`,
                  boxShadow: `0 8px 20px ${BRAND.green}70`,
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
                  border: `2px solid ${BRAND.green}40`,
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
  );
}