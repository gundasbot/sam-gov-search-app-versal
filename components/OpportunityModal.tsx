//app/components/OpportunityModal.tsx
'use client'

import React, { useState } from 'react'
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
} from 'lucide-react'

interface Opportunity {
  noticeId: string
  title: string
  solicitationNumber?: string
  department?: string
  subtierName?: string
  office?: string
  fullParentPathName?: string
  postedDate?: string
  type?: string
  baseType?: string
  archiveType?: string
  archiveDate?: string
  responseDeadLine?: string
  naicsCode?: string
  classificationCode?: string
  typeOfSetAsideDescription?: string
  typeOfSetAside?: string
  description?: string
  organizationType?: string

  placeOfPerformance?: {
    streetAddress?: string
    streetAddress2?: string
    city?: { code?: string; name?: string }
    state?: { code?: string; name?: string }
    zip?: string
    country?: { code?: string; name?: string }
  }

  pointOfContact?: Array<{
    type?: string
    title?: string
    fullName?: string
    email?: string
    phone?: string
    fax?: string
  }>

  links?: Array<{
    rel?: string
    href?: string
    description?: string
  }>

  resourceLinks?: string[]

  award?: {
    date?: string
    number?: string
    amount?: string | number
    awardee?: {
      name?: string
      location?: {
        streetAddress?: string
        city?: { name?: string }
        state?: { code?: string }
        zip?: string
        country?: { code?: string }
      }
      ueiSAM?: string
      duns?: string
    }
  }

  additionalInfoLink?: string
  uiLink?: string
}

interface OpportunityModalProps {
  opportunity: Opportunity
  onClose: () => void
}

export default function OpportunityModal({ opportunity, onClose }: OpportunityModalProps) {
  const [activeTab, setActiveTab] = useState('general')

  const tabs = [
    { id: 'general', label: 'General Information', icon: Building2 },
    { id: 'classification', label: 'Classification', icon: Tag },
    { id: 'description', label: 'Description', icon: FileText },
    { id: 'attachments', label: 'Attachments/Links', icon: ExternalLink },
    { id: 'contact', label: 'Contact Information', icon: User },
    { id: 'history', label: 'History', icon: Calendar },
    { id: 'award', label: 'Award Notices', icon: Award },
  ]

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not specified'
    const d = new Date(dateString)
    if (Number.isNaN(d.getTime())) return 'Not specified'
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }

  const formatCurrency = (amount?: string | number) => {
    if (amount === undefined || amount === null || amount === '') return 'Not specified'
    const numAmount = typeof amount === 'string' ? Number(amount) : amount
    if (!Number.isFinite(numAmount)) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(numAmount)
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 flex items-center justify-center">
        <div className="relative bg-slate-800 border border-slate-700 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-start justify-between">
            <div className="flex-1 pr-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {opportunity.type || 'Notice'}
                </span>
                {opportunity.typeOfSetAsideDescription && (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {opportunity.typeOfSetAsideDescription}
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{opportunity.title}</h2>
              <p className="text-slate-400 text-sm">
                {opportunity.fullParentPathName || opportunity.department || 'Agency not specified'}
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-slate-700 px-6 overflow-x-auto">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-semibold text-sm whitespace-nowrap">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* General Information Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Solicitation Number
                    </label>
                    <p className="text-white mt-1">
                      {opportunity.solicitationNumber || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Notice ID</label>
                    <p className="text-white mt-1 font-mono text-sm">{opportunity.noticeId}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Notice Type</label>
                    <p className="text-white mt-1">{opportunity.type || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Base Type</label>
                    <p className="text-white mt-1">{opportunity.baseType || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Posted Date</label>
                    <p className="text-white mt-1">{formatDate(opportunity.postedDate)}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Response Deadline
                    </label>
                    <p className="text-white mt-1">{formatDate(opportunity.responseDeadLine)}</p>
                  </div>
                  {opportunity.archiveDate && (
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Archive Date</label>
                      <p className="text-white mt-1">{formatDate(opportunity.archiveDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Classification Tab */}
            {activeTab === 'classification' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">NAICS Code</label>
                    <p className="text-white mt-1">{opportunity.naicsCode || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Classification Code
                    </label>
                    <p className="text-white mt-1">{opportunity.classificationCode || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Set-Aside Type</label>
                    <p className="text-white mt-1">
                      {opportunity.typeOfSetAsideDescription || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                      Organization Type
                    </label>
                    <p className="text-white mt-1">{opportunity.organizationType || 'Not specified'}</p>
                  </div>
                </div>

                {opportunity.placeOfPerformance && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Place of Performance
                    </label>
                    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                      {opportunity.placeOfPerformance.streetAddress && (
                        <p className="text-white">{opportunity.placeOfPerformance.streetAddress}</p>
                      )}
                      {opportunity.placeOfPerformance.streetAddress2 && (
                        <p className="text-white">{opportunity.placeOfPerformance.streetAddress2}</p>
                      )}
                      <p className="text-white">
                        {opportunity.placeOfPerformance.city?.name}
                        {opportunity.placeOfPerformance.city?.name ? ',' : ''}{' '}
                        {opportunity.placeOfPerformance.state?.code} {opportunity.placeOfPerformance.zip}
                      </p>
                      {opportunity.placeOfPerformance.country?.name && (
                        <p className="text-slate-400 text-sm mt-1">
                          {opportunity.placeOfPerformance.country.name}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Description Tab */}
            {activeTab === 'description' && (
              <div className="prose prose-invert max-w-none">
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
                  <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                    {opportunity.description || 'No description available'}
                  </p>
                </div>
              </div>
            )}

            {/* Attachments/Links Tab */}
            {activeTab === 'attachments' && (
              <div className="space-y-4">
                {opportunity.links && opportunity.links.length > 0 ? (
                  opportunity.links.map((link, index) => (
                    <a
                      key={index}
                      href={link.href || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-lg p-4 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <ExternalLink className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-white font-semibold">{link.rel || 'Link'}</p>
                          {link.description && (
                            <p className="text-slate-400 text-sm mt-1">{link.description}</p>
                          )}
                          {link.href && (
                            <p className="text-blue-400 text-sm mt-1 truncate">{link.href}</p>
                          )}
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">No attachments or links available</p>
                )}

                {opportunity.additionalInfoLink && (
                  <a
                    href={opportunity.additionalInfoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block bg-slate-900 border border-slate-700 hover:border-blue-500 rounded-lg p-4 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <ExternalLink className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-white font-semibold">Additional Information</p>
                        <p className="text-blue-400 text-sm mt-1 truncate">
                          {opportunity.additionalInfoLink}
                        </p>
                      </div>
                    </div>
                  </a>
                )}
              </div>
            )}

            {/* Contact Information Tab */}
            {activeTab === 'contact' && (
              <div className="space-y-4">
                {opportunity.pointOfContact && opportunity.pointOfContact.length > 0 ? (
                  opportunity.pointOfContact.map((contact, index) => (
                    <div key={index} className="bg-slate-900 border border-slate-700 rounded-lg p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <User className="w-5 h-5 text-blue-400" />
                        <h3 className="text-lg font-bold text-white">{contact.type || 'Point of Contact'}</h3>
                      </div>
                      <div className="space-y-3">
                        {contact.fullName && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Name</label>
                            <p className="text-white mt-1">{contact.fullName}</p>
                          </div>
                        )}
                        {contact.title && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Title</label>
                            <p className="text-white mt-1">{contact.title}</p>
                          </div>
                        )}
                        {contact.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-slate-500" />
                            <a href={`mailto:${contact.email}`} className="text-blue-400 hover:text-blue-300">
                              {contact.email}
                            </a>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-slate-500" />
                            <a href={`tel:${contact.phone}`} className="text-blue-400 hover:text-blue-300">
                              {contact.phone}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-400 text-center py-8">No contact information available</p>
                )}
              </div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-500 uppercase">Archive Type</label>
                      <p className="text-white mt-1">{opportunity.archiveType || 'Not specified'}</p>
                    </div>
                    {opportunity.archiveDate && (
                      <div>
                        <label className="text-xs font-semibold text-slate-500 uppercase">Archive Date</label>
                        <p className="text-white mt-1">{formatDate(opportunity.archiveDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Award Notices Tab */}
            {activeTab === 'award' && (
              <div className="space-y-4">
                {opportunity.award ? (
                  <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Award className="w-6 h-6 text-green-400" />
                      <h3 className="text-lg font-bold text-white">Contract Award</h3>
                    </div>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        {opportunity.award.date && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Award Date</label>
                            <p className="text-white mt-1">{formatDate(opportunity.award.date)}</p>
                          </div>
                        )}
                        {opportunity.award.number && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Award Number</label>
                            <p className="text-white mt-1">{opportunity.award.number}</p>
                          </div>
                        )}
                        {opportunity.award.amount && (
                          <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase">Award Amount</label>
                            <p className="text-white mt-1 text-xl font-bold text-green-400">
                              {formatCurrency(opportunity.award.amount)}
                            </p>
                          </div>
                        )}
                      </div>

                      {opportunity.award.awardee && (
                        <div className="border-t border-slate-700 pt-4 mt-4">
                          <h4 className="text-sm font-semibold text-slate-400 mb-3">Awardee Information</h4>
                          <div className="space-y-3">
                            {opportunity.award.awardee.name && (
                              <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Company Name</label>
                                <p className="text-white mt-1">{opportunity.award.awardee.name}</p>
                              </div>
                            )}
                            {opportunity.award.awardee.location && (
                              <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">Location</label>
                                <p className="text-white mt-1">
                                  {opportunity.award.awardee.location.city?.name},{' '}
                                  {opportunity.award.awardee.location.state?.code}{' '}
                                  {opportunity.award.awardee.location.zip}
                                </p>
                              </div>
                            )}
                            {opportunity.award.awardee.ueiSAM && (
                              <div>
                                <label className="text-xs font-semibold text-slate-500 uppercase">UEI SAM</label>
                                <p className="text-white mt-1 font-mono text-sm">{opportunity.award.awardee.ueiSAM}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-400 text-center py-8">No award information available</p>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6 flex gap-3">
            <a
              href={`https://sam.gov/opp/${opportunity.noticeId}/view`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              <ExternalLink className="w-5 h-5" />
              View on SAM.gov
            </a>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}