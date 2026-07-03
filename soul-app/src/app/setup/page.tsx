'use client';
import { useState } from 'react';
import { DEMO_SOULS } from '@/lib/synthetic-data';

type Step = 'soul-select' | 'credentials' | 'totp-scan' | 'totp-verify';

export default function SetupPage() {
  const [step, setStep] = useState<Step>('soul-select');
  const [selectedSoul, setSelectedSoul] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpUri, setTotpUri] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleCredentials() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, soulId: selectedSoul }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    setTotpUri(data.totpUri);
    setStep('totp-scan');
  }

  async function handleVerify() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/setup', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token: totpCode }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    window.location.href = '/home';
  }

  const souls = DEMO_SOULS;

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">PersonalOS</h1>
          <p className="text-zinc-400 text-sm mt-2">Your data, your earnings, your control</p>
        </div>

        <div className="glass-card p-6 gradient-glow">
          {step === 'soul-select' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Choose your Soul</h2>
              <p className="text-sm text-zinc-400">Select a demo persona to explore PersonalOS</p>
              <div className="space-y-3 mt-4">
                {souls.map(s => (
                  <button key={s.soulId} onClick={() => { setSelectedSoul(s.soulId); setEmail(s.email); setStep('credentials'); }}
                    className="w-full glass-card glass-card-hover p-4 text-left transition-all">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center text-sm font-bold text-white">
                        {s.displayName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="text-white font-medium">{s.displayName}</p>
                        <p className="text-xs text-zinc-400">{s.email}</p>
                        {s.soulId === 'priya' && <p className="text-[10px] text-violet-400 mt-0.5">Phase 2 · 72% Depth · 3 sources · ~$47 earned</p>}
                        {s.soulId === 'marcus' && <p className="text-[10px] text-cyan-400 mt-0.5">Phase 2 · 58% Depth · 2 sources · ~$22 earned</p>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'credentials' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Create your passkey</h2>
              <p className="text-sm text-zinc-400">Set up authentication for {souls.find(s => s.soulId === selectedSoul)?.displayName}</p>
              <p className="text-[10px] text-zinc-500">Passkey auth in production · TOTP for demo</p>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Password</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button onClick={handleCredentials} disabled={loading || !password}
                className="w-full py-2.5 gradient-btn text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {loading ? 'Setting up...' : 'Continue'}
              </button>
              <button onClick={() => setStep('soul-select')} className="w-full text-sm text-zinc-500 hover:text-zinc-300">Back</button>
            </div>
          )}

          {step === 'totp-scan' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Scan authenticator</h2>
              <p className="text-sm text-zinc-400">Scan with your authenticator app (Google Authenticator, Authy, etc.)</p>
              <div className="flex justify-center py-4">
                <div className="bg-white p-3 rounded-xl">
                  <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`} alt="TOTP QR" width={200} height={200} />
                </div>
              </div>
              <button onClick={() => setStep('totp-verify')} className="w-full py-2.5 gradient-btn text-white rounded-lg text-sm font-medium">
                I&apos;ve scanned it
              </button>
            </div>
          )}

          {step === 'totp-verify' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-white">Verify code</h2>
              <p className="text-sm text-zinc-400">Enter the 6-digit code from your authenticator</p>
              <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)} maxLength={6} placeholder="000000"
                className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-center text-xl tracking-widest text-white font-mono focus:outline-none focus:border-violet-500" />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button onClick={handleVerify} disabled={loading || totpCode.length !== 6}
                className="w-full py-2.5 gradient-btn text-white rounded-lg text-sm font-medium disabled:opacity-50">
                {loading ? 'Verifying...' : 'Verify & Enter'}
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">Synthetic data mode</p>
      </div>
    </div>
  );
}
