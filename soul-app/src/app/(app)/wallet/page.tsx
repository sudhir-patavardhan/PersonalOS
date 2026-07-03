'use client';
import { useEffect, useState, useRef } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { WalletTransaction, DailyEarning, SoulProfile } from '@/lib/types';

function AnimatedBalance({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number>(0);

  useEffect(() => {
    const start = ref.current;
    const diff = target - start;
    const duration = 1200;
    const startTime = Date.now();

    function tick() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      setDisplay(current);
      ref.current = current;
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target]);

  return <span>${display.toFixed(2)}</span>;
}

export default function WalletPage() {
  const [profile, setProfile] = useState<SoulProfile | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [earnings, setEarnings] = useState<DailyEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setBalance(d.walletBalance || 0);
      setTransactions(d.walletTransactions || []);
      setEarnings(d.dailyEarnings || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-500">Loading...</p></div>;

  const chartData = earnings.slice(-30).map(e => ({
    date: new Date(e.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    amount: e.amount,
  }));

  return (
    <div className="p-5 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Wallet</h1>
        <p className="text-sm text-zinc-400 mt-1">Your earnings and transactions</p>
      </div>

      {/* Balance card */}
      <div className="glass-card p-6 gradient-glow animate-pulse-glow animate-fade-in-up">
        <p className="text-xs text-zinc-400 uppercase tracking-wider">Total Balance</p>
        <p className="text-4xl font-bold text-white mt-2 animate-count-up"><AnimatedBalance target={balance} /></p>
        <p className="text-sm text-zinc-500 mt-1">≈ ${balance.toFixed(2)} USD</p>
        <div className="flex gap-3 mt-4">
          <button className="flex-1 py-2.5 gradient-btn text-white rounded-xl text-sm font-medium">Simulate Withdrawal</button>
          <button className="flex-1 py-2.5 bg-white/5 text-zinc-300 rounded-xl text-sm hover:bg-white/10 transition-colors">Simulate Transfer</button>
        </div>
        <div className="flex gap-3 mt-2">
          <div className="flex-1 py-2 bg-white/3 rounded-lg text-center">
            <p className="text-[10px] text-zinc-500">Coinbase Pay</p>
            <p className="text-[9px] text-zinc-600">Coming Soon</p>
          </div>
          <div className="flex-1 py-2 bg-white/3 rounded-lg text-center">
            <p className="text-[10px] text-zinc-500">External Transfer</p>
            <p className="text-[9px] text-zinc-600">Coming Soon</p>
          </div>
        </div>
      </div>

      {/* Wallet address */}
      {profile && (
        <div className="glass-card p-4 animate-fade-in-up" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Wallet Address</p>
              <p className="text-xs text-zinc-300 font-mono mt-1">{profile.walletAddress.slice(0, 10)}...{profile.walletAddress.slice(-8)}</p>
            </div>
            <button onClick={() => navigator.clipboard?.writeText(profile.walletAddress)}
              className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg transition-colors">Copy</button>
          </div>
          <p className="text-[9px] text-zinc-600 mt-2">Non-custodial · Only you control this wallet</p>
        </div>
      )}

      {/* Earnings chart */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
        <h2 className="text-sm font-semibold text-white mb-4">30-Day Earnings</h2>
        <div className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="earnGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 10, fill: '#71717a' }} axisLine={false} tickLine={false} width={30} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: 'rgba(20,20,35,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12, color: '#fff' }}
                formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Earned']} />
              <Area type="monotone" dataKey="amount" stroke="#8b5cf6" fill="url(#earnGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions */}
      <div className="glass-card p-5 animate-fade-in-up" style={{ animationDelay: '0.2s', opacity: 0 }}>
        <h2 className="text-sm font-semibold text-white mb-4">Recent Transactions ({transactions.length})</h2>
        <div className="space-y-3">
          {transactions.map(tx => (
            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${tx.type === 'claim' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                  {tx.type === 'claim' ? '↓' : '↑'}
                </div>
                <div>
                  <p className="text-sm text-white">{tx.brandName || 'Transfer'}</p>
                  <p className="text-[10px] text-zinc-500">{tx.category ? `${tx.category} · ` : ''}{new Date(tx.timestamp).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-medium ${tx.type === 'claim' ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.type === 'claim' ? '+' : '-'}${tx.amountUsdc.toFixed(2)}
                </p>
                <p className="text-[9px] text-zinc-600 font-mono">{tx.txHash.slice(0, 10)}...</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
