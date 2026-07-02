export interface Soul {
  id: string;
  walletAddress: string;
  walletDisplay: string;
  depthScore: number;
  noisyScores: Record<string, number>;
  consents: Consent[];
  connectedAt: string;
  phase: 'one' | 'two';
}

export interface Consent {
  category: string;
  yieldFloorUsdc: number;
  grantedAt: string;
  revokedAt: string | null;
}

export interface Brand {
  id: string;
  name: string;
  vertical: string;
  status: 'pending' | 'active' | 'suspended';
  verifiedAt: string;
  listings: Listing[];
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
  status: 'active' | 'paused' | 'depleted';
  createdAt: string;
}

export interface Settlement {
  id: string;
  listingId: string;
  brandName: string;
  category: string;
  soulWallet: string;
  soulWalletDisplay: string;
  yieldUsdc: number;
  feeUsdc: number;
  bidUsdc: number;
  txHash: string;
  settledAt: string;
}

export interface CategoryMetrics {
  category: string;
  displayName: string;
  isPrivate: boolean;
  supply: { consentingSouls: number; avgNoisyScore: number | null };
  demand: { activeListings: number; totalEscrow: number; avgBid: number | null; avgThreshold: number | null };
  pricing: { medianYieldFloor: number | null; bidFloorSpread: number | null };
  velocity: { claimsPerDay: number; matchRate: number };
}

export interface DashboardKPI {
  label: string;
  value: string;
  trend: number;
  health: 'green' | 'amber' | 'red';
  href: string;
}

export interface AuditEntry {
  id: string;
  operatorEmail: string;
  action: string;
  target: string | null;
  timestamp: string;
}

export interface Operator {
  id: string;
  email: string;
  role: 'admin' | 'viewer';
  createdAt: string;
  totpConfigured: boolean;
}

export const CATEGORIES = [
  'finance.health', 'dining.grocery', 'dining.restaurant',
  'transport.commute', 'shopping.research', 'shopping.impulse',
  'health.fitness', 'health.medical',
  'entertainment.streaming', 'travel.pattern',
  'education.growth', 'subscription.management',
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
