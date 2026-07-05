export interface BrandScoringConfig {
  weights: {
    claimRate: number;
    bidFairness: number;
    escrowHealth: number;
  };
  coldStart: {
    baseScore: number;
    graduationThreshold: number;
  };
  trend: {
    minBaselineSettlements: number;
    minCurrentSettlements: number;
    baselineDays: number;
    currentDays: number;
    multiplierMin: number;
    multiplierMax: number;
    floor: number;
  };
  escrowHealth: {
    absoluteFloor: number;
    tiers: { minDays: number; score: number }[];
  };
  seasonality: Record<string, number[]>;
  cohorts: Record<string, CohortDefinition>;
  badges: {
    trending: { threshold: number };
    seasonalPick: { threshold: number };
    popularNearby: { threshold: number; requiresMarketOverlap: boolean };
    repeatFavorite: { claimsRequired: number; windowDays: number };
  };
}

export interface CohortDefinition {
  requires: string[];
  boost: number;
}

export interface BrandProfile {
  brandId: string;
  brandName: string;
  categories: string[];
  declaredMarkets: string[];
}

export interface BrandScoreResult {
  brandId: string;
  baseScore: number;
  trendMultiplier: number;
  contextualScore: number;
  badge: Badge | null;
  isNewBrand: boolean;
  components: {
    claimRate: number;
    bidFairness: number;
    escrowHealth: number;
    seasonality: number;
    geography: number;
    cohortAffinity: number;
  };
}

export type Badge = 'trending' | 'seasonal_pick' | 'popular_nearby' | 'repeat_favorite';

export const BADGE_DISPLAY: Record<Badge, string> = {
  trending: 'Trending',
  seasonal_pick: 'Seasonal Pick',
  popular_nearby: 'Popular Nearby',
  repeat_favorite: 'Repeat Favorite',
};

export interface SettlementRecord {
  brandId: string;
  soulId: string;
  category: string;
  bidUsdc: number;
  claimedAt: string;
}

export interface OfferRecord {
  brandId: string;
  soulId: string;
  category: string;
  status: 'pending' | 'claimed' | 'expired';
  createdAt: string;
}

export interface ListingRecord {
  brandId: string;
  category: string;
  bidPerClaim: number;
  escrowRemaining: number;
  escrowFunded: number;
  status: string;
}
