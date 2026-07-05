import { readState, writeState, createListing, getActiveListings, getPendingOffers, claimOffer, getSettlements, resetState, recordExchangeRun } from '../operator-console/src/lib/state';
import { runExchange } from '../operator-console/src/lib/matching';

const backup = readState();
const out: Record<string, any> = {};

try {
  resetState();

  const listing = createListing({
    brandId: 'brand_smoke',
    brandName: 'Smoke Test Brand',
    category: 'dining.grocery',
    bidPerClaim: 2.00,
    escrowFunded: 100,
    minScoreThreshold: 30,
    headline: 'Smoke test',
    body: 'Test',
  });
  out.listingCreated = !!listing.id;
  out.activeListings = getActiveListings().length;

  const souls = [{
    id: 'soul_smoke',
    displayName: 'Smoke Soul',
    consents: [{ category: 'dining.grocery', yieldFloor: 0.50, active: true, grantedAt: Date.now() }],
    noisyScores: { 'dining.grocery': 65 },
    reputation: 0.85,
    lastActivity: { 'dining.grocery': Date.now() },
  }];

  const listings = getActiveListings().map(l => ({
    id: l.id,
    brandId: l.brandId,
    brandName: l.brandName,
    targeting: { categories: [l.category] },
    bidPerClaim: l.bidPerClaim,
    minScoreThreshold: l.minScoreThreshold,
    escrowRemaining: l.escrowRemaining,
    status: l.status as 'active' | 'paused' | 'depleted' | 'exhausted',
    headline: l.headline,
    body: l.body,
  }));

  const exchange = runExchange(souls, listings);
  out.matches = exchange.matches.length;

  if (exchange.matches.length > 0) {
    const run = recordExchangeRun(exchange.matches.map(m => ({
      soulId: m.soulId,
      listingId: m.listingId,
      brandId: 'brand_smoke',
      brandName: 'Smoke Test Brand',
      category: 'dining.grocery',
      bidPerClaim: 2.00,
      compositeScore: m.compositeScore,
      matchedCategories: m.matchedCategories,
    })));
    out.offersCreated = run.offersCreated;

    const offers = getPendingOffers('soul_smoke');
    if (offers.length > 0) {
      const result = claimOffer(offers[0].id);
      out.claimSuccess = result && 'txHash' in result;
      if (out.claimSuccess && 'yieldUsdc' in result) {
        out.yield = (result as any).yieldUsdc;
        out.fee = (result as any).feeUsdc;
      }
    }
    out.settlements = getSettlements({ brandId: 'brand_smoke' }).length;
  }
  out.passed = true;
} catch (e: any) {
  out.passed = false;
  out.error = e.message;
} finally {
  writeState(backup);
}

console.log(JSON.stringify(out));
