// components/OpportunityModal.tsx
"use client";

import React from "react";
import {
  X,
  ExternalLink,
  Building2,
  MapPin,
  User,
  Mail,
  Phone,
  FileText,
  Calendar,
  Tag,
  Award,
} from "lucide-react";

interface Opportunity {
  noticeId: string;
  title: string;
  solicitationNumber?: string;
  department?: string;
  subtierName?: string;
  office?: string;
  fullParentPathName?: string;
  postedDate?: string;
  type?: string;
  baseType?: string;
  archiveType?: string;
  archiveDate?: string;
  responseDeadLine?: string;
  naicsCode?: string;
  classificationCode?: string;
  typeOfSetAsideDescription?: string;
  typeOfSetAside?: string;
  description?: string;
  organizationType?: string;
  placeOfPerformance?: {
    streetAddress?: string;
    streetAddress2?: string;
    city?: { code?: string; name?: string };
    state?: { code?: string; name?: string };
    zip?: string;
    country?: { code?: string; name?: string };
  };
  pointOfContact?: Array<{
    type?: string;
    title?: string;
    fullName?: string;
    email?: string;
    phone?: string;
    fax?: string;
  }>;
  links?: Array<{
    rel?: string;
    href?: string;
    description?: string;
  }>;
  resourceLinks?: string[];
  award?: {
    date?: string;
    number?: string;
    amount?: string | number;
    awardee?: {
      name?: string;
      location?: {
        streetAddress?: string;
        city?: { name?: string };
        state?: { code?: string };
        zip?: string;
        country?: { code?: string };
      };
      ueiSAM?: string;
      duns?: string;
    };
  };
  additionalInfoLink?: string;
}

interface OpportunityModalProps {
  opportunity: Opportunity;
  onClose: () => void;
}

export default function OpportunityModal({ opportunity, onClose }: OpportunityModalProps) {
  // Format date helper
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format currency helper
  const formatCurrency = (amount?: string | number) => {
    if (!amount) return null;
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(num);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl">
        
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 rounded-t-2xl z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-700 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Opportunity Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {opportunity.solicitationNumber || opportunity.noticeId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          
          {/* Title and Agency */}
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              {opportunity.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="font-medium">{opportunity.department || opportunity.subtierName || 'Agency not specified'}</span>
            </div>
            {opportunity.office && (
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mt-1">
                <span className="w-4 h-4 shrink-0" />
                <span>{opportunity.office}</span>
              </div>
            )}
          </div>

          {/* Key Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Posted Date */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Posted Date</span>
              </div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {formatDate(opportunity.postedDate)}
              </p>
            </div>

            {/* Deadline */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-xs font-medium">Response Deadline</span>
              </div>
              <p className="text-base font-semibold text-orange-600 dark:text-orange-400">
                {formatDate(opportunity.responseDeadLine)}
              </p>
            </div>

            {/* Type */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                <Tag className="w-4 h-4" />
                <span className="text-xs font-medium">Notice Type</span>
              </div>
              <p className="text-base font-semibold text-slate-900 dark:text-white">
                {opportunity.type || opportunity.baseType || 'Not specified'}
              </p>
            </div>

            {/* NAICS */}
            {opportunity.naicsCode && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                  <Tag className="w-4 h-4" />
                  <span className="text-xs font-medium">NAICS Code</span>
                </div>
                <p className="text-base font-semibold text-slate-900 dark:text-white font-mono">
                  {opportunity.naicsCode}
                </p>
              </div>
            )}

            {/* Set Aside */}
            {opportunity.typeOfSetAsideDescription && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-medium">Set-Aside</span>
                </div>
                <p className="text-base font-semibold text-violet-600 dark:text-violet-400">
                  {opportunity.typeOfSetAsideDescription}
                </p>
              </div>
            )}

            {/* Classification */}
            {opportunity.classificationCode && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-2">
                  <Tag className="w-4 h-4" />
                  <span className="text-xs font-medium">Classification</span>
                </div>
                <p className="text-base font-semibold text-slate-900 dark:text-white">
                  {opportunity.classificationCode}
                </p>
              </div>
            )}

          </div>

          {/* Award Information */}
          {opportunity.award && (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 p-5">
              <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-3 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Award Information
              </h4>
              <div className="grid grid-cols-2 gap-4">
                {opportunity.award.date && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Award Date</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {formatDate(opportunity.award.date)}
                    </p>
                  </div>
                )}
                {opportunity.award.amount && (
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Award Amount</p>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(opportunity.award.amount)}
                    </p>
                  </div>
                )}
                {opportunity.award.number && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Award Number</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {opportunity.award.number}
                    </p>
                  </div>
                )}
                {opportunity.award.awardee?.name && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Awardee</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                      {opportunity.award.awardee.name}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Description */}
          {opportunity.description && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Description
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                {opportunity.description}
              </p>
            </div>
          )}

          {/* Place of Performance */}
          {opportunity.placeOfPerformance && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Place of Performance
              </h4>
              <div className="space-y-1 text-sm text-slate-600 dark:text-slate-400">
                {opportunity.placeOfPerformance.streetAddress && (
                  <p>{opportunity.placeOfPerformance.streetAddress}</p>
                )}
                {(opportunity.placeOfPerformance.city?.name || opportunity.placeOfPerformance.state?.name) && (
                  <p>
                    {[
                      opportunity.placeOfPerformance.city?.name,
                      opportunity.placeOfPerformance.state?.name,
                      opportunity.placeOfPerformance.zip
                    ].filter(Boolean).join(', ')}
                  </p>
                )}
                {opportunity.placeOfPerformance.country?.name && (
                  <p>{opportunity.placeOfPerformance.country.name}</p>
                )}
              </div>
            </div>
          )}

          {/* Point of Contact */}
          {opportunity.pointOfContact && opportunity.pointOfContact.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <User className="w-4 h-4" />
                Point of Contact
              </h4>
              <div className="space-y-4">
                {opportunity.pointOfContact.map((contact, index) => (
                  <div key={index} className="text-sm">
                    {contact.title && (
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{contact.title}</p>
                    )}
                    {contact.fullName && (
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                        <User className="w-3 h-3" />
                        {contact.fullName}
                      </p>
                    )}
                    {contact.email && (
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                        <Mail className="w-3 h-3" />
                        <a href={`mailto:${contact.email}`} className="hover:text-emerald-600">
                          {contact.email}
                        </a>
                      </p>
                    )}
                    {contact.phone && (
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2 mt-1">
                        <Phone className="w-3 h-3" />
                        <a href={`tel:${contact.phone}`} className="hover:text-emerald-600">
                          {contact.phone}
                        </a>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links */}
          {opportunity.links && opportunity.links.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 p-5">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Related Links
              </h4>
              <div className="space-y-2">
                {opportunity.links.map((link, index) => (
                  link.href && (
                    <a
                      key={index}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      {link.description || link.rel || 'View Document'}
                    </a>
                  )
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="sticky bottom-0 flex gap-3 p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 rounded-b-2xl">
          <button
            onClick={() => {
              window.open(`https://sam.gov/opp/${opportunity.noticeId}/view`, '_blank');
            }}
            className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View on SAM.gov
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}