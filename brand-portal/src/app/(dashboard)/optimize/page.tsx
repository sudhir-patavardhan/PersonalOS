'use client';
import { useEffect, useState } from 'react';
import type { Listing, BrandSettlement } from '@/lib/types';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';

export default function OptimizePage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [settlements, setSettlements] = useState<BrandSettlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedA, setSelectedA] = useState('');
  const [selectedB, setSelectedB] = useState('');

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      const l = d.listings || [];
      setListings(l);
      setSettlements(d.settlements || []);
      if (l.length >= 2) { setSelectedA(l[0].id); setSelectedB(l[1].id); }
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  const activeListings = listings.filter(l => l.status === 'active');

  const thresholdBuckets = [50, 60, 70, 80, 90];

  function getListingStats(id: string) {
    const listing = listings.find(l => l.id === id);
    if (!listing) return null;
    const claims = settlements.filter(s => s.listingId === id);
    const spend = claims.reduce((s, c) => s + c.bidUsdc, 0);
    return { ...listing, claims: claims.length, spend, costPerClaim: claims.length > 0 ? spend / claims.length : 0 };
  }

  const compareA = getListingStats(selectedA);
  const compareB = getListingStats(selectedB);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Campaign Optimization</h1>
        <p className="text-sm text-zinc-500 mt-1">Tune bids, thresholds, and spending caps</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {activeListings.map(listing => {
          const claims = settlements.filter(s => s.listingId === listing.id).length;
          return (
            <div key={listing.id} className="bg-white rounded-xl border border-zinc-200 p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-medium text-zinc-900">{listing.headline || listing.category}</h3>
                  <p className="text-xs text-zinc-500">{CATEGORY_DISPLAY_NAMES[listing.category]} &middot; {claims} claims</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">active</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                    <span>Bid per Claim</span>
                    <span className="font-medium text-zinc-900">${listing.bidPerClaimUsdc.toFixed(2)}</span>
                  </label>
                  <input type="range" min="0.50" max="5.00" step="0.25" defaultValue={listing.bidPerClaimUsdc}
                    className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                  <div className="flex justify-between text-[10px] text-zinc-400"><span>$0.50</span><span>$5.00</span></div>
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                    <span>Min Score Threshold</span>
                    <span className="font-medium text-zinc-900">{listing.minScoreThreshold}+</span>
                  </label>
                  <div className="flex gap-1">
                    {thresholdBuckets.map(t => (
                      <button key={t} className={`flex-1 py-1.5 rounded text-xs font-medium ${t === listing.minScoreThreshold ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-50 text-zinc-500 hover:bg-zinc-100'}`}>
                        {t}+
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">Eligible pool validated k ≥ 50 &middot; counts noised ±15%</p>
                </div>

                <div>
                  <label className="flex items-center justify-between text-xs text-zinc-500 mb-1">
                    <span>Daily Spend Cap</span>
                    <span className="font-medium text-zinc-900">{listing.dailyCapUsdc ? `$${listing.dailyCapUsdc}` : 'No limit'}</span>
                  </label>
                  <input type="number" defaultValue="" placeholder="No limit"
                    className="w-full px-3 py-1.5 border border-zinc-200 rounded-lg text-sm" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">What-If Projection</h2>
        <div className="bg-zinc-50 rounded-lg p-4">
          <p className="text-sm text-zinc-600 mb-3">If I change bid to <span className="font-medium">$X</span> and threshold to <span className="font-medium">Y</span>, approximately how many Souls become eligible?</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Category</label>
              <select className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm">
                {[...new Set(listings.map(l => l.category))].map(cat => (
                  <option key={cat}>{CATEGORY_DISPLAY_NAMES[cat]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Bid ($)</label>
              <input type="number" defaultValue="2.00" min="0.50" step="0.25" className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Threshold</label>
              <select className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm">
                {thresholdBuckets.map(t => <option key={t} value={t}>{t}+</option>)}
              </select>
            </div>
          </div>
          <div className="mt-4 p-3 bg-emerald-50 rounded-lg">
            <p className="text-sm text-emerald-800">
              <span className="font-semibold">~85–115</span> eligible Souls (noised ±15%) at threshold 50 in this category
            </p>
            <p className="text-[10px] text-emerald-600 mt-1">Bucketed thresholds (steps of 10) &middot; Fresh noise per query</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-zinc-200 p-5">
        <h2 className="text-sm font-semibold text-zinc-900 mb-3">A/B Comparison</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <select value={selectedA} onChange={e => setSelectedA(e.target.value)}
            className="px-3 py-2 border border-zinc-300 rounded-lg text-sm">
            {listings.map(l => <option key={l.id} value={l.id}>{l.headline || CATEGORY_DISPLAY_NAMES[l.category]}</option>)}
          </select>
          <select value={selectedB} onChange={e => setSelectedB(e.target.value)}
            className="px-3 py-2 border border-zinc-300 rounded-lg text-sm">
            {listings.map(l => <option key={l.id} value={l.id}>{l.headline || CATEGORY_DISPLAY_NAMES[l.category]}</option>)}
          </select>
        </div>
        {compareA && compareB && (
          <div className="grid grid-cols-2 gap-4">
            <CompareCard listing={compareA} />
            <CompareCard listing={compareB} />
          </div>
        )}
      </div>
    </div>
  );
}

function CompareCard({ listing }: { listing: { headline?: string; category: string; bidPerClaimUsdc: number; minScoreThreshold: number; claims: number; spend: number; costPerClaim: number } }) {
  return (
    <div className="bg-zinc-50 rounded-lg p-4 space-y-2">
      <p className="font-medium text-sm text-zinc-900">{listing.headline || listing.category}</p>
      <p className="text-xs text-zinc-500">{CATEGORY_DISPLAY_NAMES[listing.category]}</p>
      <div className="grid grid-cols-2 gap-2 mt-2">
        <div><p className="text-[10px] text-zinc-400">Bid</p><p className="text-sm font-medium">${listing.bidPerClaimUsdc.toFixed(2)}</p></div>
        <div><p className="text-[10px] text-zinc-400">Threshold</p><p className="text-sm font-medium">{listing.minScoreThreshold}+</p></div>
        <div><p className="text-[10px] text-zinc-400">Claims</p><p className="text-sm font-medium">{listing.claims}</p></div>
        <div><p className="text-[10px] text-zinc-400">Cost/Claim</p><p className="text-sm font-medium">${listing.costPerClaim.toFixed(2)}</p></div>
        <div><p className="text-[10px] text-zinc-400">Total Spend</p><p className="text-sm font-medium">${listing.spend.toFixed(2)}</p></div>
      </div>
    </div>
  );
}
