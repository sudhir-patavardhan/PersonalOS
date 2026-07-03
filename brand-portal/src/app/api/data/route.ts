import { getSession } from '@/lib/auth';
import { getBrandData, getCategorySupply } from '@/lib/synthetic-data';
import { FEE_RATE } from '@/lib/types';
import type { BrandKPI } from '@/lib/types';
import { getAllListings as getLiveListings, getSettlements as getLiveSettlements, getMetrics as getLiveMetrics } from '@/lib/state';

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const brandData = getBrandData(session.brandId);
  if (!brandData) {
    return Response.json({ error: 'Brand not found' }, { status: 404 });
  }

  const { profile, listings, settlements, escrowTransactions, reputationTrend, alerts } = brandData;
  const supply = getCategorySupply();

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const weekSettlements = settlements.filter(s => new Date(s.settledAt) >= weekAgo);

  const activeListings = listings.filter(l => l.status === 'active').length;
  const totalClaims7d = weekSettlements.length;
  const spendRate7d = weekSettlements.reduce((sum, s) => sum + s.bidUsdc, 0);
  const budgetRemaining = listings.reduce((sum, l) => sum + l.escrowRemainingUsdc, 0);
  const totalSpend = settlements.reduce((sum, s) => sum + s.bidUsdc, 0);
  const avgCostPerClaim = settlements.length > 0 ? totalSpend / settlements.length : 0;
  const dailySpendRate = spendRate7d / 7;
  const estimatedRunway = dailySpendRate > 0 ? Math.round(budgetRemaining / dailySpendRate) : Infinity;

  const prevWeekStart = new Date(weekAgo.getTime() - 7 * 86400000);
  const prevWeekSettlements = settlements.filter(s => {
    const d = new Date(s.settledAt);
    return d >= prevWeekStart && d < weekAgo;
  });
  const prevClaims = prevWeekSettlements.length;

  function trend(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }

  const kpis: BrandKPI[] = [
    { label: 'Active Listings', value: String(activeListings), trend: 0, href: '/listings' },
    { label: 'Claims (7d)', value: String(totalClaims7d), trend: trend(totalClaims7d, prevClaims), href: '/performance' },
    { label: 'Spend (7d)', value: `$${spendRate7d.toFixed(2)}`, trend: trend(spendRate7d, prevWeekSettlements.reduce((s, t) => s + t.bidUsdc, 0)), href: '/performance' },
    { label: 'Budget Remaining', value: budgetRemaining >= 1000 ? `$${(budgetRemaining / 1000).toFixed(1)}K` : `$${budgetRemaining.toFixed(2)}`, trend: 0, href: '/escrow' },
    { label: 'Avg Cost/Claim', value: `$${avgCostPerClaim.toFixed(2)}`, trend: 0, href: '/performance' },
    { label: 'Est. Runway', value: estimatedRunway === Infinity ? '∞' : `${estimatedRunway}d`, trend: 0, href: '/escrow' },
  ];

  const topListings = listings
    .map(l => {
      const lClaims = weekSettlements.filter(s => s.listingId === l.id).length;
      return { ...l, claims7d: lClaims };
    })
    .sort((a, b) => b.claims7d - a.claims7d)
    .slice(0, 5);

  const dailyClaims: Record<string, { date: string; claims: number; spend: number }> = {};
  for (const s of weekSettlements) {
    const date = new Date(s.settledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    if (!dailyClaims[date]) dailyClaims[date] = { date, claims: 0, spend: 0 };
    dailyClaims[date].claims++;
    dailyClaims[date].spend += s.bidUsdc;
  }

  const liveListings = getLiveListings().filter(l => l.brandId === session.brandId);
  const liveSettlements = getLiveSettlements({ brandId: session.brandId });
  const liveMetrics = getLiveMetrics();

  return Response.json({
    profile,
    kpis,
    listings,
    settlements,
    escrowTransactions,
    reputationTrend,
    alerts,
    categorySupply: supply,
    topListings,
    dailyClaims: Object.values(dailyClaims).reverse(),
    summary: {
      totalClaims: settlements.length,
      totalSpend,
      totalFees: settlements.reduce((s, t) => s + t.feeUsdc, 0),
      budgetRemaining,
    },
    live: {
      listings: liveListings,
      settlements: liveSettlements,
      metrics: liveMetrics,
    },
  });
}
