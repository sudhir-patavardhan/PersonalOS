'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import type { CategoryMetrics, Settlement, Brand } from '@/lib/types';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const category = decodeURIComponent(id);
  const [metrics, setMetrics] = useState<CategoryMetrics | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setMetrics(d.categories.find((c: CategoryMetrics) => c.category === category) || null);
      setSettlements(d.settlements.filter((s: Settlement) => s.category === category));
      setBrands(d.brands.filter((b: Brand) => b.listings.some((l: { category: string }) => l.category === category)));
    });
  }, [category]);

  if (!metrics) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  const dailyData = settlements.reduce<Record<string, { date: string; claims: number; volume: number }>>((acc, s) => {
    const date = new Date(s.settledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = { date, claims: 0, volume: 0 };
    acc[date].claims += 1;
    acc[date].volume += s.bidUsdc;
    return acc;
  }, {});
  const chartData = Object.values(dailyData).reverse();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/categories" className="hover:text-indigo-600">Categories</Link>
        <span>/</span>
        <span className="text-zinc-900">{CATEGORY_DISPLAY_NAMES[category] || category}</span>
      </div>

      <h1 className="text-2xl font-semibold text-zinc-900">{CATEGORY_DISPLAY_NAMES[category] || category}</h1>

      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Consenting Souls" value={String(metrics.supply.consentingSouls)} />
        <MetricCard label="Active Listings" value={String(metrics.demand.activeListings)} />
        <MetricCard label="Claims/Day" value={metrics.velocity.claimsPerDay.toFixed(1)} />
        <MetricCard label="Total Escrow" value={`$${(metrics.demand.totalEscrow / 1000).toFixed(1)}K`} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Supply</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Consenting Souls</span><span>{metrics.supply.consentingSouls}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Avg Noisy Score</span><span>{metrics.supply.avgNoisyScore?.toFixed(0) || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Median Yield Floor</span><span>{metrics.pricing.medianYieldFloor ? `$${metrics.pricing.medianYieldFloor.toFixed(2)}` : 'N/A'}</span></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Demand</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-zinc-500">Active Listings</span><span>{metrics.demand.activeListings}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Avg Bid</span><span>{metrics.demand.avgBid ? `$${metrics.demand.avgBid.toFixed(2)}` : 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Avg Score Threshold</span><span>{metrics.demand.avgThreshold?.toFixed(0) || 'N/A'}</span></div>
            <div className="flex justify-between"><span className="text-zinc-500">Bid/Floor Spread</span><span>{metrics.pricing.bidFloorSpread ? `$${metrics.pricing.bidFloorSpread.toFixed(2)}` : 'N/A'}</span></div>
          </div>
        </div>
      </div>

      {chartData.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Daily Claims</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="claims" fill="#6366f1" radius={[4, 4, 0, 0]} name="Claims" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Competing Brands ({brands.length})</h2>
        <div className="space-y-2">
          {brands.map(b => {
            const listing = b.listings.find(l => l.category === category);
            if (!listing) return null;
            return (
              <Link key={b.id} href={`/brands/${b.id}`} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50">
                <div>
                  <span className="font-medium text-sm">{b.name}</span>
                  <span className="text-xs text-zinc-500 ml-2">{b.vertical}</span>
                </div>
                <div className="text-xs text-zinc-600">
                  Bid: ${listing.bidPerClaimUsdc.toFixed(2)} &middot; Min: {listing.minScoreThreshold} &middot;
                  <span className={`ml-1 ${listing.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>{listing.status}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500 font-medium">{label}</p>
      <p className="text-xl font-semibold text-zinc-900 mt-1">{value}</p>
    </div>
  );
}
