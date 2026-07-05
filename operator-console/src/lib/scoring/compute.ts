import type {
  BrandScoringConfig,
  BrandProfile,
  BrandScoreResult,
  Badge,
  SettlementRecord,
  OfferRecord,
  ListingRecord,
} from './types';
import { DEFAULT_CONFIG } from './config';

export interface ScoreContext {
  settlements: SettlementRecord[];
  offers: OfferRecord[];
  listings: ListingRecord[];
  allBrandIds: string[];
  soulRegion?: string;
  soulConsents?: string[];
  soulId?: string;
}

export function computeBrandScore(
  brand: BrandProfile,
  ctx: ScoreContext,
  config: BrandScoringConfig = DEFAULT_CONFIG,
): BrandScoreResult {
  const now = Date.now();
  const sevenDaysAgo = now - config.trend.currentDays * 86400000;
  const thirtyDaysAgo = now - config.trend.baselineDays * 86400000;

  const brandSettlements = ctx.settlements.filter(s => s.brandId === brand.brandId);
  const recentSettlements = brandSettlements.filter(s => new Date(s.claimedAt).getTime() >= sevenDaysAgo);
  const baselineSettlements = brandSettlements.filter(s => new Date(s.claimedAt).getTime() >= thirtyDaysAgo);

  const totalSettlements = baselineSettlements.length;
  const isNewBrand = totalSettlements < config.coldStart.graduationThreshold;

  if (isNewBrand) {
    return {
      brandId: brand.brandId,
      baseScore: config.coldStart.baseScore,
      trendMultiplier: 1.0,
      contextualScore: config.coldStart.baseScore,
      badge: null,
      isNewBrand: true,
      components: {
        claimRate: 0,
        bidFairness: 0,
        escrowHealth: 0,
        seasonality: 1.0,
        geography: 1.0,
        cohortAffinity: 1.0,
      },
    };
  }

  const claimRateScore = computeClaimRate(brand, ctx, sevenDaysAgo);
  const bidFairnessScore = computeBidFairness(brand, ctx);
  const escrowHealthScore = computeEscrowHealth(brand, ctx, config);

  const baseScore = Math.round(
    claimRateScore * config.weights.claimRate +
    bidFairnessScore * config.weights.bidFairness +
    escrowHealthScore * config.weights.escrowHealth
  );

  const trendMultiplier = computeTrendMultiplier(brand, ctx, config, recentSettlements, baselineSettlements);
  const seasonalityMultiplier = computeSeasonality(brand, config);
  const geographyMultiplier = computeGeography(brand, ctx);
  const cohortMultiplier = computeCohortAffinity(brand, ctx, config);

  const contextualMultiplier = seasonalityMultiplier * geographyMultiplier * cohortMultiplier;
  let contextualScore = Math.round(baseScore * trendMultiplier * contextualMultiplier);
  contextualScore = Math.max(0, Math.min(100, contextualScore));

  if (trendMultiplier >= config.trend.multiplierMax && contextualScore < config.trend.floor) {
    contextualScore = config.trend.floor;
  }

  const badge = assignBadge(brand, ctx, config, trendMultiplier, seasonalityMultiplier, geographyMultiplier);

  return {
    brandId: brand.brandId,
    baseScore,
    trendMultiplier,
    contextualScore,
    badge,
    isNewBrand: false,
    components: {
      claimRate: claimRateScore,
      bidFairness: bidFairnessScore,
      escrowHealth: escrowHealthScore,
      seasonality: seasonalityMultiplier,
      geography: geographyMultiplier,
      cohortAffinity: cohortMultiplier,
    },
  };
}

function computeClaimRate(brand: BrandProfile, ctx: ScoreContext, sinceTs: number): number {
  const brandOffers = ctx.offers.filter(
    o => o.brandId === brand.brandId && new Date(o.createdAt).getTime() >= sinceTs
  );
  if (brandOffers.length === 0) return 50;

  const claimed = brandOffers.filter(o => o.status === 'claimed').length;
  const total = brandOffers.length;
  const rate = claimed / total;
  return Math.round(rate * 100);
}

function computeBidFairness(brand: BrandProfile, ctx: ScoreContext): number {
  const brandListings = ctx.listings.filter(
    l => l.brandId === brand.brandId && l.status === 'active'
  );
  if (brandListings.length === 0) return 50;

  const brandAvgBid = brandListings.reduce((s, l) => s + l.bidPerClaim, 0) / brandListings.length;

  const allBidsInCategories: number[] = [];
  for (const cat of brand.categories) {
    const catListings = ctx.listings.filter(l => l.category === cat && l.status === 'active');
    for (const l of catListings) {
      allBidsInCategories.push(l.bidPerClaim);
    }
  }

  if (allBidsInCategories.length <= 1) return 50;

  allBidsInCategories.sort((a, b) => a - b);
  let rank = 0;
  for (const bid of allBidsInCategories) {
    if (bid <= brandAvgBid) rank++;
  }

  return Math.round((rank / allBidsInCategories.length) * 100);
}

function computeEscrowHealth(brand: BrandProfile, ctx: ScoreContext, config: BrandScoringConfig): number {
  const brandListings = ctx.listings.filter(
    l => l.brandId === brand.brandId && l.status === 'active'
  );
  if (brandListings.length === 0) return 0;

  const totalEscrow = brandListings.reduce((s, l) => s + l.escrowRemaining, 0);

  if (totalEscrow < config.escrowHealth.absoluteFloor) return 0;

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 86400000;
  const brandSettlements7d = ctx.settlements.filter(
    s => s.brandId === brand.brandId && new Date(s.claimedAt).getTime() >= sevenDaysAgo
  );

  const dailySpend = brandSettlements7d.length > 0
    ? brandSettlements7d.reduce((s, t) => s + t.bidUsdc, 0) / 7
    : 0;

  if (dailySpend === 0) return 70;

  const runwayDays = totalEscrow / dailySpend;

  for (const tier of config.escrowHealth.tiers) {
    if (runwayDays >= tier.minDays) return tier.score;
  }
  return 10;
}

function computeTrendMultiplier(
  brand: BrandProfile,
  ctx: ScoreContext,
  config: BrandScoringConfig,
  recentSettlements: SettlementRecord[],
  baselineSettlements: SettlementRecord[],
): number {
  if (baselineSettlements.length < config.trend.minBaselineSettlements) return 1.0;
  if (recentSettlements.length < config.trend.minCurrentSettlements) return 1.0;

  const baselineDailyRate = baselineSettlements.length / config.trend.baselineDays;
  const currentDailyRate = recentSettlements.length / config.trend.currentDays;

  if (baselineDailyRate === 0) return 1.0;

  const ratio = currentDailyRate / baselineDailyRate;

  const multiplier = Math.max(
    config.trend.multiplierMin,
    Math.min(config.trend.multiplierMax, ratio)
  );

  return Math.round(multiplier * 100) / 100;
}

function computeSeasonality(brand: BrandProfile, config: BrandScoringConfig): number {
  const currentMonth = new Date().getMonth();
  let maxWeight = 1.0;

  for (const cat of brand.categories) {
    const weights = config.seasonality[cat];
    if (weights && weights[currentMonth] > maxWeight) {
      maxWeight = weights[currentMonth];
    }
  }

  return maxWeight;
}

function computeGeography(brand: BrandProfile, ctx: ScoreContext): number {
  if (!ctx.soulRegion || brand.declaredMarkets.length === 0) return 1.0;

  const soulRegionLower = ctx.soulRegion.toLowerCase();
  const hasOverlap = brand.declaredMarkets.some(
    m => soulRegionLower.includes(m.toLowerCase()) || m.toLowerCase().includes(soulRegionLower)
  );

  return hasOverlap ? 1.10 : 1.0;
}

function computeCohortAffinity(brand: BrandProfile, ctx: ScoreContext, config: BrandScoringConfig): number {
  if (!ctx.soulConsents || ctx.soulConsents.length === 0) return 1.0;

  let maxBoost = 1.0;

  for (const [, cohort] of Object.entries(config.cohorts)) {
    const allRequired = cohort.requires.every(cat => ctx.soulConsents!.includes(cat));
    const brandInCohortCategory = brand.categories.some(cat => cohort.requires.includes(cat));

    if (allRequired && brandInCohortCategory && cohort.boost > maxBoost) {
      maxBoost = cohort.boost;
    }
  }

  return maxBoost;
}

function assignBadge(
  brand: BrandProfile,
  ctx: ScoreContext,
  config: BrandScoringConfig,
  trendMultiplier: number,
  seasonalityMultiplier: number,
  geographyMultiplier: number,
): Badge | null {
  if (trendMultiplier >= config.badges.trending.threshold) {
    return 'trending';
  }

  if (seasonalityMultiplier >= config.badges.seasonalPick.threshold) {
    return 'seasonal_pick';
  }

  if (geographyMultiplier >= config.badges.popularNearby.threshold) {
    if (!config.badges.popularNearby.requiresMarketOverlap) return 'popular_nearby';
    if (ctx.soulRegion && brand.declaredMarkets.length > 0) {
      const soulRegionLower = ctx.soulRegion.toLowerCase();
      const hasOverlap = brand.declaredMarkets.some(
        m => soulRegionLower.includes(m.toLowerCase()) || m.toLowerCase().includes(soulRegionLower)
      );
      if (hasOverlap) return 'popular_nearby';
    }
  }

  if (ctx.soulId) {
    const windowStart = Date.now() - config.badges.repeatFavorite.windowDays * 86400000;
    const repeatClaims = ctx.settlements.filter(
      s => s.brandId === brand.brandId &&
        s.soulId === ctx.soulId &&
        new Date(s.claimedAt).getTime() >= windowStart
    ).length;
    if (repeatClaims >= config.badges.repeatFavorite.claimsRequired) {
      return 'repeat_favorite';
    }
  }

  return null;
}
