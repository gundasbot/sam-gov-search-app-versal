// components/LiveTickerWithRateLimit.tsx
// Example component showing how to handle rate limits gracefully

import { useEffect, useState } from 'react';
import { AlertCircle, TrendingUp, Clock } from 'lucide-react';

interface TickerData {
  count: number;
  opportunities: any[];
  rateLimitExceeded?: boolean;
  nextAccessTime?: string;
  error?: string | null;
  message?: string;
}

export function LiveTickerWithRateLimit() {
  const [data, setData] = useState<TickerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTicker = async () => {
      try {
        const response = await fetch('/api/sam/live-ticker');
        const result = await response.json();
        setData(result);
      } catch (error) {
        console.error('Ticker fetch error:', error);
        setData({
          count: 0,
          opportunities: [],
          error: 'Failed to load',
          message: 'Unable to load live opportunities'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTicker();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchTicker, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-800 rounded-lg p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-700 rounded w-2/3"></div>
      </div>
    );
  }

  // Handle rate limit exceeded
  if (data?.rateLimitExceeded) {
    return (
      <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="bg-amber-500/20 rounded-full p-3">
            <Clock className="h-6 w-6 text-amber-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-amber-200 mb-1">
              API Quota Exceeded
            </h3>
            <p className="text-amber-300 text-sm mb-3">
              SAM.gov API quota has been exceeded. Live opportunities will be available again after:
            </p>
            <div className="bg-amber-500/10 rounded px-3 py-2 inline-block">
              <span className="text-amber-200 font-mono text-sm">
                {data.nextAccessTime || 'Unknown'}
              </span>
            </div>
            <p className="text-amber-400 text-xs mt-3">
              Your saved searches and alerts will resume automatically once the quota resets.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Handle general errors
  if (data?.error) {
    return (
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex items-center gap-3 text-slate-400">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Live Opportunities Unavailable</p>
            <p className="text-sm text-slate-500">{data.message || 'Please try again later'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Normal display with opportunities
  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-500/20 rounded-full p-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Live Opportunities</h3>
            <p className="text-cyan-300 text-sm">
              {data?.count || 0} opportunities in the last 7 days
            </p>
          </div>
        </div>
      </div>

      {data?.opportunities && data.opportunities.length > 0 ? (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {data.opportunities.slice(0, 5).map((opp: any, idx: number) => (
            <div 
              key={opp.id || idx}
              className="bg-slate-800/50 rounded-lg p-4 hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium mb-1 truncate">
                    {opp.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{opp.agency}</span>
                    <span>•</span>
                    <span>{opp.type}</span>
                    {opp.naics && (
                      <>
                        <span>•</span>
                        <span>NAICS: {opp.naics}</span>
                      </>
                    )}
                  </div>
                </div>
                <a
                  href={opp.samUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 text-xs whitespace-nowrap"
                >
                  View →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-slate-400 text-center py-8">
          No opportunities found
        </p>
      )}
    </div>
  );
}

// Alternative: Compact banner version for top of page
export function RateLimitBanner() {
  const [data, setData] = useState<TickerData | null>(null);

  useEffect(() => {
    fetch('/api/sam/live-ticker')
      .then(r => r.json())
      .then(setData)
      .catch(console.error);
  }, []);

  if (!data?.rateLimitExceeded) return null;

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
        <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
        <p className="text-amber-200">
          <span className="font-medium">SAM.gov API quota exceeded.</span>
          <span className="text-amber-300 ml-1">
            Service resumes: {data.nextAccessTime}
          </span>
        </p>
      </div>
    </div>
  );
}
