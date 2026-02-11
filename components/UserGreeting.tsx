// components/UserGreeting.tsx
'use client';

import { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Clock, X, Target } from 'lucide-react';

interface UserGreetingProps {
  userName: string;
  newOpportunities: number;
  totalMatched: number;
  lastVisit?: string;
}

export default function UserGreeting({ userName, newOpportunities, totalMatched, lastVisit }: UserGreetingProps) {
  const [show, setShow] = useState(true);
  const [greeting, setGreeting] = useState('Welcome back');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  const getTimeAway = () => {
    if (!lastVisit) return null;
    
    const lastVisitDate = new Date(lastVisit);
    const now = new Date();
    const hoursDiff = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60));
    
    if (hoursDiff < 1) return 'a few minutes';
    if (hoursDiff < 24) return `${hoursDiff} hour${hoursDiff > 1 ? 's' : ''}`;
    const daysDiff = Math.floor(hoursDiff / 24);
    if (daysDiff === 1) return '1 day';
    if (daysDiff < 7) return `${daysDiff} days`;
    const weeksDiff = Math.floor(daysDiff / 7);
    if (weeksDiff === 1) return '1 week';
    if (weeksDiff < 4) return `${weeksDiff} weeks`;
    const monthsDiff = Math.floor(daysDiff / 30);
    return `${monthsDiff} month${monthsDiff > 1 ? 's' : ''}`;
  };

  const timeAway = getTimeAway();

  // Don't show if dismissed
  if (!show) return null;

  // Don't show if no meaningful data
  if (!timeAway && newOpportunities === 0 && totalMatched === 0) return null;

  return (
    <div className="mb-6 p-6 bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-cyan-500/10 rounded-2xl border border-white/10 backdrop-blur-sm animate-slide-down">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          {/* Greeting Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {greeting}, {userName}! 👋
              </h2>
              {timeAway && (
                <p className="text-sm text-slate-400">
                  You were away for {timeAway}
                </p>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {/* New Opportunities */}
            {newOpportunities > 0 && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl hover:bg-emerald-500/15 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-semibold text-emerald-400">New Opportunities</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{newOpportunities}</div>
                <div className="text-xs text-slate-400">posted since your last visit</div>
              </div>
            )}

            {/* Matched Opportunities */}
            {totalMatched > 0 && (
              <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl hover:bg-cyan-500/15 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-cyan-400" />
                  <span className="text-sm font-semibold text-cyan-400">Matched to You</span>
                </div>
                <div className="text-3xl font-bold text-white mb-1">{totalMatched}</div>
                <div className="text-xs text-slate-400">opportunities match your profile</div>
              </div>
            )}
          </div>

          {/* Tips Section */}
          {newOpportunities > 0 && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-2xl">💡</div>
                <div className="flex-1">
                  <p className="text-sm text-slate-300">
                    <span className="font-semibold text-cyan-400">Quick Tip:</span>{' '}
                    {newOpportunities > 20 
                      ? 'Lots of new opportunities! Use the urgency filter to see what needs immediate attention.'
                      : totalMatched > 0
                      ? 'Check out the matched opportunities - they align perfectly with your preferences!'
                      : 'Use the filters above to focus on urgent opportunities or specific agencies.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* No New Opportunities Message */}
          {newOpportunities === 0 && timeAway && (
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
              <p className="text-sm text-slate-300">
                No new opportunities since your last visit, but {totalMatched > 0 ? `${totalMatched} opportunities still match` : 'keep checking back for'} your profile!
              </p>
            </div>
          )}
        </div>

        {/* Dismiss Button */}
        <button
          onClick={() => setShow(false)}
          className="flex-shrink-0 p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-down {
          animation: slide-down 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
