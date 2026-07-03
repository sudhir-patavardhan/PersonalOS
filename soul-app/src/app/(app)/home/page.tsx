'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SoulProfile, Insight, DailyEarning } from '@/lib/types';

function DepthScoreRing({ score, phase }: { score: number; phase: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const thresholdOffset = circumference - (60 / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke="url(#ringGrad)" strokeWidth="8"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="depth-ring" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1"
          strokeDasharray="2 4" strokeDashoffset={thresholdOffset} />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" />
            <stop offset="100%" stopColor="#22d3ee" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white">{score}%</span>
        <span className="text-[9px] text-zinc-400 uppercase tracking-wider">Depth</span>
      </div>
      {phase === 1 && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-[9px] text-cyan-400 whitespace-nowrap">60% to unlock</div>
      )}
    </div>
  );
}

export default function HomePage() {
  const [profile, setProfile] = useState<SoulProfile | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [earnings, setEarnings] = useState<DailyEarning[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [offerCount, setOfferCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setInsights(d.insights || []);
      setEarnings(d.dailyEarnings || []);
      setWalletBalance(d.walletBalance || 0);
      setOfferCount(d.pendingOfferCount || 0);
      setLoading(false);
    });
  }, []);

  if (loading || !profile) return <div className="flex items-center justify-center h-full"><p className="text-zinc-500">Loading...</p></div>;

  const recentEarnings = earnings.slice(-7);
  const weekTotal = recentEarnings.reduce((s, e) => s + e.amount, 0);
  const maxEarn = Math.max(...recentEarnings.map(e => e.amount), 0.01);

  return (
    <div className="p-5 space-y-6">
      {/* Hero */}
      <div className="glass-card p-6 gradient-glow animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-zinc-400 text-sm">Welcome back,</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">{profile.displayName}</h1>
            <div className="flex items-center gap-3 mt-3">
              <div>
                <p className="text-3xl font-bold gradient-text animate-count-up">${walletBalance.toFixed(2)}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Total earned · ${weekTotal.toFixed(2)} this week</p>
              </div>
            </div>
            {/* Mini sparkline */}
            <div className="flex items-end gap-0.5 mt-2 h-6">
              {recentEarnings.map((e, i) => (
                <div key={i} className="w-3 rounded-t" style={{
                  height: `${Math.max(4, (e.amount / maxEarn) * 24)}px`,
                  background: e.amount > 0 ? 'linear-gradient(to top, #8b5cf6, #22d3ee)' : 'rgba(255,255,255,0.06)',
                }} />
              ))}
            </div>
          </div>
          <DepthScoreRing score={profile.depthScore} phase={profile.phase} />
        </div>
      </div>

      {/* Offer banner */}
      {profile.phase === 2 && offerCount > 0 && (
        <Link href="/offers" className="block glass-card glass-card-hover p-4 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                <span className="text-sm">🎁</span>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{offerCount} Offer{offerCount > 1 ? 's' : ''} waiting</p>
                <p className="text-[10px] text-zinc-400">Tap to review and earn</p>
              </div>
            </div>
            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </div>
        </Link>
      )}

      {profile.phase === 1 && (
        <div className="glass-card p-4 border-cyan-500/20 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center"><span className="text-sm">🔒</span></div>
            <div>
              <p className="text-white text-sm font-medium">Unlock the marketplace</p>
              <p className="text-[10px] text-zinc-400">Reach 60% Depth Score by connecting more data sources</p>
            </div>
          </div>
          <Link href="/profile/konnections" className="block mt-3 text-center py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-xs font-medium hover:bg-cyan-500/20 transition-colors">
            Connect a source
          </Link>
        </div>
      )}

      {/* Insight Feed */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Your Insights</h2>
        <div className="space-y-3">
          {insights.map((insight, i) => (
            <div key={insight.id} className="glass-card glass-card-hover p-4 animate-fade-in-up" style={{ animationDelay: `${0.15 + i * 0.05}s`, opacity: 0 }}>
              <div className="flex gap-3">
                <span className="text-lg flex-shrink-0">{insight.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{insight.categoryDisplay}</span>
                    {insight.confidence > 0 && (
                      <span className="text-[10px] text-zinc-500">{insight.confidence}% confidence</span>
                    )}
                  </div>
                  <p className="text-sm text-zinc-200 leading-relaxed">{insight.text}</p>
                  {insight.sourcePrompt && (
                    <Link href="/profile/konnections" className="inline-block mt-2 text-[11px] text-cyan-400 hover:text-cyan-300 transition-colors">
                      → {insight.sourcePrompt}
                    </Link>
                  )}
                  <p className="text-[10px] text-zinc-600 mt-2">{new Date(insight.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-[10px] text-zinc-700 pb-4">Synthetic data mode</p>
    </div>
  );
}
