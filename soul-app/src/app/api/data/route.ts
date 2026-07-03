import { getSession } from '@/lib/auth';
import { getSoulData } from '@/lib/synthetic-data';
import { getPendingOffers, getSettlements } from '@/lib/state';
import { CATEGORY_DISPLAY_NAMES as SME_DISPLAY_NAMES } from '@/lib/matching';
import type { Offer } from '@/lib/types';

const FEE_RATE = 0.10;

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

  const liveBrandCategories = new Set(
    liveOffers.map(o => `${o.brandId}:${o.category}`)
  );
  const filteredSyntheticOffers = data.pendingOffers.filter(
    o => !liveBrandCategories.has(`${o.id.split('_')[0]}:${o.category}`)
  );

  const convertedLiveOffers: Offer[] = liveOffers.map(o => ({
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
  }));

  const liveEarnings = liveSettlements.reduce((sum, s) => sum + s.yieldUsdc, 0);

  return Response.json({
    ...data,
    pendingOffers: [...convertedLiveOffers, ...filteredSyntheticOffers],
    pendingOfferCount: convertedLiveOffers.length + filteredSyntheticOffers.length,
    liveSettlements,
    liveEarnings,
  });
}
