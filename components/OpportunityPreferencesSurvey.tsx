// components/OpportunityPreferencesSurvey.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Settings, Target, Building2, Award, DollarSign, MapPin, Calendar, CheckCircle, Filter, Code, Shield, Search, Loader2 } from 'lucide-react';

// ─── Live code search — /api/codes/taxonomy ─────────────────────────────────
// Both NAICS and PSC are mined from real SAM.gov opportunity data.
// Single fetch, 24-hour server-side cache, graceful fallback.
// Route: app/api/codes/taxonomy/route.ts

interface CodeItem { code: string; description: string; count?: number }

// Small offline fallback (used only if the taxonomy route is unreachable)
const NAICS_SEED: CodeItem[] = [
  { code: '518210', description: 'Data Processing, Hosting, and Related Services' },
  { code: '541511', description: 'Custom Computer Programming Services' },
  { code: '541512', description: 'Computer Systems Design Services' },
  { code: '541519', description: 'Other Computer Related Services' },
  { code: '541611', description: 'Administrative Management Consulting Services' },
  { code: '541715', description: 'R&D in Physical, Engineering, and Life Sciences' },
];

const PSC_SEED: CodeItem[] = [
  { code: 'D302', description: 'IT and Telecom — Systems Development' },
  { code: 'D307', description: 'IT and Telecom — Cyber Security and Data Backup' },
  { code: 'D310', description: 'IT and Telecom — Data Management' },
  { code: 'D399', description: 'IT and Telecom — Other ADP Services' },
  { code: 'R425', description: 'Professional Support — Engineering/Technical' },
  { code: 'R499', description: 'Professional Support — Other' },
];

// Set-aside options with descriptions
const SET_ASIDE_OPTIONS = [
  { code: "NONE", label: "No Set-Aside", description: "Open competition" },
  { code: "SBA", label: "Small Business", description: "Small business set-aside" },
  { code: "8A", label: "8(a)", description: "8(a) Business Development Program" },
  { code: "WOSB", label: "WOSB", description: "Women-Owned Small Business" },
  { code: "EDWOSB", label: "EDWOSB", description: "Economically Disadvantaged WOSB" },
  { code: "HUBZONE", label: "HUBZone", description: "Historically Underutilized Business Zone" },
  { code: "SDVOSB", label: "SDVOSB", description: "Service-Disabled Veteran-Owned Small Business" },
  { code: "VOSB", label: "VOSB", description: "Veteran-Owned Small Business" },
];

// Contract type options
const CONTRACT_TYPE_OPTIONS = [
  { value: "ALL", label: "All Types", description: "Include all contract types" },
  { value: "BPA", label: "BPA", description: "Blanket Purchase Agreement" },
  { value: "IDIQ", label: "IDIQ", description: "Indefinite Delivery/Indefinite Quantity" },
  { value: "FFP", label: "Fixed Price", description: "Firm-Fixed-Price contracts" },
  { value: "T&M", label: "Time & Materials", description: "Time and Materials contracts" },
  { value: "COST", label: "Cost Reimbursement", description: "Cost-based contracts" },
];

// Opportunity status options
const OPPORTUNITY_STATUS_OPTIONS = [
  { value: "active", label: "Active Only", description: "Currently open opportunities" },
  { value: "all", label: "All Status", description: "Include archived and inactive" },
];

// Timeline options
const TIMELINE_OPTIONS = [
  { value: "ALL", label: "Any Timeline", description: "No deadline restrictions" },
  { value: "URGENT", label: "Urgent", description: "Due within 7 days" },
  { value: "SHORT", label: "Short Term", description: "Due within 30 days" },
  { value: "MEDIUM", label: "Medium Term", description: "Due within 90 days" },
  { value: "LONG", label: "Long Term", description: "Due after 90+ days" },
];

// Enhanced agency options with categories
const AGENCY_CATEGORIES = {
  "Defense & Security": [
    { name: "Department of Defense", abbreviation: "DOD" },
    { name: "Department of Homeland Security", abbreviation: "DHS" },
    { name: "Department of Veterans Affairs", abbreviation: "VA" },
  ],
  "Civilian Agencies": [
    { name: "General Services Administration", abbreviation: "GSA" },
    { name: "Department of Health and Human Services", abbreviation: "HHS" },
    { name: "Department of Education", abbreviation: "ED" },
    { name: "Department of Energy", abbreviation: "DOE" },
    { name: "Department of Transportation", abbreviation: "DOT" },
    { name: "Environmental Protection Agency", abbreviation: "EPA" },
    { name: "National Aeronautics and Space Administration", abbreviation: "NASA" },
  ],
};

// US States
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY", "DC"
];

interface OpportunityPreferencesSurveyProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (preferences: OpportunityPreferences) => void;
}

interface OpportunityPreferences {
  keywords: string[];
  naicsCodes: string[];
  pscCodes: string[];
  setAsideTypes: string[];
  contractTypes: string[];
  agencies: string[];
  valueMin: number;
  valueMax: number;
  states: string[];
  responseDeadlineMin: number;
  opportunityStatus: string;
  timeline: string;
  excludeKeywords: string[];
}

export default function OpportunityPreferencesSurvey({
  isOpen,
  onClose,
  onComplete,
}: OpportunityPreferencesSurveyProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 9;

  // ✅ NEW: Error states

  const [preferences, setPreferences] = useState<OpportunityPreferences>({
    keywords: [],
    naicsCodes: [],
    pscCodes: [],
    setAsideTypes: [],
    contractTypes: ["ALL"],
    agencies: [],
    valueMin: 0,
    valueMax: 10000000,
    states: ["ALL"],
    responseDeadlineMin: 0,
    opportunityStatus: "active",
    timeline: "ALL",
    excludeKeywords: [],
  });

  const [keywordInput, setKeywordInput] = useState("");
  const [excludeKeywordInput, setExcludeKeywordInput] = useState("");
  const [naicsSearch, setNaicsSearch] = useState("");
  const [pscSearch, setPscSearch] = useState("");
  const [showNaicsSuggestions, setShowNaicsSuggestions] = useState(false);
  const [showPscSuggestions, setShowPscSuggestions] = useState(false);
  const [filteredNaicsSuggestions, setFilteredNaicsSuggestions] = useState<CodeItem[]>([]);
  const [filteredPscSuggestions, setFilteredPscSuggestions] = useState<CodeItem[]>([]);
  const [naicsLoading, setNaicsLoading] = useState(false);
  const [pscLoading, setPscLoading] = useState(false);
  const [naicsDataSource, setNaicsDataSource] = useState<string>('');
  const [pscDataSource, setPscDataSource] = useState<string>('');
  // Store code->description maps for displaying selected items
  const [naicsDescMap, setNaicsDescMap] = useState<Record<string, string>>({});
  const [pscDescMap, setPscDescMap] = useState<Record<string, string>>({});

  // Error state for duplicate NAICS and PSC codes
  const [naicsDuplicateError, setNaicsDuplicateError] = useState(false);
  const [pscDuplicateError, setPscDuplicateError] = useState(false);
  const [agencyMode, setAgencyMode] = useState<'all' | 'specific'>('all');
  const [stateMode, setStateMode] = useState<'all' | 'specific'>('all');

  const naicsInputRef = useRef<HTMLInputElement>(null);
  const pscInputRef = useRef<HTMLInputElement>(null);

  // NAICS live search — debounced, calls /api/codes/taxonomy?type=naics
  useEffect(() => {
    const q = naicsSearch.trim();
    if (!q) { setFilteredNaicsSuggestions([]); setShowNaicsSuggestions(false); return; }
    const timer = setTimeout(async () => {
      setNaicsLoading(true);
      try {
        const res = await fetch(`/api/codes/taxonomy?type=naics&q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        const results: CodeItem[] = (data.results || []).filter((c: CodeItem) => !preferences.naicsCodes.includes(c.code));
        setFilteredNaicsSuggestions(results);
        setShowNaicsSuggestions(results.length > 0);
        setNaicsDataSource(data.source || '');
      } catch {
        const ql = q.toLowerCase();
        const results = NAICS_SEED.filter(c => (c.code.includes(ql) || c.description.toLowerCase().includes(ql)) && !preferences.naicsCodes.includes(c.code));
        setFilteredNaicsSuggestions(results);
        setShowNaicsSuggestions(results.length > 0);
        setNaicsDataSource('fallback');
      } finally { setNaicsLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [naicsSearch, preferences.naicsCodes]);

  // PSC live search — debounced, calls /api/codes/taxonomy?type=psc
  useEffect(() => {
    const q = pscSearch.trim();
    if (!q) { setFilteredPscSuggestions([]); setShowPscSuggestions(false); return; }
    const timer = setTimeout(async () => {
      setPscLoading(true);
      try {
        const res = await fetch(`/api/codes/taxonomy?type=psc&q=${encodeURIComponent(q)}`);
        if (!res.ok) throw new Error('fetch failed');
        const data = await res.json();
        const results: CodeItem[] = (data.results || []).filter((c: CodeItem) => !preferences.pscCodes.includes(c.code));
        setFilteredPscSuggestions(results);
        setShowPscSuggestions(results.length > 0);
        setPscDataSource(data.source || '');
      } catch {
        const ql = q.toLowerCase();
        const results = PSC_SEED.filter(c => (c.code.toLowerCase().includes(ql) || c.description.toLowerCase().includes(ql)) && !preferences.pscCodes.includes(c.code));
        setFilteredPscSuggestions(results);
        setShowPscSuggestions(results.length > 0);
        setPscDataSource('fallback');
      } finally { setPscLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [pscSearch, preferences.pscCodes]);

  // ✅ FIXED: Add handlers with duplicate detection
  const handleAddNaicsCode = (code: string) => {
    if (preferences.naicsCodes.includes(code)) {
      setNaicsDuplicateError(true);
      setTimeout(() => setNaicsDuplicateError(false), 3000);
      return;
    }
    setPreferences(prev => ({
      ...prev,
      naicsCodes: [...prev.naicsCodes, code],
    }));
    setNaicsSearch("");
    setShowNaicsSuggestions(false);
    naicsInputRef.current?.focus();
  };

  const handleAddPscCode = (code: string, description?: string) => {
    if (preferences.pscCodes.includes(code)) {
      setPscDuplicateError(true);
      setTimeout(() => setPscDuplicateError(false), 3000);
      return;
    }
    if (description) {
      setPscDescMap(prev => ({ ...prev, [code]: description }));
    }
    setPreferences(prev => ({
      ...prev,
      pscCodes: [...prev.pscCodes, code],
    }));
    setPscSearch("");
    setShowPscSuggestions(false);
    pscInputRef.current?.focus();
  };

  const handleRemoveNaicsCode = (code: string) => {
    setPreferences(prev => ({
      ...prev,
      naicsCodes: prev.naicsCodes.filter(c => c !== code),
    }));
  };

  const handleRemovePscCode = (code: string) => {
    setPreferences(prev => ({
      ...prev,
      pscCodes: prev.pscCodes.filter(c => c !== code),
    }));
  };

  const handleAddKeyword = () => {
    if (keywordInput.trim() && !preferences.keywords.includes(keywordInput.trim())) {
      setPreferences(prev => ({
        ...prev,
        keywords: [...prev.keywords, keywordInput.trim()],
      }));
      setKeywordInput("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    setPreferences(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword),
    }));
  };

  const handleAddExcludeKeyword = () => {
    if (excludeKeywordInput.trim()) {
      setPreferences(prev => ({
        ...prev,
        excludeKeywords: [...prev.excludeKeywords, excludeKeywordInput.trim()],
      }));
      setExcludeKeywordInput("");
    }
  };

  const handleRemoveExcludeKeyword = (keyword: string) => {
    setPreferences(prev => ({
      ...prev,
      excludeKeywords: prev.excludeKeywords.filter(k => k !== keyword),
    }));
  };

  const handleComplete = () => {
    const prefsToSave = {
      ...preferences,
      agencies: agencyMode === 'all' ? ['ALL'] : preferences.agencies,
      states: stateMode === 'all' ? ['ALL'] : preferences.states,
    };

    localStorage.setItem('opportunity-preferences', JSON.stringify(prefsToSave));
    window.dispatchEvent(new CustomEvent('preferences-updated', { detail: prefsToSave }));
    onComplete(prefsToSave);
  };

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const toggleSetAside = (code: string) => {
    setPreferences(prev => ({
      ...prev,
      setAsideTypes: prev.setAsideTypes.includes(code)
        ? prev.setAsideTypes.filter(c => c !== code)
        : [...prev.setAsideTypes, code],
    }));
  };

  const toggleAgency = (name: string) => {
    setPreferences(prev => ({
      ...prev,
      agencies: prev.agencies.includes(name)
        ? prev.agencies.filter(a => a !== name)
        : [...prev.agencies, name],
    }));
  };

  const toggleState = (state: string) => {
    setPreferences(prev => ({
      ...prev,
      states: prev.states.includes(state)
        ? prev.states.filter(s => s !== state)
        : [...prev.states, state],
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:"rgba(0,0,0,0.75)",backdropFilter:"blur(6px)"}}>
      <div className="w-full max-w-6xl flex flex-col rounded-2xl shadow-2xl" style={{background:"#ffffff",border:"1px solid #e2e8f0",maxHeight:"96vh"}}>
        {/* Header */}
        <div className="shrink-0 p-6" style={{background:"#f8fafc",borderBottom:"1px solid #e2e8f0"}}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl p-2.5" style={{background:"linear-gradient(135deg,#0891b2,#2563eb)"}}>
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{color:"#0f172a"}}>Opportunity Preferences</h2>
                <p className="text-sm" style={{color:"#64748b"}}>Customize your federal opportunity feed</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 transition hover:bg-slate-100" style={{color:"#64748b"}}
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-6 flex items-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded-full transition ${
                  i + 1 <= step ? 'bg-linear-to-r from-cyan-500 to-blue-600' : 'bg-slate-200'
                }`}
              />
            ))}
          </div>
          <div className="mt-2 text-center text-sm" style={{color:"#64748b"}}>
            Step {step} of {totalSteps}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-8" style={{background:"#ffffff"}}>
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Step 1: Keywords */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2" style={{background:"#e0f2fe",color:"#0369a1"}}>
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{color:"#0f172a"}}>Keywords</h3>
                    <p className="mt-1 text-sm" style={{color:"#475569"}}>
                      Tell us what you're looking for. We'll use these words to prioritize matching opportunities.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                  <div className="mb-3 text-sm font-semibold" style={{color:"#1e293b"}}>Keywords / Phrases</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      placeholder="e.g., Data Analytics, Cloud Computing..."
                      className="flex-1 rounded-xl px-4 py-3 outline-none transition" style={{background:"#ffffff",border:"1.5px solid #cbd5e1",color:"#0f172a"}} onFocus={(e)=>{(e.target as HTMLInputElement).style.borderColor="#0891b2";(e.target as HTMLInputElement).style.boxShadow="0 0 0 3px rgba(8,145,178,0.15)"}} onBlur={(e)=>{(e.target as HTMLInputElement).style.borderColor="#cbd5e1";(e.target as HTMLInputElement).style.boxShadow="none"}}
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="rounded-xl px-6 py-3 font-semibold text-white transition" style={{background:"#0891b2"}}
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-2 text-xs" style={{color:"#64748b"}}>Tip: Use comma-separated phrases for best results.</p>

                  {preferences.keywords.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {preferences.keywords.map((keyword, index) => (
                        <div
                          key={`${keyword}-${index}`}
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium" style={{background:"#e0f2fe",color:"#0369a1",border:"1px solid #bae6fd"}}
                        >
                          <span>{keyword}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="transition" style={{color:"#0891b2"}}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ✅ IMPROVED: Step 2 - NAICS Codes with search */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2" style={{background:"#e0f2fe",color:"#0369a1"}}>
                    <Code className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{color:"#0f172a"}}>NAICS Codes</h3>
                    <p className="mt-1 text-sm" style={{color:"#475569"}}>
                      Add NAICS codes relevant to your business to refine results.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{color:"#1e293b"}}>Search & Add NAICS</span>
                    {naicsDataSource && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{background: naicsDataSource === "live" ? "#dcfce7" : naicsDataSource === "cache" ? "#dbeafe" : "#fef9c3", color: naicsDataSource === "live" ? "#166534" : naicsDataSource === "cache" ? "#1e40af" : "#713f12"}}>
                        {naicsDataSource === "live" ? "● Live" : naicsDataSource === "cache" ? "● Cached" : "● Offline"}
                      </span>
                    )}
                  </div>



                  <div className="relative">
                    <input
                      ref={naicsInputRef}
                      type="text"
                      value={naicsSearch}
                      onChange={(e) => setNaicsSearch(e.target.value)}
                      onFocus={e => {
                        if (naicsSearch) setShowNaicsSuggestions(true);
                        (e.target as HTMLInputElement).style.borderColor = "#0891b2";
                        (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(8,145,178,0.15)";
                      }}
                      placeholder="Search NAICS by code or description..."
                      className="w-full rounded-xl px-4 py-3 pr-10 outline-none transition"
                      style={{background:"#ffffff",border:"1.5px solid #cbd5e1",color:"#0f172a"}}
                      onBlur={e => {
                        (e.target as HTMLInputElement).style.borderColor = "#cbd5e1";
                        (e.target as HTMLInputElement).style.boxShadow = "none";
                      }}
                    />
                    {naicsLoading
                      ? <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin" style={{color:"#0891b2"}} />
                      : <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{color:"#94a3b8"}} />}

                    {/* Suggestions dropdown */}
                    {showNaicsSuggestions && filteredNaicsSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full rounded-xl shadow-xl" style={{background:"#ffffff",border:"1px solid #e2e8f0"}}>
                        <div className="max-h-96 overflow-y-auto p-2">
                          {filteredNaicsSuggestions.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => handleAddNaicsCode(item.code)}
                              className="w-full rounded-lg p-3 text-left transition hover:bg-slate-50"
                            >
                              <div className="font-semibold text-gray-400">{item.code}</div>
                              <div className="text-sm text-gray-300">{item.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected NAICS codes */}
                  {preferences.naicsCodes.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-sm font-semibold" style={{color:"#1e293b"}}>Selected NAICS</div>
                      <div className="space-y-2">
                        {preferences.naicsCodes.map((code) => (
                            <div
                              key={code}
                              className="flex items-center justify-between rounded-lg p-3" style={{background:"#f1f5f9",border:"1px solid #e2e8f0"}}
                            >
                              <div>
                                <div className="font-semibold" style={{color:"#0369a1"}}>{code}</div>
                                {naicsDescMap[code] && (
                                  <div className="text-sm" style={{color:"#64748b"}}>{naicsDescMap[code]}</div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveNaicsCode(code)}
                                className="rounded-lg p-2 transition hover:bg-red-50" style={{color:"#94a3b8"}}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ✅ IMPROVED: Step 3 - PSC Codes with duplicate detection */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2" style={{background:"#e0f2fe",color:"#0369a1"}}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{color:"#0f172a"}}>PSC Codes</h3>
                    <p className="mt-1 text-sm" style={{color:"#475569"}}>
                      Product/Service codes to further narrow your search.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-sm font-semibold" style={{color:"#1e293b"}}>Search & Add PSC</span>
                    {pscDataSource && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{background: pscDataSource === "live" ? "#dcfce7" : pscDataSource === "cache" ? "#dbeafe" : "#fef9c3", color: pscDataSource === "live" ? "#166534" : pscDataSource === "cache" ? "#1e40af" : "#713f12"}}>
                        {pscDataSource === "live" ? "● Live" : pscDataSource === "cache" ? "● Cached" : "● Offline"}
                      </span>
                    )}
                  </div>



                  <div className="relative">
                    <input
                      ref={pscInputRef}
                      type="text"
                      value={pscSearch}
                      onChange={(e) => setPscSearch(e.target.value)}
                      onFocus={e => {
                        if (pscSearch) setShowPscSuggestions(true);
                        (e.target as HTMLInputElement).style.borderColor = "#0891b2";
                        (e.target as HTMLInputElement).style.boxShadow = "0 0 0 3px rgba(8,145,178,0.15)";
                      }}
                      placeholder="Search PSC by code or description..."
                      className="w-full rounded-xl px-4 py-3 pr-10 outline-none transition"
                      style={{background:"#ffffff",border:"1.5px solid #cbd5e1",color:"#0f172a"}}
                      onBlur={e => {
                        (e.target as HTMLInputElement).style.borderColor = "#cbd5e1";
                        (e.target as HTMLInputElement).style.boxShadow = "none";
                      }}
                    />
                    {pscLoading
                      ? <Loader2 className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin" style={{color:"#0891b2"}} />
                      : <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2" style={{color:"#94a3b8"}} />}

                    {/* Suggestions dropdown */}
                    {showPscSuggestions && filteredPscSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full rounded-xl shadow-xl" style={{background:"#ffffff",border:"1px solid #e2e8f0"}}>
                        <div className="max-h-96 overflow-y-auto p-2">
                          {filteredPscSuggestions.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => handleAddPscCode(item.code, item.description)}
                              className="w-full rounded-lg p-3 text-left transition hover:bg-slate-50"
                            >
                              <div className="font-semibold" style={{color:"#0369a1"}}>{item.code}</div>
                              <div className="text-sm" style={{color:"#64748b"}}>{item.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected PSC codes */}
                  {preferences.pscCodes.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-sm font-semibold" style={{color:"#1e293b"}}>Selected PSC</div>
                      <div className="space-y-2">
                        {preferences.pscCodes.map((code) => (
                            <div
                              key={code}
                              className="flex items-center justify-between rounded-lg p-3" style={{background:"#f1f5f9",border:"1px solid #e2e8f0"}}
                            >
                              <div>
                                <div className="font-semibold" style={{color:"#0369a1"}}>{code}</div>
                                {pscDescMap[code] && (
                                  <div className="text-sm" style={{color:"#64748b"}}>{pscDescMap[code]}</div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePscCode(code)}
                                className="rounded-lg p-2 transition hover:bg-red-50" style={{color:"#94a3b8"}}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Set-Asides */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2" style={{background:"#e0f2fe",color:"#0369a1"}}>
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{color:"#0f172a"}}>Set-Asides</h3>
                    <p className="mt-1 text-sm" style={{color:"#475569"}}>
                      Select applicable set-aside types for your business.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {SET_ASIDE_OPTIONS.map((option) => {
                    const isSelected = preferences.setAsideTypes.includes(option.code);
                    return (
                      <button
                        key={option.code}
                        type="button"
                        onClick={() => toggleSetAside(option.code)}
                        className="rounded-2xl border p-4 text-left transition"
                        style={isSelected
                          ? {background:'#ecfeff',border:'2px solid #0891b2'}
                          : {background:'#f8fafc',border:'1.5px solid #e2e8f0'}}
                      >
                        <div className="flex items-start gap-3">
                          <div className="rounded-xl p-2" style={isSelected ? {background:'#0891b2',color:'white'} : {background:'#e0f2fe',color:'#0369a1'}}>
                            <Award className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold" style={{color:"#0f172a"}}>{option.label}</div>
                              {isSelected && <CheckCircle className="h-4 w-4" style={{color:"#0891b2"}} />}
                            </div>
                            <div className="mt-1 text-xs" style={{color:"#64748b"}}>{option.description}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 5: Contract Types & Agencies */}
            {step === 5 && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2" style={{background:"#e0f2fe",color:"#0369a1"}}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{color:"#0f172a"}}>Contract Types & Agencies</h3>
                    <p className="mt-1 text-sm" style={{color:"#475569"}}>
                      Choose preferred contract types and federal agencies.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                  <div className="mb-3 text-sm font-semibold" style={{color:"#1e293b"}}>Contract Types</div>
                  <div className="grid grid-cols-2 gap-3">
                    {CONTRACT_TYPE_OPTIONS.map((type) => {
                      const isSelected = preferences.contractTypes.includes(type.value);
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => {
                            setPreferences(prev => ({
                              ...prev,
                              contractTypes: isSelected
                                ? prev.contractTypes.filter(t => t !== type.value)
                                : [...prev.contractTypes.filter(t => t !== 'ALL'), type.value],
                            }));
                          }}
                          className="rounded-xl border p-3 text-left transition text-sm"
                          style={isSelected
                            ? {background:'#ecfeff',border:'2px solid #0891b2'}
                            : {background:'#f8fafc',border:'1.5px solid #e2e8f0'}}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold" style={{color:"#0f172a"}}>{type.label}</span>
                            {isSelected && <CheckCircle className="h-4 w-4" style={{color:"#0891b2"}} />}
                          </div>
                          <div className="mt-1 text-xs" style={{color:"#64748b"}}>{type.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold" style={{color:"#0f172a"}}>Federal Agencies</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAgencyMode("all");
                          setPreferences(prev => ({ ...prev, agencies: [] }));
                        }}
                        className="rounded-full px-3 py-1.5 text-sm transition"
                        style={agencyMode === "all"
                          ? {background:'#0891b2',color:'white'}
                          : {background:'#f1f5f9',color:'#334155',borderRadius:'999px',padding:'6px 12px',fontSize:'14px'}}
                      >
                        All Agencies
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgencyMode("specific")}
                        className="rounded-full px-3 py-1.5 text-sm transition"
                        style={agencyMode === "specific"
                          ? {background:'#0891b2',color:'white'}
                          : {background:'#f1f5f9',color:'#334155',borderRadius:'999px',padding:'6px 12px',fontSize:'14px'}}
                      >
                        Specific
                      </button>
                    </div>
                  </div>

                  {agencyMode === "specific" && (
                    <div className="space-y-4">
                      {Object.entries(AGENCY_CATEGORIES).map(([category, agencies]) => (
                        <div key={category}>
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{color:"#94a3b8"}}>
                            {category}
                          </div>
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                            {agencies.map((agency) => {
                              const isSelected = preferences.agencies.includes(agency.name);
                              return (
                                <button
                                  key={agency.name}
                                  type="button"
                                  onClick={() => toggleAgency(agency.name)}
                                  className="rounded-lg border p-3 text-left transition text-sm"
                                  style={isSelected
                                    ? {background:'#ecfeff',border:'2px solid #0891b2'}
                                    : {background:'#f8fafc',border:'1.5px solid #e2e8f0'}}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold" style={{color:"#0f172a"}}>{agency.abbreviation}</div>
                                      <div className="text-xs" style={{color:"#64748b"}}>{agency.name}</div>
                                    </div>
                                    {isSelected && <CheckCircle className="h-4 w-4" style={{color:"#0891b2"}} />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ✅ FIXED: Step 6 - Status & Timeline with improved color coding text */}
            {step === 6 && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2" style={{background:"#e0f2fe",color:"#0369a1"}}>
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{color:"#0f172a"}}>Status & Timeline</h3>
                    <p className="mt-1 text-sm" style={{color:"#475569"}}>
                      Choose which opportunities to include and how urgent they should be.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-2xl p-5" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                    <div className="mb-3 text-sm font-semibold" style={{color:"#1e293b"}}>Opportunity Status</div>
                    <div className="space-y-3">
                      {OPPORTUNITY_STATUS_OPTIONS.map((opt) => {
                        const active = preferences.opportunityStatus === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPreferences(prev => ({ ...prev, opportunityStatus: opt.value }))}
                            className="w-full rounded-2xl border p-4 text-left transition"
                            style={active
                              ? {background:'#ecfeff',border:'2px solid #0891b2'}
                              : {background:'#f8fafc',border:'1.5px solid #e2e8f0'}}
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl p-2" style={active ? {background:'#0891b2',color:'white'} : {background:'#e0f2fe',color:'#0369a1'}}>
                                <Target className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-semibold" style={{color:"#0f172a"}}>{opt.label}</div>
                                  {active && <CheckCircle className="h-4 w-4" style={{color:"#0891b2"}} />}
                                </div>
                                <div className="mt-1 text-xs" style={{color:"#64748b"}}>{opt.description}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl p-5" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                    <div className="mb-3 text-sm font-semibold" style={{color:"#1e293b"}}>Timeline Preference</div>
                    <div className="space-y-3">
                      {TIMELINE_OPTIONS.map((opt) => {
                        const active = preferences.timeline === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPreferences(prev => ({ ...prev, timeline: opt.value }))}
                            className="w-full rounded-2xl border p-4 text-left transition"
                            style={active
                              ? {background:'#ecfeff',border:'2px solid #0891b2'}
                              : {background:'#f8fafc',border:'1.5px solid #e2e8f0'}}
                          >
                            <div className="flex items-start gap-3">
                              <div className="rounded-xl p-2" style={active ? {background:'#0891b2',color:'white'} : {background:'#e0f2fe',color:'#0369a1'}}>
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-semibold" style={{color:"#0f172a"}}>{opt.label}</div>
                                  {active && <CheckCircle className="h-4 w-4" style={{color:"#0891b2"}} />}
                                </div>
                                <div className="mt-1 text-xs" style={{color:"#64748b"}}>{opt.description}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* ✅ FIXED: Improved color coding text */}
                    <div className="mt-6 p-4 rounded-xl" style={{background:"linear-gradient(to right,#fef2f2,#fefce8,#f0fdf4)",border:"1px solid #e2e8f0"}}>
                      <p className="text-sm font-semibold" style={{color:"#1e293b"}}>
                        💡 <span className="" style={{color:"#334155"}}>Color Coding:</span> Once SAM.gov data loads, opportunities will be color-coded by response deadline:
                      </p>
                      <div className="mt-3 space-y-2 text-xs" style={{color:"#334155"}}>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="" style={{color:"#334155"}}><span className="font-bold text-red-400">Red</span> = Critical (≤3 business days)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="" style={{color:"#334155"}}><span className="font-bold text-yellow-400">Yellow</span> = Act Soon (≤10 business days)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="" style={{color:"#334155"}}><span className="font-bold text-green-400">Green</span> = Ample Time ({'>'}30 business days)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 7: Geography */}
            {step === 7 && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2" style={{background:"#e0f2fe",color:"#0369a1"}}>
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{color:"#0f172a"}}>Geography</h3>
                    <p className="mt-1 text-sm" style={{color:"#475569"}}>
                      Select states of performance to focus on local opportunities.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold" style={{color:"#0f172a"}}>State Selection</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStateMode("all");
                          setPreferences(prev => ({ ...prev, states: ["ALL"] }));
                        }}
                        className="rounded-full px-3 py-1.5 text-sm transition"
                        style={stateMode === "all"
                          ? {background:'#0891b2',color:'white'}
                          : {background:'#f1f5f9',color:'#334155',borderRadius:'999px',padding:'6px 12px',fontSize:'14px'}}
                      >
                        All States
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStateMode("specific");
                          setPreferences(prev => ({ ...prev, states: prev.states.includes("ALL") ? [] : prev.states }));
                        }}
                        className="rounded-full px-3 py-1.5 text-sm transition"
                        style={stateMode === "specific"
                          ? {background:'#0891b2',color:'white'}
                          : {background:'#f1f5f9',color:'#334155',borderRadius:'999px',padding:'6px 12px',fontSize:'14px'}}
                      >
                        Specific States
                      </button>
                    </div>
                  </div>

                  {stateMode === "specific" && (
                    <div className="grid grid-cols-5 gap-2 md:grid-cols-10">
                      {US_STATES.map((state) => {
                        const isSelected = preferences.states.includes(state);
                        return (
                          <button
                            key={state}
                            type="button"
                            onClick={() => toggleState(state)}
                            className="rounded-lg border p-2 text-center text-sm font-semibold transition"
                            style={isSelected
                              ? {background:'#ecfeff',border:'2px solid #0891b2',color:'#0369a1',borderRadius:'8px',padding:'8px',textAlign:'center',fontSize:'14px',fontWeight:600}
                              : {background:'#f8fafc',border:'1.5px solid #e2e8f0',color:'#334155',borderRadius:'8px',padding:'8px',textAlign:'center',fontSize:'14px',fontWeight:600}}
                          >
                            {state}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 8: Exclude Keywords */}
            {step === 8 && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl p-2" style={{background:"#e0f2fe",color:"#0369a1"}}>
                    <Filter className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{color:"#0f172a"}}>Exclude Keywords</h3>
                    <p className="mt-1 text-sm" style={{color:"#475569"}}>
                      Filter out opportunities containing these words or phrases.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl p-5" style={{background:"#f8fafc",border:"1px solid #e2e8f0"}}>
                  <div className="mb-3 text-sm font-semibold" style={{color:"#1e293b"}}>Exclude Keywords</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={excludeKeywordInput}
                      onChange={(e) => setExcludeKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExcludeKeyword())}
                      placeholder="e.g., Construction, Janitorial..."
                      className="flex-1 rounded-xl px-4 py-3 outline-none transition" style={{background:"#ffffff",border:"1.5px solid #cbd5e1",color:"#0f172a"}} onFocus={(e)=>{(e.target as HTMLInputElement).style.borderColor="#0891b2";(e.target as HTMLInputElement).style.boxShadow="0 0 0 3px rgba(8,145,178,0.15)"}} onBlur={(e)=>{(e.target as HTMLInputElement).style.borderColor="#cbd5e1";(e.target as HTMLInputElement).style.boxShadow="none"}}
                    />
                    <button
                      type="button"
                      onClick={handleAddExcludeKeyword}
                      className="rounded-xl px-6 py-3 font-semibold text-white transition" style={{background:"#0891b2"}}
                    >
                      Add
                    </button>
                  </div>

                  {preferences.excludeKeywords.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {preferences.excludeKeywords.map((keyword) => (
                        <div
                          key={keyword}
                          className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium" style={{background:"#fef2f2",color:"#dc2626",border:"1px solid #fecaca"}}
                        >
                          <span>{keyword}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExcludeKeyword(keyword)}
                            className="transition" style={{color:"#dc2626"}}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Pro tip removed (no emojis/sparkles) */}
              </div>
            )}

            {/* Step 9: Review & Edit */}
            {step === 9 && (
              <div className="space-y-6">
                <h3 className="text-xl font-semibold" style={{color:'#0f172a'}}>Review & Edit Preferences</h3>
                <div className="space-y-2">
                  <div><b>Keywords:</b> {preferences.keywords.join(', ') || 'None'} <button type="button" className="ml-2 text-blue-600 underline text-xs" onClick={()=>setStep(1)}>Edit</button></div>
                  <div><b>NAICS:</b> {preferences.naicsCodes.join(', ') || 'None'} <button type="button" className="ml-2 text-blue-600 underline text-xs" onClick={()=>setStep(2)}>Edit</button></div>
                  <div><b>PSC:</b> {preferences.pscCodes.join(', ') || 'None'} <button type="button" className="ml-2 text-blue-600 underline text-xs" onClick={()=>setStep(3)}>Edit</button></div>
                  <div><b>Set-Asides:</b> {preferences.setAsideTypes.join(', ') || 'None'} <button type="button" className="ml-2 text-blue-600 underline text-xs" onClick={()=>setStep(4)}>Edit</button></div>
                  <div><b>Contract Types:</b> {preferences.contractTypes.join(', ') || 'None'} <button type="button" className="ml-2 text-blue-600 underline text-xs" onClick={()=>setStep(5)}>Edit</button></div>
                  <div><b>Agencies:</b> {preferences.agencies.join(', ') || 'All'} <button type="button" className="ml-2 text-blue-600 underline text-xs" onClick={()=>setStep(5)}>Edit</button></div>
                  <div><b>Status:</b> {preferences.opportunityStatus || 'Any'} <button type="button" className="ml-2 text-blue-600 underline text-xs" onClick={()=>setStep(6)}>Edit</button></div>
                  <div><b>Timeline:</b> {preferences.timeline || 'Any'} <button type="button" className="ml-2 text-blue-600 underline text-xs" onClick={()=>setStep(6)}>Edit</button></div>
                  <div><b>States:</b> {preferences.states.join(', ') || 'All'} <button type="button" className="ml-2 text-blue-600 underline text-xs" onClick={()=>setStep(7)}>Edit</button></div>
                  <div><b>Exclude Keywords:</b> {preferences.excludeKeywords.join(', ') || 'None'} <button type="button" className="ml-2 text-blue-600 underline text-xs" onClick={()=>setStep(8)}>Edit</button></div>
                </div>
                <div className="mt-4 text-sm text-gray-500">Review your selections. Click Edit to update any section, or Complete Setup to save and update your feed.</div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-6" style={{background:"#f8fafc",borderTop:"1px solid #e2e8f0"}}>
          <div className="flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl px-6 py-3 font-semibold transition" style={{background:"#f1f5f9",border:"1.5px solid #cbd5e1",color:"#334155"}}
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 9 ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl px-8 py-3 font-bold text-white transition" style={{background:"linear-gradient(135deg,#0891b2,#2563eb)"}}
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="rounded-xl px-8 py-3 font-bold text-white transition flex items-center gap-2" style={{background:"linear-gradient(135deg,#059669,#0891b2)"}}
              >
                <CheckCircle className="h-5 w-5" />
                Complete Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}