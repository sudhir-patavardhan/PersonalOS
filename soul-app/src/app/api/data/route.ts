import { getSession } from '@/lib/auth';
import { getSoulData } from '@/lib/synthetic-data';
import { getPendingOffers, getSettlements, getAllOffers, getActiveListings } from '@/lib/state';
import { CATEGORY_DISPLAY_NAMES as SME_DISPLAY_NAMES } from '@/lib/matching';
import { computeBrandScore, BADGE_DISPLAY } from '@/lib/scoring';
import type { BrandProfile, ScoreContext } from '@/lib/scoring';
import type { Offer } from '@/lib/types';

const FEE_RATE = 0.10;

function buildScoreContext(soulId: string, soulRegion: string, soulConsents: string[]): ScoreContext {
  const allSettlements = getSettlements();
  const allOffers = getAllOffers();
  const allListings = getActiveListings();

  return {
    settlements: allSettlements.map(s => ({
      brandId: s.brandId,
      soulId: s.soulId,
      category: s.category,
      bidUsdc: s.bidUsdc,
      claimedAt: s.claimedAt,
    })),
    offers: allOffers.map(o => ({
      brandId: o.brandId,
      soulId: o.soulId,
      category: o.category,
      status: o.status,
      createdAt: o.createdAt,
    })),
    listings: allListings.map(l => ({
      brandId: l.brandId,
      category: l.category,
      bidPerClaim: l.bidPerClaim,
      escrowRemaining: l.escrowRemaining,
      escrowFunded: l.escrowFunded,
      status: l.status,
    })),
    allBrandIds: [...new Set(allListings.map(l => l.brandId))],
    soulRegion,
    soulConsents,
    soulId,
  };
}

function getBrandBadge(brandName: string, brandId: string, category: string, ctx: ScoreContext): { badge: string | null; score: number } {
  const brand: BrandProfile = {
    brandId,
    brandName,
    categories: [category],
    declaredMarkets: ['North America'],
  };

  const result = computeBrandScore(brand, ctx);
  return {
    badge: result.badge ? BADGE_DISPLAY[result.badge] : null,
    score: result.contextualScore,
  };
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = getSoulData(session.soulId);
  if (!data) {
    return Response.json({ error: 'Soul not found' }, { status: 404 });
  }

  const liveOffers = getPendingOffers(session.soulId);
  const liveSettlements = getSettlements({ soulId: session.soulId });

  const soulRegion = data.profile?.region || 'North America';
  const soulConsents = data.consents?.map((c: { category: string }) => c.category) || [];
  const scoreCtx = buildScoreContext(session.soulId, soulRegion, soulConsents);

  const liveBrandCategories = new Set(
    liveOffers.map(o => `${o.brandId}:${o.category}`)
  );
  const filteredSyntheticOffers = data.pendingOffers.filter(
    (o: Offer) => !liveBrandCategories.has(`${o.id.split('_')[0]}:${o.category}`)
  );

  const convertedLiveOffers: Offer[] = liveOffers.map(o => {
    const { badge, score } = getBrandBadge(o.brandName, o.brandId, o.category, scoreCtx);
    return {
      id: o.id,
      brandName: o.brandName,
      brandReputation: 0.85,
      category: o.category,
      categoryDisplay: SME_DISPLAY_NAMES[o.category] || o.category,
      headline: `${o.brandName} wants your ${SME_DISPLAY_NAMES[o.category] || o.category} insights`,
      body: `Share your anonymized ${(SME_DISPLAY_NAMES[o.category] || o.category).toLowerCase()} data for $${o.bidPerClaim.toFixed(2)} per claim.`,
      ctaUrl: '',
      ctaLabel: 'Claim',
      bidUsdc: o.bidPerClaim,
      earnUsdc: Math.round(o.bidPerClaim * (1 - FEE_RATE) * 100) / 100,
      matchScore: Math.min(99, Math.round(o.compositeScore * 50)),
      expiresAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      status: 'pending' as const,
      claimedAt: null,
      dismissedAt: null,
      soulFraming: `${Math.min(99, Math.round(o.compositeScore * 50))}% match · Live offer`,
      brandBadge: badge,
      brandScore: score,
    };
  });

  const enrichedSyntheticOffers = filteredSyntheticOffers.map((o: Offer) => ({
    ...o,
    brandBadge: null,
    brandScore: 75,
  }));

  const liveEarnings = liveSettlements.reduce((sum, s) => sum + s.yieldUsdc, 0);

  return Response.json({
    ...data,
    pendingOffers: [...convertedLiveOffers, ...enrichedSyntheticOffers],
    pendingOfferCount: convertedLiveOffers.length + enrichedSyntheticOffers.length,
    liveSettlements,
    liveEarnings,
  });
}
