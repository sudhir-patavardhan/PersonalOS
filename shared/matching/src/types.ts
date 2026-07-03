export interface CategoryNode {
  id: string;
  parent: string | null;
  displayName: string;
  description: string;
  synonyms: string[];
  depth: number;
  tradeable: boolean;
}

export interface TargetingInput {
  categories?: string[];
  descriptor?: string;
}

export interface ResolverResult {
  resolvedCategories: string[];
  matchedTerms: { term: string; category: string; score: number }[];
  unmatchedTerms: string[];
  suggestedTerms: string[];
}

export interface SoulProfile {
  id: string;
  displayName: string;
  consents: ConsentEntry[];
  noisyScores: Record<string, number>;
  reputation: number;
  lastActivity: Record<string, number>;
}

export interface ConsentEntry {
  category: string;
  yieldFloor: number;
  active: boolean;
  grantedAt: number;
}

export interface ListingProfile {
  id: string;
  brandId: string;
  brandName: string;
  targeting: TargetingInput;
  bidPerClaim: number;
  minScoreThreshold: number;
  escrowRemaining: number;
  status: 'active' | 'paused' | 'depleted';
  headline: string;
  body: string;
}

export interface MatchResult {
  soulId: string;
  listingId: string;
  brandName: string;
  matchedCategories: string[];
  consentFloor: number;
  insightScore: number;
  compositeScore: number;
  eligible: boolean;
}

export interface ExchangeRun {
  timestamp: number;
  matches: MatchResult[];
  totalSouls: number;
  totalListings: number;
  matchRate: number;
}

export interface ReachEstimate {
  eligibleSouls: number;
  totalSouls: number;
  matchRate: number;
  categoryBreakdown: { category: string; displayName: string; souls: number }[];
}

export interface MatchMetrics {
  overallMatchRate: number;
  categoryCoverage: { category: string; displayName: string; hasListings: boolean; hasConsents: boolean; matchCount: number }[];
  yieldGaps: { category: string; displayName: string; avgBid: number; avgFloor: number; gap: number }[];
  topMatches: MatchResult[];
}
