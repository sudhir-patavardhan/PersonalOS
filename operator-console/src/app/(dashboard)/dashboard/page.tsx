'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { DashboardKPI, Settlement } from '@/lib/types';

interface DashboardData {
  kpis: DashboardKPI[];
  settlements: Settlement[];
  summary: { totalSettlements: number; totalVolume: number; totalFees: number; totalYield: number };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);

  if (!data) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading marketplace data...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Marketplace Overview</h1>
        <p className="text-sm text-zinc-500 mt-1">7-day synthetic data (days 15&ndash;21) &middot; {data.summary.totalSettlements} settlements</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {data.kpis.map(kpi => (
          <Link key={kpi.label} href={kpi.href}
            className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-md transition-shadow">
            <p className="text-xs text-zinc-500 font-medium">{kpi.label}</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-2xl font-semibold text-zinc-900">{kpi.value}</p>
              {kpi.trend !== 0 && (
                <span className={`text-xs font-medium ${kpi.trend > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {kpi.trend > 0 ? '+' : ''}{kpi.trend}%
                </span>
              )}
            </div>
            <div className="mt-2">
              <span className={`inline-block w-2 h-2 rounded-full ${kpi.health === 'green' ? 'bg-green-500' : kpi.health === 'amber' ? 'bg-amber-500' : 'bg-red-500'}`} />
              <span className="text-[10px] text-zinc-400 ml-1 capitalize">{kpi.health}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">
        <SummaryCard label="Total Volume" value={`$${data.summary.totalVolume.toFixed(2)}`} />
        <SummaryCard label="Soul Payouts (85%)" value={`$${data.summary.totalYield.toFixed(2)}`} />
        <SummaryCard label="Platform Revenue (15%)" value={`$${data.summary.totalFees.toFixed(2)}`} />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Recent Settlements</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100">
                <th className="pb-2 font-medium">Time</th>
                <th className="pb-2 font-medium">Brand</th>
                <th className="pb-2 font-medium">Category</th>
                <th className="pb-2 font-medium">Soul</th>
                <th className="pb-2 font-medium text-right">Bid</th>
                <th className="pb-2 font-medium text-right">Yield</th>
                <th className="pb-2 font-medium text-right">Fee</th>
                <th className="pb-2 font-medium">Tx</th>
              </tr>
            </thead>
            <tbody>
              {data.settlements.slice(0, 10).map(s => (
                <tr key={s.id} className="border-b border-zinc-50 hover:bg-zinc-50">
                  <td className="py-2 text-zinc-600">{new Date(s.settledAt).toLocaleDateString()} {new Date(s.settledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-2 font-medium">{s.brandName}</td>
                  <td className="py-2 text-zinc-600">{s.category}</td>
                  <td className="py-2 font-mono text-xs text-zinc-500">{s.soulWalletDisplay}</td>
                  <td className="py-2 text-right">${s.bidUsdc.toFixed(2)}</td>
                  <td className="py-2 text-right text-green-700">${s.yieldUsdc.toFixed(2)}</td>
                  <td className="py-2 text-right text-indigo-700">${s.feeUsdc.toFixed(2)}</td>
                  <td className="py-2 font-mono text-xs text-zinc-400" title={s.txHash}>{s.txHash.slice(0, 10)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link href="/settlements" className="text-indigo-600 text-sm font-medium mt-3 inline-block hover:underline">
          View all settlements &rarr;
        </Link>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500 font-medium">{label}</p>
      <p className="text-xl font-semibold text-zinc-900 mt-1">{value}</p>
    </div>
  );
}
