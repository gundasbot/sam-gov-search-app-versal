// components/OpportunityPreferencesSurvey.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Settings, Target, Building2, Award, DollarSign, MapPin, Calendar, CheckCircle, Sparkles, Filter, Code, Shield, Search, Loader2, ExternalLink, AlertCircle } from 'lucide-react';

// ✅ EXPANDED: Enhanced NAICS code database with DATA-related codes
const NAICS_CODES_DATABASE = [
  // Data & Analytics specific
  { code: "518210", description: "Data Processing, Hosting, and Related Services" },
  { code: "519130", description: "Internet Publishing and Broadcasting and Web Search Portals" },
  { code: "541511", description: "Custom Computer Programming Services" },
  { code: "541512", description: "Computer Systems Design Services" },
  { code: "541513", description: "Computer Facilities Management Services" },
  { code: "541519", description: "Other Computer Related Services - Data Analytics" },
  { code: "541611", description: "Administrative Management and General Management Consulting Services" },
  { code: "541612", description: "Human Resources Consulting Services" },
  { code: "541613", description: "Marketing Consulting Services" },
  { code: "541618", description: "Other Management Consulting Services - Data Strategy" },
  { code: "541620", description: "Environmental Consulting Services" },
  { code: "541690", description: "Other Scientific and Technical Consulting Services - Data Science" },
  { code: "541720", description: "Research and Development in the Social Sciences and Humanities" },
  { code: "541990", description: "All Other Professional, Scientific, and Technical Services" },
  // Construction & Infrastructure
  { code: "236220", description: "Commercial and Institutional Building Construction" },
  { code: "541330", description: "Engineering Services" },
  // Support Services
  { code: "561210", description: "Facilities Support Services" },
  { code: "561720", description: "Janitorial Services" },
  { code: "562910", description: "Remediation Services" },
  { code: "611430", description: "Professional and Management Development Training" },
  // Healthcare
  { code: "621111", description: "Offices of Physicians (except Mental Health Specialists)" },
  { code: "621399", description: "Offices of All Other Miscellaneous Health Practitioners" },
  { code: "621511", description: "Medical Laboratories" },
  { code: "621999", description: "All Other Miscellaneous Ambulatory Health Care Services" },
  { code: "624190", description: "Other Individual and Family Services" },
  // Other
  { code: "711310", description: "Promoters of Performing Arts, Sports, and Similar Events" },
  { code: "811310", description: "Commercial and Industrial Machinery and Equipment Repair and Maintenance" },
  { code: "922190", description: "Other Justice, Public Order, and Safety Activities" },
];

// Enhanced PSC code database  
const PSC_CODES_DATABASE = [
  // IT & Data Services
  { code: "D302", description: "IT and Telecom - Systems Development" },
  { code: "D307", description: "IT and Telecom - Cyber Security and Data Backup" },
  { code: "D310", description: "IT and Telecom - Information Technology - Data Management" },
  { code: "D399", description: "IT and Telecom - Other Data Services" },
  // Engineering & Technical
  { code: "R425", description: "Engineering and Technical Services" },
  // Maintenance
  { code: "J070", description: "Maintenance, Repair, and Rebuilding of Equipment" },
  // Facilities
  { code: "S201", description: "Housekeeping - Custodial Janitorial" },
  { code: "S206", description: "Housekeeping - Landscaping/Groundskeeping" },
  // Environmental
  { code: "F108", description: "Environmental Systems Protection" },
  { code: "F999", description: "Other Environmental Services" },
  // Medical
  { code: "Q201", description: "Medical - General Health Services" },
  { code: "Q301", description: "Medical - Dental Services" },
  // Support
  { code: "R499", description: "Support Services - Other" },
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
  const totalSteps = 8;

  // ✅ NEW: Error states
  const [naicsDuplicateError, setNaicsDuplicateError] = useState(false);
  const [pscDuplicateError, setPscDuplicateError] = useState(false);

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
  const [filteredNaicsSuggestions, setFilteredNaicsSuggestions] = useState<typeof NAICS_CODES_DATABASE>([]);
  const [filteredPscSuggestions, setFilteredPscSuggestions] = useState<typeof PSC_CODES_DATABASE>([]);
  const [agencyMode, setAgencyMode] = useState<'all' | 'specific'>('all');
  const [stateMode, setStateMode] = useState<'all' | 'specific'>('all');

  const naicsInputRef = useRef<HTMLInputElement>(null);
  const pscInputRef = useRef<HTMLInputElement>(null);

  // NAICS suggestions filtering
  useEffect(() => {
    const q = naicsSearch.trim().toLowerCase();
    if (!q) {
      setFilteredNaicsSuggestions([]);
      setShowNaicsSuggestions(false);
      return;
    }
    const filtered = NAICS_CODES_DATABASE.filter(naics =>
      naics.code.includes(q) || naics.description.toLowerCase().includes(q)
    ).slice(0, 8);
    setFilteredNaicsSuggestions(filtered);
    setShowNaicsSuggestions(filtered.length > 0);
  }, [naicsSearch]);

  // PSC suggestions filtering
  useEffect(() => {
    const q = pscSearch.trim().toLowerCase();
    if (!q) {
      setFilteredPscSuggestions([]);
      setShowPscSuggestions(false);
      return;
    }
    const filtered = PSC_CODES_DATABASE.filter(psc =>
      psc.code.toLowerCase().includes(q) || psc.description.toLowerCase().includes(q)
    ).slice(0, 8);
    setFilteredPscSuggestions(filtered);
    setShowPscSuggestions(filtered.length > 0);
  }, [pscSearch]);

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

  const handleAddPscCode = (code: string) => {
    if (preferences.pscCodes.includes(code)) {
      setPscDuplicateError(true);
      setTimeout(() => setPscDuplicateError(false), 3000);
      return;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl border border-white/10">
        {/* Header */}
        <div className="border-b border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 p-2.5">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Opportunity Preferences</h2>
                <p className="text-sm text-slate-300">Customize your federal opportunity feed</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-400 transition hover:bg-white/10 hover:text-white"
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
                  i + 1 <= step ? 'bg-gradient-to-r from-cyan-500 to-blue-600' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="mt-2 text-center text-sm text-slate-400">
            Step {step} of {totalSteps}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-8" style={{ maxHeight: 'calc(90vh - 220px)' }}>
          <form onSubmit={(e) => e.preventDefault()}>
            {/* Step 1: Keywords */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="rounded-xl bg-white/10 p-2 text-cyan-300">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Keywords</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Tell us what you're looking for. We'll use these words to prioritize matching opportunities.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 text-sm font-semibold text-white">Keywords / Phrases</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                      placeholder="e.g., Data Analytics, Cloud Computing..."
                      className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddKeyword}
                      className="rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white transition hover:bg-cyan-700"
                    >
                      Add
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">Tip: Use comma-separated phrases for best results.</p>

                  {preferences.keywords.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {preferences.keywords.map((keyword, index) => (
                        <div
                          key={`${keyword}-${index}`}
                          className="inline-flex items-center gap-2 rounded-full bg-cyan-500/20 px-3 py-1.5 text-sm text-cyan-300 border border-cyan-500/30"
                        >
                          <span>{keyword}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveKeyword(keyword)}
                            className="text-cyan-400 hover:text-cyan-300"
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
                  <div className="rounded-xl bg-white/10 p-2 text-cyan-300">
                    <Code className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">NAICS Codes</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Add NAICS codes relevant to your business to refine results.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 text-sm font-semibold text-white">
                    Search & Add NAICS
                  </div>

                  {/* ✅ NEW: Duplicate error message */}
                  {naicsDuplicateError && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <span className="text-sm text-amber-300 font-semibold">
                        You've already added this NAICS code!
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      ref={naicsInputRef}
                      type="text"
                      value={naicsSearch}
                      onChange={(e) => setNaicsSearch(e.target.value)}
                      onFocus={() => naicsSearch && setShowNaicsSuggestions(true)}
                      placeholder="Search NAICS by code or description..."
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-10 text-white placeholder-slate-400 outline-none focus:border-cyan-500"
                    />
                    <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    {/* Suggestions dropdown */}
                    {showNaicsSuggestions && filteredNaicsSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/20 bg-slate-800 shadow-2xl">
                        <div className="max-h-96 overflow-y-auto p-2">
                          {filteredNaicsSuggestions.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => handleAddNaicsCode(item.code)}
                              className="w-full rounded-lg p-3 text-left transition hover:bg-white/10"
                            >
                              <div className="font-semibold text-cyan-400">{item.code}</div>
                              <div className="text-sm text-slate-300">{item.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected NAICS codes */}
                  {preferences.naicsCodes.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-sm font-semibold text-white">Selected NAICS</div>
                      <div className="space-y-2">
                        {preferences.naicsCodes.map((code) => {
                          const naicsInfo = NAICS_CODES_DATABASE.find(n => n.code === code);
                          return (
                            <div
                              key={code}
                              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                            >
                              <div>
                                <div className="font-semibold text-cyan-400">{code}</div>
                                {naicsInfo && (
                                  <div className="text-sm text-slate-300">{naicsInfo.description}</div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveNaicsCode(code)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
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
                  <div className="rounded-xl bg-white/10 p-2 text-cyan-300">
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">PSC Codes</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Product/Service codes to further narrow your search.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 text-sm font-semibold text-white">
                    Search & Add PSC
                  </div>

                  {/* ✅ NEW: Duplicate error message */}
                  {pscDuplicateError && (
                    <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-amber-400" />
                      <span className="text-sm text-amber-300 font-semibold">
                        You've already added this PSC code!
                      </span>
                    </div>
                  )}

                  <div className="relative">
                    <input
                      ref={pscInputRef}
                      type="text"
                      value={pscSearch}
                      onChange={(e) => setPscSearch(e.target.value)}
                      onFocus={() => pscSearch && setShowPscSuggestions(true)}
                      placeholder="Search PSC by code or description..."
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 pr-10 text-white placeholder-slate-400 outline-none focus:border-cyan-500"
                    />
                    <Search className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />

                    {/* Suggestions dropdown */}
                    {showPscSuggestions && filteredPscSuggestions.length > 0 && (
                      <div className="absolute z-10 mt-2 w-full rounded-xl border border-white/20 bg-slate-800 shadow-2xl">
                        <div className="max-h-96 overflow-y-auto p-2">
                          {filteredPscSuggestions.map((item) => (
                            <button
                              key={item.code}
                              type="button"
                              onClick={() => handleAddPscCode(item.code)}
                              className="w-full rounded-lg p-3 text-left transition hover:bg-white/10"
                            >
                              <div className="font-semibold text-cyan-400">{item.code}</div>
                              <div className="text-sm text-slate-300">{item.description}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Selected PSC codes */}
                  {preferences.pscCodes.length > 0 && (
                    <div className="mt-4">
                      <div className="mb-2 text-sm font-semibold text-white">Selected PSC</div>
                      <div className="space-y-2">
                        {preferences.pscCodes.map((code) => {
                          const pscInfo = PSC_CODES_DATABASE.find(p => p.code === code);
                          return (
                            <div
                              key={code}
                              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3"
                            >
                              <div>
                                <div className="font-semibold text-cyan-400">{code}</div>
                                {pscInfo && (
                                  <div className="text-sm text-slate-300">{pscInfo.description}</div>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemovePscCode(code)}
                                className="rounded-lg p-2 text-slate-400 hover:bg-red-500/20 hover:text-red-400"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          );
                        })}
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
                  <div className="rounded-xl bg-white/10 p-2 text-cyan-300">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Set-Asides</h3>
                    <p className="mt-1 text-sm text-slate-300">
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
                        className={`rounded-2xl border p-4 text-left transition ${
                          isSelected
                            ? 'border-cyan-500/40 bg-cyan-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`rounded-xl p-2 ${isSelected ? 'bg-cyan-500 text-white' : 'bg-white/10 text-cyan-300'}`}>
                            <Award className="h-4 w-4" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="text-sm font-semibold text-white">{option.label}</div>
                              {isSelected && <CheckCircle className="h-4 w-4 text-cyan-300" />}
                            </div>
                            <div className="mt-1 text-xs text-slate-300">{option.description}</div>
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
                  <div className="rounded-xl bg-white/10 p-2 text-cyan-300">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Contract Types & Agencies</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Choose preferred contract types and federal agencies.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 text-sm font-semibold text-white">Contract Types</div>
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
                          className={`rounded-xl border p-3 text-left transition text-sm ${
                            isSelected
                              ? 'border-cyan-500/40 bg-cyan-500/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-white">{type.label}</span>
                            {isSelected && <CheckCircle className="h-4 w-4 text-cyan-300" />}
                          </div>
                          <div className="mt-1 text-xs text-slate-300">{type.description}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">Federal Agencies</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAgencyMode("all");
                          setPreferences(prev => ({ ...prev, agencies: [] }));
                        }}
                        className={`rounded-full px-3 py-1.5 text-sm transition ${
                          agencyMode === "all"
                            ? 'bg-cyan-500 text-white'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        All Agencies
                      </button>
                      <button
                        type="button"
                        onClick={() => setAgencyMode("specific")}
                        className={`rounded-full px-3 py-1.5 text-sm transition ${
                          agencyMode === "specific"
                            ? 'bg-cyan-500 text-white'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        Specific
                      </button>
                    </div>
                  </div>

                  {agencyMode === "specific" && (
                    <div className="space-y-4">
                      {Object.entries(AGENCY_CATEGORIES).map(([category, agencies]) => (
                        <div key={category}>
                          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
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
                                  className={`rounded-lg border p-3 text-left transition text-sm ${
                                    isSelected
                                      ? 'border-cyan-500/40 bg-cyan-500/10'
                                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <div className="font-semibold text-white">{agency.abbreviation}</div>
                                      <div className="text-xs text-slate-300">{agency.name}</div>
                                    </div>
                                    {isSelected && <CheckCircle className="h-4 w-4 text-cyan-300" />}
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
                  <div className="rounded-xl bg-white/10 p-2 text-cyan-300">
                    <Target className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Status & Timeline</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Choose which opportunities to include and how urgent they should be.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="mb-3 text-sm font-semibold text-white">Opportunity Status</div>
                    <div className="space-y-3">
                      {OPPORTUNITY_STATUS_OPTIONS.map((opt) => {
                        const active = preferences.opportunityStatus === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPreferences(prev => ({ ...prev, opportunityStatus: opt.value }))}
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                              active
                                ? 'border-cyan-500/40 bg-cyan-500/10'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`rounded-xl p-2 ${active ? 'bg-cyan-500 text-white' : 'bg-white/10 text-cyan-300'}`}>
                                <Target className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-semibold text-white">{opt.label}</div>
                                  {active && <CheckCircle className="h-4 w-4 text-cyan-300" />}
                                </div>
                                <div className="mt-1 text-xs text-slate-300">{opt.description}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                    <div className="mb-3 text-sm font-semibold text-white">Timeline Preference</div>
                    <div className="space-y-3">
                      {TIMELINE_OPTIONS.map((opt) => {
                        const active = preferences.timeline === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setPreferences(prev => ({ ...prev, timeline: opt.value }))}
                            className={`w-full rounded-2xl border p-4 text-left transition ${
                              active
                                ? 'border-cyan-500/40 bg-cyan-500/10'
                                : 'border-white/10 bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`rounded-xl p-2 ${active ? 'bg-cyan-500 text-white' : 'bg-white/10 text-cyan-300'}`}>
                                <Calendar className="h-4 w-4" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="text-sm font-semibold text-white">{opt.label}</div>
                                  {active && <CheckCircle className="h-4 w-4 text-cyan-300" />}
                                </div>
                                <div className="mt-1 text-xs text-slate-300">{opt.description}</div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* ✅ FIXED: Improved color coding text */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-red-500/10 via-yellow-500/10 to-green-500/10 border border-white/20 rounded-xl">
                      <p className="text-sm text-white font-semibold">
                        💡 <span className="text-slate-200">Color Coding:</span> Once SAM.gov data loads, opportunities will be color-coded by response deadline:
                      </p>
                      <div className="mt-3 space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span className="text-slate-200"><span className="font-bold text-red-400">Red</span> = Critical (≤3 business days)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span className="text-slate-200"><span className="font-bold text-yellow-400">Yellow</span> = Act Soon (≤10 business days)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span className="text-slate-200"><span className="font-bold text-green-400">Green</span> = Ample Time ({'>'}30 business days)</span>
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
                  <div className="rounded-xl bg-white/10 p-2 text-cyan-300">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Geography</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Select states of performance to focus on local opportunities.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="text-sm font-semibold text-white">State Selection</div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStateMode("all");
                          setPreferences(prev => ({ ...prev, states: ["ALL"] }));
                        }}
                        className={`rounded-full px-3 py-1.5 text-sm transition ${
                          stateMode === "all"
                            ? 'bg-cyan-500 text-white'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
                      >
                        All States
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStateMode("specific");
                          setPreferences(prev => ({ ...prev, states: prev.states.includes("ALL") ? [] : prev.states }));
                        }}
                        className={`rounded-full px-3 py-1.5 text-sm transition ${
                          stateMode === "specific"
                            ? 'bg-cyan-500 text-white'
                            : 'bg-white/10 text-slate-300 hover:bg-white/20'
                        }`}
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
                            className={`rounded-lg border p-2 text-center text-sm font-semibold transition ${
                              isSelected
                                ? 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300'
                                : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                            }`}
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
                  <div className="rounded-xl bg-white/10 p-2 text-cyan-300">
                    <Filter className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Exclude Keywords</h3>
                    <p className="mt-1 text-sm text-slate-300">
                      Filter out opportunities containing these words or phrases.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                  <div className="mb-3 text-sm font-semibold text-white">Exclude Keywords</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={excludeKeywordInput}
                      onChange={(e) => setExcludeKeywordInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExcludeKeyword())}
                      placeholder="e.g., Construction, Janitorial..."
                      className="flex-1 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-slate-400 outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddExcludeKeyword}
                      className="rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white transition hover:bg-cyan-700"
                    >
                      Add
                    </button>
                  </div>

                  {preferences.excludeKeywords.length > 0 && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {preferences.excludeKeywords.map((keyword) => (
                        <div
                          key={keyword}
                          className="inline-flex items-center gap-2 rounded-full bg-red-500/20 px-3 py-1.5 text-sm text-red-300 border border-red-500/30"
                        >
                          <span>{keyword}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveExcludeKeyword(keyword)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-5">
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-cyan-500/20 p-2">
                      <Sparkles className="h-5 w-5 text-cyan-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">Pro tip</div>
                      <p className="mt-1 text-sm text-cyan-100">
                        You can update these preferences anytime by clicking "Update Preferences" button.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 bg-slate-900/80 p-6">
          <div className="flex items-center justify-between gap-4">
            {step > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="rounded-xl border border-white/20 bg-white/5 px-6 py-3 font-semibold text-white transition hover:bg-white/10"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < totalSteps ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 px-8 py-3 font-bold text-white transition hover:from-cyan-700 hover:to-blue-700"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 px-8 py-3 font-bold text-white transition hover:from-emerald-700 hover:to-cyan-700 flex items-center gap-2"
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