'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import type { BrandSettlement, Listing, ReputationTrend } from '@/lib/types';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';

export default function PerformancePage() {
  const [settlements, setSettlements] = useState<BrandSettlement[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [reputationTrend, setReputationTrend] = useState<ReputationTrend[]>([]);
  const [summary, setSummary] = useState<{ totalClaims: number; totalSpend: number; budgetRemaining: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setSettlements(d.settlements || []);
      setListings(d.listings || []);
      setReputationTrend(d.reputationTrend || []);
      setSummary(d.summary);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  const dailyData: Record<string, { date: string; claims: number; spend: number }> = {};
  for (const s of settlements) {
    const date = new Date(s.settledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    if (!dailyData[date]) dailyData[date] = { date, claims: 0, spend: 0 };
    dailyData[date].claims++;
    dailyData[date].spend += s.bidUsdc;
  }
  const claimsTimeline = Object.values(dailyData).reverse();

  const catBreakdown: Record<string, { category: string; claims: number; spend: number }> = {};
  for (const s of settlements) {
    if (!catBreakdown[s.category]) catBreakdown[s.category] = { category: CATEGORY_DISPLAY_NAMES[s.category] || s.category, claims: 0, spend: 0 };
    catBreakdown[s.category].claims++;
    catBreakdown[s.category].spend += s.bidUsdc;
  }
  const categoryData = Object.values(catBreakdown).sort((a, b) => b.claims - a.claims);

  const avgCost = summary && summary.totalClaims > 0 ? summary.totalSpend / summary.totalClaims : 0;

  const trendData = reputationTrend.map(t => ({
    date: new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: t.score,
  }));
  const lastTrend = reputationTrend.length > 1 ? reputationTrend[reputationTrend.length - 1].score - reputationTrend[reputationTrend.length - 2].score : 0;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Campaign Performance</h1>
        <p className="text-sm text-zinc-500 mt-1">Aggregate analytics across all listings</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Claims" value={String(summary?.totalClaims || 0)} />
        <StatCard label="Total Spend" value={`$${(summary?.totalSpend || 0).toFixed(2)}`} />
        <StatCard label="Avg Cost/Claim" value={`$${avgCost.toFixed(2)}`} />
        <StatCard label="Budget Remaining" value={`$${(summary?.budgetRemaining || 0).toLocaleString()}`} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Claims Timeline</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={claimsTimeline}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="claims" fill="#10b981" radius={[4, 4, 0, 0]} name="Claims" />
              <Bar dataKey="spend" fill="#a7f3d0" radius={[4, 4, 0, 0]} name="Spend ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Category Breakdown</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} width={100} />
              <Tooltip />
              <Bar dataKey="claims" fill="#10b981" name="Claims" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-zinc-900">Reputation Trend</h2>
            <div className="flex items-center gap-1">
              <span className={`text-xs font-medium ${lastTrend > 0 ? 'text-green-600' : lastTrend < 0 ? 'text-red-600' : 'text-zinc-500'}`}>
                {lastTrend > 0 ? 'Improving' : lastTrend < 0 ? 'Declining' : 'Stable'}
              </span>
              <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">Simulated</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} dot={false} name="Reputation" />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-zinc-400 mt-2">Simulated trend &middot; Live data requires voucher integration</p>
        </div>

        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Cost per Claim by Category</h2>
          <div className="space-y-3">
            {categoryData.map(cat => (
              <div key={cat.category} className="flex items-center justify-between">
                <span className="text-sm text-zinc-700">{cat.category}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium">${(cat.spend / cat.claims).toFixed(2)}</span>
                  <span className="text-xs text-zinc-400">{cat.claims} claims</span>
                </div>
              </div>
            ))}
          </div>
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
