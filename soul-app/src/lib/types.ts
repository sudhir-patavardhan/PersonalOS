export interface SoulUser {
  id: string;
  email: string;
  soulId: string;
  createdAt: string;
  totpConfigured: boolean;
}

export interface SoulProfile {
  id: string;
  displayName: string;
  email: string;
  region: string;
  avatarInitials: string;
  depthScore: number;
  phase: 1 | 2;
  walletAddress: string;
  joinedAt: string;
}

export interface Konnection {
  id: string;
  source: string;
  displayName: string;
  icon: string;
  tier: 1 | 2 | 3;
  connected: boolean;
  connectedAt: string | null;
  lastSync: string | null;
  historyMonths: number;
  depthContribution: number;
  maxContribution: number;
  dataTypes: string[];
}

export interface Insight {
  id: string;
  category: string;
  categoryDisplay: string;
  text: string;
  confidence: number;
  timestamp: string;
  icon: string;
  sourcePrompt: string | null;
}

export interface SoulConsent {
  id: string;
  category: string;
  categoryDisplay: string;
  yieldFloorUsdc: number;
  grantedAt: string;
  offersReceived: number;
  totalEarned: number;
  active: boolean;
  demandSignal: 'High' | 'Moderate' | 'Low';
  bidRange: { min: number; max: number } | null;
}

export interface AvailableCategory {
  category: string;
  categoryDisplay: string;
  estimatedEarning: string;
  demandSignal: 'High' | 'Moderate' | 'Low';
  requiresSource: string | null;
}

export interface Offer {
  id: string;
  brandName: string;
  brandReputation: number;
  category: string;
  categoryDisplay: string;
  headline: string;
  body: string;
  ctaUrl: string;
  ctaLabel: string;
  bidUsdc: number;
  earnUsdc: number;
  matchScore: number;
  expiresAt: string;
  status: 'pending' | 'claimed' | 'dismissed' | 'expired';
  claimedAt: string | null;
  dismissedAt: string | null;
  soulFraming: string;
  brandBadge?: string | null;
  brandScore?: number;
}

export interface WalletTransaction {
  id: string;
  type: 'claim' | 'withdrawal';
  brandName: string | null;
  category: string | null;
  amountUsdc: number;
  txHash: string;
  timestamp: string;
}

export interface SharingLogEntry {
  id: string;
  brandName: string;
  category: string;
  categoryDisplay: string;
  actualScore: number;
  noisyScore: number;
  sharedAt: string;
  status: 'active' | 'expired' | 'revoked';
}

export interface DailyEarning {
  date: string;
  amount: number;
}

export const FEE_RATE = 0.15;

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

export const TRADEABLE_CATEGORIES = Object.keys(CATEGORY_DISPLAY_NAMES).filter(c => c !== 'health.medical');
