'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { CategoryMetrics } from '@/lib/types';

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryMetrics[]>([]);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => setCategories(d.categories));
  }, []);

  if (categories.length === 0) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Category Intelligence</h1>
        <p className="text-sm text-zinc-500 mt-1">Supply, demand, and pricing dynamics across 12 Insight categories</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {categories.map(cat => (
          <CategoryCard key={cat.category} cat={cat} />
        ))}
      </div>
    </div>
  );
}

function CategoryCard({ cat }: { cat: CategoryMetrics }) {
  if (cat.isPrivate) {
    return (
      <div className="bg-white rounded-xl border border-zinc-200 p-4 opacity-60">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-base">&#128274;</span>
          <h3 className="font-semibold text-zinc-900 text-sm">{cat.displayName}</h3>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 mt-2">
          <p className="text-xs text-amber-800 font-medium">Private &mdash; Not Tradeable</p>
          <p className="text-[10px] text-amber-600 mt-1">Architecturally excluded from the marketplace per ADR-15. Health data contributes to Depth Score but is never available for Brand matching.</p>
        </div>
      </div>
    );
  }

  const healthColor = cat.velocity.claimsPerDay >= 2 ? 'bg-green-500' : cat.velocity.claimsPerDay >= 0.5 ? 'bg-amber-500' : 'bg-red-500';

  return (
    <Link href={`/categories/${encodeURIComponent(cat.category)}`}
      className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-zinc-900 text-sm">{cat.displayName}</h3>
        <span className={`w-2 h-2 rounded-full ${healthColor}`} />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
        <div>
          <p className="text-zinc-400">Supply</p>
          <p className="text-zinc-900 font-medium">{cat.supply.consentingSouls} souls</p>
        </div>
        <div>
          <p className="text-zinc-400">Demand</p>
          <p className="text-zinc-900 font-medium">{cat.demand.activeListings} listings</p>
        </div>
        <div>
          <p className="text-zinc-400">Avg Bid</p>
          <p className="text-zinc-900 font-medium">{cat.demand.avgBid ? `$${cat.demand.avgBid.toFixed(2)}` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-zinc-400">Med. Floor</p>
          <p className="text-zinc-900 font-medium">{cat.pricing.medianYieldFloor ? `$${cat.pricing.medianYieldFloor.toFixed(2)}` : 'N/A'}</p>
        </div>
        <div>
          <p className="text-zinc-400">Claims/Day</p>
          <p className="text-zinc-900 font-medium">{cat.velocity.claimsPerDay.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-zinc-400">Escrow</p>
          <p className="text-zinc-900 font-medium">${(cat.demand.totalEscrow / 1000).toFixed(1)}K</p>
        </div>
      </div>
    </Link>
  );
}
