'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import type { Brand, Settlement } from '@/lib/types';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';

export default function BrandDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setBrand(d.brands.find((b: Brand) => b.id === id) || null);
      setSettlements(d.settlements);
    });
  }, [id]);

  if (!brand) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  const brandSettlements = settlements.filter(s => s.brandName === brand.name);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/brands" className="hover:text-indigo-600">Brands</Link>
        <span>/</span>
        <span className="text-zinc-900">{brand.name}</span>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{brand.name}</h1>
          <p className="text-sm text-zinc-500">{brand.vertical} &middot; Verified {new Date(brand.verifiedAt).toLocaleDateString()}</p>
        </div>
        <span className={`text-sm px-3 py-1 rounded-full font-medium ${brand.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-zinc-100 text-zinc-600'}`}>
          {brand.status}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Claims" value={String(brandSettlements.length)} />
        <StatCard label="Total Spent" value={`$${brandSettlements.reduce((s, t) => s + t.bidUsdc, 0).toFixed(2)}`} />
        <StatCard label="Avg Bid" value={`$${brandSettlements.length > 0 ? (brandSettlements.reduce((s, t) => s + t.bidUsdc, 0) / brandSettlements.length).toFixed(2) : '0.00'}`} />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Listings ({brand.listings.length})</h2>
        <div className="space-y-3">
          {brand.listings.map(listing => {
            const listingSettlements = brandSettlements.filter(s => s.listingId === listing.id);
            const pct = listing.escrowFundedUsdc > 0 ? ((listing.escrowFundedUsdc - listing.escrowRemainingUsdc) / listing.escrowFundedUsdc * 100) : 0;
            return (
              <div key={listing.id} className="border border-zinc-100 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-medium text-sm">{CATEGORY_DISPLAY_NAMES[listing.category] || listing.category}</span>
                    <span className="text-xs text-zinc-500 ml-2">Bid: ${listing.bidPerClaimUsdc.toFixed(2)} &middot; Min Score: {listing.minScoreThreshold}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${listing.status === 'active' ? 'bg-green-50 text-green-700' : listing.status === 'depleted' ? 'bg-red-50 text-red-700' : 'bg-zinc-100 text-zinc-600'}`}>
                    {listing.status}
                  </span>
                </div>
                <div className="flex gap-6 text-xs text-zinc-600">
                  <span>Claims: {listingSettlements.length}</span>
                  <span>Escrow: ${listing.escrowRemainingUsdc.toFixed(2)} / ${listing.escrowFundedUsdc.toLocaleString()}</span>
                </div>
                <div className="w-full bg-zinc-100 rounded-full h-1 mt-2">
                  <div className={`h-1 rounded-full ${listing.status === 'depleted' ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-4">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Settlement History ({brandSettlements.length})</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-zinc-500 border-b border-zinc-100">
              <th className="pb-2 font-medium">Time</th>
              <th className="pb-2 font-medium">Category</th>
              <th className="pb-2 font-medium">Soul</th>
              <th className="pb-2 font-medium text-right">Bid</th>
              <th className="pb-2 font-medium text-right">Yield</th>
              <th className="pb-2 font-medium text-right">Fee</th>
            </tr>
          </thead>
          <tbody>
            {brandSettlements.slice(0, 20).map(s => (
              <tr key={s.id} className="border-b border-zinc-50">
                <td className="py-2 text-xs text-zinc-600">{new Date(s.settledAt).toLocaleString()}</td>
                <td className="py-2 text-zinc-600">{CATEGORY_DISPLAY_NAMES[s.category] || s.category}</td>
                <td className="py-2 font-mono text-xs text-zinc-500">{s.soulWalletDisplay}</td>
                <td className="py-2 text-right">${s.bidUsdc.toFixed(2)}</td>
                <td className="py-2 text-right text-green-700">${s.yieldUsdc.toFixed(2)}</td>
                <td className="py-2 text-right text-indigo-700">${s.feeUsdc.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
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
