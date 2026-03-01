// components/SaveSearchSuccessModal.tsx
'use client'

import { CheckCircle, Bell, Save, ArrowRight, Info, Clock, Mail, FileText, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface SaveSearchSuccessModalProps {
  isOpen: boolean
  onClose: () => void
  searchName: string
  isSubscription: boolean
  deliveryTime?: string
  format?: string
  userEmail?: string
}

export default function SaveSearchSuccessModal({
  isOpen,
  onClose,
  searchName,
  isSubscription,
  deliveryTime = '09:00',
  format = 'csv',
  userEmail = ''
}: SaveSearchSuccessModalProps) {
  const router = useRouter()
  
  if (!isOpen) return null
  
  // Format time for display (12-hour format)
  const formatTime = (time24: string) => {
    if (!time24) return 'your scheduled time'
    const [hour, minute] = time24.split(':').map(Number)
    const period = hour >= 12 ? 'PM' : 'AM'
    const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`
  }
  
  const handleViewAlerts = () => {
    onClose()
    router.push('/alerts')
  }
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative animate-in fade-in zoom-in duration-300">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>
        
        {/* Success Icon */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {isSubscription ? 'Subscription Created!' : 'Search Saved!'}
          </h2>
          <p className="text-lg text-gray-600">
            "{searchName}"
          </p>
        </div>
        
        {isSubscription ? (
          // Subscription Success Content
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-lg text-blue-900 mb-3 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                What Happens Next
              </h3>
              <ul className="space-y-3 text-blue-900">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>
                    We'll search for new opportunities matching your criteria every day at{' '}
                    <strong>{formatTime(deliveryTime)}</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>
                    You'll receive an email at <strong>{userEmail}</strong> with all matching opportunities
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>
                    Results will be delivered as a <strong>{format.toUpperCase()}</strong> file attachment
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-blue-600" />
                  <span>
                    You can manage or pause this alert anytime from the Alerts Manager
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4">
              <p className="text-amber-900 text-sm flex items-start gap-2">
                <Info className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>First alert:</strong> Your first email will arrive tomorrow at{' '}
                  {formatTime(deliveryTime)} if there are matching opportunities.
                </span>
              </p>
            </div>
            
            <div className="bg-gray-50 border-2 border-gray-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Schedule Details
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Frequency:</span>
                  <p className="font-semibold text-gray-900">Daily</p>
                </div>
                <div>
                  <span className="text-gray-600">Delivery Time:</span>
                  <p className="font-semibold text-gray-900">{formatTime(deliveryTime)}</p>
                </div>
                <div>
                  <span className="text-gray-600">Format:</span>
                  <p className="font-semibold text-gray-900">{format.toUpperCase()}</p>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <p className="font-semibold text-green-600">Active</p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Saved Search Success Content
          <div className="space-y-4 mb-6">
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">
              <h3 className="font-bold text-lg text-green-900 mb-3 flex items-center gap-2">
                <Save className="h-5 w-5" />
                Your Search is Saved
              </h3>
              <ul className="space-y-3 text-green-900">
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>
                    Access this search anytime from the Alerts Manager
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>
                    Run the search with one click to get updated results
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>
                    Edit search criteria anytime to refine your results
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0 text-green-600" />
                  <span>
                    Upgrade to a subscription later to receive automatic daily alerts
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
              <p className="text-blue-900 text-sm flex items-start gap-2">
                <Bell className="h-5 w-5 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Want automatic alerts?</strong> Visit the Alerts Manager to upgrade this 
                  search to a subscription and receive daily email notifications.
                </span>
              </p>
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-3 rounded-lg bg-white text-gray-900 border-2 border-gray-300 hover:bg-gray-50 hover:border-gray-400 font-bold text-base transition-all duration-200"
          >
            Close
          </button>
          <button
            onClick={handleViewAlerts}
            className="flex-1 px-6 py-3 rounded-lg bg-blue-600 text-white border-2 border-blue-700 hover:bg-blue-700 font-bold text-base transition-all duration-200 flex items-center justify-center gap-2"
          >
            View All Alerts
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
        
        {/* Help Text */}
        <p className="text-center text-sm text-gray-600 mt-4">
          Need help? Check out our{' '}
          <Link href="/help" className="text-blue-600 hover:underline font-semibold">
            Help Center
          </Link>
          {' '}or{' '}
          <Link href="/contact" className="text-blue-600 hover:underline font-semibold">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  )
}
