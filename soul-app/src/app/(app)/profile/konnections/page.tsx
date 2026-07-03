'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Konnection, SoulProfile } from '@/lib/types';

export default function KonnectionsPage() {
  const [profile, setProfile] = useState<SoulProfile | null>(null);
  const [konnections, setKonnections] = useState<Konnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setKonnections(d.konnections || []);
      setLoading(false);
    });
  }, []);

  function handleConnect(id: string) {
    setConnecting(id);
    setTimeout(() => {
      setKonnections(prev => prev.map(k => {
        if (k.id !== id) return k;
        const months = 3;
        const contribution = Math.round(k.maxContribution * Math.min(months / 12, 1.0));
        return {
          ...k,
          connected: true,
          connectedAt: new Date().toISOString(),
          lastSync: new Date().toISOString(),
          historyMonths: months,
          depthContribution: contribution,
        };
      }));
      if (profile) {
        const k = konnections.find(k => k.id === id);
        if (k) {
          const newContribution = Math.round(k.maxContribution * Math.min(3 / 12, 1.0));
          setProfile({ ...profile, depthScore: Math.min(100, profile.depthScore + newContribution) });
        }
      }
      setConnecting(null);
    }, 2000);
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-500">Loading...</p></div>;

  const connected = konnections.filter(k => k.connected);
  const available = konnections.filter(k => !k.connected);
  const totalContribution = connected.reduce((s, k) => s + k.depthContribution, 0);

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500 animate-fade-in-up">
        <Link href="/profile" className="hover:text-zinc-300">Profile</Link>
        <span>/</span>
        <span className="text-white">Konnections</span>
      </div>

      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Konnections</h1>
        <p className="text-sm text-zinc-400 mt-1">Connect data sources to deepen your profile and earn more</p>
      </div>

      {/* Depth Score breakdown */}
      <div className="glass-card p-5 gradient-glow animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Depth Score Breakdown</h2>
          <span className="text-lg font-bold gradient-text">{profile?.depthScore || 0}%</span>
        </div>
        <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden relative">
          <div className="h-full rounded-full transition-all duration-1000" style={{
            width: `${profile?.depthScore || 0}%`,
            background: 'linear-gradient(90deg, #8b5cf6, #22d3ee)',
          }} />
          <div className="absolute top-0 h-full w-0.5 bg-white/30" style={{ left: '60%' }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-zinc-600">0%</span>
          <span className="text-[9px] text-zinc-400">60% Phase 2 →</span>
          <span className="text-[9px] text-zinc-600">100%</span>
        </div>
        <div className="mt-3 space-y-1.5">
          {konnections.filter(k => k.connected).map(k => (
            <div key={k.id} className="flex items-center gap-2">
              <span className="text-xs">{k.icon}</span>
              <span className="text-xs text-zinc-300 flex-1">{k.displayName}</span>
              <div className="w-20 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(k.depthContribution / k.maxContribution) * 100}%` }} />
              </div>
              <span className="text-[10px] text-zinc-500 w-8 text-right">{k.depthContribution}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connected */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Connected ({connected.length})</h2>
        <div className="space-y-3">
          {connected.map((k, i) => (
            <div key={k.id} className="glass-card p-4 animate-fade-in-up" style={{ animationDelay: `${0.1 + i * 0.05}s`, opacity: 0 }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{k.icon}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{k.displayName}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                      <span className="text-[10px] text-zinc-500">{k.historyMonths} months · Tier {k.tier}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-violet-400 font-medium">+{k.depthContribution}%</p>
                  <p className="text-[9px] text-zinc-600">Last sync: {k.lastSync ? new Date(k.lastSync).toLocaleDateString() : '—'}</p>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {k.dataTypes.map(dt => (
                  <span key={dt} className="text-[9px] text-zinc-500 bg-white/5 px-2 py-0.5 rounded">{dt}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available */}
      {available.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Available ({available.length})</h2>
          <div className="space-y-3">
            {available.map((k, i) => (
              <div key={k.id} className="glass-card glass-card-hover p-4 animate-fade-in-up" style={{ animationDelay: `${0.25 + i * 0.05}s`, opacity: 0 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xl opacity-50">{k.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-300">{k.displayName}</p>
                      <p className="text-[10px] text-zinc-500">Tier {k.tier} · Up to +{k.maxContribution}% Depth</p>
                    </div>
                  </div>
                  <button onClick={() => handleConnect(k.id)} disabled={connecting === k.id}
                    className="py-1.5 px-4 gradient-btn text-white rounded-lg text-xs font-medium disabled:opacity-50">
                    {connecting === k.id ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
                {connecting === k.id && (
                  <div className="mt-3">
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-violet-500 to-cyan-400 rounded-full animate-pulse" style={{ width: '60%' }} />
                    </div>
                    <p className="text-[10px] text-zinc-500 mt-1">Connecting to {k.displayName}...</p>
                  </div>
                )}
                <div className="mt-2 flex flex-wrap gap-1">
                  {k.dataTypes.map(dt => (
                    <span key={dt} className="text-[9px] text-zinc-600 bg-white/3 px-2 py-0.5 rounded">{dt}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
