import Image from 'next/image'
import { CheckCircle, XCircle, X, Mail, MessageSquare, TrendingUp, Users, Clock, AlertTriangle } from 'lucide-react'

interface Recipient {
  id?: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  role?: string
  channels?: ('email' | 'sms')[]
}

interface AlertSuccessModalProps {
  isOpen: boolean
  alertName: string
  status: 'SUCCESS' | 'ERROR' | 'NO_RESULTS'
  resultCount: number
  emailSent: boolean
  errorMessage?: string
  recipients: Recipient[]
  format: string
  searchCriteria: {
    keywords?: string
    naics?: string
    agency?: string
    setAside?: string
    states?: string[]
    ptypes?: string[]
    ccode?: string
  }
  onClose: () => void
}

export function AlertSuccessModal({
  isOpen,
  alertName,
  status,
  resultCount,
  emailSent,
  errorMessage,
  recipients,
  format,
  searchCriteria,
  onClose,
}: AlertSuccessModalProps) {
  if (!isOpen) return null

  const isError = status === 'ERROR'
  const isNoResults = status === 'NO_RESULTS'
  const normalizedRecipients = (Array.isArray(recipients) ? recipients : []).map((r) => {
    const email = typeof r?.email === 'string' ? r.email : ''
    const phone = typeof r?.phone === 'string' ? r.phone : ''
    const channels = Array.isArray(r?.channels)
      ? r.channels
      : [
          ...(email ? (['email'] as const) : []),
          ...(phone ? (['sms'] as const) : []),
        ]

    return {
      ...r,
      email,
      phone,
      role: r?.role || '',
      channels,
    }
  })
  const emailRecipients = normalizedRecipients.filter(r => r.channels.includes('email') && r.email)
  const smsRecipients = normalizedRecipients.filter(r => r.channels.includes('sms') && r.phone)

  const hasAnyCriteria =
    searchCriteria.keywords ||
    searchCriteria.naics ||
    searchCriteria.agency ||
    searchCriteria.setAside ||
    (searchCriteria.states && searchCriteria.states.length > 0) ||
    (searchCriteria.ptypes && searchCriteria.ptypes.length > 0) ||
    searchCriteria.ccode

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
      <div className="w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-blue-300 overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className={`px-6 py-5 flex-shrink-0 ${isError ? 'bg-red-700' : 'bg-emerald-700'}`}>
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <Image src="/logo.png" alt="Precise GovCon" width={40} height={40} className="h-10 w-auto object-contain opacity-95" />
          </div>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-white shadow-lg flex-shrink-0">
                {isError
                  ? <XCircle className="h-7 w-7 text-red-700" />
                  : <CheckCircle className="h-7 w-7 text-emerald-700" />
                }
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-1">
                  {isError ? 'Alert Run Failed' : 'Alert Executed Successfully'}
                </h3>
                <p className="text-sm text-white">
                  {isError
                    ? 'There was a problem running this alert'
                    : isNoResults
                      ? 'Search completed — no matching opportunities found'
                      : `${resultCount} opportunit${resultCount !== 1 ? 'ies' : 'y'} found and prepared for delivery`
                  }
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-white hover:text-white transition-colors p-1 rounded-lg hover:bg-blue-800 flex-shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4 bg-blue-50">

          {/* Alert name */}
          <div className="text-center pb-4 border-b border-blue-200">
            <p className="text-xs text-blue-700 uppercase tracking-wide mb-1">Alert</p>
            <p className="text-lg font-bold text-blue-900">"{alertName}"</p>
          </div>

          {/* Error message */}
          {isError && errorMessage && (
            <div className="bg-red-100 border border-red-400 rounded-xl p-4 flex items-start gap-3">
              <XCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-red-800 mb-1">Error Details</p>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* No results warning */}
          {isNoResults && (
            <div className="bg-amber-100 border border-amber-400 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-700 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                No opportunities matched your search criteria. Email was not sent unless "send empty results" is enabled for this alert.
              </p>
            </div>
          )}

          {/* Results + recipients count */}
          {!isError && (
            <div className={`border-2 rounded-2xl p-5 ${isNoResults ? 'bg-blue-100 border-blue-300' : 'bg-emerald-100 border-emerald-400'}`}>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center p-3 rounded-xl mb-3 ${isNoResults ? 'bg-blue-200' : 'bg-emerald-200'}`}>
                    <TrendingUp className={`h-5 w-5 ${isNoResults ? 'text-blue-700' : 'text-emerald-700'}`} />
                  </div>
                  <p className="text-xs text-blue-700 mb-1">Opportunities Found</p>
                  <p className={`text-4xl font-bold ${isNoResults ? 'text-blue-700' : 'text-emerald-700'}`}>{resultCount}</p>
                </div>
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-3 rounded-xl bg-blue-200 mb-3">
                    <Users className="h-5 w-5 text-blue-700" />
                  </div>
                  <p className="text-xs text-blue-700 mb-1">Recipients</p>
                  <p className="text-4xl font-bold text-blue-700">{normalizedRecipients.length}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email sent status + recipient list */}
          {normalizedRecipients.length > 0 && (
            <div className="bg-white border border-blue-300 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                  <Mail className="h-4 w-4 text-blue-700" />
                  Delivery Details
                </p>
                {emailSent
                  ? <span className="text-sm px-3 py-1.5 bg-orange-500 text-white rounded-full font-bold flex items-center gap-1.5"><CheckCircle className="w-4 h-4" /> Email Sent</span>
                  : <span className="text-xs px-2 py-1 bg-amber-100 border border-amber-400 text-amber-800 rounded-full font-bold flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Email Not Sent</span>
                }
              </div>

              {emailRecipients.length > 0 && (
                <div>
                  <p className="text-xs text-blue-700 mb-2 flex items-center gap-1"><Mail className="w-3 h-3 text-blue-700" /> Email recipients</p>
                  <div className="flex flex-wrap gap-1.5">
                    {emailRecipients.map((r, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 border border-blue-300 rounded-full text-xs text-blue-900">
                        <Mail className="w-3 h-3 text-blue-700 flex-shrink-0" />
                        <span className="font-semibold">{[r.firstName, r.lastName].filter(Boolean).join(' ') || r.email}</span>
                        {(r.firstName || r.lastName) && r.email && <span className="text-blue-700">{r.email}</span>}
                        {r.role && <span className="text-blue-700">· {r.role}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {smsRecipients.length > 0 && (
                <div>
                  <p className="text-xs text-blue-700 mb-2 flex items-center gap-1"><MessageSquare className="w-3 h-3 text-green-700" /> SMS recipients</p>
                  <div className="flex flex-wrap gap-1.5">
                    {smsRecipients.map((r, i) => (
                      <span key={i} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-100 border border-green-300 rounded-full text-xs text-green-900">
                        <MessageSquare className="w-3 h-3 text-green-700 flex-shrink-0" />
                        <span className="font-semibold">{[r.firstName, r.lastName].filter(Boolean).join(' ') || r.phone}</span>
                        {(r.firstName || r.lastName) && r.phone && <span className="text-green-700">{r.phone}</span>}
                        {r.role && <span className="text-green-700">· {r.role}</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1 border-t border-blue-200">
                <Clock className="h-3.5 w-3.5 text-blue-700 flex-shrink-0" />
                <span className="text-xs text-blue-700">
                  Run at{' '}
                  <span className="text-blue-900 font-semibold">
                    {new Date().toLocaleString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </span>
              </div>
            </div>
          )}

          {/* Search criteria */}
          {hasAnyCriteria && (
            <div className="bg-white border border-blue-300 rounded-xl p-4">
              <p className="text-sm font-semibold text-blue-900 mb-3">Search Criteria Used</p>
              <div className="flex flex-wrap gap-2">
                {searchCriteria.keywords && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-900 rounded border border-blue-300">
                    <span className="text-blue-700">Keywords: </span>{searchCriteria.keywords}
                  </span>
                )}
                {searchCriteria.naics && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-900 rounded border border-blue-300">
                    <span className="text-blue-700">NAICS: </span>{searchCriteria.naics}
                  </span>
                )}
                {searchCriteria.ccode && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-900 rounded border border-blue-300">
                    <span className="text-blue-700">PSC: </span>{searchCriteria.ccode}
                  </span>
                )}
                {searchCriteria.agency && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-900 rounded border border-blue-300">
                    <span className="text-blue-700">Agency: </span>{searchCriteria.agency}
                  </span>
                )}
                {searchCriteria.setAside && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-900 rounded border border-blue-300">
                    <span className="text-blue-700">Set-Aside: </span>{searchCriteria.setAside}
                  </span>
                )}
                {searchCriteria.states && searchCriteria.states.length > 0 && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-900 rounded border border-blue-300">
                    <span className="text-blue-700">States: </span>{searchCriteria.states.join(', ')}
                  </span>
                )}
                {searchCriteria.ptypes && searchCriteria.ptypes.length > 0 && (
                  <span className="text-xs px-2 py-1 bg-blue-100 text-blue-900 rounded border border-blue-300">
                    <span className="text-blue-700">Types: </span>{searchCriteria.ptypes.join(', ')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-300 flex justify-end flex-shrink-0">
          <button
            onClick={onClose}
            className={`px-6 py-2.5 rounded-xl text-white font-semibold flex items-center gap-2 transition-all shadow-lg ${
              isError
                ? 'bg-blue-700 hover:bg-blue-800'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isError ? <X className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
