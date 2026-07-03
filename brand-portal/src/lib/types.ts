export interface BrandUser {
  id: string;
  email: string;
  brandId: string;
  role: 'admin' | 'campaign_manager' | 'viewer';
  createdAt: string;
  totpConfigured: boolean;
}

export interface BrandProfile {
  id: string;
  name: string;
  vertical: string;
  status: 'pending' | 'active' | 'suspended';
  verifiedAt: string;
}

export interface Listing {
  id: string;
  brandId: string;
  brandName: string;
  category: string;
  bidPerClaimUsdc: number;
  minScoreThreshold: number;
  escrowFundedUsdc: number;
  escrowRemainingUsdc: number;
  status: 'draft' | 'pending_review' | 'active' | 'paused' | 'exhausted' | 'expired';
  createdAt: string;
  headline?: string;
  body?: string;
  ctaUrl?: string;
  ctaLabel?: string;
  dailyCapUsdc?: number;
  dailySpentUsdc?: number;
}

export interface BrandSettlement {
  id: string;
  listingId: string;
  category: string;
  yieldUsdc: number;
  feeUsdc: number;
  bidUsdc: number;
  txHash: string;
  settledAt: string;
}

export interface EscrowTransaction {
  id: string;
  listingId: string;
  type: 'deposit' | 'claim_deduction' | 'refund' | 'reallocation_in' | 'reallocation_out';
  amountUsdc: number;
  txHash: string;
  timestamp: string;
}

export interface CategorySupply {
  category: string;
  displayName: string;
  isAvailable: boolean;
  consentingSouls: number;
  scoreDistribution: { band: string; percentage: number }[];
  medianYieldFloor: number | null;
  competitorCount: number | null;
  suggestedBidRange: { floor: number; competitive: number } | null;
  claimVelocity: number;
}

export interface BrandKPI {
  label: string;
  value: string;
  trend: number;
  href: string;
}

export interface Alert {
  id: string;
  type: 'low_escrow' | 'depleted' | 'paused' | 'review_status';
  message: string;
  listingId: string;
  severity: 'warning' | 'critical';
}

export interface ReputationTrend {
  date: string;
  score: number;
}

export const TRADEABLE_CATEGORIES = [
  'finance.health', 'dining.grocery', 'dining.restaurant',
  'transport.commute', 'shopping.research', 'shopping.impulse',
  'health.fitness', 'entertainment.streaming', 'travel.pattern',
  'education.growth', 'subscription.management',
] as const;

export const ALL_CATEGORIES = [
  ...TRADEABLE_CATEGORIES,
  'health.medical',
] as const;

export const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  'finance.health': 'Financial Health',
  'dining.grocery': 'Grocery Patterns',
  'dining.restaurant': 'Dining Out',
  'transport.commute': 'Commute & Transport',
  'shopping.research': 'Smart Shopping',
  'shopping.impulse': 'Impulse Spending',
  'health.fitness': 'Fitness & Wellness',
  'health.medical': 'Health (Private)',
  'entertainment.streaming': 'Entertainment',
  'travel.pattern': 'Travel Patterns',
  'education.growth': 'Learning & Growth',
  'subscription.management': 'Subscriptions',
};

export const FEE_RATE = 0.15;
