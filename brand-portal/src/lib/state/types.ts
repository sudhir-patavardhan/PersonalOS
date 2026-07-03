export interface NewListing {
  brandId: string;
  brandName: string;
  category: string;
  bidPerClaim: number;
  escrowFunded: number;
  minScoreThreshold: number;
  headline: string;
  body: string;
  ctaUrl?: string;
  ctaLabel?: string;
}

export interface Listing extends NewListing {
  id: string;
  escrowRemaining: number;
  status: 'active' | 'exhausted' | 'paused';
  createdAt: string;
}

export interface Offer {
  id: string;
  listingId: string;
  soulId: string;
  brandId: string;
  brandName: string;
  category: string;
  bidPerClaim: number;
  compositeScore: number;
  matchedCategories: string[];
  status: 'pending' | 'claimed' | 'expired';
  exchangeRunId: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  offerId: string;
  listingId: string;
  soulId: string;
  brandId: string;
  category: string;
  bidUsdc: number;
  yieldUsdc: number;
  feeUsdc: number;
  txHash: string;
  claimedAt: string;
}

export interface ExchangeRun {
  id: string;
  matchCount: number;
  categoriesCovered: number;
  offersCreated: number;
  ranAt: string;
}

export interface CategoryHeat {
  offerCount: number;
  claimCount: number;
  claimRate: number;
  avgBid: number;
  totalVolume: number;
}

export interface Metrics {
  categoryHeat: Record<string, CategoryHeat>;
  topCategories: string[];
  totalExchangeRuns: number;
  totalVolume: number;
  lastActivity: string | null;
}

export interface ExchangeState {
  listings: Listing[];
  offers: Offer[];
  settlements: Settlement[];
  exchangeRuns: ExchangeRun[];
}
