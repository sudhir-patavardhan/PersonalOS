'use client';
import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import type { Listing, BrandSettlement } from '@/lib/types';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [listing, setListing] = useState<Listing | null>(null);
  const [settlements, setSettlements] = useState<BrandSettlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      const found = (d.listings as Listing[]).find(l => l.id === id);
      setListing(found || null);
      setSettlements((d.settlements as BrandSettlement[]).filter(s => s.listingId === id));
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;
  if (!listing) return <div className="p-6"><p className="text-red-600">Listing not found</p></div>;

  const totalSpend = settlements.reduce((s, t) => s + t.bidUsdc, 0);
  const utilizationPct = Math.round(((listing.escrowFundedUsdc - listing.escrowRemainingUsdc) / listing.escrowFundedUsdc) * 100);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-2 text-sm text-zinc-500">
        <Link href="/listings" className="hover:text-zinc-700">Listings</Link>
        <span>/</span>
        <span className="text-zinc-900">{listing.headline || listing.id}</span>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{listing.headline || listing.category}</h1>
          <p className="text-sm text-zinc-500 mt-1">{CATEGORY_DISPLAY_NAMES[listing.category]} &middot; Created {new Date(listing.createdAt).toLocaleDateString()}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${listing.status === 'active' ? 'bg-green-100 text-green-800' : listing.status === 'exhausted' ? 'bg-red-100 text-red-800' : 'bg-zinc-100 text-zinc-600'}`}>
          {listing.status}
        </span>
      </div>

      {listing.body && (
        <div className="bg-white rounded-xl border border-zinc-200 p-5">
          <h2 className="text-sm font-semibold text-zinc-900 mb-2">Creative</h2>
          <p className="text-sm text-zinc-700">{listing.body}</p>
          {listing.ctaUrl && (
            <div className="mt-3 flex items-center gap-2">
              <span className="px-3 py-1 bg-emerald-600 text-white rounded text-xs font-medium">{listing.ctaLabel || 'Learn More'}</span>
              <span className="text-xs text-zinc-400">{listing.ctaUrl}</span>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Bid per Claim" value={`$${listing.bidPerClaimUsdc.toFixed(2)}`} />
        <StatCard label="Min Threshold" value={`${listing.minScoreThreshold}+`} />
        <StatCard label="Total Claims" value={String(settlements.length)} />
        <StatCard label="Total Spend" value={`$${totalSpend.toFixed(2)}`} />
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-2">Escrow</h2>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="w-full bg-zinc-100 rounded-full h-3">
              <div className="bg-emerald-500 h-3 rounded-full" style={{ width: `${utilizationPct}%` }} />
            </div>
          </div>
          <p className="text-sm text-zinc-600">${listing.escrowRemainingUsdc.toLocaleString()} / ${listing.escrowFundedUsdc.toLocaleString()} remaining</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">Claim History ({settlements.length})</h2>
        {settlements.length === 0 ? <p className="text-sm text-zinc-400">No claims yet</p> : (
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white">
                <tr className="text-left text-xs text-zinc-500 border-b border-zinc-200">
                  <th className="pb-2 font-medium">Timestamp</th>
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
                    <td className="py-2 text-right">${s.bidUsdc.toFixed(2)}</td>
                    <td className="py-2 text-right text-green-700">${s.yieldUsdc.toFixed(2)}</td>
                    <td className="py-2 text-right text-zinc-500">${s.feeUsdc.toFixed(2)}</td>
                    <td className="py-2 font-mono text-xs text-zinc-400" title={s.txHash}>{s.txHash.slice(0, 10)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
