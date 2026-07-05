import { computeBrandScore } from '../operator-console/src/lib/scoring';

const out: Record<string, any> = {};

const coldBrand = { brandId: 'b1', brandName: 'New Brand', categories: ['dining.grocery'], declaredMarkets: ['North America'] };
const emptyCtx = { settlements: [], offers: [], listings: [], allBrandIds: ['b1'], soulRegion: 'North America', soulConsents: ['dining.grocery'] };
const coldResult = computeBrandScore(coldBrand, emptyCtx);
out.coldScore = coldResult.baseScore;
out.coldNew = coldResult.isNewBrand;

const now = Date.now();
const settlements = [];
for (let i = 0; i < 25; i++) {
  settlements.push({
    brandId: 'b2', soulId: 'soul_' + (i % 5), category: 'dining.grocery',
    bidUsdc: 2.0, claimedAt: new Date(now - i * 86400000).toISOString(),
  });
}
const offers = settlements.map((s, i) => ({
  brandId: 'b2', soulId: s.soulId, category: 'dining.grocery',
  status: (i < 20 ? 'claimed' : 'expired') as 'pending' | 'claimed' | 'expired',
  createdAt: s.claimedAt,
}));
const listings = [{ brandId: 'b2', category: 'dining.grocery', bidPerClaim: 2.0, escrowRemaining: 500, escrowFunded: 1000, status: 'active' }];
const ctx = { settlements, offers, listings, allBrandIds: ['b2'], soulRegion: 'North America', soulConsents: ['dining.grocery'] };
const estBrand = { brandId: 'b2', brandName: 'Established', categories: ['dining.grocery'], declaredMarkets: ['North America'] };
const estResult = computeBrandScore(estBrand, ctx);
out.estScore = estResult.baseScore;
out.estContextual = estResult.contextualScore;
out.estNew = estResult.isNewBrand;
out.estTrend = estResult.trendMultiplier;
out.passed = true;

console.log(JSON.stringify(out));
