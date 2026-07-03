import { getSyntheticData } from '@/lib/synthetic-data';
import { CATEGORIES, CATEGORY_DISPLAY_NAMES, FEE_RATE } from '@/lib/types';
import type { CategoryMetrics, DashboardKPI } from '@/lib/types';
import { getSettlements as getLiveSettlements } from '@/lib/state';

export async function GET() {
  const { souls, brands, settlements } = getSyntheticData();
  const allListings = brands.flatMap(b => b.listings);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekAgo = new Date(now.getTime() - 7 * 86400000);

  const todaySettlements = settlements.filter(s => new Date(s.settledAt) >= todayStart);
  const yesterdaySettlements = settlements.filter(s => {
    const d = new Date(s.settledAt);
    return d >= yesterdayStart && d < todayStart;
  });

  const activeSouls = souls.filter(s => s.phase === 'two').length;
  const activeListings = allListings.filter(l => l.status === 'active').length;
  const claimsToday = todaySettlements.length;
  const claimsYesterday = yesterdaySettlements.length;
  const revenueToday = todaySettlements.reduce((sum, s) => sum + s.feeUsdc, 0);
  const revenueYesterday = yesterdaySettlements.reduce((sum, s) => sum + s.feeUsdc, 0);
  const totalEscrow = allListings.reduce((sum, l) => sum + l.escrowRemainingUsdc, 0);

  const weekSettlements = settlements.filter(s => new Date(s.settledAt) >= weekAgo);
  const matchRate = weekSettlements.length > 0 ? (weekSettlements.length / (allListings.length * 7 * 4)) * 100 : 0;

  const categoriesWithActivity = new Set<string>();
  for (const listing of allListings.filter(l => l.status === 'active')) {
    const hasConsent = souls.some(s => s.consents.some(c => c.category === listing.category && !c.revokedAt));
    if (hasConsent) categoriesWithActivity.add(listing.category);
  }

  function health(val: number, green: number, amber: number, isLower = false): 'green' | 'amber' | 'red' {
    if (isLower) return val < green ? 'green' : val <= amber ? 'amber' : 'red';
    return val >= green ? 'green' : val >= amber ? 'amber' : 'red';
  }

  function trend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const kpis: DashboardKPI[] = [
    { label: 'Active Souls (Phase 2)', value: String(activeSouls), trend: 0, health: health(activeSouls, 50, 10), href: '/categories' },
    { label: 'Active Listings', value: String(activeListings), trend: 0, health: health(activeListings, 10, 5), href: '/brands' },
    { label: 'Claims Today', value: String(claimsToday), trend: trend(claimsToday, claimsYesterday), health: health(claimsToday, 10, 3), href: '/settlements' },
    { label: 'Revenue Today', value: `$${revenueToday.toFixed(2)}`, trend: trend(revenueToday, revenueYesterday), health: health(revenueToday, 50, 10), href: '/settlements' },
    { label: 'Total Escrow', value: `$${(totalEscrow / 1000).toFixed(1)}K`, trend: 0, health: health(totalEscrow, 10000, 2000), href: '/brands' },
    { label: 'Match Rate (7d)', value: `${matchRate.toFixed(1)}%`, trend: 0, health: health(matchRate, 15, 5), href: '/categories' },
    { label: 'Avg Settlement', value: '<1s', trend: 0, health: 'green' as const, href: '/settlements' },
    { label: 'Category Coverage', value: `${categoriesWithActivity.size}/12`, trend: 0, health: health(categoriesWithActivity.size, 8, 4), href: '/categories' },
  ];

  const categories: CategoryMetrics[] = CATEGORIES.map(cat => {
    const isPrivate = cat === 'health.medical';
    const consentingSouls = isPrivate ? 0 : souls.filter(s => s.consents.some(c => c.category === cat && !c.revokedAt)).length;
    const catListings = allListings.filter(l => l.category === cat && l.status === 'active');
    const catSettlements = weekSettlements.filter(s => s.category === cat);
    const floors = souls.flatMap(s => s.consents.filter(c => c.category === cat && !c.revokedAt).map(c => c.yieldFloorUsdc));
    const medianFloor = floors.length > 0 ? floors.sort((a, b) => a - b)[Math.floor(floors.length / 2)] : null;
    const avgBid = catListings.length > 0 ? catListings.reduce((s, l) => s + l.bidPerClaimUsdc, 0) / catListings.length : null;
    const avgScore = isPrivate ? null : (() => {
      const scores = souls.map(s => s.noisyScores[cat]).filter(Boolean);
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
    })();

    return {
      category: cat,
      displayName: CATEGORY_DISPLAY_NAMES[cat] || cat,
      isPrivate,
      supply: { consentingSouls, avgNoisyScore: avgScore },
      demand: {
        activeListings: catListings.length,
        totalEscrow: catListings.reduce((s, l) => s + l.escrowRemainingUsdc, 0),
        avgBid,
        avgThreshold: catListings.length > 0 ? catListings.reduce((s, l) => s + l.minScoreThreshold, 0) / catListings.length : null,
      },
      pricing: { medianYieldFloor: medianFloor, bidFloorSpread: avgBid && medianFloor ? avgBid - medianFloor : null },
      velocity: {
        claimsPerDay: catSettlements.length / 7,
        matchRate: catListings.length > 0 && consentingSouls > 0 ? (catSettlements.length / (catListings.length * 7)) * 100 : 0,
      },
    };
  });

  const liveSettlements = getLiveSettlements();
  const convertedLiveSettlements = liveSettlements.map(s => ({
    id: s.id,
    brandName: s.brandId === 'brand_1' ? 'Whole Foods Market' : s.brandId === 'brand_3' ? 'Chase Sapphire' : s.brandId,
    category: s.category,
    soulWalletDisplay: `${s.soulId}`,
    bidUsdc: s.bidUsdc,
    yieldUsdc: s.yieldUsdc,
    feeUsdc: s.feeUsdc,
    txHash: s.txHash,
    settledAt: s.claimedAt,
    onChain: s.txHash.startsWith('0x') && s.txHash.length === 66,
  }));

  const allSettlements = [...convertedLiveSettlements, ...settlements];

  const totalVolume = allSettlements.reduce((s, t) => s + t.bidUsdc, 0);
  const totalFees = allSettlements.reduce((s, t) => s + t.feeUsdc, 0);
  const totalYield = allSettlements.reduce((s, t) => s + t.yieldUsdc, 0);

  return Response.json({
    kpis,
    categories,
    brands,
    souls: souls.map(s => ({ id: s.id, walletDisplay: s.walletDisplay, depthScore: s.depthScore, phase: s.phase, consentCount: s.consents.filter(c => !c.revokedAt).length })),
    settlements: allSettlements,
    summary: { totalSettlements: allSettlements.length, totalVolume, totalFees, totalYield },
  });
}
