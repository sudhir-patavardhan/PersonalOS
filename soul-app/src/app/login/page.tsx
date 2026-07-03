'use client';
import { useState, useEffect } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/setup').then(r => r.json()).then(d => {
      if (d.needsSetup) window.location.href = '/setup';
      else setChecking(false);
    });
  }, []);

  async function handleLogin() {
    setLoading(true);
    setError('');
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, token }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    window.location.href = '/home';
  }

  if (checking) return <div className="min-h-full flex items-center justify-center"><p className="text-zinc-500">Loading...</p></div>;

  return (
    <div className="min-h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold gradient-text">PersonalOS</h1>
          <p className="text-zinc-400 text-sm mt-2">Welcome back</p>
        </div>

        <div className="glass-card p-6 gradient-glow space-y-4">
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
          <div>
            <label className="block text-xs text-zinc-400 mb-1">TOTP Code</label>
            <input type="text" value={token} onChange={e => setToken(e.target.value)} maxLength={6} placeholder="000000"
              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-center text-xl tracking-widest text-white font-mono focus:outline-none focus:border-violet-500" />
          </div>
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button onClick={handleLogin} disabled={loading || !email || !password || token.length !== 6}
            className="w-full py-2.5 gradient-btn text-white rounded-lg text-sm font-medium disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">Synthetic data mode</p>
      </div>
    </div>
  );
}
