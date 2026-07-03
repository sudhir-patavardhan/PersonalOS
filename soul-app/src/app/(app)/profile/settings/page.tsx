'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SoulProfile } from '@/lib/types';

export default function SettingsPage() {
  const [profile, setProfile] = useState<SoulProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [maxOffers, setMaxOffers] = useState(1);
  const [quietStart, setQuietStart] = useState('22:00');
  const [quietEnd, setQuietEnd] = useState('08:00');

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setLoading(false);
    });
  }, []);

  if (loading || !profile) return <div className="flex items-center justify-center h-full"><p className="text-zinc-500">Loading...</p></div>;

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500 animate-fade-in-up">
        <Link href="/profile" className="hover:text-zinc-300">Profile</Link>
        <span>/</span>
        <span className="text-white">Settings</span>
      </div>

      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-400 mt-1">Preferences, security, and app configuration</p>
      </div>

      {/* Soul Profile */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
        <h2 className="text-sm font-semibold text-white mb-4">Soul Profile</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Display Name</label>
            <input type="text" defaultValue={profile.displayName}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
          </div>
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Region</label>
            <select defaultValue={profile.region}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500">
              <option value="North America">North America</option>
              <option value="Europe">Europe</option>
              <option value="Asia Pacific">Asia Pacific</option>
              <option value="South America">South America</option>
            </select>
            <p className="text-[9px] text-zinc-600 mt-1">Broad region only — used for supply metrics. Your exact location is never shared.</p>
          </div>
        </div>
      </div>

      {/* Notification preferences */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
        <h2 className="text-sm font-semibold text-white mb-4">Notifications</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-[10px] text-zinc-500 mb-1">Max offers per day</label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max="5" value={maxOffers} onChange={e => setMaxOffers(Number(e.target.value))}
                className="flex-1 accent-violet-500" />
              <span className="text-sm text-white font-medium w-6 text-center">{maxOffers}</span>
            </div>
            <p className="text-[9px] text-zinc-600 mt-1">Remaining matched offers sit silently in your feed</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Quiet hours start</label>
              <input type="time" value={quietStart} onChange={e => setQuietStart(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-[10px] text-zinc-500 mb-1">Quiet hours end</label>
              <input type="time" value={quietEnd} onChange={e => setQuietEnd(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
        <h2 className="text-sm font-semibold text-white mb-4">Security</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-300">Passkey / TOTP</p>
              <p className="text-[10px] text-zinc-500">Authentication method</p>
            </div>
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Configured</span>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-300">Active sessions</p>
              <p className="text-[10px] text-zinc-500">Current device</p>
            </div>
            <span className="text-xs text-zinc-400">1 session</span>
          </div>
        </div>
      </div>

      {/* About */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
        <h2 className="text-sm font-semibold text-white mb-3">About PersonalOS</h2>
        <div className="space-y-1 text-xs text-zinc-400">
          <p>Version: L0.3 Demo</p>
          <p>Synthetic data mode — no real data is collected or stored</p>
          <p>Passkey auth, on-device scoring, and blockchain settlement in production</p>
        </div>
      </div>
    </div>
  );
}
