'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import type { CategorySupply } from '@/lib/types';

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const category = decodeURIComponent(id);
  const [supply, setSupply] = useState<CategorySupply | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      const found = (d.categorySupply as CategorySupply[]).find(c => c.category === category);
      setSupply(found || null);
      setLoading(false);
    });
  }, [category]);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;
  if (!supply) return <div className="p-6"><p className="text-red-600">Category not found</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/marketplace" className="hover:text-zinc-700">Marketplace</Link>
        <span>/</span>
        <span className="text-zinc-900">{supply.displayName}</span>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">{supply.displayName}</h1>
        <p className="text-sm text-zinc-500 mt-1 font-mono">{supply.category}</p>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Consenting Souls" value={`~${supply.consentingSouls}`} sub="±10% noise" />
        <StatCard label="Competitors" value={supply.competitorCount !== null ? String(supply.competitorCount) : 'Few'} sub={supply.competitorCount === null ? '< 3 brands' : ''} />
        <StatCard label="Median Yield Floor" value={supply.medianYieldFloor !== null ? `$${supply.medianYieldFloor.toFixed(2)}` : 'N/A'} />
        <StatCard label="Daily Claims" value={supply.claimVelocity.toFixed(1)} sub="avg over 7 days" />
      </div>

      {supply.suggestedBidRange && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Pricing Guidance</h2>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative h-8 bg-zinc-100 rounded-lg">
                <div className="absolute left-0 top-0 h-full bg-emerald-100 rounded-lg" style={{ width: '70%' }} />
                <div className="absolute top-1/2 -translate-y-1/2 left-[20%] w-3 h-3 bg-zinc-400 rounded-full" title="Floor" />
                <div className="absolute top-1/2 -translate-y-1/2 left-[60%] w-3 h-3 bg-emerald-600 rounded-full" title="Competitive" />
              </div>
              <div className="flex justify-between text-xs text-zinc-400 mt-1">
                <span>$0</span>
                <span>Floor: ${supply.suggestedBidRange.floor.toFixed(2)}</span>
                <span>Competitive: ${supply.suggestedBidRange.competitive.toFixed(2)}</span>
                <span>${(supply.suggestedBidRange.competitive * 1.5).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-3">Based on current bid activity in this category. Exact competitor bids are not disclosed.</p>
        </div>
      )}

      {supply.scoreDistribution.length > 0 && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-3">Score Distribution</h2>
          <div className="grid grid-cols-4 gap-3">
            {supply.scoreDistribution.map(band => (
              <div key={band.band} className="text-center">
                <div className="bg-emerald-50 rounded-lg py-4">
                  <p className="text-2xl font-semibold text-emerald-700">{band.percentage}%</p>
                </div>
                <p className="text-xs text-zinc-500 mt-1">Score {band.band}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-zinc-400 mt-3">Distribution of consenting Souls by Insight score band. Individual scores are never disclosed.</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Create a Listing in {supply.displayName}</h2>
        <p className="text-sm text-zinc-500 mb-4">Ready to target this category? Create a listing with your bid and creative.</p>
        <Link href="/listings/create" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          + Create Listing
        </Link>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-4">
      <p className="text-xs text-zinc-500 font-medium">{label}</p>
      <p className="text-xl font-semibold text-zinc-900 mt-1">{value}</p>
      {sub && <p className="text-[10px] text-zinc-400 mt-0.5">{sub}</p>}
    </div>
  );
}
