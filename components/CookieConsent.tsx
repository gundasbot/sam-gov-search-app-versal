// components/CookieConsent.tsx
'use client';

import { useState, useEffect } from 'react';
import { X, Cookie, Shield, BarChart3, Settings } from 'lucide-react';

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always required
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => setShowBanner(true), 1000);
    } else {
      // Load saved preferences
      try {
        const saved = JSON.parse(consent);
        setPreferences(saved);
      } catch (e) {
        console.error('Error loading cookie preferences:', e);
      }
    }
  }, []);

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem('cookie-consent', JSON.stringify(prefs));
    setPreferences(prefs);
    setShowBanner(false);
    setShowSettings(false);
    
    // Initialize analytics/marketing scripts based on preferences
    if (prefs.analytics) {
      initializeAnalytics();
    }
    if (prefs.marketing) {
      initializeMarketing();
    }
  };

  const acceptAll = () => {
    savePreferences({
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    });
  };

  const rejectAll = () => {
    savePreferences({
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    });
  };

  const saveCustom = () => {
    savePreferences(preferences);
  };

  const initializeAnalytics = () => {
    // Add your analytics initialization here (Google Analytics, etc.)
    console.log('Analytics initialized');
  };

  const initializeMarketing = () => {
    // Add your marketing cookies here (Facebook Pixel, etc.)
    console.log('Marketing cookies initialized');
  };

  if (!showBanner) return null;

  return (
    <>
      {/* Main Cookie Banner */}
      {!showSettings && (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4 md:p-6 animate-slide-up pointer-events-none">
          <div className="max-w-6xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl sm:rounded-2xl shadow-2xl border border-cyan-500/30 overflow-hidden pointer-events-auto">
            <div className="relative p-4 sm:p-6 md:p-8">

              {/* Close button — absolute top-right on all sizes */}
              <button
                onClick={() => setShowBanner(false)}
                className="absolute top-3 right-3 p-1.5 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white z-10"
                aria-label="Close"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              <div className="flex items-start gap-3 sm:gap-4 pr-6 sm:pr-8">
                {/* Cookie Icon — hidden on very small screens to save space */}
                <div className="hidden sm:flex flex-shrink-0 p-2.5 sm:p-3 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl">
                  <Cookie className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">
                    🍪 We Value Your Privacy
                  </h3>
                  <p className="text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed mb-3 sm:mb-4">
                    We use cookies to enhance your experience and analyze traffic.
                    <span className="hidden sm:inline"> By clicking "Accept All", you consent to our use of cookies.</span>{' '}
                    <a href="/privacy" className="text-cyan-400 hover:text-cyan-300 underline font-semibold">
                      Privacy Policy
                    </a>
                  </p>

                  {/* Action Buttons — stack on mobile, row on sm+ */}
                  <div className="flex flex-col xs:flex-row sm:flex-row flex-wrap gap-2 sm:gap-3">
                    <button
                      onClick={acceptAll}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl transition-all shadow-lg text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      Accept All
                    </button>
                    
                    <button
                      onClick={rejectAll}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      Reject All
                    </button>

                    <button
                      onClick={() => setShowSettings(true)}
                      className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-700/50 hover:bg-slate-700 text-white font-bold rounded-xl transition-all border border-slate-600 text-sm sm:text-base flex items-center justify-center gap-2"
                    >
                      <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      Customize
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cookie Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-t-2xl sm:rounded-2xl shadow-2xl border border-cyan-500/30 sm:border-2 max-w-2xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                  <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h2 className="text-lg sm:text-2xl font-bold text-white">Cookie Preferences</h2>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Content — flex-1 + overflow-y-auto so it scrolls independently */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              <p className="text-slate-300 mb-6 leading-relaxed text-sm sm:text-base">
                We use different types of cookies to optimize your experience on our website. 
                Click on the categories below to learn more and customize your preferences.
              </p>

              {/* Cookie Categories */}
              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-3">
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                        Necessary Cookies
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400">
                        Required for the website to function properly. Cannot be disabled.
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {/* Disabled toggle - always on */}
                      <div className="relative inline-block w-12 h-6 bg-slate-600 rounded-full opacity-50 cursor-not-allowed">
                        <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full shadow-md"></div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Examples: Session management, security, form submission
                  </p>
                </div>

                {/* Analytics Cookies */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-3">
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                        Analytics Cookies
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400">
                        Help us understand how visitors interact with our website.
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {/* Toggle switch */}
                      <button
                        onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                        className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                          preferences.analytics ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                            preferences.analytics ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        ></div>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Examples: Google Analytics, page views, user behavior tracking
                  </p>
                </div>

                {/* Marketing Cookies */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-3">
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                        Marketing Cookies
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400">
                        Used to track visitors across websites to display relevant ads.
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {/* Toggle switch */}
                      <button
                        onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                        className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                          preferences.marketing ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                            preferences.marketing ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        ></div>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Examples: Facebook Pixel, Google Ads, retargeting
                  </p>
                </div>

                {/* Preference Cookies */}
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 hover:border-cyan-500/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 pr-3">
                      <h3 className="text-base sm:text-lg font-bold text-white mb-1">
                        Preference Cookies
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-400">
                        Remember your preferences and settings for a better experience.
                      </p>
                    </div>
                    <div className="ml-2 flex-shrink-0">
                      {/* Toggle switch */}
                      <button
                        onClick={() => setPreferences({ ...preferences, preferences: !preferences.preferences })}
                        className={`relative inline-block w-12 h-6 rounded-full transition-colors ${
                          preferences.preferences ? 'bg-emerald-500' : 'bg-slate-600'
                        }`}
                      >
                        <div
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                            preferences.preferences ? 'translate-x-7' : 'translate-x-1'
                          }`}
                        ></div>
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Examples: Language preference, theme selection, timezone
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 sm:gap-3 p-4 sm:p-6 border-t border-slate-700 flex-shrink-0">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 sm:px-6 py-2.5 sm:py-3 text-slate-400 hover:text-white font-semibold transition-colors text-sm sm:text-base text-center"
              >
                Cancel
              </button>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={rejectAll}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl transition-all text-sm sm:text-base"
                >
                  Reject All
                </button>
                <button
                  onClick={saveCustom}
                  className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold rounded-xl transition-all shadow-lg text-sm sm:text-base"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slide-up 0.5s ease-out;
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </>
  );
}