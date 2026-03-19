// app/opportunities/OpportunitiesClient.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import OpportunityPreferencesSurvey from '@/components/OpportunityPreferencesSurvey';
import Toast from '@/components/Toast';
import {
  Building2, Calendar, Award, Target,
  ExternalLink, Search, RefreshCw, XCircle,
  CheckCircle2, Timer, ChevronDown, Loader2,
  TargetIcon, CheckCircle, AlertCircle,
  LineChart, Download, Bookmark,
  List, Grid3x3, Layers, X, Settings,
  Share2, Link2, Mail, Printer, ChevronUp,
  Sparkles
} from 'lucide-react';
// import { getPersonalizedGreeting, getTimeOfDayEmoji } from '@/lib/greeting';

interface SamOpportunity {
  noticeId: string;
  title: string;
  solicitationNumber: string;
  department: string;
  postedDate: string;
  updatedPostedDate?: string;
  responseDeadLine: string;
  updatedResponseDeadLine?: string;
  naicsCode: string;
  classificationCode?: string;
  typeOfSetAsideDescription: string;
  typeOfSetAside: string;           // SAM.gov setAsideCode: SBA, SDVOSBC, WOSB, etc.
  setAside?: string;                // setAside description from API response
  uiLink: string;
  type?: string;                    // Opportunity type: o, p, a, r, s, etc.
  organizationType?: string;        // department / subtier / office
  fullParentPathName?: string;      // Full org path e.g. "DEPT OF DEFENSE:DEPT OF THE ARMY"
  fullParentPathCode?: string;
  active?: string;                  // "Yes" or "No"
  officeAddress?: {
    city?: string;
    state?: string;
    zip?: string;
  };
  placeOfPerformance?: {
    city?: { code?: string; name?: string };
    state?: { code?: string; name?: string };
    zip?: string;
  };
  pointOfContact?: Array<{
    type?: string;
    title?: string;
    fullname?: string;
    email?: string;
    phone?: string;
  }>;
  aiAnalysis?: {
    matchScore?: number;
    competitionLevel?: string;
    winProbability?: string;
    keyRequirements?: string[];
    risks?: string[];
    opportunities?: string[];
    recommendation?: string;
  };
}

// View mode types
type ViewMode = 'list' | 'grid' | 'compact';
type GroupMode = 'none' | 'department' | 'urgency' | 'setaside' | 'naics' | 'state' | 'deadline_month';
type SortMode = 'deadline_asc' | 'deadline_desc' | 'posted_desc' | 'posted_asc' | 'title_asc' | 'agency_asc';

const USE_MOCK_OPPORTUNITIES = true;

// 📌 IMPROVED: Static placeholder data for immediate display
const PLACEHOLDER_OPPORTUNITIES: SamOpportunity[] = Array.from({ length: 10 }, (_, i) => ({
  noticeId: `placeholder-${i}`,
  title: 'Loading opportunity data...',
  solicitationNumber: `XX-XX-XXXX-${i.toString().padStart(4, '0')}`,
  department: 'Federal Agency',
  postedDate: new Date().toISOString(),
  responseDeadLine: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
  naicsCode: 'XXXXXX',
  typeOfSetAsideDescription: 'Set-Aside',
  typeOfSetAside: 'SBA',
  uiLink: '#',
  officeAddress: {
    city: 'Washington',
    state: 'DC'
  }
}));

// Helper: compute a responseDeadLine N *business* days from now so mock cards always
// land in the correct board column regardless of when the page is loaded.
const _bd = (businessDays: number): string => {
  const d = new Date();
  let added = 0;
  while (added < businessDays) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) added++; // skip Sat/Sun
  }
  return d.toISOString();
};

const MOCK_OPPORTUNITIES: SamOpportunity[] = [
  // ── CRITICAL (≤3 bd) ──────────────────────────────────────────────────────
  {
    noticeId: 'FA-8900-DEF',
    title: 'Defensive Cyber Operations Surge',
    solicitationNumber: 'FA-8900-DEF-2026',
    department: 'Department of the Air Force',
    postedDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    responseDeadLine: _bd(2),
    naicsCode: '541512',
    classificationCode: 'D318',
    typeOfSetAsideDescription: 'SDVOSB',
    typeOfSetAside: 'SDVOSBC',
    setAside: 'SDVOSBC',
    uiLink: '#',
    fullParentPathName: 'DEPT OF DEFENSE:DEPT OF THE AIR FORCE',
    placeOfPerformance: { city: { name: 'Langley AFB' }, state: { code: 'VA', name: 'Virginia' } },
    pointOfContact: [{ fullname: 'Capt. Jordan Blake', email: 'jordan.blake@us.af.mil' }],
  },
  {
    noticeId: 'CRIT-SOC-001',
    title: 'Army SOC Network Hardening Sprint',
    solicitationNumber: 'W91CRB-26-SOC-001',
    department: 'Department of the Army',
    postedDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    responseDeadLine: _bd(1),
    naicsCode: '541512',
    classificationCode: 'D302',
    typeOfSetAsideDescription: 'SDVOSB',
    typeOfSetAside: 'SDVOSBC',
    setAside: 'SDVOSBC',
    uiLink: '#',
    fullParentPathName: 'DEPT OF DEFENSE:DEPT OF THE ARMY',
    placeOfPerformance: { city: { name: 'Fort Belvoir' }, state: { code: 'VA', name: 'Virginia' } },
    pointOfContact: [{ fullname: 'Sgt. Maj. Dana Cole', email: 'dana.cole@army.mil' }],
  },
  // ── URGENT (4-5 bd) ───────────────────────────────────────────────────────
  {
    noticeId: 'N66001-AI-2026',
    title: 'Naval AI Decision Support Toolkit',
    solicitationNumber: 'N66001-26-AI-DST',
    department: 'Department of the Navy',
    postedDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    responseDeadLine: _bd(5),
    naicsCode: '541715',
    classificationCode: 'AJ13',
    typeOfSetAsideDescription: '8(a) Program',
    typeOfSetAside: '8A',
    setAside: '8A',
    uiLink: '#',
    fullParentPathName: 'DEPT OF DEFENSE:DEPT OF THE NAVY',
    placeOfPerformance: { city: { name: 'San Diego' }, state: { code: 'CA', name: 'California' } },
    pointOfContact: [{ fullname: 'Andrea Lee', email: 'andrea.lee@navy.mil' }],
  },
  {
    noticeId: 'URG-DHS-002',
    title: 'DHS Biometric Identity Verification System',
    solicitationNumber: '70RDGE-26-BIV-002',
    department: 'Department of Homeland Security',
    postedDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    responseDeadLine: _bd(4),
    naicsCode: '541519',
    classificationCode: 'D307',
    typeOfSetAsideDescription: 'Small Business',
    typeOfSetAside: 'SBA',
    setAside: 'SBA',
    uiLink: '#',
    fullParentPathName: 'DEPT OF HOMELAND SECURITY:CISA',
    placeOfPerformance: { city: { name: 'Arlington' }, state: { code: 'VA', name: 'Virginia' } },
    pointOfContact: [{ fullname: 'Marcus Webb', email: 'marcus.webb@cisa.dhs.gov' }],
  },
  // ── HIGH (6-7 bd) ─────────────────────────────────────────────────────────
  {
    noticeId: 'HIGH-DOJ-003',
    title: 'DOJ eDiscovery Platform Modernization',
    solicitationNumber: 'GS-35F-DOJ-2026-001',
    department: 'Department of Justice',
    postedDate: new Date(Date.now() - 4 * 86400000).toISOString(),
    responseDeadLine: _bd(7),
    naicsCode: '541511',
    classificationCode: 'D399',
    typeOfSetAsideDescription: 'Woman Owned Small Business',
    typeOfSetAside: 'WOSB',
    setAside: 'WOSB',
    uiLink: '#',
    fullParentPathName: 'DEPT OF JUSTICE:EXECUTIVE OFFICE',
    placeOfPerformance: { city: { name: 'Washington' }, state: { code: 'DC', name: 'District of Columbia' } },
    pointOfContact: [{ fullname: 'Rachel Kim', email: 'rachel.kim@usdoj.gov' }],
  },
  {
    noticeId: 'HIGH-HHS-004',
    title: 'HHS Public Health Data Interoperability',
    solicitationNumber: 'HHS-2026-PH-DI-004',
    department: 'Dept of Health and Human Services',
    postedDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    responseDeadLine: _bd(6),
    naicsCode: '541613',
    classificationCode: 'R425',
    typeOfSetAsideDescription: '8(a) Program',
    typeOfSetAside: '8A',
    setAside: '8A',
    uiLink: '#',
    fullParentPathName: 'DEPT OF HEALTH AND HUMAN SERVICES:CDC',
    placeOfPerformance: { city: { name: 'Atlanta' }, state: { code: 'GA', name: 'Georgia' } },
    pointOfContact: [{ fullname: 'Dr. Priya Shah', email: 'priya.shah@cdc.hhs.gov' }],
  },
  // ── ACT SOON (8-10 bd) ────────────────────────────────────────────────────
  {
    noticeId: '70RD-CLOUD-24',
    title: 'DHS Secure Cloud Migration Pod',
    solicitationNumber: '70RD2026CLD',
    department: 'Department of Homeland Security',
    postedDate: new Date(Date.now() - 4 * 86400000).toISOString(),
    responseDeadLine: _bd(9),
    naicsCode: '541519',
    classificationCode: 'D307',
    typeOfSetAsideDescription: 'Small Business',
    typeOfSetAside: 'SBA',
    setAside: 'SBA',
    uiLink: '#',
    fullParentPathName: 'DEPT OF HOMELAND SECURITY:OFFICE OF THE CTO',
    placeOfPerformance: { city: { name: 'Washington' }, state: { code: 'DC', name: 'District of Columbia' } },
    pointOfContact: [{ fullname: 'Priya Shah', email: 'priya.shah@hq.dhs.gov' }],
  },
  {
    noticeId: 'ACT-DOE-005',
    title: 'DOE Grid Resilience Analytics Dashboard',
    solicitationNumber: 'DE-SOL-26-GRID-005',
    department: 'Department of Energy',
    postedDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    responseDeadLine: _bd(10),
    naicsCode: '541690',
    classificationCode: 'R408',
    typeOfSetAsideDescription: 'HUBZone',
    typeOfSetAside: 'HZC',
    setAside: 'HZC',
    uiLink: '#',
    fullParentPathName: 'DEPT OF ENERGY:OFFICE OF ELECTRICITY',
    placeOfPerformance: { city: { name: 'Oak Ridge' }, state: { code: 'TN', name: 'Tennessee' } },
    pointOfContact: [{ fullname: 'Elena Watts', email: 'elena.watts@doe.gov' }],
  },
  // ── NORMAL (11-14 bd) ─────────────────────────────────────────────────────
  {
    noticeId: '36C10B-ANL-007',
    title: 'VA Analytics Modernization Phase II',
    solicitationNumber: '36C10B-2026-ANL',
    department: 'Department of Veterans Affairs',
    postedDate: new Date(Date.now() - 1 * 86400000).toISOString(),
    responseDeadLine: _bd(12),
    naicsCode: '541611',
    classificationCode: 'R699',
    typeOfSetAsideDescription: 'SDVOSB',
    typeOfSetAside: 'SDVOSBC',
    setAside: 'SDVOSBC',
    uiLink: '#',
    fullParentPathName: 'DEPT OF VETERANS AFFAIRS:TECHNOLOGY ACQUISITION CENTER',
    placeOfPerformance: { city: { name: 'Austin' }, state: { code: 'TX', name: 'Texas' } },
    pointOfContact: [{ fullname: 'Nina Torres', email: 'nina.torres@va.gov' }],
  },
  {
    noticeId: 'NORM-NASA-006',
    title: 'NASA Mission Data Telemetry Processing',
    solicitationNumber: 'NNH26ZTT006N',
    department: 'NASA',
    postedDate: new Date(Date.now() - 6 * 86400000).toISOString(),
    responseDeadLine: _bd(14),
    naicsCode: '541715',
    classificationCode: 'AC14',
    typeOfSetAsideDescription: 'Small Business',
    typeOfSetAside: 'SBA',
    setAside: 'SBA',
    uiLink: '#',
    fullParentPathName: 'NATIONAL AERONAUTICS AND SPACE ADMINISTRATION:GSFC',
    placeOfPerformance: { city: { name: 'Greenbelt' }, state: { code: 'MD', name: 'Maryland' } },
    pointOfContact: [{ fullname: 'James Okafor', email: 'james.okafor@nasa.gov' }],
  },
  // ── COMFORTABLE (15-21 bd) ────────────────────────────────────────────────
  {
    noticeId: 'HQ0034-ZT-OPS',
    title: 'Pentagon Zero Trust Operations Cell',
    solicitationNumber: 'HQ0034-26-ZT',
    department: 'Department of Defense',
    postedDate: new Date(Date.now() - 5 * 86400000).toISOString(),
    responseDeadLine: _bd(18),
    naicsCode: '541512',
    classificationCode: 'D302',
    typeOfSetAsideDescription: 'Small Business',
    typeOfSetAside: 'SBA',
    setAside: 'SBA',
    uiLink: '#',
    fullParentPathName: 'OFFICE OF THE SECRETARY OF DEFENSE',
    placeOfPerformance: { city: { name: 'Arlington' }, state: { code: 'VA', name: 'Virginia' } },
    pointOfContact: [{ fullname: 'Derrick Miles', email: 'derrick.miles@osd.mil' }],
  },
  {
    noticeId: 'COMF-USDA-007',
    title: 'USDA Rural Broadband Infrastructure Analytics',
    solicitationNumber: 'USDA-RUS-26-BB-007',
    department: 'Dept of Agriculture',
    postedDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    responseDeadLine: _bd(21),
    naicsCode: '541519',
    classificationCode: 'D308',
    typeOfSetAsideDescription: 'Woman Owned Small Business',
    typeOfSetAside: 'WOSB',
    setAside: 'WOSB',
    uiLink: '#',
    fullParentPathName: 'DEPT OF AGRICULTURE:RURAL UTILITIES SERVICE',
    placeOfPerformance: { city: { name: 'Washington' }, state: { code: 'DC', name: 'District of Columbia' } },
    pointOfContact: [{ fullname: 'Leah Martinez', email: 'leah.martinez@usda.gov' }],
  },
  // ── AMPLE (22-30 bd) ──────────────────────────────────────────────────────
  {
    noticeId: 'GS-00F-NextGen',
    title: 'GSA NextGen Support Desk Expansion',
    solicitationNumber: 'GS-00F-NXT-2026',
    department: 'General Services Administration',
    postedDate: new Date(Date.now() - 6 * 86400000).toISOString(),
    responseDeadLine: _bd(25),
    naicsCode: '541513',
    classificationCode: 'D305',
    typeOfSetAsideDescription: 'Woman Owned Small Business',
    typeOfSetAside: 'WOSB',
    setAside: 'WOSB',
    uiLink: '#',
    fullParentPathName: 'GENERAL SERVICES ADMINISTRATION:FAS',
    placeOfPerformance: {
      city: { name: 'Kansas City' },
      state: { code: 'MO', name: 'Missouri' },
    },
    pointOfContact: [{ fullname: 'Morgan Ellis', email: 'morgan.ellis@gsa.gov' }],
  },
  {
    noticeId: 'AMPL-DOT-008',
    title: 'DOT Connected Infrastructure Data Hub',
    solicitationNumber: 'DTFH-26-R-00008',
    department: 'Department of Transportation',
    postedDate: new Date(Date.now() - 8 * 86400000).toISOString(),
    responseDeadLine: _bd(28),
    naicsCode: '541512',
    classificationCode: 'D312',
    typeOfSetAsideDescription: 'SDVOSB',
    typeOfSetAside: 'SDVOSBC',
    setAside: 'SDVOSBC',
    uiLink: '#',
    fullParentPathName: 'DEPT OF TRANSPORTATION:FHWA',
    placeOfPerformance: { city: { name: 'McLean' }, state: { code: 'VA', name: 'Virginia' } },
    pointOfContact: [{ fullname: 'Carl Thompson', email: 'carl.thompson@dot.gov' }],
  },
  // ── PLENTY (31+ bd) ───────────────────────────────────────────────────────
  {
    noticeId: 'PLNT-DOI-009',
    title: 'Interior Dept Land Management GIS Modernization',
    solicitationNumber: 'D26PX26009',
    department: 'Department of the Interior',
    postedDate: new Date(Date.now() - 10 * 86400000).toISOString(),
    responseDeadLine: _bd(45),
    naicsCode: '541360',
    classificationCode: 'D308',
    typeOfSetAsideDescription: 'Small Business',
    typeOfSetAside: 'SBA',
    setAside: 'SBA',
    uiLink: '#',
    fullParentPathName: 'DEPT OF THE INTERIOR:BLM',
    placeOfPerformance: { city: { name: 'Denver' }, state: { code: 'CO', name: 'Colorado' } },
    pointOfContact: [{ fullname: 'Sandra Runs', email: 'sandra.runs@blm.doi.gov' }],
  },
  {
    noticeId: 'PLNT-TREAS-010',
    title: 'Treasury Financial Crimes Analytics Platform',
    solicitationNumber: 'TREAS-FINCEN-26-010',
    department: 'Department of the Treasury',
    postedDate: new Date(Date.now() - 9 * 86400000).toISOString(),
    responseDeadLine: _bd(60),
    naicsCode: '541511',
    classificationCode: 'D399',
    typeOfSetAsideDescription: '8(a) Program',
    typeOfSetAside: '8A',
    setAside: '8A',
    uiLink: '#',
    fullParentPathName: 'DEPT OF THE TREASURY:FINCEN',
    placeOfPerformance: { city: { name: 'Vienna' }, state: { code: 'VA', name: 'Virginia' } },
    pointOfContact: [{ fullname: 'Omar Reeves', email: 'omar.reeves@fincen.treas.gov' }],
  },
]

// 📌 NEW: User profile interface
interface UserProfile {
  first_name: string;
  lastName?: string;
  companyName?: string;
  naicsCodes?: string[];
  certifications?: string[];
  monthlyGoal?: number;
  achievedThisMonth?: number;
  favoriteAgencies?: string[];
  hasCompletedSurvey?: boolean;
}

// 📌 NEW: Personalized achievement messages
const ACHIEVEMENT_MESSAGES = [
  "You're on track to hit your monthly goal!",
  "Great job staying ahead of deadlines!",
  "Your profile matches 95% of today's opportunities!",
  "You've saved 12 hours of research time this week!",
  "Perfect match found for your certifications!"
];

const PERSONALIZED_TIPS = [
  "Based on your profile, focus on Small Business Set-Asides",
  "Your NAICS codes are in high demand this month",
  "Consider expanding to include HUBZone opportunities",
  "You qualify for 8(a) program opportunities"
];

// Γ£à NEW: Neutral styling for opportunities with no response deadline
const getNoDeadlineGradient = () => 'from-slate-800/60 to-slate-900/70 border-slate-700/70';
const getNoDeadlineTextColor = () => 'text-slate-200';
const getNoDeadlineBadgeColor = () => 'bg-slate-900/60 text-slate-200 border-slate-600/60';

// 📌 NEW: Utility function to get urgency gradient colors
// Γ£à FIXED: Proper red-to-green gradient based on business days
const getUrgencyGradient = (businessDays: number) => {
  if (businessDays <= 3) return 'from-red-600/40 to-red-500/30 border-red-500/70';        // 🔴 CRITICAL
  if (businessDays <= 5) return 'from-orange-600/40 to-orange-500/30 border-orange-500/70'; // 🟠 URGENT
  if (businessDays <= 7) return 'from-amber-600/40 to-amber-500/30 border-amber-500/70';   // 🟡 HIGH
  if (businessDays <= 10) return 'from-yellow-500/40 to-yellow-400/30 border-yellow-400/70'; // 🟡 ACT SOON
  if (businessDays <= 14) return 'from-lime-500/40 to-lime-400/30 border-lime-500/70';     // 🟢 NORMAL
  if (businessDays <= 21) return 'from-green-500/40 to-green-400/30 border-green-500/70';  // 🟢 COMFORTABLE
  if (businessDays <= 30) return 'from-emerald-500/40 to-emerald-400/30 border-emerald-500/70'; // 🟢 AMPLE
  return 'from-emerald-600/40 to-emerald-700/30 border-emerald-600/70'; // 🟢 PLENTY
};

const getUrgencyTextColor = (businessDays: number) => {
  if (businessDays <= 3) return 'text-red-400';
  if (businessDays <= 5) return 'text-orange-400';
  if (businessDays <= 7) return 'text-amber-400';
  if (businessDays <= 10) return 'text-yellow-300';
  if (businessDays <= 14) return 'text-lime-400';
  if (businessDays <= 21) return 'text-green-400';
  if (businessDays <= 30) return 'text-emerald-400';
  return 'text-emerald-500';
};

const getUrgencyBadgeColor = (businessDays: number) => {
  if (businessDays <= 3) return 'bg-red-600 text-white border-red-700';
  if (businessDays <= 5) return 'bg-orange-600 text-white border-orange-700';
  if (businessDays <= 7) return 'bg-amber-600 text-white border-amber-700';
  if (businessDays <= 10) return 'bg-yellow-600 text-white border-yellow-700';
  if (businessDays <= 14) return 'bg-lime-600 text-white border-lime-700';
  if (businessDays <= 21) return 'bg-green-600 text-white border-green-700';
  if (businessDays <= 30) return 'bg-emerald-600 text-white border-emerald-700';
  return 'bg-emerald-700 text-white border-emerald-800';
};

const getUrgencyLabel = (businessDays: number) => {
  if (businessDays <= 3) return 'CRITICAL';
  if (businessDays <= 5) return 'URGENT';
  if (businessDays <= 7) return 'HIGH PRIORITY';
  if (businessDays <= 10) return 'ACT SOON';
  if (businessDays <= 14) return 'NORMAL';
  if (businessDays <= 21) return 'COMFORTABLE';
  if (businessDays <= 30) return 'AMPLE TIME';
  return 'PLENTY OF TIME';
};

// Γ£à NEW: Rank function so urgent cards sort LEFT in grid
const getUrgencyRank = (businessDays: number | null) => {
  if (businessDays === null || Number.isNaN(businessDays)) return 999;
  if (businessDays <= 3) return 0;
  if (businessDays <= 5) return 1;
  if (businessDays <= 7) return 2;
  if (businessDays <= 10) return 3;
  if (businessDays <= 14) return 4;
  if (businessDays <= 21) return 5;
  if (businessDays <= 30) return 6;
  return 7;
};

// 📌 NEW: Department color mapping
const getDepartmentGradient = (department: string) => {
  const dept = department?.toUpperCase() || '';
  if (dept.includes('DEFENSE') || dept.includes('ARMY') || dept.includes('NAVY') || dept.includes('AIR FORCE')) 
    return 'from-indigo-500/20 to-blue-600/20 border-indigo-500/40';
  if (dept.includes('HOMELAND') || dept.includes('DHS')) 
    return 'from-red-500/20 to-orange-600/20 border-red-500/40';
  if (dept.includes('HEALTH') || dept.includes('HHS')) 
    return 'from-green-500/20 to-emerald-600/20 border-green-500/40';
  if (dept.includes('ENERGY') || dept.includes('DOE')) 
    return 'from-yellow-500/20 to-amber-600/20 border-yellow-500/40';
  if (dept.includes('NASA') || dept.includes('SPACE')) 
    return 'from-purple-500/20 to-pink-600/20 border-purple-500/40';
  if (dept.includes('VETERANS') || dept.includes('VA')) 
    return 'from-teal-500/20 to-cyan-600/20 border-teal-500/40';
  if (dept.includes('GENERAL SERVICES') || dept.includes('GSA')) 
    return 'from-slate-500/20 to-gray-600/20 border-slate-500/40';
  return 'from-blue-500/20 to-indigo-600/20 border-blue-500/40';
};

// Γ£à SECTION 1: Agency abbreviation helper
const getAgencyAbbreviation = (department?: string) => {
  if (!department) return 'FED';
  // fullParentPathName: "DEPT OF DEFENSE:DEPT OF THE ARMY:..." ΓÇö use first segment
  const dept = (department.split(':')[0]).toUpperCase();
  if (dept.includes('DEFENSE'))          return 'DOD';
  if (dept.includes('ARMY'))             return 'ARMY';
  if (dept.includes('NAVY') || (dept.includes('NAVAL'))) return 'NAVY';
  if (dept.includes('AIR FORCE'))        return 'USAF';
  if (dept.includes('MARINE'))           return 'USMC';
  if (dept.includes('SPACE FORCE'))      return 'USSF';
  if (dept.includes('HOMELAND'))         return 'DHS';
  if (dept.includes('VETERANS'))         return 'VA';
  if (dept.includes('HEALTH'))           return 'HHS';
  if (dept.includes('ENERGY'))           return 'DOE';
  if (dept.includes('NASA'))             return 'NASA';
  if (dept.includes('GENERAL SERVICES')) return 'GSA';
  if (dept.includes('JUSTICE'))          return 'DOJ';
  if (dept.includes('INTERIOR'))         return 'DOI';
  if (dept.includes('AGRICULTURE'))      return 'USDA';
  if (dept.includes('TRANSPORTATION'))   return 'DOT';
  if (dept.includes('TREASURY'))         return 'TREAS';
  if (dept.includes('COMMERCE'))         return 'DOC';
  if (dept.includes('LABOR'))            return 'DOL';
  if (dept.includes('STATE'))            return 'DOS';
  if (dept.includes('EDUCATION'))        return 'ED';
  if (dept.includes('HOUSING'))          return 'HUD';
  if (dept.includes('SOCIAL SECURITY'))  return 'SSA';
  if (dept.includes('ENVIRONMENTAL'))    return 'EPA';
  if (dept.includes('COAST GUARD'))      return 'USCG';
  if (dept.includes('CUSTOMS'))          return 'CBP';
  if (dept.includes('IMMIGRATION'))      return 'ICE';
  // Fallback: initials of meaningful words
  const words = dept.split(/\s+/).filter(w => w.length > 2 && !['OF','THE','AND','FOR','IN'].includes(w));
  return words.slice(0, 3).map(w => w[0]).join('') || 'FED';
};

/**
 * Calculate business days between two dates (excludes weekends)
 */
const calculateBusinessDays = (startDate: Date, endDate: Date): number => {
  let count = 0;
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
};

const getBusinessDaysUntil = (deadline: Date | string | null): number | null => {
  if (!deadline) return null;
  const deadlineDate = typeof deadline === 'string' ? new Date(deadline) : deadline;
  if (isNaN(deadlineDate.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadlineDate.setHours(0, 0, 0, 0);

  if (deadlineDate < today) return -1; // past deadline

  return calculateBusinessDays(today, deadlineDate);
};

/**
 * Get the effective deadline for an opportunity
 * Returns updated deadline if available, otherwise original deadline, otherwise null
 */
const getEffectiveDeadline = (opportunity: any): Date | null => {
  const possibleDeadlineFields = [
    'updatedResponseDeadLine',
    'responseDeadLine',
    'updatedResponseDeadline',
    'responseDeadline',
    'updated_response_deadline',
    'response_deadline',
    'archiveDate',
    'closingDate',
    'dueDate',
    'dateOffersDue',
    'date_offers_due',
    'offersdue',
    'deadline'
  ];
  
  for (const field of possibleDeadlineFields) {
    const value = opportunity[field];
    if (value) {
      try {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
          return date;
        }
      } catch (e) {
        // Continue trying other fields
      }
    }
  }
  
  return null;
};

/**
 * Get the effective posted date (use updated if available)
 */
const getEffectivePostedDate = (opportunity: any): string => {
  const possiblePostedFields = [
    'updatedPostedDate',
    'postedDate',
    'updated_posted_date',
    'posted_date',
    'publishedDate',
    'published_date',
    'datePublished',
    'date_published'
  ];
  
  for (const field of possiblePostedFields) {
    const value = opportunity[field];
    if (value) {
      return value;
    }
  }
  
  return new Date().toISOString(); // Fallback to current date
};

const formatDate = (dateString: string | Date | null | undefined) => {
  if (!dateString) return 'ΓÇö';
  try {
    // Treat bare YYYY-MM-DD as local date to avoid UTC off-by-one shift
    let date: Date;
    if (typeof dateString === 'string' && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateString)) {
      const parts = dateString.split('-');
      date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    } else {
      date = typeof dateString === 'string' ? new Date(dateString) : dateString as Date;
    }
    if (isNaN(date.getTime())) return 'ΓÇö';
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return 'ΓÇö';
  }
};

// Checks if an opportunity has any set-aside designation
// API sends: setAside = code (e.g. "SBA"), typeOfSetAsideDescription = full text
const hasSetAside = (o: SamOpportunity): boolean => {
  const NONE_VALUES = new Set(['', 'none', 'n/a', 'not applicable', 'no set aside used']);
  const code = ((o as any).setAside || (o as any).typeOfSetAside || '').trim().toLowerCase();
  const desc = ((o as any).typeOfSetAsideDescription || '').trim().toLowerCase();
  if (!NONE_VALUES.has(code) && code.length > 0) return true;
  if (!NONE_VALUES.has(desc) && desc.length > 2) return true;
  return false;
};

// Set-aside code ΓåÆ { label, color, bg, text } based on SAM.gov official codes
const SET_ASIDE_STYLES: Record<string, { label: string; color: string; bg: string; text: string }> = {
  SBA:       { label: 'Small Business',           color: '#854d0e', bg: '#422006',   text: '#fde047' },
  SBP:       { label: 'Partial SB',               color: '#92400e', bg: '#451a03',   text: '#fcd34d' },
  '8A':      { label: '8(a)',                      color: '#5b21b6', bg: '#2e1065',   text: '#c4b5fd' },
  '8AN':     { label: '8(a) Sole Source',          color: '#4c1d95', bg: '#1e0a4a',   text: '#a78bfa' },
  HZC:       { label: 'HUBZone',                   color: '#155e75', bg: '#0c2a33',   text: '#67e8f9' },
  HZS:       { label: 'HUBZone Sole',              color: '#0e4f63', bg: '#082028',   text: '#38bdf8' },
  SDVOSBC:   { label: 'SDVOSB',                    color: '#166534', bg: '#052e16',   text: '#86efac' },
  SDVOSBS:   { label: 'SDVOSB Sole',               color: '#14532d', bg: '#041f0f',   text: '#4ade80' },
  WOSB:      { label: 'WOSB',                      color: '#9d174d', bg: '#4a0728',   text: '#f9a8d4' },
  WOSBSS:    { label: 'WOSB Sole',                 color: '#831843', bg: '#3d0320',   text: '#f472b6' },
  EDWOSB:    { label: 'EDWOSB',                    color: '#9f1239', bg: '#4c0519',   text: '#fda4af' },
  EDWOSBSS:  { label: 'EDWOSB Sole',               color: '#881337', bg: '#420514',   text: '#fb7185' },
  VSA:       { label: 'VOSB',                      color: '#1e3a8a', bg: '#0d1f4a',   text: '#93c5fd' },
  VSS:       { label: 'VOSB Sole',                 color: '#1e40af', bg: '#0e2257',   text: '#60a5fa' },
  LAS:       { label: 'Local Area',                color: '#134e4a', bg: '#062826',   text: '#5eead4' },
  IEE:       { label: 'Indian Econ',               color: '#7c2d12', bg: '#3b0f05',   text: '#fdba74' },
  ISBEE:     { label: 'Indian SB Econ',            color: '#7a2e0e', bg: '#391008',   text: '#fb923c' },
  BICIVC:    { label: 'Buy Indian',                color: '#78350f', bg: '#3a1a04',   text: '#fbbf24' },
};

const getSetAsideStyle = (opp: SamOpportunity) => {
  const code = ((opp as any).setAside || opp.typeOfSetAside || '').trim().toUpperCase();
  return SET_ASIDE_STYLES[code] || null;
};

function normalizeOpportunity(raw: any): SamOpportunity {
  const fallbackId = raw.noticeId || raw.notice_id || raw.id || raw.solnbr || raw.solicitationNumber || raw.uiLink || `opp-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const deptSource = raw.fullParentPathName || raw.department || raw.organizationName || raw.agency || '';
  const department = typeof deptSource === 'string' ? deptSource.split(':')[0].trim() : 'Federal Agency';

  return {
    noticeId: String(fallbackId),
    title: raw.title || raw.description || 'Untitled opportunity',
    solicitationNumber: raw.solicitationNumber || raw.solnbr || raw.sol_num || 'N/A',
    department: department || 'Federal Agency',
    postedDate: raw.postedDate || raw.updatedPostedDate || raw.publishDate || new Date().toISOString(),
    responseDeadLine:
      raw.updatedResponseDeadLine ||
      raw.responseDeadLine ||
      raw.responseDeadline ||
      raw.archiveDate ||
      raw.closingDate ||
      raw.dueDate ||
      '',
    naicsCode: raw.naicsCode || raw.naics_code || raw.naics || '',
    classificationCode: raw.classificationCode || raw.pscCode || raw.productServiceCode,
    typeOfSetAsideDescription: raw.typeOfSetAsideDescription || raw.setAsideDescription || raw.setAsideType || '',
    typeOfSetAside: raw.setAside || raw.typeOfSetAside || '',
    setAside: raw.setAside || raw.typeOfSetAside || '',
    uiLink: raw.uiLink || raw.samUrl || raw.url || '#',
    type: raw.type || raw.opportunityType || raw.ptype,
    organizationType: raw.organizationType,
    fullParentPathName: raw.fullParentPathName || raw.organizationName || department,
    placeOfPerformance: raw.placeOfPerformance || raw.place_of_performance,
    officeAddress: raw.officeAddress || raw.office_address,
    pointOfContact: Array.isArray(raw.pointOfContact) ? raw.pointOfContact : raw.pointOfContact ? [raw.pointOfContact] : undefined,
    aiAnalysis: raw.aiAnalysis,
  };
}


export default function OpportunitiesClient() {
    // Toast state
    const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const searchParams = useSearchParams();
  const filterParam = searchParams?.get('filter') ?? null;
  const searchParamSnapshot = searchParams?.toString() ?? '';
  const { data: session, status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === 'authenticated';

  const [allOpportunities, setAllOpportunities] = useState<SamOpportunity[]>([]);
  const [displayedOpportunities, setDisplayedOpportunities] = useState<SamOpportunity[]>(PLACEHOLDER_OPPORTUNITIES);
  const [filteredOpportunities, setFilteredOpportunities] = useState<SamOpportunity[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState<{ status: number | null, statusText: string, message: string } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [keywordSearch, setKeywordSearch] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedSetAside, setSelectedSetAside] = useState<string>('all');
  const [displayCount, setDisplayCount] = useState(250);
  const [totalRecords, setTotalRecords] = useState(0);
  const [lastUpdated, setLastUpdated] = useState('Just now');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'active' | 'setasides' | 'expiring' | 'departments' | null>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(new Set());
  const [viewedOpportunities, setViewedOpportunities] = useState<Set<string>>(new Set());
  const [analyzingOpps, setAnalyzingOpps] = useState<Set<string>>(new Set());
  const [opportunityPreferences, setOpportunityPreferences] = useState<any>(null);
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [selectedNAICS, setSelectedNAICS] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedUrgencyFilters, setSelectedUrgencyFilters] = useState<Set<string>>(new Set());
  const resultsRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [refreshIndicator, setRefreshIndicator] = useState(false);

  // 📌 NEW: View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>('urgency');
  const [sortMode, setSortMode] = useState<SortMode>('deadline_asc');
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [showPrefsReminder, setShowPrefsReminder] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<SamOpportunity | null>(null);
  const [showMoreBands, setShowMoreBands] = useState<Record<string, boolean>>({});

  // Γ£à NEW: Banner dismissal states
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  
  // Γ£à NEW: Toggle for showing/hiding all opportunities including no-deadline
  const [showAllOpportunities, setShowAllOpportunities] = useState(false);

  // Share tray state
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [dataSource, setDataSource] = useState<'mock' | 'live' | 'ticker'>('mock');
  const [showSignInNudge, setShowSignInNudge] = useState(false);
  const nudgeTimerRef = useRef<number | null>(null);

  // Prefill filters from URL so shared opportunities links restore search context.
  useEffect(() => {
    if (!searchParams) return;

    const pick = (...keys: string[]) => {
      for (const key of keys) {
        const value = searchParams.get(key);
        if (value && value.trim()) return value.trim();
      }
      return '';
    };

    const decode = (value: string) => {
      try {
        return decodeURIComponent(value).trim();
      } catch {
        return value.trim();
      }
    };

    const query = decode(pick('q', 'query', 'search', 'keyword'));
    const agency = decode(pick('agency', 'department'));
    const naics = decode(pick('naics', 'naicsCode'));
    const setAside = decode(pick('setAside', 'setaside'));
    const urgency = decode(pick('urgency'));

    if (query) {
      setSearchTerm(query);
      setKeywordSearch(query);
    }
    if (agency) setSelectedAgency(agency);
    if (naics) setSelectedNAICS(naics);
    if (setAside) setSelectedSetAside(setAside);
    if (urgency) setSelectedUrgency(urgency);
  }, [searchParamSnapshot, searchParams]);

  // Sign-in nudge: no auto-popup — the board banner handles the CTA for guests
  const scheduleSignInPrompt = useCallback(() => { /* disabled — no popup */ }, []);

  useEffect(() => {
    if (isLoggedIn) setShowSignInNudge(false);
    return () => {
      if (nudgeTimerRef.current) {
        window.clearTimeout(nudgeTimerRef.current);
        nudgeTimerRef.current = null;
      }
    };
  }, [isLoggedIn]);

  const handleDismissSignInNudge = useCallback(() => {
    setShowSignInNudge(false);
  }, []);

  // 📌 FIXED: Get user name from session
  const userName = session?.user?.name?.split(' ')[0] || '';
  const userDisplayName = userName 
    ? (userName.endsWith('s') ? `${userName}'` : `${userName}'s`)
    : '';

  // 📌 FIXED: Create user profile from session
  const [userProfile, setUserProfile] = useState<UserProfile>({
    first_name: userName,
    companyName: 'Your Business',
    monthlyGoal: 10,
    achievedThisMonth: 0,
    hasCompletedSurvey: false
  });

  const [userAchievement, setUserAchievement] = useState('');
  const [userTip, setUserTip] = useState('');

  // ── Weekly SAM.gov cache fetch for guests ──────────────────────────────
  // Attempts to load a fresh slice of live SAM.gov data once per week,
  // falling back to MOCK_OPPORTUNITIES if unavailable.
  const [guestDataLoading, setGuestDataLoading] = useState(false);
  const [guestDataFreshAt, setGuestDataFreshAt] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn || sessionStatus === 'loading') return;
    const CACHE_KEY = 'pgc_guest_opps_v1';
    const CACHE_TS_KEY = 'pgc_guest_opps_ts_v1';
    const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    const cached = localStorage.getItem(CACHE_KEY);
    const cachedTs = localStorage.getItem(CACHE_TS_KEY);
    const isStale = !cachedTs || Date.now() - Number(cachedTs) > ONE_WEEK_MS;

    if (cached && !isStale) {
      try {
        const parsed = JSON.parse(cached) as SamOpportunity[];
        if (parsed.length > 0) {
          setAllOpportunities(parsed);
          setDataLoaded(true);
          setGuestDataFreshAt(new Date(Number(cachedTs)).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
          setLastUpdated(`Cached ${new Date(Number(cachedTs)).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`);
          return;
        }
      } catch { /* fall through to fetch */ }
    }

    // Fetch fresh slice from SAM.gov API route
    setGuestDataLoading(true);
    fetch('/api/sam/opportunities?limit=20&status=active')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const opps: SamOpportunity[] = (data?.opportunities ?? []).map(normalizeOpportunity);
        if (opps.length > 0) {
          localStorage.setItem(CACHE_KEY, JSON.stringify(opps));
          localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
          setAllOpportunities(opps);
          setGuestDataFreshAt(new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
          setLastUpdated('Just now');
        } else {
          // API unavailable — stay with mock data (handled by filter effect)
        }
      })
      .catch(() => { /* stay with mock data */ })
      .finally(() => {
        setDataLoaded(true);
        setGuestDataLoading(false);
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, sessionStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const applyViewportMode = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileViewport(mobile);
      if (mobile) setViewMode('compact');
    };
    applyViewportMode();
    window.addEventListener('resize', applyViewportMode);
    return () => window.removeEventListener('resize', applyViewportMode);
  }, []);

  // 📌 IMPROVED: Accurate stats calculation based on actual data
  const stats = useMemo(() => {
    if (!dataLoaded) {
      return {
        totalActive: 0,
        setAsides: 0,
        closingSoon: 0,
        departments: 0,
        postedToday: 0
      };
    }
    
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const nextWeek = new Date(now);
    nextWeek.setDate(nextWeek.getDate() + 7);

    // Use all opportunities for stats, not just displayed ones
    return {
      totalActive: allOpportunities.length,
      setAsides: allOpportunities.filter(o => {
        const code = (o.typeOfSetAside || o.setAside || '').trim().toUpperCase();
        const desc = (o.typeOfSetAsideDescription || '').trim();
        const knownCodes = ['SBA','SBP','8A','8AN','HZC','HZS','SDVOSBC','SDVOSBS','WOSB','WOSBSS','EDWOSB','EDWOSBSS','LAS','IEE','ISBEE','BICIVC','VSA','VSS'];
        return knownCodes.includes(code) ||
               (desc && !['None','none','NONE','N/A',''].includes(desc.trim()));
      }).length,
      closingSoon: allOpportunities.filter(o => {
        const deadline = getEffectiveDeadline(o);
        if (!deadline) return false;
        const daysUntil = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
        return daysUntil <= 7 && daysUntil > 0;
      }).length,
      departments: new Set(allOpportunities.map(o => o.department).filter(Boolean)).size,
      postedToday: allOpportunities.filter(o => {
        const posted = getEffectivePostedDate(o);
        return posted.startsWith(today);
      }).length
    };
  }, [dataLoaded, allOpportunities]);

  // 📌 OPTIMIZED: Memoized filter application - FIXED to not filter everything out
  const applyFilters = useCallback((opportunities: SamOpportunity[],
    filter: string | null,
    search: string,
    type: string,
    setAside: string,
    active: typeof activeFilter,
    agency: string,
    naics: string,
    urgency: string,
    selectedUrgencyFilters: Set<string>,
    showAll: boolean
  ) => {
    let filtered = [...opportunities];

    // Apply URL filter parameter
    if (filter) {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      switch (filter) {
        case 'today':
          filtered = filtered.filter(opp => opp.postedDate?.startsWith(today));
          break;
        case 'expiring':
          filtered = filtered.filter(opp => {
            if (!opp.responseDeadLine) return false;
            const deadline = new Date(opp.responseDeadLine);
            return deadline <= nextWeek && deadline >= new Date();
          });
          break;
      }
    }

    // Apply active filter from pills
    if (active) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      
      switch (active) {
        case 'setasides':
          filtered = filtered.filter(o => hasSetAside(o));
          break;
        case 'expiring':
          filtered = filtered.filter(o => {
            const deadline = getEffectiveDeadline(o);
            if (!deadline) return false;
            return deadline <= nextWeek && deadline >= new Date();
          });
          break;
      }
    }

    // Text search handled by keywordFiltered below applyFilters

    // Apply type filter
    if (type !== 'all') {
      filtered = filtered.filter(opp => opp.typeOfSetAside === type);
    }

    // Apply set-aside filter
    if (setAside !== 'all') {
      filtered = filtered.filter(opp => opp.typeOfSetAside === setAside);
    }

    // Apply agency filter
    if (agency !== 'all') {
      filtered = filtered.filter(opp => 
        opp.department?.toLowerCase().includes(agency.toLowerCase())
      );
    }

    // Apply NAICS filter
    if (naics !== 'all') {
      filtered = filtered.filter(opp => 
        opp.naicsCode?.startsWith(naics)
      );
    }

    // Urgency filter from legend pills ΓÇö for list/compact view
    // Board view handles this via column dimming (not pre-filtering)
    if (selectedUrgencyFilters.size > 0) {
      filtered = filtered.filter(opp => {
        const deadline = getEffectiveDeadline(opp);
        if (!deadline) return false;
        const bd = getBusinessDaysUntil(deadline);
        if (bd === null) return false;
        // Map bd to column key
        let colKey = '';
        if (bd <= 3) colKey = 'CRITICAL';
        else if (bd <= 5) colKey = 'URGENT';
        else if (bd <= 7) colKey = 'HIGH';
        else if (bd <= 10) colKey = 'ACT SOON';
        else if (bd <= 14) colKey = 'NORMAL';
        else if (bd <= 21) colKey = 'COMFORTABLE';
        else if (bd <= 30) colKey = 'AMPLE';
        else colKey = 'PLENTY';
        return selectedUrgencyFilters.has(colKey);
      });
    }

    // Apply urgency dropdown filter
    if (urgency !== 'all') {
      filtered = filtered.filter(opp => {
        const deadline = getEffectiveDeadline(opp);
        if (!deadline) return false;

        const businessDays = getBusinessDaysUntil(deadline);
        if (businessDays === null) return false;

        switch (urgency) {
          case 'critical': return businessDays <= 3;
          case 'urgent': return businessDays >= 4 && businessDays <= 5;
          case 'high': return businessDays >= 6 && businessDays <= 7;
          case 'normal': return businessDays >= 8 && businessDays <= 14;
          case 'comfortable': return businessDays >= 15;
          default: return true;
        }
      });
    }

    // Date-based filtering - only filter out expired opportunities
    const now = new Date();
    filtered = filtered.filter(opp => {
      const deadline = getEffectiveDeadline(opp);
      if (!deadline) return showAll;
      return deadline >= now;
    });

    // Default sort: soonest deadline first (callers can re-sort after)
    filtered.sort((a, b) => {
      const dA = getEffectiveDeadline(a);
      const dB = getEffectiveDeadline(b);
      const bdA = getBusinessDaysUntil(dA) ?? 9999;
      const bdB = getBusinessDaysUntil(dB) ?? 9999;
      return bdA - bdB;
    });

    return filtered;
  }, []);

  const analyzeOpportunity = async (opportunity: SamOpportunity) => {
    try {
      setAnalyzingOpps(prev => new Set(prev).add(opportunity.noticeId));
      if (USE_MOCK_OPPORTUNITIES) {
        await new Promise(resolve => setTimeout(resolve, 400));
        return {
          matchScore: 88,
          competitionLevel: 'Medium',
          winProbability: 'High',
          keyRequirements: ['Zero trust architecture plan', 'Cloud security accreditation package', 'Dedicated SDVOSB transition team'],
          risks: ['Aggressive response timeline', 'Limited past performance references'],
          opportunities: ['Set-aside friendly evaluation', 'Aligned NAICS and certifications'],
          recommendation: 'Advance to capture review and assign pricing lead this week.',
        };
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || '',
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{
            role: 'user',
            content: `Analyze this federal contract opportunity for ${userProfile.companyName}:
Title: ${opportunity.title}
Department: ${opportunity.department}
NAICS: ${opportunity.naicsCode}
Set-Aside: ${opportunity.typeOfSetAsideDescription}
Response Deadline: ${opportunity.responseDeadLine}

Provide analysis in JSON format with:
- matchScore (0-100)
- competitionLevel (Low/Medium/High)
- winProbability (Low/Medium/High)
- keyRequirements (array of 3-5 key requirements)
- risks (array of 2-3 potential risks)
- opportunities (array of 2-3 competitive advantages)
- recommendation (one sentence recommendation)`
          }]
        })
      });
      if (!response.ok) return null;
      const data = await response.json();
      const analysisText = data.content[0].text;
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      return null;
    } catch (error) {
      console.error('Error analyzing opportunity:', error);
      return null;
    } finally {
      setAnalyzingOpps(prev => {
        const next = new Set(prev);
        next.delete(opportunity.noticeId);
        return next;
      });
    }
  };

  const handleSaveOpportunity = async (noticeId: string) => {
    if (!isLoggedIn) {
      setShowSignInNudge(true);
      return;
    }
    const opp = allOpportunities.find(o => o.noticeId === noticeId);
    const isCurrentlySaved = savedOpportunities.has(noticeId);

    // Optimistic UI update
    setSavedOpportunities(prev => {
      const next = new Set(prev);
      if (isCurrentlySaved) { next.delete(noticeId); } else { next.add(noticeId); }
      return next;
    });

    try {
      if (USE_MOCK_OPPORTUNITIES) {
        return
      }
      if (isCurrentlySaved) {
        // DELETE from DB
        await fetch(`/api/saved-opportunities/${encodeURIComponent(noticeId)}`, { method: 'DELETE' });
      } else if (opp) {
        // POST to DB with full opportunity data
        await fetch('/api/saved-opportunities', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            noticeId: opp.noticeId,
            title: opp.title,
            solicitationNumber: opp.solicitationNumber,
            department: opp.department,
            postedDate: opp.postedDate,
            responseDeadLine: opp.responseDeadLine,
            naicsCode: opp.naicsCode,
            type: opp.type,
            setAside: opp.typeOfSetAside,
            placeOfPerformance: opp.placeOfPerformance,
            uiLink: opp.uiLink,
            organizationName: opp.fullParentPathName?.split(':')[0]?.trim() || opp.department,
          }),
        });
      }
    } catch (err) {
      // Revert optimistic update on failure
      console.error('Failed to save/unsave opportunity:', err);
      setSavedOpportunities(prev => {
        const next = new Set(prev);
        if (isCurrentlySaved) { next.add(noticeId); } else { next.delete(noticeId); }
        return next;
      });
    }
  };

  const handleViewOpportunity = (noticeId: string) => {
    setViewedOpportunities(prev => new Set(prev).add(noticeId));
  };

  const handleLoadMore = useCallback(() => {
    if (loadingMore) return;
    
    setLoadingMore(true);
    setTimeout(() => {
      setDisplayCount(prev => prev + 30);
      setLoadingMore(false);
    }, 500);
  }, [loadingMore, displayedOpportunities.length]);

  const handleExportOpportunities = () => {
    const header = ['Title', 'Department', 'NAICS', 'Posted Date', 'Deadline', 'Type', 'Link'].join(',');
    const rows = visibleOpportunities.map(opp => [
      `"${opp.title?.replace(/"/g, '""') || ''}"`,
      `"${opp.department?.replace(/"/g, '""') || ''}"`,
      opp.naicsCode || '',
      formatDate(opp.postedDate),
      opp.responseDeadLine ? formatDate(opp.responseDeadLine) : 'No deadline',
      opp.typeOfSetAsideDescription || '',
      opp.uiLink || ''
    ].join(','));
    
    const csvContent = [header, ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `opportunities-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    // Guests: reload from weekly cache or mock — never hit the live API
    if (!isLoggedIn) {
      setRefreshIndicator(true);
      // Try to reload from localStorage cache first
      try {
        const cached = localStorage.getItem('pgc_guest_opps_v1');
        if (cached) {
          const parsed = JSON.parse(cached) as SamOpportunity[];
          if (parsed.length > 0) {
            setAllOpportunities(parsed);
            setDataLoaded(true);
          } else {
            setAllOpportunities(MOCK_OPPORTUNITIES);
          }
        } else {
          setAllOpportunities(MOCK_OPPORTUNITIES);
        }
      } catch {
        setAllOpportunities(MOCK_OPPORTUNITIES);
      }
      setSelectedUrgencyFilters(new Set());
      setActiveFilter(null);
      setKeywordSearch('');
      setSearchTerm('');
      setShowAllOpportunities(false);
      setShowMoreBands({});
      setToast({ type: 'success', msg: 'Opportunities refreshed.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setRefreshIndicator(false), 600);
      return;
    }
    setLoadingMore(true);
    setRefreshIndicator(true);
    try {
      const res = await fetch('/api/sam/opportunities?refresh=1', { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        setAllOpportunities(data.opportunities || []);
        setDisplayCount(250);
        setShowAllOpportunities(false);
        setShowMoreBands({});
        setSelectedUrgencyFilters(new Set());
        setActiveFilter(null);
        setKeywordSearch('');
        setSearchTerm('');
        setToast({ type: 'success', msg: 'Feed refreshed from SAM.gov.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setToast({ type: 'error', msg: 'Failed to refresh feed.' });
      }
    } catch {
      setToast({ type: 'error', msg: 'Failed to refresh feed.' });
    } finally {
      setLoadingMore(false);
      setRefreshIndicator(false);
    }
  };

  const handlePillClick = (type: 'active' | 'setasides' | 'expiring' | 'departments') => {
    if (activeFilter === type) {
      setActiveFilter(null);
    } else {
      setActiveFilter(type);
    }
  };

  // 📌 NEW: Listen for survey completion
  useEffect(() => {
    const handleSurveyCompleted = (event: CustomEvent) => {
      setUserProfile(prev => ({
        ...prev,
        hasCompletedSurvey: true
      }));
      setOpportunityPreferences(event.detail);
    };

    window.addEventListener('surveyCompleted', handleSurveyCompleted as EventListener);
    return () => {
      window.removeEventListener('surveyCompleted', handleSurveyCompleted as EventListener);
    };
  }, []);

  // 📌 FIXED: Set achievement messages based on session
  useEffect(() => {
    if (userName) {
      const randomAchievement = ACHIEVEMENT_MESSAGES[Math.floor(Math.random() * ACHIEVEMENT_MESSAGES.length)];
      const randomTip = PERSONALIZED_TIPS[Math.floor(Math.random() * PERSONALIZED_TIPS.length)];
      setUserAchievement(randomAchievement);
      setUserTip(randomTip);

      setUserProfile(prev => ({
        ...prev,
        first_name: userName
      }));
    } else {
      setUserAchievement('Discover thousands of federal opportunities!');
      setUserTip('Sign up to get personalized matches for your business');
    }
  }, [userName]);

  // 📌 NEW: Listen for preference updates
  useEffect(() => {
    const handlePreferencesUpdate = (event: CustomEvent) => {
      setOpportunityPreferences(event.detail);
      setSurveyOpen(false);
      setToast({ type: 'success', msg: 'Preferences updated! Feed refreshed.' });
      handleRefresh();
    };
    window.addEventListener('preferences-updated' as any, handlePreferencesUpdate);
    const savedPreferences = localStorage.getItem('opportunity-preferences');
    if (savedPreferences) {
      try {
        setOpportunityPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error('Error loading preferences:', e);
      }
    }
    return () => {
      window.removeEventListener('preferences-updated' as any, handlePreferencesUpdate);
    };
  }, []);

  // Γ£à NEW: Check if banner was dismissed in localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed') === 'true';
    setBannerDismissed(dismissed);
    if (dismissed) {
      setShowWelcomeBanner(false);
    }
  }, []);

  // Γ£à NEW: Listen for survey completion to hide banner
  useEffect(() => {
    const handleSurveyCompleted = () => {
      setShowWelcomeBanner(false);
      localStorage.setItem('welcomeBannerDismissed', 'true');
    };
    
    window.addEventListener('surveyCompleted', handleSurveyCompleted);
    return () => window.removeEventListener('surveyCompleted', handleSurveyCompleted);
  }, []);

  // Γ£à NEW: Handle banner dismissal
  const handleDismissBanner = () => {
    setShowWelcomeBanner(false);
    setBannerDismissed(true);
    localStorage.setItem('welcomeBannerDismissed', 'true');
  };

  // Load saved opportunity IDs from DB on mount so bookmarks are persistent
  useEffect(() => {
    if (USE_MOCK_OPPORTUNITIES || !isLoggedIn) return;
    fetch('/api/saved-opportunities')
      .then(r => r.ok ? r.json() : { savedOpportunities: [] })
      .then(data => {
        const ids = (data.savedOpportunities ?? []).map((o: any) => o.notice_id || o.noticeId || o.id);
        if (ids.length > 0) setSavedOpportunities(new Set(ids));
      })
      .catch(err => console.error('Failed to load saved opportunities:', err));
  }, [isLoggedIn]);

  // ── Goal tracker: savedOpportunities.size = opportunities acted on ──────────
  // monthlyGoal is persisted in localStorage so users can customise it
  useEffect(() => {
    const storedGoal = localStorage.getItem('monthly-bid-goal');
    const goal = storedGoal ? Math.max(1, parseInt(storedGoal, 10) || 10) : 10;
    setUserProfile(prev => ({
      ...prev,
      monthlyGoal: goal,
      achievedThisMonth: savedOpportunities.size,
    }));
  }, [savedOpportunities]);

  // On login, load a standard set of live opportunities (filtered by preferences and due date if possible). Never show mock data for logged-in users.
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!isLoggedIn) return;
    if (allOpportunities.length === 0 && !error) {
      // Initial load: fetch a standard set of live opportunities (e.g., 40, filtered by preferences and due date)
      const fetchInitialOpportunities = async () => {
        setLoading(true);
        try {
          // Example: filter by preferences and due date (customize as needed)
          let url = '/api/sam/opportunities?limit=40';
          if (opportunityPreferences?.naicsCodes?.length) {
            url += `&naics=${encodeURIComponent(opportunityPreferences.naicsCodes[0])}`;
          }
          url += '&status=active';
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            setAllOpportunities(data.opportunities || []);
            setFilteredOpportunities(data.opportunities || []);
            setDisplayedOpportunities(data.opportunities || []);
            setTotalRecords(data.opportunities?.length || 0);
            setDataLoaded(true);
            setDataSource('live');
            setApiStatus({ status: res.status, statusText: res.statusText, message: 'Success' });
          } else {
            const text = await res.text();
            setError('Unable to load opportunities. Please try Refresh.');
            setApiStatus({ status: res.status, statusText: res.statusText, message: text });
          }
        } catch (err: any) {
          setError('Unable to load opportunities. Please try Refresh.');
          setApiStatus({ status: null, statusText: 'Network Error', message: err?.message || String(err) });
        } finally {
          setLoading(false);
        }
      };
      fetchInitialOpportunities();
    }
  }, [isLoggedIn, sessionStatus, viewMode, allOpportunities.length, error, opportunityPreferences]);

    // Fetch ALL opportunities from SAM.gov

  // Auto-fetch from SAM.gov is disabled to conserve API quota. Use the Refresh button to fetch live data.
  // useEffect(() => {
  //   ...existing code...
  // }, [dataLoaded, dataSource, isLoggedIn, sessionStatus]);

  // Apply filters whenever dependencies change
  const DEFAULT_DISPLAY_COUNT = 96;

  // Sort helper — applied after filtering
  const sortOpportunities = useCallback((opps: SamOpportunity[], mode: SortMode): SamOpportunity[] => {
    const arr = [...opps];
    switch (mode) {
      case 'deadline_asc':
        return arr.sort((a, b) => (getBusinessDaysUntil(getEffectiveDeadline(a)) ?? 9999) - (getBusinessDaysUntil(getEffectiveDeadline(b)) ?? 9999));
      case 'deadline_desc':
        return arr.sort((a, b) => (getBusinessDaysUntil(getEffectiveDeadline(b)) ?? -1) - (getBusinessDaysUntil(getEffectiveDeadline(a)) ?? -1));
      case 'posted_desc':
        return arr.sort((a, b) => new Date(getEffectivePostedDate(b)).getTime() - new Date(getEffectivePostedDate(a)).getTime());
      case 'posted_asc':
        return arr.sort((a, b) => new Date(getEffectivePostedDate(a)).getTime() - new Date(getEffectivePostedDate(b)).getTime());
      case 'title_asc':
        return arr.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
      case 'agency_asc':
        return arr.sort((a, b) => (a.department || '').localeCompare(b.department || ''));
      default:
        return arr;
    }
  }, []);

  useEffect(() => {
    // For logged-out users, always use mock data — never allow live data to leak in
    if (!isLoggedIn) {
      const mockData = MOCK_OPPORTUNITIES;
      if (allOpportunities !== mockData && allOpportunities.length !== mockData.length) {
        setAllOpportunities(mockData);
      }
      if (!dataLoaded) {
        setDataLoaded(true);
        setLastUpdated('Just now');
      }
      const filtered = sortOpportunities(
        applyFilters(mockData, filterParam, searchTerm, selectedType, selectedSetAside,
          activeFilter, selectedAgency, selectedNAICS, selectedUrgency, selectedUrgencyFilters, showAllOpportunities),
        sortMode
      );
      setFilteredOpportunities(filtered);
      setDisplayedOpportunities(filtered);
      setDisplayCount(filtered.length);
      return;
    }
    if (dataLoaded) {
      const filtered = sortOpportunities(
        applyFilters(allOpportunities, filterParam, searchTerm, selectedType, selectedSetAside,
          activeFilter, selectedAgency, selectedNAICS, selectedUrgency, selectedUrgencyFilters, showAllOpportunities),
        sortMode
      );
      setFilteredOpportunities(filtered);
      setDisplayedOpportunities(filtered);
      setDisplayCount(filtered.length);
    }
  }, [
    allOpportunities, filterParam, searchTerm, selectedType, selectedSetAside,
    dataLoaded, activeFilter, applyFilters, sortOpportunities, selectedAgency, selectedNAICS,
    selectedUrgency, selectedUrgencyFilters, showAllOpportunities, isLoggedIn, opportunityPreferences, sortMode
  ]);

  // 📌 NEW: Personalized stats
  const personalizedStats = useMemo(() => {
    if (!dataLoaded || !userProfile) return null;
    
    return {
      matchedToProfile: allOpportunities.filter(opp =>
        userProfile.naicsCodes?.some(code => opp.naicsCode?.includes(code)) ||
        userProfile.certifications?.some(cert => opp.typeOfSetAsideDescription?.includes(cert))
      ).length,
      favoriteAgencyMatches: allOpportunities.filter(opp =>
        userProfile.favoriteAgencies?.some(agency => opp.department?.includes(agency))
      ).length,
      goalProgress: userProfile.monthlyGoal ?
        Math.min(100, Math.round(((userProfile.achievedThisMonth || 0) / userProfile.monthlyGoal) * 100)) : 0
    };
  }, [dataLoaded, userProfile, allOpportunities]);

  // Normalize search term: expand common synonyms to match actual field values
  const normalizeSearch = (raw: string): string[] => {
    const t = raw.trim().toLowerCase();
    // Map human phrases ΓåÆ actual field value fragments
    const SYNONYMS: Record<string, string[]> = {
      'set-aside': ['sba','sbp','wosb','sdvosb','sdvosbc','8a','hubzone','hzc','vosb','vsa','edwosb'],
      'setaside': ['sba','sbp','wosb','sdvosbc','8a','hubzone','hzc','vosb'],
      'small business': ['sba','sbp','small business'],
      'veteran': ['sdvosbc','sdvosbs','vsa','vss','veteran'],
      'sdvosb': ['sdvosbc','sdvosbs','service-disabled'],
      'vosb': ['vsa','vss','veteran-owned'],
      'women': ['wosb','edwosb','women-owned'],
      'wosb': ['wosb','wosbss','women-owned'],
      'hubzone': ['hzc','hzs','historically underutilized'],
      '8a': ['8a','8an'],
      'indian': ['iee','isbee','bicivc','indian'],
      'sole source': ['sole','8an','hzs','sdvosbs','wosbss'],
    };
    if (SYNONYMS[t]) return SYNONYMS[t];
    // Partial match on synonym keys
    for (const [key, vals] of Object.entries(SYNONYMS)) {
      if (t.includes(key) || key.includes(t)) return [...vals, t];
    }
    return [t];
  };

  const searchTerms = normalizeSearch(keywordSearch || searchTerm);

  // Board source: same as keywordFiltered but urgency filter handled by column dimming
  const boardFiltered = useMemo(() => {
    const terms = normalizeSearch(keywordSearch || searchTerm);
    // ✅ FIX: Use displayedOpportunities (preferences-filtered) as base, not allOpportunities
    // This ensures the board respects the same filter as the list/compact views
    let base = (showAllOpportunities ? allOpportunities : displayedOpportunities)
      .filter(opp => !opp.noticeId.startsWith('placeholder'));
    // Apply non-urgency filters from applyFilters manually
    if (activeFilter === 'setasides') base = base.filter(o => hasSetAside(o));
    if (activeFilter === 'expiring') {
      const nw = new Date(); nw.setDate(nw.getDate() + 7);
      base = base.filter(o => { const d = getEffectiveDeadline(o); return d && d <= nw && d >= new Date(); });
    }
    if (terms.length === 0 || (terms.length === 1 && terms[0] === '')) return base;
    return base.filter(opp => {
      const fields = [
        opp.title, opp.department, opp.solicitationNumber, opp.naicsCode,
        opp.classificationCode, opp.typeOfSetAsideDescription, opp.typeOfSetAside,
        (opp as any).setAside, opp.officeAddress?.city, opp.officeAddress?.state,
        opp.fullParentPathName,
        ...(opp.pointOfContact?.map(p => [p.fullname, p.email].join(' ')) || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return terms.some(t => t && fields.includes(t));
    });
  }, [displayedOpportunities, allOpportunities, showAllOpportunities, keywordSearch, searchTerm, activeFilter]);

  // Combined search across ALL static SAM.gov fields with synonym expansion
  const keywordFiltered = useMemo(() => {
    const terms = normalizeSearch(keywordSearch || searchTerm);
    if (terms.length === 0 || (terms.length === 1 && terms[0] === '')) return displayedOpportunities;
    return displayedOpportunities.filter(opp => {
      const fields = [
        opp.title,
        opp.department,
        opp.solicitationNumber,
        opp.naicsCode,
        opp.classificationCode,
        opp.typeOfSetAsideDescription,
        opp.typeOfSetAside,
        (opp as any).setAside,
        opp.type,
        opp.organizationType,
        opp.fullParentPathName,
        opp.officeAddress?.city,
        opp.officeAddress?.state,
        opp.officeAddress?.zip,
        opp.placeOfPerformance?.city?.name,
        opp.placeOfPerformance?.state?.name,
        opp.placeOfPerformance?.state?.code,
        opp.placeOfPerformance?.zip,
        ...(opp.pointOfContact?.map(p => [p.fullname, p.email, p.title].join(' ')) || []),
      ].filter(Boolean).join(' ').toLowerCase();
      return terms.some(t => t && fields.includes(t));
    });
  }, [displayedOpportunities, keywordSearch, searchTerm]);
  // visibleOpportunities: the actual set shown in list/compact views.
  // For guests, cap at MOCK_OPPORTUNITIES.length (no duplication/padding).
  // For logged-in users, respect displayCount.
  const visibleOpportunities = !isLoggedIn
    ? keywordFiltered          // guests see all mock data (16 items)
    : keywordFiltered.slice(0, displayCount);
  const hasMore = !isLoggedIn
    ? false  // guests always see all mock items — no "load more"
    : showAllOpportunities
      ? displayCount < allOpportunities.length
      : displayCount < displayedOpportunities.length;

  // 📌 NEW: Group opportunities by selected criteria
  const groupedOpportunities = useMemo(() => {
    if (groupMode === 'none') {
      return { 'All Opportunities': visibleOpportunities };
    }

    const groups: Record<string, SamOpportunity[]> = {};

    visibleOpportunities.forEach(opp => {
      let groupKey = 'Other';

      switch (groupMode) {
        case 'department':
          groupKey = opp.department || 'Other';
          break;

        case 'urgency': {
          const deadline = getEffectiveDeadline(opp);
          if (!deadline) {
            groupKey = 'No Deadline';
          } else {
            const bd = getBusinessDaysUntil(deadline);
            groupKey = getUrgencyLabel(bd ?? 999);
          }
          break;
        }
        case 'setaside':
          groupKey = opp.typeOfSetAsideDescription || 'Unrestricted / No Set-Aside';
          break;

        case 'naics':
          groupKey = opp.naicsCode ? `NAICS ${opp.naicsCode.slice(0, 4)}xx` : 'Unknown NAICS';
          break;

        case 'state':
          groupKey = opp.placeOfPerformance?.state?.code
            ? `${opp.placeOfPerformance.state.code} — ${opp.placeOfPerformance.state.name || ''}`
            : opp.officeAddress?.state || 'Location TBD';
          break;

        case 'deadline_month': {
          const dl = getEffectiveDeadline(opp);
          groupKey = dl
            ? dl.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
            : 'No Deadline';
          break;
        }
      }

      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(opp);
    });

    if (groupMode === 'urgency') {
      const urgencyOrder = ['CRITICAL', 'URGENT', 'HIGH PRIORITY', 'ACT SOON', 'NORMAL', 'COMFORTABLE', 'AMPLE TIME', 'PLENTY OF TIME', 'No Deadline'];
      return Object.fromEntries(Object.entries(groups).sort((a, b) => urgencyOrder.indexOf(a[0]) - urgencyOrder.indexOf(b[0])));
    }
    if (groupMode === 'deadline_month') {
      return Object.fromEntries(Object.entries(groups).sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime()));
    }
    // All other modes: alpha sort by key
    return Object.fromEntries(Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0])));
  }, [visibleOpportunities, groupMode]);

  // Reminder to set preferences — only shown to guests (logged-in users are never interrupted)
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (isLoggedIn) return; // ← never auto-pop for authenticated users
    const alreadyShown = sessionStorage.getItem('prefsReminderShown');
    if (alreadyShown) return;
    const timer = setTimeout(() => {
      setShowPrefsReminder(true);
      sessionStorage.setItem('prefsReminderShown', '1');
    }, 90 * 1000); // 90 sec for guests only
    return () => clearTimeout(timer);
  }, [isLoggedIn, sessionStatus]);

  // Show full-screen loading when first fetching and no real data yet
  if (loading && allOpportunities.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-cyan-400" />
          <h2 className="text-2xl font-bold text-white mb-2">Loading Federal Opportunities</h2>
          <p className="text-slate-300">Fetching live data from SAM.gov...</p>
        </div>
      </div>
    );
  }


  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 pb-40 [&_.text-xs]:text-sm [&_.text-sm]:text-base [&_.text-base]:text-[1.25rem] [&_.text-lg]:text-[1.4rem]">
      {/* Header with status */}
      {/* API Status Banner */}
      {apiStatus && (
        <div className="w-full bg-orange-100 border-b border-orange-300 text-orange-900 text-center py-2 text-sm font-semibold">
          SAM.gov API Response: {apiStatus.status ? `${apiStatus.status} ${apiStatus.statusText}` : apiStatus.statusText}
          {apiStatus.message && apiStatus.message !== 'Success' && (
            <span className="ml-2 text-xs text-orange-700">{apiStatus.message.slice(0, 120)}</span>
          )}
        </div>
      )}
      <div className="border-b border-white/5 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${dataLoaded ? 'bg-emerald-400' : error ? 'bg-orange-400 animate-pulse' : 'bg-amber-400 animate-pulse'}`}></div>
                <span>Last updated: <span className="font-semibold text-slate-300">{lastUpdated}</span></span>
                {!dataLoaded && (
                  <span className="text-amber-400 text-sm flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing live data...
                  </span>
                )}
                {refreshIndicator && (
                  <span className="text-cyan-400 text-sm flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Refreshing...
                  </span>
                )}
                {error && (
                  <span className="text-orange-400 text-sm flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Error loading from SAM.gov
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-medium text-white">
                  {error ? (
                    <span className="text-white">SAM.gov API Unavailable (sample data)</span>
                  ) : dataLoaded ? (
                    'Live data from SAM.gov'
                  ) : (
                    'Loading from SAM.gov...'
                  )}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {userProfile && (
                <div
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/40 bg-white/10 shadow-lg shadow-black/10 cursor-pointer hover:bg-white/20 transition-colors"
                  title="Click to change your monthly goal"
                  onClick={() => {
                    const current = userProfile.monthlyGoal || 10;
                    const input = window.prompt(`Set your monthly opportunity goal:`, String(current));
                    if (input === null) return;
                    const newGoal = Math.max(1, parseInt(input, 10) || current);
                    localStorage.setItem('monthly-bid-goal', String(newGoal));
                    setUserProfile(prev => ({ ...prev, monthlyGoal: newGoal }));
                  }}
                >
                  <TargetIcon className="w-3 h-3 text-white" />
                  <span className="text-xs font-semibold text-white">
                    Goal: {userProfile.achievedThisMonth || 0}/{userProfile.monthlyGoal || 10} this month
                  </span>
                </div>
              )}
              <button
                onClick={handleExportOpportunities}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium text-slate-200 transition backdrop-blur-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <button
                onClick={() => window.location.href = '/insights'}
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 px-4 py-2.5 text-sm font-medium text-slate-200 transition backdrop-blur-sm"
              >
                <LineChart className="h-4 w-4" />
                <span className="hidden sm:inline">Insights</span>
              </button>
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                    setShowSignInNudge(true);
                    return;
                  }
                  setSurveyOpen(true);
                }}
                disabled={!isLoggedIn}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 px-4 py-2.5 text-sm font-bold text-white transition shadow-lg hover:shadow-xl disabled:opacity-50"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Update Preferences</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshIndicator}
                className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-slate-200 text-sm font-medium transition-colors disabled:opacity-50 border border-white/10"
              >
                <RefreshCw className={`w-4 h-4 ${refreshIndicator ? 'animate-spin' : ''}`} />
                {refreshIndicator ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="border-b border-orange-200 bg-white">
          <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-[#ff7a18]" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-[#ff7a18] mb-1">
                  Service temporarily unavailable
                </h3>
                <p className="text-sm text-[#ff7a18] leading-relaxed">
                  The federal opportunities service is temporarily unavailable. Please wait a few minutes and then click <b>Refresh</b> above to try again. All interactive features remain available.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

{/* ticker sample feed banner removed */}

      <div className="max-w-[1920px] mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-2">

        {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
        {isLoggedIn ? (
          /* Signed-in: compact single bar */
          <div className="mb-3 px-4 py-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-4" style={{ fontFamily: 'Aptos, Inter, Arial, sans-serif' }}>
            <div className="flex items-center gap-3 min-w-0">
              <Image src="/logo.png" alt="PreciseGovCon" width={40} height={40} className="w-9 h-9 object-contain flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide leading-none mb-0.5">
                  {(() => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night'; })()}
                  {userName ? `, ${userName}` : ''}
                </p>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 leading-tight" style={{ fontFamily: 'Aptos, Inter, Arial, sans-serif' }}>
                  Welcome to your streamlined opportunities dashboard
                </h1>
              </div>
            </div>
            <div className="flex-shrink-0 text-right hidden sm:block">
              <p className="text-xs text-slate-400 leading-none mb-0.5">Powered by</p>
              <p className="text-sm font-extrabold text-[#ff7a18] leading-none">
                PreciseGovCon<sup className="text-[10px] font-bold text-slate-400"> ®</sup> Contract Intelligence
              </p>
            </div>
          </div>
        ) : (
          /* Guest: two-column CTA card */
          <div className="mb-3 bg-white rounded-xl border border-amber-200 overflow-hidden" style={{ fontFamily: 'Aptos, Inter, Arial, sans-serif' }}>
            <div className="flex flex-col sm:flex-row">
              {/* Left: context */}
              <div className="flex-1 px-5 py-4 flex items-start gap-3">
                <Image src="/logo.png" alt="PreciseGovCon" width={44} height={44} className="w-10 h-10 object-contain flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 border border-amber-300 text-amber-700 text-[11px] font-black uppercase tracking-wider">
                      ⚠ Sample Data
                    </span>
                    {guestDataLoading ? (
                      <span className="inline-flex items-center gap-1.5 text-cyan-600 text-xs font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading from SAM.gov…
                      </span>
                    ) : (
                      <span className="text-slate-400 text-xs">
                        {guestDataFreshAt ? `Live SAM.gov data · refreshed ${guestDataFreshAt}` : 'Preview mode — not tailored to your business'}
                      </span>
                    )}
                  </div>
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    You're viewing a sample pull of live data from SAM.gov opportunities.
                  </h1>
                  <p className="text-sm text-slate-600 mt-0.5 leading-snug">
                    Sign in to unlock a feed filtered by your <strong>NAICS codes</strong>, <strong>PSC codes</strong>, certifications, and agency preferences — powered by <span className="text-[#ff7a18] font-extrabold">PreciseGovCon<sup className="text-[10px]"> ®</sup></span> Opportunity Intelligence.
                  </p>
                </div>
              </div>
              {/* Right: CTA */}
              <div className="flex-shrink-0 flex flex-col items-center justify-center gap-2 px-6 py-4 bg-gradient-to-br from-[#ff7a18]/10 to-amber-50 border-t sm:border-t-0 sm:border-l border-amber-200">
                <a
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#ff7a18] hover:bg-orange-600 text-white font-extrabold rounded-xl transition-all shadow-md hover:shadow-lg text-sm whitespace-nowrap"
                >
                  Sign In to Get Your Feed
                </a>
                <a
                  href="/register"
                  className="text-xs text-slate-500 hover:text-[#ff7a18] transition-colors font-semibold underline underline-offset-2"
                >
                  New to PreciseGovCon? Create a free account
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Banner — shown to logged-in users who haven't completed survey */}
        {isLoggedIn && showWelcomeBanner && !userProfile.hasCompletedSurvey && (
          <div className="mb-3 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 relative overflow-hidden" style={{ fontFamily: 'Aptos, Inter, Arial, sans-serif' }}>
            {/* Subtle top accent bar */}
            <div className="h-0.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-[#ff7a18]" />
            <button onClick={handleDismissBanner} className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 pr-12">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-extrabold text-white leading-tight">
                  Welcome to PreciseGovCon's Opportunities Pipeline
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Your streamlined federal contracting platform — powered by live SAM.gov data and AI-driven matching.
                  {userName ? ` Complete your profile, ${userName}, to activate your personalized feed.` : ' Complete your profile to activate your personalized feed.'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => setSurveyOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg transition-all shadow-md text-sm whitespace-nowrap"
                >
                  <Settings className="w-4 h-4" />
                  Set My Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Survey Success Banner */}
        {isLoggedIn && userProfile.hasCompletedSurvey && !bannerDismissed && (
          <div className="mb-3 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 relative overflow-hidden">
            <div className="h-0.5 w-full bg-gradient-to-r from-emerald-500 to-cyan-500" />
            <button onClick={handleDismissBanner} className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 pr-12">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-extrabold text-white leading-tight">
                  Your Feed is Active{userName ? `, ${userName}` : ''}
                </h2>
                <p className="text-sm text-slate-400 mt-0.5">
                  Showing {displayedOpportunities.length} opportunities matched to your profile. Update preferences anytime to refine your results.
                </p>
              </div>
              <button onClick={() => setSurveyOpen(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-300 font-bold rounded-lg transition-all text-sm whitespace-nowrap flex-shrink-0">
                <Settings className="w-4 h-4" />
                Update Preferences
              </button>
            </div>
          </div>
        )}

        {/* 📌 ACCURATE STATS PILLS - Interactive */}
        <div className="mb-2 flex gap-2">
          {[
            { filter: 'active' as const,      icon: <CheckCircle2 className="w-3.5 h-3.5" />, value: stats.totalActive, label: 'Active',        accent: 'text-emerald-400', border: 'border-emerald-700', activeBg: 'bg-emerald-500/10' },
            { filter: 'setasides' as const,    icon: <Award className="w-3.5 h-3.5" />,        value: stats.setAsides,   label: 'Set-Asides',   accent: 'text-violet-400',  border: 'border-violet-700',  activeBg: 'bg-violet-500/10'  },
            { filter: 'expiring' as const,     icon: <Timer className="w-3.5 h-3.5" />,        value: stats.closingSoon, label: 'Closing ≤7d',  accent: 'text-rose-400',    border: 'border-rose-700',    activeBg: 'bg-rose-500/10'    },
            { filter: 'departments' as const,  icon: <Building2 className="w-3.5 h-3.5" />,    value: stats.departments, label: 'Agencies',     accent: 'text-teal-400',    border: 'border-teal-700',    activeBg: 'bg-teal-500/10'    },
          ].map(s => (
            <button key={s.filter} onClick={() => handlePillClick(s.filter)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-left transition-all flex-1 ${
                activeFilter === s.filter ? `${s.activeBg} ${s.border}` : 'bg-slate-800/40 border-slate-700 hover:border-slate-500'
              }`}>
              <span className={s.accent}>{s.icon}</span>
              <span className="text-white font-black text-sm">{s.value.toLocaleString()}</span>
              <span className="text-slate-400 text-xs font-medium">{s.label}</span>
            </button>
          ))}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-700 bg-amber-500/10 flex-1">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-white font-black text-sm">{stats.postedToday.toLocaleString()}</span>
            <span className="text-amber-400 text-xs font-medium">Posted Today</span>
          </div>
        </div>

        {/* 📌 PROMINENT SEARCH BAR - White background, enhanced visibility */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-slate-600 w-6 h-6" />
            <input
              type="text"
              placeholder="🔍 Search title, department, NAICS, set-aside, solicitation #, city, state, contact name, org path..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setKeywordSearch(e.target.value); }}
              className="w-full pl-16 pr-16 py-5 bg-white text-slate-900 border-2 border-slate-300 rounded-2xl placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-cyan-500 focus:border-transparent transition-all text-lg font-medium shadow-xl"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); setKeywordSearch(''); }}
                className="absolute right-5 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors bg-slate-200 hover:bg-slate-300 rounded-full p-2"
              >
                <XCircle className="w-5 h-5" />
              </button>
            )}
          </div>
          {(searchTerm || keywordSearch) && (
            <p className="mt-1 text-xs text-cyan-400 pl-1">
              {keywordFiltered.length === 0 
                ? `No results for "${searchTerm || keywordSearch}" ΓÇö try: veteran, army, wosb, 8a, hubzone, or a state abbreviation`
                : `${keywordFiltered.length} result${keywordFiltered.length !== 1 ? 's' : ''} for "${searchTerm || keywordSearch}"`
              }
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-400">
            <span className="flex items-center gap-1"><Search className="w-3 h-3" /> Searchable fields:</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Title</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Department / Org</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Solicitation #</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">NAICS</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Set-Aside Code</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">City / State / Zip</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Contact Name</span>
            <span className="px-2 py-1 bg-slate-800 rounded-md">Full Org Path</span>
          </div>
        </div>

        {/* ── View / Sort / Group Controls ─────────────────────────────────── */}
        <div className="mb-2 flex flex-wrap items-center gap-2 p-2.5 bg-slate-900/70 rounded-xl border border-slate-700/60">

          {/* View mode */}
          <div className="flex items-center gap-1 p-0.5 bg-slate-800/80 rounded-lg border border-slate-700/50">
            {([
              { mode: 'list' as ViewMode, icon: <List className="w-3.5 h-3.5" />, label: 'List' },
              { mode: 'grid' as ViewMode, icon: <Grid3x3 className="w-3.5 h-3.5" />, label: 'Board' },
              { mode: 'compact' as ViewMode, icon: <Layers className="w-3.5 h-3.5" />, label: 'Compact' },
            ] as {mode: ViewMode; icon: React.ReactNode; label: string}[]).map(v => (
              <button
                key={v.mode}
                onClick={() => { setViewMode(v.mode); if (v.mode === 'grid') setGroupMode('none'); }}
                style={{
                  background: viewMode === v.mode ? '#0e7490' : 'transparent',
                  color: viewMode === v.mode ? '#fff' : '#94a3b8',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 11px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '5px',
                  transition: 'all 0.15s',
                  boxShadow: viewMode === v.mode ? '0 1px 6px rgba(14,116,144,0.5)' : 'none',
                }}
              >
                {v.icon}{v.label}
              </button>
            ))}
          </div>

          <div className="w-px h-6 bg-slate-700/60 hidden sm:block" />

          {/* Sort */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:inline">Sort</span>
            <select
              value={sortMode}
              onChange={e => setSortMode(e.target.value as SortMode)}
              style={{
                background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155',
                borderRadius: '7px', padding: '5px 28px 5px 10px', fontSize: '12px',
                fontWeight: 600, cursor: 'pointer', outline: 'none',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
              }}
            >
              <option value="deadline_asc">⏰ Deadline: Soonest First</option>
              <option value="deadline_desc">⏰ Deadline: Latest First</option>
              <option value="posted_desc">📅 Posted: Newest First</option>
              <option value="posted_asc">📅 Posted: Oldest First</option>
              <option value="title_asc">🔤 Title: A → Z</option>
              <option value="agency_asc">🏛 Agency: A → Z</option>
            </select>
          </div>

          {/* Group By — only for list/compact */}
          {viewMode !== 'grid' && (
            <>
              <div className="w-px h-6 bg-slate-700/60 hidden sm:block" />
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:inline">Group</span>
                <select
                  value={groupMode}
                  onChange={e => setGroupMode(e.target.value as GroupMode)}
                  style={{
                    background: '#1e293b', color: '#cbd5e1', border: '1px solid #334155',
                    borderRadius: '7px', padding: '5px 28px 5px 10px', fontSize: '12px',
                    fontWeight: 600, cursor: 'pointer', outline: 'none',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%2394a3b8'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 8px center',
                  }}
                >
                  <option value="none">No Grouping</option>
                  <option value="urgency">Deadline Urgency</option>
                  <option value="deadline_month">Deadline Month</option>
                  <option value="department">Agency / Department</option>
                  <option value="setaside">Set-Aside Type</option>
                  <option value="naics">NAICS Code (4-digit)</option>
                  <option value="state">Place of Performance</option>
                </select>
              </div>
            </>
          )}

          {/* Spacer + Preferences nudge for guests */}
          <div className="flex-1" />
          {!isLoggedIn && (
            <a
              href="/login"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '5px 13px',
                background: 'rgba(255,122,24,0.12)',
                border: '1px solid rgba(255,122,24,0.4)',
                borderRadius: '7px',
                color: '#fb923c',
                fontSize: '12px', fontWeight: 700,
                textDecoration: 'none',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              <Settings className="w-3.5 h-3.5" />
              Sign in to update preferences
            </a>
          )}
        </div>

        {/* EXPANDED URGENCY LEGEND - Positioned immediately above results */}
        <div className="mb-2 p-2 bg-slate-800/60 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <Timer className="w-6 h-6 text-cyan-400" />
              <h3 className="text-base font-black text-white tracking-wide">Submission Deadline</h3>
              <span className="px-3 py-1 bg-slate-900 rounded-full text-sm font-bold" style={{color:"#ff6a00"}}>
                Business Days Remaining
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Show All toggle */}
              <button
                onClick={() => {
                  const next = !showAllOpportunities;
                  setShowAllOpportunities(next);
                  setDisplayCount(next ? 999999 : 250);
                  if (next) {
                    setShowMoreBands({ CRITICAL: true, URGENT: true, HIGH: true, 'ACT SOON': true, NORMAL: true, COMFORTABLE: true, AMPLE: true, PLENTY: true });
                  } else {
                    setShowMoreBands({});
                  }
                }}
                style={{
                  background: showAllOpportunities ? '#166534' : '#1e293b',
                  color: showAllOpportunities ? '#86efac' : '#f97316',
                  border: showAllOpportunities ? '1.5px solid #22c55e' : '1.5px solid rgba(249,115,22,0.6)',
                  fontWeight: 700,
                  fontSize: '12px',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  letterSpacing: '0.01em',
                }}
              >
                {showAllOpportunities ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    All {allOpportunities.length} Loaded
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
                    </svg>
                    Show All
                  </>
                )}
              </button>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={loadingMore}
                style={{
                  background: loadingMore ? '#0f172a' : '#1e293b',
                  color: loadingMore ? '#38bdf8' : '#94a3b8',
                  border: loadingMore ? '1.5px solid #0284c7' : '1.5px solid #334155',
                  fontWeight: 700,
                  fontSize: '12px',
                  borderRadius: '8px',
                  padding: '7px 14px',
                  transition: 'all 0.2s',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  opacity: loadingMore ? 0.8 : 1,
                }}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMore ? 'animate-spin' : ''}`} />
                {loadingMore ? 'Refreshing…' : 'Refresh'}
              </button>

              {selectedUrgencyFilters.size > 0 && (
                <button
                  onClick={() => setSelectedUrgencyFilters(new Set())}
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    color: '#f87171',
                    border: '1.5px solid rgba(239,68,68,0.35)',
                    fontWeight: 700, fontSize: '12px',
                    borderRadius: '8px', padding: '7px 12px',
                    cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px',
                  }}
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
            {([
              { label: 'CRITICAL',    range: '≤3 days',    hdr: '#dc2626', dark: '#7f1d1d', glow: 'rgba(220,38,38,0.7)'   },
              { label: 'URGENT',      range: '4-5 days',   hdr: '#ea580c', dark: '#7c2d12', glow: 'rgba(234,88,12,0.7)'   },
              { label: 'HIGH',        range: '6-7 days',   hdr: '#d97706', dark: '#78350f', glow: 'rgba(217,119,6,0.7)'   },
              { label: 'ACT SOON',    range: '8-10 days',  hdr: '#ca8a04', dark: '#713f12', glow: 'rgba(202,138,4,0.7)'   },
              { label: 'NORMAL',      range: '11-14 days', hdr: '#65a30d', dark: '#365314', glow: 'rgba(101,163,13,0.7)'  },
              { label: 'COMFORTABLE', range: '15-21 days', hdr: '#16a34a', dark: '#14532d', glow: 'rgba(22,163,74,0.7)'   },
              { label: 'AMPLE',       range: '22-30 days', hdr: '#059669', dark: '#064e3b', glow: 'rgba(5,150,105,0.7)'   },
              { label: 'PLENTY',      range: '31+ days',   hdr: '#0d9488', dark: '#134e4a', glow: 'rgba(13,148,136,0.7)'  },
            ] as Array<{label:string;range:string;hdr:string;dark:string;glow:string}>).map((item) => {
              const isActive = selectedUrgencyFilters.has(item.label);
              return (
                <button
                  key={item.label}
                  onClick={() => setSelectedUrgencyFilters(prev => {
                    const next = new Set(prev);
                    if (next.has(item.label)) { next.delete(item.label); } else { next.add(item.label); }
                    return next;
                  })}
                  style={{
                    /* Always show the vivid column color — full saturation like the board headers */
                    background: isActive
                      ? item.hdr
                      : `linear-gradient(160deg, ${item.hdr}cc 0%, ${item.dark} 100%)`,
                    border: `2px solid ${isActive ? 'rgba(255,255,255,0.5)' : item.hdr}`,
                    borderRadius: '8px',
                    color: 'white',
                    padding: '8px 6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isActive
                      ? `0 0 22px ${item.glow}, 0 4px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.25)`
                      : `0 2px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)`,
                    transform: isActive ? 'scale(1.07) translateY(-1px)' : 'scale(1)',
                    outline: 'none',
                    textAlign: 'center' as const,
                    width: '100%',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = item.hdr;
                      el.style.boxShadow = `0 0 16px ${item.glow}, 0 4px 10px rgba(0,0,0,0.5)`;
                      el.style.transform = 'scale(1.04) translateY(-1px)';
                    }
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLButtonElement;
                      el.style.background = `linear-gradient(160deg, ${item.hdr}cc 0%, ${item.dark} 100%)`;
                      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.12)';
                      el.style.transform = 'scale(1)';
                    }
                  }}
                >
                  <div style={{ fontSize: '10px', fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1, textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>{item.label}</div>
                  <div style={{ fontSize: '10px', fontWeight: 600, opacity: 0.9, lineHeight: 1, marginTop: '3px', textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>{item.range}</div>
                  {isActive && (
                    <div style={{ fontSize: '8px', fontWeight: 900, marginTop: '4px', color: 'white', letterSpacing: '0.06em', background: 'rgba(0,0,0,0.25)', borderRadius: '3px', padding: '1px 4px', display: 'inline-block' }}>✓ ON</div>
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-slate-400 text-center">
            {selectedUrgencyFilters.size > 0
              ? `Γ£ô Active filters: ${Array.from(selectedUrgencyFilters).join(' ┬╖ ')} ΓÇö click to deselect`
              : 'Click one or more deadline categories to filter. Multi-select supported.'}
          </p>
        </div>



        {/* Results Header */}
        <div ref={resultsRef} className="mb-2 flex items-center justify-between flex-wrap gap-2">
          {!isLoggedIn ? (
            /* Guest CTA bar */
            <div className="flex items-center gap-3 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-black uppercase tracking-wider">
                ⚠ Sample Data
              </span>
              {guestDataLoading ? (
                <span className="inline-flex items-center gap-2 text-cyan-400 text-sm font-semibold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Fetching opportunities from SAM.gov…
                </span>
              ) : (
                <span className="text-slate-300 text-sm font-semibold">
                  Showing <span className="text-cyan-400 font-bold">{viewMode === 'grid' ? boardFiltered.length : visibleOpportunities.length}</span> opportunities
                  {guestDataFreshAt && <span className="text-slate-500 text-xs ml-1.5">· data from {guestDataFreshAt}</span>}
                </span>
              )}
              <span className="text-slate-500 text-sm hidden sm:inline">—</span>
              <a href="/login" className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#ff7a18] hover:bg-orange-600 text-white text-xs font-extrabold rounded-lg transition-colors shadow-sm whitespace-nowrap">
                Sign in for your personalized feed →
              </a>
            </div>
          ) : visibleOpportunities.length === 0 && displayedOpportunities.length === 0 ? (
            <h3 className="text-xl font-bold text-white">
              <span className="text-slate-300">
                No opportunities available at this time. Click <b>Refresh</b> to try again.
              </span>
            </h3>
          ) : (
            <h3 className="text-xl font-bold text-white">
              {(() => {
                const h = new Date().getHours();
                const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : h < 21 ? 'Good evening' : 'Good night';
                return (
                  <span className="text-slate-300 font-normal text-base">
                    {greeting}{userName ? <>, <span className="text-[#ff7a18] font-extrabold">{userName}</span></> : ''}
                    {' '}—{' '}
                  </span>
                );
              })()}
              Showing{' '}
              <span className="text-cyan-400">
                {(viewMode === 'grid' ? boardFiltered.length : visibleOpportunities.length).toLocaleString()}
              </span>
              {displayedOpportunities.length !== allOpportunities.length && (
                <> of <span className="text-cyan-400">{allOpportunities.length.toLocaleString()}</span> available</>
              )}
              {opportunityPreferences && !showAllOpportunities
                ? <span className="text-slate-400 font-normal text-base"> curated opportunities</span>
                : <span className="text-slate-400 font-normal text-base"> opportunities</span>
              }
              {opportunityPreferences && !showAllOpportunities && displayedOpportunities.length < allOpportunities.length && (
                <span className="ml-2 text-sm font-normal text-amber-400">
                  ({allOpportunities.length - displayedOpportunities.length} filtered by your preferences —{' '}
                  <button className="underline hover:text-white transition-colors" onClick={() => setShowAllOpportunities(true)}>
                    show all
                  </button>)
                </span>
              )}
              {activeFilter && (
                <span className="ml-2 text-base font-normal text-slate-400">
                  (filtered by {activeFilter === 'setasides' ? 'set-asides' : activeFilter})
                </span>
              )}
            </h3>
          )}
          {activeFilter && (
            <button
              onClick={() => setActiveFilter(null)}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg text-sm text-slate-300 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Clear Filter
            </button>
          )}
        </div>

        {/* Opportunities Display */}

        {/* Only show the grid if there are opportunities to display */}
        {viewMode === 'grid' && visibleOpportunities.length > 0 && (() => {
          const COLS = [
            { key: 'CRITICAL',    min: 0,  max: 3,     label: 'CRITICAL',    range: '≤3 days',    hdr: '#dc2626', bg: '#1c0606' },
            { key: 'URGENT',      min: 4,  max: 5,     label: 'URGENT',      range: '4-5 days',   hdr: '#ea580c', bg: '#1c0d04' },
            { key: 'HIGH',        min: 6,  max: 7,     label: 'HIGH',        range: '6-7 days',   hdr: '#d97706', bg: '#1c1404' },
            { key: 'ACT SOON',    min: 8,  max: 10,    label: 'ACT SOON',    range: '8-10 days',  hdr: '#ca8a04', bg: '#1c1804' },
            { key: 'NORMAL',      min: 11, max: 14,    label: 'NORMAL',      range: '11-14 days', hdr: '#65a30d', bg: '#0b1803' },
            { key: 'COMFORTABLE', min: 15, max: 21,    label: 'COMFORTABLE', range: '15-21 days', hdr: '#16a34a', bg: '#031809' },
            { key: 'AMPLE',       min: 22, max: 30,    label: 'AMPLE',       range: '22-30 days', hdr: '#059669', bg: '#02140f' },
            { key: 'PLENTY',      min: 31, max: 99999, label: 'PLENTY',      range: '31+ days',   hdr: '#0d9488', bg: '#021718' },
          ];

          type Tagged = SamOpportunity & { bd: number };
          const buckets: Record<string, Tagged[]> = {};
          COLS.forEach(c => { buckets[c.key] = []; });

          // Board uses boardFiltered ΓÇö bypasses urgency pre-filter (columns handle it)
          boardFiltered.forEach(opp => {
            if (opp.noticeId.startsWith('placeholder')) return;
            const dl = getEffectiveDeadline(opp);
            if (!dl) return;
            const bd = getBusinessDaysUntil(dl) ?? -1;
            if (bd < 0) return;
            const col = COLS.find(c => bd >= c.min && bd <= c.max);
            if (col) buckets[col.key].push({ ...opp, bd });
          });
          COLS.forEach(c => buckets[c.key].sort((a, b) => a.bd - b.bd));

          // Find the max column length (after filtering and showMoreBands logic)
          const urgencyActive = selectedUrgencyFilters.size > 0;
          const colLengths = COLS.map(col => {
            const all = buckets[col.key];
            const colSelected = !urgencyActive || selectedUrgencyFilters.has(col.label) || selectedUrgencyFilters.has(col.key);
            const filteredAll = urgencyActive && !colSelected ? [] : all;
            return (showMoreBands?.[col.key] ? filteredAll.length : Math.min(filteredAll.length, 12));
          });
          const maxColLength = Math.max(...colLengths);

          return (
            <div style={{ width: '100%', overflowX: isMobileViewport ? 'auto' : 'visible', paddingBottom: isMobileViewport ? '4px' : '0' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: isMobileViewport ? 'repeat(8, minmax(160px, 1fr))' : 'repeat(8, 1fr)',
                gap: '4px',
                minWidth: isMobileViewport ? '1280px' : '0',
                width: '100%',
              }}>
              {COLS.map((col, colIdx) => {
                const all    = buckets[col.key];
                const colSelected   = !urgencyActive || selectedUrgencyFilters.has(col.label) || selectedUrgencyFilters.has(col.key);
                const filteredAll   = urgencyActive && !colSelected ? [] : all;
                const shown: (Tagged | null)[] = showMoreBands?.[col.key] ? filteredAll : filteredAll.slice(0, 12);
                const hidden = filteredAll.length - shown.length;
                // Pad with placeholders to align columns
                const paddedShown: (Tagged | null)[] = [...shown];
                while (paddedShown.length < maxColLength) {
                  paddedShown.push(null);
                }
                return (
                  <div key={col.key} style={{
                    display: 'flex', flexDirection: 'column', minWidth: 0,
                    opacity: urgencyActive && !colSelected ? 0.25 : 1,
                    transition: 'opacity 0.2s',
                  }}>

                    {/* Column header */}
                    <div style={{
                      background: col.hdr,
                      padding: '8px 4px',
                      textAlign: 'center',
                      borderRadius: '6px 6px 0 0',
                      marginBottom: '2px',
                      position: 'sticky',
                      top: 0,
                      zIndex: 10,
                    }}>
                      <div style={{ color: 'white', fontWeight: 900, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{col.label}</div>
                      <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10px', marginTop: '1px' }}>{col.range}</div>
                      <div style={{
                        display: 'inline-block', marginTop: '4px',
                        background: 'rgba(0,0,0,0.3)', color: 'white',
                        fontWeight: 800, fontSize: '11px',
                        borderRadius: '999px', padding: '0 7px', lineHeight: '16px',
                      }}>{all.length}</div>
                    </div>

                    {/* Cards ΓÇö every card is full width of this column, stacks down */}
                    {paddedShown.map((opp, idx) => {
                      if (!opp) {
                        // Render invisible placeholder for alignment
                        return (
                          <div key={`placeholder-${col.key}-${idx}`} style={{
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '5px',
                            padding: '8px 9px',
                            marginBottom: '2px',
                            width: '100%',
                            minHeight: '56px', // Approximate height of a card
                            boxSizing: 'border-box',
                            pointerEvents: 'none',
                            visibility: 'hidden',
                          }} />
                        );
                      }
                      const dl       = getEffectiveDeadline(opp);
                      const isSaved  = savedOpportunities.has(opp.noticeId);
                      const isViewed = viewedOpportunities.has(opp.noticeId);
                      return (
                        <div
                          key={opp.noticeId}
                          onClick={() => setSelectedOpp(opp)}
                          style={{
                            background: col.bg,
                            border: `1px solid ${col.hdr}55`,
                            borderRadius: '5px',
                            padding: '8px 9px',
                            marginBottom: '2px',
                            cursor: 'pointer',
                            opacity: isViewed ? 0.45 : 1,
                            width: '100%',
                            boxSizing: 'border-box',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(1.6)')}
                          onMouseLeave={e => (e.currentTarget.style.filter = '')}
                        >
                          {/* Top row: days badge + agency */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                            <span style={{
                              background: col.hdr, color: 'white',
                              fontWeight: 900, fontSize: '12px',
                              borderRadius: '4px', padding: '2px 7px', flexShrink: 0,
                            }}>{opp.bd}d</span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', minWidth: 0 }}>
                              <span style={{ color: '#94a3b8', fontSize: '11px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {getAgencyAbbreviation(opp.department)}
                              </span>
                              {isSaved && <Bookmark style={{ width: 11, height: 11, color: '#fb7185', flexShrink: 0 }} fill="#fb7185" />}
                            </div>
                          </div>
                          {/* Title */}
                          <p style={{
                            color: 'white', fontSize: '12px', fontWeight: 700,
                            lineHeight: 1.3, marginBottom: '6px',
                            display: '-webkit-box', WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical', overflow: 'hidden',
                          }}>{opp.title}</p>
                          {/* Deadline */}
                          <div style={{ marginBottom: '3px' }}>
                            <span style={{ color: '#94a3b8', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Due </span>
                            <span style={{ color: col.hdr, fontSize: '13px', fontWeight: 800 }}>
                              {dl ? formatDate(dl) : 'ΓÇö'}
                            </span>
                          </div>
                          {/* Posted */}
                          {opp.postedDate && (
                            <div>
                              <span style={{ color: '#64748b', fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Posted </span>
                              <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 700 }}>
                                {formatDate(opp.postedDate)}
                              </span>
                            </div>
                          )}
                          {/* Set-aside badge */}
                          {(() => {
                            const sa = getSetAsideStyle(opp);
                            if (!sa) return null;
                            return (
                              <div style={{ marginTop: '5px' }}>
                                <span style={{
                                  display: 'inline-block',
                                  background: sa.bg,
                                  color: sa.text,
                                  border: `1px solid ${sa.color}`,
                                  borderRadius: '4px',
                                  padding: '1px 6px',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  letterSpacing: '0.04em',
                                  textTransform: 'uppercase',
                                }}>{sa.label}</span>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}

                    {/* Load more */}
                    {hidden > 0 && (
                      <button
                        onClick={() => setShowMoreBands((prev: Record<string,boolean>) => ({ ...prev, [col.key]: true }))}
                        style={{
                          background: col.hdr, color: 'white',
                          fontWeight: 700, fontSize: '11px',
                          padding: '7px 4px', border: 'none',
                          cursor: 'pointer', width: '100%',
                          borderRadius: '0 0 6px 6px',
                          opacity: 0.9,
                        }}
                        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                        onMouseLeave={e => (e.currentTarget.style.opacity = '0.9')}
                      >
                        +{hidden} more
                      </button>
                    )}
                  </div>
                );
              })}
              </div>
            </div>
          );
        })()}

        {/* COMPACT + LIST VIEWS ΓÇö grouped loop */}
        {viewMode !== 'grid' && Object.entries(groupedOpportunities).map(([groupName, opportunities]) => {
          const sortedOpportunities = opportunities;

          return (
            <div key={groupName} className="mb-8">
              {groupMode !== 'none' && (
                <div className="mb-4 flex items-center gap-3">
                  <h4 className="text-lg font-bold text-white">{groupName}</h4>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-transparent"></div>
                  <span className="text-sm text-slate-400 font-semibold">{sortedOpportunities.length} opportunities</span>
                </div>
              )}

              {/* COMPACT VIEW */}
              {viewMode === 'compact' && (
                <div className="space-y-2">
                  {sortedOpportunities.map((opp) => {
                    const isPlaceholder = opp.noticeId.startsWith('placeholder');
                    const deadline = isPlaceholder ? null : getEffectiveDeadline(opp);
                    const postedDate = getEffectivePostedDate(opp);
                    const businessDays = deadline ? getBusinessDaysUntil(deadline) : null;
                    const isSaved = savedOpportunities.has(opp.noticeId);
                    const isViewed = viewedOpportunities.has(opp.noticeId);
                    const hasRealDeadline = !!opp.responseDeadLine;

                    const urgencyGradient = businessDays !== null ? getUrgencyGradient(businessDays) : getNoDeadlineGradient();
                    const urgencyTextColor = businessDays !== null ? getUrgencyTextColor(businessDays) : getNoDeadlineTextColor();
                    const urgencyLabel = businessDays !== null ? getUrgencyLabel(businessDays) : 'NO DEADLINE';

                    return (
                      <div
                        key={opp.noticeId}
                        className={`group p-3 bg-gradient-to-r ${urgencyGradient} rounded-lg border-2 hover:shadow-lg transition-all ${
                          isPlaceholder ? 'animate-pulse' : ''
                        } ${isViewed ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Urgency Badge */}
                          {!isPlaceholder && (
                            <div className="flex flex-col gap-2 w-[132px] sm:w-[190px] shrink-0">
                              <div className={`px-3 py-1 rounded-lg font-bold text-sm ${urgencyTextColor} bg-slate-900/60 border border-current inline-flex items-center justify-between`}>
                                <span>{urgencyLabel}</span>
                                <span className="ml-2">{businessDays !== null ? `${businessDays}bd` : 'Γê₧'}</span>
                              </div>
                            </div>
                          )}

                          {/* Response Deadline */}
                          {!isPlaceholder && (
                            <div className="mb-0 p-2 bg-slate-900/40 rounded-lg border border-slate-700 flex-shrink-0">
                              <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                <Calendar className="w-3 h-3" />
                                <span>Response Deadline</span>
                              </div>
                              <div className={`text-sm font-bold ${urgencyTextColor}`}>
                                {deadline ? formatDate(deadline) : 'No deadline'}
                                {opp.updatedResponseDeadLine && (
                                  <span className="ml-2 text-xs text-cyan-400">(Updated)</span>
                                )}
                              </div>
                              <div className="mt-1 pt-1 border-t border-slate-700/50 text-xs text-slate-400">
                                Posted: {formatDate(postedDate)}
                                {opp.updatedPostedDate && opp.updatedPostedDate !== opp.postedDate && (
                                  <span className="ml-2 text-cyan-400">ΓÇó Updated: {formatDate(opp.updatedPostedDate)}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Title and Department */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-white mb-0.5 truncate">
                              {isPlaceholder ? (
                                <span className="inline-block h-4 w-64 bg-slate-700 rounded"></span>
                              ) : (
                                opp.title
                              )}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-400">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {isPlaceholder ? (
                                  <span className="inline-block h-3 w-32 bg-slate-700 rounded"></span>
                                ) : (
                                  opp.department
                                )}
                              </span>
                              {!isPlaceholder && (
                                <>
                                  <span className="px-2 py-0.5 bg-slate-900/60 border border-slate-700 rounded text-xs text-white font-bold">
                                    {getAgencyAbbreviation(opp.department)}
                                  </span>
                                </>
                              )}
                              {!isPlaceholder && opp.typeOfSetAsideDescription && opp.typeOfSetAsideDescription !== 'None' && (
                                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                                  {opp.typeOfSetAsideDescription}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {!isPlaceholder && (
                              <>
                                <button
                                  onClick={() => handleSaveOpportunity(opp.noticeId)}
                                  className="p-2 rounded-lg bg-slate-900/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                                  title={isSaved ? 'Remove bookmark' : 'Bookmark'}
                                >
                                  <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                                </button>
                                <a
                                  href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleViewOpportunity(opp.noticeId)}
                                  className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all text-xs flex items-center gap-2"
                                >
                                  View
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}


              {/* LIST VIEW */}
              {viewMode === 'list' && (
                <div className="space-y-4">
                  {sortedOpportunities.map((opp) => {
                    const isPlaceholder = opp.noticeId.startsWith('placeholder');
                    const deadline = isPlaceholder ? null : getEffectiveDeadline(opp);
                    const postedDate = getEffectivePostedDate(opp);
                    const businessDays = deadline ? getBusinessDaysUntil(deadline) : null;
                    const isUrgent = businessDays !== null && businessDays <= 7;
                    const isSaved = savedOpportunities.has(opp.noticeId);
                    const isViewed = viewedOpportunities.has(opp.noticeId);
                    const hasAnalysis = opp.aiAnalysis !== undefined;
                    const isAnalyzing = analyzingOpps.has(opp.noticeId);
                    const hasRealDeadline = !!opp.responseDeadLine;

                    const urgencyGradient = businessDays !== null ? getUrgencyGradient(businessDays) : getNoDeadlineGradient();
                    const urgencyTextColor = businessDays !== null ? getUrgencyTextColor(businessDays) : getNoDeadlineTextColor();

                    return (
                      <div
                        key={opp.noticeId}
                        className={`group p-4 sm:p-6 bg-gradient-to-br ${urgencyGradient} rounded-xl border-2 hover:shadow-xl transition-all ${
                          isPlaceholder ? 'animate-pulse' : ''
                        } ${isViewed ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3 sm:gap-6">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
                              {!isPlaceholder && isSaved && (
                                <div className="px-2 sm:px-3 py-1 bg-rose-500/20 rounded-lg flex items-center gap-1.5 border border-rose-500/40">
                                  <Bookmark className="w-3.5 h-3.5 text-rose-400" fill="currentColor" />
                                  <span className="text-xs font-bold text-rose-400">Saved</span>
                                </div>
                              )}
                              {!isPlaceholder && hasAnalysis && (
                                <div className="px-2 sm:px-3 py-1 bg-purple-500/20 rounded-lg flex items-center gap-1.5 border border-purple-500/40">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="text-xs font-bold text-purple-400">AI Analyzed</span>
                                </div>
                              )}
                            </div>

                            <h3 className="text-base sm:text-xl font-bold text-white mb-2 sm:mb-3 leading-tight">
                              {isPlaceholder ? (
                                <>
                                  <span className="inline-block h-6 w-full max-w-2xl bg-slate-700 rounded mb-2"></span>
                                  <span className="inline-block h-6 w-3/4 max-w-xl bg-slate-700 rounded"></span>
                                </>
                              ) : (
                                opp.title
                              )}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-1.5 sm:gap-y-2 text-xs sm:text-sm text-slate-300">
                              <span className="flex items-center gap-2">
                                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                {isPlaceholder ? (
                                  <span className="inline-block h-4 w-48 bg-slate-700 rounded"></span>
                                ) : (
                                  opp.department
                                )}
                              </span>
                              {!isPlaceholder && opp.typeOfSetAsideDescription && opp.typeOfSetAsideDescription !== 'None' && (
                                <span className="flex items-center gap-2">
                                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-xs font-semibold">
                                    {opp.typeOfSetAsideDescription}
                                  </span>
                                </span>
                              )}
                              <span className="flex items-center gap-2">
                                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                {isPlaceholder ? (
                                  <span className="inline-block h-4 w-24 bg-slate-700 rounded"></span>
                                ) : (
                                  `NAICS: ${opp.naicsCode || 'N/A'}`
                                )}
                              </span>
                              <span className="flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                {isPlaceholder ? (
                                  <span className="inline-block h-4 w-32 bg-slate-700 rounded"></span>
                                ) : (
                                  <>
                                    <span>Posted: {formatDate(postedDate)}</span>
                                    {opp.updatedPostedDate && opp.updatedPostedDate !== opp.postedDate && (
                                      <span className="text-cyan-400 ml-1">ΓÇó Updated</span>
                                    )}
                                  </>
                                )}
                              </span>
                            </div>
                          </div>

                          {!isPlaceholder && (
                            <div className="text-right flex-shrink-0 min-w-[56px]">
                              {businessDays !== null ? (
                                <>
                                  <div className={`text-xl sm:text-2xl font-bold ${urgencyTextColor} mb-0.5`}>
                                    {businessDays}
                                  </div>
                                  <div className="text-xs text-slate-400 mb-1.5">
                                    {businessDays === 1 ? 'day' : 'days'}
                                  </div>
                                </>
                              ) : (
                                <div className="text-sm text-slate-400 mb-2">
                                  No deadline
                                </div>
                              )}
                              <div className="text-xs sm:text-sm text-slate-300">
                                {deadline ? formatDate(deadline) : 'ΓÇö'}
                                {opp.updatedResponseDeadLine && (
                                  <span className="ml-1 text-xs text-cyan-400">(Updated)</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        {hasAnalysis && opp.aiAnalysis && (
                          <div className="mt-4 p-4 bg-slate-900/60 rounded-lg border border-slate-700">
                            <div className="grid grid-cols-3 gap-4 mb-3">
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Competition</div>
                                <div className="text-sm font-bold text-white">{opp.aiAnalysis.competitionLevel}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Win Probability</div>
                                <div className="text-sm font-bold text-white">{opp.aiAnalysis.winProbability}</div>
                              </div>
                              <div>
                                <div className="text-xs text-slate-400 mb-1">Match Score</div>
                                <div className="text-sm font-bold text-white">{opp.aiAnalysis.matchScore}%</div>
                              </div>
                            </div>
                            {opp.aiAnalysis.recommendation && (
                              <p className="text-sm text-cyan-300 italic">{opp.aiAnalysis.recommendation}</p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-slate-700 mt-4">
                          <div className="flex items-center gap-2">
                            {!isPlaceholder ? (
                              <a
                                href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleViewOpportunity(opp.noticeId)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all text-sm shadow-sm hover:shadow-md"
                              >
                                View on SAM.gov
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            ) : (
                              <div className="w-full sm:w-auto px-5 py-3 bg-slate-700/50 rounded-xl animate-pulse">
                                <span className="text-transparent">Loading...</span>
                              </div>
                            )}
                            {!isPlaceholder && (
                              <button
                                onClick={() => handleSaveOpportunity(opp.noticeId)}
                                className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                              >
                                <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                              </button>
                            )}
                            {!hasAnalysis && !isPlaceholder && process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY && (
                              <button
                                onClick={async () => {
                                  const analysis = await analyzeOpportunity(opp);
                                  if (analysis) {
                                    setAllOpportunities(prev => prev.map(o => 
                                      o.noticeId === opp.noticeId ? { ...o, aiAnalysis: analysis } : o
                                    ));
                                  }
                                }}
                                disabled={isAnalyzing}
                                className="p-2.5 rounded-xl bg-slate-700/50 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                                title="Analyze with AI"
                              >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                          <span className="text-sm text-slate-500 font-mono">
                            {isPlaceholder ? (
                              <span className="inline-block h-4 w-32 bg-slate-700 rounded"></span>
                            ) : (
                              opp.solicitationNumber
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Load More Button and End-of-Results Counter */}
        <div className="mt-10 mb-24 text-center relative">
          <div className="mb-6 flex flex-col items-center gap-4">

            {/* Count text */}
            {isLoggedIn ? (
              <p className="text-sm text-slate-500">
                Showing{' '}
                <span className="text-slate-300 font-semibold">
                  {(viewMode === 'grid' ? boardFiltered.length : visibleOpportunities.length).toLocaleString()}
                </span>{' '}
                of{' '}
                <span className="text-slate-300 font-semibold">
                  {(showAllOpportunities ? allOpportunities.length : displayedOpportunities.length).toLocaleString()}
                </span>{' '}
                opportunities
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Showing <span className="text-slate-300 font-semibold">{(viewMode === 'grid' ? boardFiltered.length : visibleOpportunities.length).toLocaleString()}</span> sample opportunities
                {guestDataFreshAt && <span className="text-slate-600"> · SAM.gov data from {guestDataFreshAt}</span>}
              </p>
            )}

            {/* Show All button — logged-in only */}
            {isLoggedIn && !showAllOpportunities && allOpportunities.length > displayedOpportunities.length && (
              <button
                onClick={() => { setShowAllOpportunities(true); setDisplayCount(allOpportunities.length); }}
                style={{
                  background: '#1e293b', color: '#f97316',
                  border: '1.5px solid rgba(249,115,22,0.5)',
                  fontWeight: 700, fontSize: '13px',
                  borderRadius: '9px', padding: '9px 22px',
                  cursor: 'pointer', transition: 'all 0.15s',
                  minWidth: '220px',
                }}
              >
                Show All {allOpportunities.length.toLocaleString()} Opportunities
              </button>
            )}

            {/* Load More button — logged-in only */}
            {isLoggedIn && hasMore && (
              <button
                onClick={() => {
                  if (!loadingMore) {
                    setLoadingMore(true);
                    setTimeout(() => {
                      setDisplayCount(prev => {
                        const max = showAllOpportunities ? allOpportunities.length : displayedOpportunities.length;
                        return Math.min(prev + 24, max);
                      });
                      setLoadingMore(false);
                    }, 400);
                  }
                }}
                disabled={loadingMore || !hasMore}
                style={{
                  background: loadingMore ? '#0f172a' : '#1e293b',
                  color: loadingMore ? '#67e8f9' : '#94a3b8',
                  border: loadingMore ? '1.5px solid #0e7490' : '1.5px solid #334155',
                  fontWeight: 700, fontSize: '13px',
                  borderRadius: '9px', padding: '10px 28px',
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s',
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  minWidth: '240px', justifyContent: 'center',
                  opacity: loadingMore ? 0.85 : 1,
                }}
              >
                {loadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading more opportunities…
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    Load More
                    <span style={{ background: '#334155', borderRadius: '20px', padding: '2px 10px', fontSize: '11px', fontWeight: 700 }}>
                      {((showAllOpportunities ? allOpportunities.length : displayedOpportunities.length) - visibleOpportunities.length).toLocaleString()} more
                    </span>
                  </>
                )}
              </button>
            )}

            {/* Progress bar — logged-in only */}
            {isLoggedIn && (
              <div className="h-0.5 w-48 mx-auto bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-600 to-blue-600 transition-all duration-500"
                  style={{ width: `${(visibleOpportunities.length / Math.max(1, showAllOpportunities ? allOpportunities.length : displayedOpportunities.length)) * 100}%` }}
                />
              </div>
            )}

            {/* Completion badge — logged-in only */}
            {isLoggedIn && !hasMore && dataLoaded && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '7px 18px',
                background: '#0f2820', border: '1.5px solid #166534',
                borderRadius: '9px', color: '#86efac', fontSize: '13px', fontWeight: 600,
              }}>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                All {visibleOpportunities.length.toLocaleString()} opportunities loaded
                {opportunityPreferences && !showAllOpportunities && displayedOpportunities.length < allOpportunities.length && (
                  <span style={{ color: '#fbbf24', fontSize: '12px' }}>
                    {' '}·{' '}
                    <button style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700 }} onClick={() => setShowAllOpportunities(true)}>
                      show {allOpportunities.length - displayedOpportunities.length} more
                    </button>
                  </span>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Opportunity Detail Modal */}
        {selectedOpp && (() => {
          const opp = selectedOpp;
          const dl = getEffectiveDeadline(opp);
          const bd = dl ? getBusinessDaysUntil(dl) : null;
          const urgencyGradient = bd !== null ? getUrgencyGradient(bd) : getNoDeadlineGradient();
          const urgencyTextColor = bd !== null ? getUrgencyTextColor(bd) : getNoDeadlineTextColor();
          const urgencyBadge = bd !== null ? getUrgencyBadgeColor(bd) : getNoDeadlineBadgeColor();
          const urgencyLabel = bd !== null ? getUrgencyLabel(bd) : 'NO DEADLINE';
          const isSaved = savedOpportunities.has(opp.noticeId);
          const postedDate = getEffectivePostedDate(opp);
          return (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-8"
              onClick={e => { if (e.target === e.currentTarget) setSelectedOpp(null); }}
            >
              <div className={`relative w-full max-w-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border-2 rounded-2xl shadow-2xl overflow-hidden ${urgencyGradient.replace('from-','border-').split(' ')[0]}`}
                style={{borderColor: undefined}}>
                {/* Coloured urgency bar at top */}
                <div className={`w-full py-1 ${urgencyBadge.split(' ')[0]}`} />

                {/* Header: logo + title area */}
                <div className="flex items-start gap-4 p-6 pb-4 border-b border-white/10">
                  {/* Company logo */}
                  <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                    <Image
                      src="/logo.png"
                      alt="Precise GovCon"
                      width={48}
                      height={48}
                      className="w-10 h-10 object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md text-xs font-black ${urgencyBadge}`}>{urgencyLabel}</span>
                      {bd !== null && <span className={`text-lg font-black ${urgencyTextColor}`}>{bd} business days</span>}
                    </div>
                    <h2 className="text-lg font-bold text-white leading-snug line-clamp-3">{opp.title}</h2>
                  </div>
                  <button
                    onClick={() => setSelectedOpp(null)}
                    className="flex-shrink-0 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body ΓÇö scrollable */}
                <div className="overflow-y-auto max-h-[60vh]">

                  {/* ── Set-aside badge row ── */}
                  {(() => {
                    const sa = getSetAsideStyle(opp);
                    const rawCode = ((opp as any).setAside || opp.typeOfSetAside || '').trim();
                    const desc = (opp.typeOfSetAsideDescription || (opp as any).setAsideDescription || '').trim();
                    // Suppress desc if it duplicates sa.label or is empty/none
                    const showDesc = desc && desc !== 'None' && desc !== 'N/A' && (!sa || desc.toLowerCase() !== sa.label.toLowerCase());
                    if (!sa && !rawCode && !desc) return null;
                    return (
                      <div className="px-6 pt-4 pb-2 flex flex-wrap items-center gap-2">
                        {sa ? (
                          <span style={{ background: sa.bg, color: sa.text, border: `1.5px solid ${sa.color}` }}
                            className="px-3 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider flex items-center gap-1.5">
                            <span style={{ background: sa.text, opacity: 0.9 }} className="w-2 h-2 rounded-full inline-block flex-shrink-0" />
                            {sa.label}
                          </span>
                        ) : rawCode ? (
                          <span style={{ background: '#1e3a5f', color: '#93c5fd', border: '1.5px solid #1e40af' }}
                            className="px-3 py-1.5 rounded-lg text-sm font-black uppercase tracking-wider">{rawCode}</span>
                        ) : null}
                        {showDesc && (
                          <span className="text-slate-400 text-xs">{desc}</span>
                        )}
                      </div>
                    );
                  })()}

                  {/* ΓöÇΓöÇ Main info grid ΓöÇΓöÇ */}
                  <div className="px-6 py-3 grid grid-cols-2 gap-x-6 gap-y-4 text-sm">

                    {/* LEFT column */}
                    <div className="space-y-4">

                      {/* Department / Agency */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                          🏛 Department / Agency
                        </p>
                        {(() => {
                          const dept = opp.fullParentPathName || opp.department || '';
                          if (!dept || dept === 'Unknown') return <p className="text-slate-500 italic text-xs">Not available ΓÇö view on SAM.gov</p>;
                          const parts = dept.split(':').map((p: string) => p.trim()).filter(Boolean);
                          return (
                            <div>
                              <p className="text-white font-semibold text-sm leading-snug">{parts[0]}</p>
                              {parts.length > 1 && (
                                <p className="text-slate-400 text-xs mt-0.5 leading-relaxed">{parts.slice(1).join(' ΓÇ║ ')}</p>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                      {/* Solicitation # ΓÇö only show if it looks like a real solicitation number */}
                      {opp.solicitationNumber && !opp.solicitationNumber.match(/^[0-9a-f]{32,}$/i) && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📋 Solicitation #</p>
                          <p className="text-cyan-300 font-mono text-xs break-all leading-relaxed">{opp.solicitationNumber}</p>
                        </div>
                      )}

                      {/* NAICS + PSC ΓÇö only show if we have values */}
                      {(opp.naicsCode || opp.classificationCode) && (
                        <div className="flex gap-4">
                          {opp.naicsCode && (
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📦 NAICS</p>
                              <p className="text-slate-200 font-mono font-bold">{opp.naicsCode}</p>
                            </div>
                          )}
                          {opp.classificationCode && (
                            <div>
                              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">PSC Code</p>
                              <p className="text-slate-200 font-mono font-bold">{opp.classificationCode}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Office location */}
                      {(opp.officeAddress?.city || opp.officeAddress?.state) && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📍 Office Location</p>
                          <p className="text-slate-200 text-sm">
                            {[opp.officeAddress?.city, opp.officeAddress?.state, opp.officeAddress?.zip].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Place of Performance */}
                      {(opp.placeOfPerformance?.city?.name || opp.placeOfPerformance?.state?.name || opp.placeOfPerformance?.state?.code) && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">🏢 Place of Performance</p>
                          <p className="text-slate-200 text-sm">
                            {[
                              opp.placeOfPerformance?.city?.name,
                              opp.placeOfPerformance?.state?.name || opp.placeOfPerformance?.state?.code,
                              opp.placeOfPerformance?.zip
                            ].filter(Boolean).join(', ')}
                          </p>
                        </div>
                      )}

                      {/* Contact */}
                      {opp.pointOfContact && opp.pointOfContact.length > 0 && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">👤 Point of Contact</p>
                          {opp.pointOfContact.slice(0, 2).map((poc, i) => (
                            <div key={i} className="mb-2 pl-2 border-l-2 border-slate-700">
                              {poc.fullname && (
                                <p className="text-white text-xs font-semibold">
                                  {poc.fullname}
                                  {poc.title && <span className="text-slate-400 font-normal ml-1 text-xs">┬╖ {poc.title}</span>}
                                </p>
                              )}
                              {poc.email && (
                                <a href={`mailto:${poc.email}`} className="text-cyan-400 text-xs hover:underline block truncate">{poc.email}</a>
                              )}
                              {poc.phone && <p className="text-slate-400 text-xs">{poc.phone}</p>}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* RIGHT column */}
                    <div className="space-y-4">

                      {/* Deadline */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Response Deadline
                        </p>
                        <p className={`text-lg font-black ${urgencyTextColor}`}>{dl ? formatDate(dl) : 'No deadline'}</p>
                        {bd !== null && <p className="text-xs text-slate-400 mt-0.5">{bd} business days remaining</p>}
                        {opp.updatedResponseDeadLine && opp.updatedResponseDeadLine !== opp.responseDeadLine && (
                          <p className="text-xs text-amber-400 mt-0.5">ΓÜá Deadline was updated</p>
                        )}
                      </div>

                      {/* Posted */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📅 Posted Date</p>
                        <p className="text-slate-200 font-semibold">{formatDate(postedDate)}</p>
                        {opp.updatedPostedDate && opp.updatedPostedDate !== opp.postedDate && (
                          <p className="text-xs text-cyan-400 mt-0.5">Updated: {formatDate(opp.updatedPostedDate)}</p>
                        )}
                      </div>

                      {/* Opportunity type */}
                      {opp.type && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">📄 Opportunity Type</p>
                          <p className="text-slate-200 capitalize">{
                            ({ o: 'Solicitation', p: 'Pre-Solicitation', a: 'Award Notice', r: 'Sources Sought',
                               s: 'Special Notice', k: 'Combined Synopsis', u: 'Justification (J&A)',
                               i: 'Intent to Bundle' } as any)[opp.type] || opp.type
                          }</p>
                        </div>
                      )}

                      {/* Notice ID */}
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">🔎 Notice ID</p>
                        <p className="text-slate-400 font-mono text-xs break-all">{opp.noticeId}</p>
                      </div>

                      {/* AI Analysis */}
                      {opp.aiAnalysis && (
                        <div>
                          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">🤖 AI Analysis</p>
                          <div className="grid grid-cols-3 gap-2 text-center mb-2">
                            <div className="bg-slate-800/60 rounded-lg p-2">
                              <p className="text-xs text-slate-400">Match</p>
                              <p className="text-sm font-bold text-cyan-300">{opp.aiAnalysis.matchScore}%</p>
                            </div>
                            <div className="bg-slate-800/60 rounded-lg p-2">
                              <p className="text-xs text-slate-400">Competition</p>
                              <p className="text-sm font-bold text-white">{opp.aiAnalysis.competitionLevel}</p>
                            </div>
                            <div className="bg-slate-800/60 rounded-lg p-2">
                              <p className="text-xs text-slate-400">Win Prob</p>
                              <p className="text-sm font-bold text-emerald-300">{opp.aiAnalysis.winProbability}</p>
                            </div>
                          </div>
                          {opp.aiAnalysis.recommendation && (
                            <p className="text-xs text-cyan-300 italic leading-relaxed">{opp.aiAnalysis.recommendation}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10 bg-slate-900/60">
                  <a
                    href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleViewOpportunity(opp.noticeId)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg text-sm"
                  >
                    View on SAM.gov
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <button
                    onClick={() => handleSaveOpportunity(opp.noticeId)}
                    className={`p-3 rounded-xl border transition-all ${isSaved ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/50'}`}
                    title={isSaved ? 'Remove bookmark' : 'Bookmark'}
                  >
                    <Bookmark className="w-5 h-5" fill={isSaved ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => setSelectedOpp(null)}
                    className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-slate-400 hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Preferences Reminder Modal — logged-in: set prefs / logged-out: create account */}
        {showPrefsReminder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-md bg-gradient-to-br from-slate-900 to-blue-950 border border-cyan-500/30 rounded-3xl p-8 shadow-2xl text-center">
              <button onClick={() => setShowPrefsReminder(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all">
                <X className="w-5 h-5" />
              </button>
              <div className="w-16 h-16 mx-auto mb-2 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center overflow-hidden">
                <Image src="/logo.png" alt="Precise GovCon" width={48} height={48} className="w-10 h-10 object-contain" />
              </div>
              <p className="text-xs text-orange-400 font-bold tracking-widest uppercase mb-3">Precise GovCon</p>

              {isLoggedIn ? (
                /* ── Logged-in: nudge to fill preferences survey ── */
                <>
                  <h3 className="text-2xl font-black text-white mb-2">
                    Get Better <span className="text-orange-400">Curated</span> Opportunities
                  </h3>
                  <p className="text-slate-300 text-base leading-relaxed mb-6">
                    Fill out your opportunity preferences to unlock <strong className="text-white">personalized recommendations</strong> powered by our proprietary analytics — matching your NAICS codes, certifications, and target agencies.
                  </p>
                  <div className="space-y-3">
                    <button
                      onClick={() => { setShowPrefsReminder(false); setSurveyOpen(true); }}
                      className="w-full py-4 rounded-xl text-white font-black text-base transition-all hover:scale-[1.02]"
                      style={{background: 'linear-gradient(135deg,#ea580c,#f97316)'}}
                    >
                      <Sparkles className="inline w-4 h-4 mr-2" />
                      Set My Preferences Now
                    </button>
                    <button
                      onClick={() => setShowPrefsReminder(false)}
                      className="w-full py-3 rounded-xl text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 text-sm font-medium transition-all"
                    >
                      Maybe Later
                    </button>
                  </div>
                </>
              ) : (
                /* ── Logged-out: nudge to create a free account ── */
                <>
                  <h3 className="text-2xl font-black text-white mb-2">
                    Unlock <span className="text-orange-400">1,400+</span> Live Opportunities
                  </h3>
                  <p className="text-slate-300 text-base leading-relaxed mb-4">
                    You&apos;re viewing a <strong className="text-white">sample preview</strong>. Create a free account to access the full live feed, set your NAICS codes, certifications, and agencies — and get curated results matched to your business.
                  </p>
                  <ul className="text-left text-sm text-slate-300 mb-6 space-y-2 px-2">
                    {['1,400+ live SAM.gov opportunities refreshed daily','AI-powered match scoring for your profile','Set-aside filtering for SDVOSB, WOSB, 8(a), HUBZone','Deadline alerts & saved opportunity tracking'].map(feat => (
                      <li key={feat} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-3">
                    <a
                      href="/auth/signup"
                      className="w-full py-4 rounded-xl text-white font-black text-base transition-all hover:scale-[1.02] flex items-center justify-center gap-2"
                      style={{background: 'linear-gradient(135deg,#ea580c,#f97316)'}}
                      onClick={() => setShowPrefsReminder(false)}
                    >
                      <Sparkles className="w-4 h-4" />
                      Create Free Account
                    </a>
                    <a
                      href="/auth/signin"
                      className="w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-cyan-700 text-cyan-300 hover:bg-cyan-900/30"
                      onClick={() => setShowPrefsReminder(false)}
                    >
                      Already have an account? Sign in
                    </a>
                    <button
                      onClick={() => setShowPrefsReminder(false)}
                      className="w-full py-2 text-slate-500 hover:text-slate-300 text-xs font-medium transition-all"
                    >
                      Continue browsing preview
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Opportunity Preferences Survey */}
        {toast && (
          <Toast
            message={toast.msg}
            type={toast.type}
            onClose={() => setToast(null)}
            duration={4000}
          />
        )}
        <OpportunityPreferencesSurvey 
          isOpen={surveyOpen}
          onClose={() => setSurveyOpen(false)}
          onComplete={(preferences) => {
            setOpportunityPreferences(preferences);
            setUserProfile(prev => ({
              ...prev,
              hasCompletedSurvey: true
            }));
            setSurveyOpen(false);
            window.dispatchEvent(new Event('surveyCompleted'));
          }}
        />
      </div>
    </div>

    {/* ΓöÇΓöÇ Floating action strip ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
    {/* Positioned at bottom-right, lifted high enough to never overlap
        the app's native Menu / Support buttons that sit at the very bottom */}
    <div style={{
      position: 'fixed',
      bottom: '100px',   // ΓåÉ clears the Menu + Support buttons below
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
      zIndex: 9999,
    }}>

      {/* ΓöÇΓöÇ Share tray (slides in above main buttons) ΓöÇΓöÇ */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
        overflow: 'hidden',
        maxHeight: shareOpen ? '320px' : '0px',
        opacity: shareOpen ? 1 : 0,
        transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease',
        pointerEvents: shareOpen ? 'auto' : 'none',
      }}>
        {/* Copy link */}
        <button
          onClick={() => {
            navigator.clipboard.writeText(window.location.href).catch(() => {});
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
            setShareOpen(false);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 16px',
            background: '#0e2038',
            border: '1.5px solid rgba(56,189,248,0.3)',
            borderRadius: '28px',
            color: '#7dd3fc',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#133352'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0e2038'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; }}
        >
          <Link2 size={15} />
          Copy Link
        </button>

        {/* Email */}
        <button
          onClick={() => {
            window.location.href = `mailto:?subject=Government%20Contracting%20Opportunities&body=${encodeURIComponent(window.location.href)}`;
            setShareOpen(false);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 16px',
            background: '#1f1408',
            border: '1.5px solid rgba(251,146,60,0.3)',
            borderRadius: '28px',
            color: '#fdba74',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#3a210a'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#1f1408'; e.currentTarget.style.borderColor = 'rgba(251,146,60,0.3)'; }}
        >
          <Mail size={15} />
          Share via Email
        </button>

        {/* LinkedIn */}
        <button
          onClick={() => {
            window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`, '_blank');
            setShareOpen(false);
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 16px',
            background: '#071626',
            border: '1.5px solid rgba(14,165,233,0.3)',
            borderRadius: '28px',
            color: '#38bdf8',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#0d2a44'; e.currentTarget.style.borderColor = 'rgba(14,165,233,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#071626'; e.currentTarget.style.borderColor = 'rgba(14,165,233,0.3)'; }}
        >
          {/* LinkedIn wordmark icon */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/>
            <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
          </svg>
          Share on LinkedIn
        </button>

        {/* Print / Save PDF */}
        <button
          onClick={() => { window.print(); setShareOpen(false); }}
          style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '9px 16px',
            background: '#160f2e',
            border: '1.5px solid rgba(167,139,250,0.3)',
            borderRadius: '28px',
            color: '#c4b5fd',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 4px 18px rgba(0,0,0,0.45)',
            transition: 'all 0.18s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#2a1a52'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.7)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#160f2e'; e.currentTarget.style.borderColor = 'rgba(167,139,250,0.3)'; }}
        >
          <Printer size={15} />
          Print / Save PDF
        </button>
      </div>

      {/* ΓöÇΓöÇ Link copied toast ΓöÇΓöÇ */}
      {linkCopied && (
        <div style={{
          padding: '7px 16px',
          background: '#0e2038',
          border: '1.5px solid rgba(56,189,248,0.4)',
          borderRadius: '20px',
          color: '#38bdf8',
          fontSize: '12px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          animation: 'fadeInUp 0.2s ease',
        }}>
          Γ£ô Link copied!
        </div>
      )}

      {/* ΓöÇΓöÇ Main action row ΓöÇΓöÇ */}
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>

        {/* Back to top */}
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to top"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 15px',
            background: 'linear-gradient(135deg, #1e3a5f, #0f2744)',
            border: '1.5px solid rgba(6,182,212,0.45)',
            borderRadius: '28px',
            color: '#67e8f9',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 0 14px rgba(6,182,212,0.25), 0 4px 14px rgba(0,0,0,0.5)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #0e7490, #0369a1)';
            e.currentTarget.style.borderColor = 'rgba(6,182,212,0.85)';
            e.currentTarget.style.boxShadow = '0 0 22px rgba(6,182,212,0.55), 0 4px 16px rgba(0,0,0,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1e3a5f, #0f2744)';
            e.currentTarget.style.borderColor = 'rgba(6,182,212,0.45)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(6,182,212,0.25), 0 4px 14px rgba(0,0,0,0.5)';
          }}
        >
          <ChevronUp size={16} />
          Top
        </button>

        {/* Export CSV */}
        <button
          onClick={handleExportOpportunities}
          title="Export to CSV"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 15px',
            background: 'linear-gradient(135deg, #1a3a2a, #0d2418)',
            border: '1.5px solid rgba(16,185,129,0.45)',
            borderRadius: '28px',
            color: '#6ee7b7',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 0 14px rgba(16,185,129,0.2), 0 4px 14px rgba(0,0,0,0.5)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #059669, #047857)';
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.85)';
            e.currentTarget.style.boxShadow = '0 0 22px rgba(16,185,129,0.45), 0 4px 16px rgba(0,0,0,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1a3a2a, #0d2418)';
            e.currentTarget.style.borderColor = 'rgba(16,185,129,0.45)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(16,185,129,0.2), 0 4px 14px rgba(0,0,0,0.5)';
          }}
        >
          <Download size={16} />
          Export
        </button>

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          title="Refresh from SAM.gov"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 15px',
            background: 'linear-gradient(135deg, #1e1a3f, #130f2e)',
            border: '1.5px solid rgba(139,92,246,0.45)',
            borderRadius: '28px',
            color: '#c4b5fd',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: '0 0 14px rgba(139,92,246,0.2), 0 4px 14px rgba(0,0,0,0.5)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.85)';
            e.currentTarget.style.boxShadow = '0 0 22px rgba(139,92,246,0.45), 0 4px 16px rgba(0,0,0,0.6)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'linear-gradient(135deg, #1e1a3f, #130f2e)';
            e.currentTarget.style.borderColor = 'rgba(139,92,246,0.45)';
            e.currentTarget.style.boxShadow = '0 0 14px rgba(139,92,246,0.2), 0 4px 14px rgba(0,0,0,0.5)';
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

        {/* Share ΓÇö toggles the tray above */}
        <button
          onClick={() => setShareOpen(s => !s)}
          title="Share"
          style={{
            display: 'flex', alignItems: 'center', gap: '7px',
            padding: '10px 15px',
            background: shareOpen
              ? 'linear-gradient(135deg, #1d6ef5, #1558d6)'
              : 'linear-gradient(135deg, #132238, #0e1c2e)',
            border: `1.5px solid ${shareOpen ? 'rgba(59,130,246,0.85)' : 'rgba(255,255,255,0.14)'}`,
            borderRadius: '28px',
            color: shareOpen ? '#fff' : '#94a3b8',
            fontSize: '13px', fontWeight: 600,
            cursor: 'pointer', whiteSpace: 'nowrap',
            boxShadow: shareOpen
              ? '0 4px 22px rgba(29,110,245,0.45), 0 0 0 1px rgba(59,130,246,0.15)'
              : '0 4px 14px rgba(0,0,0,0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            if (!shareOpen) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #1a2e48, #132238)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.26)';
              e.currentTarget.style.color = '#e2e8f0';
            }
          }}
          onMouseLeave={e => {
            if (!shareOpen) {
              e.currentTarget.style.background = 'linear-gradient(135deg, #132238, #0e1c2e)';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
              e.currentTarget.style.color = '#94a3b8';
            }
          }}
        >
          <Share2 size={16} />
          Share
          <ChevronDown
            size={13}
            style={{
              opacity: 0.7,
              transform: shareOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.25s ease',
            }}
          />
        </button>
      </div>
    </div>
    {/* Limited preview modal removed for unsigned-in users */}
    </>
  );
}