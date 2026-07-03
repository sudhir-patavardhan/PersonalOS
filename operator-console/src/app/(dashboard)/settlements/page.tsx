'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { Settlement } from '@/lib/types';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';
import { basescanTx } from '@/lib/contracts';

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<{ totalSettlements: number; totalVolume: number; totalFees: number; totalYield: number } | null>(null);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setSettlements(d.settlements);
      setSummary(d.summary);
    });
  }, []);

  const dailyData = settlements.reduce<Record<string, { date: string; volume: number; fees: number; claims: number }>>((acc, s) => {
    const date = new Date(s.settledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = { date, volume: 0, fees: 0, claims: 0 };
    acc[date].volume += s.bidUsdc;
    acc[date].fees += s.feeUsdc;
    acc[date].claims += 1;
    return acc;
  }, {});
  const chartData = Object.values(dailyData).reverse();

  if (!summary) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Settlement Activity</h1>
        <p className="text-sm text-zinc-500 mt-1">On-chain settlements from BudgetEscrow.sol</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Settlements" value={String(summary.totalSettlements)} />
        <StatCard label="Total Volume" value={`$${summary.totalVolume.toFixed(2)}`} />
        <StatCard label="Soul Payouts" value={`$${summary.totalYield.toFixed(2)}`} />
        <StatCard label="Platform Revenue" value={`$${summary.totalFees.toFixed(2)}`} />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Daily Settlement Volume</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
            <Bar dataKey="volume" fill="#6366f1" radius={[4, 4, 0, 0]} name="Volume (USDC)" />
            <Bar dataKey="fees" fill="#a5b4fc" radius={[4, 4, 0, 0]} name="Platform Fee" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">All Settlements ({settlements.length})</h2>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white">
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-200">
                <th className="pb-2 font-medium">Timestamp</th>
                <th className="pb-2 font-medium">Brand</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Soul Wallet</th>
                <th className="pb-2 font-medium text-right">Bid</th>
                <th className="pb-2 font-medium text-right">Soul Yield</th>
                <th className="pb-2 font-medium text-right">Platform Fee</th>
                <th className="pb-2 font-medium">Tx Hash</th>
              </tr>
            </thead>
            <tbody>
              {settlements.map(s => (
                <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="py-2 text-zinc-600 text-xs">{new Date(s.settledAt).toLocaleString()}</td>
                  <td className="py-2 font-medium">{s.brandName}</td>
                  <td className="py-2 text-zinc-600">{CATEGORY_DISPLAY_NAMES[s.category] || s.category}</td>
                  <td className="py-2 font-mono text-xs text-zinc-500">{s.soulWalletDisplay}</td>
                  <td className="py-2 text-right">${s.bidUsdc.toFixed(2)}</td>
                  <td className="py-2 text-right text-green-700">${s.yieldUsdc.toFixed(2)}</td>
                  <td className="py-2 text-right text-indigo-700">${s.feeUsdc.toFixed(2)}</td>
                  <td className="py-2">
                    {(s as any).onChain ? (
                      <a href={basescanTx(s.txHash)} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 font-mono text-xs text-indigo-600 hover:text-indigo-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                        {s.txHash.slice(0, 10)}...
                      </a>
                    ) : (
                      <span className="font-mono text-xs text-zinc-400 cursor-help" title={`Synthetic — ${s.txHash}`}>
                        {s.txHash.slice(0, 10)}...
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500 font-medium">{label}</p>
      <p className="text-xl font-semibold text-zinc-900 mt-1">{value}</p>
    </div>
  );
}
