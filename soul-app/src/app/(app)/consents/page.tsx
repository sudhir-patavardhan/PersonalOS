'use client';
import { useEffect, useState } from 'react';
import type { SoulConsent, AvailableCategory, SoulProfile } from '@/lib/types';

export default function ConsentsPage() {
  const [profile, setProfile] = useState<SoulProfile | null>(null);
  const [consents, setConsents] = useState<SoulConsent[]>([]);
  const [available, setAvailable] = useState<AvailableCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFloor, setEditFloor] = useState(0);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setConsents(d.consents || []);
      setAvailable(d.availableCategories || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-500">Loading...</p></div>;

  const demandColors = { High: 'text-green-400 bg-green-500/10', Moderate: 'text-yellow-400 bg-yellow-500/10', Low: 'text-zinc-400 bg-zinc-500/10' };

  return (
    <div className="p-5 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Consents</h1>
        <p className="text-sm text-zinc-400 mt-1">Control what you share and set your price</p>
      </div>

      {/* Privacy note */}
      <div className="glass-card p-4 border-violet-500/20 animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
        <div className="flex items-start gap-3">
          <span className="text-sm">🛡️</span>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Brands see your <span className="text-violet-400">noisy score (±noise)</span>, never your actual data. You can revoke anytime — your data stays encrypted on-device.
          </p>
        </div>
      </div>

      {/* Active consents */}
      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Active ({consents.length})</h2>
        <div className="space-y-3">
          {consents.map((c, i) => (
            <div key={c.id} className="glass-card p-4 animate-fade-in-up" style={{ animationDelay: `${0.1 + i * 0.05}s`, opacity: 0 }}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium text-white">{c.categoryDisplay}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${demandColors[c.demandSignal]}`}>{c.demandSignal}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-zinc-400">
                    <span>{c.offersReceived} offers received</span>
                    <span className="text-green-400">${c.totalEarned.toFixed(2)} earned</span>
                  </div>
                  {c.bidRange && (
                    <p className="text-[10px] text-zinc-500 mt-1">Market bids: ${c.bidRange.min.toFixed(2)} – ${c.bidRange.max.toFixed(2)}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-white">${c.yieldFloorUsdc.toFixed(2)}</p>
                  <p className="text-[9px] text-zinc-500">your floor</p>
                </div>
              </div>

              {editingId === c.id ? (
                <div className="mt-3 glass-card p-3">
                  <label className="text-xs text-zinc-400">Adjust yield floor</label>
                  <div className="flex items-center gap-3 mt-2">
                    <input type="range" min="0.25" max="5.00" step="0.25" value={editFloor}
                      onChange={e => setEditFloor(Number(e.target.value))}
                      className="flex-1 accent-violet-500" />
                    <span className="text-sm font-mono text-white w-14 text-right">${editFloor.toFixed(2)}</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => { setConsents(prev => prev.map(x => x.id === c.id ? { ...x, yieldFloorUsdc: editFloor } : x)); setEditingId(null); }}
                      className="flex-1 py-1.5 gradient-btn text-white rounded-lg text-xs font-medium">Save</button>
                    <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 bg-white/5 text-zinc-400 rounded-lg text-xs">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 mt-3">
                  <button onClick={() => { setEditingId(c.id); setEditFloor(c.yieldFloorUsdc); }}
                    className="flex-1 py-1.5 bg-white/5 text-zinc-300 rounded-lg text-xs hover:bg-white/10 transition-colors">Edit Floor</button>
                  <button onClick={() => setConsents(prev => prev.map(x => x.id === c.id ? { ...x, active: !x.active } : x))}
                    className="py-1.5 px-3 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">Revoke</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Available categories */}
      {available.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Available to consent</h2>
          <div className="space-y-3">
            {available.map((a, i) => (
              <div key={a.category} className="glass-card glass-card-hover p-4 animate-fade-in-up" style={{ animationDelay: `${0.3 + i * 0.05}s`, opacity: 0 }}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-white">{a.categoryDisplay}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${demandColors[a.demandSignal]}`}>{a.demandSignal}</span>
                      <span className="text-[10px] text-green-400">Est. {a.estimatedEarning}</span>
                    </div>
                    {a.requiresSource && (
                      <p className="text-[10px] text-cyan-400 mt-1">Requires: {a.requiresSource}</p>
                    )}
                  </div>
                  <button className={`py-1.5 px-4 rounded-lg text-xs font-medium transition-all ${a.requiresSource ? 'bg-white/5 text-zinc-500 cursor-not-allowed' : 'gradient-btn text-white'}`}
                    disabled={!!a.requiresSource}>
                    {a.requiresSource ? 'Locked' : 'Consent'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {profile?.phase === 1 && (
        <div className="glass-card p-4 border-cyan-500/20">
          <p className="text-xs text-zinc-400">Connect more data sources to unlock additional categories and earn more.</p>
        </div>
      )}
    </div>
  );
}
