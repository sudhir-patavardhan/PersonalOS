'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { SharingLogEntry, SoulProfile } from '@/lib/types';

export default function PrivacyCenterPage() {
  const [profile, setProfile] = useState<SoulProfile | null>(null);
  const [sharingLog, setSharingLog] = useState<SharingLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteStep, setDeleteStep] = useState<0 | 1 | 2 | 3>(0);
  const [deleteInput, setDeleteInput] = useState('');
  const [deleteTotp, setDeleteTotp] = useState('');
  const [dpDemo, setDpDemo] = useState(82);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setSharingLog(d.sharingLog || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-500">Loading...</p></div>;

  const noisy = Math.round(dpDemo + (Math.random() - 0.5) * 16);

  return (
    <div className="p-5 space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500 animate-fade-in-up">
        <Link href="/profile" className="hover:text-zinc-300">Profile</Link>
        <span>/</span>
        <span className="text-white">Privacy Center</span>
      </div>

      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Privacy Center</h1>
        <p className="text-sm text-zinc-400 mt-1">See exactly what&apos;s been shared and control your data</p>
      </div>

      {/* DP Explainer */}
      <div className="glass-card p-5 gradient-glow animate-fade-in-up" style={{ animationDelay: '0.05s', opacity: 0 }}>
        <h2 className="text-sm font-semibold text-white mb-3">How Your Privacy is Protected</h2>
        <p className="text-xs text-zinc-400 mb-4">Differential privacy adds calibrated noise to your scores before any Brand sees them. This prevents Brands from pinpointing your exact behavior.</p>

        <div className="glass-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Your actual score</p>
              <p className="text-2xl font-bold text-white">{dpDemo}</p>
            </div>
            <div className="text-2xl text-zinc-600">→</div>
            <div className="text-right">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Brand sees</p>
              <p className="text-2xl font-bold text-violet-400">{noisy}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-500">Score:</span>
            <input type="range" min="0" max="100" value={dpDemo} onChange={e => setDpDemo(Number(e.target.value))}
              className="flex-1 accent-violet-500" />
            <span className="text-xs text-zinc-400 w-8">{dpDemo}</span>
          </div>
          <p className="text-[10px] text-zinc-600 mt-2">Move the slider — notice how the &quot;Brand sees&quot; value always differs. Fresh noise is applied on every query.</p>
        </div>
      </div>

      {/* Sharing log */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
        <h2 className="text-sm font-semibold text-white mb-4">Sharing Log ({sharingLog.length})</h2>
        {sharingLog.length === 0 ? (
          <p className="text-xs text-zinc-500">No data has been shared yet.</p>
        ) : (
          <div className="space-y-3">
            {sharingLog.map(entry => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <div>
                  <p className="text-sm text-white">{entry.brandName}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{entry.categoryDisplay}</span>
                    <span className="text-[10px] text-zinc-500">{new Date(entry.sharedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-500">Actual: {entry.actualScore}</span>
                    <span className="text-zinc-600">→</span>
                    <span className="text-violet-400">Shared: {entry.noisyScore}</span>
                  </div>
                  <span className={`text-[9px] ${entry.status === 'active' ? 'text-green-400' : entry.status === 'revoked' ? 'text-red-400' : 'text-zinc-500'}`}>
                    {entry.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Data export */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
        <h2 className="text-sm font-semibold text-white mb-2">Export Your Data</h2>
        <p className="text-xs text-zinc-400 mb-3">Download all your data in JSON format. Data portability is your right.</p>
        <button className="py-2 px-4 bg-white/5 text-zinc-300 rounded-lg text-xs hover:bg-white/10 transition-colors">Download JSON</button>
      </div>

      {/* Data deletion */}
      <div className="glass-card p-5 border-red-500/20 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
        <h2 className="text-sm font-semibold text-red-400 mb-2">Delete All My Data</h2>
        <p className="text-xs text-zinc-400 mb-3">
          This destroys your passkey, making all Arweave-stored data permanently unreadable. You will lose ${profile ? '~' + (47.50).toFixed(2) : '0'} in wallet balance. This is irreversible.
        </p>

        {deleteStep === 0 && (
          <button onClick={() => setDeleteStep(1)} className="py-2 px-4 bg-red-500/10 text-red-400 rounded-lg text-xs hover:bg-red-500/20 transition-colors">
            Begin Deletion
          </button>
        )}

        {deleteStep === 1 && (
          <div className="space-y-3">
            <p className="text-xs text-red-300">Step 1 of 3: Type &quot;DELETE&quot; to confirm</p>
            <input type="text" value={deleteInput} onChange={e => setDeleteInput(e.target.value)} placeholder="Type DELETE"
              className="w-full px-3 py-2 bg-white/5 border border-red-500/30 rounded-lg text-sm text-white focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => { if (deleteInput === 'DELETE') setDeleteStep(2); }} disabled={deleteInput !== 'DELETE'}
                className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium disabled:opacity-30">Continue</button>
              <button onClick={() => { setDeleteStep(0); setDeleteInput(''); }} className="py-2 px-4 bg-white/5 text-zinc-400 rounded-lg text-xs">Cancel</button>
            </div>
          </div>
        )}

        {deleteStep === 2 && (
          <div className="space-y-3">
            <p className="text-xs text-red-300">Step 2 of 3: Enter your TOTP code</p>
            <input type="text" value={deleteTotp} onChange={e => setDeleteTotp(e.target.value)} maxLength={6} placeholder="000000"
              className="w-full px-3 py-2 bg-white/5 border border-red-500/30 rounded-lg text-center text-xl tracking-widest text-white font-mono focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => setDeleteStep(3)} disabled={deleteTotp.length !== 6}
                className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-xs font-medium disabled:opacity-30">Confirm Deletion</button>
              <button onClick={() => { setDeleteStep(0); setDeleteTotp(''); setDeleteInput(''); }} className="py-2 px-4 bg-white/5 text-zinc-400 rounded-lg text-xs">Cancel</button>
            </div>
          </div>
        )}

        {deleteStep === 3 && (
          <div className="glass-card p-4 border-yellow-500/30">
            <p className="text-sm text-yellow-400 font-medium">Demo mode</p>
            <p className="text-xs text-zinc-400 mt-1">In production, your passkey would be destroyed and all data would become permanently unreadable. No data was deleted in this demo.</p>
            <button onClick={() => { setDeleteStep(0); setDeleteInput(''); setDeleteTotp(''); }}
              className="mt-3 py-1.5 px-4 bg-white/5 text-zinc-300 rounded-lg text-xs">Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}
