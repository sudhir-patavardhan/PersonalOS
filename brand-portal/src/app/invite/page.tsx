'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import QRCode from 'qrcode';

type Step = 'loading' | 'credentials' | 'totp-scan' | 'totp-verify' | 'done' | 'error';

export default function InvitePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';
  const [step, setStep] = useState<Step>('loading');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) { setStep('error'); setError('No invite token'); return; }
    setStep('credentials');
  }, [token]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Min 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password, step: 'credentials' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setTotpSecret(data.totpSecret);
      const url = await QRCode.toDataURL(data.otpauthUrl, { width: 256 });
      setQrDataUrl(url);
      setStep('totp-scan');
    } catch { setError('Connection error'); } finally { setLoading(false); }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/invite', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, totpCode, step: 'verify' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setStep('done');
    } catch { setError('Connection error'); } finally { setLoading(false); }
  }

  if (step === 'loading') return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500">Loading...</p></div>;
  if (step === 'error') return <div className="min-h-screen flex items-center justify-center"><p className="text-red-600">{error || 'Invalid invite link'}</p></div>;
  if (step === 'done') return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-lg font-semibold text-zinc-900">Account created!</p>
        <p className="text-sm text-zinc-500 mt-2">You can now sign in with your credentials.</p>
        <button onClick={() => router.push('/login')} className="mt-4 w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">Go to Login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">Join Brand Portal</h1>
          <p className="text-sm text-zinc-500 mt-1">You&apos;ve been invited to join a brand team</p>
        </div>

        {step === 'credentials' && (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Confirm Password</label>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Creating...' : 'Continue to TOTP Setup'}
            </button>
          </form>
        )}

        {step === 'totp-scan' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">Scan this QR code with your authenticator app:</p>
            <div className="flex justify-center">{qrDataUrl && <img src={qrDataUrl} alt="TOTP QR" className="w-48 h-48" />}</div>
            <div className="bg-zinc-50 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-1">Manual entry key:</p>
              <p className="font-mono text-sm text-zinc-800 break-all select-all">{totpSecret}</p>
            </div>
            <button onClick={() => setStep('totp-verify')} className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">I&apos;ve scanned the code</button>
          </div>
        )}

        {step === 'totp-verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-zinc-600">Enter the 6-digit code:</p>
            <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)} required
              placeholder="000000" maxLength={6} pattern="[0-9]{6}" inputMode="numeric" autoFocus
              className="w-full px-3 py-3 border border-zinc-300 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify & Complete'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
