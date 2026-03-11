// components/UrgencyLegend.tsx
'use client';

import { useState } from 'react';
import { Info, X, Calendar } from 'lucide-react';

export default function UrgencyLegend() {
  const [isOpen, setIsOpen] = useState(false);

  const urgencyLevels = [
    { 
      days: '3 or fewer', 
      label: 'CRITICAL', 
      color: 'from-red-500 to-red-600', 
      textColor: 'text-red-500', 
      borderColor: 'border-red-500',
      icon: '🔥', 
      description: 'Immediate action required - deadline imminent' 
    },
    { 
      days: '4-5', 
      label: 'URGENT', 
      color: 'from-orange-500 to-orange-600', 
      textColor: 'text-orange-500', 
      borderColor: 'border-orange-500',
      icon: '⚠️', 
      description: 'Act very quickly - limited time remaining' 
    },
    { 
      days: '6-7', 
      label: 'High Priority', 
      color: 'from-amber-500 to-orange-500', 
      textColor: 'text-amber-500', 
      borderColor: 'border-amber-500',
      icon: '⏰', 
      description: 'Needs attention soon - start preparing' 
    },
    { 
      days: '8-10', 
      label: 'Act Soon', 
      color: 'from-yellow-400 to-amber-500', 
      textColor: 'text-yellow-400', 
      borderColor: 'border-yellow-400',
      icon: '📅', 
      description: 'Begin preparation and research' 
    },
    { 
      days: '11-14', 
      label: 'Normal', 
      color: 'from-lime-500 to-yellow-400', 
      textColor: 'text-lime-500', 
      borderColor: 'border-lime-500',
      icon: '✓', 
      description: 'Standard timeframe for response' 
    },
    { 
      days: '15-17', 
      label: 'Comfortable', 
      color: 'from-green-500 to-lime-500', 
      textColor: 'text-green-500', 
      borderColor: 'border-green-500',
      icon: '😌', 
      description: 'Good amount of time to plan thoroughly' 
    },
    { 
      days: '18-20', 
      label: 'Good Time', 
      color: 'from-emerald-500 to-green-500', 
      textColor: 'text-emerald-500', 
      borderColor: 'border-emerald-500',
      icon: '👍', 
      description: 'Plenty of time for preparation' 
    },
    { 
      days: '21+', 
      label: 'Ample Time', 
      color: 'from-emerald-600 to-emerald-700', 
      textColor: 'text-emerald-600', 
      borderColor: 'border-emerald-600',
      icon: '✨', 
      description: 'Optimal time for detailed preparation' 
    },
  ];

  return (
    <>
      {/* Floating Legend Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 bg-linear-to-br from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group hover:pr-6"
        title="Show urgency color legend"
      >
        <Info className="w-5 h-5" />
        <span className="hidden group-hover:inline-block text-sm font-semibold whitespace-nowrap overflow-hidden transition-all duration-300 max-w-0 group-hover:max-w-xs">
          Legend
        </span>
      </button>

      {/* Legend Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-linear-to-br from-slate-900 to-slate-800 rounded-2xl shadow-2xl border-2 border-cyan-500/30 max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-linear-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Urgency Color Legend</h2>
                  <p className="text-sm text-slate-400">Business days until response deadline</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <p className="text-slate-300 mb-6 text-sm leading-relaxed">
                Opportunities are color-coded based on <strong className="text-cyan-400">business days</strong> remaining until the response deadline. 
                Business days exclude weekends, giving you an accurate picture of working time available.
              </p>

              {/* Gradient Bar */}
              <div className="mb-8 rounded-xl overflow-hidden shadow-lg">
                <div className="h-12 flex">
                  {urgencyLevels.map((level, index) => (
                    <div
                      key={index}
                      className={`flex-1 bg-linear-to-r ${level.color} flex items-center justify-center text-white font-bold text-xs transition-all hover:flex-[1.2]`}
                      title={level.label}
                    >
                      <span className="opacity-0 hover:opacity-100">{level.icon}</span>
                    </div>
                  ))}
                </div>
                <div className="flex text-xs text-slate-400 px-2 py-1 bg-slate-800">
                  <div className="flex-1 text-left">🔴 Critical</div>
                  <div className="flex-1 text-center">🟡 Medium</div>
                  <div className="flex-1 text-right">🟢 Ample</div>
                </div>
              </div>

              {/* Legend Items Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {urgencyLevels.map((level, index) => (
                  <div
                    key={index}
                    className={`p-4 bg-linear-to-r ${level.color} bg-opacity-10 rounded-xl border-2 ${level.borderColor} border-opacity-40 hover:border-opacity-70 transition-all hover:shadow-lg`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon */}
                      <span className="text-3xl shrink-0">{level.icon}</span>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className={`font-bold text-sm ${level.textColor}`}>
                            {level.label}
                          </span>
                          <div className={`px-2 py-0.5 rounded font-bold text-xs ${level.textColor} bg-slate-900/60 border ${level.borderColor} whitespace-nowrap`}>
                            {level.days}bd
                          </div>
                        </div>
                        <div className="text-xs text-slate-400 leading-relaxed">
                          {level.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Info Boxes */}
              <div className="mt-6 space-y-3">
                {/* Business Days Explanation */}
                <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-slate-300">
                      <p className="font-semibold text-cyan-400 mb-1">Why Business Days?</p>
                      <p>Federal contracting operates on business days (Monday-Friday). This gives you a more accurate picture of the actual working time you have to prepare your response.</p>
                    </div>
                  </div>
                </div>

                {/* Example */}
                <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0">💡</span>
                    <div className="text-sm text-slate-300">
                      <p className="font-semibold text-purple-400 mb-1">Example</p>
                      <p>If today is Monday and the deadline is next Friday, that's <strong className="text-white">9 calendar days</strong> but only <strong className="text-emerald-400">5 business days</strong> (excluding the weekend).</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 p-6 border-t border-slate-700">
              <div className="text-sm text-slate-400">
                <span className="font-semibold text-slate-300">Tip:</span> Hover over any opportunity card to see both business and calendar days
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center gap-2"
              >
                Got it!
                <span className="text-xl">👍</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}
