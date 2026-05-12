// app/opportunities/OpportunitiesClient.tsx
'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
  Sparkles, LogIn, BookUser,
  AlertTriangle
} from 'lucide-react';
// import { getPersonalizedGreeting, getTimeOfDayEmoji } from '@/lib/greeting';

const CLIENT_SAM_REFRESH_COOLDOWN_MS = 10 * 60 * 1000;
const CLIENT_SAM_REFRESH_STORAGE_PREFIX = 'pgc:sam:last-fetch:';

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

interface SavedOpportunityItem {
  id: string;
  notice_id: string;
  title?: string;
  department?: string;
  solicitation_number?: string;
  naics_code?: string;
  response_deadline?: string;
  posted_date?: string;
  ui_link?: string;
  set_aside?: string;
  created_at?: string;
}

interface AddressBookContact {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  organization?: string | null;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// View mode types
type ViewMode = 'list' | 'grid' | 'compact';
type GroupMode = 'none' | 'department' | 'urgency' | 'setaside' | 'naics' | 'state' | 'deadline_month';
type SortMode = 'deadline_asc' | 'deadline_desc' | 'posted_desc' | 'posted_asc' | 'title_asc' | 'agency_asc';

// No synthesized placeholders: opportunities must come from live SAM.gov data.

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

// Γ£à NEW: Neutral styling for opportunities with no response deadline (light + readable)
const getNoDeadlineGradient = () => 'from-slate-100 to-slate-50 border-slate-200';
const getNoDeadlineTextColor = () => 'text-slate-700';
const getNoDeadlineBadgeColor = () => 'bg-slate-100 text-slate-800 border-slate-200';

// 📌 NEW: Utility function to get urgency gradient colors
// Γ£à FIXED: Proper red-to-green gradient based on business days (light mode friendly)
const getUrgencyGradient = (businessDays: number) => {
  if (businessDays <= 3) return 'from-rose-100 to-orange-100 border-rose-200';          // 🔴 CRITICAL
  if (businessDays <= 5) return 'from-amber-100 to-yellow-100 border-amber-200';        // 🟠 URGENT
  if (businessDays <= 7) return 'from-amber-50 to-lime-50 border-amber-200';            // 🟡 HIGH
  if (businessDays <= 10) return 'from-lime-50 to-emerald-50 border-lime-200';          // 🟡 ACT SOON
  if (businessDays <= 14) return 'from-emerald-50 to-green-50 border-emerald-200';      // 🟢 NORMAL
  if (businessDays <= 21) return 'from-green-50 to-teal-50 border-green-200';           // 🟢 COMFORTABLE
  if (businessDays <= 30) return 'from-teal-50 to-cyan-50 border-teal-200';             // 🟢 AMPLE
  return 'from-sky-50 to-blue-50 border-sky-200';                                       // 🟢 PLENTY
};

const getUrgencyTextColor = (businessDays: number) => {
  if (businessDays <= 3) return 'text-rose-800';
  if (businessDays <= 5) return 'text-amber-800';
  if (businessDays <= 7) return 'text-amber-700';
  if (businessDays <= 10) return 'text-lime-700';
  if (businessDays <= 14) return 'text-emerald-700';
  if (businessDays <= 21) return 'text-green-700';
  if (businessDays <= 30) return 'text-teal-700';
  return 'text-slate-700';
};

const getUrgencyBadgeColor = (businessDays: number) => {
  if (businessDays <= 3) return 'bg-rose-100 text-rose-800 border-rose-200';
  if (businessDays <= 5) return 'bg-amber-100 text-amber-800 border-amber-200';
  if (businessDays <= 7) return 'bg-amber-50 text-amber-800 border-amber-200';
  if (businessDays <= 10) return 'bg-lime-50 text-lime-800 border-lime-200';
  if (businessDays <= 14) return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  if (businessDays <= 21) return 'bg-green-50 text-green-800 border-green-200';
  if (businessDays <= 30) return 'bg-teal-50 text-teal-800 border-teal-200';
  return 'bg-sky-50 text-sky-800 border-sky-200';
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
    return 'bg-indigo-600 text-white border-indigo-700';
  if (dept.includes('HOMELAND') || dept.includes('DHS')) 
    return 'bg-orange-600 text-white border-orange-700';
  if (dept.includes('HEALTH') || dept.includes('HHS')) 
    return 'bg-emerald-600 text-white border-emerald-700';
  if (dept.includes('ENERGY') || dept.includes('DOE')) 
    return 'bg-amber-500 text-white border-amber-600';
  if (dept.includes('NASA') || dept.includes('SPACE')) 
    return 'bg-purple-600 text-white border-purple-700';
  if (dept.includes('VETERANS') || dept.includes('VA')) 
    return 'bg-teal-600 text-white border-teal-700';
  if (dept.includes('GENERAL SERVICES') || dept.includes('GSA')) 
    return 'bg-slate-600 text-white border-slate-700';
  return 'bg-blue-600 text-white border-blue-700';
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
    const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; msg: string } | null>(null);
  const searchParams = useSearchParams();
  const filterParam = searchParams?.get('filter') ?? null;
  const searchParamSnapshot = searchParams?.toString() ?? '';
  const urlSearchOverrides = useMemo(() => {
    const read = (key: string) => {
      const value = searchParams?.get(key);
      if (!value) return '';
      try {
        return decodeURIComponent(value).trim();
      } catch {
        return value.trim();
      }
    };
    return {
      source: read('source'),
      from: read('from'),
      detail: read('detail'),
      update: read('update'),
      naics: read('naics') || read('naicsCode'),
      setAside: read('setAside') || read('setaside'),
      state: read('state'),
      postedFrom: read('postedFrom'),
      postedTo: read('postedTo'),
    };
  }, [searchParamSnapshot, searchParams]);
  const dashboardDrilldown = useMemo(() => {
    if (urlSearchOverrides.source !== 'dashboard') return null;
    const heading = urlSearchOverrides.from === 'posted-7d-pill'
      ? 'Dashboard drilldown: Opportunities posted in the last 7 days'
      : 'Dashboard drilldown: Live opportunities for your preferences';
    const details: string[] = [];
    if (urlSearchOverrides.naics) details.push(`NAICS ${urlSearchOverrides.naics}`);
    if (urlSearchOverrides.setAside) details.push(`Set-aside ${urlSearchOverrides.setAside}`);
    if (urlSearchOverrides.state) details.push(`State ${urlSearchOverrides.state}`);
    if (urlSearchOverrides.postedFrom) details.push(`Posted on/after ${formatDate(urlSearchOverrides.postedFrom)}`);
    if (urlSearchOverrides.postedTo) details.push(`Posted on/before ${formatDate(urlSearchOverrides.postedTo)}`);
    return { heading, details };
  }, [urlSearchOverrides]);
  const insightsDrilldown = useMemo(() => {
    if (urlSearchOverrides.source !== 'insights') return null;
    const headingByFrom: Record<string, string> = {
      'active-opportunities-pill': 'Insights drilldown: Active opportunities in your current feed',
      'new-today-pill': 'Insights drilldown: New opportunities posted today',
      'preference-matches-pill': 'Insights drilldown: Opportunities matching your saved preferences',
      'preference-matches-checklist': 'Insights drilldown: Preference-match triage queue',
      'preference-matches-action-center': 'Insights drilldown: Preference-match workflow view',
      'preference-matches-brief': 'Insights drilldown: Medium-priority preference matches',
      'preference-matches-chip': 'Insights drilldown: Preference-match summary results',
      'expiring-7d-pill': 'Insights drilldown: Opportunities expiring within 7 days',
      'active-agencies-pill': 'Insights drilldown: Agency-focused opportunities',
      'update-opportunities-btn': 'Insights drilldown: Manual opportunity update requested',
    };
    const heading = headingByFrom[urlSearchOverrides.from] || 'Insights drilldown: Filtered opportunity details';
    const details: string[] = [];
    if (urlSearchOverrides.detail) details.push(urlSearchOverrides.detail);
    if (urlSearchOverrides.naics) details.push(`NAICS ${urlSearchOverrides.naics}`);
    if (urlSearchOverrides.setAside) details.push(`Set-aside ${urlSearchOverrides.setAside}`);
    if (urlSearchOverrides.state) details.push(`State ${urlSearchOverrides.state}`);
    if (urlSearchOverrides.postedFrom) details.push(`Posted on/after ${formatDate(urlSearchOverrides.postedFrom)}`);
    if (urlSearchOverrides.postedTo) details.push(`Posted on/before ${formatDate(urlSearchOverrides.postedTo)}`);
    if (filterParam === 'today') details.push('Filter: posted today');
    if (filterParam === 'expiring') details.push('Filter: expiring within 7 days');
    return { heading, details };
  }, [filterParam, urlSearchOverrides]);
  const { data: session, status: sessionStatus } = useSession();
  const isLoggedIn = sessionStatus === 'authenticated';

  const [allOpportunities, setAllOpportunities] = useState<SamOpportunity[]>([]);
  const [displayedOpportunities, setDisplayedOpportunities] = useState<SamOpportunity[]>([]);
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
  const [lastUpdated, setLastUpdated] = useState('Not synced yet');
  const [dataLoaded, setDataLoaded] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'active' | 'setasides' | 'expiring' | 'departments' | null>(null);
  const [savedOpportunities, setSavedOpportunities] = useState<Set<string>>(new Set());
  const [viewedOpportunities, setViewedOpportunities] = useState<Set<string>>(new Set());
  const [analyzingOpps, setAnalyzingOpps] = useState<Set<string>>(new Set());
  const [opportunityPreferences, setOpportunityPreferences] = useState<any>(null);
  const [accountPreferences, setAccountPreferences] = useState<any>(null);
  const [selectedAgency, setSelectedAgency] = useState<string>('all');
  const [selectedNAICS, setSelectedNAICS] = useState<string>('all');
  const [selectedUrgency, setSelectedUrgency] = useState<string>('all');
  const [selectedUrgencyFilters, setSelectedUrgencyFilters] = useState<Set<string>>(new Set());
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const liveFetchInFlightRef = useRef(false);
  const autoRefreshFromInsightsRef = useRef(false);
  const lastSamFetchRef = useRef<{ key: string; at: number }>({ key: '', at: 0 });
  const [refreshIndicator, setRefreshIndicator] = useState(false);

  const getLastUpdatedLabel = useCallback(() => (
    new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  ), []);

  const getSamQueryKey = useCallback((query: URLSearchParams) => {
    const normalized = new URLSearchParams(query.toString());
    normalized.delete('t');
    return normalized.toString();
  }, []);

  const getClientSamFetchStorageKey = useCallback((queryKey: string) => (
    `${CLIENT_SAM_REFRESH_STORAGE_PREFIX}${encodeURIComponent(queryKey)}`
  ), []);

  const getPersistedClientSamFetch = useCallback((queryKey: string) => {
    if (typeof window === 'undefined') return 0;
    try {
      const raw = window.localStorage.getItem(getClientSamFetchStorageKey(queryKey));
      const parsed = Number(raw || 0);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    } catch {
      return 0;
    }
  }, [getClientSamFetchStorageKey]);

  const isClientSamFetchCoolingDown = useCallback((queryKey: string) => {
    const lastInMemory = lastSamFetchRef.current.key === queryKey ? lastSamFetchRef.current.at : 0;
    const lastPersisted = getPersistedClientSamFetch(queryKey);
    const latest = Math.max(lastInMemory, lastPersisted);
    if (!latest) return false;
    if ((Date.now() - latest) >= CLIENT_SAM_REFRESH_COOLDOWN_MS) return false;
    if (lastPersisted > lastInMemory) {
      lastSamFetchRef.current = { key: queryKey, at: lastPersisted };
    }
    return true;
  }, [getPersistedClientSamFetch]);

  const getClientSamCooldownRemainingSec = useCallback((queryKey: string) => {
    const lastInMemory = lastSamFetchRef.current.key === queryKey ? lastSamFetchRef.current.at : 0;
    const lastPersisted = getPersistedClientSamFetch(queryKey);
    const latest = Math.max(lastInMemory, lastPersisted);
    if (!latest) return 0;
    const remainingMs = CLIENT_SAM_REFRESH_COOLDOWN_MS - (Date.now() - latest);
    return remainingMs > 0 ? Math.ceil(remainingMs / 1000) : 0;
  }, [getPersistedClientSamFetch]);

  const markClientSamFetch = useCallback((queryKey: string) => {
    const now = Date.now();
    lastSamFetchRef.current = { key: queryKey, at: now };
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(getClientSamFetchStorageKey(queryKey), String(now));
      } catch {
        // ignore storage write issues
      }
    }
  }, [getClientSamFetchStorageKey]);

  const applyQuickSearch = useCallback((term: string) => {
    setSearchTerm(term);
    setKeywordSearch(term);
    searchInputRef.current?.focus();
  }, []);

  const clearQuickSearch = useCallback(() => {
    setSearchTerm('');
    setKeywordSearch('');
    searchInputRef.current?.focus();
  }, []);

  const getSamErrorMessage = useCallback((payload: any, fallback: string) => {
    if (!payload) return fallback;
    if (typeof payload === 'string') return payload || fallback;

    const message = typeof payload.message === 'string' ? payload.message.trim() : '';
    const errorCode = typeof payload.error === 'string' ? payload.error.trim() : '';

    if (errorCode === 'rate_limited' && payload.retryAfter) {
      return `SAM.gov rate limit hit. Please retry in ${payload.retryAfter}s.`;
    }
    if (message) return message;
    if (errorCode) return errorCode;
    return fallback;
  }, []);

  // 📌 NEW: View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>('urgency');
  const [sortMode, setSortMode] = useState<SortMode>('deadline_asc');
  const [surveyOpen, setSurveyOpen] = useState(false);
  const [showPrefsReminder, setShowPrefsReminder] = useState(false);
  const [selectedOpp, setSelectedOpp] = useState<SamOpportunity | null>(null);
  const [showMoreBands, setShowMoreBands] = useState<Record<string, boolean>>({});

  // ✓ NEW: Banner dismissal states
  const [showWelcomeBanner, setShowWelcomeBanner] = useState(true);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [showGuestFooterBar, setShowGuestFooterBar] = useState(true);

  // ✓ NEW: Dynamic guidance bar state
  const [guidanceIndex, setGuidanceIndex] = useState(0);
  const [guidanceVisible, setGuidanceVisible] = useState(true);
  const [guidanceGradientIndex, setGuidanceGradientIndex] = useState(0);

  // Γ£à NEW: Toggle for showing/hiding all opportunities including no-deadline
  const [showAllOpportunities, setShowAllOpportunities] = useState(true);
  const [showUrgencyLegend, setShowUrgencyLegend] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [boardPage, setBoardPage] = useState(1);
  const [listPageSize, setListPageSize] = useState(20);
  const BOARD_PAGE_SIZE = 18;

  // Share tray state
  const [shareOpen, setShareOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [savedTrayOpen, setSavedTrayOpen] = useState(false);
  const [savedOpportunityItems, setSavedOpportunityItems] = useState<SavedOpportunityItem[]>([]);
  const [addressBookContacts, setAddressBookContacts] = useState<AddressBookContact[]>([]);
  const [addressBookLoading, setAddressBookLoading] = useState(false);
  const [emailShareOpen, setEmailShareOpen] = useState(false);
  const [emailShareRecipients, setEmailShareRecipients] = useState<string[]>([]);
  const [emailShareInput, setEmailShareInput] = useState('');
  const [emailShareSearch, setEmailShareSearch] = useState('');
  const [emailShareSubject, setEmailShareSubject] = useState('');
  const [emailShareBody, setEmailShareBody] = useState('');

  const [dataSource, setDataSource] = useState<'live' | 'ticker'>('live');
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

  const loadAddressBookContacts = useCallback(async () => {
    setAddressBookLoading(true);
    try {
      const res = await fetch('/api/address-book', { cache: 'no-store' });
      const data = await res.json();
      setAddressBookContacts(Array.isArray(data) ? data : []);
    } catch {
      setAddressBookContacts([]);
    } finally {
      setAddressBookLoading(false);
    }
  }, []);

  const openEmailShareComposer = useCallback((subject: string, body: string) => {
    setEmailShareSubject(subject);
    setEmailShareBody(body);
    setEmailShareInput('');
    setEmailShareSearch('');
    setEmailShareRecipients([]);
    setEmailShareOpen(true);
    if (!addressBookContacts.length && !addressBookLoading) {
      void loadAddressBookContacts();
    }
  }, [addressBookContacts.length, addressBookLoading, loadAddressBookContacts]);

  const closeEmailShareComposer = useCallback(() => {
    setEmailShareOpen(false);
    setEmailShareRecipients([]);
    setEmailShareInput('');
    setEmailShareSearch('');
  }, []);

  const addEmailRecipient = useCallback(() => {
    const email = emailShareInput.trim();
    if (!email || !EMAIL_REGEX.test(email)) return;
    setEmailShareRecipients(prev => {
      if (prev.some(e => e.toLowerCase() === email.toLowerCase())) return prev;
      return [...prev, email];
    });
    setEmailShareInput('');
  }, [emailShareInput]);

  const toggleEmailRecipient = useCallback((email: string) => {
    setEmailShareRecipients(prev => {
      const exists = prev.some(e => e.toLowerCase() === email.toLowerCase());
      if (exists) {
        return prev.filter(e => e.toLowerCase() !== email.toLowerCase());
      }
      return [...prev, email];
    });
  }, []);

  const sendEmailShare = useCallback(() => {
    if (emailShareRecipients.length === 0) {
      setToast({ type: 'error', msg: 'Add at least one recipient email before sending.' });
      return;
    }
    const params = new URLSearchParams();
    params.set('bcc', emailShareRecipients.join(','));
    params.set('subject', emailShareSubject || 'Government Contracting Opportunities');
    params.set('body', emailShareBody || window.location.href);
    window.location.href = `mailto:?${params.toString()}`;
    setToast({
      type: 'success',
      msg: `Prepared email for ${emailShareRecipients.length} recipient${emailShareRecipients.length === 1 ? '' : 's'}.`,
    });
    closeEmailShareComposer();
  }, [closeEmailShareComposer, emailShareBody, emailShareRecipients, emailShareSubject]);

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
  const [goalEditorOpen, setGoalEditorOpen] = useState(false);
  const [goalDraft, setGoalDraft] = useState('10');

  // ── Guest policy ────────────────────────────────────────────────────────
  // No feed is shown for unauthenticated users. Live opportunities are
  // preference-based and require sign-in plus completed onboarding.
  const [guestDataLoading, setGuestDataLoading] = useState(false);
  const [guestDataFreshAt, setGuestDataFreshAt] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (isLoggedIn) return;

    setAllOpportunities([]);
    setFilteredOpportunities([]);
    setDisplayedOpportunities([]);
    setDataLoaded(true);
    setGuestDataLoading(false);
    setGuestDataFreshAt(null);
    setLastUpdated('Sign in required');
    setError('Sign in and complete preferences to view live, personalized SAM.gov opportunities.');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, sessionStatus]);

  // ── Dynamic guidance bar rotation ────────────────────────────────────────
  useEffect(() => {
    const INTERVAL = 7000;
    const FADE_DURATION = 400;
    const timer = setInterval(() => {
      setGuidanceVisible(false);
      setTimeout(() => {
        setGuidanceIndex(i => i + 1);
        setGuidanceGradientIndex(g => g + 1);
        setGuidanceVisible(true);
      }, FADE_DURATION);
    }, INTERVAL);
    return () => clearInterval(timer);
  }, []);
  // ─────────────────────────────────────────────────────────────────────────

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

    // Show ALL opportunities — no deadline filtering
    // Expired opps get sorted to bottom, no-deadline opps shown with "No deadline" label

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

      // Sync saved list from DB so floating saved panel stays accurate.
      loadSavedOpportunities();
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

  const loadSavedOpportunities = useCallback(() => {
    if (!isLoggedIn) return;
    fetch('/api/saved-opportunities')
      .then(r => r.ok ? r.json() : { savedOpportunities: [] })
      .then(data => {
        const items = (data.savedOpportunities ?? []) as SavedOpportunityItem[];
        setSavedOpportunityItems(items);
        const ids = items.map((o: any) => o.notice_id || o.noticeId || o.id).filter(Boolean);
        setSavedOpportunities(new Set(ids));
      })
      .catch(err => console.error('Failed to load saved opportunities:', err));
  }, [isLoggedIn]);

  const handleRemoveSavedFromTray = async (noticeId: string) => {
    if (!isLoggedIn) return;

    // Optimistic removal from tray and badge count.
    setSavedOpportunityItems(prev => prev.filter(item => item.notice_id !== noticeId));
    setSavedOpportunities(prev => {
      const next = new Set(prev);
      next.delete(noticeId);
      return next;
    });

    try {
      await fetch(`/api/saved-opportunities/${encodeURIComponent(noticeId)}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Failed to remove saved opportunity:', err);
      loadSavedOpportunities();
    }
  };

  const handleExportSavedOpportunities = () => {
    if (savedOpportunityItems.length === 0) return;
    const header = ['Title', 'Agency', 'Solicitation #', 'NAICS', 'Deadline', 'Posted', 'SAM Link'].join(',');
    const rows = savedOpportunityItems.map(opp => [
      `"${(opp.title || '').replace(/"/g, '""')}"`,
      `"${(opp.department || '').replace(/"/g, '""')}"`,
      `"${(opp.solicitation_number || '').replace(/"/g, '""')}"`,
      opp.naics_code || '',
      opp.response_deadline ? formatDate(opp.response_deadline) : '',
      opp.posted_date ? formatDate(opp.posted_date) : '',
      opp.ui_link || `https://sam.gov/opp/${opp.notice_id}/view`,
    ].join(','));

    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PreciseGovCon-Saved-Opportunities-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleShareSavedByEmail = () => {
    if (savedOpportunityItems.length === 0) return;
    const top = savedOpportunityItems.slice(0, 20);
    const bodyLines = top.map((item, idx) => {
      const link = item.ui_link || `https://sam.gov/opp/${item.notice_id}/view`;
      return `${idx + 1}. ${item.title || 'Opportunity'}\n${link}`;
    });
    const body = `Saved opportunities (${savedOpportunityItems.length})\n\n${bodyLines.join('\n\n')}`;
    openEmailShareComposer('Saved Government Opportunities', body);
  };

  const openGoalEditor = () => {
    setGoalDraft(String(userProfile.monthlyGoal || 10));
    setGoalEditorOpen(true);
  };

  const saveGoalEditor = () => {
    const parsed = Math.max(1, parseInt(goalDraft, 10) || (userProfile.monthlyGoal || 10));
    localStorage.setItem('monthly-bid-goal', String(parsed));
    setUserProfile(prev => ({ ...prev, monthlyGoal: parsed }));
    setGoalEditorOpen(false);
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
    const now = new Date();
    const monthName = now.toLocaleDateString('en-US', { month: 'long' });
    const year = now.getFullYear();
    a.download = `PreciseGovCon-Opportunities-${monthName}-${year}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    if (liveFetchInFlightRef.current) return;
    liveFetchInFlightRef.current = true;

    // Guests: live personalized feed requires sign-in/preferences
    if (!isLoggedIn) {
      setRefreshIndicator(true);
      setAllOpportunities([]);
      setFilteredOpportunities([]);
      setDisplayedOpportunities([]);
      setDataLoaded(true);
      setError('Sign in and complete preferences to refresh live opportunities.');
      setSelectedUrgencyFilters(new Set());
      setActiveFilter(null);
      setKeywordSearch('');
      setSearchTerm('');
      setShowAllOpportunities(false);
      setShowMoreBands({});
      setToast({ type: 'error', msg: 'Sign in required for live personalized opportunities.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setRefreshIndicator(false), 600);
      liveFetchInFlightRef.current = false;
      return;
    }
    setLoadingMore(true);
    setRefreshIndicator(true);
    setError(null);
    try {
      const prefRes = await fetch('/api/account/preferences', { cache: 'no-store' });
      const prefs = prefRes.ok ? await prefRes.json() : null;
      const naics = urlSearchOverrides.naics || prefs?.naicsCodes?.[0] || '';
      const setAside = urlSearchOverrides.setAside || prefs?.setAsides?.[0] || '';
      const state = urlSearchOverrides.state || prefs?.states?.[0] || '';
      if (!prefs?.completedOnboarding || !naics) {
        setAllOpportunities([]);
        setFilteredOpportunities([]);
        setDisplayedOpportunities([]);
        setError('Complete your preferences (including NAICS) to refresh live opportunities.');
        setToast({ type: 'error', msg: 'Complete preferences to refresh opportunities.' });
        setDataLoaded(true);
        return;
      }

      const query = new URLSearchParams({ limit: '200', status: 'active', naics });
      if (setAside) query.set('setAside', setAside);
      if (state) query.set('state', state);
      if (urlSearchOverrides.postedFrom) query.set('postedFrom', urlSearchOverrides.postedFrom);
      if (urlSearchOverrides.postedTo) query.set('postedTo', urlSearchOverrides.postedTo);

      const queryKey = getSamQueryKey(query);
      if (allOpportunities.length > 0 && isClientSamFetchCoolingDown(queryKey)) {
        const remaining = Math.max(1, getClientSamCooldownRemainingSec(queryKey));
        const msg = `Using cached results to protect API quota. Next live refresh available in ${remaining}s.`;
        setToast({ type: 'success', msg });
        setApiStatus({ status: 200, statusText: 'Client Cooldown', message: msg });
        setLastUpdated(getLastUpdatedLabel());
        return;
      }

      const res = await fetch(`/api/sam/opportunities?${query.toString()}`, { method: 'GET' });
      if (res.ok) {
        const data = await res.json();
        markClientSamFetch(queryKey);
        setAllOpportunities(data.opportunities || []);
        setFilteredOpportunities(data.opportunities || []);
        setDisplayedOpportunities(data.opportunities || []);
        setTotalRecords(data.totalRecords ?? (data.opportunities?.length || 0));
        setDisplayCount(250);
        setShowAllOpportunities(false);
        setShowMoreBands({});
        setSelectedUrgencyFilters(new Set());
        setActiveFilter(null);
        setKeywordSearch('');
        setSearchTerm('');
        setError(null);
        setDataLoaded(true);
        setLastUpdated(getLastUpdatedLabel());
        setApiStatus({ status: res.status, statusText: res.statusText, message: 'Success' });
        setToast({ type: 'success', msg: 'Feed refreshed from SAM.gov.' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        let errorPayload: any = null;
        try {
          errorPayload = await res.json();
        } catch {
          errorPayload = await res.text();
        }
        const msg = getSamErrorMessage(errorPayload, 'Unable to refresh opportunities from SAM.gov.');
        setDataLoaded(true);
        setApiStatus({
          status: res.status,
          statusText: res.statusText,
          message: typeof errorPayload === 'string' ? errorPayload : JSON.stringify(errorPayload),
        });
        // Try DB-cached fallback before showing the error
        try {
          const cacheRes = await fetch('/api/insights/opportunities', { cache: 'no-store' });
          if (cacheRes.ok) {
            const cacheData = await cacheRes.json();
            const cachedOpps: SamOpportunity[] = (cacheData.opportunities || []).map((o: any) => ({
              noticeId: String(o.noticeId || ''), title: o.title || 'Untitled opportunity',
              solicitationNumber: o.solicitationNumber || '', department: o.agency || 'Federal Agency',
              postedDate: o.postedDate ? new Date(o.postedDate).toISOString() : new Date().toISOString(),
              responseDeadLine: o.responseDeadline ? new Date(o.responseDeadline).toISOString() : '',
              naicsCode: o.naicsCode || '', typeOfSetAside: o.setAside || '',
              typeOfSetAsideDescription: o.setAside || '',
              uiLink: o.url || `https://sam.gov/opp/${o.noticeId}/view`, active: 'Yes',
            }));
            if (cachedOpps.length) {
              setAllOpportunities(cachedOpps); setFilteredOpportunities(cachedOpps);
              setDisplayedOpportunities(cachedOpps);
              setTotalRecords(cacheData.stats?.totalActive || cachedOpps.length);
              setLastUpdated(getLastUpdatedLabel());
              setToast({ type: 'warning', msg: 'Live SAM.gov temporarily unavailable — showing recently cached opportunities.' });
              return;
            }
          }
        } catch { /* keep original error */ }
        setError(msg);
        setToast({ type: 'error', msg });
      }
    } catch (e: any) {
      const msg = e?.message ? `Unable to refresh opportunities: ${e.message}` : 'Unable to refresh opportunities.';
      setDataLoaded(true);
      setApiStatus({ status: null, statusText: 'Network Error', message: msg });
      // Try DB-cached fallback before showing the error
      try {
        const cacheRes = await fetch('/api/insights/opportunities', { cache: 'no-store' });
        if (cacheRes.ok) {
          const cacheData = await cacheRes.json();
          const cachedOpps: SamOpportunity[] = (cacheData.opportunities || []).map((o: any) => ({
            noticeId: String(o.noticeId || ''), title: o.title || 'Untitled opportunity',
            solicitationNumber: o.solicitationNumber || '', department: o.agency || 'Federal Agency',
            postedDate: o.postedDate ? new Date(o.postedDate).toISOString() : new Date().toISOString(),
            responseDeadLine: o.responseDeadline ? new Date(o.responseDeadline).toISOString() : '',
            naicsCode: o.naicsCode || '', typeOfSetAside: o.setAside || '',
            typeOfSetAsideDescription: o.setAside || '',
            uiLink: o.url || `https://sam.gov/opp/${o.noticeId}/view`, active: 'Yes',
          }));
          if (cachedOpps.length) {
            setAllOpportunities(cachedOpps); setFilteredOpportunities(cachedOpps);
            setDisplayedOpportunities(cachedOpps);
            setTotalRecords(cacheData.stats?.totalActive || cachedOpps.length);
            setLastUpdated(getLastUpdatedLabel());
            setToast({ type: 'success', msg: 'Live SAM.gov temporarily unavailable — showing recently cached opportunities.' });
            return;
          }
        }
      } catch { /* keep original error */ }
      setError(msg);
      setToast({ type: 'error', msg });
    } finally {
      setLoadingMore(false);
      setRefreshIndicator(false);
      liveFetchInFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (urlSearchOverrides.source !== 'insights' || urlSearchOverrides.update !== '1') return;
    if (sessionStatus === 'loading') return;
    if (autoRefreshFromInsightsRef.current) return;
    autoRefreshFromInsightsRef.current = true;
    handleRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionStatus, urlSearchOverrides.source, urlSearchOverrides.update]);

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
    loadSavedOpportunities();
  }, [loadSavedOpportunities]);

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

  // Load account preferences (NAICS, set-asides, states) and apply to feed
  useEffect(() => {
    if (!isLoggedIn) return
    fetch('/api/account/preferences', { cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(prefs => {
        if (!prefs) return
        setAccountPreferences(prefs)
        // Store prefs for reference but don't auto-filter the feed
      })
      .catch(() => {})
  }, [isLoggedIn])

  // On login, load live opportunities anchored to account preferences.
  useEffect(() => {
    if (sessionStatus === 'loading') return;
    if (!isLoggedIn) return;
    if (allOpportunities.length === 0 && !error) {
      if (liveFetchInFlightRef.current) return;

      // Falls back to the DB-cached opportunity snapshot when the live SAM.gov
      // call fails. Returns true if cached data was loaded successfully.
      const tryLoadCachedOpportunities = async (): Promise<boolean> => {
        try {
          const cacheRes = await fetch('/api/insights/opportunities', { cache: 'no-store' });
          if (!cacheRes.ok) return false;
          const cacheData = await cacheRes.json();
          const cachedOpps: SamOpportunity[] = (cacheData.opportunities || []).map((o: any) => ({
            noticeId: String(o.noticeId || ''),
            title: o.title || 'Untitled opportunity',
            solicitationNumber: o.solicitationNumber || '',
            department: o.agency || 'Federal Agency',
            postedDate: o.postedDate ? new Date(o.postedDate).toISOString() : new Date().toISOString(),
            responseDeadLine: o.responseDeadline ? new Date(o.responseDeadline).toISOString() : '',
            naicsCode: o.naicsCode || '',
            typeOfSetAside: o.setAside || '',
            typeOfSetAsideDescription: o.setAside || '',
            uiLink: o.url || `https://sam.gov/opp/${o.noticeId}/view`,
            active: 'Yes',
          }));
          if (!cachedOpps.length) return false;
          setAllOpportunities(cachedOpps);
          setFilteredOpportunities(cachedOpps);
          setDisplayedOpportunities(cachedOpps);
          setTotalRecords(cacheData.stats?.totalActive || cachedOpps.length);
          setDataSource('live');
          setError(null);
          setLastUpdated(getLastUpdatedLabel());
          setToast({ type: 'success', msg: 'Live SAM.gov temporarily unavailable — showing recently cached opportunities.' });
          return true;
        } catch {
          return false;
        }
      };

      const fetchInitialOpportunities = async () => {
        liveFetchInFlightRef.current = true;
        setLoading(true);
        setError(null);
        try {
          const prefRes = await fetch('/api/account/preferences', { cache: 'no-store' });
          const prefs = prefRes.ok ? await prefRes.json() : null;
          const naics = urlSearchOverrides.naics || prefs?.naicsCodes?.[0] || '';
          const setAside = urlSearchOverrides.setAside || prefs?.setAsides?.[0] || '';
          const state = urlSearchOverrides.state || prefs?.states?.[0] || '';

          if (!prefs?.completedOnboarding || !naics) {
            setAllOpportunities([]);
            setFilteredOpportunities([]);
            setDisplayedOpportunities([]);
            setTotalRecords(0);
            setDataLoaded(true);
            setError('Complete your preferences (including NAICS) to load live opportunities.');
            liveFetchInFlightRef.current = false;
            return;
          }

          const query = new URLSearchParams({ limit: '200', status: 'active', naics });
          if (setAside) query.set('setAside', setAside);
          if (state) query.set('state', state);
          if (urlSearchOverrides.postedFrom) query.set('postedFrom', urlSearchOverrides.postedFrom);
          if (urlSearchOverrides.postedTo) query.set('postedTo', urlSearchOverrides.postedTo);
          const queryKey = getSamQueryKey(query);
          const url = `/api/sam/opportunities?${query.toString()}`;
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            markClientSamFetch(queryKey);
            setAllOpportunities(data.opportunities || []);
            setFilteredOpportunities(data.opportunities || []);
            setDisplayedOpportunities(data.opportunities || []);
            setTotalRecords(data.totalRecords ?? (data.opportunities?.length || 0));
            setDataLoaded(true);
            setDataSource('live');
            setError(null);
            setLastUpdated(getLastUpdatedLabel());
            setApiStatus({ status: res.status, statusText: res.statusText, message: 'Success' });
          } else {
            let errorPayload: any = null;
            try {
              errorPayload = await res.json();
            } catch {
              errorPayload = await res.text();
            }
            const msg = getSamErrorMessage(errorPayload, 'Unable to load opportunities. Please try Refresh.');
            setApiStatus({
              status: res.status,
              statusText: res.statusText,
              message: typeof errorPayload === 'string' ? errorPayload : JSON.stringify(errorPayload),
            });
            // Live API failed — try DB-cached fallback so the page isn't blank
            const loadedFromCache = await tryLoadCachedOpportunities();
            if (!loadedFromCache) setError(msg);
          }
        } catch (err: any) {
          const msg = err?.message ? `Unable to load opportunities: ${err.message}` : 'Unable to load opportunities. Please try Refresh.';
          setApiStatus({ status: null, statusText: 'Network Error', message: err?.message || String(err) });
          const loadedFromCache = await tryLoadCachedOpportunities();
          if (!loadedFromCache) setError(msg);
        } finally {
          setLoading(false);
          setDataLoaded(true);
          liveFetchInFlightRef.current = false;
        }
      };
      fetchInitialOpportunities();
    }
  }, [allOpportunities.length, error, getLastUpdatedLabel, getSamErrorMessage, isLoggedIn, opportunityPreferences, sessionStatus, urlSearchOverrides, viewMode]);

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
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [keywordSearch, searchTerm, selectedType, selectedSetAside, activeFilter, selectedAgency, selectedNAICS, sortMode, listPageSize]);

  useEffect(() => {
    setBoardPage(1); // Reset board page when filters/view change
  }, [keywordSearch, searchTerm, selectedType, selectedSetAside, activeFilter, selectedAgency, selectedNAICS, selectedUrgency, sortMode, viewMode]);

  useEffect(() => {
    if (selectedUrgencyFilters.size > 0) {
      setShowUrgencyLegend(true);
    }
  }, [selectedUrgencyFilters]);

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when filters change
  }, [keywordSearch, searchTerm, selectedType, selectedSetAside, activeFilter, selectedAgency, selectedNAICS, sortMode, listPageSize]);

  useEffect(() => {
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
    // Remove expired opportunities (past deadline) from board.
    base = base.filter(opp => {
      const d = getEffectiveDeadline(opp);
      if (!d) return true;
      const bd = getBusinessDaysUntil(d);
      return bd === null || bd >= 0;
    });
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
    // Use displayedOpportunities (preference-filtered) for logged-in users UNLESS showAllOpportunities is true
    // Use displayed opportunities for guests (empty until authenticated).
    const source = isLoggedIn 
      ? (showAllOpportunities ? allOpportunities : displayedOpportunities)
      : displayedOpportunities;
    // Remove expired opportunities (past deadline) from list/compact source.
    const activeSource = source.filter(opp => {
      const d = getEffectiveDeadline(opp);
      if (!d) return true;
      const bd = getBusinessDaysUntil(d);
      return bd === null || bd >= 0;
    });
    if (terms.length === 0 || (terms.length === 1 && terms[0] === '')) return activeSource;
    return activeSource.filter(opp => {
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
  }, [allOpportunities, displayedOpportunities, isLoggedIn, keywordSearch, searchTerm, showAllOpportunities]);
  // visibleOpportunities: the actual set shown in list/compact views.
  // For guests, show whatever live opportunities are available from cache/API.
  // For logged-in users, respect displayCount.
  const totalPages = Math.max(1, Math.ceil(keywordFiltered.length / listPageSize));
  // keywordFiltered now uses allOpportunities for logged-in — should show all 100
  const visibleOpportunities = !isLoggedIn
    ? keywordFiltered
    : viewMode === 'grid'
      ? keywordFiltered.slice(0, displayCount)
      : keywordFiltered.slice((currentPage - 1) * listPageSize, currentPage * listPageSize);
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

  // Disable auto preferences reminder for guests to avoid intrusive overlays
  useEffect(() => {
    return;
  }, [isLoggedIn, sessionStatus]);

  // Show full-screen loading when first fetching and no real data yet
  if (loading && allOpportunities.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-slate-50 to-blue-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-cyan-400" />
          <p className="text-2xl font-bold text-white mb-2">Loading Federal Opportunities</p>
          <p className="text-slate-300">Fetching live data from SAM.gov...</p>
        </div>
      </div>
    );
  }


  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-blue-50" style={{ overflowX: 'hidden', width: '100%', maxWidth: '100%' }}>
      {/* Top Search Bar */}
      <div className="sticky top-0 z-40 border-b border-cyan-100 bg-gradient-to-r from-slate-50 via-white to-cyan-50/50 backdrop-blur-md">
        <div className="max-w-480 mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-3.5">
          <div className="rounded-2xl border border-cyan-200/90 bg-white p-3 shadow-[0_10px_30px_-18px_rgba(14,116,144,0.65)]">
            <div className="mb-2 px-1 relative">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">
                <h1 className="text-[17px] sm:text-[19px] leading-tight font-black text-slate-900">
                  Federal Contract Opportunities
                </h1>
                <div className="inline-flex flex-col rounded-2xl border-2 border-orange-300 bg-gradient-to-r from-slate-900 via-slate-800 to-cyan-900 px-4 py-2.5 shadow-lg self-start lg:self-auto lg:justify-self-end">
                  <span className="mt-0.5 text-[13px] sm:text-[14px] font-black leading-tight whitespace-nowrap">
                    <span className="uppercase tracking-[0.12em] text-[10px] sm:text-[11px] text-cyan-200 mr-1.5">Powered by</span>
                    <span className="text-orange-300">PreciseGovCon<sup className="text-[9px] font-black text-orange-300"> ®</sup></span>
                    <span className="text-cyan-100 ml-1.5">Contract Intelligence</span>
                  </span>
                </div>
              </div>
              {isLoggedIn && (
                <div className="mt-1 flex justify-center lg:mt-0 lg:absolute lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 pointer-events-none">
                  <div className="inline-flex items-center justify-center rounded-xl border border-orange-300 bg-gradient-to-r from-orange-600 to-amber-500 px-4 py-1.5 text-[15px] sm:text-[16px] font-black text-white leading-tight shadow-md">
                    {userName ? `Welcome back, ${userName}` : 'Welcome back'}
                  </div>
                </div>
              )}
            </div>

            <div className="relative mt-1 rounded-2xl ring-2 ring-orange-300/90 shadow-[0_0_0_1px_rgba(251,146,60,0.28)]">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-9 rounded-xl bg-cyan-100 border border-cyan-200 flex items-center justify-center">
                <Search className="text-cyan-700 w-5 h-5" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search opportunities by title, agency, NAICS, set-aside, solicitation, or location"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setKeywordSearch(e.target.value); }}
                className="w-full pl-14 pr-12 py-3 bg-linear-to-r from-white to-orange-50/30 text-slate-900 border-2 border-orange-300 rounded-2xl placeholder-slate-400 focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 transition-all text-[16px] sm:text-[17px] font-extrabold shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={clearQuickSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-1.5"
                  aria-label="Clear search"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}
            </div>

            {(searchTerm || keywordSearch) && (
              <p className="mt-1.5 px-1 text-[12px] sm:text-[13px] text-slate-700 font-semibold">
                {keywordFiltered.length === 0
                  ? `No results for "${searchTerm || keywordSearch}". Try terms like veteran, army, wosb, 8a, hubzone, or a state abbreviation.`
                  : `${keywordFiltered.length} result${keywordFiltered.length !== 1 ? 's' : ''} for "${searchTerm || keywordSearch}"`
                }
              </p>
            )}

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 pr-1">Popular</span>
              {['SDVOSB', 'WOSB', '8(a)', 'HUBZone', 'Army', 'Air Force', 'VA', 'Texas'].map((term) => (
                <button
                  key={term}
                  type="button"
                  onClick={() => applyQuickSearch(term)}
                  className="inline-flex items-center rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[10px] sm:text-[11px] font-black uppercase tracking-wide text-cyan-800 hover:bg-cyan-100 hover:border-cyan-300 transition"
                >
                  {term}
                </button>
              ))}
            </div>

            <details className="mt-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2">
              <summary className="cursor-pointer list-none text-[11px] font-black uppercase tracking-[0.12em] text-slate-700 flex items-center justify-between">
                Search includes title, agency, solicitation, NAICS, set-aside, and location
                <span className="text-cyan-700">Details</span>
              </summary>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                {['Title: opportunity name and keywords', 'Agency: department and org path', 'Solicitation #: notice and IDs', 'NAICS: industry code', 'Set-Aside: small-business program', 'Location: city, state, zip'].map((item) => (
                  <span key={item} className="inline-flex items-center rounded-full border border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </details>
          </div>
        </div>
      </div>

      {dashboardDrilldown && (
        <div className="border-b border-cyan-200 bg-cyan-50">
          <div className="max-w-480 mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-3">
            <div className="rounded-xl border border-cyan-300 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-black text-cyan-800">{dashboardDrilldown.heading}</p>
              {dashboardDrilldown.details.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {dashboardDrilldown.details.map((item, idx) => (
                    <span
                      key={`${item}-${idx}`}
                      className="inline-flex items-center rounded-md border border-cyan-300 bg-cyan-100 px-2.5 py-1 text-sm font-bold text-cyan-900"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {insightsDrilldown && (
        <div className="border-b border-orange-200 bg-orange-50">
          <div className="max-w-480 mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-3">
            <div className="rounded-xl border border-orange-300 bg-white px-4 py-3 shadow-sm">
              <p className="text-sm font-black text-orange-800">{insightsDrilldown.heading}</p>
              {insightsDrilldown.details.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {insightsDrilldown.details.map((item, idx) => (
                    <span
                      key={`${item}-${idx}`}
                      className="inline-flex items-center rounded-md border border-orange-300 bg-orange-100 px-2.5 py-1 text-sm font-bold text-orange-900"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header with status */}
      <div className="border-b border-slate-200 bg-gradient-to-r from-white via-slate-50 to-cyan-50/30">
        <div className="max-w-480 mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3 text-sm text-slate-700">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm">
                <div className={`w-2 h-2 rounded-full ${error ? 'bg-orange-500 animate-pulse' : dataLoaded ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></div>
                <span>Last updated: <span className="font-semibold text-slate-900">{lastUpdated}</span></span>
                {(loading || (!dataLoaded && !error)) && (
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
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span className="font-medium text-slate-800">
                  {error ? (
                    <span className="text-orange-600">SAM.gov API unavailable</span>
                  ) : dataLoaded ? (
                    'Live data from SAM.gov'
                  ) : (
                    'Loading from SAM.gov...'
                  )}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              {userProfile && (
                <div
                className="hidden md:flex items-center gap-3 px-4 py-2.5 rounded-2xl border-2 border-indigo-200 bg-linear-to-br from-indigo-50 via-white to-cyan-50 cursor-pointer hover:shadow-md transition-all"
                  title="Monthly save goal: number of opportunities you want to bookmark this month. Click to update your target."
                  onClick={openGoalEditor}
                >
                  <TargetIcon className="w-4 h-4 text-indigo-700 flex-shrink-0" />
                  <p className="text-sm text-slate-800 font-bold whitespace-nowrap">
                    <span className="font-black text-indigo-700 mr-1">Monthly bookmark goal:</span>
                    <span className="font-extrabold text-slate-900">{userProfile.achievedThisMonth || 0}</span>
                    /{userProfile.monthlyGoal || 10} opportunities saved this month
                  </p>
                </div>
              )}
              <button
                onClick={handleExportOpportunities}
                className="inline-flex items-center gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-2.5 text-sm font-bold text-cyan-900 transition hover:bg-cyan-100 shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
              <Link
                href="/dashboard/saved-opportunities"
                className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100 shadow-sm"
              >
                <Bookmark className="h-4 w-4" />
                <span className="hidden sm:inline">Saved Opportunities</span>
              </Link>
              <button
                onClick={() => {
                  if (!isLoggedIn) {
                  window.location.href = '/login?next=/opportunities';
                  return;
                }
                window.location.href = '/dashboard/onboarding?next=/opportunities';
              }}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-orange-200 bg-orange-50 text-orange-900 font-bold shadow-sm hover:bg-orange-100 transition-all"
              >
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">{isLoggedIn ? 'Update Preferences' : 'Sign In to Set Preferences'}</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshIndicator}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-bold transition-colors disabled:opacity-50 border border-slate-900 shadow-sm hover:bg-slate-800"
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
          <div className="max-w-480 mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-4">
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

      {goalEditorOpen && (
        <div className="fixed inset-0 z-[120] bg-black/35 backdrop-blur-[1px] flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white shadow-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-black text-slate-900">Set Monthly Bookmark Goal</h3>
              <button
                onClick={() => setGoalEditorOpen(false)}
                className="h-8 w-8 inline-flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                aria-label="Close goal editor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Choose how many opportunities you want to bookmark this month.
            </p>
            <input
              type="number"
              min={1}
              step={1}
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-base font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-cyan-500"
            />
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => setGoalEditorOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={saveGoalEditor}
                className="px-4 py-2 rounded-lg bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700"
              >
                Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

{/* ticker sample feed banner removed */}

      <div className="max-w-480 mx-auto px-3 sm:px-6 lg:px-10 xl:px-12 py-2">

        {/* ── HERO SECTION ─────────────────────────────────────────────────── */}
        {isLoggedIn ? null : (
          /* Guest: informational banner (CTA kept at bottom of page) */
          <div className="mb-3 bg-gradient-to-r from-slate-50 via-white to-emerald-50 rounded-xl border border-slate-200 overflow-hidden shadow-md" style={{ fontFamily: 'Aptos, Inter, Arial, sans-serif' }}>
            <div className="flex flex-col sm:flex-row">
              {/* Left: context */}
              <div className="flex-1 px-5 py-4 flex items-start gap-3">
                <Image src="/logo.png" alt="PreciseGovCon" width={44} height={44} className="w-10 h-10 object-contain flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-slate-700 text-white text-[11px] font-black uppercase tracking-wider shadow-sm">
                      Sign-In Required
                    </span>
                    {guestDataLoading ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Loading from SAM.gov…
                      </span>
                    ) : (
                      <span className="text-slate-700 text-xs font-semibold">
                        Sign in to load live opportunities using your saved preferences
                      </span>
                    )}
                  </div>
                  <p className="text-base sm:text-xl font-extrabold text-slate-900 leading-snug">
                    Personalized live opportunities are available after sign-in.
                  </p>
                  <p className="text-sm text-slate-700 mt-1 leading-snug">
                    Sign in to unlock a feed filtered by your <strong>NAICS codes</strong>, <strong>PSC codes</strong>, certifications, and agency preferences — powered by <span className="text-[#ff7a18] font-extrabold">PreciseGovCon<sup className="text-[10px]"> ®</sup></span> Opportunity Intelligence.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Banner — shown to logged-in users who haven't completed survey */}
        {isLoggedIn && showWelcomeBanner && !userProfile.hasCompletedSurvey && (
          <div className="mb-3 rounded-xl border border-slate-200 bg-white shadow-sm relative overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-sky-400 to-amber-400" />
            <button onClick={handleDismissBanner} className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 pr-12">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-50 to-blue-100 border border-cyan-200 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  Welcome to PreciseGovCon's Opportunities Pipeline
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Your streamlined federal contracting platform — powered by live SAM.gov data and AI-driven matching.
                  {userName ? ` Complete your profile, ${userName}, to activate your personalized feed.` : ' Complete your profile to activate your personalized feed.'}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => { window.location.href = '/dashboard/onboarding?next=/opportunities'; }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-extrabold shadow-sm hover:bg-emerald-500 transition-all whitespace-nowrap"
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
          <div className="mb-3 rounded-xl border border-emerald-200 bg-white shadow-sm relative overflow-hidden">
            <div className="h-1 w-full bg-gradient-to-r from-emerald-400 to-cyan-400" />
            <button onClick={handleDismissBanner} className="absolute top-3 right-3 p-1.5 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-5 py-4 pr-12">
              <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                  Your Feed is Active{userName ? `, ${userName}` : ''}
                </h2>
                <p className="text-sm text-slate-600 mt-0.5">
                  Showing {displayedOpportunities.length} opportunities matched to your profile. Update preferences anytime to refine your results.
                </p>
              </div>
              <button onClick={() => window.location.href = '/dashboard/onboarding?next=/opportunities'}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold shadow-md hover:shadow-lg transition-all whitespace-nowrap flex-shrink-0">
                <Settings className="w-4 h-4" />
                Update Preferences
              </button>
            </div>
          </div>
        )}

        {/* ── Unified Filter + View Controls ──────────────────────────────── */}
        <div className="mb-2 rounded-xl border border-slate-200 bg-white shadow-sm p-2">
          <div className="grid grid-cols-5 gap-2">
            {([
              { filter: 'active'      as const, icon: <CheckCircle2 style={{width:18,height:18,color:'#ffffff',flexShrink:0}} />, value: stats.totalActive, label: 'Active',       solid: '#059669', active: '#047857' },
              { filter: 'setasides'   as const, icon: <Award         style={{width:18,height:18,color:'#ffffff',flexShrink:0}} />, value: stats.setAsides,   label: 'Set-Asides',  solid: '#7c3aed', active: '#6d28d9' },
              { filter: 'expiring'    as const, icon: <Timer         style={{width:18,height:18,color:'#ffffff',flexShrink:0}} />, value: stats.closingSoon, label: 'Closing ≤7d', solid: '#dc2626', active: '#b91c1c' },
              { filter: 'departments' as const, icon: <Building2     style={{width:18,height:18,color:'#ffffff',flexShrink:0}} />, value: stats.departments, label: 'Agencies',    solid: '#0891b2', active: '#0e7490' },
            ] as const).map(s => {
              const isActive = activeFilter === s.filter;
              return (
                <button
                  key={s.filter}
                  type="button"
                  onClick={() => handlePillClick(s.filter)}
                  style={{
                    background: isActive ? s.active : s.solid,
                    border: isActive ? `2px solid #fff` : '2px solid transparent',
                    borderRadius: 12,
                    padding: '10px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 4,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    boxShadow: isActive ? '0 0 0 3px rgba(255,255,255,0.25), 0 4px 14px rgba(0,0,0,0.3)' : '0 2px 8px rgba(0,0,0,0.25)',
                    width: '100%',
                  }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.filter = 'brightness(1.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.filter = ''; }}
                >
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {s.icon}
                    <span style={{color:'#ffffff',fontSize:20,fontWeight:900,lineHeight:1,letterSpacing:'-0.01em'}}>
                      {s.value.toLocaleString()}
                    </span>
                  </div>
                  <span style={{color:'#ffffff',fontSize:13,fontWeight:700,letterSpacing:'0.02em',textTransform:'uppercase'}}>
                    {s.label}
                  </span>
                  {isActive && (
                    <span style={{color:'rgba(255,255,255,0.75)',fontSize:11,fontWeight:600}}>
                      ✓ Active filter — click to clear
                    </span>
                  )}
                </button>
              );
            })}
            {/* Posted Today — non-filterable info button */}
            <div
              style={{
                background: '#d97706',
                border: '2px solid transparent',
                borderRadius: 12,
                padding: '10px 10px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
              }}
            >
              <div style={{display:'flex',alignItems:'center',gap:6}}>
                <Calendar style={{width:18,height:18,color:'#ffffff',flexShrink:0}} />
                <span style={{color:'#ffffff',fontSize:20,fontWeight:900,lineHeight:1,letterSpacing:'-0.01em'}}>
                  {stats.postedToday.toLocaleString()}
                </span>
              </div>
              <span style={{color:'#ffffff',fontSize:13,fontWeight:700,letterSpacing:'0.02em',textTransform:'uppercase'}}>
                Posted Today
              </span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
            {!isLoggedIn && (
              <a
                href="/login"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold hover:bg-orange-100 transition-colors whitespace-nowrap mr-auto"
              >
                <Settings className="w-3.5 h-3.5" />
                Sign in to update preferences
              </a>
            )}

            <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
              {/* View mode */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                {([
                  { mode: 'list' as ViewMode, icon: <List className="w-3.5 h-3.5" />, label: 'List' },
                  { mode: 'grid' as ViewMode, icon: <Grid3x3 className="w-3.5 h-3.5" />, label: 'Board' },
                  { mode: 'compact' as ViewMode, icon: <Layers className="w-3.5 h-3.5" />, label: 'Compact' },
                ] as {mode: ViewMode; icon: React.ReactNode; label: string}[]).map(v => (
                  <button
                    key={v.mode}
                    onClick={() => { setViewMode(v.mode); if (v.mode === 'grid') setGroupMode('none'); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                      viewMode === v.mode
                        ? (v.mode === 'list'
                          ? 'bg-sky-100 text-sky-800 shadow-sm border border-sky-300'
                          : v.mode === 'grid'
                            ? 'bg-amber-100 text-amber-800 shadow-sm border border-amber-300'
                            : 'bg-emerald-100 text-emerald-800 shadow-sm border border-emerald-300')
                        : 'text-slate-600 hover:bg-slate-200 border border-transparent'
                    }`}
                  >
                    {v.icon}{v.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-6 bg-slate-200 hidden sm:block" />

              {/* Sort */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:inline">Sort</span>
                <select
                  value={sortMode}
                  onChange={e => setSortMode(e.target.value as SortMode)}
                  className="text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm"
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
                  <div className="w-px h-6 bg-slate-200 hidden sm:block" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:inline">Group</span>
                    <select
                      value={groupMode}
                      onChange={e => setGroupMode(e.target.value as GroupMode)}
                      className="text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm"
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
                  <div className="w-px h-6 bg-slate-200 hidden sm:block" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide hidden sm:inline">Rows</span>
                    <select
                      value={listPageSize}
                      onChange={e => setListPageSize(Number(e.target.value))}
                      className="text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm"
                    >
                      <option value={10}>10 / page</option>
                      <option value={20}>20 / page</option>
                      <option value={30}>30 / page</option>
                      <option value={50}>50 / page</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Collapsible deadline urgency controls */}
        <div className="mb-1 p-2.5 bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
            <div className="flex flex-wrap items-center gap-2">
              <Timer className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm sm:text-base font-black text-slate-900 tracking-wide">Submission Deadline</h3>
              <span className="px-2.5 py-1 bg-slate-100 rounded-full text-xs sm:text-sm font-bold text-amber-700">
                Business Days Remaining
              </span>
              <button
                onClick={() => setShowUrgencyLegend(v => !v)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors"
              >
                {showUrgencyLegend ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                {showUrgencyLegend ? 'Hide Deadline Filters' : 'Show Deadline Filters'}
              </button>
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
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border shadow-sm transition-colors ${
                  showAllOpportunities
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-white text-amber-700 border-amber-200 hover:bg-amber-50'
                }`}
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
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold border shadow-sm transition-colors ${
                  loadingMore
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingMore ? 'animate-spin' : ''}`} />
                {loadingMore ? 'Refreshing…' : 'Refresh'}
              </button>

              {selectedUrgencyFilters.size > 0 && (
                <button
                  onClick={() => setSelectedUrgencyFilters(new Set())}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Filter
                </button>
              )}
            </div>
          </div>

          {showUrgencyLegend ? (
            <>
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
                  const palette: Record<string, string> = {
                    CRITICAL: 'bg-rose-600 text-white border-rose-700',
                    URGENT: 'bg-amber-600 text-white border-amber-700',
                    HIGH: 'bg-orange-500 text-white border-orange-600',
                    'ACT SOON': 'bg-lime-600 text-white border-lime-700',
                    NORMAL: 'bg-emerald-600 text-white border-emerald-700',
                    COMFORTABLE: 'bg-green-600 text-white border-green-700',
                    AMPLE: 'bg-teal-600 text-white border-teal-700',
                    PLENTY: 'bg-sky-600 text-white border-sky-700',
                  };
                  const base = palette[item.label] || 'bg-slate-800 text-white border-slate-900';
                  return (
                    <button
                      key={item.label}
                      onClick={() => setSelectedUrgencyFilters(prev => {
                        const next = new Set(prev);
                        if (next.has(item.label)) { next.delete(item.label); } else { next.add(item.label); }
                        return next;
                      })}
                      className={`w-full rounded-lg px-3 py-3 text-sm font-black uppercase tracking-wide border shadow-sm transition-transform ${base} ${
                        isActive ? 'ring-2 ring-offset-1 ring-white/70 scale-[1.03]' : 'hover:scale-[1.01]'
                      }`}
                      style={{ letterSpacing: '0.05em' }}
                    >
                      <div className="text-xs font-extrabold leading-none">{item.label}</div>
                      <div className="text-xs font-semibold leading-none mt-1 text-white">{item.range}</div>
                      {isActive && (
                        <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-black/25 text-white text-[11px] font-bold">
                          <span className="w-2 h-2 rounded-full bg-white" />
                          Filtering
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              <p className="mt-2.5 text-xs sm:text-sm text-slate-600 text-center">
                {selectedUrgencyFilters.size > 0
                  ? `Active filters: ${Array.from(selectedUrgencyFilters).join(' | ')} - click to deselect`
                  : 'Click one or more deadline categories to filter. Multi-select supported.'}
              </p>
            </>
          ) : (
            <div className="mt-1 flex flex-wrap items-center justify-between gap-2 px-1">
              <p className="text-xs sm:text-sm text-slate-600">
                {selectedUrgencyFilters.size > 0
                  ? `Active deadline filters: ${Array.from(selectedUrgencyFilters).join(' | ')}`
                  : 'Deadline filters are hidden to keep more opportunities visible.'}
              </p>
              {selectedUrgencyFilters.size > 0 && (
                <button
                  onClick={() => setSelectedUrgencyFilters(new Set())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear Deadline Filters
                </button>
              )}
            </div>
          )}
        </div>



        {/* Sample vs Personalized Comparison Banner */}
        {!isLoggedIn && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300">
              {/* Left: Sample Feed */}
              <div className="bg-gradient-to-br from-slate-950 to-slate-800 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/20 border border-orange-400 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-orange-400" />
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-orange-300">What You're Seeing Now</h3>
                </div>
                <p className="mb-4 text-base sm:text-lg font-semibold leading-relaxed text-slate-100">
                  This is a broad public sample feed. It shows live notices, but it is not filtered for your business.
                </p>
                <ul className="space-y-3 text-base sm:text-lg">
                  <li className="flex items-start gap-3 text-slate-50">
                    <span className="text-orange-300 font-black text-xl leading-none mt-0.5">✕</span>
                    <span className="text-slate-50">Random government contracts from across all agencies</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-50">
                    <span className="text-orange-300 font-black text-xl leading-none mt-0.5">✕</span>
                    <span className="text-slate-50">No filtering by your business focus, certifications, or industry</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-50">
                    <span className="text-orange-300 font-black text-xl leading-none mt-0.5">✕</span>
                    <span className="text-slate-50">Opportunities that may not match your NAICS codes</span>
                  </li>
                  <li className="flex items-start gap-3 text-slate-50">
                    <span className="text-orange-300 font-black text-xl leading-none mt-0.5">✕</span>
                    <span className="text-slate-50">No personalized scoring, tracking, or saved pipeline workflow</span>
                  </li>
                </ul>
              </div>

              {/* Right: Personalized Feed */}
              <div className="bg-gradient-to-br from-emerald-900 to-teal-900 p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-400/20 border border-emerald-400 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-emerald-400" />
                  </div>
                  <h3 className="text-xl sm:text-2xl font-extrabold text-emerald-400">With Your Free Account</h3>
                </div>
                <ul className="space-y-2.5 text-sm sm:text-base">
                  <li className="flex items-start gap-2.5 text-slate-100">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span><span className="font-semibold">Filtered by your NAICS codes</span> — only relevant opportunities</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-100">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span><span className="font-semibold">Matched to your set-asides</span> — HUBZone, WOSB, SDB, 8(a), etc.</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-100">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span><span className="font-semibold">Personalized to your agency targets</span> — if you choose them</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-100">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <span><span className="font-semibold">Save & track unlimited opportunities</span> — build your pipeline</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Results Header */}
        <div ref={resultsRef} className="mb-2 flex items-center justify-between flex-wrap gap-2">
          {!isLoggedIn ? (
            /* Guest CTA bar */
            <div className="w-full rounded-2xl border border-orange-200 bg-gradient-to-r from-white via-orange-50 to-amber-50 px-5 py-4 sm:px-6 sm:py-5 shadow-sm">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-6 w-full">
                <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 min-w-0">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700 text-white text-sm sm:text-base font-black uppercase tracking-wider shadow-sm whitespace-nowrap">
                    Sign-In Required
                  </span>
                  {guestDataLoading ? (
                    <span className="inline-flex items-center gap-2 text-sky-700 text-lg sm:text-2xl font-black leading-tight">
                      <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      Fetching opportunities from SAM.gov...
                    </span>
                  ) : (
                    <div className="text-slate-900 text-xl sm:text-2xl lg:text-3xl font-black leading-tight">
                      Showing <span className="text-emerald-700">{viewMode === 'grid' ? boardFiltered.length : keywordFiltered.length}</span> opportunities
                      {guestDataFreshAt && <span className="text-slate-600 font-bold"> · data from {guestDataFreshAt}</span>}
                    </div>
                  )}
                </div>
                <a href="/login" className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-[#ff7a18] hover:bg-orange-600 text-white text-base sm:text-lg font-extrabold rounded-xl transition-colors shadow-sm whitespace-nowrap self-start lg:self-center">
                  Sign in for your personalized feed →
                </a>
              </div>
            </div>
          ) : visibleOpportunities.length === 0 && displayedOpportunities.length === 0 ? (
            <h3 className="text-xl font-bold text-white">
              <span className="text-slate-300">
                No opportunities available at this time. Click <b>Refresh</b> to try again.
              </span>
            </h3>
          ) : keywordFiltered.length === 0 && (searchTerm || keywordSearch) ? (
            <h3 className="text-xl font-bold text-white">
              <span className="text-slate-300">
                No opportunities match "{searchTerm || keywordSearch}". {' '}
                <button 
                  onClick={() => { setSearchTerm(''); setKeywordSearch(''); }}
                  className="text-cyan-400 hover:text-cyan-300 underline transition-colors"
                >
                  Clear search
                </button>
                {displayedOpportunities.length > 0 && !showAllOpportunities ? ` — ${displayedOpportunities.length} match your preferences` : ''}
              </span>
            </h3>
          ) : (
            <h3 className="text-xl font-bold text-white">
              Showing{' '}
              <span className="text-cyan-400">
                {viewMode === 'grid' 
                  ? `${boardFiltered.length} opportunities`
                  : `${visibleOpportunities.length} of ${keywordFiltered.length} | Page ${currentPage} of ${totalPages}`}
              </span>
              <span className="text-slate-400 font-normal text-base">
                {viewMode !== 'grid' ? '' : ' opportunities'}
              </span>
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

        {/* Only show the board if there are opportunities to display */}
        {viewMode === 'grid' && boardFiltered.length > 0 && (() => {
          const BANDS = [
            { key: 'CRITICAL', min: 0, max: 3, color: '#dc2626' },
            { key: 'URGENT', min: 4, max: 5, color: '#ea580c' },
            { key: 'HIGH', min: 6, max: 7, color: '#d97706' },
            { key: 'ACT SOON', min: 8, max: 10, color: '#ca8a04' },
            { key: 'NORMAL', min: 11, max: 14, color: '#65a30d' },
            { key: 'COMFORTABLE', min: 15, max: 21, color: '#16a34a' },
            { key: 'AMPLE', min: 22, max: 30, color: '#059669' },
            { key: 'PLENTY', min: 31, max: 99999, color: '#0d9488' },
          ] as const;

          type BoardBand = (typeof BANDS)[number];
          type BoardItem = SamOpportunity & { bd: number; band: BoardBand['key']; color: BoardBand['color'] };

          const withDeadline: BoardItem[] = boardFiltered
            .filter(opp => !opp.noticeId.startsWith('placeholder'))
            .flatMap((opp): BoardItem[] => {
              const dl = getEffectiveDeadline(opp);
              if (!dl) return [];
              const bd = getBusinessDaysUntil(dl) ?? -1;
              if (bd < 0) return [];
              const band = BANDS.find(b => bd >= b.min && bd <= b.max) ?? BANDS[BANDS.length - 1];
              return [{ ...opp, bd, band: band.key, color: band.color }];
            });

          const urgencyActive = selectedUrgencyFilters.size > 0;
          const filteredBoard = urgencyActive
            ? withDeadline.filter(item => selectedUrgencyFilters.has(item.band))
            : withDeadline;

          const sortedBoard = [...filteredBoard].sort((a, b) => {
            if (a.bd !== b.bd) return a.bd - b.bd;
            return (a.title || '').localeCompare(b.title || '');
          });

          const boardTotalPages = Math.max(1, Math.ceil(sortedBoard.length / BOARD_PAGE_SIZE));
          const safeBoardPage = Math.min(boardPage, boardTotalPages);
          const pageStart = (safeBoardPage - 1) * BOARD_PAGE_SIZE;
          const pageEnd = pageStart + BOARD_PAGE_SIZE;
          const pagedBoard = sortedBoard.slice(pageStart, pageEnd);

          return (
            <div className="w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {pagedBoard.map(opp => {
                  const deadline = getEffectiveDeadline(opp);
                  const postedDate = getEffectivePostedDate(opp);
                  const isSaved = savedOpportunities.has(opp.noticeId);
                  const isViewed = viewedOpportunities.has(opp.noticeId);
                  const setAsideStyle = getSetAsideStyle(opp);

                  return (
                    <div
                      key={opp.noticeId}
                      onClick={() => setSelectedOpp(opp)}
                      className={`rounded-xl border bg-white p-3 shadow-sm hover:shadow-md transition-all cursor-pointer ${isViewed ? 'opacity-75' : ''}`}
                      style={{ borderColor: `${opp.color}66`, borderLeft: `6px solid ${opp.color}` }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="px-2 py-0.5 rounded-full text-xs font-black text-white" style={{ background: opp.color }}>
                          {opp.band} · {opp.bd}d
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-600 truncate max-w-[96px]">
                            {getAgencyAbbreviation(opp.department)}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleSaveOpportunity(opp.noticeId); }}
                            className="p-1.5 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-rose-600 hover:border-rose-200"
                            title={isSaved ? 'Remove bookmark' : 'Bookmark'}
                          >
                            <Bookmark className="w-3.5 h-3.5" fill={isSaved ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-3 mb-2">
                        {opp.title}
                      </h4>

                      <div className="text-sm mb-1">
                        <span className="font-black" style={{ color: opp.color }}>DUE {deadline ? formatDate(deadline) : 'NO DEADLINE'}</span>
                      </div>
                      <div className="text-xs text-slate-500 mb-2">
                        Posted {formatDate(postedDate)}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs text-slate-700 truncate">{opp.department}</p>
                          {setAsideStyle && (
                            <span
                              className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase"
                              style={{ background: setAsideStyle.bg, color: setAsideStyle.text, border: `1px solid ${setAsideStyle.color}` }}
                            >
                              {setAsideStyle.label}
                            </span>
                          )}
                        </div>
                        <a
                          href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { e.stopPropagation(); handleViewOpportunity(opp.noticeId); }}
                          className="px-2.5 py-1.5 rounded-md bg-orange-600 text-white text-xs font-bold hover:bg-orange-700 whitespace-nowrap"
                        >
                          View
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>

              {sortedBoard.length === 0 && (
                <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-600">
                  No opportunities match the selected urgency bands.
                </div>
              )}

              {boardTotalPages > 1 && (
                <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => setBoardPage(p => Math.max(1, p - 1))}
                    disabled={safeBoardPage === 1}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold disabled:opacity-50"
                  >
                    Prev
                  </button>
                  <span className="text-sm font-semibold text-slate-700 px-2">
                    Board page {safeBoardPage} of {boardTotalPages}
                  </span>
                  <button
                    onClick={() => setBoardPage(p => Math.min(boardTotalPages, p + 1))}
                    disabled={safeBoardPage === boardTotalPages}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              )}
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
                  {sortedOpportunities.map((opp, oppIndex) => {
                    const isPlaceholder = opp.noticeId.startsWith('placeholder');
                    const deadline = isPlaceholder ? null : getEffectiveDeadline(opp);
                    const postedDate = getEffectivePostedDate(opp);
                    const businessDays = deadline ? getBusinessDaysUntil(deadline) : null;
                    const isSaved = savedOpportunities.has(opp.noticeId);
                    const isViewed = viewedOpportunities.has(opp.noticeId);
                    const hasRealDeadline = !!opp.responseDeadLine;
                    const compactIndex = (currentPage - 1) * listPageSize + oppIndex + 1;

                    const urgencyGradient = businessDays !== null ? getUrgencyGradient(businessDays) : getNoDeadlineGradient();
                    const urgencyTextColor = businessDays !== null ? getUrgencyTextColor(businessDays) : getNoDeadlineTextColor();
                    const urgencyLabel = businessDays !== null ? getUrgencyLabel(businessDays) : 'NO DEADLINE';

                    return (
                      <div
                        key={opp.noticeId}
                        className={`group p-3 rounded-lg border hover:shadow-md transition-all bg-gradient-to-r ${urgencyGradient} ${
                          isPlaceholder ? 'animate-pulse' : ''
                        } ${isViewed ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Urgency Badge */}
                          {!isPlaceholder && (
                            <div className="flex flex-col gap-2 w-[132px] sm:w-[190px] shrink-0">
                              <div style={{fontWeight:800,fontSize:12,padding:'4px 10px',borderRadius:8,display:'inline-flex',alignItems:'center',justifyContent:'space-between',gap:6,color:'#fff',background: businessDays !== null && businessDays <= 3 ? '#dc2626' : businessDays !== null && businessDays <= 5 ? '#ea580c' : businessDays !== null && businessDays <= 7 ? '#d97706' : businessDays !== null && businessDays <= 10 ? '#ca8a04' : businessDays !== null && businessDays <= 14 ? '#65a30d' : '#16a34a'}}>
                                <span>{urgencyLabel}</span>
                                <span className="ml-2">{businessDays !== null ? `${businessDays}bd` : 'Γê₧'}</span>
                              </div>
                            </div>
                          )}

                          {/* Response Deadline */}
                          {!isPlaceholder && (
                            <div className="mb-0 p-2 bg-white/75 rounded-lg border border-slate-200 flex-shrink-0 shadow-sm">
                              <div className="flex items-center gap-2 text-xs text-slate-600 mb-1 font-semibold">
                                <Calendar className="w-3 h-3" />
                                <span>Response Deadline</span>
                              </div>
                              <div className={`text-sm font-bold ${urgencyTextColor}`}>
                                {deadline ? formatDate(deadline) : 'No deadline'}
                                {opp.updatedResponseDeadLine && (
                                  <span className="ml-2 text-xs text-cyan-400">(Updated)</span>
                                )}
                              </div>
                              <div className="mt-1 pt-1 border-t border-slate-200 text-xs text-slate-600 font-medium">
                                Due: {deadline ? formatDate(deadline) : 'No deadline'} · Posted: {formatDate(postedDate)}
                                {opp.updatedPostedDate && opp.updatedPostedDate !== opp.postedDate && (
                                  <span className="ml-2 text-cyan-400">ΓÇó Updated: {formatDate(opp.updatedPostedDate)}</span>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Title and Department */}
                          <div className="flex-1 min-w-0">
                            <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                              <span style={{background:'#334155',color:'#94a3b8',fontSize:10,fontWeight:800,padding:'1px 6px',borderRadius:4,flexShrink:0}}>#{compactIndex}</span>
                            </div>
                            <h4 className="text-sm font-extrabold text-slate-900 mb-0.5 truncate">
                              {isPlaceholder ? (
                                <span className="inline-block h-4 w-64 bg-slate-700 rounded"></span>
                              ) : (
                                opp.title
                              )}
                            </h4>
                            <div className="flex items-center gap-3 text-xs text-slate-700 font-semibold">
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
                                  <span className="px-2 py-0.5 bg-slate-700 border border-slate-600 rounded text-xs text-white font-bold">
                                    {getAgencyAbbreviation(opp.department)}
                                  </span>
                                </>
                              )}
                              {!isPlaceholder && opp.typeOfSetAsideDescription && opp.typeOfSetAsideDescription !== 'None' && (
                                <span className="px-2 py-0.5 bg-blue-100 border border-blue-300 text-blue-800 rounded text-xs font-bold">
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
                                  className="p-2 rounded-lg bg-white border border-slate-300 hover:bg-rose-100 text-slate-700 hover:text-rose-700 transition-colors"
                                  title={isSaved ? 'Remove bookmark' : 'Bookmark'}
                                >
                                  <Bookmark className="w-4 h-4" fill={isSaved ? 'currentColor' : 'none'} />
                                </button>
                                <a
                                  href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={() => handleViewOpportunity(opp.noticeId)}
                                  style={{background:'#ea580c',color:'#fff',fontWeight:700,fontSize:12,padding:'6px 12px',borderRadius:8,display:'inline-flex',alignItems:'center',gap:6,textDecoration:'none'}} className="hover:opacity-90 transition-opacity"
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
                <div className="space-y-2.5">
                  {sortedOpportunities.map((opp, oppIndex) => {
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
                    const globalIndex = (currentPage - 1) * listPageSize + oppIndex + 1;

                    const urgencyGradient = businessDays !== null ? getUrgencyGradient(businessDays) : getNoDeadlineGradient();
                    const urgencyTextColor = businessDays !== null ? getUrgencyTextColor(businessDays) : getNoDeadlineTextColor();

                    return (
                      <div
                        key={opp.noticeId}
                        style={{
                          borderLeft: `6px solid ${
                            businessDays === null ? '#94a3b8' :
                            businessDays <= 3 ? '#dc2626' :
                            businessDays <= 5 ? '#ea580c' :
                            businessDays <= 7 ? '#d97706' :
                            businessDays <= 10 ? '#ca8a04' :
                            businessDays <= 14 ? '#65a30d' :
                            businessDays <= 21 ? '#16a34a' :
                            businessDays <= 30 ? '#059669' : '#0d9488'
                          }`,
                          background: businessDays === null ? '#e2e8f0' :
                            businessDays <= 3 ? '#fee2e2' :
                            businessDays <= 5 ? '#fed7aa' :
                            businessDays <= 7 ? '#fde68a' :
                            businessDays <= 10 ? '#fef08a' :
                            businessDays <= 14 ? '#d9f99d' :
                            businessDays <= 21 ? '#bbf7d0' :
                            businessDays <= 30 ? '#a7f3d0' : '#99f6e4',
                          opacity: isViewed ? 0.7 : 1
                        }}
                        className={`group p-2.5 rounded-lg hover:shadow-md transition-all border border-slate-100 ${
                          isPlaceholder ? 'animate-pulse' : ''
                        } ${isViewed ? 'opacity-75' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2.5 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                              {!isPlaceholder && isSaved && (
                                <div className="px-2 py-0.5 bg-rose-50 rounded-md flex items-center gap-1.5 border border-rose-200">
                                  <Bookmark className="w-3.5 h-3.5 text-rose-500" fill="currentColor" />
                                  <span className="text-xs font-bold text-rose-600">Saved</span>
                                </div>
                              )}
                              {!isPlaceholder && hasAnalysis && (
                                <div className="px-2 sm:px-2.5 py-0.5 bg-purple-500/20 rounded-md flex items-center gap-1.5 border border-purple-500/40">
                                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                                  <span className="text-xs font-bold text-purple-400">AI Analyzed</span>
                                </div>
                              )}
                            </div>

                            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:2}}>
                              <span style={{background:'#f1f5f9',color:'#475569',fontSize:11,fontWeight:800,padding:'2px 7px',borderRadius:4,flexShrink:0,border:'1px solid #e2e8f0'}}>#{globalIndex}</span>
                              {businessDays !== null && (
                                <span style={{background:businessDays<=3?'#dc2626':businessDays<=5?'#ea580c':businessDays<=7?'#d97706':businessDays<=10?'#ca8a04':businessDays<=14?'#65a30d':businessDays<=21?'#16a34a':businessDays<=30?'#059669':'#0d9488',color:'#fff',fontSize:10,fontWeight:800,padding:'2px 7px',borderRadius:4,whiteSpace:'nowrap'}}>
                                  {businessDays<=3?'CRITICAL':businessDays<=5?'URGENT':businessDays<=7?'HIGH':businessDays<=10?'ACT SOON':businessDays<=14?'NORMAL':businessDays<=21?'COMFORTABLE':businessDays<=30?'AMPLE':'PLENTY'} · {businessDays}d
                                </span>
                              )}
                            </div>
                            <h3 className="text-[13px] sm:text-sm font-bold text-slate-900 mb-0.5 leading-tight line-clamp-2" style={{color:'#0f172a'}}>
                              {isPlaceholder ? (
                                <>
                                  <span className="inline-block h-6 w-full max-w-2xl bg-slate-700 rounded mb-2"></span>
                                  <span className="inline-block h-6 w-3/4 max-w-xl bg-slate-700 rounded"></span>
                                </>
                              ) : (
                                opp.title
                              )}
                            </h3>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3 sm:gap-x-4 gap-y-0.5 text-[11px] text-slate-300">
                              <span className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                {isPlaceholder ? (
                                  <span className="inline-block h-4 w-48 bg-slate-700 rounded"></span>
                                ) : (
                                  opp.department
                                )}
                              </span>
                              {!isPlaceholder && opp.typeOfSetAsideDescription && opp.typeOfSetAsideDescription !== 'None' && (
                                <span className="flex items-center gap-1.5">
                                  <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded text-[10px] font-semibold">
                                    {opp.typeOfSetAsideDescription}
                                  </span>
                                </span>
                              )}
                              <span className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                                {isPlaceholder ? (
                                  <span className="inline-block h-4 w-24 bg-slate-700 rounded"></span>
                                ) : (
                                  `NAICS: ${opp.naicsCode || 'N/A'}`
                                )}
                              </span>
                              <span className="flex items-center gap-1.5">
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
                            <div className="text-right flex-shrink-0 min-w-[86px]">
                              {businessDays !== null ? (
                                <div className={`text-base font-black ${urgencyTextColor}`}>{businessDays}d left</div>
                              ) : (
                                <div className="text-[11px] text-slate-400">No deadline</div>
                              )}
                              <div style={{fontSize:11,fontWeight:700,color:'#374151',marginTop:2}}>
                                Due: {deadline ? formatDate(deadline) : '—'}
                              </div>
                              <div style={{fontSize:10,color:'#6b7280',marginTop:1}}>
                                Posted: {formatDate(postedDate)}
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
                                <div style={{color:'#94a3b8',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:4}}>Match Score</div>
                                <div style={{color:'#67e8f9',fontSize:18,fontWeight:900,lineHeight:1}}>{opp.aiAnalysis.matchScore}%</div>
                              </div>
                            </div>
                            {opp.aiAnalysis.recommendation && (
                              <p className="text-sm text-cyan-300 italic">{opp.aiAnalysis.recommendation}</p>
                            )}
                          </div>
                        )}

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 pt-0.5 mt-0.5">
                          <div className="flex items-center gap-2">
                            {!isPlaceholder ? (
                              <a
                                href={opp.uiLink || `https://sam.gov/opp/${opp.noticeId}/view`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => handleViewOpportunity(opp.noticeId)}
                                style={{background:'#ea580c',color:'#fff',fontWeight:700,fontSize:11,padding:'5px 12px',borderRadius:8,display:'inline-flex',alignItems:'center',gap:6,textDecoration:'none',whiteSpace:'nowrap'}}
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
                                className="p-2 rounded-lg bg-slate-700/50 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
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
                                className="p-2 rounded-lg bg-slate-700/50 hover:bg-purple-500/20 text-slate-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                                title="Analyze with AI"
                              >
                                {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                              </button>
                            )}
                          </div>
                          <span className="text-xs text-slate-400 font-mono">
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
        <div className="mt-6 mb-6 text-center relative">
          <div className="mb-6 flex flex-col items-center gap-4">

            {/* Count text — guest only */}
            {!isLoggedIn && (
              <div className="w-full rounded-2xl border border-orange-200 bg-white/90 px-6 py-5 sm:px-8 sm:py-6 shadow-sm">
                <p className="w-full text-center text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.15]">
                  Showing <span className="text-emerald-700 font-extrabold">{(viewMode === 'grid' ? boardFiltered.length : keywordFiltered.length).toLocaleString()}</span> sample opportunities
                  {guestDataFreshAt && <span className="text-slate-800 font-bold"> · SAM.gov data from {guestDataFreshAt}</span>}
                  <span className="text-orange-600 font-extrabold"> · </span>
                  <Link href="/login" className="text-orange-600 font-extrabold underline decoration-orange-400 underline-offset-4 hover:text-orange-700 transition-colors">
                    Sign in
                  </Link>
                  <span className="text-orange-600 font-extrabold"> to view your personalized feed.</span>
                </p>
              </div>
            )}

            {/* Show All button — logged-in only */}
            {isLoggedIn && !showAllOpportunities && allOpportunities.length > displayedOpportunities.length && (
              <button
                onClick={() => { setShowAllOpportunities(true); setDisplayCount(allOpportunities.length); }}
                className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-white border border-slate-200 text-slate-800 font-bold shadow-sm hover:shadow transition-all min-w-[220px]"
              >
                Show all {allOpportunities.length.toLocaleString()} opportunities
              </button>
            )}

            {/* Load More button — logged-in only */}
            {isLoggedIn && hasMore && viewMode === 'grid' && (
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

            {/* Unified summary + action row — logged-in grid view only */}
            {isLoggedIn && dataLoaded && viewMode === 'grid' && (
              <div style={{
                display: 'flex', flexDirection: 'row', alignItems: 'center',
                justifyContent: 'center', flexWrap: 'wrap', gap: 20,
                padding: '16px 28px',
                background: '#0d1117',
                border: '2px solid #22c55e',
                borderRadius: 14,
                maxWidth: '100%',
              }}>
                {/* Showing X curated + preferences — all on one row */}
                <span style={{ color: '#ffffff', fontSize: 17, fontWeight: 900, whiteSpace: 'nowrap', lineHeight: 1.3 }}>
                  Showing{' '}
                  <span style={{ color: '#4ade80' }}>{keywordFiltered.length.toLocaleString()}</span>
                  {' '}curated opportunit{keywordFiltered.length === 1 ? 'y' : 'ies'}
                  <span style={{ color: '#475569', fontWeight: 500 }}>{' · '}</span>
                  <button
                    onClick={() => setSurveyOpen(true)}
                    style={{ color: '#67e8f9', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontSize: 'inherit', fontWeight: 700, textDecoration: 'underline', whiteSpace: 'nowrap' }}
                  >Update preferences</button>
                </span>

                <div style={{ width: 1, height: 36, background: '#22c55e', opacity: 0.35, flexShrink: 0 }} />

                {/* Deadlines count */}
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                  <CheckCircle2 style={{ width: 22, height: 22, color: '#4ade80', flexShrink: 0 }} />
                  <span style={{ color: '#ffffff', fontSize: 17, fontWeight: 900, letterSpacing: '0.01em', whiteSpace: 'nowrap' }}>
                    <span style={{ color: '#4ade80' }}>{boardFiltered.length}</span>
                    <span style={{ color: '#ffffff' }}> with deadlines</span>
                    <span style={{ color: '#f97316', fontWeight: 800 }}> · </span>
                    <span style={{ color: '#f97316' }}>{allOpportunities.length - boardFiltered.length}</span>
                    <span style={{ color: '#ffffff' }}> without deadline</span>
                  </span>
                </div>

                <div style={{ width: 1, height: 36, background: '#22c55e', opacity: 0.35, flexShrink: 0 }} />

                {/* Switch to List View */}
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    background: 'linear-gradient(135deg, #0891b2, #0369a1)',
                    color: '#ffffff', border: '1.5px solid #0e7490',
                    borderRadius: 10, padding: '10px 24px',
                    fontSize: 16, fontWeight: 800,
                    cursor: 'pointer', letterSpacing: '0.02em',
                    boxShadow: '0 4px 18px rgba(6,182,212,0.35)',
                    transition: 'all 0.15s',
                    whiteSpace: 'nowrap',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #0e7490, #1d4ed8)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(6,182,212,0.55)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #0891b2, #0369a1)'; e.currentTarget.style.boxShadow = '0 4px 18px rgba(6,182,212,0.35)'; }}
                >
                  <List className="w-5 h-5" />
                  Switch to List View
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>

                {opportunityPreferences && !showAllOpportunities && displayedOpportunities.length < allOpportunities.length && (
                  <>
                    <div style={{ width: 1, height: 36, background: '#22c55e', opacity: 0.35, flexShrink: 0 }} />
                    <button style={{ textDecoration: 'underline', background: 'none', border: 'none', color: '#fbbf24', cursor: 'pointer', fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap' }} onClick={() => setShowAllOpportunities(true)}>
                      show {allOpportunities.length - displayedOpportunities.length} more
                    </button>
                  </>
                )}
              </div>
            )}


            {/* Pagination — list/compact view only */}
            {isLoggedIn && dataLoaded && viewMode !== 'grid' && totalPages > 1 && (
              <div style={{display:'flex',alignItems:'center',gap:8,justifyContent:'center',flexWrap:'wrap',marginTop:8}}>
                <button
                  onClick={() => { setCurrentPage(p => Math.max(1,p-1)); window.scrollTo({top:0,behavior:'smooth'}); }}
                  disabled={currentPage===1}
                  style={{background:'#1e293b',color:currentPage===1?'#475569':'#cbd5e1',border:'1px solid #334155',borderRadius:8,padding:'7px 14px',fontSize:13,fontWeight:700,cursor:currentPage===1?'not-allowed':'pointer',opacity:currentPage===1?0.5:1}}
                >← Prev</button>
                {Array.from({length:Math.min(5,totalPages)},(_,i) => {
                  const page = Math.max(1,Math.min(currentPage-2,totalPages-4))+i;
                  return page<=totalPages ? (
                    <button key={page}
                      onClick={() => { setCurrentPage(page); window.scrollTo({top:0,behavior:'smooth'}); }}
                      style={{background:currentPage===page?'#ea580c':'#1e293b',color:'#fff',border:currentPage===page?'1px solid #ea580c':'1px solid #334155',borderRadius:8,padding:'7px 12px',fontSize:13,fontWeight:700,cursor:'pointer',minWidth:36}}
                    >{page}</button>
                  ) : null;
                })}
                <button
                  onClick={() => { setCurrentPage(p => Math.min(totalPages,p+1)); window.scrollTo({top:0,behavior:'smooth'}); }}
                  disabled={currentPage===totalPages}
                  style={{background:'#1e293b',color:currentPage===totalPages?'#475569':'#cbd5e1',border:'1px solid #334155',borderRadius:8,padding:'7px 14px',fontSize:13,fontWeight:700,cursor:currentPage===totalPages?'not-allowed':'pointer',opacity:currentPage===totalPages?0.5:1}}
                >Next →</button>
                <span style={{color:'#64748b',fontSize:12,marginLeft:4}}>
                  Page {currentPage} of {totalPages}
                </span>
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
                              <p style={{color:'#94a3b8',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.04em',margin:0,marginBottom:2}}>Match</p>
                              <p style={{color:'#67e8f9',fontSize:18,fontWeight:900,lineHeight:1,margin:0}}>{opp.aiAnalysis.matchScore}%</p>
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
        {false && showPrefsReminder && (
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
                      onClick={() => { setShowPrefsReminder(false); window.location.href = '/dashboard/onboarding?next=/opportunities'; }}
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
                      href="/login"
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

        {emailShareOpen && (
          <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                <div>
                  <p className="text-base font-black text-slate-900">Share via Email</p>
                  <p className="text-sm text-slate-600">Use contacts or type any teammate email from your users list.</p>
                </div>
                <button
                  type="button"
                  onClick={closeEmailShareComposer}
                  className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                  aria-label="Close share email modal"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                {emailShareRecipients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {emailShareRecipients.map(email => (
                      <span key={email} className="inline-flex items-center gap-1 rounded-full border border-blue-300 bg-blue-50 px-3 py-1 text-sm font-semibold text-blue-800">
                        <Mail size={14} />
                        {email}
                        <button
                          type="button"
                          onClick={() => toggleEmailRecipient(email)}
                          className="text-blue-700 hover:text-red-600"
                          aria-label={`Remove ${email}`}
                        >
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailShareInput}
                    onChange={e => setEmailShareInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addEmailRecipient(); } }}
                    placeholder="Type email and press Enter"
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addEmailRecipient}
                    disabled={!EMAIL_REGEX.test(emailShareInput.trim())}
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                  >
                    Add
                  </button>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <BookUser size={15} className="text-teal-600" />
                      Address Book Contacts
                    </p>
                    <button
                      type="button"
                      onClick={() => void loadAddressBookContacts()}
                      className="text-xs font-semibold text-blue-700 hover:text-blue-800"
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="mb-2">
                    <input
                      type="text"
                      value={emailShareSearch}
                      onChange={e => setEmailShareSearch(e.target.value)}
                      placeholder="Search contacts by name, email, or organization..."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto space-y-1">
                    {addressBookLoading ? (
                      <p className="text-sm text-slate-500 py-2">Loading contacts...</p>
                    ) : (() => {
                      const filtered = addressBookContacts.filter(c => {
                        if (!emailShareSearch.trim()) return true;
                        const query = emailShareSearch.toLowerCase();
                        const name = [c.firstName, c.lastName].filter(Boolean).join(' ').toLowerCase();
                        return [c.email, name, c.organization || ''].some(v => v.toLowerCase().includes(query));
                      });
                      if (filtered.length === 0) {
                        return (
                          <p className="text-sm text-slate-500 py-2">
                            {emailShareSearch ? 'No contacts match this search.' : 'No contacts found. Add some on the Contacts page.'}
                          </p>
                        );
                      }
                      return filtered.map(contact => {
                        const selected = emailShareRecipients.some(e => e.toLowerCase() === contact.email.toLowerCase());
                        const display = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
                        return (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => toggleEmailRecipient(contact.email)}
                            className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                              selected
                                ? 'border-emerald-300 bg-emerald-50'
                                : 'border-slate-200 bg-white hover:bg-slate-100'
                            }`}
                          >
                            <p className="text-sm font-semibold text-slate-900">{display || contact.email}</p>
                            {display && <p className="text-xs text-slate-600">{contact.email}</p>}
                            {contact.organization && <p className="text-xs text-slate-500">{contact.organization}</p>}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Subject</label>
                  <input
                    type="text"
                    value={emailShareSubject}
                    onChange={e => setEmailShareSubject(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Email Body</label>
                  <textarea
                    value={emailShareBody}
                    onChange={e => setEmailShareBody(e.target.value)}
                    rows={5}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-slate-200 px-5 py-4">
                <button
                  type="button"
                  onClick={closeEmailShareComposer}
                  className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={sendEmailShare}
                  disabled={emailShareRecipients.length === 0}
                  className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                >
                  Open Email Draft
                </button>
              </div>
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



      {/* Sample notice footer */}
      {!isLoggedIn && showGuestFooterBar && (
        <div className="fixed bottom-0 inset-x-0 z-30 flex justify-center pb-3 px-3 sm:px-6 lg:px-10 xl:px-12">
          <div className="max-w-480 w-full">
            <div className="relative rounded-xl border border-orange-400/70 bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 shadow-2xl px-6 sm:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              type="button"
              onClick={() => setShowGuestFooterBar(false)}
              className="absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-orange-900/25 text-white hover:bg-orange-900/40 transition-colors"
              aria-label="Dismiss opportunities footer banner"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 shrink-0">
              <AlertTriangle className="w-6 h-6 text-white animate-pulse flex-shrink-0" />
              <div>
                <div className="text-xl sm:text-2xl font-black text-white leading-tight">Public Opportunities Only</div>
                <div className="text-xs sm:text-sm text-white/80 font-medium mt-0.5">Browse all 1,300+ contracts at surface level</div>
              </div>
            </div>
                <p className="text-base sm:text-lg text-white flex-1 min-w-0 font-semibold leading-relaxed">
                 <span className="block sm:inline">You are seeing every government contract posted this month — </span>
                 <span className="block sm:inline font-bold text-orange-50">but without your business profile, you are missing matches.</span> <span className="block sm:inline">Sign in to unlock NAICS-matched, set-aside-filtered, agency-targeted opportunities scoring and real-time alerts.</span>
              </p>
              <div className="flex gap-2 flex-wrap shrink-0">
                <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-orange-700 text-sm sm:text-base font-extrabold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 whitespace-nowrap">
                  <Sparkles className="w-4 h-4" />
                  Start Free 7-Day Trial
                </Link>
                <Link href="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-orange-700 text-white text-sm sm:text-base font-extrabold shadow-lg hover:bg-orange-800 hover:shadow-xl transition-all duration-200 border border-orange-500 whitespace-nowrap">
                  <LogIn className="w-4 h-4" />
                  Sign In Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* ΓöÇΓöÇ Floating action strip (logged-in only) ΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇΓöÇ */}
    {isLoggedIn && (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '20px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '8px',
      zIndex: 9999,
    }}>

      {/* Saved tray — closable floating panel */}
      {isLoggedIn && <div style={{
        width: 'min(440px, calc(100vw - 28px))',
        overflow: 'hidden',
        maxHeight: savedTrayOpen ? '520px' : '0px',
        opacity: savedTrayOpen ? 1 : 0,
        transition: 'max-height 0.28s ease, opacity 0.2s ease',
        pointerEvents: savedTrayOpen ? 'auto' : 'none',
        borderRadius: '14px',
        border: '1px solid #cbd5e1',
        background: '#ffffff',
        boxShadow: '0 10px 28px rgba(15,23,42,0.2)',
      }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <div>
            <p className="text-sm font-black text-slate-900">Saved opportunities</p>
            <p className="text-xs font-medium text-slate-600">{savedOpportunityItems.length} saved to your account</p>
          </div>
          <button
            onClick={() => setSavedTrayOpen(false)}
            className="h-7 w-7 inline-flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700"
            aria-label="Close saved opportunities"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 py-2 border-b border-slate-200 flex items-center gap-2 flex-wrap">
          <button onClick={handleExportSavedOpportunities} className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">Export</button>
          <button onClick={handleShareSavedByEmail} className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">Share</button>
          <button onClick={() => window.print()} className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">Print</button>
          <Link href="/dashboard/saved-opportunities" className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50">Open full saved list</Link>
        </div>

        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
          {savedOpportunityItems.length === 0 ? (
            <div className="px-4 py-5 text-sm text-slate-600">
              No saved opportunities yet. Click the bookmark icon on any opportunity card to save it here.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {savedOpportunityItems.map(item => (
                <div key={item.id || item.notice_id} className="px-4 py-3">
                  <p className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{item.title || 'Untitled opportunity'}</p>
                  <p className="mt-1 text-xs text-slate-600">{item.department || 'Agency unavailable'}{item.naics_code ? ` • NAICS ${item.naics_code}` : ''}</p>
                  <div className="mt-2 flex items-center gap-2 flex-wrap">
                    <a
                      href={item.ui_link || `https://sam.gov/opp/${item.notice_id}/view`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-md bg-orange-600 text-white text-xs font-bold hover:bg-orange-700"
                    >
                      View
                    </a>
                    <button
                      onClick={() => navigator.clipboard.writeText(item.ui_link || `https://sam.gov/opp/${item.notice_id}/view`).catch(() => {})}
                      className="px-2.5 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Copy Link
                    </button>
                    <button
                      onClick={() => handleRemoveSavedFromTray(item.notice_id)}
                      className="px-2.5 py-1.5 rounded-md border border-rose-300 bg-rose-50 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>}

      {/* Share tray — only rendered for logged-in users */}
      {isLoggedIn && <div style={{
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
            setShareOpen(false);
            openEmailShareComposer(
              'Government Contracting Opportunities',
              `I wanted to share this opportunities page with you:\n\n${window.location.href}`
            );
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
      </div>}

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
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '6px 10px',
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

        {/* Export CSV — logged-in only */}
        {isLoggedIn && (
          <button
            onClick={handleExportOpportunities}
            title="Export to CSV"
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold shadow-sm hover:shadow transition-all"
            style={{
              background: 'linear-gradient(135deg, #047857, #10b981)',
              border: '1.5px solid rgba(16,185,129,0.75)',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(16,185,129,0.35), 0 4px 14px rgba(0,0,0,0.45)',
            }}
          >
            <Download size={16} />
            Export
          </button>
        )}

        {/* Refresh */}
        <button
          onClick={handleRefresh}
          title="Refresh from SAM.gov"
          className="flex items-center gap-2 px-3 py-2 rounded-full text-sm font-semibold shadow-sm hover:shadow transition-all"
          style={{
            background: 'linear-gradient(135deg, #0369a1, #0ea5e9)',
            border: '1.5px solid rgba(14,165,233,0.75)',
            color: '#ffffff',
            boxShadow: '0 4px 14px rgba(14,165,233,0.35), 0 4px 14px rgba(0,0,0,0.45)',
          }}
        >
          <RefreshCw size={16} />
          Refresh
        </button>

        {/* Share — logged-in only, toggles the tray above */}
        {isLoggedIn && (
          <button
            onClick={() => { setSavedTrayOpen(s => !s); if (!savedTrayOpen) setShareOpen(false); }}
            title="Saved opportunities"
            className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-semibold shadow-sm hover:shadow transition-all"
            style={savedTrayOpen
              ? {
                  background: 'linear-gradient(135deg, #0f766e, #14b8a6)',
                  border: '1.5px solid rgba(20,184,166,0.9)',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(20,184,166,0.4), 0 4px 14px rgba(0,0,0,0.45)',
                }
              : {
                  background: 'linear-gradient(135deg, #0f766e, #0d9488)',
                  border: '1.5px solid rgba(20,184,166,0.75)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(20,184,166,0.3), 0 4px 14px rgba(0,0,0,0.45)',
                }}
          >
            <Bookmark size={16} />
            Saved ({savedOpportunityItems.length})
            <ChevronDown
              size={13}
              style={{
                opacity: 0.8,
                transform: savedTrayOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.25s ease',
              }}
            />
          </button>
        )}

        {/* Share — logged-in only, toggles the tray above */}
        {isLoggedIn && (
          <button
            onClick={() => { setShareOpen(s => !s); if (!shareOpen) setSavedTrayOpen(false); }}
            title="Share"
            className="flex items-center gap-2 px-3 py-2 rounded-full border text-sm font-semibold shadow-sm hover:shadow transition-all"
            style={shareOpen
              ? {
                  background: 'linear-gradient(135deg, #5b21b6, #7c3aed)',
                  border: '1.5px solid rgba(167,139,250,0.9)',
                  color: '#ffffff',
                  boxShadow: '0 4px 16px rgba(124,58,237,0.45), 0 4px 14px rgba(0,0,0,0.45)',
                }
              : {
                  background: 'linear-gradient(135deg, #6d28d9, #8b5cf6)',
                  border: '1.5px solid rgba(167,139,250,0.75)',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(139,92,246,0.35), 0 4px 14px rgba(0,0,0,0.45)',
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
        )}
      </div>
    </div>
    )}

            {/* ── Dynamic Guidance Bar ── neutral styling to match page ── */}
    {(() => {
      const visibleCount = viewMode === 'grid' ? boardFiltered.length : keywordFiltered.length;
      const criticalCount = keywordFiltered.filter(o => {
        const raw = o.updatedResponseDeadLine || o.responseDeadLine || '';
        if (!raw) return false;
        const ms = new Date(raw).getTime() - Date.now();
        const bd = Math.ceil(ms / (1000 * 60 * 60 * 24));
        return bd >= 0 && bd <= 3;
      }).length;

      const tips: { icon: string; text: string }[] = [
        ...(criticalCount > 0 ? [{
          icon: '🚨',
          text: `${criticalCount} opportunit${criticalCount === 1 ? 'y is' : 'ies are'} closing within 3 business days. Review and initiate your bid or teaming process immediately — late submissions are automatically rejected on SAM.gov.`,
        }] : []),
        {
          icon: '🔍',
          text: `You're viewing ${visibleCount.toLocaleString()} opportunit${visibleCount === 1 ? 'y' : 'ies'}${selectedSetAside !== 'all' ? ` filtered by Set-Aside: ${selectedSetAside}` : ''}${selectedNAICS !== 'all' ? ` · NAICS: ${selectedNAICS}` : ''}. Use the filters above to refine by agency, procurement type, or urgency.`,
        },
        {
          icon: '💡',
          text: `Pro tip: Sort by "Best Match" to see opportunities most aligned with your NAICS codes and business profile. Opportunities scoring 80%+ match have the highest win probability for your firm.`,
        },
        {
          icon: '📋',
          text: `Before responding to a SAM.gov opportunity, verify your SAM.gov registration is active and unexpired. A lapsed registration will disqualify your bid even if submitted on time.`,
        },
        {
          icon: '🎯',
          text: `Set-Aside filters unlock contracts reserved for small businesses, 8(a) firms, HUBZone, SDVOSB, and WOSB. If your firm qualifies, filtering by set-aside dramatically reduces competition.`,
        },
        {
          icon: '⚡',
          text: `Use Alert Subscriptions to get email notifications whenever new contracts matching your saved searches are posted on SAM.gov — so you're always the first to respond.`,
        },
        {
          icon: '📅',
          text: `Yellow deadlines (4–7 days) are responding windows, not extensions. If you need more time, contact the contracting officer before the deadline to request an amendment — not after.`,
        },
        {
          icon: '🏢',
          text: `Teaming arrangements can make you eligible for larger contracts. If an opportunity exceeds your capacity alone, search for teaming partners using the NAICS code and agency to find complementary firms.`,
        },
        {
          icon: '🔖',
          text: `Save opportunities to your watchlist using the bookmark icon on each card. Saved opportunities track deadline changes, amendment notices, and award results in your dashboard.`,
        },
        {
          icon: '📊',
          text: `Your match score reflects alignment between your NAICS codes, business size, certifications, and the opportunity's requirements. Improve scores by completing your business profile in Account Settings.`,
        },
      ];

      // Neutral, subtle gradient that matches the page's slate/blue theme
      const neutralGradients = [
        'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
      ];

      const tip = tips[guidanceIndex % tips.length];
      const grad = neutralGradients[guidanceGradientIndex % neutralGradients.length];

      return (
        <div className="w-full bg-gradient-to-br from-white via-slate-50 to-blue-50">
          <div className="max-w-480 mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div style={{ 
            padding: 0, 
            marginBottom: 0, 
            width: '100%', 
            overflow: 'hidden', 
            boxSizing: 'border-box',
            borderRadius: '12px',
            border: '1px solid rgba(51, 65, 85, 0.4)',
          }}>
            <div
              style={{
                background: grad,
                transition: 'opacity 0.4s ease',
                opacity: guidanceVisible ? 1 : 0,
                width: '100%',
                boxSizing: 'border-box',
                overflow: 'hidden',
                borderRadius: '12px',
              }}
            >
              <div className="flex items-start sm:items-center gap-4 px-5 sm:px-8 py-4 sm:py-5">
                <span className="text-2xl sm:text-3xl shrink-0 leading-none select-none" aria-hidden>
                  {tip.icon}
                </span>
                <p
                  style={{
                    transition: 'opacity 0.4s ease, transform 0.4s ease',
                    opacity: guidanceVisible ? 1 : 0,
                    transform: guidanceVisible ? 'translateY(0)' : 'translateY(6px)',
                    color: '#e2e8f0',
                  }}
                  className="text-sm sm:text-base font-semibold leading-relaxed flex-1 min-w-0"
                >
                  {tip.text}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setGuidanceVisible(false);
                    setTimeout(() => {
                      setGuidanceIndex(i => i + 1);
                      setGuidanceGradientIndex(g => g + 1);
                      setGuidanceVisible(true);
                    }, 300);
                  }}
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                  style={{ color: 'rgba(226, 232, 240, 0.6)' }}
                  aria-label="Next tip"
                  title="Next tip"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                    <path d="M6 12l4-4-4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      );
    })()}
    </>
  );
}
