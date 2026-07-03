'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SoulProfile } from '@/lib/types';

export default function ProfilePage() {
  const [profile, setProfile] = useState<SoulProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setLoading(false);
    });
  }, []);

  if (loading || !profile) return <div className="flex items-center justify-center h-full"><p className="text-zinc-500">Loading...</p></div>;

  const links = [
    { href: '/profile/konnections', label: 'Konnections', desc: 'Manage data sources', icon: '🔗' },
    { href: '/profile/privacy', label: 'Privacy Center', desc: 'Sharing log & data control', icon: '🛡️' },
    { href: '/profile/settings', label: 'Settings', desc: 'Preferences & security', icon: '⚙️' },
  ];

  return (
    <div className="p-5 space-y-6">
      {/* Profile card */}
      <div className="glass-card p-6 gradient-glow animate-fade-in-up">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-xl font-bold text-white">
            {profile.avatarInitials}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{profile.displayName}</h1>
            <p className="text-sm text-zinc-400">{profile.email}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-zinc-500">{profile.region}</span>
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${profile.phase === 2 ? 'bg-violet-500/10 text-violet-400' : 'bg-cyan-500/10 text-cyan-400'}`}>
                Phase {profile.phase}
              </span>
              <span className="text-[10px] gradient-text font-semibold">{profile.depthScore}% Depth</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="space-y-3">
        {links.map((link, i) => (
          <Link key={link.href} href={link.href}
            className="block glass-card glass-card-hover p-4 animate-fade-in-up transition-all" style={{ animationDelay: `${0.1 + i * 0.05}s`, opacity: 0 }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-lg">{link.icon}</span>
                <div>
                  <p className="text-sm font-medium text-white">{link.label}</p>
                  <p className="text-[10px] text-zinc-500">{link.desc}</p>
                </div>
              </div>
              <svg className="w-4 h-4 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Sign out */}
      <button onClick={async () => {
        await fetch('/api/auth/login', { method: 'DELETE' }).catch(() => {});
        document.cookie = 'soul-session=; max-age=0; path=/';
        window.location.href = '/login';
      }} className="w-full glass-card p-4 text-red-400 text-sm font-medium hover:bg-white/5 transition-colors text-center">
        Sign Out
      </button>

      <p className="text-center text-[10px] text-zinc-700">Synthetic data mode · Passkey auth in production</p>
    </div>
  );
}
