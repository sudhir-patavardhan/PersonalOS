'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Listing } from '@/lib/types';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  paused: 'bg-amber-100 text-amber-800',
  exhausted: 'bg-red-100 text-red-800',
  draft: 'bg-zinc-100 text-zinc-600',
  pending_review: 'bg-blue-100 text-blue-800',
  expired: 'bg-zinc-100 text-zinc-500',
};

export default function ListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setListings(d.listings || []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-400">Loading...</p></div>;

  const active = listings.filter(l => l.status === 'active');
  const other = listings.filter(l => l.status !== 'active');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Listings</h1>
          <p className="text-sm text-zinc-500 mt-1">{listings.length} total &middot; {active.length} active</p>
        </div>
        <Link href="/listings/create"
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
          + Create Listing
        </Link>
      </div>

      <div className="space-y-4">
        {[...active, ...other].map(listing => (
          <Link key={listing.id} href={`/listings/${listing.id}`}
            className="block bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-zinc-900">{listing.headline || listing.category}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[listing.status] || 'bg-zinc-100'}`}>
                    {listing.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-zinc-500 mt-1">{CATEGORY_DISPLAY_NAMES[listing.category] || listing.category}</p>
                {listing.body && <p className="text-sm text-zinc-600 mt-2 line-clamp-1">{listing.body}</p>}
              </div>
              <div className="text-right shrink-0 ml-4">
                <p className="text-lg font-semibold text-zinc-900">${listing.bidPerClaimUsdc.toFixed(2)}</p>
                <p className="text-xs text-zinc-500">per claim</p>
              </div>
            </div>
            <div className="flex items-center gap-6 mt-4 text-xs text-zinc-500">
              <span>Threshold: {listing.minScoreThreshold}+</span>
              <span>Funded: ${listing.escrowFundedUsdc.toLocaleString()}</span>
              <span>Remaining: ${listing.escrowRemainingUsdc.toLocaleString()}</span>
              <div className="flex-1">
                <div className="w-full bg-zinc-100 rounded-full h-1.5">
                  <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${Math.min(100, (listing.escrowRemainingUsdc / listing.escrowFundedUsdc) * 100)}%` }} />
                </div>
              </div>
              <span>{Math.round((listing.escrowRemainingUsdc / listing.escrowFundedUsdc) * 100)}%</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
