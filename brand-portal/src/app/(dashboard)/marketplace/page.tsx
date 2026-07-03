'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CategorySupply } from '@/lib/types';

export default function MarketplacePage() {
  const [supply, setSupply] = useState<CategorySupply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setSupply(d.categorySupply || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  const tradeable = supply.filter(s => s.isAvailable);
  const unavailable = supply.filter(s => !s.isAvailable);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Category Marketplace</h1>
        <p className="text-sm text-zinc-500 mt-1">Browse available supply to inform campaign strategy &middot; Counts noised ±10%</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {tradeable.map(cat => (
          <Link key={cat.category} href={`/marketplace/${encodeURIComponent(cat.category)}`}
            className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
            <h3 className="font-medium text-zinc-900">{cat.displayName}</h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">{cat.category}</p>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Consenting Souls</span>
                <span className="font-medium">~{cat.consentingSouls}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Competitors</span>
                <span className="font-medium">{cat.competitorCount !== null ? cat.competitorCount : 'Few'}</span>
              </div>
              {cat.medianYieldFloor !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Median Floor</span>
                  <span className="font-medium">${cat.medianYieldFloor.toFixed(2)}</span>
                </div>
              )}
              {cat.suggestedBidRange && (
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Suggested Bid</span>
                  <span className="font-medium text-emerald-700">${cat.suggestedBidRange.floor.toFixed(2)} – ${cat.suggestedBidRange.competitive.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Daily Claims</span>
                <span className="font-medium">{cat.claimVelocity.toFixed(1)}</span>
              </div>
            </div>

            {cat.scoreDistribution.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-100">
                <p className="text-[10px] text-zinc-400 mb-1.5">Score Distribution</p>
                <div className="flex gap-1">
                  {cat.scoreDistribution.map(band => (
                    <div key={band.band} className="flex-1 text-center">
                      <div className="bg-emerald-100 rounded" style={{ height: `${Math.max(4, band.percentage * 0.4)}px` }} />
                      <p className="text-[9px] text-zinc-400 mt-0.5">{band.band}</p>
                      <p className="text-[9px] font-medium">{band.percentage}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Link>
        ))}

        {unavailable.map(cat => (
          <div key={cat.category} className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 opacity-60">
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-zinc-500">{cat.displayName}</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-700">Not Available</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">{cat.category}</p>
            <p className="text-xs text-zinc-400 mt-3">Architecturally excluded per ADR-15. Health data generates Insights for the Soul but is never marketplace-eligible.</p>
          </div>
        ))}
      </div>
    </div>
  );
}
