'use client';
import { useEffect, useState } from 'react';
import type { Offer, SoulProfile } from '@/lib/types';
import Link from 'next/link';

function TimeLeft({ expiresAt }: { expiresAt: string }) {
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return <span className="text-red-400">Expired</span>;
  const hours = Math.floor(ms / 3600000);
  const mins = Math.floor((ms % 3600000) / 60000);
  return <span className="text-zinc-400">{hours}h {mins}m left</span>;
}

export default function OffersPage() {
  const [profile, setProfile] = useState<SoulProfile | null>(null);
  const [pending, setPending] = useState<Offer[]>([]);
  const [history, setHistory] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<'pending' | 'history'>('pending');

  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(d => {
      setProfile(d.profile);
      setPending(d.pendingOffers || []);
      setHistory(d.offerHistory || []);
      setLoading(false);
    });
  }, []);

  async function handleClaim(offer: Offer) {
    setClaiming(true);
    const isLive = offer.id.startsWith('offer_live_');
    if (isLive) {
      try {
        const res = await fetch('/api/claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ offerId: offer.id }),
        });
        const result = await res.json();
        if (!res.ok) {
          setClaiming(false);
          alert(result.error || 'Claim failed');
          return;
        }
      } catch {
        setClaiming(false);
        alert('Claim failed');
        return;
      }
    } else {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    setClaiming(false);
    setClaimSuccess(offer.id);
    setPending(prev => prev.filter(o => o.id !== offer.id));
    setHistory(prev => [{ ...offer, status: 'claimed', claimedAt: new Date().toISOString() }, ...prev]);
    setSelectedOffer(null);
    setTimeout(() => setClaimSuccess(null), 3000);
  }

  function handleDismiss(offer: Offer) {
    setPending(prev => prev.filter(o => o.id !== offer.id));
    setHistory(prev => [{ ...offer, status: 'dismissed', dismissedAt: new Date().toISOString() }, ...prev]);
    setSelectedOffer(null);
  }

  if (loading) return <div className="flex items-center justify-center h-full"><p className="text-zinc-500">Loading...</p></div>;

  if (profile?.phase === 1) {
    return (
      <div className="p-5 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Offers</h1>
          <p className="text-sm text-zinc-400 mt-1">Earn from brands that value your insights</p>
        </div>
        <div className="glass-card p-8 text-center gradient-glow">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Marketplace Locked</h2>
          <p className="text-sm text-zinc-400 mb-4">Reach 60% Depth Score to unlock the marketplace and start receiving Offers from brands.</p>
          <div className="glass-card p-3 inline-block">
            <p className="text-sm text-zinc-300">Your Depth Score: <span className="gradient-text font-bold">{profile.depthScore}%</span> / 60%</p>
          </div>
          <Link href="/profile/konnections" className="block mt-4 py-2.5 gradient-btn text-white rounded-lg text-sm font-medium max-w-xs mx-auto">
            Connect more sources
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const m: Record<string, string> = {
      claimed: 'bg-green-500/10 text-green-400',
      dismissed: 'bg-zinc-500/10 text-zinc-400',
      expired: 'bg-red-500/10 text-red-400',
    };
    return m[status] || 'bg-zinc-500/10 text-zinc-400';
  };

  return (
    <div className="p-5 space-y-6">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold text-white">Offers</h1>
        <p className="text-sm text-zinc-400 mt-1">Review, claim, and earn from personalized offers</p>
      </div>

      {claimSuccess && (
        <div className="glass-card p-4 border-green-500/30 animate-fade-in-up">
          <p className="text-sm text-green-400 font-medium">Claimed! USDC added to your wallet.</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'pending' ? 'gradient-btn text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
          Pending ({pending.length})
        </button>
        <button onClick={() => setTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === 'history' ? 'gradient-btn text-white' : 'bg-white/5 text-zinc-400 hover:bg-white/10'}`}>
          History ({history.length})
        </button>
      </div>

      {tab === 'pending' && (
        <div className="space-y-3">
          {pending.length === 0 && (
            <div className="glass-card p-6 text-center">
              <p className="text-zinc-400 text-sm">No pending offers. Check back soon!</p>
            </div>
          )}
          {pending.map((offer, i) => (
            <button key={offer.id} onClick={() => setSelectedOffer(offer)}
              className="w-full text-left glass-card glass-card-hover p-4 animate-fade-in-up transition-all" style={{ animationDelay: `${i * 0.05}s`, opacity: 0 }}>
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-zinc-500">{offer.soulFraming}</p>
                  <h3 className="text-sm font-medium text-white mt-1">{offer.headline}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full">{offer.categoryDisplay}</span>
                    {offer.brandBadge && <BrandBadge badge={offer.brandBadge} />}
                    <span className="text-[10px] text-zinc-500"><TimeLeft expiresAt={offer.expiresAt} /></span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-3">
                  <p className="text-lg font-bold gradient-text">${offer.earnUsdc.toFixed(2)}</p>
                  <p className="text-[9px] text-zinc-500">you earn</p>
                  <div className="mt-1 text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full">{offer.matchScore}% match</div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-3">
          {history.map((offer, i) => (
            <div key={offer.id} className="glass-card p-4 animate-fade-in-up" style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm text-white">{offer.headline}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-zinc-500">{offer.brandName}</span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusBadge(offer.status)}`}>{offer.status}</span>
                  </div>
                </div>
                {offer.status === 'claimed' && <p className="text-sm font-semibold text-green-400">+${offer.earnUsdc.toFixed(2)}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Sheet */}
      {selectedOffer && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setSelectedOffer(null)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-2xl glass-card rounded-b-none p-6 space-y-4 animate-fade-in-up" onClick={e => e.stopPropagation()}
            style={{ background: 'rgba(20, 20, 35, 0.95)', borderBottom: 'none' }}>
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-2" />

            <p className="text-[11px] text-zinc-400">{selectedOffer.soulFraming}</p>

            <div className="glass-card p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-medium text-white bg-white/10 px-2 py-0.5 rounded">{selectedOffer.brandName}</span>
                {selectedOffer.brandBadge && <BrandBadge badge={selectedOffer.brandBadge} />}
                {selectedOffer.brandScore !== undefined && (
                  <span className="text-[10px] text-zinc-500">Score: {selectedOffer.brandScore}/100</span>
                )}
              </div>
              <h3 className="text-lg font-semibold text-white">{selectedOffer.headline}</h3>
              <p className="text-sm text-zinc-300 mt-2 leading-relaxed">{selectedOffer.body}</p>
              <a href={selectedOffer.ctaUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block mt-3 text-xs text-cyan-400 hover:text-cyan-300">{selectedOffer.ctaLabel} →</a>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold gradient-text">${selectedOffer.earnUsdc.toFixed(2)}</p>
                <p className="text-[10px] text-zinc-500">You earn (after 10% platform fee)</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full">{selectedOffer.matchScore}% match</div>
                <p className="text-[9px] text-zinc-600 mt-1">Only you see this score</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleClaim(selectedOffer)} disabled={claiming}
                className="flex-1 py-3 gradient-btn text-white rounded-xl text-sm font-semibold disabled:opacity-50 animate-pulse-glow">
                {claiming ? 'Signing with passkey...' : `Claim $${selectedOffer.earnUsdc.toFixed(2)}`}
              </button>
              <button onClick={() => handleDismiss(selectedOffer)}
                className="py-3 px-4 bg-white/5 text-zinc-400 rounded-xl text-sm hover:bg-white/10 transition-colors">Dismiss</button>
            </div>

            <p className="text-[10px] text-zinc-500"><TimeLeft expiresAt={selectedOffer.expiresAt} /></p>
          </div>
        </div>
      )}
    </div>
  );
}

const BADGE_STYLES: Record<string, string> = {
  'Trending': 'text-orange-400 bg-orange-500/10',
  'Seasonal Pick': 'text-emerald-400 bg-emerald-500/10',
  'Popular Nearby': 'text-blue-400 bg-blue-500/10',
  'Repeat Favorite': 'text-pink-400 bg-pink-500/10',
};

const BADGE_ICONS: Record<string, string> = {
  'Trending': '🔥',
  'Seasonal Pick': '🌿',
  'Popular Nearby': '📍',
  'Repeat Favorite': '💜',
};

function BrandBadge({ badge }: { badge: string }) {
  const style = BADGE_STYLES[badge] || 'text-zinc-400 bg-zinc-500/10';
  const icon = BADGE_ICONS[badge] || '';
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${style}`}>
      {icon} {badge}
    </span>
  );
}
