import { getSyntheticData } from '@/lib/synthetic-data';
import { CATEGORY_DISPLAY_NAMES } from '@/lib/types';
import type { Soul, Listing } from '@/lib/types';
import {
  runExchange,
  computeMetrics,
  estimateReach,
  CATEGORY_DISPLAY_NAMES as SME_DISPLAY_NAMES,
  type SoulProfile,
  type ListingProfile,
  type TargetingInput,
} from '@/lib/matching';
import { CANONICAL_SOULS, getActiveListings as getLiveListings, recordExchangeRun, getMetrics as getLiveMetrics, getAllOffers, getSettlements as getLiveSettlements, type MatchInput } from '@/lib/state';

function soulToProfile(soul: Soul): SoulProfile {
  const now = Date.now();
  const connectedTs = new Date(soul.connectedAt).getTime();
  const lastActivity: Record<string, number> = {};
  for (const cat of Object.keys(soul.noisyScores)) {
    lastActivity[cat] = connectedTs + Math.floor(Math.random() * (now - connectedTs));
  }

  return {
    id: soul.id,
    displayName: soul.id.charAt(0).toUpperCase() + soul.id.slice(1),
    consents: soul.consents
      .filter(c => !c.revokedAt)
      .map(c => ({
        category: c.category,
        yieldFloor: c.yieldFloorUsdc,
        active: true,
        grantedAt: new Date(c.grantedAt).getTime(),
      })),
    noisyScores: soul.noisyScores,
    reputation: Math.min(soul.depthScore / 100 + 0.3, 1.0),
    lastActivity,
  };
}

function listingToProfile(listing: Listing): ListingProfile {
  const displayName = CATEGORY_DISPLAY_NAMES[listing.category] || SME_DISPLAY_NAMES[listing.category] || listing.category;
  return {
    id: listing.id,
    brandId: listing.brandId,
    brandName: listing.brandName,
    targeting: { categories: [listing.category] } as TargetingInput,
    bidPerClaim: listing.bidPerClaimUsdc,
    minScoreThreshold: listing.minScoreThreshold,
    escrowRemaining: listing.escrowRemainingUsdc,
    status: listing.status,
    headline: `${listing.brandName} — ${displayName}`,
    body: `Targeting ${displayName.toLowerCase()} insights at $${listing.bidPerClaimUsdc.toFixed(2)} per claim.`,
  };
}

export async function GET(request: Request) {
  const { souls, brands } = getSyntheticData();
  const allListings = brands.flatMap(b => b.listings);

  const soulProfiles = souls.map(soulToProfile);
  const listingProfiles = allListings.map(listingToProfile);

  const run = runExchange(soulProfiles, listingProfiles);
  const metrics = computeMetrics(run, soulProfiles, listingProfiles);

  const url = new URL(request.url);
  const simCategories = url.searchParams.get('simCategories');
  const simDescriptor = url.searchParams.get('simDescriptor');
  const simBid = url.searchParams.get('simBid');
  const simThreshold = url.searchParams.get('simThreshold');

  let simulation = null;
  if (simCategories || simDescriptor) {
    const targeting: TargetingInput = {};
    if (simCategories) targeting.categories = simCategories.split(',');
    if (simDescriptor) targeting.descriptor = simDescriptor;

    simulation = estimateReach(
      targeting,
      soulProfiles,
      simBid ? parseFloat(simBid) : 1.0,
      simThreshold ? parseInt(simThreshold) : 0,
    );
  }

  const liveListings = getLiveListings();
  const liveOffers = getAllOffers();
  const liveSettlements = getLiveSettlements();
  const liveMetrics = getLiveMetrics();

  return Response.json({ run, metrics, simulation, live: { listings: liveListings, offers: liveOffers, settlements: liveSettlements, metrics: liveMetrics } });
}

export async function POST() {
  const liveListings = getLiveListings();
  if (liveListings.length === 0) {
    return Response.json({ error: 'No active live listings to match' }, { status: 400 });
  }

  const now = Date.now();
  const soulProfiles: SoulProfile[] = CANONICAL_SOULS.map(s => ({
    id: s.id,
    displayName: s.displayName,
    consents: s.consents.map(c => ({
      category: c.category,
      yieldFloor: c.floor,
      active: true,
      grantedAt: now - 30 * 86400000,
    })),
    noisyScores: s.noisyScores,
    reputation: s.reputation,
    lastActivity: Object.fromEntries(Object.keys(s.noisyScores).map(k => [k, now - Math.random() * 7 * 86400000])),
  }));

  const listingProfiles: ListingProfile[] = liveListings.map(l => ({
    id: l.id,
    brandId: l.brandId,
    brandName: l.brandName,
    targeting: { categories: [l.category] } as TargetingInput,
    bidPerClaim: l.bidPerClaim,
    minScoreThreshold: l.minScoreThreshold,
    escrowRemaining: l.escrowRemaining,
    status: l.status,
    headline: l.headline,
    body: l.body,
  }));

  const exchangeResult = runExchange(soulProfiles, listingProfiles);

  const matches: MatchInput[] = exchangeResult.matches.map(m => ({
    soulId: m.soulId,
    listingId: m.listingId,
    brandId: liveListings.find(l => l.id === m.listingId)?.brandId || '',
    brandName: liveListings.find(l => l.id === m.listingId)?.brandName || '',
    category: m.matchedCategories[0] || '',
    bidPerClaim: liveListings.find(l => l.id === m.listingId)?.bidPerClaim || 0,
    compositeScore: m.compositeScore,
    matchedCategories: m.matchedCategories,
  }));

  const run = recordExchangeRun(matches);

  return Response.json({
    success: true,
    run,
    matchCount: exchangeResult.matches.length,
    offersCreated: run.offersCreated,
    categoriesCovered: run.categoriesCovered,
  });
}
