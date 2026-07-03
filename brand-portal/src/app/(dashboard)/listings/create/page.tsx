'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';
import { getTradeableLeaves, getParentNodes, getChildren, type CategoryNode, type ReachEstimate } from '@/lib/matching';

export default function CreateListingPage() {
  const router = useRouter();
  const parents = getParentNodes();
  const allLeaves = getTradeableLeaves();
  const [category, setCategory] = useState(allLeaves[0]?.id || '');
  const [bid, setBid] = useState('1.00');
  const [threshold, setThreshold] = useState('40');
  const [budget, setBudget] = useState('5000');
  const [headline, setHeadline] = useState('');
  const [body, setBody] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [ctaLabel, setCtaLabel] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [reach, setReach] = useState<ReachEstimate | null>(null);
  const [reachLoading, setReachLoading] = useState(false);

  const fetchReach = useCallback(async () => {
    if (!category) return;
    setReachLoading(true);
    try {
      const params = new URLSearchParams({ category, bid, threshold });
      const res = await fetch(`/api/reach?${params}`);
      if (res.ok) setReach(await res.json());
    } catch { /* ignore */ }
    setReachLoading(false);
  }, [category, bid, threshold]);

  useEffect(() => {
    const timeout = setTimeout(fetchReach, 300);
    return () => clearTimeout(timeout);
  }, [fetchReach]);

  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/listings/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, bid, budget, threshold, headline, bodyText: body, ctaUrl, ctaLabel }),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch { /* ignore */ }
    setSubmitting(false);
  }

  if (submitted) {
    return (
      <div className="p-6">
        <div className="max-w-lg mx-auto bg-white rounded-xl border border-zinc-200 p-8 text-center">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-900">Listing Created</h2>
          <p className="text-sm text-zinc-500 mt-2">
            Your listing for {CATEGORY_DISPLAY_NAMES[category] || category} has been submitted.
            In production, it would enter <span className="font-medium">pending_review</span> status.
            For L0.3, it auto-approves to <span className="font-medium text-green-700">active</span>.
          </p>
          <div className="flex gap-3 mt-6 justify-center">
            <button onClick={() => router.push('/listings')} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">View Listings</button>
            <button onClick={() => { setSubmitted(false); setHeadline(''); setBody(''); }} className="px-4 py-2 border border-zinc-200 rounded-lg text-sm font-medium hover:bg-zinc-50">Create Another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl">
        <h1 className="text-2xl font-semibold text-zinc-900">Create Listing</h1>
        <p className="text-sm text-zinc-500 mt-1">Target a category, set your bid, and add creative content</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900">Targeting</h2>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                {parents.map(parent => {
                  const leaves = getChildren(parent.id).filter(c => c.tradeable);
                  if (leaves.length === 0) return null;
                  return (
                    <optgroup key={parent.id} label={parent.displayName}>
                      {leaves.map(leaf => (
                        <option key={leaf.id} value={leaf.id}>{leaf.displayName}</option>
                      ))}
                    </optgroup>
                  );
                })}
              </select>
            </div>
            {reach && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-xs font-medium text-emerald-800 mb-1">
                  {reachLoading ? 'Estimating reach...' : 'Reach Estimate'}
                </p>
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-lg font-semibold text-emerald-900">{reach.eligibleSouls} / {reach.totalSouls}</p>
                    <p className="text-[10px] text-emerald-600">eligible souls</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-emerald-900">{reach.matchRate}%</p>
                    <p className="text-[10px] text-emerald-600">match rate</p>
                  </div>
                </div>
                {reach.eligibleSouls === 0 && (
                  <p className="text-xs text-amber-600 mt-2">No souls match this targeting. Try lowering the min score or increasing the bid.</p>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Bid per Claim (USDC)</label>
                <input type="number" value={bid} onChange={e => setBid(e.target.value)} min="0.50" step="0.25" required
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                <p className="text-xs text-zinc-400 mt-1">Minimum $0.50</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">Min Score Threshold</label>
                <select value={threshold} onChange={e => setThreshold(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                  {[50, 60, 70, 80, 90].map(t => (
                    <option key={t} value={t}>{t}+</option>
                  ))}
                </select>
                <p className="text-xs text-zinc-400 mt-1">Eligible pool validated against k ≥ 50</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Budget (USDC)</label>
              <input type="number" value={budget} onChange={e => setBudget(e.target.value)} min="5" step="100" required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <p className="text-xs text-zinc-400 mt-1">Minimum 10x bid amount (${(parseFloat(bid || '0.50') * 10).toFixed(2)})</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900">Creative</h2>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Headline</label>
              <input type="text" value={headline} onChange={e => setHeadline(e.target.value)} maxLength={60} required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              <p className="text-xs text-zinc-400 mt-1">{headline.length}/60 characters</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Body</label>
              <textarea value={body} onChange={e => setBody(e.target.value)} maxLength={200} rows={3} required
                className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
              <p className="text-xs text-zinc-400 mt-1">{body.length}/200 characters</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">CTA URL</label>
                <input type="url" value={ctaUrl} onChange={e => setCtaUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1">CTA Label</label>
                <input type="text" value={ctaLabel} onChange={e => setCtaLabel(e.target.value)} maxLength={20}
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
            </div>
          </div>

          <div className="bg-zinc-50 rounded-xl border border-zinc-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-zinc-500">Coming Soon</h2>
            <div className="grid grid-cols-2 gap-4 opacity-50 pointer-events-none">
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">Geo-targeting</label>
                <select disabled className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-100">
                  <option>All regions</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-500 mb-1">End Date</label>
                <input type="date" disabled className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm bg-zinc-100" />
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting} className="w-full py-3 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 disabled:opacity-50">
            {submitting ? 'Creating...' : 'Create Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
