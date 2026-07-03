'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

const DEMO_BRANDS = [
  { brandId: 'brand_1', name: 'Whole Foods Market' },
  { brandId: 'brand_3', name: 'Chase Sapphire' },
  { brandId: 'brand_7', name: 'REI' },
];

type Step = 'brand-select' | 'credentials' | 'totp-scan' | 'totp-verify';

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('brand-select');
  const [selectedBrand, setSelectedBrand] = useState(DEMO_BRANDS[0]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [totpSecret, setTotpSecret] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/check-setup')
      .then(r => r.json())
      .then(data => {
        if (!data.needsSetup) router.replace('/login');
        else setChecking(false);
      });
  }, [router]);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, brandId: selectedBrand.brandId }),
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
      const res = await fetch('/api/auth/setup', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, totpCode }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      router.push('/dashboard');
    } catch { setError('Connection error'); } finally { setLoading(false); }
  }

  if (checking) return <div className="min-h-screen flex items-center justify-center"><p className="text-zinc-500">Loading...</p></div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-zinc-900">PersonalOS Brand Portal</h1>
          <p className="text-sm text-zinc-500 mt-1">First-time setup &mdash; create your brand admin account</p>
        </div>

        {step === 'brand-select' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">Select your brand to get started:</p>
            <div className="space-y-2">
              {DEMO_BRANDS.map(brand => (
                <button key={brand.brandId} onClick={() => setSelectedBrand(brand)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-colors ${selectedBrand.brandId === brand.brandId ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : 'border-zinc-200 hover:border-zinc-300'}`}>
                  <p className="font-medium">{brand.name}</p>
                </button>
              ))}
            </div>
            <button onClick={() => setStep('credentials')}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              Continue as {selectedBrand.name}
            </button>
            <p className="text-xs text-zinc-400 text-center">Other demo brands will be auto-created with default credentials</p>
          </div>
        )}

        {step === 'credentials' && (
          <form onSubmit={handleCredentials} className="space-y-4">
            <div className="bg-emerald-50 rounded-lg px-3 py-2 mb-2">
              <p className="text-xs text-emerald-700 font-medium">Setting up: {selectedBrand.name}</p>
            </div>
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
              {loading ? 'Creating account...' : 'Continue to TOTP Setup'}
            </button>
            <button type="button" onClick={() => setStep('brand-select')} className="w-full py-2 text-zinc-500 text-sm hover:text-zinc-700">Back to brand selection</button>
          </form>
        )}

        {step === 'totp-scan' && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">Scan this QR code with your authenticator app:</p>
            <div className="flex justify-center">
              {qrDataUrl && <img src={qrDataUrl} alt="TOTP QR Code" className="w-48 h-48" />}
            </div>
            <div className="bg-zinc-50 rounded-lg p-3">
              <p className="text-xs text-zinc-500 mb-1">Manual entry key:</p>
              <p className="font-mono text-sm text-zinc-800 break-all select-all">{totpSecret}</p>
            </div>
            <button onClick={() => setStep('totp-verify')}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
              I&apos;ve scanned the code
            </button>
          </div>
        )}

        {step === 'totp-verify' && (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-zinc-600">Enter the 6-digit code from your authenticator app:</p>
            <input type="text" value={totpCode} onChange={e => setTotpCode(e.target.value)} required
              placeholder="000000" maxLength={6} pattern="[0-9]{6}" inputMode="numeric" autoFocus
              className="w-full px-3 py-3 border border-zinc-300 rounded-lg text-center text-2xl font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50">
              {loading ? 'Verifying...' : 'Verify & Sign In'}
            </button>
            <button type="button" onClick={() => { setStep('totp-scan'); setError(''); }}
              className="w-full py-2 text-zinc-500 text-sm hover:text-zinc-700">Back to QR code</button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-zinc-100">
          <div className="flex items-start gap-2">
            <span className="text-emerald-500 text-sm mt-0.5">&#9679;</span>
            <p className="text-xs text-zinc-400">Brands see only their own data. Individual Soul data never leaves the device.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
